// lib/features/report/report_full_screen.dart
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../core/api/api_client.dart';
import '../../shared/models/report.dart';
import '../../shared/widgets/photo_viewer.dart';
import 'widgets/locked_section_widget.dart';
import 'widgets/stolen_banner_widget.dart';
import 'widgets/odometer_section_widget.dart';
import 'widgets/damage_section_widget.dart';
import 'widgets/purpose_section_widget.dart';
import 'widgets/ntsa_fetch_widget.dart';

class ReportFullScreen extends StatefulWidget {
  final String reportId;
  const ReportFullScreen({super.key, required this.reportId});
  @override
  State<ReportFullScreen> createState() => _ReportFullScreenState();
}

class _ReportFullScreenState extends State<ReportFullScreen> {
  final _api = ApiClient();
  Report? _report;
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await _api.get('/reports/${widget.reportId}');
      setState(() { _report = Report.fromJson(data as Map<String, dynamic>); _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _unlock() async {
    try {
      await _api.post('/reports/${widget.reportId}/unlock');
      _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.toString()), backgroundColor: CuliTheme.critical));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(
      backgroundColor: CuliTheme.bg,
      body: Center(child: CircularProgressIndicator(color: CuliTheme.accent)));
    if (_error != null) return Scaffold(
      backgroundColor: CuliTheme.bg,
      appBar: AppBar(),
      body: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Text(_error!, style: const TextStyle(color: CuliTheme.critical)),
        const SizedBox(height: 16),
        ElevatedButton(onPressed: _load, child: const Text('Retry')),
      ])));

    final r = _report!;
    final stolenData = r.section('STOLEN_REPORTS')?.data;
    final hasStolen  = (stolenData?['activeReports'] as List?)?.isNotEmpty ?? false;

    return Scaffold(
      backgroundColor: CuliTheme.bg,
      body: CustomScrollView(slivers: [
        SliverAppBar(
          pinned: true,
          backgroundColor: CuliTheme.bg,
          title: Text(r.vehicleName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          actions: [
            if (!r.isUnlocked)
              TextButton(
                onPressed: _unlock,
                child: const Text('Unlock', style: TextStyle(color: CuliTheme.accent))),
            const SizedBox(width: 8),
          ],
        ),
        SliverToBoxAdapter(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover photo
            _CoverPhoto(report: r),

            // Stolen banner — always free
            if (hasStolen)
              StolenBannerWidget(
                plate: r.vehicle?['plate'] as String? ?? '',
                dateStolen: (stolenData?['activeReports'] as List?)?.firstOrNull?['dateStolenString'] as String?,
                county: (stolenData?['activeReports'] as List?)?.firstOrNull?['countyStolen'] as String?,
              ),

            // Risk header
            _RiskHeader(report: r),

            // 5 section icon cards
            _SectionIconGrid(report: r),

            const Divider(height: 1),

            // NTSA COR fetch
            NtsaFetchWidget(
              vin: r.vin,
              plate: r.vehicle?['plate'] as String? ??
                  r.vehicle?['plateDisplay'] as String? ?? '',
              authToken: null,  // ApiClient handles auth internally via headers
              onSuccess: _load, // reload report after NTSA data added
            ),

            const Divider(height: 1),

            // Identity (free)
            _IdentitySection(report: r),

            // Specs & Equipment (free)
            _SectionBlock(report: r, type: 'SPECS_EQUIPMENT', title: 'Specs & Equipment',
              icon: Icons.settings_rounded,
              child: _SpecsSection(report: r)),

            // Stolen Reports (free)
            _SectionBlock(report: r, type: 'STOLEN_REPORTS', title: 'Stolen Reports',
              icon: Icons.shield_outlined, isFree: true,
              child: _StolenReportsSection(report: r)),

            // Photos
            _SectionBlock(report: r, type: 'PHOTOS', title: 'Photos',
              icon: Icons.photo_library_outlined, isFree: true,
              child: _PhotosSection(report: r)),

            // Purpose
            _SectionBlock(report: r, type: 'PURPOSE', title: 'Vehicle Purpose',
              icon: Icons.business_center_outlined,
              child: PurposeSectionWidget(section: r.section('PURPOSE'))),

            // Theft
            _SectionBlock(report: r, type: 'THEFT', title: 'Theft Check',
              icon: Icons.security_rounded,
              child: _TheftSection(report: r)),

            // Odometer
            _SectionBlock(report: r, type: 'ODOMETER', title: 'Odometer History',
              icon: Icons.speed_rounded,
              child: OdometerSectionWidget(section: r.section('ODOMETER'))),

            // Damage
            _SectionBlock(report: r, type: 'DAMAGE', title: 'Damage Report',
              icon: Icons.car_crash_outlined,
              child: DamageSectionWidget(section: r.section('DAMAGE'))),

            // Legal
            _SectionBlock(report: r, type: 'LEGAL', title: 'Financial & Legal',
              icon: Icons.gavel_rounded,
              child: _LegalSection(report: r)),

            // Service
            _SectionBlock(report: r, type: 'SERVICE', title: 'Service Records',
              icon: Icons.build_outlined,
              child: _ServiceSection(report: r)),

            // Import
            _SectionBlock(report: r, type: 'IMPORT', title: 'Import History',
              icon: Icons.directions_boat_outlined,
              child: _ImportSection(report: r)),

            // Ownership
            _SectionBlock(report: r, type: 'OWNERSHIP', title: 'Ownership History',
              icon: Icons.person_outline_rounded,
              child: _OwnershipSection(report: r)),

            // Timeline
            _SectionBlock(report: r, type: 'TIMELINE', title: 'Event Timeline',
              icon: Icons.timeline_rounded,
              child: _TimelineSection(report: r)),

            // Report stolen CTA
            _ReportStolenCta(vin: r.vin),

            const SizedBox(height: 40),
          ],
        )),
      ]),
    );
  }
}

