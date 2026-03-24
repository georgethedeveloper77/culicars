// lib/features/report_stolen/stolen_success_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import '../../config/theme.dart';

class StolenSuccessScreen extends StatelessWidget {
  final String plate;
  const StolenSuccessScreen({super.key, required this.plate});

  void _share() {
    final text = '🚨 STOLEN VEHICLE ALERT 🚨\n\n'
        'Plate: ${plate.isEmpty ? 'N/A' : plate}\n\n'
        'Reported stolen on CuliCars — Kenya\'s vehicle history platform.\n\n'
        '🔍 Check any vehicle free: https://culicars.com';
    Share.share(text);
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: CuliTheme.bg,
    body: SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            width: 88, height: 88,
            decoration: BoxDecoration(
              color: CuliTheme.clean.withOpacity(0.12), shape: BoxShape.circle),
            child: const Icon(Icons.check_circle_rounded, color: CuliTheme.clean, size: 48),
          ),
          const SizedBox(height: 28),
          const Text('Report Submitted', style: TextStyle(
            color: CuliTheme.textPrimary, fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: -0.5)),
          const SizedBox(height: 12),
          Text(
            plate.isNotEmpty
                ? 'Your report for $plate is under review.'
                : 'Your report is under review.',
            textAlign: TextAlign.center,
            style: const TextStyle(color: CuliTheme.textMuted, fontSize: 15, height: 1.6)),
          const SizedBox(height: 8),
          if (plate.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: CuliTheme.stolenRed.withOpacity(0.08),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: CuliTheme.stolenRed.withOpacity(0.3))),
              child: Text(plate, style: const TextStyle(
                color: CuliTheme.stolenRed, fontFamily: 'monospace',
                fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: 2)),
            ),
          const SizedBox(height: 32),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: CuliTheme.surface, borderRadius: BorderRadius.circular(16),
              border: Border.all(color: CuliTheme.border)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('What happens next?', style: TextStyle(
                color: CuliTheme.textPrimary, fontWeight: FontWeight.w700, fontSize: 14)),
              const SizedBox(height: 12),
              ...[
                'Admin verifies your report',
                'STOLEN alert goes live — free for all searches',
                'Risk score updated to CRITICAL',
                'Anyone searching this plate sees the alert',
              ].asMap().entries.map((e) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Container(
                    width: 22, height: 22,
                    margin: const EdgeInsets.only(right: 10),
                    decoration: BoxDecoration(
                      color: CuliTheme.accent.withOpacity(0.15), shape: BoxShape.circle),
                    child: Center(child: Text('${e.key + 1}', style: const TextStyle(
                      color: CuliTheme.accent, fontSize: 11, fontWeight: FontWeight.w800)))),
                  Expanded(child: Text(e.value,
                    style: const TextStyle(color: CuliTheme.textMuted, fontSize: 13, height: 1.4))),
                ]),
              )),
            ]),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.share_rounded, size: 18),
              label: const Text('Share Alert on WhatsApp'),
              onPressed: _share,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF25D366),
                padding: const EdgeInsets.symmetric(vertical: 14)),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () => context.go('/search'),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
                side: const BorderSide(color: CuliTheme.border)),
              child: const Text('Back to Search',
                style: TextStyle(color: CuliTheme.textMuted)),
            ),
          ),
        ]),
      ),
    ),
  );
}
