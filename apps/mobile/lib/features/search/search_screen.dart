// lib/features/search/search_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../core/api/api_client.dart';
import '../../core/storage/secure_storage.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _ctrl = TextEditingController();
  final _api  = ApiClient();
  bool _loading = false;
  String? _error;
  List<Map<String, dynamic>> _candidates = [];
  Map<String, dynamic>? _stolenAlert;
  bool _searched = false;

  @override
  void initState() {
    super.initState();
    SecureStorage.getLastSearch().then((q) {
      if (q != null && q.isNotEmpty) _ctrl.text = q;
    });
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  Future<void> _search() async {
    final q = _ctrl.text.trim();
    if (q.isEmpty) return;
    await SecureStorage.setLastSearch(q);
    setState(() { _loading = true; _error = null; _candidates = []; _stolenAlert = null; _searched = false; });
    try {
      final data = await _api.get('/search', params: {'q': q}) as Map<String, dynamic>;
      setState(() {
        _candidates = (data['candidates'] as List<dynamic>?)
            ?.cast<Map<String, dynamic>>() ?? [];
        _stolenAlert = data['stolenAlert'] as Map<String, dynamic>?;
        _searched = true;
      });
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: CuliTheme.bg,
    appBar: AppBar(
      title: const Text('Search Vehicles'),
      actions: [
        IconButton(
          icon: const Icon(Icons.camera_alt_outlined),
          onPressed: () async {
            final result = await context.push<String>('/search/ocr');
            if (result != null && result.isNotEmpty) {
              _ctrl.text = result;
              _search();
            }
          },
        ),
      ],
    ),
    body: Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
        child: Row(children: [
          Expanded(
            child: TextField(
              controller: _ctrl,
              textCapitalization: TextCapitalization.characters,
              onSubmitted: (_) => _search(),
              decoration: const InputDecoration(
                hintText: 'KCA 123A or VIN…',
                prefixIcon: Icon(Icons.search, color: CuliTheme.textMuted),
              ),
            ),
          ),
          const SizedBox(width: 12),
          ElevatedButton(
            onPressed: _loading ? null : _search,
            style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14)),
            child: _loading
                ? const SizedBox(width: 18, height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                : const Text('Search'),
          ),
        ]),
      ),
      Expanded(
        child: ListView(
          padding: const EdgeInsets.only(top: 12, bottom: 20),
          children: [
            // Stolen alert
            if (_stolenAlert?['active'] == true)
              _StolenBanner(
                plate: _ctrl.text.trim().toUpperCase(),
                date: _stolenAlert!['date'] as String?,
                county: _stolenAlert!['county'] as String?,
                obNumber: _stolenAlert!['obNumber'] as String?,
              ),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Text(_error!, style: const TextStyle(color: CuliTheme.critical, fontSize: 14)),
              ),
            if (_searched && _candidates.isEmpty && _error == null)
              const Padding(
                padding: EdgeInsets.all(40),
                child: Column(children: [
                  Icon(Icons.search_off_rounded, color: CuliTheme.textMuted, size: 48),
                  SizedBox(height: 16),
                  Text('No vehicles found', style: TextStyle(
                    color: CuliTheme.textPrimary, fontSize: 18, fontWeight: FontWeight.w600,
                  )),
                  SizedBox(height: 8),
                  Text('Try a different plate format or VIN',
                    style: TextStyle(color: CuliTheme.textMuted), textAlign: TextAlign.center),
                ]),
              ),
            ..._candidates.map((c) => _CandidateCard(
              candidate: c,
              onTap: () {
                final reportId = c['reportId'] as String?;
                final vin = c['vin'] as String;
                if (reportId != null) {
                  context.push('/report/$reportId');
                } else {
                  context.push('/report-preview/$vin');
                }
              },
            )),
            if (!_searched)
              Padding(
                padding: const EdgeInsets.all(32),
                child: Column(children: [
                  const Icon(Icons.camera_alt_outlined, color: CuliTheme.textMuted, size: 48),
                  const SizedBox(height: 16),
                  const Text('Scan a plate or logbook', style: TextStyle(
                    color: CuliTheme.textPrimary, fontSize: 17, fontWeight: FontWeight.w600,
                  )),
                  const SizedBox(height: 8),
                  const Text('Use the camera icon to auto-extract the plate',
                    style: TextStyle(color: CuliTheme.textMuted), textAlign: TextAlign.center),
                  const SizedBox(height: 24),
                  OutlinedButton.icon(
                    icon: const Icon(Icons.camera_alt_outlined, color: CuliTheme.accent),
                    label: const Text('Open Camera', style: TextStyle(color: CuliTheme.accent)),
                    style: OutlinedButton.styleFrom(side: const BorderSide(color: CuliTheme.accent)),
                    onPressed: () => context.push('/search/ocr'),
                  ),
                ]),
              ),
          ],
        ),
      ),
    ]),
  );
}

