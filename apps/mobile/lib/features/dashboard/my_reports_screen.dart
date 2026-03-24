// lib/features/dashboard/my_reports_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../core/api/api_client.dart';
import '../../shared/models/report.dart';

final _myReportsProvider = FutureProvider<List<Report>>((ref) async {
  final data = await ApiClient().get('/reports?mine=true');
  return (data as List<dynamic>)
      .map((r) => Report.fromJson(r as Map<String, dynamic>))
      .toList();
});

class MyReportsScreen extends ConsumerWidget {
  const MyReportsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_myReportsProvider);
    return Scaffold(
      backgroundColor: CuliTheme.bg,
      appBar: AppBar(title: const Text('My Reports')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator(color: CuliTheme.accent)),
        error: (e, _) => Center(child: Text(e.toString(),
          style: const TextStyle(color: CuliTheme.critical))),
        data: (reports) => reports.isEmpty
            ? const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.description_outlined, color: CuliTheme.textMuted, size: 56),
                SizedBox(height: 20),
                Text('No Reports Yet', style: TextStyle(
                  color: CuliTheme.textPrimary, fontSize: 20, fontWeight: FontWeight.w700)),
                SizedBox(height: 8),
                Text('Search a vehicle and unlock a report to see it here.',
                  style: TextStyle(color: CuliTheme.textMuted), textAlign: TextAlign.center),
              ]))
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: reports.length,
                itemBuilder: (_, i) {
                  final r = reports[i];
                  final color = CuliTheme.riskColor(r.riskLevel);
                  return GestureDetector(
                    onTap: () => context.push('/report/${r.id}'),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: CuliTheme.surface,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: CuliTheme.border)),
                      child: Row(children: [
                        Container(
                          width: 44, height: 44,
                          decoration: BoxDecoration(
                            color: color.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(12)),
                          child: Icon(Icons.directions_car_rounded, color: color, size: 22)),
                        const SizedBox(width: 14),
                        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(r.vehicleName, style: const TextStyle(
                            color: CuliTheme.textPrimary, fontSize: 15, fontWeight: FontWeight.w600)),
                          Text(r.vin, style: const TextStyle(
                            color: CuliTheme.textMuted, fontSize: 11, fontFamily: 'monospace')),
                        ])),
                        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: color.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(6)),
                            child: Text(r.riskLevel.toUpperCase(), style: TextStyle(
                              color: color, fontSize: 10, fontWeight: FontWeight.w800))),
                          const SizedBox(height: 4),
                          const Icon(Icons.chevron_right, color: CuliTheme.textMuted, size: 18),
                        ]),
                      ]),
                    ),
                  );
                }),
      ),
    );
  }
}
