// Question Type Templates
const questionTemplates = {
    text: {
        type: 'text',
        label: 'Text Question',
        required: false,
        placeholder: '',
        validation: { minLength: null, maxLength: null, pattern: null },
        skipLogic: null,
        hint: ''
    },
    number: {
        type: 'number',
        label: 'Number Question',
        required: false,
        placeholder: '',
        validation: { min: null, max: null, decimals: 0 },
        skipLogic: null,
        hint: ''
    },
    integer: {
        type: 'integer',
        label: 'Integer Number',
        required: false,
        placeholder: '',
        validation: { min: null, max: null },
        skipLogic: null,
        hint: ''
    },
    decimal: {
        type: 'decimal',
        label: 'Decimal Number',
        required: false,
        placeholder: '',
        validation: { min: null, max: null, decimals: 2 },
        skipLogic: null,
        hint: ''
    },
    date: {
        type: 'date',
        label: 'Date Question',
        required: false,
        validation: { minDate: null, maxDate: null },
        skipLogic: null,
        hint: ''
    },
    time: {
        type: 'time',
        label: 'Time Question',
        required: false,
        validation: {},
        skipLogic: null,
        hint: ''
    },
    datetime: {
        type: 'datetime',
        label: 'Date & Time',
        required: false,
        validation: {},
        skipLogic: null,
        hint: ''
    },
    textarea: {
        type: 'textarea',
        label: 'Long Text Question',
        required: false,
        placeholder: '',
        validation: { maxLength: 1000 },
        skipLogic: null,
        hint: ''
    },
    email: {
        type: 'email',
        label: 'Email Address',
        required: false,
        placeholder: 'example@domain.com',
        validation: {},
        skipLogic: null,
        hint: ''
    },
    phone: {
        type: 'phone',
        label: 'Phone Number',
        required: false,
        placeholder: '+678 1234567',
        validation: {},
        skipLogic: null,
        hint: ''
    },
    url: {
        type: 'url',
        label: 'Website URL',
        required: false,
        placeholder: 'https://example.com',
        validation: {},
        skipLogic: null,
        hint: ''
    },
    radio: {
        type: 'radio',
        label: 'Single Choice Question',
        required: false,
        options: ['Option 1', 'Option 2', 'Option 3'],
        allowOther: false,
        skipLogic: null,
        hint: ''
    },
    checkbox: {
        type: 'checkbox',
        label: 'Multiple Choice Question',
        required: false,
        options: ['Option 1', 'Option 2', 'Option 3'],
        allowOther: false,
        validation: { minSelections: null, maxSelections: null },
        skipLogic: null,
        hint: ''
    },
    dropdown: {
        type: 'dropdown',
        label: 'Dropdown Question',
        required: false,
        options: ['Option 1', 'Option 2', 'Option 3'],
        allowOther: false,
        skipLogic: null,
        hint: ''
    },
    yesno: {
        type: 'yesno',
        label: 'Yes/No Question',
        required: false,
        skipLogic: null,
        hint: ''
    },
    rating: {
        type: 'rating',
        label: 'Rating Scale',
        required: false,
        validation: { min: 1, max: 5, step: 1 },
        labels: { min: 'Poor', max: 'Excellent' },
        skipLogic: null,
        hint: ''
    },
    gps: {
        type: 'gps',
        label: 'GPS Location',
        required: false,
        validation: { accuracy: null },
        captureAltitude: true,
        skipLogic: null,
        hint: ''
    },
    photo: {
        type: 'photo',
        label: 'Photo Capture',
        required: false,
        validation: { maxSize: 5, maxPhotos: 1 },
        allowMultiple: false,
        skipLogic: null,
        hint: ''
    },
    file: {
        type: 'file',
        label: 'File Upload',
        required: false,
        validation: { maxSize: 10, allowedTypes: [] },
        skipLogic: null,
        hint: ''
    },
    signature: {
        type: 'signature',
        label: 'Signature',
        required: false,
        validation: {},
        skipLogic: null,
        hint: ''
    },
    barcode: {
        type: 'barcode',
        label: 'Barcode/QR Code',
        required: false,
        validation: {},
        skipLogic: null,
        hint: ''
    },
    calculated: {
        type: 'calculated',
        label: 'Calculated Field',
        formula: '',
        displayFormat: 'number',
        skipLogic: null,
        hint: ''
    },
    roster: {
        type: 'roster',
        label: 'Repeating Group (Roster)',
        description: 'Add multiple entries',
        minEntries: 0,
        maxEntries: null,
        questions: [],
        hint: 'This will repeat for each entry'
    },
    matrix: {
        type: 'matrix',
        label: 'Matrix/Grid Question',
        required: false,
        rows: ['Row 1', 'Row 2', 'Row 3'],
        columns: ['Column 1', 'Column 2', 'Column 3'],
        answerType: 'radio',
        skipLogic: null,
        hint: ''
    },
    section: {
        type: 'section',
        label: 'Section Header',
        description: '',
        collapsible: false
    },
    pagebreak: {
        type: 'pagebreak',
        label: 'Page Break'
    },
    info: {
        type: 'info',
        label: 'Information Text',
        content: '',
        style: 'info'
    }
};

// Global State
let formData = {
    id: 1,
    title: 'Sample Agricultural Survey',
    description: 'A sample questionnaire with multiple question types',
    questions: [
        {
            id: 1,
            type: 'text',
            variable: 'farmer_name',
            label: 'Farmer Name',
            text: 'What is the name of the farmer?',
            required: true,
            placeholder: 'Enter full name',
            validation: { minLength: 2, maxLength: 100, pattern: null },
            skipLogic: null,
            hint: 'Please provide the full legal name'
        },
        {
            id: 2,
            type: 'integer',
            variable: 'farm_size',
            label: 'Farm Size',
            text: 'What is the size of the farm in hectares?',
            required: true,
            placeholder: '',
            validation: { min: 0, max: 10000 },
            skipLogic: null,
            hint: 'Enter the total farm area'
        },
        {
            id: 3,
            type: 'radio',
            variable: 'irrigation_type',
            label: 'Irrigation Type',
            text: 'What type of irrigation system do you use?',
            required: true,
            displayMode: 'radio',
            categoriesSource: 'user-defined',
            options: [
                { value: 1, label: 'Drip irrigation', attachment: null },
                { value: 2, label: 'Sprinkler', attachment: null },
                { value: 3, label: 'Flood irrigation', attachment: null },
                { value: 4, label: 'Rain-fed', attachment: null }
            ],
            skipLogic: null,
            hint: 'Select the primary irrigation method'
        }
    ]
};

let selectedQuestionId = null;
let draggedElement = null;
let nextQuestionId = 4;
let currentSection = 'questions'; // Current active section

// Toolbar Button Functions
function addQuestion() {
    // Open question type selector modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <h2>Select Question Type</h2>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 20px 0;">
                <button class="btn-outline" onclick="addQuestionType('text')">Text</button>
                <button class="btn-outline" onclick="addQuestionType('number')">Number</button>
                <button class="btn-outline" onclick="addQuestionType('date')">Date</button>
                <button class="btn-outline" onclick="addQuestionType('radio')">Single Choice</button>
                <button class="btn-outline" onclick="addQuestionType('checkbox')">Multiple Choice</button>
                <button class="btn-outline" onclick="addQuestionType('dropdown')">Dropdown</button>
                <button class="btn-outline" onclick="addQuestionType('email')">Email</button>
                <button class="btn-outline" onclick="addQuestionType('phone')">Phone</button>
                <button class="btn-outline" onclick="addQuestionType('gps')">GPS</button>
                <button class="btn-outline" onclick="addQuestionType('photo')">Photo</button>
                <button class="btn-outline" onclick="addQuestionType('roster')">Roster</button>
                <button class="btn-outline" onclick="addQuestionType('matrix')">Matrix</button>
            </div>
            <div style="text-align: right; margin-top: 20px;">
                <button class="btn-outline" onclick="closeModal()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function addQuestionType(type) {
    closeModal();
    const template = questionTemplates[type];
    if (!template) return;

    const question = {
        id: nextQuestionId++,
        ...JSON.parse(JSON.stringify(template)),
        label: `${template.label} ${formData.questions.length + 1}`
    };

    formData.questions.push(question);
    renderQuestions();
    selectQuestion(question.id);
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) modal.remove();
}

