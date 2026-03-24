// lib/features/report/widgets/damage_section_widget.dart
import 'package:flutter/material.dart';
import '../../../config/theme.dart';
import '../../../shared/models/report.dart';

// Damage dot positions as fractions of the car silhouette (width x height)
const _dotPositions = {
  'front':        Offset(0.50, 0.08),
  'front-right':  Offset(0.78, 0.14),
  'front-left':   Offset(0.22, 0.14),
  'rear':         Offset(0.50, 0.92),
  'rear-right':   Offset(0.78, 0.86),
  'rear-left':    Offset(0.22, 0.86),
  'left':         Offset(0.08, 0.50),
  'right':        Offset(0.92, 0.50),
  'roof':         Offset(0.50, 0.40),
  'underbody':    Offset(0.50, 0.60),
  'hood':         Offset(0.50, 0.18),
  'trunk':        Offset(0.50, 0.82),
  'door-left':    Offset(0.12, 0.45),
  'door-right':   Offset(0.88, 0.45),
  'bumper-front': Offset(0.50, 0.05),
  'bumper-rear':  Offset(0.50, 0.95),
};

Offset _resolvePosition(String location) {
  final loc = location.toLowerCase().replaceAll(' ', '-').replaceAll('/', '-');
  // Try exact match first
  for (final key in _dotPositions.keys) {
    if (loc.contains(key)) return _dotPositions[key]!;
  }
  // Fallback by keywords
  if (loc.contains('front')) return _dotPositions['front']!;
  if (loc.contains('rear') || loc.contains('trunk') || loc.contains('boot')) return _dotPositions['rear']!;
  if (loc.contains('roof')) return _dotPositions['roof']!;
  if (loc.contains('left')) return _dotPositions['left']!;
  if (loc.contains('right')) return _dotPositions['right']!;
  return const Offset(0.50, 0.50);
}

class _CarSilhouettePainter extends CustomPainter {
  final List<Map<String, dynamic>> incidents;
  _CarSilhouettePainter(this.incidents);

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Body paint
    final bodyPaint = Paint()
      ..color = const Color(0xFF1E2330)
      ..style = PaintingStyle.fill;
    final borderPaint = Paint()
      ..color = const Color(0xFF2D3748)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    // Car body outline (top-down view)
    final bodyPath = Path();
    bodyPath.moveTo(w * 0.25, h * 0.02);
    bodyPath.quadraticBezierTo(w * 0.50, h * 0.00, w * 0.75, h * 0.02);
    bodyPath.quadraticBezierTo(w * 0.95, h * 0.05, w * 0.97, h * 0.20);
    bodyPath.lineTo(w * 0.97, h * 0.80);
    bodyPath.quadraticBezierTo(w * 0.95, h * 0.95, w * 0.75, h * 0.98);
    bodyPath.quadraticBezierTo(w * 0.50, h * 1.00, w * 0.25, h * 0.98);
    bodyPath.quadraticBezierTo(w * 0.05, h * 0.95, w * 0.03, h * 0.80);
    bodyPath.lineTo(w * 0.03, h * 0.20);
    bodyPath.quadraticBezierTo(w * 0.05, h * 0.05, w * 0.25, h * 0.02);
    bodyPath.close();

    canvas.drawPath(bodyPath, bodyPaint);
    canvas.drawPath(bodyPath, borderPaint);

    // Windshield (front)
    final glassPaint = Paint()
      ..color = const Color(0xFF0D1117)
      ..style = PaintingStyle.fill;
    final windshield = Path();
    windshield.moveTo(w * 0.28, h * 0.06);
    windshield.lineTo(w * 0.72, h * 0.06);
    windshield.quadraticBezierTo(w * 0.82, h * 0.08, w * 0.84, h * 0.22);
    windshield.lineTo(w * 0.16, h * 0.22);
    windshield.quadraticBezierTo(w * 0.18, h * 0.08, w * 0.28, h * 0.06);
    windshield.close();
    canvas.drawPath(windshield, glassPaint);
    canvas.drawPath(windshield, borderPaint);

