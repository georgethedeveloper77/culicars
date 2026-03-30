// lib/features/credits/payment_screen.dart
import 'package:flutter/material.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import '../../config/theme.dart';
import '../../core/api/api_client.dart';

class PaymentScreen extends StatefulWidget {
  const PaymentScreen({super.key});
  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final _api = ApiClient();
  List<Map<String, dynamic>> _packs = [];
  List<Map<String, dynamic>> _providers = [];
  bool _loading = true;
  bool _mpesaLoading = false;
  String? _mpesaPhone;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final results = await Future.wait([
        _api.get('/payments/packs'),
        _api.get('/payments/providers'),
      ]);
      setState(() {
        _packs = (results[0] as List<dynamic>).cast<Map<String, dynamic>>();
        _providers = (results[1] as List<dynamic>).cast<Map<String, dynamic>>();
        _loading = false;
      });
    } catch (_) {
      setState(() { _loading = false; });
    }
  }

  bool get _mpesaEnabled => _providers.any(
      (p) => p['slug'] == 'mpesa' && p['isEnabled'] == true);
  bool get _rcEnabled => _providers.any(
      (p) => p['slug'] == 'revenuecat' && p['isEnabled'] == true);

  Future<void> _mpesa(Map<String, dynamic> pack) async {
    if (_mpesaPhone == null) { _phoneDialog(pack); return; }
    setState(() => _mpesaLoading = true);
    try {
      await _api.post('/payments/initiate', body: {
        'provider': 'mpesa', 'packId': pack['id'], 'phone': _mpesaPhone,
      });
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('M-Pesa prompt sent to your phone!'),
        backgroundColor: CuliTheme.clean));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.toString()), backgroundColor: CuliTheme.critical));
    } finally { setState(() => _mpesaLoading = false); }
  }

  void _phoneDialog(Map<String, dynamic> pack) {
    final ctrl = TextEditingController();
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: CuliTheme.surface,
        title: const Text('M-Pesa Phone', style: TextStyle(color: CuliTheme.textPrimary)),
        content: TextField(controller: ctrl,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(hintText: '0712345678',
            labelText: 'Phone Number',
            labelStyle: TextStyle(color: CuliTheme.textMuted))),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: CuliTheme.textMuted))),
          ElevatedButton(
            onPressed: () {
              setState(() => _mpesaPhone = ctrl.text.trim());
              Navigator.pop(context);
              _mpesa(pack);
            },
            child: const Text('Send Prompt')),
        ],
      ),
    );
  }

  Future<void> _revenueCat(Map<String, dynamic> pack) async {
    try {
      final offerings = await Purchases.getOfferings();
      final offering = offerings.current;
      if (offering == null) throw Exception('No offerings available');
      final pkg = offering.availablePackages.firstWhere(
        (p) => p.storeProduct.identifier == (pack['productId'] as String? ?? ''),
        orElse: () => throw Exception('Package not found'),
      );
      await Purchases.purchasePackage(pkg);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Purchase successful! Credits added.'),
        backgroundColor: CuliTheme.clean));
    } catch (e) {
      if (e is PurchasesErrorCode && e == PurchasesErrorCode.purchaseCancelledError) return;
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(e.toString()), backgroundColor: CuliTheme.critical));
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: CuliTheme.bg,
    appBar: AppBar(title: const Text('Buy Credits')),
    body: _loading
        ? const Center(child: CircularProgressIndicator(color: CuliTheme.accent))
        : ListView(padding: const EdgeInsets.all(16), children: [
            const Text('Choose a Credit Pack', style: TextStyle(
              color: CuliTheme.textPrimary, fontSize: 22, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            const Text('1 credit unlocks a full vehicle report. Credits never expire.',
              style: TextStyle(color: CuliTheme.textMuted, fontSize: 14)),
            const SizedBox(height: 24),
            ..._packs.map((pack) => _PackCard(
              pack: pack,
              onMpesa: _mpesaEnabled ? () => _mpesa(pack) : null,
              onRevenueCat: _rcEnabled ? () => _revenueCat(pack) : null,
              mpesaLoading: _mpesaLoading,
            )),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: CuliTheme.surface2, borderRadius: BorderRadius.circular(12)),
              child: const Column(children: [
                _Trust(icon: Icons.security_rounded, text: 'Secure payment processing'),
                SizedBox(height: 8),
                _Trust(icon: Icons.phone_android_rounded, text: 'M-Pesa STK Push — no card needed'),
                SizedBox(height: 8),
                _Trust(icon: Icons.all_inclusive_rounded, text: 'Credits never expire'),
              ]),
            ),
          ]),
  );
}