// ─── Cover Photo ────────────────────────────────────────────────────────────
class _CoverPhoto extends StatelessWidget {
  final Report report;
  const _CoverPhoto({required this.report});

  @override
  Widget build(BuildContext context) {
    final photosData = report.section('PHOTOS')?.data;
    final url = (photosData?['groups'] as List?)?.firstOrNull?['photos']?[0] as String?
        ?? (photosData?['urls'] as List?)?.firstOrNull as String?;

    return SizedBox(
      height: 220,
      width: double.infinity,
      child: url != null
          ? CachedNetworkImage(
              imageUrl: url,
              fit: BoxFit.cover,
              placeholder: (_, __) => const ColoredBox(color: CuliTheme.surface2),
              errorWidget: (_, __, ___) => const _NoPhoto(),
            )
          : const _NoPhoto(),
    );
  }
}

class _NoPhoto extends StatelessWidget {
  const _NoPhoto();
  @override
  Widget build(BuildContext context) => const ColoredBox(
    color: CuliTheme.surface2,
    child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      Text('🚗', style: TextStyle(fontSize: 48)),
      SizedBox(height: 8),
      Text('No photo available', style: TextStyle(color: CuliTheme.textMuted, fontSize: 13)),
    ])),
  );
}

// ─── Risk Header ────────────────────────────────────────────────────────────
class _RiskHeader extends StatelessWidget {
  final Report report;
  const _RiskHeader({required this.report});

