const bcrypt = require('bcryptjs');
const database = require('./config/database');

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...');
    
    // Connect to database
    await database.connect();
    const db = database.getDb();
    
    // Check if admin user already exists
    const existingAdmin = await db.collection('users').findOne({ 
      email: 'admin@suchbliss.com' 
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('Email:', existingAdmin.email);
      console.log('Role:', existingAdmin.role);
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create admin user
    const adminUser = {
      name: 'Admin User',
      email: 'admin@suchbliss.com',
      phone: '+919863779900',
      password: hashedPassword,
      role: 'admin',
      plan: 'annually',
      status: 'active',
      phoneVerified: true,
      referralCode: 'ADMIN001',
      earnings: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insert admin user
    const result = await db.collection('users').insertOne(adminUser);
    
    console.log('✅ Admin user created successfully!');
    console.log('Admin ID:', result.insertedId);
    console.log('Email: admin@suchbliss.com');
    console.log('Password: admin123');
    console.log('Role: admin');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await database.disconnect();
    process.exit(0);
  }
}

// Run the script
createAdminUser();
