// lib/features/report_stolen/report_stolen_screen.dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../config/theme.dart';
import 'providers/stolen_provider.dart';

const _counties = [
  'Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu','Garissa',
  'Homa Bay','Isiolo','Kajiado','Kakamega','Kericho','Kiambu','Kilifi',
  'Kirinyaga','Kisii','Kisumu','Kitui','Kwale','Laikipia','Lamu','Machakos',
  'Makueni','Mandera','Marsabit','Meru','Migori','Mombasa','Murang\'a',
  'Nairobi','Nakuru','Nandi','Narok','Nyamira','Nyandarua','Nyeri','Samburu',
  'Siaya','Taita-Taveta','Tana River','Tharaka-Nithi','Trans Nzoia','Turkana',
  'Uasin Gishu','Vihiga','Wajir','West Pokot',
];

class ReportStolenScreen extends ConsumerStatefulWidget {
  final String? plate;
  const ReportStolenScreen({super.key, this.plate});
  @override
  ConsumerState<ReportStolenScreen> createState() => _ReportStolenScreenState();
}

class _ReportStolenScreenState extends ConsumerState<ReportStolenScreen> {
  final _formKey = GlobalKey<FormState>();
  final _picker  = ImagePicker();

  final _plateCtrl   = TextEditingController();
  final _vinCtrl     = TextEditingController();
  final _townCtrl    = TextEditingController();
  final _obCtrl      = TextEditingController();
  final _stationCtrl = TextEditingController();
  final _colorCtrl   = TextEditingController();
  final _marksCtrl   = TextEditingController();
  final _phoneCtrl   = TextEditingController();
  final _emailCtrl   = TextEditingController();