    // Rear window
    final rearWindow = Path();
    rearWindow.moveTo(w * 0.28, h * 0.94);
    rearWindow.lineTo(w * 0.72, h * 0.94);
    rearWindow.quadraticBezierTo(w * 0.82, h * 0.92, w * 0.84, h * 0.78);
    rearWindow.lineTo(w * 0.16, h * 0.78);
    rearWindow.quadraticBezierTo(w * 0.18, h * 0.92, w * 0.28, h * 0.94);
    rearWindow.close();
    canvas.drawPath(rearWindow, glassPaint);
    canvas.drawPath(rearWindow, borderPaint);

    // Roof panel
    final roofPaint = Paint()
      ..color = const Color(0xFF161B27)
      ..style = PaintingStyle.fill;
    final roof = RRect.fromRectAndRadius(
      Rect.fromLTWH(w * 0.18, h * 0.28, w * 0.64, h * 0.44),
      const Radius.circular(8),
    );
    canvas.drawRRect(roof, roofPaint);
    canvas.drawRRect(roof, borderPaint);

    // Wheels (4 corners)
    final wheelPaint = Paint()
      ..color = const Color(0xFF0A0C10)
      ..style = PaintingStyle.fill;
    final wheelBorder = Paint()
      ..color = const Color(0xFF2D3748)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    final wheels = [
      RRect.fromRectAndRadius(Rect.fromLTWH(w * 0.00, h * 0.10, w * 0.14, h * 0.16), const Radius.circular(4)),
      RRect.fromRectAndRadius(Rect.fromLTWH(w * 0.86, h * 0.10, w * 0.14, h * 0.16), const Radius.circular(4)),
      RRect.fromRectAndRadius(Rect.fromLTWH(w * 0.00, h * 0.74, w * 0.14, h * 0.16), const Radius.circular(4)),
      RRect.fromRectAndRadius(Rect.fromLTWH(w * 0.86, h * 0.74, w * 0.14, h * 0.16), const Radius.circular(4)),
    ];
    for (final wheel in wheels) {
      canvas.drawRRect(wheel, wheelPaint);
      canvas.drawRRect(wheel, wheelBorder);
    }

    // Center line
    final linePaint = Paint()
      ..color = const Color(0xFF2D3748)
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;
    canvas.drawLine(Offset(w * 0.50, h * 0.02), Offset(w * 0.50, h * 0.98), linePaint);

    // Damage dots
    for (int i = 0; i < incidents.length; i++) {
      final inc = incidents[i];
      final severe = (inc['severity'] as String? ?? '').contains('severe');
      final color = severe ? CuliTheme.critical : CuliTheme.medium;
      final pos = _resolvePosition(inc['location'] as String? ?? '');
      final cx = pos.dx * w;
      final cy = pos.dy * h;

      // Glow ring
      canvas.drawCircle(
        Offset(cx, cy),
        severe ? 16 : 12,
        Paint()..color = color.withOpacity(0.2),
      );
      // Main dot
      canvas.drawCircle(
        Offset(cx, cy),
        severe ? 9 : 7,
        Paint()..color = color.withOpacity(0.9),
      );
      // Number
      final tp = TextPainter(
        text: TextSpan(
          text: '${i + 1}',
          style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
        ),
        textDirection: TextDirection.ltr,
      )..layout();
      tp.paint(canvas, Offset(cx - tp.width / 2, cy - tp.height / 2));
    }
  }

  @override
  bool shouldRepaint(_CarSilhouettePainter old) => old.incidents != incidents;
}

class DamageSectionWidget extends StatelessWidget {
  final ReportSection? section;
  const DamageSectionWidget({super.key, this.section});

