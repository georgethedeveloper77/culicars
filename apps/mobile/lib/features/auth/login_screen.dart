// apps/mobile/lib/features/auth/login_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'dart:io' show Platform;

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  bool _googleLoading = false;
  bool _appleLoading = false;
  String? _error;

  final _supabase = Supabase.instance.client;
  final _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    // serverClientId required for iOS
  );

  Future<void> _signInWithGoogle() async {
    setState(() {
      _googleLoading = true;
      _error = null;
    });

    try {
      final googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        setState(() => _googleLoading = false);
        return;
      }

      final googleAuth = await googleUser.authentication;

      if (googleAuth.idToken == null) {
        throw Exception('No ID token from Google');
      }

      await _supabase.auth.signInWithIdToken(
        provider: OAuthProvider.google,
        idToken: googleAuth.idToken!,
        accessToken: googleAuth.accessToken,
      );

      await _provisionProfile();

      if (mounted) context.go('/');
    } catch (e) {
      setState(() {
        _error = _friendlyError(e.toString());
        _googleLoading = false;
      });
    }
  }

  Future<void> _signInWithApple() async {
    if (!Platform.isIOS && !Platform.isMacOS) return;

    setState(() {
      _appleLoading = true;
      _error = null;
    });

    try {
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
        webAuthenticationOptions: WebAuthenticationOptions(
          // These must match the service ID and redirect URL
          // registered in Apple Developer portal
          clientId: const String.fromEnvironment('APPLE_SERVICE_ID'),
          redirectUri: Uri.parse(
            const String.fromEnvironment('APPLE_REDIRECT_URI'),
          ),
        ),
      );

      if (credential.identityToken == null) {
        throw Exception('No identity token from Apple');
      }

      await _supabase.auth.signInWithIdToken(
        provider: OAuthProvider.apple,
        idToken: credential.identityToken!,
        nonce: credential.userIdentifier,
      );

      await _provisionProfile();

      if (mounted) context.go('/');
    } catch (e) {
      setState(() {
        _error = _friendlyError(e.toString());
        _appleLoading = false;
      });
    }
  }

  /// Calls /auth/complete-profile to provision DB row with default role=user
  Future<void> _provisionProfile() async {
    final session = _supabase.auth.currentSession;
    if (session == null) return;

    const apiUrl = String.fromEnvironment(
      'API_URL',
      defaultValue: 'https://api.culicars.com',
    );

    try {
      await _supabase.functions.invoke(
        'complete-profile',
        body: {},
      );
    } catch (_) {
      // Non-blocking — API will auto-provision on next authenticated request
    }
  }

  String _friendlyError(String raw) {
    if (raw.contains('cancelled') || raw.contains('canceled')) {
      return 'Sign in was cancelled.';
    }
    if (raw.contains('network')) {
      return 'Network error. Please check your connection.';
    }
    return 'Sign in failed. Please try again.';
  }

  @override
  Widget build(BuildContext context) {
    final isIOS = !kIsWeb && Platform.isIOS;

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),

              // Logo
              RichText(
                text: const TextSpan(
                  style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
                  children: [
                    TextSpan(
                      text: 'Culi',
                      style: TextStyle(color: Colors.white),
                    ),
                    TextSpan(
                      text: 'Cars',
                      style: TextStyle(color: Color(0xFFD4A843)),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Kenya Vehicle Intelligence',
                style: TextStyle(color: Color(0xFF9CA3AF), fontSize: 14),
              ),

              const SizedBox(height: 48),

              // Error
              if (_error != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.1),
                    border: Border.all(color: Colors.red.withOpacity(0.3)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _error!,
                    style: const TextStyle(color: Color(0xFFF87171), fontSize: 13),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Google Sign In
              _SocialButton(
                label: 'Continue with Google',
                loading: _googleLoading,
                disabled: _appleLoading,
                onPressed: _signInWithGoogle,
                backgroundColor: Colors.white,
                textColor: const Color(0xFF111827),
                icon: _GoogleIcon(),
              ),

              const SizedBox(height: 12),

              // Apple Sign In — iOS only
              if (isIOS) ...[
                _SocialButton(
                  label: 'Continue with Apple',
                  loading: _appleLoading,
                  disabled: _googleLoading,
                  onPressed: _signInWithApple,
                  backgroundColor: Colors.white.withOpacity(0.06),
                  textColor: Colors.white,
                  border: BorderSide(color: Colors.white.withOpacity(0.12)),
                  icon: const Icon(Icons.apple, color: Colors.white, size: 20),
                ),
              ],

              const Spacer(),

              const Padding(
                padding: EdgeInsets.only(bottom: 16),
                child: Text(
                  'By signing in, you agree to our Terms and Privacy Policy',
                  style: TextStyle(color: Color(0xFF6B7280), fontSize: 11),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SocialButton extends StatelessWidget {
  final String label;
  final bool loading;
  final bool disabled;
  final VoidCallback onPressed;
  final Color backgroundColor;
  final Color textColor;
  final BorderSide? border;
  final Widget icon;

  const _SocialButton({
    required this.label,
    required this.loading,
    required this.disabled,
    required this.onPressed,
    required this.backgroundColor,
    required this.textColor,
    required this.icon,
    this.border,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: ElevatedButton(
        onPressed: (loading || disabled) ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: backgroundColor,
          disabledBackgroundColor: backgroundColor.withOpacity(0.4),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
            side: border ?? BorderSide.none,
          ),
          elevation: 0,
        ),
        child: loading
            ? SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: textColor.withOpacity(0.6),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  icon,
                  const SizedBox(width: 10),
                  Text(
                    label,
                    style: TextStyle(
                      color: textColor,
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _GoogleIcon extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 20,
      height: 20,
      child: CustomPaint(painter: _GooglePainter()),
    );
  }
}

class _GooglePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;

    // Simplified Google G — use an SVG asset in production
    paint.color = const Color(0xFF4285F4);
    canvas.drawArc(
      Rect.fromLTWH(0, 0, size.width, size.height),
      -0.5,
      4.2,
      false,
      paint..style = PaintingStyle.stroke
        ..strokeWidth = size.width * 0.2
        ..color = const Color(0xFF4285F4),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
