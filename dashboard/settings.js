// Settings Page JavaScript
let currentUser = {};

document.addEventListener('DOMContentLoaded', function () {
    checkAuthentication();
    loadSettings();
    loadUserProfile();
});

function checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }

    const username = localStorage.getItem('username');
    if (username) {
        document.getElementById('userName').textContent = username;
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    window.location.href = '../index.html';
}

// Tab Management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all buttons
    document.querySelectorAll('.settings-tabs button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');

    // Add active class to clicked button
    event.target.classList.add('active');
}

// Load Settings
async function loadSettings() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/settings', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const settings = await response.json();

            // Populate settings
            if (settings.globalNote) {
                document.getElementById('globalNote').value = settings.globalNote.message || '';
                document.getElementById('noteEnabled').checked = settings.globalNote.enabled || false;
            }

            if (settings.webInterview) {
                document.getElementById('webInterviewEnabled').checked = settings.webInterview.enabled || false;
                document.getElementById('webInterviewUrl').value = settings.webInterview.url || window.location.origin + '/web-interview';
                document.getElementById('sessionTimeout').value = settings.webInterview.sessionTimeout || 30;
                document.getElementById('allowAnonymous').checked = settings.webInterview.allowAnonymous || false;
                document.getElementById('requireEmail').checked = settings.webInterview.requireEmail || false;
            }
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Load User Profile
async function loadUserProfile() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');

    try {
        const response = await fetch(`/api/users/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            currentUser = await response.json();

            document.getElementById('fullName').value = currentUser.full_name || '';
            document.getElementById('email').value = currentUser.email || '';
            document.getElementById('phone').value = currentUser.phone || '';
            document.getElementById('role').value = currentUser.role || '';
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// Save Profile
async function saveProfile() {
    const token = localStorage.getItem('token');

    const profileData = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value
    };

    try {
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });

        const alertDiv = document.getElementById('profileAlert');

        if (response.ok) {
            showAlert('profileAlert', 'success', 'Profile updated successfully!');
        } else {
            const error = await response.json();
            showAlert('profileAlert', 'danger', error.error || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        showAlert('profileAlert', 'danger', 'An error occurred while saving profile');
    }
}

// Change Password
async function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showAlert('profileAlert', 'danger', 'Please fill in all password fields');
        return;
    }

    if (newPassword !== confirmPassword) {
        showAlert('profileAlert', 'danger', 'New passwords do not match');
        return;
    }

    if (newPassword.length < 8) {
        showAlert('profileAlert', 'danger', 'Password must be at least 8 characters long');
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/auth/change-password', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        if (response.ok) {
            showAlert('profileAlert', 'success', 'Password changed successfully!');
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            document.getElementById('confirmPassword').value = '';
        } else {
            const error = await response.json();
            showAlert('profileAlert', 'danger', error.error || 'Failed to change password');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        showAlert('profileAlert', 'danger', 'An error occurred while changing password');
    }
}

// Save Global Note
async function saveGlobalNote() {
    const token = localStorage.getItem('token');

    const noteData = {
        message: document.getElementById('globalNote').value,
        enabled: document.getElementById('noteEnabled').checked
    };

    try {
        const response = await fetch('/api/settings/global-note', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(noteData)
        });

        if (response.ok) {
            showAlert('globalNoteAlert', 'success', 'Global note saved successfully!');
        } else {
            showAlert('globalNoteAlert', 'danger', 'Failed to save global note');
        }
    } catch (error) {
        console.error('Error saving global note:', error);
        showAlert('globalNoteAlert', 'danger', 'An error occurred while saving');
    }
}

// Save Web Interview Settings
async function saveWebInterviewSettings() {
    const token = localStorage.getItem('token');

    const webInterviewData = {
        enabled: document.getElementById('webInterviewEnabled').checked,
        sessionTimeout: parseInt(document.getElementById('sessionTimeout').value),
        allowAnonymous: document.getElementById('allowAnonymous').checked,
        requireEmail: document.getElementById('requireEmail').checked
    };

    try {
        const response = await fetch('/api/settings/web-interview', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(webInterviewData)
        });

        if (response.ok) {
            showAlert('webInterviewAlert', 'success', 'Web interview settings saved successfully!');
        } else {
            showAlert('webInterviewAlert', 'danger', 'Failed to save settings');
        }
    } catch (error) {
        console.error('Error saving web interview settings:', error);
        showAlert('webInterviewAlert', 'danger', 'An error occurred while saving');
    }
}

// Logo Management
function previewLogo() {
    const file = document.getElementById('logoFile').files[0];

    if (file) {
        document.getElementById('fileName').textContent = file.name;

        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById('logoPreview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

async function saveLogo() {
    const token = localStorage.getItem('token');
    const fileInput = document.getElementById('logoFile');
    const file = fileInput.files[0];

    if (!file) {
        showAlert('logoAlert', 'danger', 'Please select a logo file');
        return;
    }

    const formData = new FormData();
    formData.append('logo', file);

    try {
        const response = await fetch('/api/settings/company-logo', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.ok) {
            showAlert('logoAlert', 'success', 'Logo uploaded successfully!');
        } else {
            showAlert('logoAlert', 'danger', 'Failed to upload logo');
        }
    } catch (error) {
        console.error('Error uploading logo:', error);
        showAlert('logoAlert', 'danger', 'An error occurred while uploading');
    }
}

async function removeLogo() {
    if (!confirm('Are you sure you want to remove the company logo?')) {
        return;
    }

    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/settings/company-logo', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            document.getElementById('logoPreview').src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22100%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22200%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22%3ENo Logo%3C/text%3E%3C/svg%3E';
            document.getElementById('fileName').textContent = 'No file chosen';
            document.getElementById('logoFile').value = '';
            showAlert('logoAlert', 'success', 'Logo removed successfully!');
        } else {
            showAlert('logoAlert', 'danger', 'Failed to remove logo');
        }
    } catch (error) {
        console.error('Error removing logo:', error);
        showAlert('logoAlert', 'danger', 'An error occurred while removing logo');
    }
}

// Export Functions
async function exportData(type) {
    const token = localStorage.getItem('token');
    let endpoint = '';
    let filename = '';

    switch (type) {
        case 'surveys-csv':
            endpoint = '/api/export/csv';
            filename = 'surveys_export.csv';
            break;
        case 'surveys-json':
            endpoint = '/api/export/json';
            filename = 'surveys_export.json';
            break;
        case 'users':
            endpoint = '/api/export/users';
            filename = 'users_export.csv';
            break;
        case 'forms':
            endpoint = '/api/export/forms';
            filename = 'forms_export.json';
            break;
        case 'reports':
            endpoint = '/api/reports/surveys-statuses/export?format=csv';
            filename = 'reports_export.csv';
            break;
        case 'geojson':
            endpoint = '/api/export/geojson';
            filename = 'surveys_locations.geojson';
            break;
    }

    try {
        const response = await fetch(endpoint, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Export failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Export error:', error);
        alert('Failed to export data. Please try again.');
    }
}

// Refresh Devices
async function refreshDevices() {
    const token = localStorage.getItem('token');

    try {
        const response = await fetch('/api/devices', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const devices = await response.json();
            renderDeviceList(devices);
        }
    } catch (error) {
        console.error('Error loading devices:', error);
    }
}

function renderDeviceList(devices) {
    const deviceList = document.getElementById('deviceList');

    if (!devices || devices.length === 0) {
        deviceList.innerHTML = '<p style="color: #666;">No devices registered yet.</p>';
        return;
    }

    let html = '';
    devices.forEach(device => {
        const statusClass = device.online ? 'online' : 'offline';
        const statusText = device.online ? 'Online' : 'Offline';

        html += `
            <div class="device-item">
                <div class="device-info">
                    <h4>${device.icon || '📱'} ${device.name}</h4>
                    <p>Last seen: ${device.lastSeen} • Device ID: ${device.deviceId}</p>
                </div>
                <span class="device-status ${statusClass}">${statusText}</span>
            </div>
        `;
    });

    deviceList.innerHTML = html;
}

// Utility Functions
function showAlert(elementId, type, message) {
    const alertDiv = document.getElementById(elementId);
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.display = 'block';

    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 5000);
}
