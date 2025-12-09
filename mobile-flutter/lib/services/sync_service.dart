import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/survey.dart';

class SyncService {
  static const String defaultBaseUrl = 'http://localhost:3000';
  String _baseUrl = defaultBaseUrl;
  String? _authToken;

  SyncService() {
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _baseUrl = prefs.getString('serverUrl') ?? defaultBaseUrl;
    _authToken = prefs.getString('authToken');
  }

  Future<void> setServerUrl(String url) async {
    _baseUrl = url;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('serverUrl', url);
  }

  Future<void> setAuthToken(String token) async {
    _authToken = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('authToken', token);
  }

  Future<bool> isOnline() async {
    final connectivityResult = await Connectivity().checkConnectivity();
    return connectivityResult != ConnectivityResult.none;
  }

  Future<Map<String, dynamic>> login(String username, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': username,
          'password': password,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await setAuthToken(data['token']);
        return {'success': true, 'user': data['user']};
      } else {
        return {
          'success': false,
          'error': jsonDecode(response.body)['error'] ?? 'Login failed'
        };
      }
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<Map<String, dynamic>> syncSurveys(
    List<Survey> surveys,
    String deviceId,
  ) async {
    if (!await isOnline()) {
      return {
        'success': false,
        'error': 'No internet connection',
        'syncedCount': 0,
      };
    }

    try {
      final surveyData = surveys.map((s) => s.toJson()).toList();

      final headers = <String, String>{
        'Content-Type': 'application/json',
        'X-Device-ID': deviceId,
      };

      if (_authToken != null) {
        headers['Authorization'] = 'Bearer $_authToken';
      }

      final response = await http.post(
        Uri.parse('$_baseUrl/api/sync'),
        headers: headers,
        body: jsonEncode(surveyData),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return {
          'success': true,
          'syncedCount': data['syncedCount'],
          'conflictCount': data['conflictCount'] ?? 0,
          'conflicts': data['conflicts'] ?? [],
        };
      } else {
        return {
          'success': false,
          'error': 'Server error: ${response.statusCode}',
          'syncedCount': 0,
        };
      }
    } catch (e) {
      return {
        'success': false,
        'error': e.toString(),
        'syncedCount': 0,
      };
    }
  }

  Future<Map<String, dynamic>> fetchDashboardData() async {
    if (!await isOnline() || _authToken == null) {
      return {'success': false, 'error': 'Not authenticated or offline'};
    }

    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/dashboard'),
        headers: {
          'Authorization': 'Bearer $_authToken',
        },
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': jsonDecode(response.body),
        };
      } else {
        return {'success': false, 'error': 'Failed to fetch data'};
      }
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<bool> testConnection() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/health'),
      ).timeout(const Duration(seconds: 5));

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
