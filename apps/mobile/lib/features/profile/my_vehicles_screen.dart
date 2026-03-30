// apps/mobile/lib/features/profile/my_vehicles_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/api/api_client.dart';

// ── Model ─────────────────────────────────────────────────────────────────────

class UserVehicle {
  final String id;
  final String? plate;
  final String? vin;
  final String relationshipType;
  final String? nickname;
  final int alertRadiusKm;
  final DateTime createdAt;

  const UserVehicle({
    required this.id,
    this.plate,
    this.vin,
    required this.relationshipType,
    this.nickname,
    required this.alertRadiusKm,
    required this.createdAt,
  });

  factory UserVehicle.fromJson(Map<String, dynamic> j) => UserVehicle(
        id: j['id'] as String,
        plate: j['plate'] as String?,
        vin: j['vin'] as String?,
        relationshipType: j['relationship_type'] as String? ?? 'owner',
        nickname: j['nickname'] as String?,
        alertRadiusKm: (j['alert_radius_km'] as num?)?.toInt() ?? 10,
        createdAt: DateTime.tryParse(j['created_at'] as String? ?? '') ?? DateTime.now(),
      );

  String get displayLabel => nickname ?? plate ?? vin ?? 'Unknown Vehicle';
  String? get displaySub => nickname != null ? (plate ?? vin) : null;
}

// ── Providers ─────────────────────────────────────────────────────────────────

final userVehiclesProvider =
    FutureProvider.autoDispose<List<UserVehicle>>((ref) async {
  final client = ref.read(apiClientProvider);
  final data = await client.get('/user/vehicles');
  final list = (data['vehicles'] as List<dynamic>? ?? []);
  return list.map((e) => UserVehicle.fromJson(e as Map<String, dynamic>)).toList();
});

// ── Relationship helpers ──────────────────────────────────────────────────────

const _relationLabels = {
  'owner': 'Owner',
  'driver': 'Driver',
  'tracker': 'Tracking',
  'watchlist': 'Watchlist',
};

Color _relationColor(String type, BuildContext context) {
  final isDark = Theme.of(context).brightness == Brightness.dark;
  switch (type) {
    case 'owner':
      return isDark ? const Color(0xFF1A4D2E) : const Color(0xFFDCFCE7);
    case 'driver':
      return isDark ? const Color(0xFF1E3A5F) : const Color(0xFFDBEAFE);
    case 'tracker':
      return isDark ? const Color(0xFF4D3B00) : const Color(0xFFFEF9C3);
    case 'watchlist':
      return isDark ? const Color(0xFF3B1F5F) : const Color(0xFFF3E8FF);
    default:
      return isDark ? const Color(0xFF27272A) : const Color(0xFFF4F4F5);
  }
}

Color _relationTextColor(String type, BuildContext context) {
  final isDark = Theme.of(context).brightness == Brightness.dark;
  switch (type) {
    case 'owner':
      return isDark ? const Color(0xFF86EFAC) : const Color(0xFF166534);
    case 'driver':
      return isDark ? const Color(0xFF93C5FD) : const Color(0xFF1D4ED8);
    case 'tracker':
      return isDark ? const Color(0xFFFDE68A) : const Color(0xFF854D0E);
    case 'watchlist':
      return isDark ? const Color(0xFFD8B4FE) : const Color(0xFF6B21A8);
    default:
      return Theme.of(context).colorScheme.onSurface;
  }
}

// ── Add Vehicle Bottom Sheet ──────────────────────────────────────────────────

class _AddVehicleSheet extends ConsumerStatefulWidget {
  final VoidCallback onAdded;
  const _AddVehicleSheet({required this.onAdded});

  @override
  ConsumerState<_AddVehicleSheet> createState() => _AddVehicleSheetState();
}

