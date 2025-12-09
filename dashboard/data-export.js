// Data Export Page JavaScript
let exportJobs = [];

document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadQuestionnaires();
    loadExportHistory();
    
    // Form submission
    document.getElementById('exportForm').addEventListener('submit', handleExportSubmit);
    
    // Questionnaire change to enable version
    document.getElementById('questionnaire').addEventListener('change', function() {
        const versionSelect = document.getElementById('version');
        if (this.value) {
            versionSelect.disabled = false;
            loadVersions(this.value);
        } else {
            versionSelect.disabled = true;
            versionSelect.innerHTML = '<option value="">Select</option>';
        }
    });

    // Poll for export status updates every 5 seconds
    setInterval(loadExportHistory, 5000);
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

// Load questionnaires for dropdown
async function loadQuestionnaires() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/forms/published/list', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const forms = await response.json();
            const select = document.getElementById('questionnaire');
            
            forms.forEach(form => {
                const option = document.createElement('option');
                option.value = form.id;
                option.textContent = form.title;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading questionnaires:', error);
    }
}

// Load versions for selected questionnaire
async function loadVersions(questionnaireId) {
    const versionSelect = document.getElementById('version');
    versionSelect.innerHTML = '<option value="">Select</option>';
    
    // For now, just add version 1
    // In a real system, you'd fetch actual versions from the API
    const option = document.createElement('option');
    option.value = '1';
    option.textContent = 'Version 1';
    versionSelect.appendChild(option);
    
    // Auto-select if only one version
    if (versionSelect.options.length === 2) {
        versionSelect.selectedIndex = 1;
    }
}

// Handle export form submission
async function handleExportSubmit(e) {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    const questionnaire = document.getElementById('questionnaire').value;
    const version = document.getElementById('version').value;
    const status = document.getElementById('status').value;
    
    if (!questionnaire) {
        showAlert('error', 'Please select a questionnaire');
        return;
    }

    if (!version) {
        showAlert('error', 'Please select a questionnaire version');
        return;
    }

    try {
        const response = await fetch('/api/export/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                questionnaireId: questionnaire,
                version: version,
                status: status,
                dateRange: 'all'
            })
        });

        if (response.ok) {
            const result = await response.json();
            showAlert('success', 'Export added to queue successfully! Processing will begin shortly.');
            resetForm();
            loadExportHistory();
        } else {
            const error = await response.json();
            showAlert('error', error.error || 'Failed to create export');
        }
    } catch (error) {
        console.error('Error creating export:', error);
        showAlert('error', 'An error occurred while creating the export');
    }
}

// Load export history
async function loadExportHistory() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch('/api/export/history', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            exportJobs = await response.json();
            renderExportList();
        }
    } catch (error) {
        console.error('Error loading export history:', error);
    }
}

// Render export list
function renderExportList() {
    const listContainer = document.getElementById('exportList');
    
    if (!exportJobs || exportJobs.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-state">
                <div class="export-icon">📦</div>
                <h3>No exports yet</h3>
                <p>Use the form on the left to create your first data export</p>
            </div>
        `;
        return;
    }

    let html = '';
    
    exportJobs.forEach(job => {
        const statusClass = job.status === 'completed' ? 'completed' : 
                           job.status === 'processing' ? 'processing' : 'in-queue';
        
        html += `
            <div class="export-item">
                <div class="export-item-header">
                    <span class="export-number">#${job.id}</span>
                    <span class="status-badge status-${statusClass}">
                        ${job.status === 'completed' ? 'COMPLETED' : 
                          job.status === 'processing' ? 'PROCESSING' : 'IN QUEUE'}
                    </span>
                    <span style="font-size: 12px; color: #999;">
                        ${formatDate(job.created_at)}
                    </span>
                </div>
                
                <div class="export-title">${job.questionnaire_title} (ver. ${job.version})</div>
                
                <div class="export-meta">
                    <strong>Tabular</strong> format. 
                    <strong>Interviews in ${job.status_filter || 'all statuses'}</strong>. 
                    Translation: Original
                    <br>
                    ${job.date_range || 'All time'}
                </div>
                
                <div class="export-status ${job.status !== 'completed' ? 'in-queue' : ''}">
                    ${renderExportStatus(job)}
                </div>
                
                ${job.status === 'completed' ? `
                    <div>
                        <button class="btn-download" onclick="downloadExport(${job.id})">
                            DOWNLOAD
                        </button>
                        <div class="export-file-info">
                            Last updated: ${formatDateTime(job.updated_at)} • 
                            File size: ${formatFileSize(job.file_size)}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    });

    listContainer.innerHTML = html;
}

function renderExportStatus(job) {
    switch(job.status) {
        case 'completed':
            return `
                <div class="export-status-text">
                    <strong>Destination:</strong> Export file will be available for download
                </div>
            `;
        case 'processing':
            return `
                <div class="export-status-text">
                    <strong>Status:</strong> Processing export...
                </div>
                <div class="export-progress">
                    Produced in: ${job.processing_time || 'calculating...'}
                </div>
            `;
        case 'queued':
            return `
                <div class="export-status-text">
                    <strong>In queue:</strong> a few seconds
                </div>
                <div class="export-progress">
                    Produced in: a few seconds
                </div>
            `;
        default:
            return '';
    }
}

// Download export file
async function downloadExport(exportId) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`/api/export/download/${exportId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Download failed');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `export_${exportId}.zip`;
        if (contentDisposition) {
            const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
            if (matches && matches[1]) {
                filename = matches[1].replace(/['"]/g, '');
            }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Download error:', error);
        alert('Failed to download export. Please try again.');
    }
}

// Reset form
function resetForm() {
    document.getElementById('exportForm').reset();
    document.getElementById('version').disabled = true;
    document.getElementById('version').innerHTML = '<option value="">Select</option>';
}

// Show alert message
function showAlert(type, message) {
    const alertDiv = document.getElementById('exportAlert');
    alertDiv.className = type === 'success' ? 'alert alert-success' : 'alert alert-info';
    alertDiv.textContent = message;
    alertDiv.style.display = 'block';

    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 5000);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options).replace(',', '');
}

// Format datetime
function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month} ${day}, ${year} ${hours}:${minutes}`;
}

// Format file size
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
