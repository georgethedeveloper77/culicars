// apps/mobile/lib/features/watch/submit_alert_sheet.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';

class SubmitAlertSheet extends ConsumerStatefulWidget {
  const SubmitAlertSheet({super.key});

  @override
  ConsumerState<SubmitAlertSheet> createState() => _SubmitAlertSheetState();
}

class _SubmitAlertSheetState extends ConsumerState<SubmitAlertSheet> {
  static const _vehicleTypes = [
    (value: 'stolen_vehicle', label: 'Stolen vehicle', emoji: '🚨'),
    (value: 'recovered_vehicle', label: 'Vehicle recovered', emoji: '✅'),
    (value: 'damage', label: 'Vehicle damage', emoji: '💥'),
  ];

  static const _areaTypes = [
    (value: 'vandalism', label: 'Vandalism', emoji: '⚠️'),
    (value: 'parts_theft', label: 'Parts theft', emoji: '🔧'),
    (value: 'suspicious_activity', label: 'Suspicious activity', emoji: '👁️'),
    (value: 'hijack', label: 'Hijack hotspot', emoji: '🔴'),
  ];

  String _type = 'stolen_vehicle';
  bool _isVehicleAlert = true;
  final _plateCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  bool _submitting = false;
  String? _error;
  bool _submitted = false;

  @override
  void dispose() {
    _plateCtrl.dispose();
    _locationCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final desc = _descCtrl.text.trim();
    final plate = _plateCtrl.text.trim().toUpperCase();
    final location = _locationCtrl.text.trim();

    if (_isVehicleAlert && plate.isEmpty) {
      setState(() => _error = 'Please enter the vehicle plate.');
      return;
    }
    if (!_isVehicleAlert && location.isEmpty) {
      setState(() => _error = 'Please enter the area name.');
      return;
    }
    if (desc.length < 10) {
      setState(() => _error = 'Description must be at least 10 characters.');
      return;
    }

    setState(() { _submitting = true; _error = null; });

    try {
      await ref.read(apiClientProvider).post('/watch/alerts', body: {
        'type': _type,
        if (_isVehicleAlert && plate.isNotEmpty) 'plate': plate,
        if (!_isVehicleAlert && location.isNotEmpty) 'locationName': location,
        'description': desc,
      });
      setState(() => _submitted = true);
    } catch (e) {
      setState(() {
        _error = 'Submission failed. Please try again.';
        _submitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      maxChildSize: 0.95,
      minChildSize: 0.5,
      builder: (ctx, ctrl) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 10),
            Container(width: 36, height: 4,
              decoration: BoxDecoration(
                color: const Color(0xFFE5E7EB),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: _submitted ? _buildSuccess() : _buildForm(ctrl),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccess() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const Text('🙏', style: TextStyle(fontSize: 48)),
        const SizedBox(height: 16),
        const Text('Alert submitted', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
        const SizedBox(height: 8),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 40),
          child: Text(
            'Your report is under review. Approved alerts appear in the community feed.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: Color(0xFF6B7280), height: 1.5),
          ),
        ),
        const SizedBox(height: 24),
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Close'),
        ),
      ],
    );
  }

  Widget _buildForm(ScrollController ctrl) {
    return ListView(
      controller: ctrl,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      children: [
        const Text('Report an alert', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF111827))),
        const SizedBox(height: 4),
        const Text('All reports are reviewed before appearing publicly.',
            style: TextStyle(fontSize: 12, color: Color(0xFF9CA3AF))),
        const SizedBox(height: 20),

        // Category toggle
        Row(
          children: [
            Expanded(child: _categoryBtn('Vehicle', true)),
            const SizedBox(width: 8),
            Expanded(child: _categoryBtn('Area', false)),
          ],
        ),
        const SizedBox(height: 16),

        // Type options
        const Text('Alert type', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151))),
        const SizedBox(height: 8),
        ...(_isVehicleAlert ? _vehicleTypes : _areaTypes).map((t) => Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: GestureDetector(
            onTap: () => setState(() => _type = t.value),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 120),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: _type == t.value ? const Color(0xFF111827) : const Color(0xFFF9FAFB),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: _type == t.value ? const Color(0xFF111827) : const Color(0xFFE5E7EB),
                ),
              ),
              child: Row(
                children: [
                  Text(t.emoji, style: const TextStyle(fontSize: 18)),
                  const SizedBox(width: 10),
                  Text(t.label,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: _type == t.value ? Colors.white : const Color(0xFF374151),
                      )),
                ],
              ),
            ),
          ),
        )),

        const SizedBox(height: 8),

        // Plate / location
        if (_isVehicleAlert) ...[
          _label('Number plate'),
          const SizedBox(height: 6),
          TextField(
            controller: _plateCtrl,
            textCapitalization: TextCapitalization.characters,
            style: const TextStyle(fontFamily: 'monospace', fontWeight: FontWeight.w700),
            decoration: _inputDeco('KCA 123A'),
          ),
        ] else ...[
          _label('Area / Location'),
          const SizedBox(height: 6),
          TextField(
            controller: _locationCtrl,
            decoration: _inputDeco('e.g. Westlands, Waiyaki Way'),
          ),
        ],

        const SizedBox(height: 14),
        _label('Description'),
        const SizedBox(height: 6),
        TextField(
          controller: _descCtrl,
          maxLines: 4,
          maxLength: 1000,
          decoration: _inputDeco('What happened? When? What did you observe?'),
        ),

        if (_error != null) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFFECACA)),
            ),
            child: Text(_error!, style: const TextStyle(fontSize: 12, color: Color(0xFFDC2626))),
          ),
        ],

        const SizedBox(height: 16),
        SizedBox(
          height: 50,
          child: ElevatedButton(
            onPressed: _submitting ? null : _submit,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF111827),
              foregroundColor: Colors.white,
              disabledBackgroundColor: const Color(0xFF6B7280),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              elevation: 0,
            ),
            child: _submitting
                ? const SizedBox(width: 20, height: 20,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('Submit alert', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'False reports may result in account suspension.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _categoryBtn(String label, bool isVehicle) {
    final selected = _isVehicleAlert == isVehicle;
    return GestureDetector(
      onTap: () {
        setState(() {
          _isVehicleAlert = isVehicle;
          _type = isVehicle ? 'stolen_vehicle' : 'suspicious_activity';
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 120),
        padding: const EdgeInsets.symmetric(vertical: 10),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF111827) : const Color(0xFFF3F4F6),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: selected ? Colors.white : const Color(0xFF6B7280),
          ),
        ),
      ),
    );
  }

  Widget _label(String text) => Text(
    text,
    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF374151)),
  );

  InputDecoration _inputDeco(String hint) => InputDecoration(
    hintText: hint,
    hintStyle: const TextStyle(color: Color(0xFFD1D5DB), fontSize: 14),
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFFE5E7EB)),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: const BorderSide(color: Color(0xFF111827), width: 1.5),
    ),
    filled: true,
    fillColor: const Color(0xFFFAFAFA),
  );
}