function addStaticText() {
    const text = prompt('Enter static text or instructions:');
    if (!text) return;

    const question = {
        id: nextQuestionId++,
        type: 'info',
        label: 'Information',
        text: text
    };

    formData.questions.push(question);
    renderQuestions();
}

function addVariable() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <h2>Add Variable</h2>
            <div class="form-group">
                <label>Variable Name</label>
                <input type="text" id="variableName" class="form-control" placeholder="e.g., calculated_total">
            </div>
            <div class="form-group">
                <label>Expression</label>
                <input type="text" id="variableExpression" class="form-control" placeholder="e.g., q1 + q2">
            </div>
            <div style="text-align: right; margin-top: 20px;">
                <button class="btn-outline" onclick="closeModal()">Cancel</button>
                <button class="btn-primary" onclick="saveVariable()">Add Variable</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function saveVariable() {
    const name = document.getElementById('variableName').value;
    const expression = document.getElementById('variableExpression').value;
    
    if (!name || !expression) {
        alert('Please enter both variable name and expression');
        return;
    }

    const question = {
        id: nextQuestionId++,
        type: 'calculated',
        label: name,
        expression: expression
    };

    formData.questions.push(question);
    renderQuestions();
    closeModal();
}

function searchQuestions() {
    const searchTerm = prompt('Search for questions:');
    if (!searchTerm) return;

    const results = formData.questions.filter(q => 
        q.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (results.length === 0) {
        alert('No questions found');
        return;
    }

    // Highlight first result
    if (results.length > 0) {
        selectQuestion(results[0].id);
        alert(`Found ${results.length} question(s)`);
    }
}

function pasteSection() {
    alert('Paste section functionality coming soon');
}

function addSubSection() {
    const name = prompt('Enter subsection name:');
    if (!name) return;

    const question = {
        id: nextQuestionId++,
        type: 'section',
        label: name,
        variable: name.toLowerCase().replace(/\s+/g, '_'),
        questions: []
    };

    formData.questions.push(question);
    renderQuestions();
}

function addRoster() {
    const name = prompt('Enter roster name:');
    if (!name) return;

    const question = {
        id: nextQuestionId++,
        type: 'roster',
        label: name,
        variable: name.toLowerCase().replace(/\s+/g, '_'),
        rosterSource: '',
        maxItems: 20,
        questions: []
    };

    formData.questions.push(question);
    renderQuestions();
    selectQuestion(question.id);
}

// Navigation Functions
function showSection(sectionName) {
    currentSection = sectionName;
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');

    // Show appropriate content
    const canvas = document.querySelector('.canvas');
    const propertiesPanel = document.querySelector('.properties-panel');

    switch(sectionName) {
        case 'cover':
            canvas.innerHTML = `
                <div class="section-header">
                    <h2>Cover Page</h2>
                    <p>Configure the questionnaire title, description, and cover page settings</p>
                </div>
                <div style="padding: 20px;">
                    <div class="form-group">
                        <label>Questionnaire Title</label>
                        <input type="text" class="form-control" value="${formData.title}" onchange="updateFormTitle(this.value)">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <textarea class="form-control" rows="4" onchange="updateFormDescription(this.value)">${formData.description || ''}</textarea>
                    </div>
                </div>
            `;
            propertiesPanel.innerHTML = '<div class="no-selection">Select a cover element to edit its properties</div>';
            break;

        case 'questions':
            renderQuestions();
            break;

        case 'validation':
            canvas.innerHTML = `
                <div class="section-header">
                    <h2>Validation Rules</h2>
                    <p>Define validation rules for your questionnaire</p>
                </div>
            `;
            propertiesPanel.innerHTML = '<div class="no-selection">No validation rules defined</div>';
            break;

        case 'comments':
            canvas.innerHTML = `
                <div class="section-header">
                    <h2>Comments</h2>
                    <p>Enable interviewer comments for questions</p>
                </div>
            `;
            propertiesPanel.innerHTML = '<div class="no-selection">No comments configuration</div>';
            break;

        case 'attachments':
            canvas.innerHTML = `
                <div class="section-header">
                    <h2>Attachments</h2>
                    <p>Manage questionnaire attachments (images, PDFs, etc.)</p>
                </div>
            `;
            propertiesPanel.innerHTML = '<div class="no-selection">No attachments</div>';
            break;

        case 'translations':
            canvas.innerHTML = `
                <div class="section-header">
                    <h2>Translations</h2>
                    <p>Add translations for multiple languages</p>
                </div>
            `;
            propertiesPanel.innerHTML = '<div class="no-selection">No translations configured</div>';
            break;
    }
}

function openSettings() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 2px solid var(--border-color);">
                <h2 style="margin: 0; font-size: 24px;">Questionnaire Settings</h2>
                <button onclick="closeModal()" style="background: transparent; border: none; font-size: 28px; cursor: pointer; color: #999;">&times;</button>
            </div>
            
            <div style="display: grid; gap: 30px;">
                <!-- General Settings -->
                <div class="settings-section">
                    <h3 style="color: var(--primary-color); margin-bottom: 15px; font-size: 18px;">General</h3>
                    
                    <div class="form-group">
                        <label style="font-weight: 600; margin-bottom: 5px;">Questionnaire Title</label>
                        <input type="text" class="form-control" id="settingsTitle" value="${formData.title}" placeholder="Enter questionnaire title">
                    </div>
                    
                    <div class="form-group">
                        <label style="font-weight: 600; margin-bottom: 5px;">Variable Name</label>
                        <input type="text" class="form-control" id="settingsVariable" value="${formData.variable || 'questionnaire_1'}" placeholder="questionnaire_variable">
                        <small style="color: #666;">Unique identifier for data export (lowercase, underscores only)</small>
                    </div>
                    
                    <div class="form-group">
                        <label style="font-weight: 600; margin-bottom: 5px;">Description</label>
                        <textarea class="form-control" id="settingsDescription" rows="3" placeholder="Enter questionnaire description">${formData.description || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label style="font-weight: 600; margin-bottom: 5px;">Version</label>
                        <input type="text" class="form-control" id="settingsVersion" value="${formData.version || '1.0'}" placeholder="1.0">
                    </div>
                </div>

                <!-- Language Settings -->
                <div class="settings-section">
                    <h3 style="color: var(--primary-color); margin-bottom: 15px; font-size: 18px;">Language & Translation</h3>
                    
                    <div class="form-group">
                        <label style="font-weight: 600; margin-bottom: 5px;">Default Language</label>
                        <select class="form-control" id="settingsLanguage">
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="ar">Arabic</option>
                            <option value="zh">Chinese</option>
                            <option value="ru">Russian</option>
                            <option value="pt">Portuguese</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="settingsMultilingual" style="margin-right: 8px;">
                            <span>Enable multiple languages</span>
                        </label>
                    </div>
                </div>

                <!-- Data Collection Settings -->
                <div class="settings-section">
                    <h3 style="color: var(--primary-color); margin-bottom: 15px; font-size: 18px;">Data Collection</h3>
                    
                    <div class="form-group">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="settingsGPS" checked style="margin-right: 8px;">
                            <span>Enable GPS tracking</span>
                        </label>
                        <small style="color: #666; margin-left: 28px;">Automatically capture location data during interviews</small>
                    </div>
                    
                    <div class="form-group">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="settingsTimestamp" checked style="margin-right: 8px;">
                            <span>Record timestamps</span>
                        </label>
                        <small style="color: #666; margin-left: 28px;">Track start and end time for each interview</small>
                    </div>
                    
                    <div class="form-group">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="settingsComments" style="margin-right: 8px;">
                            <span>Allow interviewer comments</span>
                        </label>
                        <small style="color: #666; margin-left: 28px;">Enable interviewers to add notes during data collection</small>
                    </div>
                    
                    <div class="form-group">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="settingsOffline" checked style="margin-right: 8px;">
                            <span>Enable offline mode</span>
                        </label>
                        <small style="color: #666; margin-left: 28px;">Allow data collection without internet connection</small>
                    </div>
                </div>

                <!-- Validation Settings -->
                <div class="settings-section">
                    <h3 style="color: var(--primary-color); margin-bottom: 15px; font-size: 18px;">Validation & Quality Control</h3>
                    
                    <div class="form-group">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="settingsRequiredValidation" checked style="margin-right: 8px;">
                            <span>Enforce required questions</span>
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="settingsSkipLogic" checked style="margin-right: 8px;">
                            <span>Enable skip logic</span>
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="settingsDataValidation" checked style="margin-right: 8px;">
                            <span>Enable data validation rules</span>
                        </label>
                    </div>
                </div>

                <!-- Security Settings -->
                <div class="settings-section">
                    <h3 style="color: var(--primary-color); margin-bottom: 15px; font-size: 18px;">Security & Privacy</h3>
                    
                    <div class="form-group">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="settingsEncryption" style="margin-right: 8px;">
                            <span>Encrypt collected data</span>
                        </label>
                    </div>
                    
                    <div class="form-group">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="settingsAnonymous" style="margin-right: 8px;">
                            <span>Anonymous responses</span>
                        </label>
                        <small style="color: #666; margin-left: 28px;">Do not collect interviewer or respondent identifiers</small>
                    </div>
                </div>

                <!-- Collaboration Settings -->
                <div class="settings-section">
                    <h3 style="color: var(--primary-color); margin-bottom: 15px; font-size: 18px;">Collaboration</h3>
                    
                    <div class="form-group">
                        <label style="font-weight: 600; margin-bottom: 5px;">Sharing</label>
                        <select class="form-control" id="settingsSharing">
                            <option value="private">Private - Only me</option>
                            <option value="team">Team - My organization</option>
                            <option value="public">Public - Anyone with link</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="checkbox" id="settingsVersionControl" style="margin-right: 8px;">
                            <span>Enable version control</span>
                        </label>
                        <small style="color: #666; margin-left: 28px;">Track changes and maintain version history</small>
                    </div>
                </div>
            </div>

            <div style="display: flex; gap: 15px; justify-content: flex-end; margin-top: 30px; padding-top: 20px; border-top: 2px solid var(--border-color);">
                <button class="btn-outline" onclick="closeModal()" style="padding: 12px 30px;">Cancel</button>
                <button class="btn-primary" onclick="saveSettings()" style="padding: 12px 30px;">Save Settings</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function saveSettings() {
    // Update form data with settings
    formData.title = document.getElementById('settingsTitle').value;
    formData.variable = document.getElementById('settingsVariable').value;
    formData.description = document.getElementById('settingsDescription').value;
    formData.version = document.getElementById('settingsVersion').value;
    formData.language = document.getElementById('settingsLanguage').value;
    
    // Update settings object
    formData.settings = {
        multilingual: document.getElementById('settingsMultilingual').checked,
        gpsTracking: document.getElementById('settingsGPS').checked,
        timestamps: document.getElementById('settingsTimestamp').checked,
        interviewerComments: document.getElementById('settingsComments').checked,
        offlineMode: document.getElementById('settingsOffline').checked,
        requiredValidation: document.getElementById('settingsRequiredValidation').checked,
        skipLogic: document.getElementById('settingsSkipLogic').checked,
        dataValidation: document.getElementById('settingsDataValidation').checked,
        encryption: document.getElementById('settingsEncryption').checked,
        anonymous: document.getElementById('settingsAnonymous').checked,
        sharing: document.getElementById('settingsSharing').value,
        versionControl: document.getElementById('settingsVersionControl').checked
    };
    
    updateFormName();
    closeModal();
    alert('Settings saved successfully!');
}

function updateFormTitle(value) {
    formData.title = value;
    updateFormName();
}

function updateFormDescription(value) {
    formData.description = value;
}

// Section Management Functions
let selectedSectionId = null;
let sections = [
    { id: 'cover', title: 'Cover', variable: 'cover', enableCondition: '' },
    { id: 'new-section', title: 'New Section', variable: 'section_1', enableCondition: '' }
];

function selectSection(sectionId) {
    selectedSectionId = sectionId;
    
    // Update active section in sidebar
    document.querySelectorAll('.section-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-section') === sectionId) {
            item.classList.add('active');
        }
    });
    
    // Show section properties
    showSectionProperties(sectionId);
    
    // Update canvas
    const section = sections.find(s => s.id === sectionId);
    if (section) {
        document.getElementById('currentSectionTitle').textContent = section.title;
    }
}

