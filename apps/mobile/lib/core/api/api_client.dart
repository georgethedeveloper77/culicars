// lib/core/api/api_client.dart

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../config/env.dart';

// ── Provider ──────────────────────────────────────────────────────────────────

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

// ── Client ────────────────────────────────────────────────────────────────────

class ApiClient {
  late final Dio _dio;

  ApiClient() {
    _dio = Dio(BaseOptions(
      baseUrl: Env.apiUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));
    _dio.interceptors.add(_AuthInterceptor());
    _dio.interceptors.add(
      LogInterceptor(requestBody: false, responseBody: false, error: true),
    );
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? params}) async {
    final res = await _dio.get(path, queryParameters: params);
    return _unwrap(res.data);
  }

  Future<dynamic> post(String path, {dynamic body}) async {
    final res = await _dio.post(path, data: body);
    return _unwrap(res.data);
  }

  Future<dynamic> patch(String path, {dynamic body}) async {
    final res = await _dio.patch(path, data: body);
    return _unwrap(res.data);
  }

  Future<dynamic> delete(String path, {dynamic body}) async {
    final res = await _dio.delete(path, data: body);
    return _unwrap(res.data);
  }

  dynamic _unwrap(dynamic json) {
    if (json is Map<String, dynamic> && json.containsKey('data')) {
      return json['data'];
    }
    return json;
  }
}

// ── Auth interceptor ──────────────────────────────────────────────────────────

class _AuthInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    final session = Supabase.instance.client.auth.currentSession;
    if (session != null) {
      options.headers['Authorization'] = 'Bearer ${session.accessToken}';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    final data = err.response?.data;
    final message = (data is Map ? data['message'] ?? data['error'] : null) ??
        err.message ??
        'Network error';
    handler.next(err.copyWith(message: message as String));
  }
}
