// apps/mobile/lib/features/watch/watch_map_widget.dart
//
// Dependencies to add to pubspec.yaml:
//   flutter_map: ^6.1.0
//   latlong2: ^0.9.0
//   geolocator: ^11.0.0
//   dio: ^5.4.0   (already in project)

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:dio/dio.dart';

const _apiBase = String.fromEnvironment('API_URL', defaultValue: 'https://api.culicars.com');

// Nairobi default
const _defaultCenter = LatLng(-1.2921, 36.8219);

const _alertColors = <String, Color>{
  'stolen_vehicle': Color(0xFFEF4444),
  'recovered_vehicle': Color(0xFF22C55E),
  'damage': Color(0xFFF97316),
  'vandalism': Color(0xFFA855F7),
  'parts_theft': Color(0xFFF59E0B),
  'suspicious_activity': Color(0xFF6366F1),
  'hijack': Color(0xFFDC2626),
};

Color _colorFor(String type) => _alertColors[type] ?? const Color(0xFF64748B);

String _labelFor(String type) =>
    type.replaceAll('_', ' ').replaceFirstMapped(RegExp(r'\b\w'), (m) => m[0]!.toUpperCase());

class WatchMapWidget extends StatefulWidget {
  const WatchMapWidget({super.key});

  @override
  State<WatchMapWidget> createState() => _WatchMapWidgetState();
}

class _WatchMapWidgetState extends State<WatchMapWidget> {
  final _mapController = MapController();
  final _dio = Dio();

  LatLng _center = _defaultCenter;
  List<_AlertPin> _pins = [];
  _AlertPin? _selected;
  String _typeFilter = '';
  bool _loading = true;

  static const _alertTypes = [
    'stolen_vehicle',
    'recovered_vehicle',
    'damage',
    'vandalism',
    'parts_theft',
    'suspicious_activity',
    'hijack',
  ];

  @override
  void initState() {
    super.initState();
    _initLocation();
    _fetchPins();
  }

  Future<void> _initLocation() async {
    try {
      final permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) return;
      final pos = await Geolocator.getCurrentPosition();
      if (!mounted) return;
      setState(() => _center = LatLng(pos.latitude, pos.longitude));
      _mapController.move(_center, 14);
    } catch (_) {}
  }

  Future<void> _fetchPins() async {
    setState(() => _loading = true);
    try {
      final params = <String, dynamic>{};
      if (_typeFilter.isNotEmpty) params['type'] = _typeFilter;
      final res = await _dio.get('$_apiBase/watch/map/pins', queryParameters: params);
      final list = (res.data['pins'] as List? ?? []);
      setState(() {
        _pins = list.map((e) => _AlertPin.fromJson(e as Map<String, dynamic>)).toList();
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _fetchDetail(String id) async {
    try {
      final res = await _dio.get('$_apiBase/watch/map/pins/$id');
      final detail = _AlertPin.fromJson(res.data['alert'] as Map<String, dynamic>);
      setState(() => _selected = detail);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: _center,
            initialZoom: 13,
            onTap: (_, __) => setState(() => _selected = null),
          ),
          children: [
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.culicars.app',
            ),
            MarkerLayer(markers: _buildMarkers()),
          ],
        ),

        // Filter chips
        Positioned(
          top: 12,
          left: 12,
          right: 12,
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _FilterChip(
                  label: 'All',
                  selected: _typeFilter.isEmpty,
                  color: Colors.grey.shade800,
                  onTap: () {
                    setState(() => _typeFilter = '');
                    _fetchPins();
                  },
                ),
                ..._alertTypes.map((t) => _FilterChip(
                      label: _labelFor(t),
                      selected: _typeFilter == t,
                      color: _colorFor(t),
                      onTap: () {
                        setState(() => _typeFilter = _typeFilter == t ? '' : t);
                        _fetchPins();
                      },
                    )),
              ],
            ),
          ),
        ),

        if (_loading)
          const Center(child: CircularProgressIndicator()),

        // Bottom sheet
        if (_selected != null)
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _AlertBottomSheet(
              pin: _selected!,
              onClose: () => setState(() => _selected = null),
            ),
          ),
      ],
    );
  }

  List<Marker> _buildMarkers() {
    return _pins.map((pin) {
      final color = _colorFor(pin.type);
      return Marker(
        point: LatLng(pin.lat, pin.lng),
        width: 20,
        height: 20,
        child: GestureDetector(
          onTap: () => _fetchDetail(pin.id),
          child: Container(
            width: 14,
            height: 14,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
              boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 4)],
            ),
          ),
        ),
      );
    }).toList();
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final Color color;
  final VoidCallback onTap;

  const _FilterChip({required this.label, required this.selected, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        margin: const EdgeInsets.only(right: 6),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? color : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? color : Colors.grey.shade300),
          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 3, offset: Offset(0, 1))],
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: selected ? Colors.white : Colors.grey.shade800,
          ),
        ),
      ),
    );
  }
}

class _AlertBottomSheet extends StatelessWidget {
  final _AlertPin pin;
  final VoidCallback onClose;

  const _AlertBottomSheet({required this.pin, required this.onClose});

  String _timeAgo(String iso) {
    final diff = DateTime.now().difference(DateTime.parse(iso));
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inHours < 1) return '${diff.inMinutes}m ago';
    if (diff.inDays < 1) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  @override
  Widget build(BuildContext context) {
    final color = _colorFor(pin.type);
    return Container(
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 16, offset: Offset(0, -2))],
      ),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(4)),
                child: Text(_labelFor(pin.type), style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
              ),
              const Spacer(),
              GestureDetector(
                onTap: onClose,
                child: const Icon(Icons.close, size: 20, color: Colors.grey),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            pin.plate ?? pin.vin ?? 'Unknown vehicle',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          Text(_timeAgo(pin.createdAt), style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
          if (pin.description != null && pin.description!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(pin.description!, style: const TextStyle(fontSize: 13)),
          ],
          if (pin.plate != null) ...[
            const SizedBox(height: 12),
            GestureDetector(
              onTap: () {
                // Navigate to search/report — handled by GoRouter
                Navigator.of(context).pushNamed('/search', arguments: pin.plate);
              },
              child: Text(
                'View vehicle report →',
                style: TextStyle(fontSize: 13, color: Theme.of(context).colorScheme.primary),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _AlertPin {
  final String id;
  final String? plate;
  final String? vin;
  final String type;
  final double lat;
  final double lng;
  final String? description;
  final String createdAt;

  const _AlertPin({
    required this.id,
    required this.plate,
    required this.vin,
    required this.type,
    required this.lat,
    required this.lng,
    required this.description,
    required this.createdAt,
  });

  factory _AlertPin.fromJson(Map<String, dynamic> j) => _AlertPin(
        id: j['id'] as String,
        plate: j['plate'] as String?,
        vin: j['vin'] as String?,
        type: j['type'] as String? ?? 'unknown',
        lat: (j['lat'] as num).toDouble(),
        lng: (j['lng'] as num).toDouble(),
        description: j['description'] as String?,
        createdAt: j['createdAt'] as String? ?? j['created_at'] as String? ?? '',
      );
}
