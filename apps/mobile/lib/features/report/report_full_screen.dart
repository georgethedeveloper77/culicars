// apps/mobile/lib/features/report/report_full_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:dio/dio.dart';

// ─── Data model ───────────────────────────────────────────────────────────

class VehicleReport {
  final String id;
  final String vin;
  final String? plate;
  final String state;
  final int riskScore;
  final String riskLevel;
  final List<String> riskFlags;
  final Map<String, dynamic> sections;
  final String generatedAt;
  final bool isUnlocked;

  const VehicleReport({
    required this.id,
    required this.vin,
    this.plate,
    required this.state,
    required this.riskScore,
    required this.riskLevel,
    required this.riskFlags,
    required this.sections,
    required this.generatedAt,
    required this.isUnlocked,
  });

  factory VehicleReport.fromJson(Map<String, dynamic> json, bool unlocked) {
    final r = json['report'] as Map<String, dynamic>;
    return VehicleReport(
      id: r['id'] as String,
      vin: r['vin'] as String,
      plate: r['plate'] as String?,
      state: r['state'] as String,
      riskScore: (r['riskScore'] as num).toInt(),
      riskLevel: r['riskLevel'] as String,
      riskFlags: List<String>.from(r['riskFlags'] ?? []),
      sections: Map<String, dynamic>.from(r['sections'] ?? {}),
      generatedAt: r['generatedAt'] as String,
      isUnlocked: unlocked,
    );
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────

final _dio = Dio(BaseOptions(
  baseUrl: const String.fromEnvironment('API_URL', defaultValue: 'https://api.culicars.com'),
  connectTimeout: const Duration(seconds: 10),
  receiveTimeout: const Duration(seconds: 15),
));

// ─── Main screen ──────────────────────────────────────────────────────────

class ReportFullScreen extends ConsumerStatefulWidget {
  final String reportId;
  const ReportFullScreen({super.key, required this.reportId});

  @override
  ConsumerState<ReportFullScreen> createState() => _ReportFullScreenState();
}

class _ReportFullScreenState extends ConsumerState<ReportFullScreen> {
  VehicleReport? _report;
  bool _isUnlocked = false;
  bool _unlocking = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadReport();
  }

  Future<void> _loadReport() async {
    try {
      final res = await _dio.get('/reports/${widget.reportId}/preview');
      setState(() {
        _report = VehicleReport.fromJson(res.data, res.data['isUnlocked'] as bool);
        _isUnlocked = res.data['isUnlocked'] as bool;
      });
    } catch (e) {
      setState(() => _error = 'Failed to load report');
    }
  }

  Future<void> _unlock() async {
    setState(() => _unlocking = true);
    try {
      final res = await _dio.post('/reports/${widget.reportId}/unlock');
      setState(() {
        _report = VehicleReport.fromJson(res.data, true);
        _isUnlocked = true;
      });
    } on DioException catch (e) {
      final statusCode = e.response?.statusCode;
      if (statusCode == 401) {
        if (mounted) context.push('/login');
      } else if (statusCode == 402) {
        if (mounted) context.push('/credits');
      } else {
        setState(() => _error = 'Unlock failed. Please try again.');
      }
    } finally {
      setState(() => _unlocking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_error != null) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('🚗', style: TextStyle(fontSize: 48)),
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.grey)),
              const SizedBox(height: 12),
              TextButton(onPressed: () => context.pop(), child: const Text('Go back')),
            ],
          ),
        ),
      );
    }

    if (_report == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final report = _report!;
    final s = report.sections;

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        title: Text(report.plate ?? report.vin),
        actions: [
          _StateBadge(state: report.state),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadReport,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (report.state != 'pending_enrichment')
              _RiskMeter(
                score: report.riskScore,
                level: report.riskLevel,
                flags: report.riskFlags,
              ),

            if (report.state == 'pending_enrichment')
              _PendingShell(plate: report.plate, vin: report.vin),

            if (s['identity'] != null && report.state != 'pending_enrichment') ...[
              const SizedBox(height: 12),
              _IdentitySection(data: s['identity'] as Map<String, dynamic>),
            ],

            if (s['stolenAlerts'] != null && report.state != 'pending_enrichment') ...[
              const SizedBox(height: 12),
              _StolenAlertsSection(data: s['stolenAlerts'] as Map<String, dynamic>),
            ],

            if (!_isUnlocked && report.state != 'pending_enrichment') ...[
              const SizedBox(height: 12),
              _UnlockCard(unlocking: _unlocking, onUnlock: _unlock),
              const SizedBox(height: 12),
              const _LockedSection(title: 'Ownership History'),
              const SizedBox(height: 8),
              const _LockedSection(title: 'Damage Records'),
              const SizedBox(height: 8),
              const _LockedSection(title: 'Odometer Readings'),
              const SizedBox(height: 8),
              const _LockedSection(title: 'Vehicle Timeline'),
              const SizedBox(height: 8),
              const _LockedSection(title: 'Community Insights'),
            ],

            if (_isUnlocked) ...[
              const SizedBox(height: 12),
              if (s['ownership'] != null)
                _OwnershipSection(data: s['ownership'] as Map<String, dynamic>, vin: report.vin),
              const SizedBox(height: 12),
              if (s['damage'] != null)
                _DamageSection(data: s['damage'] as Map<String, dynamic>),
              const SizedBox(height: 12),
              if (s['odometer'] != null)
                _OdometerSection(data: s['odometer'] as Map<String, dynamic>),
              const SizedBox(height: 12),
              if (s['timeline'] != null)
                _TimelineSection(data: s['timeline'] as Map<String, dynamic>),
              const SizedBox(height: 12),
              if (s['communityInsights'] != null)
                _CommunityInsightsSection(data: s['communityInsights'] as Map<String, dynamic>),
            ],

            const SizedBox(height: 24),
            Text(
              'Generated ${_formatDate(report.generatedAt)} · culicars.com',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 11, color: Colors.grey),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

// ─── Widgets ──────────────────────────────────────────────────────────────

class _StateBadge extends StatelessWidget {
  final String state;
  const _StateBadge({required this.state});

  // FIX: replaced Dart 3 record tuple (String, Color) with a plain _StateMeta class
  static _StateMeta _stateMeta(String state) {
    switch (state) {
      case 'verified':
        return _StateMeta('Verified', Colors.green);
      case 'partial':
        return _StateMeta('Partial', Colors.orange);
      case 'low_confidence':
        return _StateMeta('Low Confidence', Colors.deepOrange);
      default:
        return _StateMeta('Pending', Colors.grey);
    }
  }

  @override
  Widget build(BuildContext context) {
    final meta = _stateMeta(state);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: meta.color, borderRadius: BorderRadius.circular(20)),
      child: Text(
        meta.label,
        style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class _StateMeta {
  final String label;
  final Color color;
  const _StateMeta(this.label, this.color);
}

class _RiskMeter extends StatelessWidget {
  final int score;
  final String level;
  final List<String> flags;
  const _RiskMeter({required this.score, required this.level, required this.flags});

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (level) {
      case 'critical':
        color = Colors.red;
        break;
      case 'high':
        color = Colors.orange;
        break;
      case 'medium':
        color = Colors.amber;
        break;
      default:
        color = Colors.green;
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Risk Assessment', style: TextStyle(fontWeight: FontWeight.bold)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(12)),
                  child: Text(
                    level.toUpperCase(),
                    style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            LinearProgressIndicator(
              value: score / 100,
              backgroundColor: Colors.grey[200],
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 8,
              borderRadius: BorderRadius.circular(4),
            ),
            const SizedBox(height: 4),
            Text('$score / 100', style: const TextStyle(fontSize: 11, color: Colors.grey)),
            if (flags.isNotEmpty) ...[
              const SizedBox(height: 8),
              ...flags.map((f) => Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('• ', style: TextStyle(color: Colors.orange)),
                        Expanded(child: Text(f, style: const TextStyle(fontSize: 13))),
                      ],
                    ),
                  )),
            ],
          ],
        ),
      ),
    );
  }
}

