// lib/features/onboarding/onboarding_screen.dart
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../core/storage/secure_storage.dart';

class _Page {
  final IconData icon;
  final String title;
  final String desc;
  const _Page(this.icon, this.title, this.desc);
}

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});
  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _ctrl = PageController();
  int _page = 0;

  static const _pages = [
    _Page(Icons.search_rounded, 'Search Any Vehicle',
        'Look up any Kenya vehicle by number plate or VIN. Get instant history.'),
    _Page(Icons.warning_amber_rounded, 'Community Theft Reports',
        'Report and check stolen vehicles — free for everyone. OB-verified alerts.'),
    _Page(Icons.shield_rounded, 'NTSA Official Records',
        'Fetch official COR data directly from eCitizen. Confidence 100%.'),
    _Page(Icons.lock_open_rounded, 'Unlock Full Reports',
        'Buy credits to unlock damage maps, odometer history, legal status.'),
  ];

  Future<void> _done() async {
    await SecureStorage.setOnboarded();
    if (mounted) context.go('/login');
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: CuliTheme.bg,
    body: SafeArea(
      child: Column(children: [
        Expanded(
          child: PageView.builder(
            controller: _ctrl,
            onPageChanged: (i) => setState(() => _page = i),
            itemCount: _pages.length,
            itemBuilder: (_, i) => Padding(
              padding: const EdgeInsets.all(40),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 100, height: 100,
                    decoration: BoxDecoration(
                      color: CuliTheme.accent.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(_pages[i].icon, color: CuliTheme.accent, size: 48),
                  ),
                  const SizedBox(height: 40),
                  Text(_pages[i].title,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: CuliTheme.textPrimary, fontSize: 26,
                      fontWeight: FontWeight.w800, letterSpacing: -0.5,
                    )),
                  const SizedBox(height: 16),
                  Text(_pages[i].desc,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: CuliTheme.textMuted, fontSize: 16, height: 1.6,
                    )),
                ],
              ),
            ),
          ),
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(_pages.length, (i) => AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            margin: const EdgeInsets.symmetric(horizontal: 4),
            width: _page == i ? 24 : 8,
            height: 8,
            decoration: BoxDecoration(
              color: _page == i
                  ? CuliTheme.accent
                  : CuliTheme.textMuted.withOpacity(0.3),
              borderRadius: BorderRadius.circular(4),
            ),
          )),
        ),
        const SizedBox(height: 40),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _page < _pages.length - 1
                  ? () => _ctrl.nextPage(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeInOut)
                  : _done,
              child: Text(_page < _pages.length - 1 ? 'Next' : 'Get Started'),
            ),
          ),
        ),
        const SizedBox(height: 32),
      ]),
    ),
  );
}
