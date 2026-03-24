// lib/config/env.dart
import 'dart:io' show Platform;

class Env {
  Env._();

  // Your Mac's local IP — update this if your network changes
  static const String _macIp = '192.168.1.161';
  static const int _port = 3000;

  static String get _localApiUrl {
    if (Platform.isAndroid) {
      // Real Android device OR emulator on same WiFi → use Mac IP
      return 'http://$_macIp:$_port';
    } else if (Platform.isIOS) {
      // Real iOS device → Mac IP
      // iOS Simulator → localhost works too, but Mac IP is universal
      return 'http://$_macIp:$_port';
    }
    return 'http://$_macIp:$_port';
  }

  static String get apiUrl {
    const override = String.fromEnvironment('API_URL', defaultValue: '');
    return override.isNotEmpty ? override : _localApiUrl;
  }

  static const String supabaseUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: 'https://pqelsdkisaephcislwbv.supabase.co',
  );

  static const String supabaseAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: 'sb_publishable_-nau3scx6kTHyZXDxkxeZQ_xzUere3O',
  );

  static const String revenueCatAndroid = String.fromEnvironment(
    'REVENUECAT_KEY_ANDROID',
    defaultValue: '',
  );

  static const String revenueCatIos = String.fromEnvironment(
    'REVENUECAT_KEY_IOS',
    defaultValue: '',
  );
}