  @override
  Widget build(BuildContext context) {
    final color = CuliTheme.riskColor(report.riskLevel);
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(report.vehicleName,
            style: const TextStyle(color: CuliTheme.textPrimary, fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text(report.riskLevel.toUpperCase(),
            style: TextStyle(color: color, fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: 1)),
          Text('${_recLabel(report.recommendation)} · Risk ${report.riskScore}/100',
            style: const TextStyle(color: CuliTheme.textMuted, fontSize: 13)),
        ])),
        Container(
          width: 56, height: 56,
          decoration: BoxDecoration(color: color.withOpacity(0.15), shape: BoxShape.circle),
          child: Center(child: Text('${report.riskScore}',
            style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.w900))),
        ),
      ]),
    );
  }

  String _recLabel(String rec) {
    switch (rec.toLowerCase()) {
      case 'proceed': return '✓ Proceed';
      case 'caution': return '⚠ Caution';
      default:        return '✕ Avoid';
    }
  }
}

// ─── 5 Icon Cards ───────────────────────────────────────────────────────────
class _SectionIconGrid extends StatelessWidget {
  final Report report;
  const _SectionIconGrid({required this.report});

  static const _cards = [
    {'type': 'THEFT',   'label': 'Theft',    'icon': Icons.security_rounded},
    {'type': 'PURPOSE', 'label': 'Purpose',  'icon': Icons.business_center_outlined},
    {'type': 'ODOMETER','label': 'Odometer', 'icon': Icons.speed_rounded},
    {'type': 'LEGAL',   'label': 'Legal',    'icon': Icons.gavel_rounded},
    {'type': 'DAMAGE',  'label': 'Damage',   'icon': Icons.car_crash_outlined},
  ];

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
    child: Row(children: _cards.map((card) {
      final sec = report.section(card['type'] as String);
      final hasIssue = sec?.dataStatus == 'found' && (sec?.recordCount ?? 0) > 0;
      final color = hasIssue ? CuliTheme.medium : CuliTheme.textMuted;
      return Expanded(child: Column(children: [
        Icon(card['icon'] as IconData, color: color, size: 22),
        const SizedBox(height: 4),
        Text(card['label'] as String,
          style: TextStyle(color: color, fontSize: 10), textAlign: TextAlign.center),
        const SizedBox(height: 4),
        Icon(
          hasIssue ? Icons.warning_amber_rounded : Icons.check_circle_outline_rounded,
          color: hasIssue ? CuliTheme.medium : CuliTheme.clean, size: 14,
        ),
      ]));
    }).toList()),
  );
}

// ─── Section Wrapper ────────────────────────────────────────────────────────
class _SectionBlock extends StatelessWidget {
  final Report report;
  final String type;
  final String title;
  final IconData icon;
  final Widget child;
  final bool isFree;
  const _SectionBlock({
    required this.report, required this.type, required this.title,
    required this.icon, required this.child, this.isFree = false,
  });

  @override
  Widget build(BuildContext context) {
    final sec      = report.section(type);
    final isLocked = sec?.isLocked ?? true;
    final unlocked = report.isUnlocked;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(icon, color: CuliTheme.accent, size: 18),
          const SizedBox(width: 8),
          Text(title, style: const TextStyle(
            color: CuliTheme.textPrimary, fontSize: 17, fontWeight: FontWeight.w700)),
          const Spacer(),
          if (isFree || !isLocked)
            const Text('FREE', style: TextStyle(color: CuliTheme.clean, fontSize: 11)),
        ]),
        const SizedBox(height: 12),
        if (isLocked && !unlocked)
          LockedSectionWidget(onUnlock: () => context.push('/credits'))
        else
          child,
      ]),
    );
  }
}

// ─── Identity Section ───────────────────────────────────────────────────────
class _IdentitySection extends StatelessWidget {
  final Report report;
  const _IdentitySection({required this.report});

