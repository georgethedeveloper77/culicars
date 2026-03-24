// lib/shared/models/app_user.dart
class AppUser {
  final String id;
  final String email;
  final String role;
  final int creditBalance;
  final String? displayName;
  final String? phone;

  const AppUser({
    required this.id,
    required this.email,
    required this.role,
    this.creditBalance = 0,
    this.displayName,
    this.phone,
  });

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
    id: j['id'] as String,
    email: j['email'] as String,
    role: j['role'] as String? ?? 'user',
    creditBalance: j['wallet']?['balance'] as int? ?? 0,
    displayName: j['profile']?['displayName'] as String?,
    phone: j['profile']?['phone'] as String?,
  );
}

// lib/shared/models/credit_pack.dart
class CreditPack {
  final String id;
  final String productId;
  final int credits;
  final int priceKes;
  final double priceUsd;
  final bool isMostPopular;

  const CreditPack({
    required this.id,
    required this.productId,
    required this.credits,
    required this.priceKes,
    required this.priceUsd,
    this.isMostPopular = false,
  });

  factory CreditPack.fromJson(Map<String, dynamic> j) => CreditPack(
    id: j['id'] as String,
    productId: j['productId'] as String? ?? '',
    credits: j['credits'] as int,
    priceKes: j['priceKes'] as int,
    priceUsd: (j['priceUsd'] as num).toDouble(),
    isMostPopular: j['isMostPopular'] as bool? ?? false,
  );

  String get kesLabel => 'KSh ${priceKes.toStringAsFixed(0)}';
}
