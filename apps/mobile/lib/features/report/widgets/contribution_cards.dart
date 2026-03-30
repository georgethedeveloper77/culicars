// apps/mobile/lib/features/report/widgets/contribution_cards.dart

import 'package:flutter/material.dart';
import 'package:dio/dio.dart';

enum ContributionType { odometer, serviceRecord, damage, listingPhoto }

extension ContributionTypeLabel on ContributionType {
  String get label {
    switch (this) {
      case ContributionType.odometer: return 'Odometer reading';
      case ContributionType.serviceRecord: return 'Service record';
      case ContributionType.damage: return 'Damage evidence';
      case ContributionType.listingPhoto: return 'Listing / photo';
    }
  }

  String get apiValue {
    switch (this) {
      case ContributionType.odometer: return 'odometer';
      case ContributionType.serviceRecord: return 'service_record';
      case ContributionType.damage: return 'damage';
      case ContributionType.listingPhoto: return 'listing_photo';
    }
  }

  IconData get icon {
    switch (this) {
      case ContributionType.odometer: return Icons.speed;
      case ContributionType.serviceRecord: return Icons.build_circle_outlined;
      case ContributionType.damage: return Icons.report_problem_outlined;
      case ContributionType.listingPhoto: return Icons.photo_camera_outlined;
    }
  }
}

/// Card strip that lets users tap to add a contribution to a vehicle report.
class ContributionCardsStrip extends StatelessWidget {
  final String plate;
  final String? vin;

