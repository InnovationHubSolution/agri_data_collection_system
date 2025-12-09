import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/survey.dart';
import '../services/sync_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class SurveyListScreen extends StatefulWidget {
  const SurveyListScreen({Key? key}) : super(key: key);

  @override
  State<SurveyListScreen> createState() => _SurveyListScreenState();
}

class _SurveyListScreenState extends State<SurveyListScreen> {
  bool _isSyncing = false;

  @override
  void initState() {
    super.initState();
    _loadSurveys();
  }

  Future<void> _loadSurveys() async {
    await Provider.of<SurveyProvider>(context, listen: false).loadSurveys();
  }

  Future<void> _syncData() async {
    setState(() => _isSyncing = true);

    try {
      final syncService = SyncService();
      final provider = Provider.of<SurveyProvider>(context, listen: false);
      
      final unsyncedSurveys = await provider.getUnsyncedSurveys();
      
      if (unsyncedSurveys.isEmpty) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No surveys to sync')),
          );
        }
        setState(() => _isSyncing = false);
        return;
      }

      final prefs = await SharedPreferences.getInstance();
      final deviceId = prefs.getString('deviceId') ?? 'flutter-device';

      final result = await syncService.syncSurveys(unsyncedSurveys, deviceId);

      if (result['success']) {
        // Mark surveys as synced
        for (var survey in unsyncedSurveys) {
          if (survey.id != null) {
            await provider.markSynced(survey.id!);
          }
        }

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Synced ${result['syncedCount']} surveys successfully!',
              ),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Sync failed: ${result['error']}'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Sync error: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isSyncing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Survey List'),
        backgroundColor: Colors.green[700],
        actions: [
          IconButton(
            icon: _isSyncing
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : const Icon(Icons.sync),
            onPressed: _isSyncing ? null : _syncData,
            tooltip: 'Sync Data',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadSurveys,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: Consumer<SurveyProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.surveys.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.inbox, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    'No surveys yet',
                    style: TextStyle(fontSize: 18, color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Create your first survey!',
                    style: TextStyle(color: Colors.grey[500]),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(8),
            itemCount: provider.surveys.length,
            itemBuilder: (context, index) {
              final survey = provider.surveys[index];
              return Card(
                margin: const EdgeInsets.symmetric(vertical: 4),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: survey.synced ? Colors.green : Colors.orange,
                    child: Icon(
                      survey.synced ? Icons.cloud_done : Icons.cloud_upload,
                      color: Colors.white,
                    ),
                  ),
                  title: Text(
                    survey.farmerName,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${survey.village ?? 'Unknown'} - ${survey.island ?? 'Unknown'}',
                      ),
                      Text(
                        survey.timestamp.toString().split('.')[0],
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                      if (survey.latitude != null)
                        Text(
                          'GPS: ${survey.latitude!.toStringAsFixed(4)}, ${survey.longitude!.toStringAsFixed(4)}',
                          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                        ),
                    ],
                  ),
                  trailing: PopupMenuButton(
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'view',
                        child: Row(
                          children: [
                            Icon(Icons.visibility, size: 20),
                            SizedBox(width: 8),
                            Text('View Details'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(Icons.delete, size: 20, color: Colors.red),
                            SizedBox(width: 8),
                            Text('Delete', style: TextStyle(color: Colors.red)),
                          ],
                        ),
                      ),
                    ],
                    onSelected: (value) async {
                      if (value == 'delete') {
                        final confirm = await showDialog<bool>(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: const Text('Delete Survey'),
                            content: const Text(
                              'Are you sure you want to delete this survey?',
                            ),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context, false),
                                child: const Text('Cancel'),
                              ),
                              TextButton(
                                onPressed: () => Navigator.pop(context, true),
                                child: const Text(
                                  'Delete',
                                  style: TextStyle(color: Colors.red),
                                ),
                              ),
                            ],
                          ),
                        );

                        if (confirm == true && survey.id != null) {
                          await provider.deleteSurvey(survey.id!);
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Survey deleted')),
                            );
                          }
                        }
                      } else if (value == 'view') {
                        _showSurveyDetails(survey);
                      }
                    },
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  void _showSurveyDetails(Survey survey) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(survey.farmerName),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              _detailRow('Village', survey.village ?? 'N/A'),
              _detailRow('Island', survey.island ?? 'N/A'),
              _detailRow('Household Size', survey.householdSize?.toString() ?? 'N/A'),
              _detailRow('Phone', survey.phone ?? 'N/A'),
              _detailRow('Farm Size', survey.farmSize != null ? '${survey.farmSize} ha' : 'N/A'),
              _detailRow('Crops', survey.crops.join(', ')),
              _detailRow('Cattle', survey.livestock['cattle']?.toString() ?? '0'),
              _detailRow('Pigs', survey.livestock['pigs']?.toString() ?? '0'),
              _detailRow('Chickens', survey.livestock['chickens']?.toString() ?? '0'),
              _detailRow('Goats', survey.livestock['goats']?.toString() ?? '0'),
              _detailRow('Pest Issues', survey.pestIssues ?? 'None'),
              if (survey.pestIssues != 'none') ...[
                _detailRow('Severity', survey.pestSeverity ?? 'N/A'),
                _detailRow('Description', survey.pestDescription ?? 'N/A'),
              ],
              _detailRow('Status', survey.synced ? 'Synced' : 'Not Synced'),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