class _AddVehicleSheetState extends ConsumerState<_AddVehicleSheet> {
  final _plateCtrl = TextEditingController();
  final _vinCtrl = TextEditingController();
  final _nicknameCtrl = TextEditingController();
  String _relationship = 'owner';
  int _alertRadius = 10;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _plateCtrl.dispose();
    _vinCtrl.dispose();
    _nicknameCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final plate = _plateCtrl.text.trim();
    final vin = _vinCtrl.text.trim();
    if (plate.isEmpty && vin.isEmpty) {
      setState(() => _error = 'Enter a plate number or VIN.');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final client = ref.read(apiClientProvider);
      await client.post('/user/vehicles', body: {
        if (plate.isNotEmpty) 'plate': plate.toUpperCase(),
        if (vin.isNotEmpty) 'vin': vin.toUpperCase(),
        'relationshipType': _relationship,
        if (_nicknameCtrl.text.trim().isNotEmpty) 'nickname': _nicknameCtrl.text.trim(),
        'alertRadiusKm': _alertRadius,
      });
      widget.onAdded();
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: theme.dividerColor,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text('Add Vehicle',
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),

              // Plate
              _Field(
                label: 'Number Plate',
                controller: _plateCtrl,
                hint: 'e.g. KDA 123A',
                onChanged: (v) => _plateCtrl.text = v.toUpperCase(),
              ),
              const SizedBox(height: 12),

              // VIN
              _Field(
                label: 'VIN (optional)',
                controller: _vinCtrl,
                hint: '17-character VIN',
              ),
              const SizedBox(height: 12),

              // Relationship
              Text('Relationship', style: theme.textTheme.labelMedium),
              const SizedBox(height: 6),
              Wrap(
                spacing: 8,
                children: ['owner', 'driver', 'tracker', 'watchlist'].map((type) {
                  final selected = _relationship == type;
                  return ChoiceChip(
                    label: Text(_relationLabels[type] ?? type),
                    selected: selected,
                    onSelected: (_) => setState(() => _relationship = type),
                    selectedColor: const Color(0xFFC8A84B),
                    labelStyle: TextStyle(
                      color: selected ? Colors.white : null,
                      fontSize: 12,
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 12),

              // Nickname
              _Field(
                label: 'Nickname (optional)',
                controller: _nicknameCtrl,
                hint: 'e.g. Family Car',
              ),
              const SizedBox(height: 12),

              // Alert radius
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Alert Radius', style: theme.textTheme.labelMedium),
                  Text('$_alertRadius km',
                      style: theme.textTheme.labelMedium?.copyWith(
                          color: const Color(0xFFC8A84B))),
                ],
              ),
              Slider(
                value: _alertRadius.toDouble(),
                min: 1,
                max: 50,
                divisions: 49,
                activeColor: const Color(0xFFC8A84B),
                onChanged: (v) => setState(() => _alertRadius = v.round()),
              ),

              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: TextStyle(color: theme.colorScheme.error, fontSize: 13)),
              ],

              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _loading ? null : _submit,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFFC8A84B),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _loading
                      ? const SizedBox(
                          height: 18, width: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Add Vehicle', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final String hint;
  final ValueChanged<String>? onChanged;
  const _Field({required this.label, required this.controller, required this.hint, this.onChanged});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: theme.textTheme.labelMedium),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          onChanged: onChanged,
          style: const TextStyle(fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: theme.hintColor, fontSize: 14),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: theme.dividerColor),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFFC8A84B)),
            ),
          ),
        ),
      ],
    );
  }
}

// ── Vehicle Card ──────────────────────────────────────────────────────────────

class _VehicleCard extends ConsumerWidget {
  final UserVehicle vehicle;
  final VoidCallback onDeleted;
  const _VehicleCard({required this.vehicle, required this.onDeleted});

