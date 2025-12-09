#!/usr/bin/env node

require('dotenv').config();
const { Pool } = require('pg');

// Sample questionnaires based on the screenshot
const sampleQuestionnaires = [
    {
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
            { id: 'q8', type: 'radio', label: 'Farm Ownership', required: true, options: ['Owned', 'Leased', 'Shared', 'Communal'] },
            { id: 'q9', type: 'number', label: 'Number of Livestock', required: false, validation: { min: 0 } },
            { id: 'q10', type: 'photo', label: 'Farm Photo', required: false }
        ]
    },
    {
        title: 'Census 2020 - Vanuatu',
        description: 'National census survey for Vanuatu 2020',
        questions: [
            { id: 'q1', type: 'section', label: 'Demographics', description: 'Population and household demographics' },
            { id: 'q2', type: 'text', label: 'Full Name', required: true },
            { id: 'q3', type: 'date', label: 'Date of Birth', required: true },
            { id: 'q4', type: 'radio', label: 'Gender', required: true, options: ['Male', 'Female', 'Other'] },
            { id: 'q5', type: 'number', label: 'Household Size', required: true, validation: { min: 1, max: 50 } },
            { id: 'q6', type: 'dropdown', label: 'Province', required: true, options: ['Malampa', 'Penama', 'Sanma', 'Shefa', 'Tafea', 'Torba'] }
        ]
    },
    {
        title: 'Driver Record Book',
        description: 'Vehicle driver information and record keeping',
        questions: [
            { id: 'q1', type: 'text', label: 'Driver Name', required: true },
            { id: 'q2', type: 'text', label: 'License Number', required: true },
            { id: 'q3', type: 'date', label: 'License Expiry Date', required: true },
            { id: 'q4', type: 'text', label: 'Vehicle Registration', required: true },
            { id: 'q5', type: 'dropdown', label: 'Vehicle Type', required: true, options: ['Car', 'Truck', 'Motorcycle', 'Bus', 'Heavy Equipment'] },
            { id: 'q6', type: 'photo', label: 'Driver Photo', required: true },
            { id: 'q7', type: 'signature', label: 'Driver Signature', required: true }
        ]
    },
    {
        title: 'Public Service - Staff Performance Appraisal Survey',
        description: 'Annual performance evaluation for public service staff',
        questions: [
            { id: 'q1', type: 'section', label: 'Employee Information', description: 'Basic employee details' },
            { id: 'q2', type: 'text', label: 'Employee Name', required: true },
            { id: 'q3', type: 'text', label: 'Position/Title', required: true },
            { id: 'q4', type: 'text', label: 'Department', required: true },
            { id: 'q5', type: 'date', label: 'Review Period Start', required: true },
            { id: 'q6', type: 'date', label: 'Review Period End', required: true },
            { id: 'q7', type: 'section', label: 'Performance Ratings', description: 'Rate performance in key areas' },
            { id: 'q8', type: 'radio', label: 'Job Knowledge', required: true, options: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Unsatisfactory'] },
            { id: 'q9', type: 'radio', label: 'Quality of Work', required: true, options: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Unsatisfactory'] },
            { id: 'q10', type: 'radio', label: 'Communication Skills', required: true, options: ['Excellent', 'Good', 'Satisfactory', 'Needs Improvement', 'Unsatisfactory'] },
            { id: 'q11', type: 'textarea', label: 'Comments and Recommendations', required: false, validation: { maxLength: 2000 } },
            { id: 'q12', type: 'signature', label: 'Supervisor Signature', required: true }
        ]
    },
    {
        title: 'PSC Staff Performance Appraisal Survey',
        description: 'Public Service Commission staff evaluation form',
        questions: [
            { id: 'q1', type: 'text', label: 'Staff ID', required: true },
            { id: 'q2', type: 'text', label: 'Staff Name', required: true },
            { id: 'q3', type: 'date', label: 'Appraisal Date', required: true },
            { id: 'q4', type: 'radio', label: 'Overall Performance', required: true, options: ['Outstanding', 'Exceeds Expectations', 'Meets Expectations', 'Below Expectations', 'Unacceptable'] },
            { id: 'q5', type: 'textarea', label: 'Key Achievements', required: true, validation: { maxLength: 1000 } },
            { id: 'q6', type: 'textarea', label: 'Areas for Development', required: true, validation: { maxLength: 1000 } }
        ]
    },
    {
        title: 'Ministries_Departments_infor',
        description: 'Government ministries and departments information collection',
        questions: [
            { id: 'q1', type: 'text', label: 'Ministry/Department Name', required: true },
            { id: 'q2', type: 'text', label: 'Ministry Code', required: true },
            { id: 'q3', type: 'text', label: 'Head of Department', required: true },
            { id: 'q4', type: 'text', label: 'Contact Email', required: true },
            { id: 'q5', type: 'text', label: 'Contact Phone', required: true },
            { id: 'q6', type: 'number', label: 'Total Staff Count', required: true, validation: { min: 0 } },
            { id: 'q7', type: 'gps', label: 'Office Location', required: false }
        ]
    },
    {
        title: 'VAT Sales Monitoring Exercise',
        description: 'Value Added Tax sales monitoring and compliance',
        questions: [
            { id: 'q1', type: 'text', label: 'Business Name', required: true },
            { id: 'q2', type: 'text', label: 'VAT Registration Number', required: true },
            { id: 'q3', type: 'date', label: 'Monitoring Date', required: true },
            { id: 'q4', type: 'number', label: 'Total Sales Amount', required: true, validation: { min: 0 } },
            { id: 'q5', type: 'number', label: 'VAT Amount', required: true, validation: { min: 0 } },
            { id: 'q6', type: 'radio', label: 'Compliance Status', required: true, options: ['Compliant', 'Non-Compliant', 'Under Review'] },
            { id: 'q7', type: 'textarea', label: 'Observations', required: false }
        ]
    },
    {
        title: 'Lowanatom Profiling',
        description: 'Community profiling for Lowanatom area',
        questions: [
            { id: 'q1', type: 'text', label: 'Community Name', required: true },
            { id: 'q2', type: 'gps', label: 'Community Location', required: true },
            { id: 'q3', type: 'number', label: 'Population', required: true },
            { id: 'q4', type: 'number', label: 'Number of Households', required: true },
            { id: 'q5', type: 'checkbox', label: 'Available Services', required: true, options: ['School', 'Health Center', 'Water Supply', 'Electricity', 'Road Access', 'Market'] },
            { id: 'q6', type: 'photo', label: 'Community Photo', required: false }
        ]
    },
    {
        title: 'Post Disaster Needs Assessment',
        description: 'Rapid assessment after natural disaster or emergency',
        questions: [
            { id: 'q1', type: 'section', label: 'Incident Information', description: 'Details about the disaster event' },
            { id: 'q2', type: 'date', label: 'Date of Incident', required: true },
            { id: 'q3', type: 'dropdown', label: 'Type of Disaster', required: true, options: ['Cyclone', 'Earthquake', 'Flood', 'Tsunami', 'Volcanic Eruption', 'Drought', 'Other'] },
            { id: 'q4', type: 'text', label: 'Location/Area Affected', required: true },
            { id: 'q5', type: 'gps', label: 'GPS Coordinates', required: true },
            { id: 'q6', type: 'section', label: 'Impact Assessment', description: 'Assess the damage and needs' },
            { id: 'q7', type: 'number', label: 'Estimated People Affected', required: true },
            { id: 'q8', type: 'number', label: 'Households Damaged', required: true },
            { id: 'q9', type: 'checkbox', label: 'Urgent Needs', required: true, options: ['Food', 'Water', 'Shelter', 'Medical Care', 'Clothing', 'Sanitation'] },
            { id: 'q10', type: 'photo', label: 'Damage Photo 1', required: false },
            { id: 'q11', type: 'photo', label: 'Damage Photo 2', required: false },
            { id: 'q12', type: 'textarea', label: 'Additional Notes', required: false }
        ]
    },
    {
        title: 'Vanuatu National Agriculture Census 2022 -(PDNA) Household',
        description: 'Post-disaster national agriculture census household survey',
        questions: [
            { id: 'q1', type: 'text', label: 'Household ID', required: true },
            { id: 'q2', type: 'text', label: 'Household Head', required: true },
            { id: 'q3', type: 'gps', label: 'Household Location', required: true },
            { id: 'q4', type: 'number', label: 'Household Members', required: true },
            { id: 'q5', type: 'number', label: 'Farm Size (hectares)', required: true },
            { id: 'q6', type: 'checkbox', label: 'Crops Affected by Disaster', required: true, options: ['Coconut', 'Kava', 'Cocoa', 'Coffee', 'Vegetables', 'Root Crops', 'Fruits'] },
            { id: 'q7', type: 'radio', label: 'Severity of Damage', required: true, options: ['Total Loss', 'Severe (75-100%)', 'Moderate (50-75%)', 'Minor (25-50%)', 'Minimal (<25%)'] },
            { id: 'q8', type: 'textarea', label: 'Recovery Needs', required: true }
        ]
    }
];

async function seedQuestionnaires() {
    console.log('\n🌾 Seeding Sample Questionnaires\n');
    console.log('='.repeat(60));

    const pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'agriculture_db',
        password: process.env.DB_PASSWORD || 'postgres',
        port: process.env.DB_PORT || 5432,
    });

    try {
        console.log('🔄 Connecting to database...');
        await pool.query('SELECT NOW()');
        console.log('✅ Connected to database\n');

        // Check if admin user exists
        const userResult = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");

        if (userResult.rows.length === 0) {
            console.log('❌ No admin user found. Please run init-db.js first.');
            process.exit(1);
        }

        const adminId = userResult.rows[0].id;
        console.log(`📋 Using admin user: ${adminId}\n`);

        // Check existing questionnaires
        const existingResult = await pool.query('SELECT COUNT(*) FROM form_templates');
        const existingCount = parseInt(existingResult.rows[0].count);

        if (existingCount > 0) {
            console.log(`⚠️  Found ${existingCount} existing questionnaire(s).`);
            console.log('   Skipping seed to avoid duplicates.');
            console.log('   To re-seed, delete existing records first.\n');
            process.exit(0);
        }

        console.log('🔄 Inserting sample questionnaires...\n');

        for (const questionnaire of sampleQuestionnaires) {
            const result = await pool.query(
                `INSERT INTO form_templates (title, description, questions, created_by, published)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING id, title`,
                [
                    questionnaire.title,
                    questionnaire.description,
                    JSON.stringify(questionnaire.questions),
                    adminId,
                    false // Not published by default
                ]
            );

            console.log(`   ✅ Created: ${result.rows[0].title} (ID: ${result.rows[0].id})`);
        }

        console.log(`\n✅ Successfully created ${sampleQuestionnaires.length} questionnaires!`);
        console.log('\n📊 Summary:');

        const finalCount = await pool.query('SELECT COUNT(*) FROM form_templates');
        console.log(`   Total questionnaires in database: ${finalCount.rows[0].count}`);

        const publishedCount = await pool.query('SELECT COUNT(*) FROM form_templates WHERE published = true');
        console.log(`   Published: ${publishedCount.rows[0].count}`);
        console.log(`   Draft: ${parseInt(finalCount.rows[0].count) - parseInt(publishedCount.rows[0].count)}`);

        console.log('\n🚀 You can now access the Survey Designer at: http://localhost:3000/designer\n');

    } catch (error) {
        console.error('\n❌ Error seeding questionnaires:');
        console.error(error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run seeding
seedQuestionnaires().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
