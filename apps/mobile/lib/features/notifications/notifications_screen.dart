// apps/mobile/lib/features/notifications/notifications_screen.dart

import 'package:flutter/material.dart';
import 'notification_service.dart';

class NotificationsScreen extends StatefulWidget {
  final String authToken;
  const NotificationsScreen({super.key, required this.authToken});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late final NotificationApiClient _client;
  List<AppNotification> _items = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _client = NotificationApiClient(widget.authToken);
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final items = await _client.getNotifications();
      setState(() => _items = items);
    } catch (_) {}
    setState(() => _loading = false);
  }

  Future<void> _markAllRead() async {
    await _client.markAllRead();
    setState(() => _items = _items.map((n) => AppNotification(
          id: n.id, type: n.type, title: n.title, body: n.body,
          read: true, createdAt: n.createdAt, dataJson: n.dataJson,
        )).toList());
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  IconData _iconFor(String type) {
    switch (type) {
      case 'report_ready': return Icons.description_outlined;
      case 'report_updated': return Icons.update_outlined;
      case 'nearby_watch_alert': return Icons.location_on_outlined;
      case 'hotspot_alert': return Icons.warning_amber_outlined;
      case 'contribution_status': return Icons.volunteer_activism_outlined;
      case 'payment_confirmed': return Icons.check_circle_outline;
      default: return Icons.notifications_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    final unread = _items.where((n) => !n.read).length;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (unread > 0)
            TextButton(
              onPressed: _markAllRead,
              child: const Text('Mark all read'),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _items.isEmpty
              ? _EmptyState()
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.separated(
                    itemCount: _items.length,
                    separatorBuilder: (_, __) => const Divider(height: 0),
                    itemBuilder: (_, i) {
                      final n = _items[i];
                      return ListTile(
                        leading: CircleAvatar(
                          backgroundColor: n.read
                              ? Colors.grey.shade200
                              : Theme.of(context).colorScheme.primary.withOpacity(0.12),
                          child: Icon(_iconFor(n.type),
                              size: 20,
                              color: n.read
                                  ? Colors.grey
                                  : Theme.of(context).colorScheme.primary),
                        ),
                        title: Text(n.title,
                            style: TextStyle(
                                fontWeight: n.read ? FontWeight.normal : FontWeight.bold,
                                fontSize: 14)),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(n.body, style: const TextStyle(fontSize: 13)),
                            const SizedBox(height: 2),
                            Text(_timeAgo(n.createdAt),
                                style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
                          ],
                        ),
                        isThreeLine: true,
                        onTap: () async {
                          if (!n.read) {
                            await _client.markRead(n.id);
                            setState(() => _items = _items.map((x) => x.id == n.id
                                ? AppNotification(id: x.id, type: x.type, title: x.title, body: x.body, read: true, createdAt: x.createdAt, dataJson: x.dataJson)
                                : x).toList());
                          }
                          // Handle tap navigation based on type
                          final data = n.dataJson;
                          if (data != null && mounted) {
                            if (n.type == 'report_ready' || n.type == 'report_updated') {
                              Navigator.of(context).pushNamed('/report', arguments: data['reportId']);
                            } else if (n.type == 'nearby_watch_alert') {
                              Navigator.of(context).pushNamed('/watch');
                            }
                          }
                        },
                      );
                    },
                  ),
                ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.notifications_none_outlined, size: 48, color: Colors.grey.shade400),
          const SizedBox(height: 12),
          Text('No notifications yet', style: TextStyle(color: Colors.grey.shade600)),
          const SizedBox(height: 6),
          Text('You\'ll be notified about nearby alerts\nand vehicle report updates.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
        ],
      ),
    );
  }
}
