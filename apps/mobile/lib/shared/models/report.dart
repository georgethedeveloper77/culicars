// lib/shared/models/report.dart
class ReportSection {
  final String id;
  final String sectionType;
  final bool isLocked;
  final int recordCount;
  final String dataStatus;
  final Map<String, dynamic>? data;

  const ReportSection({
    required this.id,
    required this.sectionType,
    required this.isLocked,
    required this.recordCount,
    required this.dataStatus,
    this.data,
  });

  factory ReportSection.fromJson(Map<String, dynamic> j) => ReportSection(
    id: j['id'] as String? ?? '',
    sectionType: j['sectionType'] as String,
    isLocked: j['isLocked'] as bool? ?? true,
    recordCount: j['recordCount'] as int? ?? 0,
    dataStatus: j['dataStatus'] as String? ?? 'not_checked',
    data: j['data'] as Map<String, dynamic>?,
  );
}

class Report {
  final String id;
  final String vin;
  final String status;
  final int riskScore;
  final String riskLevel;
  final String recommendation;
  final int sourcesChecked;
  final int recordsFound;
  final Map<String, dynamic>? vehicle;
  final List<ReportSection> sections;
  final bool isUnlocked;

  const Report({
    required this.id,
    required this.vin,
    required this.status,
    required this.riskScore,
    required this.riskLevel,
    required this.recommendation,
    required this.sourcesChecked,
    required this.recordsFound,
    this.vehicle,
    this.sections = const [],
    this.isUnlocked = false,
  });

  factory Report.fromJson(Map<String, dynamic> j) => Report(
    id: j['id'] as String,
    vin: j['vin'] as String,
    status: j['status'] as String? ?? 'draft',
    riskScore: j['riskScore'] as int? ?? 0,
    riskLevel: j['riskLevel'] as String? ?? 'clean',
    recommendation: j['recommendation'] as String? ?? 'proceed',
    sourcesChecked: j['sourcesChecked'] as int? ?? 0,
    recordsFound: j['recordsFound'] as int? ?? 0,
    vehicle: j['vehicle'] as Map<String, dynamic>?,
    sections: (j['sections'] as List<dynamic>?)
        ?.map((s) => ReportSection.fromJson(s as Map<String, dynamic>))
        .toList() ?? [],
    isUnlocked: j['isUnlocked'] as bool? ?? false,
  );

  String get vehicleName {
    if (vehicle == null) return vin;
    final y = vehicle!['year'];
    final mk = vehicle!['make'];
    final mo = vehicle!['model'];
    return [y?.toString(), mk, mo].where((s) => s != null).join(' ');
  }

  ReportSection? section(String type) =>
      sections.where((s) => s.sectionType == type).firstOrNull;
}
