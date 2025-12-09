import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'dart:convert';

class DatabaseHelper {
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('agriculture.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future _createDB(Database db, int version) async {
    const idType = 'INTEGER PRIMARY KEY AUTOINCREMENT';
    const textType = 'TEXT NOT NULL';
    const textNullable = 'TEXT';
    const intType = 'INTEGER';
    const realType = 'REAL';

    // Surveys table
    await db.execute('''
      CREATE TABLE surveys (
        id $idType,
        clientId $textType,
        deviceId $textType,
        userId $textNullable,
        farmerName $textType,
        householdSize $intType,
        phone $textNullable,
        village $textNullable,
        island $textNullable,
        latitude $realType,
        longitude $realType,
        gpsAccuracy $realType,
        farmSize $realType,
        crops $textType,
        livestock $textType,
        pestIssues $textNullable,
        pestSeverity $textNullable,
        pestDescription $textNullable,
        treatmentUsed $textNullable,
        harvestDate $textNullable,
        notes $textNullable,
        timestamp $textType,
        synced INTEGER DEFAULT 0,
        UNIQUE(clientId, deviceId)
      )
    ''');

    // Photos table
    await db.execute('''
      CREATE TABLE photos (
        id $idType,
        surveyId INTEGER NOT NULL,
        photoData $textType,
        photoType $textNullable,
        caption $textNullable,
        timestamp $textType,
        FOREIGN KEY (surveyId) REFERENCES surveys (id) ON DELETE CASCADE
      )
    ''');

    // Sync queue table
    await db.execute('''
      CREATE TABLE sync_queue (
        id $idType,
        surveyId INTEGER NOT NULL,
        attempts INTEGER DEFAULT 0,
        lastAttempt $textNullable,
        error $textNullable,
        FOREIGN KEY (surveyId) REFERENCES surveys (id) ON DELETE CASCADE
      )
    ''');

    // Create indexes
    await db.execute('CREATE INDEX idx_surveys_synced ON surveys(synced)');
    await db.execute('CREATE INDEX idx_surveys_timestamp ON surveys(timestamp DESC)');
    await db.execute('CREATE INDEX idx_photos_survey ON photos(surveyId)');
  }

  // Survey operations
  Future<int> createSurvey(Map<String, dynamic> survey) async {
    final db = await instance.database;
    return await db.insert('surveys', survey);
  }

  Future<List<Map<String, dynamic>>> getAllSurveys() async {
    final db = await instance.database;
    return await db.query('surveys', orderBy: 'timestamp DESC');
  }

  Future<List<Map<String, dynamic>>> getUnsyncedSurveys() async {
    final db = await instance.database;
    return await db.query(
      'surveys',
      where: 'synced = ?',
      whereArgs: [0],
      orderBy: 'timestamp ASC',
    );
  }

  Future<int> updateSurvey(int id, Map<String, dynamic> survey) async {
    final db = await instance.database;
    return await db.update(
      'surveys',
      survey,
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<int> markSynced(int id) async {
    final db = await instance.database;
    return await db.update(
      'surveys',
      {'synced': 1},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<int> deleteSurvey(int id) async {
    final db = await instance.database;
    return await db.delete(
      'surveys',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // Photo operations
  Future<int> createPhoto(Map<String, dynamic> photo) async {
    final db = await instance.database;
    return await db.insert('photos', photo);
  }

  Future<List<Map<String, dynamic>>> getPhotosBySurvey(int surveyId) async {
    final db = await instance.database;
    return await db.query(
      'photos',
      where: 'surveyId = ?',
      whereArgs: [surveyId],
    );
  }

  // Statistics
  Future<Map<String, dynamic>> getStatistics() async {
    final db = await instance.database;
    
    final totalSurveys = Sqflite.firstIntValue(
      await db.rawQuery('SELECT COUNT(*) FROM surveys')
    ) ?? 0;
    
    final syncedSurveys = Sqflite.firstIntValue(
      await db.rawQuery('SELECT COUNT(*) FROM surveys WHERE synced = 1')
    ) ?? 0;
    
    final unsyncedSurveys = totalSurveys - syncedSurveys;
    
    final totalArea = (await db.rawQuery(
      'SELECT SUM(farmSize) as total FROM surveys'
    )).first['total'] ?? 0.0;
    
    return {
      'totalSurveys': totalSurveys,
      'syncedSurveys': syncedSurveys,
      'unsyncedSurveys': unsyncedSurveys,
      'totalArea': totalArea,
    };
  }

  // Close database
  Future close() async {
    final db = await instance.database;
    db.close();
  }
}
