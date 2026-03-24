// lib/shared/models/vehicle.dart
class Vehicle {
  final String vin;
  final String? make;
  final String? model;
  final int? year;
  final String? color;
  final int? engineCc;
  final String? fuelType;
  final String? transmission;
  final String? bodyType;
  final bool ntsaCorVerified;
  final String? japanAuctionGrade;
  final String? plate;
  final String? plateDisplay;

  const Vehicle({
    required this.vin,
    this.make,
    this.model,
    this.year,
    this.color,
    this.engineCc,
    this.fuelType,
    this.transmission,
    this.bodyType,
    this.ntsaCorVerified = false,
    this.japanAuctionGrade,
    this.plate,
    this.plateDisplay,
  });

  factory Vehicle.fromJson(Map<String, dynamic> j) => Vehicle(
    vin: j['vin'] as String,
    make: j['make'] as String?,
    model: j['model'] as String?,
    year: j['year'] as int?,
    color: j['color'] as String?,
    engineCc: j['engineCc'] as int?,
    fuelType: j['fuelType'] as String?,
    transmission: j['transmission'] as String?,
    bodyType: j['bodyType'] as String?,
    ntsaCorVerified: j['ntsaCorVerified'] as bool? ?? false,
    japanAuctionGrade: j['japanAuctionGrade'] as String?,
    plate: j['plate'] as String?,
    plateDisplay: j['plateDisplay'] as String?,
  );

  String get displayName => [year?.toString(), make, model]
      .where((s) => s != null && s.isNotEmpty).join(' ');
}
