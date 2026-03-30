// apps/mobile/lib/features/report/widgets/owner_verification_widget.dart

import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

/// Shown on a report when ownership confidence is low or not yet verified.
/// Tapping opens a full-screen in-app browser for the verification flow.
/// Ownership details are NEVER shown before verification completes.
class OwnerVerificationWidget extends StatelessWidget {
  final String plate;
  final String reportId;
  final double ownershipConfidence;
  final bool isVerified;
  final VoidCallback? onVerificationComplete;

  const OwnerVerificationWidget({
    super.key,
    required this.plate,
    required this.reportId,
    this.ownershipConfidence = 0.0,
    this.isVerified = false,
    this.onVerificationComplete,
  });

  static const double _showThreshold = 0.7;

  @override
  Widget build(BuildContext context) {
    if (isVerified) return const SizedBox.shrink();
    if (ownershipConfidence >= _showThreshold) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFBEB),
        border: Border.all(color: const Color(0xFFFDE68A)),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, size: 18, color: Color(0xFFB45309)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Ownership not confirmed',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF92400E),
                  ),
                ),
                const SizedBox(height: 2),
                const Text(
                  'Verify the official record to confirm current ownership details.',
                  style: TextStyle(fontSize: 12, color: Color(0xFFB45309)),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _openVerification(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFD97706),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      textStyle: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                      elevation: 0,
                    ),
                    child: const Text('Verify owner'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _openVerification(BuildContext context) {
    Navigator.of(context).push(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => VerificationWebViewScreen(
          plate: plate,
          reportId: reportId,
          onComplete: onVerificationComplete,
        ),
      ),
    );
  }
}

/// Full-screen in-app browser for the verification flow.
/// Intercepts the /verify/done callback to close and notify parent.
class VerificationWebViewScreen extends StatefulWidget {
  final String plate;
  final String reportId;
  final VoidCallback? onComplete;

  const VerificationWebViewScreen({
    super.key,
    required this.plate,
    required this.reportId,
    this.onComplete,
  });

  @override
  State<VerificationWebViewScreen> createState() => _VerificationWebViewScreenState();
}

class _VerificationWebViewScreenState extends State<VerificationWebViewScreen> {
  late final WebViewController _controller;
  bool _loading = true;

  static const String _webBaseUrl = 'https://culicars.com';

  @override
  void initState() {
    super.initState();

    final url = Uri.parse('$_webBaseUrl/verify').replace(queryParameters: {
      'plate': widget.plate,
      'returnTo': '/report/${widget.reportId}',
      'source': 'app',
    }).toString();

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) => setState(() => _loading = false),
          onNavigationRequest: (request) {
            // Intercept the done callback URL to close the WebView
            if (request.url.contains('/verify') && request.url.contains('status=complete')) {
              widget.onComplete?.call();
              Navigator.of(context).pop();
              return NavigationDecision.prevent;
            }
            // Prevent leaving the verification flow to external sites
            if (!request.url.startsWith(_webBaseUrl)) {
              return NavigationDecision.prevent;
            }
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(url));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Verify official record',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.of(context).pop(),
        ),
        elevation: 0,
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_loading)
            const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}
