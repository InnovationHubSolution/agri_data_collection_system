import 'package:flutter/foundation.dart';
import '../database/database_helper.dart';

class Survey {
  final int? id;
  final String clientId;
  final String deviceId;
  final String? userId;
  final String farmerName;
  final int? householdSize;
  final String? phone;
  final String? village;
  final String? island;
  final double? latitude;
  final double? longitude;
  final double? gpsAccuracy;
  final double? farmSize;
  final List<String> crops;
  final Map<String, int> livestock;
  final String? pestIssues;
  final String? pestSeverity;
  final String? pestDescription;
  final String? treatmentUsed;
  final DateTime? harvestDate;
  final String? notes;
  final DateTime timestamp;
  final bool synced;

  Survey({
    this.id,
    required this.clientId,
    required this.deviceId,
    this.userId,
    required this.farmerName,
    this.householdSize,
    this.phone,
    this.village,
    this.island,
    this.latitude,
    this.longitude,
    this.gpsAccuracy,
    this.farmSize,
    required this.crops,
    required this.livestock,
    this.pestIssues,
    this.pestSeverity,
    this.pestDescription,
    this.treatmentUsed,
    this.harvestDate,
    this.notes,
    required this.timestamp,
    this.synced = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'clientId': clientId,
      'deviceId': deviceId,
      'userId': userId,
      'farmerName': farmerName,
      'householdSize': householdSize,
      'phone': phone,
      'village': village,
      'island': island,
      'latitude': latitude,
      'longitude': longitude,
      'gpsAccuracy': gpsAccuracy,
      'farmSize': farmSize,
      'crops': crops.join(','),
      'livestock': livestock.entries.map((e) => '${e.key}:${e.value}').join(','),
      'pestIssues': pestIssues,
      'pestSeverity': pestSeverity,
      'pestDescription': pestDescription,
      'treatmentUsed': treatmentUsed,
      'harvestDate': harvestDate?.toIso8601String(),
      'notes': notes,
      'timestamp': timestamp.toIso8601String(),
      'synced': synced ? 1 : 0,
    };
  }

  factory Survey.fromMap(Map<String, dynamic> map) {
    return Survey(
      id: map['id'],
      clientId: map['clientId'],
      deviceId: map['deviceId'],
      userId: map['userId'],
      farmerName: map['farmerName'],
      householdSize: map['householdSize'],
      phone: map['phone'],
      village: map['village'],
      island: map['island'],
      latitude: map['latitude'],
      longitude: map['longitude'],
      gpsAccuracy: map['gpsAccuracy'],
      farmSize: map['farmSize'],
      crops: map['crops']?.split(',') ?? [],
      livestock: Map.fromEntries(
        (map['livestock'] ?? '').split(',').where((s) => s.isNotEmpty).map((s) {
          final parts = s.split(':');
          return MapEntry(parts[0], int.tryParse(parts[1]) ?? 0);
        })
      ),
      pestIssues: map['pestIssues'],
      pestSeverity: map['pestSeverity'],
      pestDescription: map['pestDescription'],
      treatmentUsed: map['treatmentUsed'],
      harvestDate: map['harvestDate'] != null ? DateTime.parse(map['harvestDate']) : null,
      notes: map['notes'],
      timestamp: DateTime.parse(map['timestamp']),
      synced: map['synced'] == 1,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'clientId': clientId,
      'deviceId': deviceId,
      'userId': userId,
      'farmerName': farmerName,
      'householdSize': householdSize,
      'phone': phone,
      'village': village,
      'island': island,
      'latitude': latitude,
      'longitude': longitude,
      'gpsAccuracy': gpsAccuracy,
      'farmSize': farmSize,
      'crops': crops,
      'livestock': livestock,
      'pestIssues': pestIssues,
      'pestSeverity': pestSeverity,
      'pestDescription': pestDescription,
      'treatmentUsed': treatmentUsed,
      'harvestDate': harvestDate?.toIso8601String(),
      'notes': notes,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

class SurveyProvider with ChangeNotifier {
  final DatabaseHelper _db = DatabaseHelper.instance;
  List<Survey> _surveys = [];
  bool _isLoading = false;

  List<Survey> get surveys => _surveys;
  bool get isLoading => _isLoading;

  Future<void> loadSurveys() async {
    _isLoading = true;
    notifyListeners();

    final data = await _db.getAllSurveys();
    _surveys = data.map((map) => Survey.fromMap(map)).toList();

    _isLoading = false;
    notifyListeners();
  }

  Future<void> saveSurvey(Survey survey) async {
    await _db.createSurvey(survey.toMap());
    await loadSurveys();
  }

  Future<void> updateSurvey(int id, Survey survey) async {
    await _db.updateSurvey(id, survey.toMap());
    await loadSurveys();
  }

  Future<void> deleteSurvey(int id) async {
    await _db.deleteSurvey(id);
    await loadSurveys();
  }

  Future<List<Survey>> getUnsyncedSurveys() async {
    final data = await _db.getUnsyncedSurveys();
    return data.map((map) => Survey.fromMap(map)).toList();
  }

  Future<void> markSynced(int id) async {
    await _db.markSynced(id);
    await loadSurveys();
  }

  Future<Map<String, dynamic>> getStatistics() async {
    return await _db.getStatistics();
  }
}