class _StolenBanner extends StatelessWidget {
  final String plate;
  final String? date;
  final String? county;
  final String? obNumber;
  const _StolenBanner({required this.plate, this.date, this.county, this.obNumber});

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
        const Expanded(child: Text('STOLEN VEHICLE ALERT',
          style: TextStyle(color: CuliTheme.stolenRed, fontSize: 13,
              fontWeight: FontWeight.w800, letterSpacing: 0.5))),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(color: CuliTheme.stolenRed, borderRadius: BorderRadius.circular(20)),
          child: const Text('FREE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800)),
        ),
      ]),
      const SizedBox(height: 10),
      Text('$plate was reported stolen.',
        style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
      if (date != null || county != null)
        Padding(
          padding: const EdgeInsets.only(top: 4),
          child: Text([if (date != null) date!, if (county != null) county!].join(' · '),
            style: const TextStyle(color: CuliTheme.textMuted, fontSize: 12)),
        ),
      if (obNumber != null)
        Padding(
          padding: const EdgeInsets.only(top: 2),
          child: Text('OB: $obNumber ✓ Verified',
            style: const TextStyle(color: CuliTheme.stolenRed, fontSize: 12, fontWeight: FontWeight.w600)),
        ),
    ]),
  );
}

class _CandidateCard extends StatelessWidget {
  final Map<String, dynamic> candidate;
  final VoidCallback onTap;
  const _CandidateCard({required this.candidate, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final vehicle = candidate['vehicle'] as Map<String, dynamic>?;
    final plate   = candidate['plateDisplay'] as String? ?? candidate['plate'] as String?;
    final vin     = candidate['vin'] as String;
    final conf    = ((candidate['confidence'] as num?) ?? 0.5).toDouble();
    final name    = vehicle != null
        ? [vehicle['year']?.toString(), vehicle['make'], vehicle['model']]
            .where((s) => s != null).join(' ')
        : 'Unknown Vehicle';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: CuliTheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: CuliTheme.border),
        ),
        child: Row(children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              color: CuliTheme.accent.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.directions_car_outlined, color: CuliTheme.accent, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(name, style: const TextStyle(
              color: CuliTheme.textPrimary, fontSize: 15, fontWeight: FontWeight.w600)),
            const SizedBox(height: 3),
            Row(children: [
              if (plate != null) ...[
                Text(plate, style: const TextStyle(
                  color: CuliTheme.accent, fontFamily: 'monospace',
                  fontSize: 13, fontWeight: FontWeight.w700)),
                const SizedBox(width: 8),
              ],
              Flexible(child: Text(vin, style: const TextStyle(
                color: CuliTheme.textMuted, fontFamily: 'monospace', fontSize: 11),
                overflow: TextOverflow.ellipsis)),
            ]),
          ])),
          const SizedBox(width: 8),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            const Icon(Icons.chevron_right, color: CuliTheme.textMuted),
            Text('${(conf * 100).toStringAsFixed(0)}%',
              style: const TextStyle(color: CuliTheme.textMuted, fontSize: 11)),
          ]),
        ]),
      ),
    );
  }
}
