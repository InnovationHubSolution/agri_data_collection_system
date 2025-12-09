#!/usr/bin/env node

require('dotenv').config();
const { Pool } = require('pg');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function initDatabase() {
    console.log('\n🌾 Agriculture Data System - Database Initialization\n');
    console.log('='.repeat(60));
    
    // Get database configuration
    console.log('\n📋 Current Configuration (from .env):');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.DB_PORT || '5432'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'agriculture_db'}`);
    console.log(`   User: ${process.env.DB_USER || 'postgres'}`);
    
    const proceed = await question('\nProceed with this configuration? (yes/no): ');
    
    if (proceed.toLowerCase() !== 'yes' && proceed.toLowerCase() !== 'y') {
        console.log('❌ Aborted. Please update your .env file and try again.');
        rl.close();
        process.exit(0);
    }

    // Connect to PostgreSQL
    const pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'agriculture_db',
        password: process.env.DB_PASSWORD || 'postgres',
        port: process.env.DB_PORT || 5432,
    });

    try {
        console.log('\n🔄 Testing database connection...');
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful');

        console.log('\n🔄 Initializing database schema...');
        
        // Import and run initialization
        const { initializeDatabase } = require('./database');
        await initializeDatabase();
        
        console.log('✅ Database schema created successfully');

        console.log('\n🔄 Checking for existing users...');
        const userCheck = await pool.query('SELECT COUNT(*) FROM users');
        const userCount = parseInt(userCheck.rows[0].count);
        
        if (userCount === 0) {
            console.log('👤 No users found. Creating default admin user...');
            
            const bcrypt = require('bcrypt');
            const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123456';
            const hashedPassword = await bcrypt.hash(defaultPassword, 12);
            
            await pool.query(`
                INSERT INTO users (id, username, password, role, full_name, email, active)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                'admin-001',
                process.env.DEFAULT_ADMIN_USERNAME || 'admin',
                hashedPassword,
                'admin',
                'System Administrator',
                process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
                true
            ]);
            
            console.log('✅ Default admin user created');
            console.log(`   Username: ${process.env.DEFAULT_ADMIN_USERNAME || 'admin'}`);
            console.log(`   Password: ${defaultPassword}`);
            console.log('\n⚠️  WARNING: Please change the default password after first login!');
        } else {
            console.log(`✅ Found ${userCount} existing user(s)`);
        }

        console.log('\n📊 Database Statistics:');
        const tables = ['users', 'surveys', 'form_templates', 'sync_logs', 'settings'];
        
        for (const table of tables) {
            try {
                const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`   ${table}: ${result.rows[0].count} records`);
            } catch (error) {
                console.log(`   ${table}: table not found or error`);
            }
        }

        console.log('\n✅ Database initialization completed successfully!');
        console.log('\n🚀 You can now start the server with: npm run server:postgres\n');

    } catch (error) {
        console.error('\n❌ Database initialization failed:');
        console.error(error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Troubleshooting:');
            console.log('   1. Make sure PostgreSQL is running');
            console.log('   2. Check your database credentials in .env file');
            console.log('   3. Verify the database exists (or create it manually)');
        } else if (error.code === '3D000') {
            console.log('\n💡 Database does not exist. Please create it:');
            console.log(`   psql -U ${process.env.DB_USER || 'postgres'} -c "CREATE DATABASE ${process.env.DB_NAME || 'agriculture_db'};"`);
        }
        
        process.exit(1);
    } finally {
        await pool.end();
        rl.close();
    }
}

// Run initialization
initDatabase().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
