// lib/features/report/widgets/ntsa_fetch_widget.dart
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:dio/dio.dart';
import '../../../config/env.dart';

class NtsaFetchWidget extends StatefulWidget {
  final String vin;
  final String plate;
  final String? authToken;
  final VoidCallback onSuccess;

  const NtsaFetchWidget({
    super.key,
    required this.vin,
    required this.plate,
    required this.authToken,
    required this.onSuccess,
  });

  @override
  State<NtsaFetchWidget> createState() => _NtsaFetchWidgetState();
}

class _NtsaFetchWidgetState extends State<NtsaFetchWidget> {
  bool _webViewOpen = false;
  bool _processing = false;
  bool _done = false;
  String? _error;

  // ── Correct NTSA Service Portal URL ──────────────────────────────────────
  static const String _ntsaUrl =
      'https://serviceportal.ntsa.go.ke/services/41/apply';

  // ── PDF patterns to intercept ─────────────────────────────────────────────
  // When NTSA generates the COR, the download URL will contain one of these
  static const List<String> _pdfPatterns = [
    '.pdf',
    '/download/',
    '/certificate/',
    '/cor/',
    'generate',
    'receipt',
  ];

  late final WebViewController _controller;

  void _initWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onNavigationRequest: (request) {
          final url = request.url.toLowerCase();

          // Intercept PDF download — this is the COR
          final isPdf = _pdfPatterns.any((p) => url.contains(p));
          if (isPdf && url.contains('ntsa')) {
            _handlePdfIntercepted(request.url);
            return NavigationDecision.prevent;
          }

          return NavigationDecision.navigate;
        },
        onPageStarted: (url) {
          if (url.toLowerCase().endsWith('.pdf')) {
            _handlePdfIntercepted(url);
          }
        },
      ))
      ..loadRequest(Uri.parse(_ntsaUrl));
  }

  Future<void> _handlePdfIntercepted(String pdfUrl) async {
    if (_processing || _done) return;

    setState(() {
      _webViewOpen = false;
      _processing = true;
      _error = null;
    });

    try {
      final dio = Dio();

      // Step 1 — Log consent
      await dio.post(
        '${Env.apiUrl}/ntsa/consent',
        data: {'vin': widget.vin, 'plate': widget.plate},
        options: Options(headers: {
          if (widget.authToken != null)
            'Authorization': 'Bearer ${widget.authToken}',
        }),
      );

      // Step 2 — Send PDF URL to API for parsing
      final response = await dio.post(
        '${Env.apiUrl}/ocr/ntsa-cor',
        data: {'pdfUrl': pdfUrl, 'vin': widget.vin, 'plate': widget.plate},
        options: Options(
          headers: {
            if (widget.authToken != null)
              'Authorization': 'Bearer ${widget.authToken}',
          },
          receiveTimeout: const Duration(seconds: 30),
        ),
      );

      if (response.statusCode == 200) {
        setState(() {
          _processing = false;
          _done = true;
        });
        widget.onSuccess();
      } else {
        throw Exception('API returned ${response.statusCode}');
      }
    } catch (e) {
      setState(() {
        _processing = false;
        _error = 'Could not process NTSA record. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_webViewOpen) {
      return SizedBox(
        height: 600,
        child: Column(
          children: [
            Container(
              color: const Color(0xFF1A1A2E),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  const Icon(Icons.lock, color: Color(0xFFF5A623), size: 16),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'NTSA Service Portal — Secure',
                      style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54),
                    onPressed: () => setState(() => _webViewOpen = false),
                    iconSize: 20,
                  ),
                ],
              ),
            ),
            Expanded(child: WebViewWidget(controller: _controller)),
            Container(
              color: const Color(0xFF0D0D1A),
              padding: const EdgeInsets.all(12),
              child: const Row(
                children: [
                  Icon(Icons.info_outline, color: Color(0xFFF5A623), size: 14),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Complete payment on NTSA portal. Your COR will be captured automatically — no upload needed.',
                      style: TextStyle(color: Colors.white54, fontSize: 11),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    if (_processing) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(color: const Color(0xFF1A1A2E), borderRadius: BorderRadius.circular(12)),
        child: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(color: Color(0xFFF5A623)),
            SizedBox(height: 16),
            Text('Processing your NTSA record...', style: TextStyle(color: Colors.white, fontSize: 14)),
            SizedBox(height: 8),
            Text('This may take up to 30 seconds.', style: TextStyle(color: Colors.white54, fontSize: 12)),
          ],
        ),
      );
    }

    if (_done) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: const Color(0xFF1B2E1B),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.green.shade700),
        ),
        child: const Row(
          children: [
            Icon(Icons.verified, color: Colors.green, size: 28),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('NTSA Verified', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 15)),
                  Text('Official NTSA data has been added to this report.', style: TextStyle(color: Colors.white70, fontSize: 12)),
                ],
              ),
            ),
          ],
        ),
      );
    }

    if (_error != null) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF2E1B1B),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.red.shade700),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 13)),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _openWebView,
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF5A623)),
              child: const Text('Try Again', style: TextStyle(color: Colors.black)),
            ),
          ],
        ),
      );
    }

    // Default CTA
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF1A1A2E),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF2A2A4E)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.account_balance, color: Color(0xFFF5A623), size: 20),
              SizedBox(width: 8),
              Text('Official NTSA Record', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
            ],
          ),
          const SizedBox(height: 8),
          const Text('No official NTSA data for this vehicle yet.', style: TextStyle(color: Colors.white54, fontSize: 13)),
          const SizedBox(height: 16),
          _infoRow(Icons.check_circle_outline, 'Registration & ownership history'),
          _infoRow(Icons.check_circle_outline, 'Inspection status (passed / failed)'),
          _infoRow(Icons.check_circle_outline, 'Caveat & encumbrance check'),
          _infoRow(Icons.check_circle_outline, 'Transfer count & dates'),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: const Color(0xFF0D0D1A), borderRadius: BorderRadius.circular(8)),
            child: const Row(
              children: [
                Icon(Icons.info_outline, color: Color(0xFFF5A623), size: 16),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'KSh 550 paid directly to NTSA. CuliCars does not charge for this.',
                    style: TextStyle(color: Colors.white54, fontSize: 11),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _openWebView,
              icon: const Icon(Icons.open_in_browser, color: Colors.black),
              label: const Text(
                'Get Official NTSA Record  (KSh 550 to NTSA)',
                style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 13),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFF5A623),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ),
          const SizedBox(height: 10),
          const Center(
            child: Text(
              'Your record is captured automatically — no upload needed.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white38, fontSize: 11),
            ),
          ),
        ],
      ),
    );
  }

  void _openWebView() {
    _initWebView();
    setState(() {
      _webViewOpen = true;
      _error = null;
    });
  }

  Widget _infoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(icon, color: Colors.green, size: 15),
          const SizedBox(width: 8),
          Text(text, style: const TextStyle(color: Colors.white70, fontSize: 13)),
        ],
      ),
    );
  }
}