function showSectionProperties(sectionId) {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;
    
    // Hide other panels
    document.getElementById('noSelection').style.display = 'none';
    document.getElementById('propertiesForm').style.display = 'none';
    
    // Show section properties form
    const sectionForm = document.getElementById('sectionPropertiesForm');
    sectionForm.style.display = 'flex';
    
    // Populate fields
    document.getElementById('sectionFormTitle').textContent = section.title.toUpperCase();
    document.getElementById('sectionTitle').value = section.title;
    document.getElementById('sectionVariableName').value = section.variable;
    document.getElementById('sectionEnablingCondition').value = section.enableCondition || '';
    
    // Show enabling condition textarea if it has a value
    const conditionSection = document.getElementById('enablingConditionSection');
    if (section.enableCondition) {
        conditionSection.style.display = 'block';
    }
}

function updateSectionProperty(property, value) {
    if (!selectedSectionId) return;
    
    const section = sections.find(s => s.id === selectedSectionId);
    if (!section) return;
    
    section[property] = value;
    
    // Update section title in sidebar if title changed
    if (property === 'title') {
        const sectionItem = document.querySelector(`.section-item[data-section="${selectedSectionId}"] .section-title`);
        if (sectionItem) sectionItem.textContent = value;
        document.getElementById('currentSectionTitle').textContent = value;
    }
    
    updateSectionsCount();
}

function addEnablingCondition() {
    const conditionSection = document.getElementById('enablingConditionSection');
    conditionSection.style.display = 'block';
    document.getElementById('sectionEnablingCondition').focus();
}

function saveSectionChanges() {
    alert('Section changes saved successfully!');
}

