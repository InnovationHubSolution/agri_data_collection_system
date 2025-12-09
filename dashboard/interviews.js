// Interviews Page JavaScript
let allInterviews = [];
let filteredInterviews = [];
let currentPage = 1;
let itemsPerPage = 20;
let totalPages = 1;
let sortColumn = 'updated_at';
let sortDirection = 'desc';

// Load interviews on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadInterviews();
});

function checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../index.html';
        return;
    }

    // Display username
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

async function loadInterviews() {
    const token = localStorage.getItem('token');
    const tableContainer = document.getElementById('tableContainer');
    
    try {
        tableContainer.innerHTML = '<div class="loading">Loading interviews</div>';

        const response = await fetch('/api/interviews', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load interviews');
        }

        const data = await response.json();
        allInterviews = data.interviews || [];
        
        // Populate filter dropdowns
        populateFilters(data);
        
        // Initial filter and render
        filterInterviews();
        
    } catch (error) {
        console.error('Error loading interviews:', error);
        tableContainer.innerHTML = `
            <div class="empty-state">
                <h3>Error Loading Interviews</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function populateFilters(data) {
    // Populate Questionnaire filter
    const questionnaireSelect = document.getElementById('filterQuestionnaire');
    const questionnaires = [...new Set(allInterviews.map(i => i.questionnaire_title))].filter(Boolean);
    questionnaires.forEach(title => {
        const option = document.createElement('option');
        option.value = title;
        option.textContent = title;
        questionnaireSelect.appendChild(option);
    });

    // Populate Responsible filter
    const responsibleSelect = document.getElementById('filterResponsible');
    const responsibles = [...new Set(allInterviews.map(i => i.responsible))].filter(Boolean);
    responsibles.forEach(user => {
        const option = document.createElement('option');
        option.value = user;
        option.textContent = user;
        responsibleSelect.appendChild(option);
    });

    // Populate Assignment filter
    const assignmentSelect = document.getElementById('filterAssignment');
    const assignments = [...new Set(allInterviews.map(i => i.assignment))].filter(Boolean);
    assignments.forEach(assignment => {
        const option = document.createElement('option');
        option.value = assignment;
        option.textContent = assignment;
        assignmentSelect.appendChild(option);
    });

    // Add change listeners to all filters
    document.getElementById('filterQuestionnaire').addEventListener('change', filterInterviews);
    document.getElementById('filterVersion').addEventListener('change', filterInterviews);
    document.getElementById('filterStatus').addEventListener('change', filterInterviews);
    document.getElementById('filterResponsible').addEventListener('change', filterInterviews);
    document.getElementById('filterAssignment').addEventListener('change', filterInterviews);
    document.getElementById('filterMode').addEventListener('change', filterInterviews);
}

function filterInterviews() {
    const questionnaireFilter = document.getElementById('filterQuestionnaire').value;
    const versionFilter = document.getElementById('filterVersion').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const responsibleFilter = document.getElementById('filterResponsible').value;
    const assignmentFilter = document.getElementById('filterAssignment').value;
    const modeFilter = document.getElementById('filterMode').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    filteredInterviews = allInterviews.filter(interview => {
        if (questionnaireFilter && interview.questionnaire_title !== questionnaireFilter) return false;
        if (versionFilter && interview.version !== versionFilter) return false;
        if (statusFilter && interview.status !== statusFilter) return false;
        if (responsibleFilter && interview.responsible !== responsibleFilter) return false;
        if (assignmentFilter && interview.assignment !== assignmentFilter) return false;
        if (modeFilter && interview.interview_mode !== modeFilter) return false;
        
        if (searchTerm) {
            const searchableText = [
                interview.interview_key,
                interview.identifying_questions,
                interview.responsible,
                interview.questionnaire_title
            ].join(' ').toLowerCase();
            
            if (!searchableText.includes(searchTerm)) return false;
        }

        return true;
    });

    // Reset to first page when filtering
    currentPage = 1;
    renderTable();
}

function searchInterviews() {
    filterInterviews();
}

function clearFilters() {
    document.getElementById('filterQuestionnaire').value = '';
    document.getElementById('filterVersion').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterResponsible').value = '';
    document.getElementById('filterAssignment').value = '';
    document.getElementById('filterMode').value = '';
    document.getElementById('searchInput').value = '';
    filterInterviews();
}

function renderTable() {
    const tableContainer = document.getElementById('tableContainer');
    const interviewCount = document.getElementById('interviewCount');
    
    interviewCount.textContent = filteredInterviews.length;

    if (filteredInterviews.length === 0) {
        tableContainer.innerHTML = `
            <div class="empty-state">
                <h3>No Interviews Found</h3>
                <p>No interviews match your filter criteria.</p>
            </div>
        `;
        document.getElementById('pagination').style.display = 'none';
        return;
    }

    // Sort interviews
    const sorted = [...filteredInterviews].sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];

        // Handle null values
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        // Convert to string for comparison
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();

        if (sortDirection === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });

    // Pagination
    totalPages = Math.ceil(sorted.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, sorted.length);
    const pageData = sorted.slice(startIndex, endIndex);

    // Render table
    let html = `
        <table class="interviews-table">
            <thead>
                <tr>
                    <th></th>
                    <th class="sortable ${sortColumn === 'interview_key' ? 'sort-' + sortDirection : ''}" 
                        onclick="sortTable('interview_key')">Interview Key</th>
                    <th class="sortable ${sortColumn === 'identifying_questions' ? 'sort-' + sortDirection : ''}" 
                        onclick="sortTable('identifying_questions')">Identifying Questions</th>
                    <th class="sortable ${sortColumn === 'responsible' ? 'sort-' + sortDirection : ''}" 
                        onclick="sortTable('responsible')">Responsible</th>
                    <th class="sortable ${sortColumn === 'updated_at' ? 'sort-' + sortDirection : ''}" 
                        onclick="sortTable('updated_at')">Updated On</th>
                    <th class="sortable ${sortColumn === 'errors_count' ? 'sort-' + sortDirection : ''}" 
                        onclick="sortTable('errors_count')">Errors Count</th>
                    <th class="sortable ${sortColumn === 'not_answered' ? 'sort-' + sortDirection : ''}" 
                        onclick="sortTable('not_answered')">Not Answered</th>
                    <th class="sortable ${sortColumn === 'interview_mode' ? 'sort-' + sortDirection : ''}" 
                        onclick="sortTable('interview_mode')">Interview Mode</th>
                    <th class="sortable ${sortColumn === 'status' ? 'sort-' + sortDirection : ''}" 
                        onclick="sortTable('status')">Status</th>
                    <th class="sortable ${sortColumn === 'received_by_tablet' ? 'sort-' + sortDirection : ''}" 
                        onclick="sortTable('received_by_tablet')">Received by Tablet</th>
                    <th class="sortable ${sortColumn === 'assignment' ? 'sort-' + sortDirection : ''}" 
                        onclick="sortTable('assignment')">Assignment</th>
                </tr>
            </thead>
            <tbody>
    `;

    pageData.forEach(interview => {
        html += `
            <tr onclick="viewInterview('${interview.id}')">
                <td><input type="checkbox" onclick="event.stopPropagation()"></td>
                <td class="interview-key">${escapeHtml(interview.interview_key)}</td>
                <td class="identifying-questions" title="${escapeHtml(interview.identifying_questions || '')}">
                    ${escapeHtml(interview.identifying_questions || '-')}
                </td>
                <td>
                    <span class="responsible-user">${escapeHtml(interview.responsible || '-')}</span>
                </td>
                <td>${formatDateTime(interview.updated_at)}</td>
                <td class="error-count ${interview.errors_count === 0 ? 'zero' : ''}">${interview.errors_count || 0}</td>
                <td class="not-answered ${interview.not_answered === 0 ? 'zero' : ''}">${interview.not_answered || 0}</td>
                <td class="interview-mode">${interview.interview_mode || 'CAPI'}</td>
                <td>${renderStatusBadge(interview.status)}</td>
                <td class="received-tablet ${interview.received_by_tablet ? 'yes' : 'no'}">
                    ${interview.received_by_tablet ? 'Yes' : 'No'}
                </td>
                <td>${interview.assignment || '-'}</td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    tableContainer.innerHTML = html;
    updatePagination(startIndex + 1, endIndex, sorted.length);
}

function sortTable(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    renderTable();
}

function updatePagination(start, end, total) {
    document.getElementById('pagination').style.display = 'flex';
    document.getElementById('pageStart').textContent = start;
    document.getElementById('pageEnd').textContent = end;
    document.getElementById('totalItems').textContent = total;

    // Generate page numbers
    const pageNumbers = document.getElementById('pageNumbers');
    let html = '';
    
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }

    pageNumbers.innerHTML = html;

    // Update button states
    const buttons = document.querySelectorAll('.pagination-controls button');
    buttons[0].disabled = currentPage === 1; // First
    buttons[1].disabled = currentPage === 1; // Previous
    buttons[buttons.length - 2].disabled = currentPage === totalPages; // Next
    buttons[buttons.length - 1].disabled = currentPage === totalPages; // Last
}

