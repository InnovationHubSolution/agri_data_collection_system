// Question Type Templates
const questionTemplates = {
    text: {
        type: 'text',
        label: 'Text Question',
        required: false,
        validation: {},
        skipLogic: null
    },
    number: {
        type: 'number',
        label: 'Number Question',
        required: false,
        validation: { min: null, max: null },
        skipLogic: null
    },
    date: {
        type: 'date',
        label: 'Date Question',
        required: false,
        validation: {},
        skipLogic: null
    },
    textarea: {
        type: 'textarea',
        label: 'Long Text Question',
        required: false,
        validation: { maxLength: 1000 },
        skipLogic: null
    },
    radio: {
        type: 'radio',
        label: 'Single Choice Question',
        required: false,
        options: ['Option 1', 'Option 2', 'Option 3'],
        skipLogic: null
    },
    checkbox: {
        type: 'checkbox',
        label: 'Multiple Choice Question',
        required: false,
        options: ['Option 1', 'Option 2', 'Option 3'],
        skipLogic: null
    },
    dropdown: {
        type: 'dropdown',
        label: 'Dropdown Question',
        required: false,
        options: ['Option 1', 'Option 2', 'Option 3'],
        skipLogic: null
    },
    gps: {
        type: 'gps',
        label: 'GPS Location',
        required: false,
        validation: {},
        skipLogic: null
    },
    photo: {
        type: 'photo',
        label: 'Photo Capture',
        required: false,
        validation: { maxSize: 5 },
        skipLogic: null
    },
    signature: {
        type: 'signature',
        label: 'Signature',
        required: false,
        validation: {},
        skipLogic: null
    },
    calculated: {
        type: 'calculated',
        label: 'Calculated Field',
        formula: '',
        skipLogic: null
    },
    section: {
        type: 'section',
        label: 'Section Header',
        description: ''
    }
};

// Global State
let formData = {
    id: null,
    title: 'Untitled Survey',
    description: '',
    questions: []
};

let selectedQuestionId = null;
let draggedElement = null;
let nextQuestionId = 1;

// Initialize Designer
document.addEventListener('DOMContentLoaded', () => {
    initializeDragAndDrop();
    initializeEventListeners();
    updateFormName();
});

// Drag and Drop Initialization
function initializeDragAndDrop() {
    const questionTypes = document.querySelectorAll('.question-type');
    const dropZone = document.getElementById('dropZone');

    questionTypes.forEach(type => {
        type.addEventListener('dragstart', handleDragStart);
        type.addEventListener('dragend', handleDragEnd);
    });

    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('drop', handleDrop);
    dropZone.addEventListener('dragleave', handleDragLeave);
}

// Event Listeners
function initializeEventListeners() {
    // Title and Description
    document.getElementById('surveyTitle').addEventListener('input', (e) => {
        formData.title = e.target.value || 'Untitled Survey';
        updateFormName();
    });

    document.getElementById('surveyDescription').addEventListener('input', (e) => {
        formData.description = e.target.value;
    });

    // Header Actions
    document.getElementById('previewBtn').addEventListener('click', previewForm);
    document.getElementById('loadBtn').addEventListener('click', loadForm);
    document.getElementById('saveBtn').addEventListener('click', saveForm);
    document.getElementById('publishBtn').addEventListener('click', publishForm);

    // Add Question Button
    document.getElementById('addQuestionBtn').addEventListener('click', () => {
        // This would open a dialog to select question type
        alert('Select a question type from the left palette and drag it to the canvas');
    });

    // Properties Panel Events
    document.getElementById('questionLabel').addEventListener('input', updateSelectedQuestion);
    document.getElementById('questionRequired').addEventListener('change', updateSelectedQuestion);
    document.getElementById('editOptionsBtn').addEventListener('click', editOptions);
    document.getElementById('editSkipLogicBtn').addEventListener('click', editSkipLogic);

    // Modal Close Events
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal').style.display = 'none';
        });
    });

    // Options Modal
    document.getElementById('addOptionBtn').addEventListener('click', addOption);
    document.getElementById('saveOptionsBtn').addEventListener('click', saveOptions);

    // Skip Logic Modal
    document.getElementById('saveSkipLogicBtn').addEventListener('click', saveSkipLogic);
}

// Drag and Drop Handlers
function handleDragStart(e) {
    draggedElement = e.target;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('questionType', e.target.dataset.type);
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    const questionType = e.dataTransfer.getData('questionType');
    if (questionType) {
        addQuestion(questionType);
    }
}