  Future<void> _delete(BuildContext context, WidgetRef ref) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove Vehicle'),
        content: Text('Remove ${vehicle.displayLabel} from your list?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Remove', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    try {
      final client = ref.read(apiClientProvider);
      await client.delete('/user/vehicles/${vehicle.id}');
      onDeleted();
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final bgColor = _relationColor(vehicle.relationshipType, context);
    final labelColor = _relationTextColor(vehicle.relationshipType, context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: theme.dividerColor),
      ),
      child: Row(
        children: [
          // Icon
          Container(
            height: 44,
            width: 44,
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceVariant,
              borderRadius: BorderRadius.circular(22),
            ),
            child: Icon(Icons.directions_car_outlined,
                size: 22, color: theme.colorScheme.onSurfaceVariant),
          ),
          const SizedBox(width: 12),

          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(vehicle.displayLabel,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                if (vehicle.displaySub != null) ...[
                  const SizedBox(height: 2),
                  Text(vehicle.displaySub!,
                      style: TextStyle(fontSize: 12, color: theme.hintColor)),
                ],
                const SizedBox(height: 6),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: bgColor,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        _relationLabels[vehicle.relationshipType] ?? vehicle.relationshipType,
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: labelColor),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text('${vehicle.alertRadiusKm} km',
                        style: TextStyle(fontSize: 11, color: theme.hintColor)),
                  ],
                ),
              ],
            ),
          ),

          // Actions
          Column(
            children: [
              if (vehicle.plate != null)
                IconButton(
                  icon: const Icon(Icons.search, size: 18),
                  tooltip: 'View Report',
                  onPressed: () => context.push('/report?q=${vehicle.plate}'),
                ),
              IconButton(
                icon: const Icon(Icons.close, size: 18),
                tooltip: 'Remove',
                color: theme.hintColor,
                onPressed: () => _delete(context, ref),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Main Screen ───────────────────────────────────────────────────────────────

class MyVehiclesScreen extends ConsumerWidget {
  const MyVehiclesScreen({super.key});

  void _showAddSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _AddVehicleSheet(
        onAdded: () => ref.invalidate(userVehiclesProvider),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final vehiclesAsync = ref.watch(userVehiclesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Vehicles'),
        centerTitle: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            tooltip: 'Add Vehicle',
            onPressed: () => _showAddSheet(context, ref),
          ),
        ],
      ),
      body: vehiclesAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.error_outline, size: 40, color: theme.colorScheme.error),
              const SizedBox(height: 12),
              Text('Could not load vehicles', style: theme.textTheme.bodyMedium),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () => ref.invalidate(userVehiclesProvider),
                child: const Text('Try again'),
              ),
            ],
          ),
        ),
        data: (vehicles) {
          if (vehicles.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.directions_car_outlined,
                        size: 56,
                        color: theme.colorScheme.onSurface.withOpacity(0.2)),
                    const SizedBox(height: 16),
                    const Text('No vehicles yet',
                        style: TextStyle(fontWeight: FontWeight.w600, fontSize: 16)),
                    const SizedBox(height: 8),
                    Text(
                      'Add a vehicle to get watch alerts and quick access to reports.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 13, color: theme.hintColor),
                    ),
                    const SizedBox(height: 24),
                    FilledButton.icon(
                      onPressed: () => _showAddSheet(context, ref),
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text('Add Vehicle'),
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFFC8A84B),
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          return RefreshIndicator(
            color: const Color(0xFFC8A84B),
            onRefresh: () async => ref.invalidate(userVehiclesProvider),
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
              itemCount: vehicles.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) => _VehicleCard(
                vehicle: vehicles[i],
                onDeleted: () => ref.invalidate(userVehiclesProvider),
              ),
            ),
          );
        },
      ),
      floatingActionButton: vehiclesAsync.hasValue && (vehiclesAsync.value?.isNotEmpty ?? false)
          ? FloatingActionButton(
              onPressed: () => _showAddSheet(context, ref),
              backgroundColor: const Color(0xFFC8A84B),
              child: const Icon(Icons.add, color: Colors.white),
            )
          : null,
    );
  }
}
