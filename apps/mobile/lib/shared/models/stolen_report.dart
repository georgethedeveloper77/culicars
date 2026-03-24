// lib/shared/models/stolen_report.dart
class StolenReport {
  final String id;
  final String plate;
  final String? plateDisplay;
  final String? vin;
  final String reporterType;
  final String dateStolenString;
  final String countyStolen;
  final String townStolen;
  final String? policeObNumber;
  final String? policeStation;
  final String carColor;
  final String? identifyingMarks;
  final String? contactPhone;
  final String? contactEmail;
  final String status;
  final bool isObVerified;
  final List<String> photoUrls;
  final String createdAt;

  const StolenReport({
    required this.id,
    required this.plate,
    this.plateDisplay,
    this.vin,
    required this.reporterType,
    required this.dateStolenString,
    required this.countyStolen,
    required this.townStolen,
    this.policeObNumber,
    this.policeStation,
    required this.carColor,
    this.identifyingMarks,
    this.contactPhone,
    this.contactEmail,
    required this.status,
    this.isObVerified = false,
    this.photoUrls = const [],
    required this.createdAt,
  });

  factory StolenReport.fromJson(Map<String, dynamic> j) => StolenReport(
    id: j['id'] as String,
    plate: j['plate'] as String,
    plateDisplay: j['plateDisplay'] as String?,
    vin: j['vin'] as String?,
    reporterType: j['reporterType'] as String? ?? 'owner',
    dateStolenString: j['dateStolenString'] as String?
        ?? j['dateStolen'] as String? ?? '',
    countyStolen: j['countyStolen'] as String? ?? '',
    townStolen: j['townStolen'] as String? ?? '',
    policeObNumber: j['policeObNumber'] as String?,
    policeStation: j['policeStation'] as String?,
    carColor: j['carColor'] as String? ?? '',
    identifyingMarks: j['identifyingMarks'] as String?,
    contactPhone: j['contactPhone'] as String?,
    contactEmail: j['contactEmail'] as String?,
    status: j['status'] as String? ?? 'pending',
    isObVerified: j['isObVerified'] as bool? ?? false,
    photoUrls: (j['photoUrls'] as List<dynamic>?)?.cast<String>() ?? [],
    createdAt: j['createdAt'] as String? ?? '',
  );
}