  @override
  Widget build(BuildContext context) {
    final incidents = (section?.data?['incidents'] as List<dynamic>?)
        ?.cast<Map<String, dynamic>>() ?? [];

    if (incidents.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: CuliTheme.clean.withOpacity(0.06),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: CuliTheme.clean.withOpacity(0.2)),
        ),
        child: const Row(children: [
          Icon(Icons.check_circle_outline_rounded, color: CuliTheme.clean, size: 18),
          SizedBox(width: 10),
          Text('No damage records found',
              style: TextStyle(color: CuliTheme.clean, fontSize: 14)),
        ]),
      );
    }

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Summary banner
      if (incidents.any((i) => (i['severity'] as String? ?? '').contains('severe')))
        Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: CuliTheme.critical.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: CuliTheme.critical.withOpacity(0.3)),
          ),
          child: const Row(children: [
            Icon(Icons.warning_rounded, color: CuliTheme.critical, size: 18),
            SizedBox(width: 8),
            Expanded(child: Text(
                'Severe damage can leave structural issues making vehicle unsafe to drive!',
                style: TextStyle(color: CuliTheme.critical, fontSize: 12, height: 1.4))),
          ]),
        ),

      // Car diagram + legend
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Diagram
        Column(children: [
          const Text('Damage locations',
              style: TextStyle(color: CuliTheme.textMuted, fontSize: 11)),
          const SizedBox(height: 8),
          SizedBox(
            width: 130,
            height: 200,
            child: CustomPaint(
              painter: _CarSilhouettePainter(incidents),
            ),
          ),
          const SizedBox(height: 8),
          Row(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 10, height: 10,
                decoration: const BoxDecoration(color: CuliTheme.medium, shape: BoxShape.circle)),
            const SizedBox(width: 4),
            const Text('Damage', style: TextStyle(color: CuliTheme.textMuted, fontSize: 10)),
            const SizedBox(width: 10),
            Container(width: 10, height: 10,
                decoration: const BoxDecoration(color: CuliTheme.critical, shape: BoxShape.circle)),
            const SizedBox(width: 4),
            const Text('Severe', style: TextStyle(color: CuliTheme.textMuted, fontSize: 10)),
          ]),
        ]),

        const SizedBox(width: 16),

        // Incident cards
        Expanded(child: Column(children: incidents.asMap().entries.map((e) {
          final i = e.value;
          final severe = (i['severity'] as String? ?? '').contains('severe');
          final color = severe ? CuliTheme.critical : CuliTheme.medium;
          final cost = i['costRangeKes'] as String?
              ?? (i['costRangeMin'] != null && i['costRangeMax'] != null
                  ? 'KSh ${_fmt(i['costRangeMin'] as int)} – KSh ${_fmt(i['costRangeMax'] as int)}'
                  : null);

          return Container(
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withOpacity(0.08),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: color.withOpacity(0.3)),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Container(
                  width: 22, height: 22,
                  decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                  child: Center(child: Text('${e.key + 1}',
                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold))),
                ),
                const SizedBox(width: 8),
                Expanded(child: Text(i['location'] as String? ?? 'Unknown',
                    style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 13))),
              ]),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                    color: color.withOpacity(0.2), borderRadius: BorderRadius.circular(20)),
                child: Text(severe ? '⚠ Severe damage' : '▲ Damage',
                    style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w700)),
              ),
              if (cost != null) ...[
                const SizedBox(height: 6),
                Text(cost, style: const TextStyle(
                    color: CuliTheme.textPrimary, fontWeight: FontWeight.w600, fontSize: 13)),
                const Text('est. repair', style: TextStyle(color: CuliTheme.textMuted, fontSize: 10)),
              ],
              if (i['date'] != null || i['county'] != null)
                Padding(padding: const EdgeInsets.only(top: 6),
                    child: Text(
                        [if (i['date'] != null) '📅 ${i['date']}', if (i['county'] != null) '📍 ${i['county']}'].join('  '),
                        style: const TextStyle(color: CuliTheme.textMuted, fontSize: 11))),
              if (severe)
                const Padding(padding: EdgeInsets.only(top: 6),
                    child: Text('⚠ Structural damage risk — get mechanical inspection',
                        style: TextStyle(color: Color(0xFFFB923C), fontSize: 10, height: 1.3))),
            ]),
          );
        }).toList())),
      ]),
    ]);
  }

  String _fmt(int n) => n.toString()
      .replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (m) => '${m[1]},');
}