class _PackCard extends StatelessWidget {
  final Map<String, dynamic> pack;
  final VoidCallback? onMpesa;
  final VoidCallback? onRevenueCat;
  final bool mpesaLoading;
  const _PackCard({required this.pack, this.onMpesa, this.onRevenueCat, required this.mpesaLoading});

  @override
  Widget build(BuildContext context) {
    final credits  = pack['credits'] as int? ?? 0;
    final priceKes = pack['priceKes'] as int? ?? 0;
    final priceUsd = (pack['priceUsd'] as num?)?.toDouble() ?? 0.0;
    final popular  = pack['isMostPopular'] as bool? ?? false;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: popular ? CuliTheme.accent.withOpacity(0.08) : CuliTheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: popular ? CuliTheme.accent.withOpacity(0.4) : CuliTheme.border,
          width: popular ? 1.5 : 1,
        ),
      ),
      child: Column(children: [
        Row(children: [
          Text('$credits Credit${credits > 1 ? 's' : ''}',
            style: const TextStyle(color: CuliTheme.textPrimary, fontSize: 18, fontWeight: FontWeight.w800)),
          if (popular) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(color: CuliTheme.accent, borderRadius: BorderRadius.circular(20)),
              child: const Text('POPULAR', style: TextStyle(
                color: Colors.black, fontSize: 9, fontWeight: FontWeight.w900)),
            ),
          ],
          const Spacer(),
          Text('\$${priceUsd.toStringAsFixed(2)}',
            style: const TextStyle(color: CuliTheme.textMuted, fontSize: 13)),
        ]),
        const SizedBox(height: 4),
        Align(alignment: Alignment.centerLeft,
          child: Text('KSh $priceKes', style: const TextStyle(
            color: CuliTheme.accent, fontSize: 15, fontWeight: FontWeight.w700))),
        const SizedBox(height: 14),
        Row(children: [
          if (onMpesa != null)
            Expanded(child: ElevatedButton(
              onPressed: mpesaLoading ? null : onMpesa,
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 10)),
              child: mpesaLoading
                  ? const SizedBox(width: 18, height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : const Text('🇰🇪 M-Pesa'),
            )),
          if (onMpesa != null && onRevenueCat != null) const SizedBox(width: 10),
          if (onRevenueCat != null)
            Expanded(child: OutlinedButton(
              onPressed: onRevenueCat,
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 10),
                side: const BorderSide(color: CuliTheme.border)),
              child: const Text('Card / IAP',
                style: TextStyle(color: CuliTheme.textMuted)),
            )),
          if (onMpesa == null && onRevenueCat == null)
            const Expanded(child: Center(child: Text('No payment providers enabled',
              style: TextStyle(color: CuliTheme.textMuted, fontSize: 13)))),
        ]),
      ]),
    );
  }
}

class _Trust extends StatelessWidget {
  final IconData icon;
  final String text;
  const _Trust({required this.icon, required this.text});
  @override
  Widget build(BuildContext context) => Row(children: [
    Icon(icon, color: CuliTheme.textMuted, size: 16),
    const SizedBox(width: 10),
    Text(text, style: const TextStyle(color: CuliTheme.textMuted, fontSize: 13)),
  ]);
}