class _IdentitySection extends StatelessWidget {
  final Map<String, dynamic> data;
  const _IdentitySection({required this.data});

  @override
  Widget build(BuildContext context) {
    final fields = <Map<String, String?>>[
      {'label': 'Plate',     'value': data['plate'] as String?},
      {'label': 'VIN',       'value': data['vin'] as String?},
      {'label': 'Make',      'value': data['make'] as String?},
      {'label': 'Model',     'value': data['model'] as String?},
      {'label': 'Year',      'value': data['year']?.toString()},
      {'label': 'Color',     'value': data['color'] as String?},
      {'label': 'Fuel Type', 'value': data['fuelType'] as String?},
      {'label': 'Body Type', 'value': data['bodyType'] as String?},
    ].where((f) => f['value'] != null).toList(); // <--- Ensure this semicolon exists!

    // Now these variables will parse correctly
    final int sources = data['sourceCount'] ?? 0;
    final int confidence = ((data['confidence'] as num? ?? 0.0) * 100).round();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Vehicle Identity',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              childAspectRatio: 3.5,
              children: fields
                  .map((f) => Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(f['label']!,
                              style: const TextStyle(
                                  fontSize: 10,
                                  color: Colors.grey,
                                  fontWeight: FontWeight.w600)),
                          Text(f['value']!,
                              style: const TextStyle(
                                  fontSize: 13, fontWeight: FontWeight.w500)),
                        ],
                      ))
                  .toList(),
            ),
            const SizedBox(height: 8),
            Text(
              '$sources data source(s) · $confidence% confidence',
              style: const TextStyle(fontSize: 11, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}

class _StolenAlertsSection extends StatelessWidget {
  final Map<String, dynamic> data;
  const _StolenAlertsSection({required this.data});

  @override
  Widget build(BuildContext context) {
    final isStolen = data['isStolen'] as bool? ?? false;
    final alerts = (data['alerts'] as List?) ?? [];

    if (!isStolen && alerts.isEmpty) {
      return Card(
        color: Colors.green[50],
        child: const ListTile(
          leading: Icon(Icons.check_circle, color: Colors.green),
          title: Text('No Theft Alerts',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.green)),
          subtitle: Text('No stolen vehicle reports found.'),
        ),
      );
    }

    return Card(
      color: isStolen ? Colors.red[50] : null,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              isStolen ? '⚠ Theft Alert' : 'Theft Status',
              style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: isStolen ? Colors.red : null),
            ),
            if (isStolen)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  'This vehicle has been reported stolen.'
                  '${data['isRecovered'] == true ? ' A recovery report has also been filed.' : ''}',
                  style: const TextStyle(color: Colors.red),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _LockedSection extends StatelessWidget {
  final String title;
  const _LockedSection({required this.title});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        leading: const Icon(Icons.lock_outline, color: Colors.grey),
        title: Text(title, style: const TextStyle(color: Colors.grey)),
        subtitle: const Text('Unlock to view', style: TextStyle(fontSize: 12)),
      ),
    );
  }
}