// Question Management
function addQuestion(type) {
    const template = JSON.parse(JSON.stringify(questionTemplates[type]));
    const question = {
        id: `q${nextQuestionId++}`,
        ...template
    };

    formData.questions.push(question);
    renderQuestions();
    selectQuestion(question.id);
}

function renderQuestions() {
    const dropZone = document.getElementById('dropZone');

    if (formData.questions.length === 0) {
        dropZone.innerHTML = '<p class="drop-zone-text">Drag and drop question types here to build your survey</p>';
        return;
    }

    dropZone.innerHTML = '';
    formData.questions.forEach((question, index) => {
        const questionEl = createQuestionElement(question, index);
        dropZone.appendChild(questionEl);
    });
}

function createQuestionElement(question, index) {
    const div = document.createElement('div');
    div.className = 'question-item';
    div.dataset.questionId = question.id;
    if (question.id === selectedQuestionId) {
        div.classList.add('selected');
    }
    if (question.skipLogic) {
        div.classList.add('has-skip-logic');
    }

    div.innerHTML = `
        <div class="question-header">
            <div>
                <span class="drag-handle" draggable="true">☰</span>
                <span class="question-label">${question.label}${question.required ? '<span class="required-indicator">*</span>' : ''}</span>
                ${question.skipLogic ? '<span class="skip-logic-indicator">Skip Logic</span>' : ''}
            </div>
            <div class="question-actions">
                <button class="icon-btn" onclick="moveQuestionUp(${index})" ${index === 0 ? 'disabled' : ''}>↑</button>
                <button class="icon-btn" onclick="moveQuestionDown(${index})" ${index === formData.questions.length - 1 ? 'disabled' : ''}>↓</button>
                <button class="icon-btn" onclick="deleteQuestion('${question.id}')">🗑</button>
            </div>
        </div>
        <span class="question-type-badge">${question.type}</span>
        <div class="question-preview">
            ${renderQuestionPreview(question)}
        </div>
    `;

    div.addEventListener('click', () => selectQuestion(question.id));

    return div;
}

function renderQuestionPreview(question) {
    switch (question.type) {
        case 'text':
            return '<input type="text" placeholder="Answer will appear here..." disabled>';
        case 'number':
            return '<input type="number" placeholder="Enter number..." disabled>';
        case 'date':
            return '<input type="date" disabled>';
        case 'textarea':
            return '<textarea placeholder="Long text answer..." disabled></textarea>';
        case 'radio':
        case 'checkbox':
            const inputType = question.type === 'radio' ? 'radio' : 'checkbox';
            return question.options.map((opt, i) => `
                <div class="option-item">
                    <input type="${inputType}" name="${question.id}" id="${question.id}_${i}" disabled>
                    <label for="${question.id}_${i}">${opt}</label>
                </div>
            `).join('');
        case 'dropdown':
            return `<select disabled>
                <option>Select an option...</option>
                ${question.options.map(opt => `<option>${opt}</option>`).join('')}
            </select>`;
        case 'gps':
            return '<div>📍 GPS coordinates will be captured automatically</div>';
        case 'photo':
            return '<div>📷 Photo will be captured here</div>';
        case 'signature':
            return '<div>✍ Signature pad will appear here</div>';
        case 'calculated':
            return `<div>Formula: <code>${question.formula || 'Not set'}</code></div>`;
        case 'section':
            return `<p>${question.description}</p>`;
        default:
            return '';
    }
}

function selectQuestion(questionId) {
    selectedQuestionId = questionId;
    renderQuestions();
    updatePropertiesPanel();
}

function deleteQuestion(questionId) {
    if (confirm('Are you sure you want to delete this question?')) {
        formData.questions = formData.questions.filter(q => q.id !== questionId);
        if (selectedQuestionId === questionId) {
            selectedQuestionId = null;
        }
        renderQuestions();
        updatePropertiesPanel();
    }
}

function moveQuestionUp(index) {
    if (index > 0) {
        [formData.questions[index], formData.questions[index - 1]] =
            [formData.questions[index - 1], formData.questions[index]];
        renderQuestions();
    }
}

function moveQuestionDown(index) {
    if (index < formData.questions.length - 1) {
        [formData.questions[index], formData.questions[index + 1]] =
            [formData.questions[index + 1], formData.questions[index]];
        renderQuestions();
    }
}

