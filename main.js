import { db, dbOperations, initDatabase } from './database.js';

// State management
const state = {
    isOnline: navigator.onLine,
    currentMap: null,
    currentMarker: null,
    selectedPhotos: []
};

// Initialize app
async function init() {
    await initDatabase();
    setupEventListeners();
    setupMap();
    updateOnlineStatus();
    loadRecords();
    updateDashboard();

    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('Service Worker registration failed:', err);
        });
    }
}

// Setup event listeners
function setupEventListeners() {
    // Online/Offline detection
    window.addEventListener('online', () => {
        state.isOnline = true;
        updateOnlineStatus();
    });

    window.addEventListener('offline', () => {
        state.isOnline = false;
        updateOnlineStatus();
    });

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Form submission
    document.getElementById('farmSurveyForm').addEventListener('submit', handleFormSubmit);

    // GPS button
    document.getElementById('getGPSBtn').addEventListener('click', getGPSLocation);

    // Photo upload
    document.getElementById('cropPhotos').addEventListener('change', handlePhotoSelection);
    document.getElementById('takePictureBtn').addEventListener('click', () => {
        document.getElementById('cropPhotos').click();
    });

    // Sync button
    document.getElementById('syncBtn').addEventListener('click', syncData);

    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportData);

    // Map marker on coordinate input
    document.getElementById('latitude').addEventListener('input', updateMapMarker);
    document.getElementById('longitude').addEventListener('input', updateMapMarker);

    // Skip logic
    setupSkipLogic();

    // Real-time validation
    setupValidation();

    // Form progress tracking
    setupProgressTracking();
}

// Setup Leaflet map
function setupMap() {
    const mapElement = document.getElementById('map');

    // Default center (Pacific region - you can adjust)
    state.currentMap = L.map(mapElement).setView([-15.3767, 166.9592], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(state.currentMap);

    // Click on map to set location
    state.currentMap.on('click', (e) => {
        document.getElementById('latitude').value = e.latlng.lat.toFixed(6);
        document.getElementById('longitude').value = e.latlng.lng.toFixed(6);
        updateMapMarker();
    });
}

// Update online status
function updateOnlineStatus() {
    const statusBadge = document.getElementById('onlineStatus');
    const syncBtn = document.getElementById('syncBtn');

    if (state.isOnline) {
        statusBadge.textContent = 'Online';
        statusBadge.className = 'status-badge online';
        syncBtn.disabled = false;
    } else {
        statusBadge.textContent = 'Offline';
        statusBadge.className = 'status-badge offline';
        syncBtn.disabled = true;
    }
}

// Switch tabs
function switchTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    const tabMap = {
        'form': 'formTab',
        'records': 'recordsTab',
        'dashboard': 'dashboardTab'
    };

    document.getElementById(tabMap[tabName]).classList.add('active');

    // Refresh data if needed
    if (tabName === 'records') loadRecords();
    if (tabName === 'dashboard') updateDashboard();
}

