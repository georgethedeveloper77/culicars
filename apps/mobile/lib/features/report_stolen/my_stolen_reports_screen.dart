// lib/features/report_stolen/my_stolen_reports_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../shared/models/stolen_report.dart';
import 'providers/stolen_provider.dart';

class MyStolenReportsScreen extends ConsumerWidget {
  const MyStolenReportsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(myStolenReportsProvider);
    return Scaffold(
      backgroundColor: CuliTheme.bg,
      appBar: AppBar(
        title: const Text('My Stolen Reports'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_rounded),
            onPressed: () => context.push('/report-stolen')),
        ],
      ),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator(color: CuliTheme.accent)),
        error: (e, _) => Center(child: Text(e.toString(),
          style: const TextStyle(color: CuliTheme.critical))),
        data: (reports) => reports.isEmpty
            ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.shield_outlined, color: CuliTheme.textMuted, size: 56),
                const SizedBox(height: 20),
                const Text('No Stolen Reports', style: TextStyle(
                  color: CuliTheme.textPrimary, fontSize: 20, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                const Text('You haven\'t submitted any reports yet.',
                  style: TextStyle(color: CuliTheme.textMuted)),
                const SizedBox(height: 28),
                ElevatedButton.icon(
                  icon: const Icon(Icons.add_rounded, size: 18),
                  label: const Text('Report Stolen Vehicle'),
                  onPressed: () => context.push('/report-stolen'),
                  style: ElevatedButton.styleFrom(backgroundColor: CuliTheme.stolenRed)),
              ]))
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: reports.length,
                itemBuilder: (_, i) => _Card(report: reports[i])),
      ),
    );
  }
}

class _Card extends StatelessWidget {
  final StolenReport report;
  const _Card({required this.report});

  Color get _statusColor {
    switch (report.status) {
      case 'active':    return CuliTheme.stolenRed;
      case 'recovered': return CuliTheme.clean;
      case 'pending':   return CuliTheme.medium;
      default:          return CuliTheme.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 12),
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: CuliTheme.surface, borderRadius: BorderRadius.circular(16),
      border: Border.all(color: CuliTheme.border)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Text(report.plateDisplay ?? report.plate, style: const TextStyle(
          color: CuliTheme.textPrimary, fontSize: 20,
          fontWeight: FontWeight.w900, fontFamily: 'monospace', letterSpacing: 1)),
        const Spacer(),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: _statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(20),
            border: Border.all(color: _statusColor.withOpacity(0.4))),
          child: Text(report.status.toUpperCase(), style: TextStyle(
            color: _statusColor, fontSize: 10, fontWeight: FontWeight.w800))),
      ]),
      const SizedBox(height: 10),
      Row(children: [
        const Icon(Icons.calendar_today_outlined, color: CuliTheme.textMuted, size: 14),
        const SizedBox(width: 6),
        Text('Stolen: ${report.dateStolenString}',
          style: const TextStyle(color: CuliTheme.textMuted, fontSize: 12)),
      ]),
      const SizedBox(height: 4),
      Row(children: [
        const Icon(Icons.location_on_outlined, color: CuliTheme.textMuted, size: 14),
        const SizedBox(width: 6),
        Text('${report.countyStolen}, ${report.townStolen}',
          style: const TextStyle(color: CuliTheme.textMuted, fontSize: 12)),
      ]),
      if (report.policeObNumber != null) ...[
        const SizedBox(height: 4),
        Row(children: [
          const Icon(Icons.shield_outlined, color: CuliTheme.clean, size: 14),
          const SizedBox(width: 6),
          Text('OB: ${report.policeObNumber}',
            style: const TextStyle(color: CuliTheme.clean, fontSize: 12, fontWeight: FontWeight.w600)),
        ]),
      ],
    ]),
  );
}
