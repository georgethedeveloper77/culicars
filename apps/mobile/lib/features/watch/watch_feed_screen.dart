// apps/mobile/lib/features/watch/watch_feed_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/api_client.dart';
import 'submit_alert_sheet.dart';

// ── Models ────────────────────────────────────────────────────────────────────

enum AlertType {
  stolenVehicle,
  recoveredVehicle,
  damage,
  vandalism,
  partsTheft,
  suspiciousActivity,
  hijack,
}

extension AlertTypeExt on AlertType {
  String get value => switch (this) {
        AlertType.stolenVehicle => 'stolen_vehicle',
        AlertType.recoveredVehicle => 'recovered_vehicle',
        AlertType.damage => 'damage',
        AlertType.vandalism => 'vandalism',
        AlertType.partsTheft => 'parts_theft',
        AlertType.suspiciousActivity => 'suspicious_activity',
        AlertType.hijack => 'hijack',
      };

  String get label => switch (this) {
        AlertType.stolenVehicle => 'Stolen Vehicle',
        AlertType.recoveredVehicle => 'Recovered',
        AlertType.damage => 'Damage',
        AlertType.vandalism => 'Vandalism',
        AlertType.partsTheft => 'Parts Theft',
        AlertType.suspiciousActivity => 'Suspicious Activity',
        AlertType.hijack => 'Hijack',
      };

  String get emoji => switch (this) {
        AlertType.stolenVehicle => '🚨',
        AlertType.recoveredVehicle => '✅',
        AlertType.damage => '💥',
        AlertType.vandalism => '⚠️',
        AlertType.partsTheft => '🔧',
        AlertType.suspiciousActivity => '👁️',
        AlertType.hijack => '🔴',
      };

  Color get color => switch (this) {
        AlertType.stolenVehicle => const Color(0xFFDC2626),
        AlertType.recoveredVehicle => const Color(0xFF16A34A),
        AlertType.damage => const Color(0xFFEA580C),
        AlertType.vandalism => const Color(0xFFCA8A04),
        AlertType.partsTheft => const Color(0xFF7C3AED),
        AlertType.suspiciousActivity => const Color(0xFF2563EB),
        AlertType.hijack => const Color(0xFF991B1B),
      };

  Color get bgColor => switch (this) {
        AlertType.stolenVehicle => const Color(0xFFFEF2F2),
        AlertType.recoveredVehicle => const Color(0xFFF0FDF4),
        AlertType.damage => const Color(0xFFFFF7ED),
        AlertType.vandalism => const Color(0xFFFFFBEB),
        AlertType.partsTheft => const Color(0xFFF5F3FF),
        AlertType.suspiciousActivity => const Color(0xFFEFF6FF),
        AlertType.hijack => const Color(0xFFFEE2E2),
      };
}

AlertType _parseType(String raw) => switch (raw) {
      'stolen_vehicle' => AlertType.stolenVehicle,
      'recovered_vehicle' => AlertType.recoveredVehicle,
      'damage' => AlertType.damage,
      'vandalism' => AlertType.vandalism,
      'parts_theft' => AlertType.partsTheft,
      'suspicious_activity' => AlertType.suspiciousActivity,
      'hijack' => AlertType.hijack,
      _ => AlertType.suspiciousActivity,
    };

class WatchAlert {
  final String id;
  final String? plate;
  final AlertType type;
  final String? locationName;
  final String description;
  final DateTime createdAt;
  final List<String> evidenceUrls;

  WatchAlert({
    required this.id,
    this.plate,
    required this.type,
    this.locationName,
    required this.description,
    required this.createdAt,
    required this.evidenceUrls,
  });

  factory WatchAlert.fromJson(Map<String, dynamic> j) => WatchAlert(
        id: j['id'],
        plate: j['plate'],
        type: _parseType(j['type']),
        locationName: j['location_name'],
        description: j['description'],
        createdAt: DateTime.parse(j['created_at']),
        evidenceUrls: List<String>.from(j['evidence_urls'] ?? []),
      );
}

// ── Providers ─────────────────────────────────────────────────────────────────

final watchFeedProvider = FutureProvider.family<List<WatchAlert>, String?>(
  (ref, typeFilter) async {
    final params = <String, String>{'limit': '30'};
    if (typeFilter != null) params['type'] = typeFilter;

    final res = await ref.read(apiClientProvider).get('/watch/alerts', params: params);
    final alerts = (res['alerts'] as List)
        .map((e) => WatchAlert.fromJson(e))
        .toList();
    return alerts;
  },
);

// ── Screen ────────────────────────────────────────────────────────────────────

