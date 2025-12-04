const Database = require('../models/Database');
const bcrypt = require('bcryptjs');

async function createDemoData() {
  try {
    await Database.connect();
    console.log('🎬 Creating Demo Data for Pharmacy System...');
    console.log('==========================================');

    // 1. Create Demo Users
    console.log('👥 Creating Demo Users...');
    
    // Demo User
    const demoUserPassword = await bcrypt.hash('password123', 10);
    await Database.run(`
      INSERT OR IGNORE INTO users (email, password_hash, name, phone, address) 
      VALUES (?, ?, ?, ?, ?)
    `, [
      'demo@user.com',
      demoUserPassword,
      'Demo User',
      '+1234567890',
      '123 Demo Street, Demo City, DC 12345'
    ]);

    // Additional test users
    const testUsers = [
      ['john.doe@email.com', 'John Doe', '+1987654321', '456 Oak Avenue, Springfield'],
      ['jane.smith@email.com', 'Jane Smith', '+1122334455', '789 Pine Road, Riverside'],
      ['mike.wilson@email.com', 'Mike Wilson', '+1555666777', '321 Elm Street, Greenville']
    ];

    for (const [email, name, phone, address] of testUsers) {
      const password = await bcrypt.hash('password123', 10);
      await Database.run(`
        INSERT OR IGNORE INTO users (email, password_hash, name, phone, address) 
        VALUES (?, ?, ?, ?, ?)
      `, [email, password, name, phone, address]);
    }

    console.log('✅ Demo users created');

    // 2. Create Demo Admin (if not exists)
    console.log('🔐 Creating Demo Admin...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    await Database.run(`
      INSERT OR IGNORE INTO admins (email, password_hash, name) 
      VALUES (?, ?, ?)
    `, [
      'admin@pharmacy.com',
      adminPassword,
      'Pharmacy Administrator'
    ]);

    console.log('✅ Demo admin created');

    // 3. Create Demo Orders with various statuses
    console.log('📦 Creating Demo Orders...');
    
    // Get user IDs for demo orders
    const users = await Database.all('SELECT id, name FROM users LIMIT 5');
    
    const demoOrders = [
      {
        user_id: users[0]?.id || 1,
        status: 'delivered',
        total_amount: 89.97,
        delivery_address: '123 Demo Street, Demo City, DC 12345',
        payment_method: 'cash',
        items: [
          { drug_id: 1, quantity: 2, price_at_purchase: 15.99 },
          { drug_id: 3, quantity: 1, price_at_purchase: 18.75 },
          { drug_id: 15, quantity: 1, price_at_purchase: 14.25 }
        ]
      },
      {
        user_id: users[1]?.id || 2,
        status: 'processing',
        total_amount: 124.45,
        delivery_address: '456 Oak Avenue, Springfield',
        payment_method: 'card',
        items: [
          { drug_id: 2, quantity: 1, price_at_purchase: 45.50 },
          { drug_id: 6, quantity: 1, price_at_purchase: 28.90 },
          { drug_id: 8, quantity: 1, price_at_purchase: 41.80 },
          { drug_id: 20, quantity: 1, price_at_purchase: 8.25 }
        ]
      },
      {
        user_id: users[2]?.id || 3,
        status: 'out_for_delivery',
        total_amount: 67.40,
        delivery_address: '789 Pine Road, Riverside',
        payment_method: 'cash',
        items: [
          { drug_id: 4, quantity: 2, price_at_purchase: 22.30 },
          { drug_id: 7, quantity: 1, price_at_purchase: 32.45 },
          { drug_id: 11, quantity: 1, price_at_purchase: 16.50 }
        ]
      },
      {
        user_id: users[3]?.id || 4,
        status: 'pending',
        total_amount: 95.25,
        delivery_address: '321 Elm Street, Greenville',
        payment_method: 'cash',
        items: [
          { drug_id: 5, quantity: 1, price_at_purchase: 35.20 },
          { drug_id: 12, quantity: 1, price_at_purchase: 38.75 },
          { drug_id: 14, quantity: 1, price_at_purchase: 19.99 },
          { drug_id: 1, quantity: 1, price_at_purchase: 15.99 }
        ]
      },
      {
        user_id: users[0]?.id || 1,
        status: 'cancelled',
        total_amount: 52.30,
        delivery_address: '123 Demo Street, Demo City, DC 12345',
        payment_method: 'card',
        items: [
          { drug_id: 9, quantity: 2, price_at_purchase: 12.99 },
          { drug_id: 10, quantity: 1, price_at_purchase: 26.32 }
        ]
      }
    ];

    for (const order of demoOrders) {
      // Create order
      const orderResult = await Database.run(`
        INSERT INTO orders (user_id, status, total_amount, delivery_address, payment_method, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now', '-${Math.floor(Math.random() * 7)} days'), datetime('now', '-${Math.floor(Math.random() * 7)} days'))
      `, [order.user_id, order.status, order.total_amount, order.delivery_address, order.payment_method]);

      const orderId = orderResult.id;

      // Create order items
      for (const item of order.items) {
        await Database.run(`
          INSERT INTO order_items (order_id, drug_id, quantity, price_at_purchase)
          VALUES (?, ?, ?, ?)
        `, [orderId, item.drug_id, item.quantity, item.price_at_purchase]);
      }
    }

    console.log('✅ Demo orders created');

    // 4. Create Demo Prescriptions (for orders that require them)
    console.log('📋 Creating Demo Prescriptions...');
    
    const prescriptionOrders = await Database.all(`
      SELECT o.id, o.user_id FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN drugs d ON oi.drug_id = d.id
      WHERE d.requires_prescription = 1 AND o.status != 'cancelled'
      GROUP BY o.id
      LIMIT 3
    `);

    for (const order of prescriptionOrders) {
      await Database.run(`
        INSERT INTO prescriptions (order_id, image_url, uploaded_at)
        VALUES (?, ?, datetime('now', '-${Math.floor(Math.random() * 3)} days'))
      `, [order.id, '/uploads/demo-prescription.jpg']);
    }

    console.log('✅ Demo prescriptions created');

    // 5. Update drug stock based on demo orders
    console.log('📊 Updating Drug Stock...');
    
    const orderItems = await Database.all(`
      SELECT drug_id, SUM(quantity) as total_ordered FROM order_items
      GROUP BY drug_id
    `);

    for (const item of orderItems) {
      await Database.run(`
        UPDATE drugs SET stock_quantity = stock_quantity - ?
        WHERE id = ? AND stock_quantity > ?
      `, [item.total_ordered, item.drug_id, item.total_ordered]);
    }

    console.log('✅ Drug stock updated');

    // 6. Display Demo Credentials
    console.log('==========================================');
    console.log('🎉 Demo Data Created Successfully!');
    console.log('');
    console.log('📱 Demo User Credentials:');
    console.log('   Email: demo@user.com');
    console.log('   Password: password123');
    console.log('');
    console.log('🔐 Admin Credentials:');
    console.log('   Email: admin@pharmacy.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('📊 Demo Data Summary:');
    console.log(`   Users: ${users.length} created`);
    console.log(`   Orders: ${demoOrders.length} created with various statuses`);
    console.log(`   Prescriptions: ${prescriptionOrders.length} created`);
    console.log('');
    console.log('📋 Order Statuses Created:');
    console.log('   - Delivered: 1 order');
    console.log('   - Processing: 1 order');
    console.log('   - Out for Delivery: 1 order');
    console.log('   - Pending: 1 order');
    console.log('   - Cancelled: 1 order');
    console.log('');
    console.log('🚀 Ready for Demo!');

    await Database.close();
  } catch (error) {
    console.error('Error creating demo data:', error);
    process.exit(1);
  }
}

createDemoData();