class _UnlockCard extends StatelessWidget {
  final bool unlocking;
  final VoidCallback onUnlock;
  const _UnlockCard({required this.unlocking, required this.onUnlock});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.blue[50],
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const Text('Full Report — 1 Credit',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 4),
            const Text('Ownership, damage, odometer, and timeline.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey, fontSize: 13)),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: unlocking ? null : onUnlock,
                style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue[700],
                    foregroundColor: Colors.white),
                child: unlocking
                    ? const SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Text('Unlock Full Report'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PendingShell extends StatelessWidget {
  final String? plate;
  final String vin;
  const _PendingShell({this.plate, required this.vin});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const Text('🔍', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 12),
            const Text('Searching for records',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 6),
            Text(
              'No records are available for ${plate ?? vin} yet. '
              'We have logged your search and will notify you when data becomes available.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }
}

class _OwnershipSection extends StatelessWidget {
  final Map<String, dynamic> data;
  final String vin;
  const _OwnershipSection({required this.data, required this.vin});

  @override
  Widget build(BuildContext context) {
    final verified = data['verified'] as bool? ?? false;
    final confidence = (data['confidence'] as num? ?? 0.0).toDouble();
    final ownerCount = data['ownerCount'];
    final lastTransfer = data['lastTransferDate'] as String?;
    final verificationRequired = data['verificationRequired'] as bool? ?? false;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Ownership',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            if (verified)
              const Text('✓ Officially verified',
                  style: TextStyle(color: Colors.green, fontWeight: FontWeight.w600))
            else
              Text('Confidence: ${(confidence * 100).round()}%',
                  style: const TextStyle(color: Colors.orange)),
            if (ownerCount != null) Text('Previous owners: $ownerCount'),
            if (lastTransfer != null)
              Text('Last transfer: ${_formatDate(lastTransfer)}'),
            if (verificationRequired) ...[
              const SizedBox(height: 8),
              TextButton.icon(
                onPressed: () => context.push('/verify?vin=$vin'),
                icon: const Icon(Icons.verified_user_outlined, size: 16),
                label: const Text('Verify official record'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _DamageSection extends StatelessWidget {
  final Map<String, dynamic> data;
  const _DamageSection({required this.data});

  @override
  Widget build(BuildContext context) {
    final count = data['recordCount'] as int? ?? 0;
    final records = (data['records'] as List?) ?? [];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Damage Records${count > 0 ? ' ($count)' : ''}',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            if (count == 0)
              const Text('No damage records found.',
                  style: TextStyle(color: Colors.green))
            else
              ...records.map((d) => Padding(
                    padding: const EdgeInsets.only(top: 6),
                    child: Text(
                      (d as Map<String, dynamic>)['description'] as String? ??
                          d['location'] as String? ??
                          'Damage record',
                      style: const TextStyle(fontSize: 13),
                    ),
                  )),
          ],
        ),
      ),
    );
  }
}

class _OdometerSection extends StatelessWidget {
  final Map<String, dynamic> data;
  const _OdometerSection({required this.data});

  @override
  Widget build(BuildContext context) {
    final anomaly = data['anomalyDetected'] as bool? ?? false;
    final latest = data['latestReading'] as Map<String, dynamic>?;
    final count = (data['readings'] as List?)?.length ?? 0;

    // FIX: format number without regex that caused parse error
    String formatOdometer(num value) {
      final parts = <String>[];
      var v = value.toInt();
      while (v >= 1000) {
        parts.insert(0, (v % 1000).toString().padLeft(3, '0'));
        v = v ~/ 1000;
      }
      parts.insert(0, v.toString());
      return parts.join(',');
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text('Odometer',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                if (anomaly) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                        color: Colors.orange[100],
                        borderRadius: BorderRadius.circular(10)),
                    child: const Text('⚠ Anomaly',
                        style: TextStyle(fontSize: 11, color: Colors.orange)),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 8),
            if (latest != null)
              Text(
                '${formatOdometer(latest['value'] as num)} ${latest['unit']}',
                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
              )
            else
              const Text('No odometer records available.',
                  style: TextStyle(color: Colors.grey)),
            if (count > 1)
              Text('$count readings on record',
                  style: const TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
      ),
    );
  }
}

class _TimelineSection extends StatelessWidget {
  final Map<String, dynamic> data;
  const _TimelineSection({required this.data});

  @override
  Widget build(BuildContext context) {
    final events = (data['events'] as List?)?.take(10).toList() ?? [];
    if (events.isEmpty) return const SizedBox.shrink();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Vehicle Timeline',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 12),
            ...events.asMap().entries.map((entry) {
              final e = entry.value as Map<String, dynamic>;
              final isLast = entry.key == events.length - 1;
              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Column(
                      children: [
                        Container(
                          width: 10,
                          height: 10,
                          decoration: const BoxDecoration(
                              color: Colors.blue, shape: BoxShape.circle),
                        ),
                        if (!isLast)
                          Container(width: 2, height: 24, color: Colors.blue[100]),
                      ],
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(_formatDate(e['date'] as String?),
                              style: const TextStyle(fontSize: 10, color: Colors.grey)),
                          Text(e['label'] as String,
                              style: const TextStyle(fontSize: 13)),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}

class _CommunityInsightsSection extends StatelessWidget {
  final Map<String, dynamic> data;
  const _CommunityInsightsSection({required this.data});

  @override
  Widget build(BuildContext context) {
    final available = data['available'] as bool? ?? false;
    final placeholder = data['placeholder'] as String?;
    final insights = (data['insights'] as List?) ?? [];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Community Insights',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            if (!available)
              Text(
                placeholder ??
                    'Community data will appear here as Watch grows.',
                style: const TextStyle(color: Colors.grey, fontSize: 13),
              )
            else
              ...insights.map((ins) {
                final insMap = ins as Map<String, dynamic>;
                final severity = insMap['severity'] as String;
                Color color;
                switch (severity) {
                  case 'critical':
                    color = Colors.red;
                    break;
                  case 'warning':
                    color = Colors.orange;
                    break;
                  default:
                    color = Colors.grey;
                }
                return Container(
                  margin: const EdgeInsets.only(top: 6),
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: RichText(
                    text: TextSpan(
                      style: TextStyle(fontSize: 13, color: color),
                      children: [
                        TextSpan(
                          text: '${insMap['label']}: ',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        TextSpan(text: insMap['value'] as String),
                      ],
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

String _formatDate(String? iso) {
  if (iso == null) return '—';
  try {
    final dt = DateTime.parse(iso).toLocal();
    return '${dt.day}/${dt.month}/${dt.year}';
  } catch (_) {
    return iso;
  }
}
