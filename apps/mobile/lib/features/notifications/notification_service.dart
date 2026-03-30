// apps/mobile/lib/features/notifications/notification_service.dart
//
// Dependencies to add to pubspec.yaml:
//   firebase_core: ^2.27.0
//   firebase_messaging: ^14.9.0

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:dio/dio.dart';

const _apiBase = String.fromEnvironment('API_URL', defaultValue: 'https://api.culicars.com');

class NotificationService {
  NotificationService._();
  static final instance = NotificationService._();

  final _dio = Dio();
  FirebaseMessaging get _fcm => FirebaseMessaging.instance;

  /// Call once after user signs in.
  Future<void> init(String authToken) async {
    await _requestPermission();
    await _registerToken(authToken);
    _listenForeground();
  }

  Future<void> _requestPermission() async {
    final settings = await _fcm.requestPermission(alert: true, badge: true, sound: true);
    if (settings.authorizationStatus == AuthorizationStatus.denied) return;
  }

  Future<void> _registerToken(String authToken) async {
    final token = await _fcm.getToken();
    if (token == null) return;
    try {
      await _dio.post(
        '$_apiBase/notifications/register-device',
        data: {'token': token, 'platform': _platform()},
        options: Options(headers: {'Authorization': 'Bearer $authToken'}),
      );
    } catch (_) {}

    // Refresh token listener
    _fcm.onTokenRefresh.listen((newToken) async {
      try {
        await _dio.post(
          '$_apiBase/notifications/register-device',
          data: {'token': newToken, 'platform': _platform()},
          options: Options(headers: {'Authorization': 'Bearer $authToken'}),
        );
      } catch (_) {}
    });
  }

  void _listenForeground() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      // Show in-app banner or update badge — handled by your existing UI
    });
  }

  String _platform() {
    try {
      // dart:io available in Flutter
      // ignore: undefined_prefixed_name
      final io = Uri.base.scheme; // placeholder — replaced below
      return io; // unreachable
    } catch (_) {
      return 'android';
    }
  }
}

// ─── API helpers ─────────────────────────────────────────────────────────────

class NotificationApiClient {
  NotificationApiClient(this._authToken);
  final String _authToken;
  final _dio = Dio();

  Options get _opts => Options(headers: {'Authorization': 'Bearer $_authToken'});

  Future<List<AppNotification>> getNotifications({int limit = 30}) async {
    final res = await _dio.get('$_apiBase/notifications', queryParameters: {'limit': limit}, options: _opts);
    final list = (res.data['notifications'] as List? ?? []);
    return list.map((e) => AppNotification.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<int> getUnreadCount() async {
    final res = await _dio.get('$_apiBase/notifications', queryParameters: {'limit': 1}, options: _opts);
    return (res.data['unreadCount'] as int? ?? 0);
  }

  Future<void> markRead(String id) async {
    await _dio.patch('$_apiBase/notifications/$id/read', options: _opts);
  }

  Future<void> markAllRead() async {
    await _dio.post('$_apiBase/notifications/read-all', options: _opts);
  }
}

// ─── Model ───────────────────────────────────────────────────────────────────

class AppNotification {
  final String id;
  final String type;
  final String title;
  final String body;
  final bool read;
  final DateTime createdAt;
  final Map<String, dynamic>? dataJson;

  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.read,
    required this.createdAt,
    this.dataJson,
  });

  factory AppNotification.fromJson(Map<String, dynamic> j) => AppNotification(
        id: j['id'] as String,
        type: j['type'] as String? ?? '',
        title: j['title'] as String? ?? '',
        body: j['body'] as String? ?? '',
        read: j['read'] as bool? ?? false,
        createdAt: DateTime.tryParse(j['createdAt'] as String? ?? '') ?? DateTime.now(),
        dataJson: j['dataJson'] as Map<String, dynamic>?,
      );
}
