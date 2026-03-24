// lib/config/theme.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class CuliTheme {
  CuliTheme._();

  static const Color accent      = Color(0xFFD4A843);
  static const Color accentLight = Color(0xFFE8C060);
  static const Color bg          = Color(0xFF0E0E0E);
  static const Color surface     = Color(0xFF141414);
  static const Color surface2    = Color(0xFF1A1A1A);
  static const Color border      = Color(0x14FFFFFF);
  static const Color textPrimary = Color(0xFFE4E4E7);
  static const Color textMuted   = Color(0xFF71717A);
  static const Color clean       = Color(0xFF34D399);
  static const Color low         = Color(0xFF60A5FA);
  static const Color medium      = Color(0xFFFBBF24);
  static const Color high        = Color(0xFFF97316);
  static const Color critical    = Color(0xFFEF4444);
  static const Color stolenRed   = Color(0xFFDC2626);

  static Color riskColor(String level) {
    switch (level.toLowerCase()) {
      case 'clean':    return clean;
      case 'low':      return low;
      case 'medium':   return medium;
      case 'high':     return high;
      case 'critical': return critical;
      default:         return textMuted;
    }
  }

  static ThemeData get dark => ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    scaffoldBackgroundColor: bg,
    colorScheme: const ColorScheme.dark(
      primary: accent,
      onPrimary: Colors.black,
      surface: surface,
      onSurface: textPrimary,
      error: critical,
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: bg,
      foregroundColor: textPrimary,
      elevation: 0,
      centerTitle: false,
      systemOverlayStyle: SystemUiOverlayStyle.light,
      titleTextStyle: TextStyle(
        color: textPrimary,
        fontSize: 18,
        fontWeight: FontWeight.w700,
        letterSpacing: -0.3,
      ),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: surface,
      selectedItemColor: accent,
      unselectedItemColor: textMuted,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: accent,
        foregroundColor: Colors.black,
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: surface2,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: accent, width: 1.5),
      ),
      hintStyle: const TextStyle(color: textMuted),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
    cardTheme: CardThemeData(
      color: surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: border),
      ),
      margin: EdgeInsets.zero,
    ),
    dividerTheme: const DividerThemeData(color: border, thickness: 1, space: 0),
  );
}
