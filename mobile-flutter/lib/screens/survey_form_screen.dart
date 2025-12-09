import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:uuid/uuid.dart';
import '../models/survey.dart';
import '../services/location_service.dart';
import '../services/sync_service.dart';
import 'dart:convert';
import 'dart:io';

class SurveyFormScreen extends StatefulWidget {
  const SurveyFormScreen({Key? key}) : super(key: key);

  @override
  State<SurveyFormScreen> createState() => _SurveyFormScreenState();
}

class _SurveyFormScreenState extends State<SurveyFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _uuid = const Uuid();
  final _imagePicker = ImagePicker();

  // Form controllers
  final _farmerNameController = TextEditingController();
  final _householdSizeController = TextEditingController();
  final _phoneController = TextEditingController();
  final _villageController = TextEditingController();
  final _farmSizeController = TextEditingController();
  final _pestDescController = TextEditingController();
  final _treatmentController = TextEditingController();
  final _notesController = TextEditingController();

  // Form state
  String? _selectedIsland;
  double? _latitude;
  double? _longitude;
  double? _gpsAccuracy;
  final Set<String> _selectedCrops = {};
  final Map<String, int> _livestock = {
    'cattle': 0,
    'pigs': 0,
    'chickens': 0,
    'goats': 0,
  };
  String? _pestIssues = 'none';
  String? _pestSeverity;
  DateTime? _harvestDate;
  final List<File> _photos = [];

  bool _isLoadingLocation = false;
  bool _isSaving = false;

  final List<String> _islands = [
    'Efate',
    'Santo',
    'Malekula',
    'Tanna',
    'Pentecost',
    'Ambrym',
    'Epi',
    'Other'
  ];

  final List<String> _cropOptions = [
    'Copra (Coconut)',
    'Kava',
    'Cocoa',
    'Taro',
    'Yam',
    'Cassava',
    'Banana',
    'Other vegetables',
  ];

  @override
  void dispose() {
    _farmerNameController.dispose();
    _householdSizeController.dispose();
    _phoneController.dispose();
    _villageController.dispose();
    _farmSizeController.dispose();
    _pestDescController.dispose();
    _treatmentController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _getCurrentLocation() async {
    setState(() => _isLoadingLocation = true);

    final position = await LocationService.getCurrentLocation();

    if (position != null) {
      setState(() {
        _latitude = position.latitude;
        _longitude = position.longitude;
        _gpsAccuracy = position.accuracy;
        _isLoadingLocation = false;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'Location captured! Accuracy: ${_gpsAccuracy?.toStringAsFixed(1)}m',
            ),
            backgroundColor: Colors.green,
          ),
        );
      }
    } else {
      setState(() => _isLoadingLocation = false);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Failed to get location. Check permissions.'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _takePhoto() async {
    final XFile? photo = await _imagePicker.pickImage(
      source: ImageSource.camera,
      maxWidth: 1920,
      maxHeight: 1080,
      imageQuality: 85,
    );

    if (photo != null) {
      setState(() {
        _photos.add(File(photo.path));
      });
    }
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _harvestDate ?? DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );

    if (picked != null) {
      setState(() => _harvestDate = picked);
    }
  }

  Future<void> _saveSurvey() async {
    if (!_formKey.currentState!.validate()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill required fields')),
      );
      return;
    }

    setState(() => _isSaving = true);

    try {
      final deviceId = 'flutter-${Platform.operatingSystem}';
      
      final survey = Survey(
        clientId: _uuid.v4(),
        deviceId: deviceId,
        farmerName: _farmerNameController.text,
        householdSize: int.tryParse(_householdSizeController.text),
        phone: _phoneController.text.isNotEmpty ? _phoneController.text : null,
        village: _villageController.text.isNotEmpty ? _villageController.text : null,
        island: _selectedIsland,
        latitude: _latitude,
        longitude: _longitude,
        gpsAccuracy: _gpsAccuracy,
        farmSize: double.tryParse(_farmSizeController.text),
        crops: _selectedCrops.toList(),
        livestock: _livestock,
        pestIssues: _pestIssues,
        pestSeverity: _pestSeverity,
        pestDescription: _pestDescController.text.isNotEmpty ? _pestDescController.text : null,
        treatmentUsed: _treatmentController.text.isNotEmpty ? _treatmentController.text : null,
        harvestDate: _harvestDate,
        notes: _notesController.text.isNotEmpty ? _notesController.text : null,
        timestamp: DateTime.now(),
      );

      await Provider.of<SurveyProvider>(context, listen: false).saveSurvey(survey);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Survey saved successfully!'),
            backgroundColor: Colors.green,
          ),
        );

        // Reset form
        _formKey.currentState!.reset();
        _farmerNameController.clear();
        _householdSizeController.clear();
        _phoneController.clear();
        _villageController.clear();
        _farmSizeController.clear();
        _pestDescController.clear();
        _treatmentController.clear();
        _notesController.clear();
        setState(() {
          _selectedIsland = null;
          _latitude = null;
          _longitude = null;
          _gpsAccuracy = null;
          _selectedCrops.clear();
          _livestock.updateAll((key, value) => 0);
          _pestIssues = 'none';
          _pestSeverity = null;
          _harvestDate = null;
          _photos.clear();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error saving survey: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('New Survey'),
        backgroundColor: Colors.green[700],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Farmer Information
            _buildSection(
              'Farmer Information',
              Icons.person,
              [
                TextFormField(
                  controller: _farmerNameController,
                  decoration: const InputDecoration(
                    labelText: 'Farmer Name *',
                    border: OutlineInputBorder(),
                  ),
                  validator: (value) =>
                      value?.isEmpty ?? true ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _householdSizeController,
                  decoration: const InputDecoration(
                    labelText: 'Household Size',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _phoneController,
                  decoration: const InputDecoration(
                    labelText: 'Phone Number',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.phone,
                ),
              ],
            ),

            // Location
            _buildSection(
              'Location',
              Icons.location_on,
              [
                TextFormField(
                  controller: _villageController,
                  decoration: const InputDecoration(
                    labelText: 'Village',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _selectedIsland,
                  decoration: const InputDecoration(
                    labelText: 'Island',
                    border: OutlineInputBorder(),
                  ),
                  items: _islands.map((island) {
                    return DropdownMenuItem(
                      value: island,
                      child: Text(island),
                    );
                  }).toList(),
                  onChanged: (value) => setState(() => _selectedIsland = value),
                ),
                const SizedBox(height: 12),
                ElevatedButton.icon(
                  onPressed: _isLoadingLocation ? null : _getCurrentLocation,
                  icon: _isLoadingLocation
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.my_location),
                  label: Text(_latitude == null ? 'Get GPS Location' : 'Update GPS'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(48),
                  ),
                ),
                if (_latitude != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      'GPS: ${_latitude!.toStringAsFixed(6)}, ${_longitude!.toStringAsFixed(6)}\n'
                      'Accuracy: ${_gpsAccuracy!.toStringAsFixed(1)}m',
                      style: TextStyle(color: Colors.grey[600], fontSize: 12),
                    ),
                  ),
              ],
            ),

            // Farm Details
            _buildSection(
              'Farm Details',
              Icons.agriculture,
              [
                TextFormField(
                  controller: _farmSizeController,
                  decoration: const InputDecoration(
                    labelText: 'Farm Size (hectares)',
                    border: OutlineInputBorder(),
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                const Text('Crops Grown:', style: TextStyle(fontWeight: FontWeight.bold)),
                ..._cropOptions.map((crop) {
                  return CheckboxListTile(
                    title: Text(crop),
                    value: _selectedCrops.contains(crop),
                    onChanged: (checked) {
                      setState(() {
                        if (checked!) {
                          _selectedCrops.add(crop);
                        } else {
                          _selectedCrops.remove(crop);
                        }
                      });
                    },
                  );
                }).toList(),
              ],
            ),

            // Livestock
            _buildSection(
              'Livestock',
              Icons.pets,
              _livestock.keys.map((animal) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: TextFormField(
                    decoration: InputDecoration(
                      labelText: '${animal[0].toUpperCase()}${animal.substring(1)}',
                      border: const OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                    initialValue: _livestock[animal].toString(),
                    onChanged: (value) {
                      _livestock[animal] = int.tryParse(value) ?? 0;
                    },
                  ),
                );
              }).toList(),
            ),

            // Pests & Diseases
            _buildSection(
              'Pests & Diseases',
              Icons.bug_report,
              [
                DropdownButtonFormField<String>(
                  value: _pestIssues,
                  decoration: const InputDecoration(
                    labelText: 'Issues Present?',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'none', child: Text('None')),
                    DropdownMenuItem(value: 'pests', child: Text('Pests')),
                    DropdownMenuItem(value: 'disease', child: Text('Disease')),
                    DropdownMenuItem(value: 'both', child: Text('Both')),
                  ],
                  onChanged: (value) => setState(() => _pestIssues = value),
                ),
                if (_pestIssues != 'none') ...[
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: _pestSeverity,
                    decoration: const InputDecoration(
                      labelText: 'Severity',
                      border: OutlineInputBorder(),
                    ),
                    items: const [
                      DropdownMenuItem(value: 'low', child: Text('Low')),
                      DropdownMenuItem(value: 'medium', child: Text('Medium')),
                      DropdownMenuItem(value: 'high', child: Text('High')),
                    ],
                    onChanged: (value) => setState(() => _pestSeverity = value),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _pestDescController,
                    decoration: const InputDecoration(
                      labelText: 'Description',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 2,
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _treatmentController,
                    decoration: const InputDecoration(
                      labelText: 'Treatment Used',
                      border: OutlineInputBorder(),
                    ),
                    maxLines: 2,
                  ),
                ],
              ],
            ),

            // Harvest Date
            _buildSection(
              'Harvest Information',
              Icons.calendar_today,
              [
                ListTile(
                  title: Text(
                    _harvestDate == null
                        ? 'Select Harvest Date'
                        : 'Harvest Date: ${_harvestDate!.toString().split(' ')[0]}',
                  ),
                  trailing: const Icon(Icons.calendar_today),
                  onTap: _selectDate,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                    side: BorderSide(color: Colors.grey[400]!),
                  ),
                ),
              ],
            ),

            // Photos
            _buildSection(
              'Photos',
              Icons.camera_alt,
              [
                ElevatedButton.icon(
                  onPressed: _takePhoto,
                  icon: const Icon(Icons.camera_alt),
                  label: const Text('Take Photo'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    minimumSize: const Size.fromHeight(48),
                  ),
                ),
                if (_photos.isNotEmpty)
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      crossAxisSpacing: 8,
                      mainAxisSpacing: 8,
                    ),
                    itemCount: _photos.length,
                    itemBuilder: (context, index) {
                      return Stack(
                        children: [
                          Image.file(_photos[index], fit: BoxFit.cover),
                          Positioned(
                            right: 0,
                            top: 0,
                            child: IconButton(
                              icon: const Icon(Icons.close, color: Colors.red),
                              onPressed: () {
                                setState(() => _photos.removeAt(index));
                              },
                            ),
                          ),
                        ],
                      );
                    },
                  ),
              ],
            ),

            // Notes
            _buildSection(
              'Additional Notes',
              Icons.notes,
              [
                TextFormField(
                  controller: _notesController,
                  decoration: const InputDecoration(
                    labelText: 'Notes',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 4,
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Save Button
            ElevatedButton(
              onPressed: _isSaving ? null : _saveSurvey,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green[700],
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(56),
              ),
              child: _isSaving
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text('Save Survey', style: TextStyle(fontSize: 18)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, IconData icon, List<Widget> children) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: Colors.green[700]),
                const SizedBox(width: 8),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.green[700],
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            ...children,
          ],
        ),
      ),
    );
  }
}
