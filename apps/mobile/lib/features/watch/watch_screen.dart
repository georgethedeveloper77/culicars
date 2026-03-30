// apps/mobile/lib/features/watch/watch_screen.dart

import 'package:flutter/material.dart';
import 'watch_map_widget.dart';
import 'watch_feed_screen.dart';

class WatchScreen extends StatefulWidget {
  const WatchScreen({super.key});

  @override
  State<WatchScreen> createState() => _WatchScreenState();
}

class _WatchScreenState extends State<WatchScreen> {
  int _tab = 0; // 0 = Map, 1 = Feed

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            _buildTopSwitch(context),
            Expanded(
              child: IndexedStack(
                index: _tab,
                children: const [
                  WatchMapWidget(),
                  WatchFeedScreen(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopSwitch(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: theme.appBarTheme.backgroundColor ?? theme.colorScheme.surface,
        border: Border(bottom: BorderSide(color: theme.dividerColor, width: 0.5)),
      ),
      child: Row(
        children: [
          Expanded(
            child: _SwitchTab(
              label: 'Map',
              icon: Icons.map_outlined,
              selected: _tab == 0,
              onTap: () => setState(() => _tab = 0),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _SwitchTab(
              label: 'Feed',
              icon: Icons.feed_outlined,
              selected: _tab == 1,
              onTap: () => setState(() => _tab = 1),
            ),
          ),
        ],
      ),
    );
  }
}

class _SwitchTab extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _SwitchTab({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: selected ? scheme.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: selected ? scheme.onPrimary : scheme.onSurface.withOpacity(0.6)),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: selected ? scheme.onPrimary : scheme.onSurface.withOpacity(0.6),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