function deleteSection() {
    if (!selectedSectionId) return;
    
    // Prevent deleting Cover section
    if (selectedSectionId === 'cover') {
        alert('Cannot delete the Cover section');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this section?')) return;
    
    // Remove section
    sections = sections.filter(s => s.id !== selectedSectionId);
    
    // Remove from sidebar
    const sectionItem = document.querySelector(`.section-item[data-section="${selectedSectionId}"]`);
    if (sectionItem) sectionItem.remove();
    
    // Select cover section
    selectedSectionId = null;
    selectSection('cover');
    
    updateSectionsCount();
}

function addNewSection() {
    const sectionId = `section_${Date.now()}`;
    const sectionNumber = sections.length;
    
    const newSection = {
        id: sectionId,
        title: `New Section ${sectionNumber}`,
        variable: `section_${sectionNumber}`,
        enableCondition: ''
    };
    
    sections.push(newSection);
    
    // Add to sidebar
    const sectionsList = document.getElementById('sectionsList');
    const sectionItem = document.createElement('div');
    sectionItem.className = 'section-item';
    sectionItem.setAttribute('data-section', sectionId);
    sectionItem.onclick = () => selectSection(sectionId);
    sectionItem.innerHTML = `
        <div class="section-header">
            <span class="section-title">${newSection.title}</span>
        </div>
        <button class="section-menu-btn" onclick="showSectionMenu(event, '${sectionId}')">⋮</button>
    `;
    
    sectionsList.appendChild(sectionItem);
    
    // Select the new section
    selectSection(sectionId);
    
    updateSectionsCount();
}

function showSectionMenu(event, sectionId) {
    event.stopPropagation();
    alert('Section menu: Duplicate, Move, Delete');
}

function collapseSidebar() {
    const sidebar = document.querySelector('.designer-sidebar');
    sidebar.style.width = '50px';
    // Toggle icon or hide text
}

function updateSectionsCount() {
    const count = sections.length;
    document.getElementById('sectionsCount').textContent = `${count} Section${count === 1 ? '' : 's'}`;
}

// Compilation and Testing Functions
function compileQuestionnaire() {
    const errors = validateQuestionnaire();
    const compileBtn = document.getElementById('compileBtn');
    const compileText = document.getElementById('compileText');
    const compileErrors = document.getElementById('compileErrors');
    
    if (errors.length === 0) {
        compileBtn.classList.remove('has-errors');
        compileBtn.classList.add('success');
        compileText.textContent = 'COMPILE ✓';
        compileErrors.style.display = 'none';
        
        // Hide any existing compilation panel
        const existingPanel = document.querySelector('.compilation-panel');
        if (existingPanel) existingPanel.remove();
        
        setTimeout(() => {
            alert('Compilation successful! No errors found.');
            compileBtn.classList.remove('success');
            compileText.textContent = 'COMPILE';
        }, 2000);
    } else {
        compileBtn.classList.add('has-errors');
        compileBtn.classList.remove('success');
        compileText.textContent = 'COMPILE';
        compileErrors.textContent = ` ${errors.length} ${errors.length === 1 ? 'ERROR' : 'ERRORS'}`;
        compileErrors.style.display = 'inline';
        
        showCompilationPanel(errors);
    }
}

function validateQuestionnaire() {
    const errors = [];
    
    // Check if questionnaire has title
    if (!formData.title || formData.title.trim() === '' || formData.title === 'Untitled Survey') {
        errors.push({
            code: 'WB0269',
            message: 'Question cannot have empty title.',
            type: 'error',
            location: 'Cover section'
        });
    }
    
    // Check if questionnaire has variable name
    if (!formData.variable || formData.variable.trim() === '') {
        errors.push({
            code: 'WB0004',
            message: 'Variable cannot have empty expression.',
            type: 'error',
            location: 'Cover section'
        });
    }
    
    // Validate each question
    formData.questions.forEach((question, index) => {
        // Check for empty variable name
        if (!question.variable || question.variable.trim() === '') {
            errors.push({
                code: 'WB0067',
                message: 'Valid variable or roster ID name should not be empty.',
                type: 'error',
                location: question.label || `Question ${index + 1}`,
                questionId: question.id
            });
        }
        
        // Check for empty question label
        if (!question.label || question.label.trim() === '') {
            errors.push({
                code: 'WB0113',
                message: 'Variable cannot have empty name.',
                type: 'error',
                location: `Question ${index + 1}`,
                questionId: question.id
            });
        }
        
        // Check roster validation
        if (question.type === 'roster') {
            if (!question.rosterSource || question.rosterSource.trim() === '') {
                errors.push({
                    code: 'WB0054',
                    message: 'Roster should have deeper or the same roster level as it\'s roster size question.',
                    type: 'error',
                    location: question.label || 'Roster',
                    questionId: question.id
                });
            }
        }
        
        // Check if questions in cover have variable labels
        if (question.type !== 'section' && question.type !== 'info') {
            if (!question.variable || question.variable.trim() === '') {
                errors.push({
                    code: 'WB0309',
                    message: 'Questions in Cover section must have variable label.',
                    type: 'error',
                    location: question.label || `Question ${index + 1}`,
                    questionId: question.id
                });
            }
            
            if (!question.label || question.label.trim() === '') {
                errors.push({
                    code: 'WB0311',
                    message: 'Variables in Cover section must have label.',
                    type: 'error',
                    location: `Question ${index + 1}`,
                    questionId: question.id
                });
            }
        }
    });
    
    return errors;
}

function testQuestionnaire() {
    const warnings = generateTestWarnings();
    const testBtn = document.getElementById('testBtn');
    const testText = document.getElementById('testText');
    const testWarnings = document.getElementById('testWarnings');
    
    if (warnings.length === 0) {
        testBtn.classList.remove('has-warnings');
        testBtn.classList.add('success');
        testText.textContent = 'TEST ✓';
        testWarnings.style.display = 'none';
        
        setTimeout(() => {
            alert('Testing successful! No warnings found.');
            testBtn.classList.remove('success');
            testText.textContent = 'TEST';
        }, 2000);
    } else {
        testBtn.classList.add('has-warnings');
        testBtn.classList.remove('success');
        testText.textContent = 'TEST';
        testWarnings.textContent = ` ${warnings.length} ${warnings.length === 1 ? 'WARNING' : 'WARNINGS'}`;
        testWarnings.style.display = 'inline';
        
        showCompilationPanel(warnings, true);
    }
}

function generateTestWarnings() {
    const warnings = [];
    
    // Check for questions without validation
    formData.questions.forEach((question, index) => {
        if (['text', 'number', 'email', 'phone'].includes(question.type)) {
            if (!question.validation || Object.keys(question.validation).length === 0) {
                warnings.push({
                    code: 'WT0001',
                    message: 'Consider adding validation rules for better data quality.',
                    type: 'warning',
                    location: question.label || `Question ${index + 1}`,
                    questionId: question.id
                });
            }
        }
        
        // Check for questions without hints
        if (!question.hint || question.hint.trim() === '') {
            warnings.push({
                code: 'WT0002',
                message: 'Consider adding hints or instructions for interviewers.',
                type: 'warning',
                location: question.label || `Question ${index + 1}`,
                questionId: question.id
            });
        }
    });
    
    return warnings;
}

function showCompilationPanel(issues, isWarning = false) {
    // Remove existing panel if any
    const existingPanel = document.querySelector('.compilation-panel');
    if (existingPanel) existingPanel.remove();
    
    const panel = document.createElement('div');
    panel.className = 'compilation-panel';
    
    const issueType = isWarning ? 'warning' : 'error';
    const headerColor = isWarning ? '#fff3e0' : '#ffebee';
    const headerBorder = isWarning ? '#f57c00' : '#d32f2f';
    const headerText = isWarning ? '#f57c00' : '#c62828';
    
    panel.innerHTML = `
        <div class="compilation-header" style="background: ${headerColor}; border-bottom-color: ${headerBorder};">
            <h2 style="color: ${headerText};">Compilation: ${issues.length} ${issueType}${issues.length === 1 ? '' : 's'} found</h2>
            <button onclick="closeCompilationPanel()" style="background: transparent; border: none; font-size: 24px; cursor: pointer; color: ${headerText};">&times;</button>
        </div>
        <div class="compilation-content">
            ${issues.map((issue, index) => `
                <div class="error-item ${issue.type}">
                    <div class="error-code">
                        <span class="${issue.type}-icon">${issue.type === 'warning' ? '⚠' : '✖'}</span>
                        [${issue.code}] • ${issue.message}
                    </div>
                    ${issue.location ? `
                        <div class="error-details">
                            <span class="error-location">${issue.location}</span>
                            ${issue.questionId ? `<a class="error-link" onclick="selectQuestion(${issue.questionId}); closeCompilationPanel();">Go to question →</a>` : ''}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        <div style="padding: 20px 30px; border-top: 1px solid var(--border-color); background: #f9f9f9;">
            <button class="btn-primary" onclick="closeCompilationPanel()">Close</button>
        </div>
    `;
    
    document.body.appendChild(panel);
}

function closeCompilationPanel() {
    const panel = document.querySelector('.compilation-panel');
    if (panel) panel.remove();
}

// Initialize Designer
document.addEventListener('DOMContentLoaded', () => {
    initializeDragAndDrop();
    initializeEventListeners();
    updateFormName();
    renderQuestions();
    updateStats();
    
    // Check if loading a specific questionnaire from URL
    const urlParams = new URLSearchParams(window.location.search);
    const questionnaireId = urlParams.get('id');
    
    if (questionnaireId) {
        loadFormById(questionnaireId);
    }
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
        case 'email':
        case 'phone':
        case 'url':
            return `<input type="${question.type}" placeholder="${question.placeholder || 'Answer will appear here...'}" disabled>`;
        case 'number':
        case 'integer':
        case 'decimal':
            return '<input type="number" placeholder="Enter number..." disabled>';
        case 'date':
            return '<input type="date" disabled>';
        case 'time':
            return '<input type="time" disabled>';
        case 'datetime':
            return '<input type="datetime-local" disabled>';
        case 'textarea':
            return `<textarea placeholder="${question.placeholder || 'Long text answer...'}" disabled></textarea>`;
        case 'radio':
        case 'checkbox':
            const inputType = question.type === 'radio' ? 'radio' : 'checkbox';
            return question.options.map((opt, i) => `
                <div class="option-item">
                    <input type="${inputType}" name="${question.id}" id="${question.id}_${i}" disabled>
                    <label for="${question.id}_${i}">${opt}</label>
                </div>
            `).join('') + (question.allowOther ? '<div class="option-item"><input type="text" placeholder="Other..." disabled></div>' : '');
        case 'dropdown':
            return `<select disabled>
                <option>Select an option...</option>
                ${question.options.map(opt => `<option>${opt}</option>`).join('')}
                ${question.allowOther ? '<option>Other...</option>' : ''}
            </select>`;
        case 'yesno':
            return `<div class="option-item">
                <input type="radio" name="${question.id}" disabled> Yes
                <input type="radio" name="${question.id}" disabled> No
            </div>`;
        case 'rating':
            const stars = [];
            for (let i = (question.validation?.min || 1); i <= (question.validation?.max || 5); i++) {
                stars.push(`<span class="rating-star">⭐</span>`);
            }
            return `<div class="rating-preview">${stars.join('')}</div>`;
        case 'matrix':
            return `<div class="matrix-preview">
                <table>
                    <tr><th></th>${(question.columns || []).map(col => `<th>${col}</th>`).join('')}</tr>
                    ${(question.rows || []).map(row => `<tr><td>${row}</td>${(question.columns || []).map(() => `<td><input type="${question.answerType || 'radio'}" disabled></td>`).join('')}</tr>`).join('')}
                </table>
            </div>`;
        case 'gps':
            return '<div>📍 GPS coordinates will be captured automatically</div>';
        case 'photo':
            return `<div>📷 ${question.allowMultiple ? 'Multiple photos' : 'Photo'} will be captured here</div>`;
        case 'file':
            return '<div>📎 File upload will appear here</div>';
        case 'signature':
            return '<div>✍️ Signature pad will appear here</div>';
        case 'barcode':
            return '<div>⊟ Barcode/QR scanner will appear here</div>';
        case 'calculated':
            return `<div>🧮 Formula: <code>${question.formula || 'Not set'}</code></div>`;
        case 'roster':
            return `<div class="roster-preview">
                <strong>🔄 Repeating Group</strong>
                <p>${question.description || 'Add multiple entries'}</p>
                <small>${question.questions?.length || 0} questions in roster</small>
            </div>`;
        case 'section':
            return `<p>${question.description || ''}</p>`;
        case 'pagebreak':
            return '<div class="pagebreak-preview">--- Page Break ---</div>';
        case 'info':
            return `<div class="info-preview ${question.style || 'info'}">${question.content || 'Information text'}</div>`;
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

    // Populate all fields
    document.getElementById('questionType').value = question.type || 'text';
    document.getElementById('questionVariable').value = question.variable || `q${question.id}`;
    document.getElementById('questionLabel').value = question.label || '';
    document.getElementById('questionText').value = question.questionText || question.label || '';
    document.getElementById('questionPattern').value = question.validation?.pattern || '';
    document.getElementById('questionCritical').checked = question.critical || false;

    // Show/hide pattern field based on question type
    const patternSection = document.getElementById('patternSection');
    if (['text', 'email', 'phone', 'url'].includes(question.type)) {
        patternSection.style.display = 'block';
    } else {
        patternSection.style.display = 'none';
    }

    // Show/hide options section for choice questions
    const optionsSection = document.getElementById('optionsSection');
    const displayModeSection = document.getElementById('displayModeSection');
    const categoriesSourceSection = document.getElementById('categoriesSourceSection');
    
    // Show/hide roster sections
    const rosterSourceSection = document.getElementById('rosterSourceSection');
    const rosterIdSection = document.getElementById('rosterIdSection');
    const rosterNameSection = document.getElementById('rosterNameSection');
    const rosterSourceQuestionSection = document.getElementById('rosterSourceQuestionSection');
    const rosterItemsSection = document.getElementById('rosterItemsSection');
    const rosterDisplayModeSection = document.getElementById('rosterDisplayModeSection');
    
    if (question.type === 'roster') {
        // Show roster-specific fields
        optionsSection.style.display = 'none';
        displayModeSection.style.display = 'none';
        categoriesSourceSection.style.display = 'none';
        
        rosterSourceSection.style.display = 'block';
        rosterIdSection.style.display = 'block';
        rosterNameSection.style.display = 'block';
        rosterDisplayModeSection.style.display = 'block';
        
        // Set roster properties
        const rosterSourceSelect = document.getElementById('questionRosterSource');
        rosterSourceSelect.value = question.rosterSourceType || 'fixed';
        
        document.getElementById('questionRosterId').value = question.rosterId || question.variable || '';
        document.getElementById('questionRosterName').value = question.rosterName || `New roster - %rostertitle%`;
        
        const rosterDisplayModeSelect = document.getElementById('questionRosterDisplayMode');
        rosterDisplayModeSelect.value = question.rosterDisplayMode || 'sub-section';
        
        // Show appropriate section based on source type
        if (rosterSourceSelect.value === 'fixed') {
            rosterItemsSection.style.display = 'block';
            rosterSourceQuestionSection.style.display = 'none';
            renderRosterItems(question);
        } else {
            rosterItemsSection.style.display = 'none';
            rosterSourceQuestionSection.style.display = 'block';
            populateSourceQuestionDropdown(question);
        }
    } else if (['radio', 'checkbox', 'dropdown'].includes(question.type)) {
        optionsSection.style.display = 'block';
        displayModeSection.style.display = 'block';
        categoriesSourceSection.style.display = 'block';
        
        rosterSourceSection.style.display = 'none';
        rosterIdSection.style.display = 'none';
        rosterNameSection.style.display = 'none';
        rosterSourceQuestionSection.style.display = 'none';
        rosterItemsSection.style.display = 'none';
        rosterDisplayModeSection.style.display = 'none';
        
        // Set display mode value
        const displayModeSelect = document.getElementById('questionDisplayMode');
        displayModeSelect.value = question.displayMode || 'radio';
        
        // Set categories source value
        const categoriesSourceSelect = document.getElementById('questionCategoriesSource');
        categoriesSourceSelect.value = question.categoriesSource || 'user-defined';
    } else {
        optionsSection.style.display = 'none';
        displayModeSection.style.display = 'none';
        categoriesSourceSection.style.display = 'none';
        rosterSourceSection.style.display = 'none';
        rosterIdSection.style.display = 'none';
        rosterNameSection.style.display = 'none';
        rosterSourceQuestionSection.style.display = 'none';
        rosterItemsSection.style.display = 'none';
        rosterDisplayModeSection.style.display = 'none';
    }
}

function updateRosterSource(sourceType) {
    if (!selectedQuestionId) return;
    
    const question = formData.questions.find(q => q.id === selectedQuestionId);
    if (!question) return;
    
    question.rosterSourceType = sourceType;
    
    // Show/hide appropriate sections based on source type
    const rosterItemsSection = document.getElementById('rosterItemsSection');
    const rosterSourceQuestionSection = document.getElementById('rosterSourceQuestionSection');
    
    if (sourceType === 'fixed') {
        rosterItemsSection.style.display = 'block';
        rosterSourceQuestionSection.style.display = 'none';
        if (!question.rosterItems || question.rosterItems.length === 0) {
            question.rosterItems = [
                { id: 1, title: 'First Title' },
                { id: 2, title: 'Second Title' }
            ];
        }
        renderRosterItems(question);
    } else {
        // List, multi-select, or numeric question source
        rosterItemsSection.style.display = 'none';
        rosterSourceQuestionSection.style.display = 'block';
        populateSourceQuestionDropdown(question);
    }
}

function populateSourceQuestionDropdown(rosterQuestion) {
    const select = document.getElementById('questionRosterSourceQuestion');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select question</option>';
    
    // Get all questions that can be used as roster source
    const eligibleQuestions = formData.questions.filter(q => {
        if (q.id === rosterQuestion.id) return false; // Can't use self
        
        const sourceType = rosterQuestion.rosterSourceType;
        if (sourceType === 'list') {
            // List questions can be used
            return q.type === 'text' || q.type === 'textarea';
        } else if (sourceType === 'multi-select') {
            // Multi-select questions (checkbox type)
            return q.type === 'checkbox';
        } else if (sourceType === 'numeric') {
            // Numeric questions
            return q.type === 'number' || q.type === 'integer';
        }
        return false;
    });
    
    eligibleQuestions.forEach(q => {
        const option = document.createElement('option');
        option.value = q.id;
        option.textContent = `${q.variable || q.id} - ${q.label || q.text}`;
        if (rosterQuestion.rosterSourceQuestion === q.id) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

function renderRosterItems(question) {
    const tbody = document.getElementById('rosterItemsList');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!question.rosterItems) {
        question.rosterItems = [];
    }
    
    question.rosterItems.forEach((item, index) => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #e0e0e0';
        row.innerHTML = `
            <td style="padding: 8px; width: 60px; text-align: center; background: #f5f5f5; font-weight: 600;">${item.id}</td>
            <td style="padding: 8px;">
                <input type="text" class="form-control" value="${item.title}" 
                       onchange="updateRosterItemTitle(${index}, this.value)"
                       style="padding: 6px; font-size: 14px; border: 1px solid #ddd;">
            </td>
            <td style="padding: 8px; width: 50px; text-align: center;">
                <button onclick="removeRosterItem(${index})" 
                        style="background: transparent; border: none; color: #d32f2f; cursor: pointer; font-size: 20px;"
                        title="Remove item">×</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function addRosterItem() {
    if (!selectedQuestionId) return;
    
    const question = formData.questions.find(q => q.id === selectedQuestionId);
    if (!question) return;
    
    if (!question.rosterItems) question.rosterItems = [];
    
    const newId = question.rosterItems.length > 0 
        ? Math.max(...question.rosterItems.map(item => item.id)) + 1 
        : 1;
    
    question.rosterItems.push({
        id: newId,
        title: `Item ${newId}`
    });
    
    renderRosterItems(question);
}

function removeRosterItem(index) {
    if (!selectedQuestionId) return;
    
    const question = formData.questions.find(q => q.id === selectedQuestionId);
    if (!question || !question.rosterItems) return;
    
    question.rosterItems.splice(index, 1);
    renderRosterItems(question);
}

function updateRosterItemTitle(index, newTitle) {
    if (!selectedQuestionId) return;
    
    const question = formData.questions.find(q => q.id === selectedQuestionId);
    if (!question || !question.rosterItems) return;
    
    question.rosterItems[index].title = newTitle;
}

function toggleRosterTextView() {
    alert('Text view for roster items - bulk edit functionality');
}

function updateQuestionProperty(property, value) {
    if (!selectedQuestionId) return;
    
    const question = formData.questions.find(q => q.id === selectedQuestionId);
    if (!question) return;

    if (property === 'pattern') {
        if (!question.validation) question.validation = {};
        question.validation.pattern = value;
    } else if (property === 'variable') {
        question.variable = value;
    } else {
        question[property] = value;
    }
    
    renderQuestions();
}

function updateQuestionType() {
    if (!selectedQuestionId) return;
    
    const question = formData.questions.find(q => q.id === selectedQuestionId);
    if (!question) return;

    const newType = document.getElementById('questionType').value;
    const template = questionTemplates[newType];
    
    if (template) {
        // Preserve label and id
        const label = question.label;
        const id = question.id;
        const variable = question.variable;
        
        // Apply new template
        Object.assign(question, JSON.parse(JSON.stringify(template)));
        question.id = id;
        question.label = label;
        question.variable = variable;
        
        renderQuestions();
        updatePropertiesPanel();
    }
}

function saveQuestionChanges() {
    // Changes are auto-saved on each field update
    alert('Question saved successfully!');
}

function cancelQuestionChanges() {
    selectedQuestionId = null;
    updatePropertiesPanel();
    renderQuestions();
}

function deleteSelectedQuestion() {
    if (!selectedQuestionId) return;
    deleteQuestion(selectedQuestionId);
}

function addInterviewerInstruction() {
    const instruction = prompt('Enter interviewer instruction:');
    if (!instruction) return;
    
    if (!selectedQuestionId) return;
    const question = formData.questions.find(q => q.id === selectedQuestionId);
    if (!question) return;
    
    question.instruction = instruction;
    alert('Instruction added!');
}

function addValidationCondition() {
    const condition = prompt('Enter validation expression (e.g., value > 0):');
    if (!condition) return;
    
    if (!selectedQuestionId) return;
    const question = formData.questions.find(q => q.id === selectedQuestionId);
    if (!question) return;
    
    if (!question.validation) question.validation = {};
    if (!question.validation.conditions) question.validation.conditions = [];
    question.validation.conditions.push(condition);
    
    alert('Validation condition added!');
}

function addCommentToQuestion() {
    const comment = prompt('Enter comment:');
    if (!comment) return;
    
    if (!selectedQuestionId) return;
    const question = formData.questions.find(q => q.id === selectedQuestionId);
    if (!question) return;
    
    if (!question.comments) question.comments = [];
    question.comments.push({ text: comment, date: new Date().toISOString() });
    
    alert('Comment added!');
}

function moveQuestionDialog() {
    alert('Move question functionality coming soon');
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

    // Initialize options array with proper structure if needed
    if (!question.options || !Array.isArray(question.options)) {
        question.options = [];
    }

    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'categoriesModal';
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 900px; max-height: 90vh;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid var(--border-color);">
                <h2 style="margin: 0;">Edit Categories</h2>
                <button onclick="closeCategoriesModal()" style="background: transparent; border: none; font-size: 28px; cursor: pointer; color: #999;">&times;</button>
            </div>

            <div style="background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="btn-secondary" onclick="addCategory()">
                        <span style="margin-right: 5px;">+</span> ADD CATEGORY
                    </button>
                    <button class="btn-outline" onclick="searchClassification()">
                        🔍 SEARCH FOR CLASSIFICATION
                    </button>
                    <button class="btn-outline" onclick="toggleTextView()">
                        📝 TEXT VIEW
                    </button>
                    <button class="btn-outline" onclick="addFilter()">
                        🔧 ADD FILTER
                    </button>
                </div>
            </div>

            <div id="categoriesTableContainer" style="overflow-x: auto;">
                <table class="categories-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #e8e8e8; border-bottom: 2px solid #ccc;">
                            <th style="padding: 12px; text-align: left; font-weight: 600; width: 100px;">Value?</th>
                            <th style="padding: 12px; text-align: left; font-weight: 600;">Title?</th>
                            <th style="padding: 12px; text-align: left; font-weight: 600; width: 150px;">Attachment name?</th>
                            <th style="padding: 12px; text-align: center; width: 60px;"></th>
                        </tr>
                    </thead>
                    <tbody id="categoriesList">
                        ${question.options.map((option, index) => {
                            const opt = typeof option === 'string' ? { value: index + 1, title: option, attachment: '' } : option;
                            return `
                                <tr style="border-bottom: 1px solid #e0e0e0;" data-index="${index}">
                                    <td style="padding: 8px;">
                                        <input type="text" class="form-control" value="${opt.value || index + 1}" 
                                               data-field="value" data-index="${index}"
                                               style="padding: 6px; font-size: 14px;">
                                    </td>
                                    <td style="padding: 8px;">
                                        <input type="text" class="form-control" value="${opt.title || opt}" 
                                               data-field="title" data-index="${index}"
                                               placeholder="Enter category title"
                                               style="padding: 6px; font-size: 14px;">
                                    </td>
                                    <td style="padding: 8px;">
                                        <input type="text" class="form-control" value="${opt.attachment || ''}" 
                                               data-field="attachment" data-index="${index}"
                                               placeholder="Optional"
                                               style="padding: 6px; font-size: 14px;">
                                    </td>
                                    <td style="padding: 8px; text-align: center;">
                                        <button onclick="removeCategoryRow(${index})" 
                                                style="background: transparent; border: none; color: #d32f2f; cursor: pointer; font-size: 20px;"
                                                title="Remove category">×</button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div id="textViewContainer" style="display: none; margin-top: 20px;">
                <textarea id="textViewEditor" class="form-control" rows="15" 
                          placeholder="Enter categories (one per line, format: value|title|attachment)"
                          style="font-family: monospace; font-size: 13px;"></textarea>
                <small style="color: #666; margin-top: 5px; display: block;">
                    Format: value|title|attachment (one per line). Example: 1|Yes|yes.png
                </small>
            </div>

            <div style="display: flex; gap: 15px; justify-content: flex-end; margin-top: 30px; padding-top: 20px; border-top: 2px solid var(--border-color);">
                <button class="btn-outline" onclick="closeCategoriesModal()" style="padding: 12px 30px;">Cancel</button>
                <button class="btn-primary" onclick="saveCategoriesFromModal()" style="padding: 12px 30px;">Save Categories</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function addCategory() {
    const tbody = document.getElementById('categoriesList');
    const index = tbody.children.length;
    
    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid #e0e0e0';
    row.setAttribute('data-index', index);
    row.innerHTML = `
        <td style="padding: 8px;">
            <input type="text" class="form-control" value="${index + 1}" 
                   data-field="value" data-index="${index}"
                   style="padding: 6px; font-size: 14px;">
        </td>
        <td style="padding: 8px;">
            <input type="text" class="form-control" value="" 
                   data-field="title" data-index="${index}"
                   placeholder="Enter category title"
                   style="padding: 6px; font-size: 14px;">
        </td>
        <td style="padding: 8px;">
            <input type="text" class="form-control" value="" 
                   data-field="attachment" data-index="${index}"
                   placeholder="Optional"
                   style="padding: 6px; font-size: 14px;">
        </td>
        <td style="padding: 8px; text-align: center;">
            <button onclick="removeCategoryRow(${index})" 
                    style="background: transparent; border: none; color: #d32f2f; cursor: pointer; font-size: 20px;"
                    title="Remove category">×</button>
        </td>
    `;
    
    tbody.appendChild(row);
}

function removeCategoryRow(index) {
    const row = document.querySelector(`tr[data-index="${index}"]`);
    if (row) row.remove();
}

function searchClassification() {
    alert('Search for classification functionality - connect to external classification databases (ISIC, NAICS, etc.)');
}

function toggleTextView() {
    const tableContainer = document.getElementById('categoriesTableContainer');
    const textContainer = document.getElementById('textViewContainer');
    const textEditor = document.getElementById('textViewEditor');
    
    if (textContainer.style.display === 'none') {
        // Switch to text view - convert table to text
        const inputs = document.querySelectorAll('#categoriesList tr');
        const lines = [];
        
        inputs.forEach(row => {
            const valueInput = row.querySelector('[data-field="value"]');
            const titleInput = row.querySelector('[data-field="title"]');
            const attachmentInput = row.querySelector('[data-field="attachment"]');
            
            if (valueInput && titleInput) {
                const value = valueInput.value || '';
                const title = titleInput.value || '';
                const attachment = attachmentInput ? attachmentInput.value || '' : '';
                lines.push(`${value}|${title}|${attachment}`);
            }
        });
        
        textEditor.value = lines.join('\n');
        tableContainer.style.display = 'none';
        textContainer.style.display = 'block';
    } else {
        // Switch to table view - convert text to table
        const lines = textEditor.value.split('\n').filter(line => line.trim());
        const tbody = document.getElementById('categoriesList');
        tbody.innerHTML = '';
        
        lines.forEach((line, index) => {
            const parts = line.split('|');
            const value = parts[0] || (index + 1);
            const title = parts[1] || '';
            const attachment = parts[2] || '';
            
            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #e0e0e0';
            row.setAttribute('data-index', index);
            row.innerHTML = `
                <td style="padding: 8px;">
                    <input type="text" class="form-control" value="${value}" 
                           data-field="value" data-index="${index}"
                           style="padding: 6px; font-size: 14px;">
                </td>
                <td style="padding: 8px;">
                    <input type="text" class="form-control" value="${title}" 
                           data-field="title" data-index="${index}"
                           placeholder="Enter category title"
                           style="padding: 6px; font-size: 14px;">
                </td>
                <td style="padding: 8px;">
                    <input type="text" class="form-control" value="${attachment}" 
                           data-field="attachment" data-index="${index}"
                           placeholder="Optional"
                           style="padding: 6px; font-size: 14px;">
                </td>
                <td style="padding: 8px; text-align: center;">
                    <button onclick="removeCategoryRow(${index})" 
                            style="background: transparent; border: none; color: #d32f2f; cursor: pointer; font-size: 20px;"
                            title="Remove category">×</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        tableContainer.style.display = 'block';
        textContainer.style.display = 'none';
    }
}

function addFilter() {
    alert('Add filter functionality - filter categories based on conditions');
}

function saveCategoriesFromModal() {
    const question = formData.questions.find(q => q.id === selectedQuestionId);
    if (!question) return;

    const rows = document.querySelectorAll('#categoriesList tr');
    const categories = [];
    
    rows.forEach(row => {
        const valueInput = row.querySelector('[data-field="value"]');
        const titleInput = row.querySelector('[data-field="title"]');
        const attachmentInput = row.querySelector('[data-field="attachment"]');
        
        if (titleInput && titleInput.value.trim()) {
            categories.push({
                value: valueInput ? valueInput.value.trim() : '',
                title: titleInput.value.trim(),
                attachment: attachmentInput ? attachmentInput.value.trim() : ''
            });
        }
    });

    question.options = categories;
    closeCategoriesModal();
    renderQuestions();
    alert('Categories saved successfully!');
}

function closeCategoriesModal() {
    const modal = document.getElementById('categoriesModal');
    if (modal) modal.remove();
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

        // Try to fetch from backend first
        let forms = [];
        try {
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch('/api/forms', { headers });

            if (response.ok) {
                forms = await response.json();
            } else if (response.status === 401) {
                // If unauthorized but we want to continue, use demo data
                console.log('Not authenticated, loading demo questionnaires');
                forms = getDemoQuestionnaires();
            } else {
                throw new Error('Failed to load forms');
            }
        } catch (fetchError) {
            console.error('Failed to fetch from backend, using demo data:', fetchError);
            forms = getDemoQuestionnaires();
        }

        const modal = document.getElementById('loadModal');
        const surveyList = document.getElementById('surveyList');

        if (forms.length === 0) {
            surveyList.innerHTML = '<p class="empty-state">No saved surveys found. Create a new survey to get started.</p>';
        } else {
            surveyList.innerHTML = '';
            forms.forEach(form => {
                const div = document.createElement('div');
                div.className = 'survey-list-item';
                const questionCount = form.question_count || (form.questions ? form.questions.length : 0);
                const updatedDate = form.updated_at ? new Date(form.updated_at).toLocaleDateString() : 'N/A';

                div.innerHTML = `
                    <h4>${form.title}</h4>
                    <p>${form.description || 'No description'}</p>
                    <div class="meta">
                        <span>${questionCount} questions</span>
                        <span>Updated: ${updatedDate}</span>
                    </div>
                `;
                div.addEventListener('click', async () => {
                    await loadFormById(form.id, form);
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

async function loadFormById(id, formObject = null) {
    try {
        let form = formObject;

        // If form object not provided, fetch from backend
        if (!form) {
            const token = localStorage.getItem('authToken');
            const headers = {};
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`/api/forms/${id}`, { headers });

            if (!response.ok) {
                throw new Error('Failed to load form');
            }

            form = await response.json();
        }

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

// Demo Questionnaires (fallback when database is not available)
function getDemoQuestionnaires() {
    return [
        {
            id: 1,
            title: 'Agriculture census 2022 listing',
            description: 'Comprehensive agricultural census for 2022 data collection',
            questions: [
                { id: 'q1', type: 'section', label: 'Household Information', description: 'Basic information about the farming household' },
                { id: 'q2', type: 'text', label: 'Household Head Name', required: true },
                { id: 'q3', type: 'text', label: 'Village/Settlement Name', required: true },
                { id: 'q4', type: 'gps', label: 'Farm Location', required: true },
                { id: 'q5', type: 'section', label: 'Farm Details', description: 'Information about the farm operation' },
                { id: 'q6', type: 'number', label: 'Total Farm Area (hectares)', required: true, validation: { min: 0, max: 10000 } },
                { id: 'q7', type: 'checkbox', label: 'Main Crops Grown', required: true, options: ['Rice', 'Corn', 'Vegetables', 'Fruits', 'Root Crops', 'Other'] },
                { id: 'q8', type: 'radio', label: 'Farm Ownership', required: true, options: ['Owned', 'Leased', 'Shared', 'Communal'] }
            ],
            created_at: '2023-10-13T00:24:00Z',
            updated_at: '2025-02-01T21:43:00Z'
        },
        {
            id: 2,
            title: 'Census 2020 - Vanuatu',
            description: 'National census survey for Vanuatu 2020',
            questions: [
                { id: 'q1', type: 'section', label: 'Demographics', description: 'Population and household demographics' },
                { id: 'q2', type: 'text', label: 'Full Name', required: true },
                { id: 'q3', type: 'date', label: 'Date of Birth', required: true },
                { id: 'q4', type: 'radio', label: 'Gender', required: true, options: ['Male', 'Female', 'Other'] },
                { id: 'q5', type: 'number', label: 'Household Size', required: true, validation: { min: 1, max: 50 } }
            ],
            created_at: '2019-11-20T00:22:00Z',
            updated_at: '2025-09-08T20:22:00Z'
        },
        {
            id: 3,
            title: 'Driver Record Book',
            description: 'Vehicle driver information and record keeping',
            questions: [
                { id: 'q1', type: 'text', label: 'Driver Name', required: true },
                { id: 'q2', type: 'text', label: 'License Number', required: true },
                { id: 'q3', type: 'date', label: 'License Expiry Date', required: true },
                { id: 'q4', type: 'text', label: 'Vehicle Registration', required: true },
                { id: 'q5', type: 'photo', label: 'Driver Photo', required: true },
                { id: 'q6', type: 'signature', label: 'Driver Signature', required: true }
            ],
            created_at: '2025-06-12T22:01:00Z',
            updated_at: '2025-06-12T23:50:00Z'
        },
        {
            id: 4,
            title: 'Public Service - Staff Performance Appraisal Survey',
            description: 'Annual performance evaluation for public service staff',
            questions: [
                { id: 'q1', type: 'section', label: 'Employee Information', description: 'Basic employee details' },
                { id: 'q2', type: 'text', label: 'Employee Name', required: true },
                { id: 'q3', type: 'text', label: 'Position/Title', required: true },
                { id: 'q4', type: 'radio', label: 'Job Knowledge', required: true, options: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'] },
                { id: 'q5', type: 'radio', label: 'Quality of Work', required: true, options: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement'] },
                { id: 'q6', type: 'textarea', label: 'Comments and Recommendations', required: false }
            ],
            created_at: '2025-03-22T02:06:00Z',
            updated_at: '2025-03-24T03:43:00Z'
        },
        {
            id: 5,
            title: 'Post Disaster Needs Assessment',
            description: 'Rapid assessment after natural disaster or emergency',
            questions: [
                { id: 'q1', type: 'section', label: 'Incident Information', description: 'Details about the disaster event' },
                { id: 'q2', type: 'date', label: 'Date of Incident', required: true },
                { id: 'q3', type: 'dropdown', label: 'Type of Disaster', required: true, options: ['Cyclone', 'Earthquake', 'Flood', 'Tsunami'] },
                { id: 'q4', type: 'text', label: 'Location/Area Affected', required: true },
                { id: 'q5', type: 'gps', label: 'GPS Coordinates', required: true },
                { id: 'q6', type: 'number', label: 'Estimated People Affected', required: true },
                { id: 'q7', type: 'checkbox', label: 'Urgent Needs', required: true, options: ['Food', 'Water', 'Shelter', 'Medical Care'] },
                { id: 'q8', type: 'photo', label: 'Damage Photo', required: false }
            ],
            created_at: '2020-05-15T22:16:00Z',
            updated_at: '2023-05-09T04:26:00Z'
        },
        {
            id: 6,
            title: 'Vanuatu National Agriculture Census 2022 -(PDNA) Household',
            description: 'Post-disaster national agriculture census household survey',
            questions: [
                { id: 'q1', type: 'text', label: 'Household ID', required: true },
                { id: 'q2', type: 'text', label: 'Household Head', required: true },
                { id: 'q3', type: 'gps', label: 'Household Location', required: true },
                { id: 'q4', type: 'number', label: 'Farm Size (hectares)', required: true },
                { id: 'q5', type: 'checkbox', label: 'Crops Affected', required: true, options: ['Coconut', 'Kava', 'Cocoa', 'Vegetables'] },
                { id: 'q6', type: 'radio', label: 'Severity of Damage', required: true, options: ['Total Loss', 'Severe', 'Moderate', 'Minor'] }
            ],
            created_at: '2023-04-17T04:44:00Z',
            updated_at: '2023-04-17T04:44:00Z'
        }
    ];
}
