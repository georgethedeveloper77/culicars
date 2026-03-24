// lib/features/report_stolen/providers/stolen_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../shared/models/stolen_report.dart';

final _api = ApiClient();

final myStolenReportsProvider = FutureProvider<List<StolenReport>>((ref) async {
  final data = await _api.get('/stolen-reports?mine=true');
  return (data as List<dynamic>)
      .map((r) => StolenReport.fromJson(r as Map<String, dynamic>))
      .toList();
});

Future<StolenReport> submitStolenReport(Map<String, dynamic> payload) async {
  final data = await _api.post('/stolen-reports', body: payload);
  return StolenReport.fromJson(data as Map<String, dynamic>);
}

Future<void> markRecovered(String reportId, Map<String, dynamic> payload) async {
  await _api.post('/stolen-reports/$reportId/recovered', body: payload);
}
