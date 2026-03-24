// lib/features/dashboard/dashboard_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../core/auth/auth_service.dart';
import '../../core/auth/auth_state.dart';
import '../../core/api/api_client.dart';
import '../../shared/models/app_user.dart';

final _userProvider = FutureProvider<AppUser?>((ref) async {
  final session = ref.watch(authStateProvider).value;
  if (session == null) return null;
  try {
    final data = await ApiClient().get('/users/me');
    return AppUser.fromJson(data as Map<String, dynamic>);
  } catch (_) { return null; }
});

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loggedIn = ref.watch(isLoggedInProvider);
    if (!loggedIn) return _Guest();
    final async = ref.watch(_userProvider);
    return Scaffold(
      backgroundColor: CuliTheme.bg,
      appBar: AppBar(title: const Text('Profile')),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator(color: CuliTheme.accent)),
        error: (e, _) => Center(child: Text(e.toString(),
          style: const TextStyle(color: CuliTheme.critical))),
        data: (user) => ListView(padding: const EdgeInsets.all(16), children: [
          // User card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: CuliTheme.surface, borderRadius: BorderRadius.circular(20),
              border: Border.all(color: CuliTheme.border)),
            child: Row(children: [
              Container(
                width: 56, height: 56,
                decoration: BoxDecoration(
                  color: CuliTheme.accent.withOpacity(0.15), shape: BoxShape.circle),
                child: const Icon(Icons.person_rounded, color: CuliTheme.accent, size: 28)),
              const SizedBox(width: 16),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(user?.displayName ?? user?.email ?? 'User', style: const TextStyle(
                  color: CuliTheme.textPrimary, fontSize: 17, fontWeight: FontWeight.w700)),
                if (user?.email != null)
                  Text(user!.email, style: const TextStyle(color: CuliTheme.textMuted, fontSize: 13)),
                const SizedBox(height: 6),
                Row(children: [
                  const Icon(Icons.toll_rounded, color: CuliTheme.accent, size: 16),
                  const SizedBox(width: 4),
                  Text('${user?.creditBalance ?? 0} credits', style: const TextStyle(
                    color: CuliTheme.accent, fontSize: 14, fontWeight: FontWeight.w700)),
                ]),
              ])),
            ]),
          ),
          const SizedBox(height: 16),

          // Buy credits CTA
          GestureDetector(
            onTap: () => context.push('/credits'),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [
                  CuliTheme.accent.withOpacity(0.15),
                  CuliTheme.accent.withOpacity(0.05),
                ]),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: CuliTheme.accent.withOpacity(0.3))),
              child: const Row(children: [
                Icon(Icons.add_circle_outline_rounded, color: CuliTheme.accent, size: 24),
                SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Buy Credits', style: TextStyle(
                    color: CuliTheme.textPrimary, fontWeight: FontWeight.w700, fontSize: 15)),
                  Text('From KSh 150 · Never expire',
                    style: TextStyle(color: CuliTheme.textMuted, fontSize: 12)),
                ])),
                Icon(Icons.chevron_right, color: CuliTheme.accent),
              ]),
            ),
          ),
          const SizedBox(height: 8),

          _MenuItem(icon: Icons.description_outlined, label: 'My Reports',
            sub: 'View your unlocked reports', onTap: () => context.push('/my-reports')),
          _MenuItem(icon: Icons.warning_amber_rounded, label: 'My Stolen Reports',
            sub: 'Track vehicles you\'ve reported', onTap: () => context.push('/my-stolen-reports')),
          _MenuItem(icon: Icons.receipt_long_outlined, label: 'Transaction History',
            sub: 'Credit purchases and usage', onTap: () => context.push('/billing')),
          _MenuItem(icon: Icons.volunteer_activism_outlined, label: 'Contribute Data',
            sub: 'Help build Kenya\'s vehicle database', onTap: () => context.push('/contribute')),

          const SizedBox(height: 24),
          const Divider(),
          const SizedBox(height: 8),

          GestureDetector(
            onTap: () async {
              await AuthService().signOut();
              if (context.mounted) context.go('/login');
            },
            child: const Row(children: [
              Icon(Icons.logout_rounded, color: CuliTheme.textMuted, size: 20),
              SizedBox(width: 12),
              Text('Sign Out', style: TextStyle(color: CuliTheme.textMuted, fontSize: 15)),
            ]),
          ),
          const SizedBox(height: 40),
        ]),
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String sub;
  final VoidCallback onTap;
  const _MenuItem({required this.icon, required this.label, required this.sub, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: CuliTheme.surface, borderRadius: BorderRadius.circular(14),
        border: Border.all(color: CuliTheme.border)),
      child: Row(children: [
        Icon(icon, color: CuliTheme.textMuted, size: 20),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: const TextStyle(
            color: CuliTheme.textPrimary, fontSize: 14, fontWeight: FontWeight.w600)),
          Text(sub, style: const TextStyle(color: CuliTheme.textMuted, fontSize: 12)),
        ])),
        const Icon(Icons.chevron_right, color: CuliTheme.textMuted, size: 18),
      ]),
    ),
  );
}

class _Guest extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: CuliTheme.bg,
    appBar: AppBar(title: const Text('Profile')),
    body: Padding(
      padding: const EdgeInsets.all(32),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        const Icon(Icons.person_outline_rounded, color: CuliTheme.textMuted, size: 64),
        const SizedBox(height: 20),
        const Text('Sign in to CuliCars', style: TextStyle(
          color: CuliTheme.textPrimary, fontSize: 24, fontWeight: FontWeight.w700)),
        const SizedBox(height: 10),
        const Text('Create an account to track your reports and manage credits.',
          textAlign: TextAlign.center,
          style: TextStyle(color: CuliTheme.textMuted, fontSize: 14, height: 1.5)),
        const SizedBox(height: 32),
        SizedBox(width: double.infinity,
          child: ElevatedButton(
            onPressed: () => context.push('/login'),
            child: const Text('Sign In'))),
        const SizedBox(height: 12),
        SizedBox(width: double.infinity,
          child: OutlinedButton(
            onPressed: () => context.push('/signup'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              side: const BorderSide(color: CuliTheme.border)),
            child: const Text('Create Account',
              style: TextStyle(color: CuliTheme.textMuted)))),
      ]),
    ),
  );
}
