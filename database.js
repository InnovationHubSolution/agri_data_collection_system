// Database configuration using Dexie.js (IndexedDB wrapper)
import Dexie from 'dexie';

// Initialize database
export const db = new Dexie('AgricultureDataSystem');

// Define database schema
db.version(1).stores({
    surveys: '++id, farmerName, timestamp, synced, latitude, longitude, village',
    photos: '++id, surveyId, data, timestamp',
    syncQueue: '++id, surveyId, timestamp, status'
});

// Survey model
export class Survey {
    constructor(data) {
        this.id = data.id || null;
        this.timestamp = data.timestamp || new Date().toISOString();
        this.synced = data.synced || false;

        // Farmer information
        this.farmerName = data.farmerName || '';
        this.householdSize = data.householdSize || null;
        this.phoneNumber = data.phoneNumber || '';
        this.village = data.village || '';

        // Farm location
        this.latitude = data.latitude || null;
        this.longitude = data.longitude || null;

        // Crop information
        this.farmSize = data.farmSize || null;
        this.crops = data.crops || [];
        this.otherCrops = data.otherCrops || '';
        this.productionQty = data.productionQty || null;
        this.lastHarvest = data.lastHarvest || null;

        // Livestock
        this.cattle = data.cattle || 0;
        this.pigs = data.pigs || 0;
        this.poultry = data.poultry || 0;
        this.goats = data.goats || 0;

        // Pests & Diseases
        this.pestIssues = data.pestIssues || 'none';
        this.pestDetails = data.pestDetails || '';
        this.pestSeverity = data.pestSeverity || '';

        // Additional
        this.notes = data.notes || '';
        this.photos = data.photos || [];
        this.island = data.island || '';

        // Data quality metadata
        this.dataQuality = data.dataQuality || {
            completeness: 0,
            gpsAccuracy: null,
            photoCount: 0,
            hasValidation: false
        };
    }
}

// Database operations
export const dbOperations = {
    // Save survey
    async saveSurvey(surveyData) {
        const survey = new Survey(surveyData);
        const id = await db.surveys.add(survey);
        console.log('Survey saved with ID:', id);
        return id;
    },

    // Get all surveys
    async getAllSurveys() {
        return await db.surveys.toArray();
    },

    // Get survey by ID
    async getSurveyById(id) {
        return await db.surveys.get(id);
    },

    // Update survey
    async updateSurvey(id, updates) {
        return await db.surveys.update(id, updates);
    },

    // Delete survey
    async deleteSurvey(id) {
        await db.surveys.delete(id);
        await db.photos.where('surveyId').equals(id).delete();
    },

    // Get unsynced surveys
    async getUnsyncedSurveys() {
        return await db.surveys.where('synced').equals(false).toArray();
    },

    // Mark survey as synced
    async markSynced(id) {
        return await db.surveys.update(id, { synced: true });
    },

    // Save photo
    async savePhoto(surveyId, photoData) {
        return await db.photos.add({
            surveyId,
            data: photoData,
            timestamp: new Date().toISOString()
        });
    },

    // Get photos for survey
    async getPhotosForSurvey(surveyId) {
        return await db.photos.where('surveyId').equals(surveyId).toArray();
    },

    // Get statistics
    async getStatistics() {
        const surveys = await db.surveys.toArray();
        const totalSurveys = surveys.length;
        const totalArea = surveys.reduce((sum, s) => sum + (parseFloat(s.farmSize) || 0), 0);
        const pendingSync = surveys.filter(s => !s.synced).length;

        // Count crops
        const cropCounts = {};
        surveys.forEach(survey => {
            survey.crops.forEach(crop => {
                cropCounts[crop] = (cropCounts[crop] || 0) + 1;
            });
        });

        const mostCommonCrop = Object.keys(cropCounts).length > 0
            ? Object.keys(cropCounts).reduce((a, b) => cropCounts[a] > cropCounts[b] ? a : b)
            : 'None';

        return {
            totalSurveys,
            totalArea: totalArea.toFixed(2),
            pendingSync,
            commonCrop: mostCommonCrop
        };
    },

    // Export to CSV
    async exportToCSV() {
        const surveys = await db.surveys.toArray();

        const headers = [
            'ID', 'Timestamp', 'Farmer Name', 'Household Size', 'Phone', 'Village',
            'Latitude', 'Longitude', 'Farm Size (ha)', 'Crops', 'Other Crops',
            'Production (kg)', 'Last Harvest', 'Cattle', 'Pigs', 'Poultry', 'Goats',
            'Pest Issues', 'Pest Details', 'Notes', 'Synced'
        ];

        const rows = surveys.map(s => [
            s.id,
            s.timestamp,
            s.farmerName,
            s.householdSize || '',
            s.phoneNumber || '',
            s.village || '',
            s.latitude || '',
            s.longitude || '',
            s.farmSize || '',
            s.crops.join('; '),
            s.otherCrops || '',
            s.productionQty || '',
            s.lastHarvest || '',
            s.cattle,
            s.pigs,
            s.poultry,
            s.goats,
            s.pestIssues,
            s.pestDetails || '',
            s.notes || '',
            s.synced ? 'Yes' : 'No'
        ]);

        const csv = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        return csv;
    }
};

// Initialize database
export async function initDatabase() {
    try {
        await db.open();
        console.log('Database initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        return false;
    }
}
