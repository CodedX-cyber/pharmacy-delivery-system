const Database = require('./models/Database');

async function testDatabaseTables() {
  try {
    console.log('🔍 Testing Database Tables...');
    console.log('=====================================');
    
    // Connect to database
    await Database.connect();
    console.log('✅ Database connected');
    
    // Test 1: Check if medical_reports table exists
    console.log('\n📋 Checking medical_reports table...');
    const tableCheck = await Database.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='medical_reports'
    `);
    
    if (tableCheck) {
      console.log('✅ medical_reports table exists');
      
      // Test 2: Get table schema
      const schema = await Database.all(`PRAGMA table_info(medical_reports)`);
      console.log('📊 medical_reports table schema:');
      schema.forEach(col => {
        console.log(`  - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
      });
      
      // Test 3: Count records
      const countResult = await Database.get('SELECT COUNT(*) as count FROM medical_reports');
      console.log(`📈 Records in medical_reports: ${countResult.count}`);
      
      // Test 4: Try to fetch records
      if (countResult.count > 0) {
        const records = await Database.all('SELECT * FROM medical_reports LIMIT 3');
        console.log('📄 Sample records:');
        records.forEach((record, index) => {
          console.log(`  Record ${index + 1}: ID=${record.id}, Title="${record.title}", User=${record.user_id}, Doctor=${record.doctor_id}`);
        });
      }
      
    } else {
      console.log('❌ medical_reports table does NOT exist');
    }
    
    // Test 5: Check doctors table
    console.log('\n👨‍⚕️ Checking doctors table...');
    const doctorsTableCheck = await Database.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='doctors'
    `);
    
    if (doctorsTableCheck) {
      const doctorCount = await Database.get('SELECT COUNT(*) as count FROM doctors');
      console.log(`✅ doctors table exists with ${doctorCount.count} records`);
    } else {
      console.log('❌ doctors table does NOT exist');
    }
    
    // Test 6: Check users table
    console.log('\n👤 Checking users table...');
    const usersTableCheck = await Database.get(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='users'
    `);
    
    if (usersTableCheck) {
      const userCount = await Database.get('SELECT COUNT(*) as count FROM users');
      console.log(`✅ users table exists with ${userCount.count} records`);
    } else {
      console.log('❌ users table does NOT exist');
    }
    
    // Test 7: List all tables
    console.log('\n📚 All tables in database:');
    const allTables = await Database.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `);
    
    allTables.forEach(table => {
      console.log(`  - ${table.name}`);
    });
    
    console.log('\n=====================================');
    console.log('🎉 Database test completed');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    console.error('Error details:', error.message);
  } finally {
    // Close database connection if needed
    process.exit(0);
  }
}

testDatabaseTables();