  String _reporterType = 'owner';
  String? _county = 'Nairobi';
  DateTime _dateStolen = DateTime.now();
  List<File> _photos = [];
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.plate != null) _plateCtrl.text = widget.plate!;
  }

  @override
  void dispose() {
    _plateCtrl.dispose(); _vinCtrl.dispose(); _townCtrl.dispose();
    _obCtrl.dispose(); _stationCtrl.dispose(); _colorCtrl.dispose();
    _marksCtrl.dispose(); _phoneCtrl.dispose(); _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final d = await showDatePicker(
      context: context,
      initialDate: _dateStolen,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.dark(primary: CuliTheme.accent)),
        child: child!),
    );
    if (d != null) setState(() => _dateStolen = d);
  }

  Future<void> _addPhoto() async {
    if (_photos.length >= 5) return;
    final img = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (img != null) setState(() => _photos.add(File(img.path)));
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });
    try {
      final ds = '${_dateStolen.year}-${_dateStolen.month.toString().padLeft(2,'0')}-${_dateStolen.day.toString().padLeft(2,'0')}';
      final payload = {
        'plate': _plateCtrl.text.trim().toUpperCase().replaceAll(' ', ''),
        if (_vinCtrl.text.isNotEmpty) 'vin': _vinCtrl.text.trim().toUpperCase(),
        'reporterType': _reporterType,
        'dateStolenString': ds,
        'countyStolen': _county,
        'townStolen': _townCtrl.text.trim(),
        if (_obCtrl.text.isNotEmpty) 'policeObNumber': _obCtrl.text.trim(),
        if (_stationCtrl.text.isNotEmpty) 'policeStation': _stationCtrl.text.trim(),
        'carColor': _colorCtrl.text.trim(),
        if (_marksCtrl.text.isNotEmpty) 'identifyingMarks': _marksCtrl.text.trim(),
        if (_phoneCtrl.text.isNotEmpty) 'contactPhone': _phoneCtrl.text.trim(),
        if (_emailCtrl.text.isNotEmpty) 'contactEmail': _emailCtrl.text.trim(),
      };
      await submitStolenReport(payload);
      if (mounted) context.pushReplacement('/report-stolen/success?plate=${_plateCtrl.text.trim()}');
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: CuliTheme.bg,
    appBar: AppBar(title: const Text('Report Stolen Vehicle')),
    body: Form(
      key: _formKey,
      child: ListView(padding: const EdgeInsets.all(16), children: [
        // Warning banner
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: CuliTheme.stolenRed.withOpacity(0.08),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: CuliTheme.stolenRed.withOpacity(0.3))),
          child: const Row(children: [
            Icon(Icons.warning_rounded, color: CuliTheme.stolenRed, size: 18),
            SizedBox(width: 10),
            Expanded(child: Text(
              'Reports are reviewed before going live. Adding an OB number speeds up verification.',
              style: TextStyle(color: CuliTheme.textMuted, fontSize: 12, height: 1.4))),
          ]),
        ),
        const SizedBox(height: 24),

        _label('VEHICLE DETAILS'),
        _field(_plateCtrl, 'Plate Number *', caps: TextCapitalization.characters,
          validator: (v) => v?.trim().isEmpty == true ? 'Required' : null),
        _field(_vinCtrl, 'VIN (optional)', caps: TextCapitalization.characters),
        _field(_colorCtrl, 'Vehicle Color *',
          validator: (v) => v?.trim().isEmpty == true ? 'Required' : null),
        _field(_marksCtrl, 'Identifying Marks (optional)', maxLines: 2),

        _label('THEFT DETAILS'),

        // Date picker
        GestureDetector(
          onTap: _pickDate,
          child: Container(
            margin: const EdgeInsets.only(bottom: 14),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: CuliTheme.surface2, borderRadius: BorderRadius.circular(12),
              border: Border.all(color: CuliTheme.border)),
            child: Row(children: [
              const Icon(Icons.calendar_today_outlined, color: CuliTheme.textMuted, size: 18),
              const SizedBox(width: 12),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Date Stolen *', style: TextStyle(color: CuliTheme.textMuted, fontSize: 12)),
                Text(
                  '${_dateStolen.day}/${_dateStolen.month}/${_dateStolen.year}',
                  style: const TextStyle(color: CuliTheme.textPrimary, fontSize: 15, fontWeight: FontWeight.w600)),
              ])),
              const Icon(Icons.chevron_right, color: CuliTheme.textMuted),
            ]),
          ),
        ),

        // County dropdown
        Container(
          margin: const EdgeInsets.only(bottom: 14),
          decoration: BoxDecoration(
            color: CuliTheme.surface2, borderRadius: BorderRadius.circular(12),
            border: Border.all(color: CuliTheme.border)),
          child: DropdownButtonFormField<String>(
            value: _county,
            dropdownColor: CuliTheme.surface,
            style: const TextStyle(color: CuliTheme.textPrimary),
            decoration: const InputDecoration(
              labelText: 'County *', labelStyle: TextStyle(color: CuliTheme.textMuted),
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14)),
            items: _counties.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
            onChanged: (v) => setState(() => _county = v),
            validator: (v) => v == null ? 'Required' : null,
          ),
        ),

        _field(_townCtrl, 'Town / Area *',
          validator: (v) => v?.trim().isEmpty == true ? 'Required' : null),

        _label('POLICE DETAILS'),
        _field(_obCtrl, 'OB Number (optional)', hint: 'OB/001/2024'),
        _field(_stationCtrl, 'Police Station (optional)'),

        _label('REPORTER INFO'),

        // Reporter type
        Container(
          margin: const EdgeInsets.only(bottom: 14),
          decoration: BoxDecoration(
            color: CuliTheme.surface2, borderRadius: BorderRadius.circular(12),
            border: Border.all(color: CuliTheme.border)),
          child: DropdownButtonFormField<String>(
            value: _reporterType,
            dropdownColor: CuliTheme.surface,
            style: const TextStyle(color: CuliTheme.textPrimary),
            decoration: const InputDecoration(
              labelText: 'I am the vehicle\'s *',
              labelStyle: TextStyle(color: CuliTheme.textMuted),
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14)),
            items: ['owner','family','witness','police'].map((t) => DropdownMenuItem(
              value: t,
              child: Text(t[0].toUpperCase() + t.substring(1)))).toList(),
            onChanged: (v) => setState(() => _reporterType = v ?? 'owner'),
          ),
        ),

        _field(_phoneCtrl, 'Contact Phone (optional)', keyboard: TextInputType.phone),
        _field(_emailCtrl, 'Contact Email (optional)', keyboard: TextInputType.emailAddress),

        _label('PHOTOS (optional, max 5)'),

        // Photo grid
        Wrap(spacing: 8, runSpacing: 8, children: [
          ..._photos.asMap().entries.map((e) => Stack(children: [
            ClipRRect(borderRadius: BorderRadius.circular(8),
              child: Image.file(e.value, width: 72, height: 72, fit: BoxFit.cover)),
            Positioned(top: 2, right: 2,
              child: GestureDetector(
                onTap: () => setState(() => _photos.removeAt(e.key)),
                child: Container(
                  width: 18, height: 18,
                  decoration: const BoxDecoration(color: CuliTheme.critical, shape: BoxShape.circle),
                  child: const Icon(Icons.close, color: Colors.white, size: 12)))),
          ])),
          if (_photos.length < 5)
            GestureDetector(
              onTap: _addPhoto,
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
            style: ElevatedButton.styleFrom(
              backgroundColor: CuliTheme.stolenRed,
              padding: const EdgeInsets.symmetric(vertical: 16)),
            child: _loading
                ? const SizedBox(width: 22, height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Submit Stolen Report',
                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 16)),
          ),
        ),
        const SizedBox(height: 32),
      ]),
    ),
  );

  Widget _label(String t) => Padding(
    padding: const EdgeInsets.only(bottom: 12),
    child: Text(t, style: const TextStyle(
      color: CuliTheme.textMuted, fontSize: 11,
      fontWeight: FontWeight.w700, letterSpacing: 0.8)));

  Widget _field(TextEditingController ctrl, String label, {
    String? hint, String? Function(String?)? validator,
    TextCapitalization caps = TextCapitalization.sentences,
    TextInputType keyboard = TextInputType.text, int maxLines = 1,
  }) => Padding(
    padding: const EdgeInsets.only(bottom: 14),
    child: TextFormField(
      controller: ctrl,
      textCapitalization: caps,
      keyboardType: keyboard,
      maxLines: maxLines,
      validator: validator,
      style: const TextStyle(color: CuliTheme.textPrimary),
      decoration: InputDecoration(
        labelText: label, hintText: hint,
        labelStyle: const TextStyle(color: CuliTheme.textMuted),
        hintStyle: const TextStyle(color: CuliTheme.textMuted, fontSize: 13)),
    ),
  );
}
