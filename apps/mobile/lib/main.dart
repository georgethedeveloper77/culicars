// lib/main.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import 'dart:io' show Platform;
import 'config/env.dart';
import 'app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

  await Supabase.initialize(
    url: Env.supabaseUrl,
    anonKey: Env.supabaseAnonKey,
  );

  if (Env.revenueCatAndroid.isNotEmpty || Env.revenueCatIos.isNotEmpty) {
    await Purchases.setLogLevel(LogLevel.debug);
    final key = Platform.isIOS ? Env.revenueCatIos : Env.revenueCatAndroid;
    if (key.isNotEmpty) {
      await Purchases.configure(PurchasesConfiguration(key));
    }
  }

  runApp(const ProviderScope(child: CuliCarsApp()));
}
