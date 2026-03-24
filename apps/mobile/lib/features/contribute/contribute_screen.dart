// lib/features/contribute/contribute_screen.dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../config/theme.dart';
import '../../core/api/api_client.dart';

const _types = [
  'MILEAGE_RECORD','DAMAGE_REPORT','SERVICE_RECORD','OWNERSHIP_TRANSFER',
  'LISTING_PROOF','INSPECTION_RECORD','IMPORT_DOCUMENT','PHOTO_EVIDENCE','GENERAL_NOTE',
];
const _typeLabels = {
  'MILEAGE_RECORD':'Mileage Record','DAMAGE_REPORT':'Damage Report',
  'SERVICE_RECORD':'Service Record','OWNERSHIP_TRANSFER':'Ownership Transfer',
  'LISTING_PROOF':'Listing Proof','INSPECTION_RECORD':'Inspection Record',
  'IMPORT_DOCUMENT':'Import Document','PHOTO_EVIDENCE':'Photo Evidence',
  'GENERAL_NOTE':'General Note',
};

class ContributeScreen extends StatefulWidget {
  final String? vin;
  const ContributeScreen({super.key, this.vin});
  @override
  State<ContributeScreen> createState() => _ContributeScreenState();
}

class _ContributeScreenState extends State<ContributeScreen> {
  final _formKey = GlobalKey<FormState>();
  final _api     = ApiClient();
  final _picker  = ImagePicker();
  final _vinCtrl   = TextEditingController();
  final _titleCtrl = TextEditingController();
  final _descCtrl  = TextEditingController();
  String _type = 'GENERAL_NOTE';
  List<File> _evidence = [];
  bool _loading = false;
  String? _error;
  bool _submitted = false;

  @override
  void initState() {
    super.initState();
    if (widget.vin != null) _vinCtrl.text = widget.vin!;
  }

  @override
  void dispose() {
    _vinCtrl.dispose(); _titleCtrl.dispose(); _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _addEvidence() async {
    if (_evidence.length >= 10) return;
    final img = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (img != null) setState(() => _evidence.add(File(img.path)));
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });
    try {
      await _api.post('/contributions', body: {
        'vin': _vinCtrl.text.trim().toUpperCase(),
        'type': _type,
        'title': _titleCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
      });
      setState(() { _submitted = true; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString().replaceFirst('Exception: ', ''); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_submitted) return Scaffold(
      backgroundColor: CuliTheme.bg,
      body: SafeArea(child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            width: 80, height: 80,
            decoration: BoxDecoration(
              color: CuliTheme.clean.withOpacity(0.12), shape: BoxShape.circle),
            child: const Icon(Icons.check_rounded, color: CuliTheme.clean, size: 40)),
          const SizedBox(height: 24),
          const Text('Contribution Submitted!', style: TextStyle(
            color: CuliTheme.textPrimary, fontSize: 24, fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          const Text('Our team will review and update the record if approved.',
            textAlign: TextAlign.center,
            style: TextStyle(color: CuliTheme.textMuted, fontSize: 14, height: 1.5)),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () => context.go('/search'),
            child: const Text('Back to Search')),
        ]),
      )),
    );

    return Scaffold(
      backgroundColor: CuliTheme.bg,
      appBar: AppBar(title: const Text('Contribute Data')),
      body: Form(
        key: _formKey,
        child: ListView(padding: const EdgeInsets.all(16), children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: CuliTheme.accent.withOpacity(0.06),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: CuliTheme.accent.withOpacity(0.2))),
            child: const Text(
              'Help build Kenya\'s largest vehicle history database. Your contributions help protect buyers.',
              style: TextStyle(color: CuliTheme.textMuted, fontSize: 13, height: 1.5)),
          ),
          const SizedBox(height: 20),
          TextFormField(
            controller: _vinCtrl,
            textCapitalization: TextCapitalization.characters,
            decoration: const InputDecoration(labelText: 'VIN *', hintText: 'JTDBR32E540012345',
              labelStyle: TextStyle(color: CuliTheme.textMuted)),
            validator: (v) => (v?.trim().length ?? 0) < 5 ? 'Enter a valid VIN' : null,
          ),
          const SizedBox(height: 14),
          Container(
            decoration: BoxDecoration(
              color: CuliTheme.surface2, borderRadius: BorderRadius.circular(12),
              border: Border.all(color: CuliTheme.border)),
            child: DropdownButtonFormField<String>(
              value: _type,
              dropdownColor: CuliTheme.surface,
              style: const TextStyle(color: CuliTheme.textPrimary),
              decoration: const InputDecoration(
                labelText: 'Type *', labelStyle: TextStyle(color: CuliTheme.textMuted),
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14)),
              items: _types.map((t) => DropdownMenuItem(value: t,
                child: Text(_typeLabels[t] ?? t,
                  style: const TextStyle(color: CuliTheme.textPrimary)))).toList(),
              onChanged: (v) => setState(() => _type = v ?? _type),
            ),
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _titleCtrl,
            decoration: const InputDecoration(
              labelText: 'Title *', hintText: 'e.g. Service record from Toyota Kenya',
              labelStyle: TextStyle(color: CuliTheme.textMuted)),
            validator: (v) => v?.trim().isEmpty == true ? 'Required' : null,
          ),
          const SizedBox(height: 14),
          TextFormField(
            controller: _descCtrl, maxLines: 4,
            decoration: const InputDecoration(
              labelText: 'Description (optional)', hintText: 'Add details…',
              labelStyle: TextStyle(color: CuliTheme.textMuted)),
          ),
          const SizedBox(height: 20),
          const Text('Evidence Photos (optional)', style: TextStyle(
            color: CuliTheme.textMuted, fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Wrap(spacing: 8, runSpacing: 8, children: [
            ..._evidence.asMap().entries.map((e) => Stack(children: [
              ClipRRect(borderRadius: BorderRadius.circular(8),
                child: Image.file(e.value, width: 72, height: 72, fit: BoxFit.cover)),
              Positioned(top: 2, right: 2,
                child: GestureDetector(
                  onTap: () => setState(() => _evidence.removeAt(e.key)),
                  child: Container(
                    width: 18, height: 18,
                    decoration: const BoxDecoration(
                      color: CuliTheme.critical, shape: BoxShape.circle),
                    child: const Icon(Icons.close, color: Colors.white, size: 12)))),
            ])),
            if (_evidence.length < 10)
              GestureDetector(
                onTap: _addEvidence,
                child: Container(
                  width: 72, height: 72,
                  decoration: BoxDecoration(
                    color: CuliTheme.surface2, borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: CuliTheme.border)),
                  child: const Icon(Icons.add_photo_alternate_outlined,
                    color: CuliTheme.textMuted, size: 24))),
          ]),
          if (_error != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: CuliTheme.critical.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: CuliTheme.critical.withOpacity(0.3))),
              child: Text(_error!, style: const TextStyle(color: CuliTheme.critical, fontSize: 13))),
          ],
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _loading ? null : _submit,
              child: _loading
                  ? const SizedBox(width: 20, height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : const Text('Submit Contribution')),
          ),
          const SizedBox(height: 32),
        ]),
      ),
    );
  }
}
