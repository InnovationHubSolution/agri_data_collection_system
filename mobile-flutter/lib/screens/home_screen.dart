import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/survey.dart';
import '../services/sync_service.dart';
import 'survey_form_screen.dart';
import 'survey_list_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  Map<String, dynamic>? _stats;
  bool _isLoadingStats = true;

  @override
  void initState() {
    super.initState();
    _loadStatistics();
  }

  Future<void> _loadStatistics() async {
    setState(() => _isLoadingStats = true);
    final provider = Provider.of<SurveyProvider>(context, listen: false);
    final stats = await provider.getStatistics();
    setState(() {
      _stats = stats;
      _isLoadingStats = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Agriculture Data System'),
        backgroundColor: Colors.green[700],
      ),
      body: _selectedIndex == 0 ? _buildDashboard() : _buildSelectedScreen(),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() => _selectedIndex = index);
          if (index == 0) _loadStatistics();
        },
        type: BottomNavigationBarType.fixed,
        selectedItemColor: Colors.green[700],
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.add_circle),
            label: 'New Survey',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.list),
            label: 'Surveys',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );
  }

  Widget _buildDashboard() {
    return RefreshIndicator(
      onRefresh: _loadStatistics,
      child: _isLoadingStats
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  'Statistics',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Colors.green[700],
                      ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        'Total Surveys',
                        _stats?['totalSurveys']?.toString() ?? '0',
                        Icons.assignment,
                        Colors.blue,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildStatCard(
                        'Synced',
                        _stats?['syncedSurveys']?.toString() ?? '0',
                        Icons.cloud_done,
                        Colors.green,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        'Not Synced',
                        _stats?['unsyncedSurveys']?.toString() ?? '0',
                        Icons.cloud_upload,
                        Colors.orange,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _buildStatCard(
                        'Total Area',
                        '${(_stats?['totalArea'] ?? 0.0).toStringAsFixed(1)} ha',
                        Icons.landscape,
                        Colors.purple,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Text(
                  'Quick Actions',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 12),
                Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Colors.green[700],
                      child: const Icon(Icons.add, color: Colors.white),
                    ),
                    title: const Text('Create New Survey'),
                    subtitle: const Text('Collect field data'),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    onTap: () => setState(() => _selectedIndex = 1),
                  ),
                ),
                Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Colors.blue[700],
                      child: const Icon(Icons.sync, color: Colors.white),
                    ),
                    title: const Text('Sync Data'),
                    subtitle: Text(
                      '${_stats?['unsyncedSurveys'] ?? 0} surveys pending',
                    ),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    onTap: () => setState(() => _selectedIndex = 2),
                  ),
                ),
                Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Colors.orange[700],
                      child: const Icon(Icons.list, color: Colors.white),
                    ),
                    title: const Text('View All Surveys'),
                    subtitle: Text('${_stats?['totalSurveys'] ?? 0} total'),
                    trailing: const Icon(Icons.arrow_forward_ios),
                    onTap: () => setState(() => _selectedIndex = 2),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(icon, size: 36, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSelectedScreen() {
    switch (_selectedIndex) {
      case 1:
        return const SurveyFormScreen();
      case 2:
        return const SurveyListScreen();
      case 3:
        return const SettingsScreen();
      default:
        return _buildDashboard();
    }
  }
}
