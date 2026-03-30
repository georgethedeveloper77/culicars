// lib/config/routes.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/auth/auth_state.dart';
import '../features/onboarding/splash_screen.dart';
import '../features/onboarding/onboarding_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/signup_screen.dart';
import '../features/search/search_screen.dart';
import '../features/search/ocr_capture_screen.dart';
import '../features/report/report_full_screen.dart';
import '../features/report/report_preview_screen.dart';
import '../features/credits/payment_screen.dart';
import '../features/report_stolen/report_stolen_screen.dart';
import '../features/report_stolen/stolen_success_screen.dart';
import '../features/report_stolen/my_stolen_reports_screen.dart';
import '../features/contribute/contribute_screen.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../features/dashboard/my_reports_screen.dart';
import '../features/dashboard/transaction_history_screen.dart';
import '../app.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final loggedIn = authState.value != null;
      final loc = state.matchedLocation;
      if (loc == '/splash' || loc == '/onboarding' ||
          loc.startsWith('/login') || loc.startsWith('/signup')) return null;
      final protected = ['/dashboard', '/my-reports', '/billing', '/my-stolen-reports'];
      if (protected.any((r) => loc.startsWith(r)) && !loggedIn) return '/login';
      return null;
    },
    routes: [
      GoRoute(path: '/splash',     builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/onboarding', builder: (_, __) => const OnboardingScreen()),
      GoRoute(path: '/login',      builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/signup',     builder: (_, __) => const SignupScreen()),
      ShellRoute(
        builder: (_, __, child) => MainScaffold(child: child),
        routes: [
          GoRoute(
            path: '/search',
            builder: (_, __) => const SearchScreen(),
            routes: [
              GoRoute(path: 'ocr', builder: (_, __) => const OcrCaptureScreen()),
            ],
          ),
          GoRoute(
            path: '/report/:id',
            builder: (_, s) => ReportFullScreen(reportId: s.pathParameters['id']!),
          ),
          GoRoute(
            path: '/report-preview/:vin',
            builder: (_, s) => ReportPreviewScreen(vin: s.pathParameters['vin']!),
          ),
          GoRoute(path: '/credits', builder: (_, __) => const PaymentScreen()),
          GoRoute(
            path: '/report-stolen',
            builder: (_, s) => ReportStolenScreen(plate: s.uri.queryParameters['plate']),
            routes: [
              GoRoute(
                path: 'success',
                builder: (_, s) => StolenSuccessScreen(
                  plate: s.uri.queryParameters['plate'] ?? '',
                ),
              ),
            ],
          ),
          GoRoute(path: '/my-stolen-reports', builder: (_, __) => const MyStolenReportsScreen()),
          GoRoute(
            path: '/contribute',
            builder: (_, s) => ContributeScreen(vin: s.uri.queryParameters['vin']),
          ),
          GoRoute(path: '/dashboard',  builder: (_, __) => const DashboardScreen()),
          GoRoute(path: '/my-reports', builder: (_, __) => const MyReportsScreen()),
          GoRoute(path: '/billing',    builder: (_, __) => const TransactionHistoryScreen()),
        ],
      ),
    ],
  );
});