// Properties Panel
function updatePropertiesPanel() {
    const panel = document.getElementById('propertiesForm');
    const noSelection = document.getElementById('noSelection');

    if (!selectedQuestionId) {
        panel.style.display = 'none';
        noSelection.style.display = 'block';
        return;
    }

    const question = formData.questions.find(q => q.id === selectedQuestionId);
    if (!question) return;

    panel.style.display = 'flex';
    noSelection.style.display = 'none';

    document.getElementById('questionLabel').value = question.label;
    document.getElementById('questionRequired').checked = question.required || false;

    // Show/hide options button for radio, checkbox, dropdown
    const optionsBtn = document.getElementById('editOptionsBtn');
    const skipLogicBtn = document.getElementById('editSkipLogicBtn');

    if (['radio', 'checkbox', 'dropdown'].includes(question.type)) {
        optionsBtn.style.display = 'block';
    } else {
        optionsBtn.style.display = 'none';
    }

    // Skip logic available for all except section headers
    skipLogicBtn.style.display = question.type !== 'section' ? 'block' : 'none';
}

function updateSelectedQuestion() {
    if (!selectedQuestionId) return;

    const question = formData.questions.find(q => q.id === selectedQuestionId);
    if (!question) return;

    question.label = document.getElementById('questionLabel').value;
    question.required = document.getElementById('questionRequired').checked;

    renderQuestions();
}

// Options Editor
function editOptions() {
    const question = formData.questions.find(q => q.id === selectedQuestionId);
    if (!question) return;

    const modal = document.getElementById('optionsModal');
    const optionsList = document.getElementById('optionsList');

    optionsList.innerHTML = '';
    question.options.forEach((option, index) => {
        const div = document.createElement('div');
        div.className = 'option-input-group';
        div.innerHTML = `
            <input type="text" value="${option}" data-index="${index}">
            <button onclick="removeOption(${index})">Remove</button>
        `;
        optionsList.appendChild(div);
    });

    modal.style.display = 'block';
}

function addOption() {
    const optionsList = document.getElementById('optionsList');
    const index = optionsList.children.length;

    const div = document.createElement('div');
    div.className = 'option-input-group';
    div.innerHTML = `
        <input type="text" placeholder="New option..." data-index="${index}">
        <button onclick="removeOption(${index})">Remove</button>
    `;
    optionsList.appendChild(div);
}

function removeOption(index) {
    const optionsList = document.getElementById('optionsList');
    const inputs = optionsList.querySelectorAll('input');
    inputs[index].parentElement.remove();
}

function saveOptions() {
    const question = formData.questions.find(q => q.id === selectedQuestionId);
    if (!question) return;

    const optionsList = document.getElementById('optionsList');
    const inputs = optionsList.querySelectorAll('input');

    question.options = Array.from(inputs)
        .map(input => input.value.trim())
        .filter(val => val !== '');

    document.getElementById('optionsModal').style.display = 'none';
    renderQuestions();
}

// Skip Logic Editor
function editSkipLogic() {
    const question = formData.questions.find(q => q.id === selectedQuestionId);
    if (!question) return;

    const modal = document.getElementById('skipLogicModal');
    const questionSelect = document.getElementById('skipLogicQuestion');

    // Populate question dropdown (only questions before current one)
    questionSelect.innerHTML = '<option value="">Select a question...</option>';
    const currentIndex = formData.questions.findIndex(q => q.id === selectedQuestionId);
    formData.questions.slice(0, currentIndex).forEach(q => {
        if (q.type !== 'section') {
            questionSelect.innerHTML += `<option value="${q.id}">${q.label}</option>`;
        }
    });

    // Load existing skip logic
    if (question.skipLogic) {
        document.getElementById('skipLogicQuestion').value = question.skipLogic.questionId;
        document.getElementById('skipLogicOperator').value = question.skipLogic.operator;
        document.getElementById('skipLogicValue').value = question.skipLogic.value;
    } else {
        document.getElementById('skipLogicQuestion').value = '';
        document.getElementById('skipLogicOperator').value = 'equals';
        document.getElementById('skipLogicValue').value = '';
    }

    modal.style.display = 'block';
}

function saveSkipLogic() {
    const question = formData.questions.find(q => q.id === selectedQuestionId);
    if (!question) return;

    const questionId = document.getElementById('skipLogicQuestion').value;
    const operator = document.getElementById('skipLogicOperator').value;
    const value = document.getElementById('skipLogicValue').value;

    if (questionId && value) {
        question.skipLogic = { questionId, operator, value };
    } else {
        question.skipLogic = null;
    }

    document.getElementById('skipLogicModal').style.display = 'none';
    renderQuestions();
}

// Form Actions
function updateFormName() {
    document.getElementById('formName').textContent = formData.title;
}