// Get GPS location
function getGPSLocation() {
    const statusDiv = document.getElementById('gpsStatus');
    statusDiv.textContent = 'Getting location...';
    statusDiv.className = '';

    if (!navigator.geolocation) {
        statusDiv.textContent = 'Geolocation is not supported by your browser';
        statusDiv.className = 'error';
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            document.getElementById('latitude').value = lat.toFixed(6);
            document.getElementById('longitude').value = lng.toFixed(6);

            statusDiv.textContent = `Location acquired (±${position.coords.accuracy.toFixed(0)}m accuracy)`;
            statusDiv.className = 'success';

            updateMapMarker();
            state.currentMap.setView([lat, lng], 13);
        },
        (error) => {
            statusDiv.textContent = `Error: ${error.message}`;
            statusDiv.className = 'error';
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Update map marker
function updateMapMarker() {
    const lat = parseFloat(document.getElementById('latitude').value);
    const lng = parseFloat(document.getElementById('longitude').value);

    if (!isNaN(lat) && !isNaN(lng)) {
        if (state.currentMarker) {
            state.currentMarker.setLatLng([lat, lng]);
        } else {
            state.currentMarker = L.marker([lat, lng]).addTo(state.currentMap);
        }
        state.currentMap.setView([lat, lng], 13);
    }
}

// Handle photo selection
function handlePhotoSelection(e) {
    const files = Array.from(e.target.files);
    const previewDiv = document.getElementById('photoPreview');
    previewDiv.innerHTML = '';
    state.selectedPhotos = [];

    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = document.createElement('img');
            img.src = event.target.result;
            previewDiv.appendChild(img);
            state.selectedPhotos.push(event.target.result);
        };
        reader.readAsDataURL(file);
    });
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
        alert('Please fix the errors in the form before submitting.');
        // Scroll to first error
        const firstError = document.querySelector('.form-group.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    const formData = {
        farmerName: document.getElementById('farmerName').value,
        householdSize: document.getElementById('householdSize').value,
        phoneNumber: document.getElementById('phoneNumber').value,
        village: document.getElementById('village').value,
        island: document.getElementById('island').value,
        latitude: document.getElementById('latitude').value,
        longitude: document.getElementById('longitude').value,
        farmSize: document.getElementById('farmSize').value,
        crops: Array.from(document.querySelectorAll('input[name="crops"]:checked'))
            .map(cb => cb.value),
        otherCrops: document.getElementById('otherCrops').value,
        productionQty: document.getElementById('productionQty').value,
        lastHarvest: document.getElementById('lastHarvest').value,
        cattle: document.getElementById('cattle').value,
        pigs: document.getElementById('pigs').value,
        poultry: document.getElementById('poultry').value,
        goats: document.getElementById('goats').value,
        pestIssues: document.getElementById('pestIssues').value,
        pestDetails: document.getElementById('pestDetails').value,
        pestSeverity: document.getElementById('pestSeverity')?.value || '',
        notes: document.getElementById('notes').value,
        photos: state.selectedPhotos
    };

    try {
        const id = await dbOperations.saveSurvey(formData);

        // Show success message
        if (confirm(`Survey saved successfully! (ID: ${id})\n\nDo you want to create another survey?`)) {
            document.getElementById('farmSurveyForm').reset();
            document.getElementById('photoPreview').innerHTML = '';
            state.selectedPhotos = [];

            if (state.currentMarker) {
                state.currentMap.removeLayer(state.currentMarker);
                state.currentMarker = null;
            }

            // Reset skip logic
            const skipLogicFields = document.querySelectorAll('[data-skip-logic="true"]');
            skipLogicFields.forEach(field => handleSkipLogic(field));

            updateProgress();
        } else {
            // Switch to records tab
            switchTab('records');
        }

        updateDashboard();
    } catch (error) {
        console.error('Error saving survey:', error);
        alert('Error saving survey. Please try again.');
    }
}

// Load records
async function loadRecords() {
    const surveys = await dbOperations.getAllSurveys();
    const recordsList = document.getElementById('recordsList');
    const recordCount = document.getElementById('recordCount');

    recordCount.textContent = surveys.length;

    if (surveys.length === 0) {
        recordsList.innerHTML = '<p style="text-align: center; color: #999; padding: 2rem;">No records yet. Create your first survey!</p>';
        return;
    }

    recordsList.innerHTML = surveys.map(survey => `
        <div class="record-card">
            <h3>${survey.farmerName} 
                <span class="sync-badge ${survey.synced ? 'synced' : 'pending'}">
                    ${survey.synced ? 'Synced' : 'Pending Sync'}
                </span>
            </h3>
            <div class="record-meta">
                <div><strong>Village:</strong> ${survey.village || 'N/A'}</div>
                <div><strong>Farm Size:</strong> ${survey.farmSize} ha</div>
                <div><strong>Crops:</strong> ${survey.crops.join(', ') || 'None'}</div>
                <div><strong>Date:</strong> ${new Date(survey.timestamp).toLocaleDateString()}</div>
            </div>
            <div class="record-actions">
                <button class="btn-secondary" onclick="viewRecord(${survey.id})">View Details</button>
                <button class="btn-secondary" onclick="deleteRecord(${survey.id})" style="background: #d32f2f;">Delete</button>
            </div>
        </div>
    `).join('');
}

