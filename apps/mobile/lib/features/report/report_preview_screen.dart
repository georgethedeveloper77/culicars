// lib/features/report/report_preview_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../core/api/api_client.dart';
import '../../shared/models/report.dart';

class ReportPreviewScreen extends StatefulWidget {
  final String vin;
  const ReportPreviewScreen({super.key, required this.vin});
  @override
  State<ReportPreviewScreen> createState() => _ReportPreviewScreenState();
}

class _ReportPreviewScreenState extends State<ReportPreviewScreen> {
  final _api = ApiClient();
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _api.get('/reports/by-vin/${widget.vin}');
      final report = Report.fromJson(data as Map<String, dynamic>);
      if (mounted) {
        context.pushReplacement('/report/${report.id}');
      }
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: CuliTheme.bg,
    appBar: AppBar(title: const Text('Loading Report')),
    body: Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: _error == null
            ? const Column(mainAxisSize: MainAxisSize.min, children: [
                CircularProgressIndicator(color: CuliTheme.accent),
                SizedBox(height: 20),
                Text('Loading report…', style: TextStyle(color: CuliTheme.textMuted)),
              ])
            : Column(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.error_outline, color: CuliTheme.critical, size: 48),
                const SizedBox(height: 16),
                Text(_error!, style: const TextStyle(color: CuliTheme.critical),
                    textAlign: TextAlign.center),
                const SizedBox(height: 24),
                ElevatedButton(onPressed: _load, child: const Text('Try Again')),
              ]),
      ),
    ),
  );
}
