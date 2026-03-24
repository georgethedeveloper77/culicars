// lib/features/report/widgets/locked_section_widget.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../config/theme.dart';

class LockedSectionWidget extends StatelessWidget {
  final VoidCallback? onUnlock;
  const LockedSectionWidget({super.key, this.onUnlock});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onUnlock ?? () => context.push('/credits'),
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 32),
      decoration: BoxDecoration(
        color: CuliTheme.surface2,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: CuliTheme.border),
      ),
      child: Column(children: [
        const Icon(Icons.lock_outline_rounded, color: CuliTheme.accent, size: 28),
        const SizedBox(height: 12),
        const Text('Unlock Full Report', style: TextStyle(
          color: CuliTheme.textPrimary, fontSize: 16, fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        const Text('1 credit unlocks all sections',
            style: TextStyle(color: CuliTheme.textMuted, fontSize: 13)),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: onUnlock ?? () => context.push('/credits'),
          icon: const Icon(Icons.lock_open_rounded, size: 16),
          label: const Text('Unlock — 1 Credit'),
          style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10)),
        ),
      ]),
    ),
  );
}