function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable();
}

function renderStatusBadge(status) {
    const statusClass = 'status-' + (status || 'interviewer-assigned').replace(/_/g, '-');
    const statusText = {
        'supervisor_assigned': 'Supervisor Assigned',
        'interviewer_assigned': 'Interviewer Assigned',
        'completed': 'Completed',
        'rejected_supervisor': 'Rejected by Supervisor',
        'approved_supervisor': 'Approved by Supervisor',
        'rejected_hq': 'Rejected by HQ',
        'approved_hq': 'Approved by HQ'
    }[status] || 'Interviewer Assigned';

    return `<span class="status-badge ${statusClass}">${statusText}</span>`;
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month} ${day}, ${year} ${hours}:${minutes}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function viewInterview(interviewId) {
    window.location.href = `interview-details.html?id=${interviewId}`;
}

async function exportInterviews() {
    const token = localStorage.getItem('token');
    
    // Get current filters
    const params = new URLSearchParams();
    
    const questionnaireFilter = document.getElementById('filterQuestionnaire').value;
    const statusFilter = document.getElementById('filterStatus').value;
    const responsibleFilter = document.getElementById('filterResponsible').value;
    const modeFilter = document.getElementById('filterMode').value;
    
    if (questionnaireFilter) params.append('questionnaire', questionnaireFilter);
    if (statusFilter) params.append('status', statusFilter);
    if (responsibleFilter) params.append('responsible', responsibleFilter);
    if (modeFilter) params.append('mode', modeFilter);
    
    params.append('format', 'csv');

    try {
        const response = await fetch(`/api/interviews/export?${params.toString()}`, {
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
        a.download = `interviews_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error exporting interviews:', error);
        alert('Failed to export interviews. Please try again.');
    }
}
