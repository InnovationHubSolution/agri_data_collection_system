// Reports Page JavaScript
let reportData = [];
let filteredData = [];
let currentSort = { column: null, direction: 'asc' };
let currentPage = 1;
const itemsPerPage = 20;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadUserInfo();
    loadReportData();
});

// Check authentication
function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
}

// Load user information
async function loadUserInfo() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById('userName').textContent = data.user.full_name || data.user.username;
        }
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    window.location.href = 'login.html';
}

// Show different reports
function showReport(reportType) {
    // Hide all reports
    document.querySelectorAll('.report-section').forEach(section => {
        section.style.display = 'none';
    });

    // Update navigation
    document.querySelectorAll('.reports-nav button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected report
    document.getElementById(`report-${reportType}`).style.display = 'block';
    event.target.classList.add('active');
}

// Load report data from backend
async function loadReportData() {
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const emptyState = document.getElementById('emptyState');
    const statusTable = document.getElementById('statusTable');

    try {
        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        emptyState.style.display = 'none';
        statusTable.style.display = 'table';

        const token = localStorage.getItem('authToken');
        const response = await fetch('/api/reports/surveys-statuses', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load report data');
        }

        const data = await response.json();
        reportData = data.surveys || [];
        filteredData = [...reportData];

        // Populate filters
        populateFilters(data.supervisors || [], data.surveyTemplates || []);

        // Render table
        renderTable();

        if (reportData.length === 0) {
            statusTable.style.display = 'none';
            emptyState.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading report data:', error);
        errorMessage.textContent = 'Error loading report: ' + error.message;
        errorMessage.style.display = 'block';
        statusTable.style.display = 'none';
    } finally {
        loadingMessage.style.display = 'none';
    }
}

// Populate filter dropdowns
function populateFilters(supervisors, surveyTemplates) {
    const supervisorFilter = document.getElementById('supervisorFilter');
    const surveyFilter = document.getElementById('surveyFilter');

    // Populate supervisor filter
    supervisorFilter.innerHTML = '<option value="">All teams</option>';
    supervisors.forEach(supervisor => {
        const option = document.createElement('option');
        option.value = supervisor.id;
        option.textContent = supervisor.name || supervisor.username;
        supervisorFilter.appendChild(option);
    });

    // Populate survey filter
    surveyFilter.innerHTML = '<option value="">All surveys</option>';
    surveyTemplates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.title;
        surveyFilter.appendChild(option);
    });
}

// Filter data based on selections
function filterData() {
    const supervisorId = document.getElementById('supervisorFilter').value;
    const surveyId = document.getElementById('surveyFilter').value;

    filteredData = reportData.filter(item => {
        let matchSupervisor = !supervisorId || item.supervisor_id === supervisorId;
        let matchSurvey = !surveyId || item.survey_id === surveyId;
        return matchSupervisor && matchSurvey;
    });

    currentPage = 1;
    renderTable();
}

