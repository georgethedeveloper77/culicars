// lib/features/search/ocr_capture_screen.dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import '../../config/theme.dart';
import '../../config/env.dart';
import '../../core/auth/auth_service.dart';

class OcrCaptureScreen extends StatefulWidget {
  const OcrCaptureScreen({super.key});
  @override
  State<OcrCaptureScreen> createState() => _OcrCaptureScreenState();
}

class _OcrCaptureScreenState extends State<OcrCaptureScreen> {
  final _picker = ImagePicker();
  bool _loading = false;
  String? _error;
  String? _plate;
  String? _vin;

  Future<void> _capture(ImageSource source) async {
    final img = await _picker.pickImage(
        source: source, imageQuality: 85, maxWidth: 1600);
    if (img == null) return;
    setState(() { _loading = true; _error = null; _plate = null; _vin = null; });
    try {
      final session = AuthService().currentSession;
      final dio = Dio(BaseOptions(baseUrl: Env.apiUrl));
      if (session != null) {
        dio.options.headers['Authorization'] = 'Bearer ${session.accessToken}';
      }
      final form = FormData.fromMap({
        'image': await MultipartFile.fromFile(img.path, filename: 'scan.jpg'),
        'documentType': 'plate_photo',
      });
      final res = await dio.post('/ocr/scan', data: form);
      final data = res.data['data'] ?? res.data;
      setState(() {
        _plate = data['extractedPlate'] as String?;
        _vin   = data['extractedVin'] as String?;
      });
    } catch (e) {
      setState(() => _error = 'OCR failed. Try again or type manually.');
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: CuliTheme.bg,
    appBar: AppBar(title: const Text('Scan Document')),
    body: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text(
          'Take a photo of the number plate, logbook, or dashboard to auto-extract plate / VIN.',
          style: TextStyle(color: CuliTheme.textMuted, fontSize: 14, height: 1.5),
        ),
        const SizedBox(height: 32),
        Row(children: [
          Expanded(child: _SourceBtn(
            icon: Icons.camera_alt_rounded, label: 'Camera',
            onTap: () => _capture(ImageSource.camera),
          )),
          const SizedBox(width: 16),
          Expanded(child: _SourceBtn(
            icon: Icons.photo_library_outlined, label: 'Gallery',
            onTap: () => _capture(ImageSource.gallery),
          )),
        ]),
        const SizedBox(height: 32),
        if (_loading)
          const Center(child: Column(children: [
            CircularProgressIndicator(color: CuliTheme.accent),
            SizedBox(height: 16),
            Text('Extracting plate / VIN…', style: TextStyle(color: CuliTheme.textMuted)),
          ])),
        if (_error != null)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: CuliTheme.critical.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: CuliTheme.critical.withOpacity(0.3)),
            ),
            child: Text(_error!, style: const TextStyle(color: CuliTheme.critical)),
          ),
        if (_plate != null)
          _ResultTile(label: 'Extracted Plate', value: _plate!,
            onUse: () => context.pop(_plate)),
        if (_vin != null)
          _ResultTile(label: 'Extracted VIN', value: _vin!,
            onUse: () => context.pop(_vin)),
      ]),
    ),
  );
}

class _SourceBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _SourceBtn({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 24),
      decoration: BoxDecoration(
        color: CuliTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: CuliTheme.border),
      ),
      child: Column(children: [
        Icon(icon, color: CuliTheme.accent, size: 32),
        const SizedBox(height: 10),
        Text(label, style: const TextStyle(color: CuliTheme.textPrimary, fontWeight: FontWeight.w600)),
      ]),
    ),
  );
}

class _ResultTile extends StatelessWidget {
  final String label;
  final String value;
  final VoidCallback onUse;
  const _ResultTile({required this.label, required this.value, required this.onUse});

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(top: 16),
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: CuliTheme.accent.withOpacity(0.05),
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: CuliTheme.accent.withOpacity(0.3)),
    ),
    child: Row(children: [
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(color: CuliTheme.textMuted, fontSize: 12)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(
          color: CuliTheme.textPrimary, fontSize: 18,
          fontWeight: FontWeight.w700, fontFamily: 'monospace',
        )),
      ])),
      ElevatedButton(
        onPressed: onUse,
        style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10)),
        child: const Text('Use'),
      ),
    ]),
  );
}
