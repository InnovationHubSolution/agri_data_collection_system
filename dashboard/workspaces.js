// Workspaces Management
let workspaces = [];
let currentPage = 1;
let pageSize = 10;
let sortColumn = 'created_at';
let sortDirection = 'desc';
let searchQuery = '';
let editMode = false;
let currentWorkspaceId = null;

// Check authentication on page load
window.addEventListener('DOMContentLoaded', () => {
    checkAuthentication();
    loadWorkspaces();
    setupEventListeners();
});

function checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../login.html';
        return;
    }

    const username = localStorage.getItem('username') || 'User';
    document.getElementById('userName').textContent = username;
}

function setupEventListeners() {
    // Search input
    document.getElementById('searchInput').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        currentPage = 1;
        renderWorkspaces();
    });

    // Table header sorting
    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            if (sortColumn === column) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = column;
                sortDirection = 'asc';
            }
            updateSortHeaders();
            renderWorkspaces();
        });
    });

    // Form validation
    document.getElementById('workspaceName').addEventListener('input', validateName);
    document.getElementById('workspaceDisplayName').addEventListener('input', validateDisplayName);
}

function updateSortHeaders() {
    document.querySelectorAll('.sortable').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.dataset.sort === sortColumn) {
            th.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
        }
    });
}

async function loadWorkspaces() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/workspaces', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load workspaces');
        }

        workspaces = await response.json();
        renderWorkspaces();
    } catch (error) {
        console.error('Load workspaces error:', error);
        showAlert('error', 'Failed to load workspaces');
    }
}