  const ContributionCardsStrip({super.key, required this.plate, this.vin});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Text(
            'Add vehicle information',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 90,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: ContributionType.values.map((type) {
              return _ContributionTypeCard(
                type: type,
                onTap: () => _openContributionSheet(context, type),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  void _openContributionSheet(BuildContext context, ContributionType type) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ContributionFormSheet(plate: plate, vin: vin, type: type),
    );
  }
}

class _ContributionTypeCard extends StatelessWidget {
  final ContributionType type;
  final VoidCallback onTap;

  const _ContributionTypeCard({required this.type, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 120,
        margin: const EdgeInsets.only(right: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surfaceVariant,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: Theme.of(context).colorScheme.outline.withOpacity(0.3),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(type.icon, size: 20, color: Theme.of(context).colorScheme.primary),
            Text(
              type.label,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

/// Bottom sheet form for submitting a contribution.
class ContributionFormSheet extends StatefulWidget {
  final String plate;
  final String? vin;
  final ContributionType type;

  const ContributionFormSheet({
    super.key,
    required this.plate,
    this.vin,
    required this.type,
  });

  @override
  State<ContributionFormSheet> createState() => _ContributionFormSheetState();
}

class _ContributionFormSheetState extends State<ContributionFormSheet> {
  final _formKey = GlobalKey<FormState>();
  bool _submitting = false;
  bool _done = false;
  String _error = '';

  // Odometer
  final _odometerCtrl = TextEditingController();
  DateTime? _odometerDate;

  // Service record
  final _garageCtrl = TextEditingController();
  final _mileageCtrl = TextEditingController();
  final _summaryCtrl = TextEditingController();
  DateTime? _serviceDate;

  // Damage
  final _locationCtrl = TextEditingController();
  DateTime? _damageDate;

  static const String _api = 'https://api.culicars.com';

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() { _submitting = true; _error = ''; });

    try {
      Map<String, dynamic> data = {};
      switch (widget.type) {
        case ContributionType.odometer:
          data = {
            'value': int.parse(_odometerCtrl.text),
            'unit': 'km',
            'dateObserved': _odometerDate?.toIso8601String().split('T').first ?? '',
          };
          break;
        case ContributionType.serviceRecord:
          data = {
            'date': _serviceDate?.toIso8601String().split('T').first ?? '',
            'garageName': _garageCtrl.text,
            'mileage': int.parse(_mileageCtrl.text),
            'workSummary': _summaryCtrl.text,
          };
          break;
        case ContributionType.damage:
          data = {
            'date': _damageDate?.toIso8601String().split('T').first ?? '',
            'location': _locationCtrl.text,
          };
          break;
        case ContributionType.listingPhoto:
          data = {};
          break;
      }

      final dio = Dio(BaseOptions(baseUrl: _api, extra: {'withCredentials': true}));
      await dio.post('/contributions', data: {
        'plate': widget.plate,
        'vin': widget.vin,
        'type': widget.type.apiValue,
        'data': data,
        'evidenceUrls': <String>[],
      });

      setState(() { _done = true; _submitting = false; });
    } on DioException catch (e) {
      setState(() {
        _error = (e.response?.data as Map?)?['error'] ?? 'Submission failed';
        _submitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
      ),
      padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + bottom),
      child: _done
          ? _buildDoneState()
          : Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.type.label,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  Text(
                    'Contributions are reviewed before appearing on reports.',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                  const SizedBox(height: 16),
                  ..._buildFields(),
                  if (_error.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(_error, style: const TextStyle(color: Colors.red, fontSize: 12)),
                  ],
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _submitting ? null : _submit,
                      child: _submitting
                          ? const SizedBox(
                              height: 18, width: 18,
                              child: CircularProgressIndicator(strokeWidth: 2))
                          : const Text('Submit contribution'),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildDoneState() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.check_circle_outline, color: Colors.green, size: 40),
        const SizedBox(height: 8),
        const Text('Submitted for review',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        Text('Your contribution will appear once approved.',
            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            textAlign: TextAlign.center),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ),
      ],
    );
  }

  List<Widget> _buildFields() {
    switch (widget.type) {
      case ContributionType.odometer:
        return [
          TextFormField(
            controller: _odometerCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Reading (km)', hintText: '85000'),
            validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null,
          ),
          const SizedBox(height: 10),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(_odometerDate == null
                ? 'Select date observed'
                : _odometerDate!.toIso8601String().split('T').first,
                style: const TextStyle(fontSize: 14)),
            trailing: const Icon(Icons.calendar_today, size: 18),
            onTap: () async {
              final d = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now(),
                  firstDate: DateTime(2000),
                  lastDate: DateTime.now());
              if (d != null) setState(() => _odometerDate = d);
            },
          ),
        ];

      case ContributionType.serviceRecord:
        return [
          TextFormField(
            controller: _garageCtrl,
            decoration: const InputDecoration(labelText: 'Garage name'),
            validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null,
          ),
          const SizedBox(height: 10),
          TextFormField(
            controller: _mileageCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Mileage at service'),
            validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null,
          ),
          const SizedBox(height: 10),
          TextFormField(
            controller: _summaryCtrl,
            maxLines: 2,
            decoration: const InputDecoration(labelText: 'Work summary'),
            validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null,
          ),
          const SizedBox(height: 10),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(_serviceDate == null
                ? 'Select service date'
                : _serviceDate!.toIso8601String().split('T').first,
                style: const TextStyle(fontSize: 14)),
            trailing: const Icon(Icons.calendar_today, size: 18),
            onTap: () async {
              final d = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now(),
                  firstDate: DateTime(2000),
                  lastDate: DateTime.now());
              if (d != null) setState(() => _serviceDate = d);
            },
          ),
        ];

      case ContributionType.damage:
        return [
          TextFormField(
            controller: _locationCtrl,
            decoration: const InputDecoration(
                labelText: 'Damage location', hintText: 'e.g. Front bumper, left side'),
            validator: (v) => (v?.isEmpty ?? true) ? 'Required' : null,
          ),
          const SizedBox(height: 10),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(_damageDate == null
                ? 'Select date observed'
                : _damageDate!.toIso8601String().split('T').first,
                style: const TextStyle(fontSize: 14)),
            trailing: const Icon(Icons.calendar_today, size: 18),
            onTap: () async {
              final d = await showDatePicker(
                  context: context,
                  initialDate: DateTime.now(),
                  firstDate: DateTime(2000),
                  lastDate: DateTime.now());
              if (d != null) setState(() => _damageDate = d);
            },
          ),
        ];

      case ContributionType.listingPhoto:
        return [
          Text('Photo attachment not yet available in app — please use the web.',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
        ];
    }
  }
}
