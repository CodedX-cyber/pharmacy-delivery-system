const Database = require('../models/Database');

async function addCartTable() {
  try {
    await Database.connect();
    
    // Create cart_items table
    await Database.run(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        drug_id INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE,
        UNIQUE(user_id, drug_id)
      )
    `);

    console.log('✅ Cart items table created successfully');
    
    await Database.close();
  } catch (error) {
    console.error('Error creating cart table:', error);
    process.exit(1);
  }
}

addCartTable();
