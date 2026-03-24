// lib/features/auth/login_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../core/auth/auth_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email    = TextEditingController();
  final _password = TextEditingController();
  bool _obscure = true;
  bool _loading = false;
  String? _error;

  @override
  void dispose() { _email.dispose(); _password.dispose(); super.dispose(); }

  Future<void> _login() async {
    setState(() { _loading = true; _error = null; });
    try {
      await AuthService().signIn(
        email: _email.text.trim(),
        password: _password.text,
      );
      if (mounted) context.go('/search');
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: CuliTheme.bg,
    body: SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const SizedBox(height: 40),
          Row(children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: CuliTheme.accent,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.shield_rounded, color: Colors.black, size: 22),
            ),
            const SizedBox(width: 12),
            const Text('CuliCars', style: TextStyle(
              color: CuliTheme.textPrimary, fontSize: 22, fontWeight: FontWeight.w800,
            )),
          ]),
          const SizedBox(height: 48),
          const Text('Welcome back', style: TextStyle(
            color: CuliTheme.textPrimary, fontSize: 28,
            fontWeight: FontWeight.w800, letterSpacing: -0.5,
          )),
          const SizedBox(height: 8),
          const Text('Sign in to access your reports and wallet',
            style: TextStyle(color: CuliTheme.textMuted, fontSize: 15)),
          const SizedBox(height: 40),
          if (_error != null) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: CuliTheme.critical.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: CuliTheme.critical.withOpacity(0.3)),
              ),
              child: Text(_error!, style: const TextStyle(color: CuliTheme.critical, fontSize: 13)),
            ),
            const SizedBox(height: 16),
          ],
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            autocorrect: false,
            decoration: const InputDecoration(labelText: 'Email',
              labelStyle: TextStyle(color: CuliTheme.textMuted)),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _password,
            obscureText: _obscure,
            decoration: InputDecoration(
              labelText: 'Password',
              labelStyle: const TextStyle(color: CuliTheme.textMuted),
              suffixIcon: IconButton(
                icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                onPressed: () => setState(() => _obscure = !_obscure),
                color: CuliTheme.textMuted,
              ),
            ),
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _loading ? null : _login,
              child: _loading
                  ? const SizedBox(width: 20, height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : const Text('Sign In'),
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: TextButton(
              onPressed: () => context.go('/search'),
              child: const Text('Search without account',
                style: TextStyle(color: CuliTheme.textMuted)),
            ),
          ),
          Center(
            child: TextButton(
              onPressed: () => context.go('/signup'),
              child: const Text("Don't have an account? Sign up",
                style: TextStyle(color: CuliTheme.accent)),
            ),
          ),
        ]),
      ),
    ),
  );
}