  @override
  Widget build(BuildContext context) {
    final data = report.section('IDENTITY')?.data ?? report.vehicle ?? {};
    final rows = [
      ['VIN',          report.vin],
      ['Make',         data['make'] ?? report.vehicle?['make'] ?? '—'],
      ['Model',        data['model'] ?? report.vehicle?['model'] ?? '—'],
      ['Year',         (data['year'] ?? report.vehicle?['year'])?.toString() ?? '—'],
      ['Color',        data['color'] ?? report.vehicle?['color'] ?? '—'],
      ['Engine',       data['engineCc'] != null ? '${data['engineCc']}cc' : '—'],
      ['Fuel',         data['fuelType'] ?? '—'],
      ['Transmission', data['transmission'] ?? '—'],
      ['Steering',     data['steering'] ?? 'RHD'],
      ['NTSA COR',     data['ntsaCorVerified'] == true ? 'Verified ✓' : 'Not verified'],
    ];

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Row(children: [
          Icon(Icons.badge_outlined, color: CuliTheme.accent, size: 18),
          SizedBox(width: 8),
          Text('Identity & Specs', style: TextStyle(
            color: CuliTheme.textPrimary, fontSize: 17, fontWeight: FontWeight.w700)),
          Spacer(),
          Text('FREE', style: TextStyle(color: CuliTheme.clean, fontSize: 11)),
        ]),
        const SizedBox(height: 12),
        ...rows.map((row) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Row(children: [
            SizedBox(width: 110, child: Text(row[0],
              style: const TextStyle(color: CuliTheme.textMuted, fontSize: 13))),
            Expanded(child: Text(row[1], style: const TextStyle(
              color: CuliTheme.textPrimary, fontSize: 13,
              fontWeight: FontWeight.w600, fontFamily: 'monospace',
            ))),
          ]),
        )),
      ]),
    );
  }
}

// ─── Specs Section ──────────────────────────────────────────────────────────
class _SpecsSection extends StatelessWidget {
  final Report report;
  const _SpecsSection({required this.report});

  @override
  Widget build(BuildContext context) {
    final data     = report.section('SPECS_EQUIPMENT')?.data ?? {};
    final grade    = data['japanAuctionGrade'] as String? ?? data['specs']?['japanAuctionGrade'] as String?;
    final equipment= (data['equipment'] as List<dynamic>?) ?? [];

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      if (grade != null)
        Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: CuliTheme.accent.withOpacity(0.08),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: CuliTheme.accent.withOpacity(0.2)),
          ),
          child: Row(children: [
            const Icon(Icons.star_rounded, color: CuliTheme.accent, size: 18),
            const SizedBox(width: 8),
            Text('Japan Auction Grade: $grade',
              style: const TextStyle(color: CuliTheme.accent, fontWeight: FontWeight.w700, fontSize: 14)),
          ]),
        ),
      if (equipment.isNotEmpty)
        Wrap(
          spacing: 8, runSpacing: 8,
          children: equipment.take(20).map((e) {
            final eq = e as Map<String, dynamic>;
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFF1E40AF).withOpacity(0.15),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.3)),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(eq['code'] as String? ?? '',
                  style: const TextStyle(color: Color(0xFF60A5FA), fontSize: 11, fontWeight: FontWeight.w800)),
                Text(eq['value'] as String? ?? '',
                  style: const TextStyle(color: CuliTheme.textMuted, fontSize: 11)),
              ]),
            );
          }).toList(),
        )
      else
        const Text('VEHICLE SPECIFICATIONS',
          style: TextStyle(color: CuliTheme.textMuted, fontSize: 12, letterSpacing: 1)),
    ]);
  }
}

// ─── Stolen Reports Section ─────────────────────────────────────────────────
class _StolenReportsSection extends StatelessWidget {
  final Report report;
  const _StolenReportsSection({required this.report});

