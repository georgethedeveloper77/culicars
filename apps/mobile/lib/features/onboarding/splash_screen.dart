// lib/features/onboarding/splash_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../core/auth/auth_state.dart';
import '../../core/storage/secure_storage.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _opacity;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));
    _opacity = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _ctrl.forward();
    _navigate();
  }

  Future<void> _navigate() async {
    await Future.delayed(const Duration(milliseconds: 1800));
    if (!mounted) return;
    final session = ref.read(authStateProvider).value;
    final onboarded = await SecureStorage.isOnboarded();
    if (!mounted) return;
    if (!onboarded) {
      context.go('/onboarding');
    } else if (session != null) {
      context.go('/search');
    } else {
      context.go('/login');
    }
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: CuliTheme.bg,
    body: Center(
      child: FadeTransition(
        opacity: _opacity,
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 72, height: 72,
            decoration: BoxDecoration(
              color: CuliTheme.accent,
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Icon(Icons.shield_rounded, color: Colors.black, size: 36),
          ),
          const SizedBox(height: 20),
          const Text('CuliCars',
            style: TextStyle(
              color: CuliTheme.textPrimary, fontSize: 32,
              fontWeight: FontWeight.w800, letterSpacing: -1,
            )),
          const SizedBox(height: 6),
          const Text('Kenya Vehicle Intelligence',
            style: TextStyle(color: CuliTheme.textMuted, fontSize: 14)),
        ]),
      ),
    ),
  );
}
