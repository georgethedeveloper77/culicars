// lib/features/dashboard/transaction_history_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/theme.dart';
import '../../core/api/api_client.dart';

class _Entry {
  final String id;
  final String type;
  final int delta;
  final int before;
  final int after;
  final String? source;
  final String createdAt;

  _Entry.fromJson(Map<String, dynamic> j)
      : id        = j['id'] as String,
        type      = j['type'] as String,
        delta     = j['creditsDelta'] as int,
        before    = j['balanceBefore'] as int,
        after     = j['balanceAfter'] as int,
        source    = j['source'] as String?,
        createdAt = j['createdAt'] as String? ?? '';
}

final _ledgerProvider = FutureProvider<List<_Entry>>((ref) async {
  final data = await ApiClient().get('/credits/ledger');
  return (data as List<dynamic>)
      .map((e) => _Entry.fromJson(e as Map<String, dynamic>))
      .toList();
});

class TransactionHistoryScreen extends ConsumerWidget {
  const TransactionHistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(_ledgerProvider);
    return Scaffold(
      backgroundColor: CuliTheme.bg,
      appBar: AppBar(title: const Text('Transaction History')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator(color: CuliTheme.accent)),
        error: (e, _) => Center(child: Text(e.toString(),
          style: const TextStyle(color: CuliTheme.critical))),
        data: (entries) => entries.isEmpty
            ? const Center(child: Text('No transactions yet.',
                style: TextStyle(color: CuliTheme.textMuted)))
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: entries.length,
                itemBuilder: (_, i) {
                  final e = entries[i];
                  final gain  = e.delta > 0;
                  final color = gain ? CuliTheme.clean : CuliTheme.textMuted;
                  final label = e.type.replaceAll('_', ' ').split(' ').map((w) =>
                    w.isNotEmpty ? w[0].toUpperCase() + w.substring(1) : w).join(' ');
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: CuliTheme.surface, borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: CuliTheme.border)),
                    child: Row(children: [
                      Container(
                        width: 40, height: 40,
                        decoration: BoxDecoration(
                          color: color.withOpacity(0.1), shape: BoxShape.circle),
                        child: Icon(
                          gain ? Icons.add_rounded : Icons.remove_rounded,
                          color: color, size: 20)),
                      const SizedBox(width: 12),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(label, style: const TextStyle(
                          color: CuliTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                        if (e.source != null)
                          Text(e.source!, style: const TextStyle(
                            color: CuliTheme.textMuted, fontSize: 11)),
                        Text(e.createdAt.substring(0, 10),
                          style: const TextStyle(color: CuliTheme.textMuted, fontSize: 11)),
                      ])),
                      Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                        Text('${gain ? '+' : ''}${e.delta} cr',
                          style: TextStyle(color: color, fontSize: 15, fontWeight: FontWeight.w800)),
                        Text('→ ${e.after}',
                          style: const TextStyle(color: CuliTheme.textMuted, fontSize: 11)),
                      ]),
                    ]),
                  );
                }),
      ),
    );
  }
}