  @override
  Widget build(BuildContext context) {
    final data    = report.section('STOLEN_REPORTS')?.data ?? {};
    final active  = (data['activeReports'] as List<dynamic>?) ?? [];
    final checked = (data['databasesChecked'] as List<dynamic>?) ?? [];

    if (active.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: CuliTheme.clean.withOpacity(0.06),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: CuliTheme.clean.withOpacity(0.2)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Row(children: [
            Icon(Icons.check_circle_outline, color: CuliTheme.clean, size: 18),
            SizedBox(width: 8),
            Text('No stolen reports for this vehicle',
              style: TextStyle(color: CuliTheme.clean, fontWeight: FontWeight.w600, fontSize: 14)),
          ]),
          if (checked.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text('Checked: ${checked.join(', ')}',
              style: const TextStyle(color: CuliTheme.textMuted, fontSize: 12)),
          ],
        ]),
      );
    }
    return StolenBannerWidget(
      plate: active.first['plate'] as String? ?? '',
      dateStolen: active.first['dateStolenString'] as String?,
      county: active.first['countyStolen'] as String?,
      obNumber: active.first['policeObNumber'] as String?,
    );
  }
}

// ─── Photos Section ─────────────────────────────────────────────────────────


class _PhotosSection extends StatelessWidget {
  final Report report;
  const _PhotosSection({required this.report});

  @override
  Widget build(BuildContext context) {
    final data   = report.section('PHOTOS')?.data ?? {};
    final groups = (data['groups'] as List<dynamic>?) ?? [];
    if (groups.isEmpty) return const Text('No photos available.',
        style: TextStyle(color: CuliTheme.textMuted));

    // Collect all photo URLs across all groups for the viewer
    final allPhotos = groups
        .expand((g) => ((g as Map<String, dynamic>)['photos'] as List<dynamic>?)?.cast<String>() ?? <String>[])
        .toList();

    int globalIndex = 0;

    return Column(crossAxisAlignment: CrossAxisAlignment.start,
      children: groups.map((g) {
        final group  = g as Map<String, dynamic>;
        final date   = group['date'] as String? ?? '';
        final source = group['source'] as String? ?? '';
        final photos = (group['photos'] as List<dynamic>?)?.cast<String>() ?? [];
        final startIndex = globalIndex;
        globalIndex += photos.length;

        return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Group header
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: CuliTheme.surface2,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: CuliTheme.border),
                ),
                child: Text(date, style: const TextStyle(
                    color: CuliTheme.accent, fontWeight: FontWeight.w700, fontSize: 12)),
              ),
              const SizedBox(width: 8),
              Text('${photos.length} photo${photos.length != 1 ? 's' : ''}',
                  style: const TextStyle(color: CuliTheme.textMuted, fontSize: 12)),
              const SizedBox(width: 6),
              Text('· $source',
                  style: const TextStyle(color: CuliTheme.textMuted, fontSize: 12)),
            ]),
          ),

          // Photo grid — tappable
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 3,
            crossAxisSpacing: 6,
            mainAxisSpacing: 6,
            children: photos.asMap().entries.map((e) {
              final photoIndex = startIndex + e.key;
              return GestureDetector(
                onTap: () => PhotoViewer.show(context, allPhotos, initialIndex: photoIndex),
                child: Hero(
                  tag: 'photo_$photoIndex',
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Stack(fit: StackFit.expand, children: [
                      CachedNetworkImage(
                        imageUrl: e.value,
                        fit: BoxFit.cover,
                        placeholder: (_, __) => const ColoredBox(color: CuliTheme.surface2),
                        errorWidget: (_, __, ___) => const ColoredBox(
                            color: CuliTheme.surface2,
                            child: Center(child: Icon(Icons.broken_image_outlined,
                                color: CuliTheme.textMuted))),
                      ),
                      // Tap overlay hint
                      Positioned(
                        right: 4, bottom: 4,
                        child: Container(
                          padding: const EdgeInsets.all(3),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.5),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Icon(Icons.zoom_in_rounded,
                              color: Colors.white, size: 12),
                        ),
                      ),
                    ]),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),
        ]);
      }).toList(),
    );
  }
}

// ─── Theft Section ──────────────────────────────────────────────────────────
class _TheftSection extends StatelessWidget {
  final Report report;
  const _TheftSection({required this.report});

