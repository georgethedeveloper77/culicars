// lib/features/auth/signup_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../core/auth/auth_service.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});
  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _email    = TextEditingController();
  final _password = TextEditingController();
  final _confirm  = TextEditingController();
  bool _loading = false;
  String? _error;

  @override
  void dispose() { _email.dispose(); _password.dispose(); _confirm.dispose(); super.dispose(); }

  Future<void> _signup() async {
    if (_password.text != _confirm.text) {
      setState(() => _error = 'Passwords do not match');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      await AuthService().signUp(email: _email.text.trim(), password: _password.text);
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
    appBar: AppBar(title: const Text('Create Account')),
    body: SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
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
          TextField(controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(labelText: 'Email',
              labelStyle: TextStyle(color: CuliTheme.textMuted))),
          const SizedBox(height: 16),
          TextField(controller: _password, obscureText: true,
            decoration: const InputDecoration(labelText: 'Password',
              labelStyle: TextStyle(color: CuliTheme.textMuted))),
          const SizedBox(height: 16),
          TextField(controller: _confirm, obscureText: true,
            decoration: const InputDecoration(labelText: 'Confirm Password',
              labelStyle: TextStyle(color: CuliTheme.textMuted))),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _loading ? null : _signup,
              child: _loading
                  ? const SizedBox(width: 20, height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black))
                  : const Text('Create Account'),
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: TextButton(
              onPressed: () => context.go('/login'),
              child: const Text('Already have an account? Sign in',
                style: TextStyle(color: CuliTheme.accent)),
            ),
          ),
        ]),
      ),
    ),
  );
}
