// lib/features/report/widgets/purpose_section_widget.dart
import 'package:flutter/material.dart';
import '../../../config/theme.dart';
import '../../../shared/models/report.dart';

const _icons = {
  'PSV / Matatu':         Icons.directions_bus_rounded,
  'Taxi / Ride-hailing':  Icons.local_taxi_rounded,
  'Rental':               Icons.key_rounded,
  'Driving School':       Icons.school_rounded,
  'Police / Government':  Icons.local_police_rounded,
  'Transport / Lorry':    Icons.local_shipping_rounded,
  'Ambulance / Medical':  Icons.local_hospital_rounded,
};

class PurposeSectionWidget extends StatelessWidget {
  final ReportSection? section;
  const PurposeSectionWidget({super.key, this.section});

  @override
  Widget build(BuildContext context) {
    final checks = (section?.data?['checks'] as List<dynamic>?)
        ?? _icons.keys.map((k) => {'label': k, 'found': false}).toList();

    return Wrap(
      spacing: 10, runSpacing: 10,
      children: checks.map((c) {
        final check = c as Map<String, dynamic>;
        final label = check['label'] as String? ?? '';
        final found = check['found'] as bool? ?? false;
        final color = found ? CuliTheme.medium : CuliTheme.textMuted;
        return SizedBox(
          width: (MediaQuery.of(context).size.width - 52) / 2,
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: found ? CuliTheme.medium.withOpacity(0.1) : CuliTheme.surface2,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: found ? CuliTheme.medium.withOpacity(0.4) : CuliTheme.border),
            ),
            child: Row(children: [
              Icon(_icons[label] ?? Icons.directions_car_outlined, color: color, size: 18),
              const SizedBox(width: 8),
              Expanded(child: Text(label, style: TextStyle(
                color: found ? CuliTheme.textPrimary : CuliTheme.textMuted,
                fontSize: 11,
                fontWeight: found ? FontWeight.w600 : FontWeight.normal,
              ))),
              Icon(
                found ? Icons.warning_amber_rounded : Icons.check_circle_outline_rounded,
                color: color, size: 14,
              ),
            ]),
          ),
        );
      }).toList(),
    );
  }
}