  @override
  Widget build(BuildContext context) {
    final checks = (report.section('THEFT')?.data?['checks'] as List<dynamic>?) ?? [];
    if (checks.isEmpty) return const Text('No theft data.', style: TextStyle(color: CuliTheme.textMuted));
    return Column(children: checks.map((c) {
      final check = c as Map<String, dynamic>;
      final found = check['found'] as bool? ?? false;
      return Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: found ? CuliTheme.critical.withOpacity(0.08) : CuliTheme.surface2,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: found ? CuliTheme.critical.withOpacity(0.3) : CuliTheme.border),
        ),
        child: Row(children: [
          Icon(
            found ? Icons.warning_rounded : Icons.check_circle_outline_rounded,
            color: found ? CuliTheme.critical : CuliTheme.clean, size: 18,
          ),
          const SizedBox(width: 12),
          Expanded(child: Text(check['label'] as String? ?? '',
            style: TextStyle(
              color: found ? CuliTheme.textPrimary : CuliTheme.textMuted,
              fontSize: 14, fontWeight: found ? FontWeight.w600 : FontWeight.normal,
            ))),
          Text(found ? 'FOUND' : 'NONE', style: TextStyle(
            color: found ? CuliTheme.critical : CuliTheme.textMuted,
            fontSize: 11, fontWeight: FontWeight.w700,
          )),
        ]),
      );
    }).toList());
  }
}

// ─── Legal Section ──────────────────────────────────────────────────────────
class _LegalSection extends StatelessWidget {
  final Report report;
  const _LegalSection({required this.report});

  @override
  Widget build(BuildContext context) {
    final data  = report.section('LEGAL')?.data ?? {};
    final fin   = (data['financialRestrictions'] as List<dynamic>?) ?? [];
    final legal = (data['legal'] as List<dynamic>?) ?? [];
    final all   = [...fin, ...legal];
    if (all.isEmpty) return const Text('No legal data.', style: TextStyle(color: CuliTheme.textMuted));
    return Column(children: all.map((item) {
      final it     = item as Map<String, dynamic>;
      final status = it['status'] as String? ?? 'unknown';
      final isOk   = ['clear', 'passed', 'cleared'].contains(status.toLowerCase());
      return Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isOk ? CuliTheme.surface2 : CuliTheme.medium.withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isOk ? CuliTheme.border : CuliTheme.medium.withOpacity(0.3)),
        ),
        child: Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(it['label'] as String? ?? '',
              style: const TextStyle(color: CuliTheme.textPrimary, fontSize: 14)),
            if (it['detail'] != null)
              Text(it['detail'] as String,
                style: const TextStyle(color: CuliTheme.textMuted, fontSize: 12)),
          ])),
          const SizedBox(width: 8),
          Text(status.toUpperCase(), style: TextStyle(
            color: isOk ? CuliTheme.clean : CuliTheme.medium,
            fontSize: 11, fontWeight: FontWeight.w700,
          )),
        ]),
      );
    }).toList());
  }
}

// ─── Service Section ────────────────────────────────────────────────────────
class _ServiceSection extends StatelessWidget {
  final Report report;
  const _ServiceSection({required this.report});