function renderWorkspaces() {
    const tbody = document.getElementById('workspacesTableBody');

    // Filter workspaces
    let filteredWorkspaces = workspaces.filter(w => {
        if (!searchQuery) return true;
        return w.name.toLowerCase().includes(searchQuery) ||
            w.display_name.toLowerCase().includes(searchQuery);
    });

    // Sort workspaces
    filteredWorkspaces.sort((a, b) => {
        let aVal = a[sortColumn];
        let bVal = b[sortColumn];

        if (sortColumn === 'created_at') {
            aVal = new Date(aVal);
            bVal = new Date(bVal);
        } else {
            aVal = aVal?.toLowerCase() || '';
            bVal = bVal?.toLowerCase() || '';
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // Paginate
    const startIdx = (currentPage - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const paginatedWorkspaces = filteredWorkspaces.slice(startIdx, endIdx);

    // Render empty state or rows
    if (paginatedWorkspaces.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty-state">
                        <div class="empty-state-icon">📁</div>
                        <div class="empty-state-text">No workspaces found</div>
                        <div class="empty-state-subtext">
                            ${searchQuery ? 'Try adjusting your search criteria' : 'Click "CREATE NEW" to add your first workspace'}
                        </div>
                    </div>
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = paginatedWorkspaces.map(workspace => `
            <tr onclick="viewWorkspace('${workspace.name}')">
                <td class="workspace-name">${escapeHtml(workspace.name)}</td>
                <td class="workspace-display-name">${escapeHtml(workspace.display_name)}</td>
                <td>${formatDateTime(workspace.created_at)}</td>
                <td onclick="event.stopPropagation()">
                    <div class="workspace-actions">
                        <button class="btn-action" onclick="editWorkspace('${workspace.name}')">Edit</button>
                        ${workspace.name !== 'primary' ? `<button class="btn-action btn-danger" onclick="deleteWorkspace('${workspace.name}')">Delete</button>` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // Update pagination
    updatePagination(filteredWorkspaces.length);
}

function updatePagination(totalCount) {
    const totalPages = Math.ceil(totalCount / pageSize);

    document.getElementById('btnFirst').disabled = currentPage === 1;
    document.getElementById('btnPrevious').disabled = currentPage === 1;
    document.getElementById('btnNext').disabled = currentPage >= totalPages;
    document.getElementById('btnLast').disabled = currentPage >= totalPages;

    // Update page number button
    const btnPage1 = document.getElementById('btnPage1');
    btnPage1.textContent = currentPage;
    btnPage1.classList.add('active');
}

function goToPage(action) {
    const totalPages = Math.ceil(workspaces.length / pageSize);

    if (action === 'first') {
        currentPage = 1;
    } else if (action === 'previous') {
        currentPage = Math.max(1, currentPage - 1);
    } else if (action === 'next') {
        currentPage = Math.min(totalPages, currentPage + 1);
    } else if (action === 'last') {
        currentPage = totalPages;
    } else if (typeof action === 'number') {
        currentPage = action;
    }

    renderWorkspaces();
}

function openCreateModal() {
    editMode = false;
    currentWorkspaceId = null;

    document.getElementById('modalTitle').textContent = 'Create New Workspace';
    document.getElementById('workspaceForm').reset();
    document.getElementById('nameError').textContent = '';
    document.getElementById('displayNameError').textContent = '';
    document.querySelector('.btn-submit').textContent = 'CREATE';

    document.getElementById('workspaceModal').classList.add('active');
}

function editWorkspace(name) {
    const workspace = workspaces.find(w => w.name === name);
    if (!workspace) return;

    editMode = true;
    currentWorkspaceId = name;

    document.getElementById('modalTitle').textContent = 'Edit Workspace';
    document.getElementById('workspaceName').value = workspace.name;
    document.getElementById('workspaceName').disabled = true; // Can't change name
    document.getElementById('workspaceDisplayName').value = workspace.display_name;
    document.querySelector('.btn-submit').textContent = 'UPDATE';

    document.getElementById('workspaceModal').classList.add('active');
}

function closeModal() {
    document.getElementById('workspaceModal').classList.remove('active');
    document.getElementById('workspaceForm').reset();
    document.getElementById('workspaceName').disabled = false;
    editMode = false;
    currentWorkspaceId = null;
}

function validateName() {
    const input = document.getElementById('workspaceName');
    const error = document.getElementById('nameError');
    const value = input.value.trim();

    if (!value) {
        error.textContent = 'Name is required';
        return false;
    }

    if (value.length < 3 || value.length > 50) {
        error.textContent = 'Name must be 3-50 characters';
        return false;
    }

    if (!/^[a-z0-9_-]+$/.test(value)) {
        error.textContent = 'Name must be lowercase letters, numbers, underscores, or hyphens only';
        return false;
    }

    // Check for duplicates (only in create mode)
    if (!editMode && workspaces.some(w => w.name === value)) {
        error.textContent = 'A workspace with this name already exists';
        return false;
    }

    error.textContent = '';
    return true;
}

function validateDisplayName() {
    const input = document.getElementById('workspaceDisplayName');
    const error = document.getElementById('displayNameError');
    const value = input.value.trim();

    if (!value) {
        error.textContent = 'Display name is required';
        return false;
    }

    if (value.length > 200) {
        error.textContent = 'Display name must be 200 characters or less';
        return false;
    }

    error.textContent = '';
    return true;
}

async function handleSubmit() {
    if (!validateName() || !validateDisplayName()) {
        return;
    }

    const name = document.getElementById('workspaceName').value.trim();
    const displayName = document.getElementById('workspaceDisplayName').value.trim();

    try {
        const token = localStorage.getItem('token');
        const url = editMode ? `/api/workspaces/${currentWorkspaceId}` : '/api/workspaces';
        const method = editMode ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                display_name: displayName
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Operation failed');
        }

        showAlert('success', editMode ? 'Workspace updated successfully' : 'Workspace created successfully');
        closeModal();
        await loadWorkspaces();
    } catch (error) {
        console.error('Submit error:', error);
        showAlert('error', error.message);
    }
}

async function deleteWorkspace(name) {
    if (name === 'primary') {
        showAlert('error', 'Cannot delete the primary workspace');
        return;
    }

    if (!confirm(`Are you sure you want to delete workspace "${name}"? This will remove all associated questionnaires, interviews, and assignments.`)) {
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/workspaces/${name}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Delete failed');
        }

        showAlert('success', 'Workspace deleted successfully');
        await loadWorkspaces();
    } catch (error) {
        console.error('Delete error:', error);
        showAlert('error', error.message);
    }
}

function viewWorkspace(name) {
    // Navigate to workspace detail view or set as active workspace
    localStorage.setItem('activeWorkspace', name);
    showAlert('success', `Switched to workspace: ${name}`);
    // In a real implementation, this would reload the dashboard with the selected workspace context
}

function showAlert(type, message) {
    const container = document.getElementById('alertContainer');
    const alertClass = type === 'success' ? 'alert-success' : 'alert-error';

    container.innerHTML = `
        <div class="alert ${alertClass} show">
            ${escapeHtml(message)}
        </div>
    `;

    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

function formatDateTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('activeWorkspace');
    window.location.href = '../login.html';
}