class WatchFeedScreen extends ConsumerStatefulWidget {
  const WatchFeedScreen({super.key});

  @override
  ConsumerState<WatchFeedScreen> createState() => _WatchFeedScreenState();
}

class _WatchFeedScreenState extends ConsumerState<WatchFeedScreen> {
  String? _typeFilter;

  static const _filters = [
    (label: 'All', value: null),
    (label: 'Stolen', value: 'stolen_vehicle'),
    (label: 'Hijack', value: 'hijack'),
    (label: 'Parts Theft', value: 'parts_theft'),
    (label: 'Suspicious', value: 'suspicious_activity'),
    (label: 'Vandalism', value: 'vandalism'),
    (label: 'Damage', value: 'damage'),
    (label: 'Recovered', value: 'recovered_vehicle'),
  ];

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inHours < 1) return 'Just now';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day} ${_month(dt.month)}';
  }

  String _month(int m) => const [
        '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ][m];

  @override
  Widget build(BuildContext context) {
    final feed = ref.watch(watchFeedProvider(_typeFilter));

    return Scaffold(
      backgroundColor: const Color(0xFFF8F8F8),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        title: const Text(
          'Community Watch',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: Color(0xFF111827),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline, color: Color(0xFF111827)),
            onPressed: _showSubmitSheet,
            tooltip: 'Report an alert',
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter chips
          SizedBox(
            height: 48,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: _filters.length,
              itemBuilder: (ctx, i) {
                final f = _filters[i];
                final selected = _typeFilter == f.value;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () => setState(() => _typeFilter = f.value),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 150),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: selected ? const Color(0xFF111827) : Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: selected ? const Color(0xFF111827) : const Color(0xFFE5E7EB),
                        ),
                      ),
                      child: Text(
                        f.label,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: selected ? Colors.white : const Color(0xFF374151),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // Feed
          Expanded(
            child: feed.when(
              loading: () => const Center(child: CupertinoActivityIndicator()),
              error: (e, _) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text('😕', style: TextStyle(fontSize: 40)),
                    const SizedBox(height: 8),
                    const Text('Could not load alerts',
                        style: TextStyle(color: Color(0xFF6B7280), fontSize: 14)),
                    const SizedBox(height: 12),
                    TextButton(
                      onPressed: () => ref.invalidate(watchFeedProvider(_typeFilter)),
                      child: const Text('Try again'),
                    ),
                  ],
                ),
              ),
              data: (alerts) => alerts.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('🔍', style: TextStyle(fontSize: 40)),
                          const SizedBox(height: 8),
                          const Text('No alerts in this category',
                              style: TextStyle(color: Color(0xFF6B7280), fontSize: 14)),
                          const SizedBox(height: 4),
                          const Text('Be the first to report',
                              style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 12)),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: () async => ref.invalidate(watchFeedProvider(_typeFilter)),
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: alerts.length,
                        itemBuilder: (ctx, i) => _AlertCard(
                          alert: alerts[i],
                          timeAgo: _timeAgo(alerts[i].createdAt),
                        ),
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  void _showSubmitSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const SubmitAlertSheet(),
    );
  }
}

// ── Alert Card ────────────────────────────────────────────────────────────────

class _AlertCard extends StatelessWidget {
  final WatchAlert alert;
  final String timeAgo;

  const _AlertCard({required this.alert, required this.timeAgo});

  @override
  Widget build(BuildContext context) {
    final t = alert.type;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: t.bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: t.color.withOpacity(0.2)),
      ),
      padding: const EdgeInsets.all(14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(t.emoji, style: const TextStyle(fontSize: 22)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      t.label.toUpperCase(),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: t.color,
                        letterSpacing: 0.8,
                      ),
                    ),
                    if (alert.plate != null) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.8),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          alert.plate!,
                          style: const TextStyle(
                            fontFamily: 'monospace',
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF111827),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 5),
                Text(
                  alert.description,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF374151),
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    if (alert.locationName != null) ...[
                      Icon(Icons.location_on_outlined,
                          size: 12, color: const Color(0xFF9CA3AF)),
                      const SizedBox(width: 2),
                      Text(
                        alert.locationName!,
                        style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
                      ),
                      const SizedBox(width: 8),
                    ],
                    Text(
                      timeAgo,
                      style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
                    ),
                    if (alert.evidenceUrls.isNotEmpty) ...[
                      const SizedBox(width: 8),
                      Icon(Icons.photo_outlined,
                          size: 12, color: const Color(0xFF9CA3AF)),
                      const SizedBox(width: 2),
                      Text(
                        '${alert.evidenceUrls.length}',
                        style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
