// lib/core/auth/auth_state.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final authStateProvider = StreamProvider<Session?>((ref) {
  return Supabase.instance.client.auth.onAuthStateChange
      .map((event) => event.session);
});

final isLoggedInProvider = Provider<bool>((ref) {
  return ref.watch(authStateProvider).value != null;
});

final currentUserIdProvider = Provider<String?>((ref) {
  return ref.watch(authStateProvider).value?.user.id;
});
