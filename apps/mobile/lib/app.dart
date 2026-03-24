// lib/app.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'config/theme.dart';
import 'config/routes.dart';

class CuliCarsApp extends ConsumerWidget {
  const CuliCarsApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'CuliCars',
      theme: CuliTheme.dark,
      debugShowCheckedModeBanner: false,
      routerConfig: router,
    );
  }
}

class MainScaffold extends StatefulWidget {
  final Widget child;
  const MainScaffold({super.key, required this.child});

  @override
  State<MainScaffold> createState() => _MainScaffoldState();
}

class _MainScaffoldState extends State<MainScaffold> {
  int _idx = 0;

  static const _tabs = [
    _Tab(Icons.search_rounded,         'Search',        '/search'),
    _Tab(Icons.warning_amber_rounded,  'Report Stolen', '/report-stolen'),
    _Tab(Icons.toll_rounded,           'Credits',       '/credits'),
    _Tab(Icons.person_outline_rounded, 'Profile',       '/dashboard'),
  ];

  @override
  Widget build(BuildContext context) => Scaffold(
    body: widget.child,
    bottomNavigationBar: Container(
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: CuliTheme.border)),
      ),
      child: BottomNavigationBar(
        currentIndex: _idx,
        onTap: (i) {
          setState(() => _idx = i);
          context.go(_tabs[i].path);
        },
        items: _tabs.map((t) => BottomNavigationBarItem(
          icon: Icon(t.icon),
          label: t.label,
        )).toList(),
      ),
    ),
  );
}

class _Tab {
  final IconData icon;
  final String label;
  final String path;
  const _Tab(this.icon, this.label, this.path);
}