// View record details
window.viewRecord = async function (id) {
    const survey = await dbOperations.getSurveyById(id);
    alert(`Survey Details:\n\nFarmer: ${survey.farmerName}\nVillage: ${survey.village}\nFarm Size: ${survey.farmSize} ha\nCrops: ${survey.crops.join(', ')}\nLivestock: ${survey.cattle} cattle, ${survey.pigs} pigs, ${survey.poultry} poultry, ${survey.goats} goats\nNotes: ${survey.notes || 'None'}`);
};

// Delete record
window.deleteRecord = async function (id) {
    if (confirm('Are you sure you want to delete this record?')) {
        await dbOperations.deleteSurvey(id);
        loadRecords();
        updateDashboard();
    }
};

// Update dashboard
async function updateDashboard() {
    const stats = await dbOperations.getStatistics();

    document.getElementById('totalSurveys').textContent = stats.totalSurveys;
    document.getElementById('totalArea').textContent = stats.totalArea + ' ha';
    document.getElementById('pendingSync').textContent = stats.pendingSync;
    document.getElementById('commonCrop').textContent = stats.commonCrop;
}

// Sync data to server
async function syncData() {
    if (!state.isOnline) {
        alert('Cannot sync while offline');
        return;
    }

    const unsyncedSurveys = await dbOperations.getUnsyncedSurveys();

    if (unsyncedSurveys.length === 0) {
        alert('All data is already synced!');
        return;
    }

    // Get device ID (create if doesn't exist)
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
        deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('deviceId', deviceId);
    }

    try {
        const response = await fetch('http://localhost:3000/api/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                surveys: unsyncedSurveys,
                deviceId: deviceId,
                userId: localStorage.getItem('userId') || 'anonymous'
            })
        });

        if (response.ok) {
            const result = await response.json();

            // Mark all as synced
            for (const survey of unsyncedSurveys) {
                await dbOperations.markSynced(survey.id);
            }

            let message = `Successfully synced ${result.syncedCount} surveys!`;
            if (result.conflictCount > 0) {
                message += `\n\n${result.conflictCount} conflict(s) were automatically resolved.`;
            }

            alert(message);
            loadRecords();
            updateDashboard();
        } else {
            throw new Error('Sync failed');
        }
    } catch (error) {
        console.error('Sync error:', error);
        alert('Sync failed. Please try again later.\n\nError: ' + error.message);
    }
}

// Export data to CSV
async function exportData() {
    const csv = await dbOperations.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agriculture_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// Initialize on load
init();

// Skip Logic System
function setupSkipLogic() {
    const skipLogicFields = document.querySelectorAll('[data-skip-logic="true"]');

    skipLogicFields.forEach(field => {
        field.addEventListener('change', () => {
            handleSkipLogic(field);
        });
        // Initialize on load
        handleSkipLogic(field);
    });
}

function handleSkipLogic(triggerField) {
    const fieldValue = triggerField.value;
    const fieldId = triggerField.id;

    // Find all conditional sections that depend on this field
    const conditionalSections = document.querySelectorAll(`[data-show-when="${fieldId}"]`);

    conditionalSections.forEach(section => {
        const showValues = section.dataset.showValues.split(',');

        if (showValues.includes(fieldValue)) {
            section.classList.remove('hidden');
            // Make fields required if they have conditional validation
            const inputs = section.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                if (input.dataset.validate === 'conditional') {
                    input.setAttribute('required', 'required');
                }
            });
        } else {
            section.classList.add('hidden');
            // Remove required attribute and clear values
            const inputs = section.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                input.removeAttribute('required');
                if (input.type !== 'checkbox' && input.type !== 'radio') {
                    input.value = '';
                }
            });
        }
    });
}

