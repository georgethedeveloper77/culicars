// lib/features/report/widgets/stolen_banner_widget.dart
import 'package:flutter/material.dart';
import '../../../config/theme.dart';

class StolenBannerWidget extends StatelessWidget {
  final String plate;
  final String? dateStolen;
  final String? county;
  final String? obNumber;
  const StolenBannerWidget({
    super.key, required this.plate,
    this.dateStolen, this.county, this.obNumber,
  });

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: CuliTheme.stolenRed.withOpacity(0.1),
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: CuliTheme.stolenRed.withOpacity(0.5), width: 1.5),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        const Icon(Icons.warning_rounded, color: CuliTheme.stolenRed, size: 20),
        const SizedBox(width: 8),
        const Expanded(child: Text('STOLEN VEHICLE ALERT', style: TextStyle(
          color: CuliTheme.stolenRed, fontSize: 13,
          fontWeight: FontWeight.w800, letterSpacing: 0.5,
        ))),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: CuliTheme.stolenRed, borderRadius: BorderRadius.circular(20)),
          child: const Text('FREE', style: TextStyle(
            color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800)),
        ),
      ]),
      const SizedBox(height: 10),
      Text('This vehicle ($plate) was reported stolen.',
        style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
      if (dateStolen != null || county != null)
        Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text(
            [if (dateStolen != null) dateStolen!, if (county != null) county!].join(' · '),
            style: const TextStyle(color: CuliTheme.textMuted, fontSize: 12)),
        ),
      if (obNumber != null)
        Padding(
          padding: const EdgeInsets.only(top: 2),
          child: Text('OB: $obNumber ✓ Verified',
            style: const TextStyle(
              color: CuliTheme.stolenRed, fontSize: 12, fontWeight: FontWeight.w600)),
        ),
      const SizedBox(height: 10),
      const Text('Shown free to all users. Exercise extreme caution.',
        style: TextStyle(color: CuliTheme.textMuted, fontSize: 12, height: 1.4)),
    ]),
  );
}
