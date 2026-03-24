// lib/core/storage/secure_storage.dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  static const _keyOnboarded  = 'culicars_onboarded';
  static const _keyLastSearch = 'culicars_last_search';

  static Future<bool> isOnboarded() async {
    final v = await _storage.read(key: _keyOnboarded);
    return v == 'true';
  }

  static Future<void> setOnboarded() =>
      _storage.write(key: _keyOnboarded, value: 'true');

  static Future<String?> getLastSearch() => _storage.read(key: _keyLastSearch);

  static Future<void> setLastSearch(String q) =>
      _storage.write(key: _keyLastSearch, value: q);

  static Future<void> clear() => _storage.deleteAll();
}
