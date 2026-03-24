// lib/features/report/widgets/ntsa_fetch_widget.dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../../config/theme.dart';
import '../../../core/api/api_client.dart';

class NtsaFetchWidget extends StatefulWidget {
  final String vin;
  const NtsaFetchWidget({super.key, required this.vin});
  @override
  State<NtsaFetchWidget> createState() => _NtsaFetchWidgetState();
}

class _NtsaFetchWidgetState extends State<NtsaFetchWidget> {
  bool _showWebView = false;
  final _api = ApiClient();

  Future<void> _open() async {
    try {
      await _api.post('/ntsa/consent', body: {'vin': widget.vin});
    } catch (_) {}
    setState(() => _showWebView = true);
  }

  @override
  Widget build(BuildContext context) {
    if (_showWebView) {
      return SizedBox(
        height: 520,
        child: _NtsaWebView(
          vin: widget.vin,
          onClose: () => setState(() => _showWebView = false),
          onSuccess: () {
            setState(() => _showWebView = false);
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
              content: Text('NTSA COR fetched! Report updating…'),
              backgroundColor: CuliTheme.clean,
            ));
          },
        ),
      );
    }

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: CuliTheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: CuliTheme.border),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Row(children: [
            Icon(Icons.verified_outlined, color: CuliTheme.accent, size: 18),
            SizedBox(width: 8),
            Text('Official NTSA Record', style: TextStyle(
              color: CuliTheme.textPrimary, fontWeight: FontWeight.w700, fontSize: 15)),
          ]),
          const SizedBox(height: 8),
          const Text(
            'Get verified NTSA COR data (KSh 550 paid directly to NTSA via eCitizen). CuliCars does not store your payment details.',
            style: TextStyle(color: CuliTheme.textMuted, fontSize: 12, height: 1.5),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              icon: const Icon(Icons.open_in_browser_rounded, color: CuliTheme.accent, size: 16),
              label: const Text('Open eCitizen (KSh 550)',
                  style: TextStyle(color: CuliTheme.accent)),
              style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: CuliTheme.accent)),
              onPressed: _open,
            ),
          ),
        ]),
      ),
    );
  }
}

class _NtsaWebView extends StatefulWidget {
  final String vin;
  final VoidCallback onClose;
  final VoidCallback onSuccess;
  const _NtsaWebView({required this.vin, required this.onClose, required this.onSuccess});
  @override
  State<_NtsaWebView> createState() => _NtsaWebViewState();
}

class _NtsaWebViewState extends State<_NtsaWebView> {
  late final WebViewController _ctrl;
  bool _intercepted = false;
  final _api = ApiClient();

  @override
  void initState() {
    super.initState();
    _ctrl = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onNavigationRequest: (req) {
          if (!_intercepted &&
              (req.url.contains('.pdf') || req.url.contains('download') || req.url.contains('cor'))) {
            _intercepted = true;
            _handlePdf(req.url);
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
      ))
      ..loadRequest(Uri.parse('https://ntsa.ecitizen.go.ke/ntsa/vehicle_details'));
  }

  Future<void> _handlePdf(String url) async {
    try {
      await _api.post('/ocr/ntsa-cor', body: {'pdfUrl': url, 'vin': widget.vin});
      widget.onSuccess();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.toString()), backgroundColor: CuliTheme.critical));
      }
    }
  }

  @override
  Widget build(BuildContext context) => Column(children: [
    Container(
      color: CuliTheme.surface,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(children: [
        const Text('NTSA eCitizen', style: TextStyle(
          color: CuliTheme.textPrimary, fontWeight: FontWeight.w600)),
        const Spacer(),
        TextButton(
          onPressed: widget.onClose,
          child: const Text('Close', style: TextStyle(color: CuliTheme.textMuted))),
      ]),
    ),
    Expanded(child: WebViewWidget(controller: _ctrl)),
  ]);
}