// Render table with current data
function renderTable() {
    const tbody = document.getElementById('statusTableBody');
    tbody.innerHTML = '';

    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
    const pageData = filteredData.slice(startIndex, endIndex);

    // Calculate totals
    const totals = {
        supervisor_assigned: 0,
        interviewer_assigned: 0,
        completed: 0,
        rejected_supervisor: 0,
        approved_supervisor: 0,
        rejected_hq: 0,
        approved_hq: 0,
        total: 0
    };

    // Render data rows
    pageData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <span class="questionnaire-title" onclick="viewSurvey('${item.survey_id}')">
                    ${item.questionnaire_title || 'Default Farm Survey'}
                </span>
            </td>
            <td class="status-count ${item.supervisor_assigned > 0 ? 'has-value' : 'zero'}">
                ${item.supervisor_assigned || 0}
            </td>
            <td class="status-count ${item.interviewer_assigned > 0 ? 'has-value' : 'zero'}">
                ${item.interviewer_assigned || 0}
            </td>
            <td class="status-count ${item.completed > 0 ? 'has-value' : 'zero'}">
                ${item.completed || 0}
            </td>
            <td class="status-count ${item.rejected_supervisor > 0 ? 'has-value' : 'zero'}">
                ${item.rejected_supervisor || 0}
            </td>
            <td class="status-count ${item.approved_supervisor > 0 ? 'has-value' : 'zero'}">
                ${item.approved_supervisor || 0}
            </td>
            <td class="status-count ${item.rejected_hq > 0 ? 'has-value' : 'zero'}">
                ${item.rejected_hq || 0}
            </td>
            <td class="status-count ${item.approved_hq > 0 ? 'has-value' : 'zero'}">
                ${item.approved_hq || 0}
            </td>
            <td class="status-count has-value">
                ${item.total || 0}
            </td>
        `;
        tbody.appendChild(row);

        // Add to totals
        totals.supervisor_assigned += item.supervisor_assigned || 0;
        totals.interviewer_assigned += item.interviewer_assigned || 0;
        totals.completed += item.completed || 0;
        totals.rejected_supervisor += item.rejected_supervisor || 0;
        totals.approved_supervisor += item.approved_supervisor || 0;
        totals.rejected_hq += item.rejected_hq || 0;
        totals.approved_hq += item.approved_hq || 0;
        totals.total += item.total || 0;
    });

    // Add totals row
    if (filteredData.length > 0) {
        const totalRow = document.createElement('tr');
        totalRow.className = 'total-row';
        totalRow.innerHTML = `
            <td>TOTAL</td>
            <td class="status-count has-value">${totals.supervisor_assigned}</td>
            <td class="status-count has-value">${totals.interviewer_assigned}</td>
            <td class="status-count has-value">${totals.completed}</td>
            <td class="status-count has-value">${totals.rejected_supervisor}</td>
            <td class="status-count has-value">${totals.approved_supervisor}</td>
            <td class="status-count has-value">${totals.rejected_hq}</td>
            <td class="status-count has-value">${totals.approved_hq}</td>
            <td class="status-count has-value">${totals.total}</td>
        `;
        tbody.appendChild(totalRow);
    }

    // Update pagination
    updatePagination();
}

// Sort table by column
function sortTable(column) {
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    filteredData.sort((a, b) => {
        let valA = a[column] || 0;
        let valB = b[column] || 0;

        if (column === 'questionnaire') {
            valA = (a.questionnaire_title || '').toLowerCase();
            valB = (b.questionnaire_title || '').toLowerCase();
        }

        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    renderTable();
}

// Pagination functions
function updatePagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    document.getElementById('btnFirst').disabled = currentPage === 1;
    document.getElementById('btnPrev').disabled = currentPage === 1;
    document.getElementById('btnNext').disabled = currentPage === totalPages || totalPages === 0;
    document.getElementById('btnLast').disabled = currentPage === totalPages || totalPages === 0;
}

function goToPage(action) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    switch (action) {
        case 'first':
            currentPage = 1;
            break;
        case 'prev':
            if (currentPage > 1) currentPage--;
            break;
        case 'next':
            if (currentPage < totalPages) currentPage++;
            break;
        case 'last':
            currentPage = totalPages;
            break;
    }

    renderTable();
}

// View survey details
function viewSurvey(surveyId) {
    // Navigate to survey details page (to be implemented)
    window.location.href = `survey-details.html?id=${surveyId}`;
}

// Export report in different formats
async function exportReport(format) {
    try {
        const token = localStorage.getItem('authToken');
        const supervisorId = document.getElementById('supervisorFilter').value;
        const surveyId = document.getElementById('surveyFilter').value;

        let url = `/api/reports/surveys-statuses/export?format=${format}`;
        if (supervisorId) url += `&supervisor=${supervisorId}`;
        if (surveyId) url += `&survey=${surveyId}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Export failed');
        }

        // Download file
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `surveys-statuses-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error('Export error:', error);
        alert('Failed to export report: ' + error.message);
    }
}