async function previewForm() {
    const modal = document.getElementById('previewModal');
    const previewContent = document.getElementById('previewContent');

    let html = `<h2>${formData.title}</h2>`;
    if (formData.description) {
        html += `<p>${formData.description}</p>`;
    }

    formData.questions.forEach(question => {
        if (question.type === 'section') {
            html += `<h3 style="margin-top: 30px;">${question.label}</h3>`;
            if (question.description) {
                html += `<p>${question.description}</p>`;
            }
        } else {
            html += `<div style="margin: 20px 0;">`;
            html += `<label style="font-weight: bold; display: block; margin-bottom: 8px;">
                ${question.label}${question.required ? '<span style="color: red;">*</span>' : ''}
            </label>`;
            html += renderQuestionPreview(question);
            html += `</div>`;
        }
    });

    previewContent.innerHTML = html;
    modal.style.display = 'block';
}

async function saveForm() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Please login to save forms');
            return;
        }

        const url = formData.id
            ? `/api/forms/${formData.id}`
            : '/api/forms';

        const method = formData.id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: formData.title,
                description: formData.description,
                questions: formData.questions
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save form');
        }

        const savedForm = await response.json();
        formData.id = savedForm.id;
        formData.created_at = savedForm.created_at;
        formData.updated_at = savedForm.updated_at;

        showSuccessMessage('Survey saved successfully!');
    } catch (error) {
        console.error('Error saving form:', error);
        alert('Error saving form: ' + error.message);
    }
}

async function loadForm() {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Please login to load forms');
            return;
        }

        const response = await fetch('/api/forms', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load forms');
        }

        const forms = await response.json();
        const modal = document.getElementById('loadModal');
        const surveyList = document.getElementById('surveyList');

        if (forms.length === 0) {
            surveyList.innerHTML = '<p class="empty-state">No saved surveys found. Create a new survey to get started.</p>';
        } else {
            surveyList.innerHTML = '';
            forms.forEach(form => {
                const div = document.createElement('div');
                div.className = 'survey-list-item';
                div.innerHTML = `
                    <h4>${form.title}</h4>
                    <p>${form.description || 'No description'}</p>
                    <div class="meta">
                        <span>${form.question_count || 0} questions</span>
                        <span>Updated: ${new Date(form.updated_at).toLocaleDateString()}</span>
                    </div>
                `;
                div.addEventListener('click', async () => {
                    await loadFormById(form.id);
                    modal.style.display = 'none';
                });
                surveyList.appendChild(div);
            });
        }

        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading forms:', error);
        alert('Error loading forms: ' + error.message);
    }
}

async function loadFormById(id) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/forms/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load form');
        }

        const form = await response.json();
        formData = {
            id: form.id,
            title: form.title,
            description: form.description,
            questions: Array.isArray(form.questions) ? form.questions : JSON.parse(form.questions || '[]'),
            created_at: form.created_at,
            updated_at: form.updated_at
        };

        nextQuestionId = Math.max(...formData.questions.map(q => parseInt(q.id.substring(1)) || 0), 0) + 1;
        document.getElementById('surveyTitle').value = formData.title;
        document.getElementById('surveyDescription').value = formData.description;
        updateFormName();
        renderQuestions();
        showSuccessMessage('Survey loaded successfully!');
    } catch (error) {
        console.error('Error loading form:', error);
        alert('Error loading form: ' + error.message);
    }
}

async function publishForm() {
    if (formData.questions.length === 0) {
        alert('Cannot publish an empty survey. Please add at least one question.');
        return;
    }

    if (!formData.id) {
        alert('Please save the survey before publishing.');
        return;
    }

    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            alert('Please login to publish forms');
            return;
        }

        const response = await fetch(`/api/forms/${formData.id}/publish`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to publish form');
        }

        showSuccessMessage(`Survey "${formData.title}" has been published and is now available to mobile app users!`);
    } catch (error) {
        console.error('Error publishing form:', error);
        alert('Error publishing form: ' + error.message);
    }
}

function showSuccessMessage(message) {
    const div = document.createElement('div');
    div.className = 'success-message';
    div.textContent = message;
    document.body.appendChild(div);

    setTimeout(() => {
        div.remove();
    }, 3000);
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
            case 's':
                e.preventDefault();
                saveForm();
                break;
            case 'p':
                e.preventDefault();
                previewForm();
                break;
        }
    }

    if (e.key === 'Delete' && selectedQuestionId) {
        deleteQuestion(selectedQuestionId);
    }
});