// Validation System
function setupValidation() {
    const form = document.getElementById('farmSurveyForm');
    const validatableFields = form.querySelectorAll('[data-validate]');

    validatableFields.forEach(field => {
        // Validate on blur
        field.addEventListener('blur', () => validateField(field));

        // Clear error on input
        field.addEventListener('input', () => {
            clearFieldError(field);
        });
    });
}

function validateField(field) {
    const validationType = field.dataset.validate;
    const fieldId = field.id;
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Skip validation if field is hidden (part of skip logic)
    if (field.closest('.hidden')) {
        return true;
    }

    switch (validationType) {
        case 'required':
            if (!value) {
                isValid = false;
                errorMessage = `${field.previousElementSibling.textContent} is required`;
            }
            break;

        case 'range':
            const min = parseFloat(field.min);
            const max = parseFloat(field.max);
            const numValue = parseFloat(value);
            if (value && (numValue < min || numValue > max)) {
                isValid = false;
                errorMessage = `Value must be between ${min} and ${max}`;
            }
            break;

        case 'conditional':
            // Only validate if parent section is visible and field is required
            if (field.hasAttribute('required') && !value) {
                isValid = false;
                errorMessage = 'This field is required';
            }
            if (value && field.minLength && value.length < field.minLength) {
                isValid = false;
                errorMessage = `Minimum ${field.minLength} characters required`;
            }
            break;
    }

    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }

    return isValid;
}

function showFieldError(field, message) {
    const formGroup = field.closest('.form-group');
    const errorDiv = document.getElementById(`${field.id}-error`);

    formGroup.classList.add('error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.add('visible');
    }
}

function clearFieldError(field) {
    const formGroup = field.closest('.form-group');
    const errorDiv = document.getElementById(`${field.id}-error`);

    formGroup.classList.remove('error');
    if (errorDiv) {
        errorDiv.classList.remove('visible');
    }
}

function validateForm() {
    const form = document.getElementById('farmSurveyForm');
    const validatableFields = form.querySelectorAll('[data-validate]');
    let isValid = true;

    validatableFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });

    return isValid;
}

// Progress Tracking
function setupProgressTracking() {
    const form = document.getElementById('farmSurveyForm');
    const allFields = form.querySelectorAll('input:not([type="hidden"]), select, textarea');

    allFields.forEach(field => {
        field.addEventListener('change', updateProgress);
        field.addEventListener('input', updateProgress);
    });

    updateProgress();
}

function updateProgress() {
    const form = document.getElementById('farmSurveyForm');
    const allFields = form.querySelectorAll('input:not([type="hidden"]):not([type="file"]), select:not(#pestIssues), textarea');
    const requiredFields = form.querySelectorAll('[required]');

    let filledCount = 0;
    let totalCount = 0;

    allFields.forEach(field => {
        // Skip hidden fields (skip logic)
        if (field.closest('.hidden')) {
            return;
        }

        totalCount++;

        if (field.type === 'checkbox') {
            const checkboxGroup = form.querySelectorAll(`input[name="${field.name}"]`);
            const anyChecked = Array.from(checkboxGroup).some(cb => cb.checked);
            if (anyChecked) filledCount++;
        } else if (field.value && field.value.trim()) {
            filledCount++;
        }
    });

    const percentage = totalCount > 0 ? Math.round((filledCount / totalCount) * 100) : 0;

    document.getElementById('progressFill').style.width = percentage + '%';
    document.getElementById('progressText').textContent = `${percentage}% Complete (${filledCount}/${totalCount} fields)`;
}
