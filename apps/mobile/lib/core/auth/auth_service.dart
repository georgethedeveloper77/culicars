// lib/core/auth/auth_service.dart
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthService {
  final _client = Supabase.instance.client;

  Future<AuthResponse> signIn({required String email, required String password}) =>
      _client.auth.signInWithPassword(email: email, password: password);

  Future<AuthResponse> signUp({required String email, required String password}) =>
      _client.auth.signUp(email: email, password: password);

  Future<void> signOut() => _client.auth.signOut();

  Session? get currentSession => _client.auth.currentSession;
  User? get currentUser => _client.auth.currentUser;
  bool get isLoggedIn => currentSession != null;
}
