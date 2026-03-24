// lib/config/env.dart
import 'dart:io' show Platform;

class Env {
  Env._();

  // ── Production API — DEFAULT for all builds ───────────────────────────────
  static const String _productionApiUrl = 'https://api.culicars.com';

  // ── Local Dev — only used when explicitly running with --dart-define=ENV=local
  static const String _macIp = '192.168.1.161';
  static const int _port = 3000;

  static String get _localApiUrl {
    if (Platform.isAndroid) return 'http://$_macIp:$_port';
    if (Platform.isIOS) return 'http://$_macIp:$_port';
    return 'http://$_macIp:$_port';
  }

  // ── API URL ───────────────────────────────────────────────────────────────
  // DEFAULT: always hits https://api.culicars.com
  // Local testing only: flutter run --dart-define=ENV=local
  static String get apiUrl {
    const env = String.fromEnvironment('ENV', defaultValue: 'production');
    const override = String.fromEnvironment('API_URL', defaultValue: '');

    if (override.isNotEmpty) return override;
    if (env == 'local') return _localApiUrl;
    return _productionApiUrl;
  }

  // ── Supabase ──────────────────────────────────────────────────────────────
  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://pqelsdkisaephcislwbv.supabase.co',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'sb_publishable_-nau3scx6kTHyZXDxkxeZQ_xzUere3O',
  );

  // ── RevenueCat ────────────────────────────────────────────────────────────
  static const String revenueCatAndroid = String.fromEnvironment(
    'REVENUECAT_KEY_ANDROID',
    defaultValue: '',
  );

  static const String revenueCatIos = String.fromEnvironment(
    'REVENUECAT_KEY_IOS',
    defaultValue: '',
  );

  // ── Helpers ───────────────────────────────────────────────────────────────
  static bool get isLocal {
    const env = String.fromEnvironment('ENV', defaultValue: 'production');
    return env == 'local';
  }

  static bool get isProduction => !isLocal;
}