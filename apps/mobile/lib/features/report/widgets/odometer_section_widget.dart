// lib/features/report/widgets/odometer_section_widget.dart
import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../config/theme.dart';
import '../../../shared/models/report.dart';

class OdometerSectionWidget extends StatelessWidget {
  final ReportSection? section;
  const OdometerSectionWidget({super.key, this.section});

  @override
  Widget build(BuildContext context) {
    final data         = section?.data ?? {};
    final records      = (data['records'] as List<dynamic>?) ?? [];
    final rollbackIdx  = data['rollbackIndex'] as int?;
    final lastMileage  = data['lastMileage'] as int?;
    final avgSimilar   = data['averageForSimilar'] as int?;

    if (records.isEmpty) {
      return const Text('No odometer records found.',
          style: TextStyle(color: CuliTheme.textMuted));
    }

    final spots = records.asMap().entries.map((e) {
      final r = e.value as Map<String, dynamic>;
      return FlSpot(e.key.toDouble(), (r['mileage'] as int? ?? 0).toDouble());
    }).toList();

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Stats row
      Row(children: [
        if (lastMileage != null)
          _StatChip(label: 'Last known', value: '${_fmt(lastMileage)} km'),
        const SizedBox(width: 10),
        if (avgSimilar != null)
          _StatChip(label: 'Average similar', value: '${_fmt(avgSimilar)} km'),
      ]),
      const SizedBox(height: 12),

      // Rollback warning
      if (rollbackIdx != null)
        Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: CuliTheme.critical.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: CuliTheme.critical.withOpacity(0.4)),
          ),
          child: const Row(children: [
            Icon(Icons.warning_rounded, color: CuliTheme.critical, size: 18),
            SizedBox(width: 8),
            Text('Odometer Rollback Detected!', style: TextStyle(
              color: CuliTheme.critical, fontWeight: FontWeight.w700, fontSize: 13)),
          ]),
        ),

      // Chart
      SizedBox(
        height: 140,
        child: LineChart(LineChartData(
          gridData: const FlGridData(show: false),
          titlesData: const FlTitlesData(show: false),
          borderData: FlBorderData(show: false),
          lineBarsData: [
            LineChartBarData(
              spots: spots,
              isCurved: true,
              color: CuliTheme.accent,
              barWidth: 2.5,
              dotData: FlDotData(
                show: rollbackIdx != null,
                getDotPainter: (spot, _, __, index) => FlDotCirclePainter(
                  radius: index == rollbackIdx ? 6 : 3,
                  color: index == rollbackIdx ? CuliTheme.critical : CuliTheme.accent,
                ),
              ),
              belowBarData: BarAreaData(
                show: true,
                color: CuliTheme.accent.withOpacity(0.06),
              ),
            ),
          ],
        )),
      ),
      const SizedBox(height: 16),

      // Records table
      ...records.asMap().entries.map((e) {
        final r = e.value as Map<String, dynamic>;
        final isRollback = e.key == rollbackIdx;
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isRollback ? CuliTheme.critical.withOpacity(0.08) : CuliTheme.surface2,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isRollback ? CuliTheme.critical.withOpacity(0.3) : Colors.transparent),
          ),
          child: Row(children: [
            if (isRollback)
              const Padding(
                padding: EdgeInsets.only(right: 8),
                child: Icon(Icons.arrow_downward_rounded, color: CuliTheme.critical, size: 14),
              ),
            Text(r['date'] as String? ?? '—',
              style: const TextStyle(color: CuliTheme.textMuted, fontSize: 12)),
            const SizedBox(width: 12),
            Expanded(child: Text(r['source'] as String? ?? '—',
              style: const TextStyle(color: CuliTheme.textMuted, fontSize: 12))),
            Text('${_fmt(r['mileage'] as int? ?? 0)} km',
              style: TextStyle(
                color: isRollback ? CuliTheme.critical : CuliTheme.textPrimary,
                fontWeight: FontWeight.w700, fontSize: 13,
              )),
          ]),
        );
      }),
    ]);
  }

  String _fmt(int n) =>
      n.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
}

class _StatChip extends StatelessWidget {
  final String label;
  final String value;
  const _StatChip({required this.label, required this.value});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    decoration: BoxDecoration(
      color: CuliTheme.surface2, borderRadius: BorderRadius.circular(10)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(color: CuliTheme.textMuted, fontSize: 11)),
      Text(value, style: const TextStyle(
        color: CuliTheme.textPrimary, fontWeight: FontWeight.w700, fontSize: 14)),
    ]),
  );
}