  @override
  Widget build(BuildContext context) {
    final records = (report.section('SERVICE')?.data?['records'] as List<dynamic>?) ?? [];
    if (records.isEmpty) return const Text('No service records.',
      style: TextStyle(color: CuliTheme.textMuted));
    return Column(children: records.map((r) {
      final rec = r as Map<String, dynamic>;
      return Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: CuliTheme.surface2, borderRadius: BorderRadius.circular(12),
          border: Border.all(color: CuliTheme.border)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const Icon(Icons.build_outlined, color: CuliTheme.textMuted, size: 16),
            const SizedBox(width: 8),
            Text(rec['garage'] as String? ?? '—',
              style: const TextStyle(color: CuliTheme.textPrimary, fontWeight: FontWeight.w600, fontSize: 14)),
            const Spacer(),
            Text(rec['date'] as String? ?? '',
              style: const TextStyle(color: CuliTheme.textMuted, fontSize: 12)),
          ]),
          if (rec['mileage'] != null)
            Padding(padding: const EdgeInsets.only(top: 4),
              child: Text('${_fmt(rec['mileage'] as int)} km',
                style: const TextStyle(color: CuliTheme.accent, fontSize: 13, fontWeight: FontWeight.w600))),
          if (rec['work'] != null)
            Padding(padding: const EdgeInsets.only(top: 6),
              child: Text(rec['work'] as String,
                style: const TextStyle(color: CuliTheme.textMuted, fontSize: 12, height: 1.4))),
        ]),
      );
    }).toList());
  }

  String _fmt(int n) =>
      n.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
}

// ─── Import Section ─────────────────────────────────────────────────────────
class _ImportSection extends StatelessWidget {
  final Report report;
  const _ImportSection({required this.report});

  @override
  Widget build(BuildContext context) {
    final data = report.section('IMPORT')?.data;
    if (data == null) return const Text('No import data.', style: TextStyle(color: CuliTheme.textMuted));
    final rows = [
      ['Origin',      data['originCountry'] as String? ?? '—'],
      ['Import Date', data['importDate'] as String? ?? '—'],
      ['Port',        data['port'] as String? ?? '—'],
      ['KRA Cleared', data['kraCleared'] == true ? 'Yes ✓' : 'No'],
      ['Auction',     data['auctionHouse'] as String? ?? '—'],
      ['Grade',       data['japanAuctionGrade'] as String? ?? '—'],
      ['Auction KM',  data['japanAuctionMileage'] != null ? '${data['japanAuctionMileage']} km' : '—'],
    ];
    return Column(children: rows.map((row) => Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(children: [
        SizedBox(width: 100, child: Text(row[0],
          style: const TextStyle(color: CuliTheme.textMuted, fontSize: 13))),
        Expanded(child: Text(row[1], style: const TextStyle(
          color: CuliTheme.textPrimary, fontSize: 13, fontWeight: FontWeight.w600))),
      ]),
    )).toList());
  }
}

// ─── Ownership Section ──────────────────────────────────────────────────────
class _OwnershipSection extends StatelessWidget {
  final Report report;
  const _OwnershipSection({required this.report});

  @override
  Widget build(BuildContext context) {
    final data    = report.section('OWNERSHIP')?.data;
    final total   = data?['totalTransfers'] as int? ?? 0;
    final history = (data?['history'] as List<dynamic>?) ?? [];
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('$total ownership transfer${total != 1 ? 's' : ''}',
        style: const TextStyle(color: CuliTheme.textPrimary, fontWeight: FontWeight.w600, fontSize: 15)),
      const SizedBox(height: 12),
      ...history.map((h) {
        final hi = h as Map<String, dynamic>;
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(children: [
            const Icon(Icons.circle, color: CuliTheme.accent, size: 8),
            const SizedBox(width: 12),
            Text(hi['period'] as String? ?? '',
              style: const TextStyle(color: CuliTheme.textMuted, fontSize: 13)),
            const SizedBox(width: 8),
            Text(hi['county'] as String? ?? '',
              style: const TextStyle(color: CuliTheme.textPrimary, fontSize: 13)),
            const SizedBox(width: 8),
            if (hi['type'] != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: CuliTheme.surface2, borderRadius: BorderRadius.circular(8)),
                child: Text(hi['type'] as String,
                  style: const TextStyle(color: CuliTheme.textMuted, fontSize: 11)),
              ),
          ]),
        );
      }),
    ]);
  }
}

// ─── Timeline Section ────────────────────────────────────────────────────────
class _TimelineSection extends StatelessWidget {
  final Report report;
  const _TimelineSection({required this.report});

  static const _eventIcons = {
    'MANUFACTURED': ('🏭', 'Manufactured'),
    'REGISTERED':   ('📋', 'Registered'),
    'INSPECTED':    ('🔍', 'Inspected'),
    'SERVICED':     ('⚙️', 'Serviced'),
    'IMPORTED':     ('🚢', 'Imported'),
    'EXPORTED':     ('✈️', 'Exported'),
    'AUCTIONED':    ('🏷️', 'Auctioned'),
    'OWNERSHIP_CHANGE': ('👤', 'Ownership Change'),
    'LISTED_FOR_SALE':  ('📦', 'Listed for Sale'),
    'DAMAGED':      ('💥', 'Damage Recorded'),
    'STOLEN':       ('🚨', 'Reported Stolen'),
    'RECOVERED':    ('✓', 'Recovered'),
    'PSV_LICENSED': ('🚌', 'PSV Licensed'),
    'KRA_CLEARED':  ('🏛️', 'KRA Cleared'),
  };

  @override
  Widget build(BuildContext context) {
    final data   = report.section('TIMELINE')?.data ?? {};
    final events = data['events'];
    if (events == null || events is! List || (events).isEmpty) {
      return const Text('No timeline events.', style: TextStyle(color: CuliTheme.textMuted));
    }
    final sorted = List<Map<String, dynamic>>.from(events.cast<Map<String, dynamic>>())
      ..sort((a, b) {
        final da = DateTime.tryParse(a['eventDate'] as String? ?? '');
        final db = DateTime.tryParse(b['eventDate'] as String? ?? '');
        if (da == null || db == null) return 0;
        return db.compareTo(da);
      });

    return Column(children: sorted.map((ev) {
      final type   = ev['eventType'] as String? ?? '';
      final meta   = _eventIcons[type] ?? ('●', type.replaceAll('_', ' '));
      final date   = ev['eventDate'] as String? ?? '';
      final county = ev['county'] as String?;
      return Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Column(children: [
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                color: CuliTheme.surface2, borderRadius: BorderRadius.circular(8)),
              child: Center(child: Text(meta.$1, style: const TextStyle(fontSize: 16))),
            ),
            Container(width: 1, height: 20, color: CuliTheme.border),
          ]),
          const SizedBox(width: 12),
          Expanded(child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: CuliTheme.surface2, borderRadius: BorderRadius.circular(12),
              border: Border.all(color: CuliTheme.border)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(meta.$2, style: const TextStyle(
                color: CuliTheme.textPrimary, fontWeight: FontWeight.w600, fontSize: 14)),
              const SizedBox(height: 4),
              Row(children: [
                Text(date, style: const TextStyle(color: CuliTheme.textMuted, fontSize: 12, fontFamily: 'monospace')),
                if (county != null) ...[
                  const SizedBox(width: 8),
                  Text('📍 $county', style: const TextStyle(color: CuliTheme.textMuted, fontSize: 12)),
                ],
              ]),
            ]),
          )),
        ]),
      );
    }).toList());
  }
}

// ─── Report Stolen CTA ──────────────────────────────────────────────────────
class _ReportStolenCta extends StatelessWidget {
  final String vin;
  const _ReportStolenCta({required this.vin});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(16),
    child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: CuliTheme.surface, borderRadius: BorderRadius.circular(16),
        border: Border.all(color: CuliTheme.border)),
      child: Row(children: [
        const Icon(Icons.report_outlined, color: CuliTheme.textMuted, size: 20),
        const SizedBox(width: 12),
        const Expanded(child: Text('Know this vehicle is stolen?',
          style: TextStyle(color: CuliTheme.textMuted, fontSize: 13))),
        TextButton(
          onPressed: () => context.push('/report-stolen?vin=$vin'),
          child: const Text('Report', style: TextStyle(color: CuliTheme.accent))),
      ]),
    ),
  );
}
