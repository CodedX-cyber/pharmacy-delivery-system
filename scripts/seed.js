const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database for seeding');
});

const sampleDrugs = [
  { name: 'Paracetamol 500mg', description: 'Pain reliever and fever reducer', price: 15.99, stock_quantity: 100, requires_prescription: false, image_url: 'https://via.placeholder.com/200x200/4CAF50/FFFFFF?text=Paracetamol' },
  { name: 'Amoxicillin 500mg', description: 'Antibiotic for bacterial infections', price: 45.50, stock_quantity: 50, requires_prescription: true, image_url: 'https://via.placeholder.com/200x200/2196F3/FFFFFF?text=Amoxicillin' },
  { name: 'Ibuprofen 400mg', description: 'Anti-inflammatory pain medication', price: 18.75, stock_quantity: 75, requires_prescription: false, image_url: 'https://via.placeholder.com/200x200/FF9800/FFFFFF?text=Ibuprofen' },
  { name: 'Cetirizine 10mg', description: 'Antihistamine for allergies', price: 22.30, stock_quantity: 60, requires_prescription: false, image_url: 'https://via.placeholder.com/200x200/9C27B0/FFFFFF?text=Cetirizine' },
  { name: 'Metformin 500mg', description: 'Diabetes medication', price: 35.20, stock_quantity: 40, requires_prescription: true, image_url: 'https://via.placeholder.com/200x200/E91E63/FFFFFF?text=Metformin' },
  { name: 'Lisinopril 10mg', description: 'Blood pressure medication', price: 28.90, stock_quantity: 55, requires_prescription: true, image_url: 'https://via.placeholder.com/200x200/00BCD4/FFFFFF?text=Lisinopril' },
  { name: 'Omeprazole 20mg', description: 'Acid reflux medication', price: 32.45, stock_quantity: 45, requires_prescription: false, image_url: 'https://via.placeholder.com/200x200/795548/FFFFFF?text=Omeprazole' },
  { name: 'Simvastatin 20mg', description: 'Cholesterol medication', price: 41.80, stock_quantity: 35, requires_prescription: true, image_url: 'https://via.placeholder.com/200x200/607D8B/FFFFFF?text=Simvastatin' },
  { name: 'Aspirin 75mg', description: 'Blood thinner and pain reliever', price: 12.99, stock_quantity: 120, requires_prescription: false, image_url: 'https://via.placeholder.com/200x200/FF5722/FFFFFF?text=Aspirin' },
  { name: 'Azithromycin 250mg', description: 'Antibiotic for infections', price: 52.30, stock_quantity: 30, requires_prescription: true, image_url: 'https://via.placeholder.com/200x200/3F51B5/FFFFFF?text=Azithromycin' },
  { name: 'Vitamin D3 1000IU', description: 'Vitamin D supplement', price: 16.50, stock_quantity: 200, requires_prescription: false, image_url: 'https://via.placeholder.com/200x200/FFC107/000000?text=Vitamin+D3' },
  { name: 'Prednisone 5mg', description: 'Steroid medication', price: 38.75, stock_quantity: 25, requires_prescription: true, image_url: 'https://via.placeholder.com/200x200/8BC34A/FFFFFF?text=Prednisone' },
  { name: 'Gabapentin 300mg', description: 'Nerve pain medication', price: 44.20, stock_quantity: 40, requires_prescription: true, image_url: 'https://via.placeholder.com/200x200/FFEB3B/000000?text=Gabapentin' },
  { name: 'Hydrochlorothiazide 25mg', description: 'Diuretic for blood pressure', price: 19.99, stock_quantity: 65, requires_prescription: true, image_url: 'https://via.placeholder.com/200x200/009688/FFFFFF?text=HCTZ' },
  { name: 'Vitamin C 500mg', description: 'Vitamin C supplement', price: 14.25, stock_quantity: 150, requires_prescription: false, image_url: 'https://via.placeholder.com/200x200/F44336/FFFFFF?text=Vitamin+C' },
  { name: 'Albuterol Inhaler', description: 'Asthma inhaler', price: 28.50, stock_quantity: 20, requires_prescription: true, image_url: 'https://via.placeholder.com/200x200/9E9E9E/FFFFFF?text=Albuterol' },
  { name: 'Warfarin 5mg', description: 'Blood thinner', price: 36.80, stock_quantity: 30, requires_prescription: true, image_url: 'https://via.placeholder.com/200x200/673AB7/FFFFFF?text=Warfarin' },
  { name: 'Calcium Carbonate 500mg', description: 'Calcium supplement', price: 13.45, stock_quantity: 180, requires_prescription: false, image_url: 'https://via.placeholder.com/200x200/CDDC39/000000?text=Calcium' },
  { name: 'Levothyroxine 50mcg', description: 'Thyroid medication', price: 42.60, stock_quantity: 35, requires_prescription: true, image_url: 'https://via.placeholder.com/200x200/FF6F00/FFFFFF?text=Levothyroxine' },
  { name: 'Multivitamin', description: 'Daily multivitamin supplement', price: 24.99, stock_quantity: 90, requires_prescription: false, image_url: 'https://via.placeholder.com/200x200/4CAF50/FFFFFF?text=MultiVitamin' }
];

const adminUser = {
  email: 'admin@pharmacy.com',
  password: 'admin123',
  name: 'Admin User',
  role: 'admin'
};

async function seedDatabase() {
  try {
    // Clear existing data
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM drugs', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      db.run('DELETE FROM admins', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Insert sample drugs
    for (const drug of sampleDrugs) {
      await new Promise((resolve, reject) => {
        const stmt = db.prepare(`
          INSERT INTO drugs (name, description, price, stock_quantity, image_url, requires_prescription)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run([
          drug.name,
          drug.description,
          drug.price,
          drug.stock_quantity,
          drug.image_url,
          drug.requires_prescription
        ], function(err) {
          if (err) reject(err);
          else {
            console.log(`Drug inserted: ${drug.name}`);
            resolve();
          }
        });
        stmt.finalize();
      });
    }

    // Insert admin user
    const hashedPassword = await bcrypt.hash(adminUser.password, 10);
    await new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO admins (email, password_hash, name, role)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run([
        adminUser.email,
        hashedPassword,
        adminUser.name,
        adminUser.role
      ], function(err) {
        if (err) reject(err);
        else {
          console.log(`Admin inserted: ${adminUser.email}`);
          resolve();
        }
      });
      stmt.finalize();
    });

    console.log('Database seeded successfully!');
    console.log(`Inserted ${sampleDrugs.length} drugs`);
    console.log(`Created admin: ${adminUser.email} / ${adminUser.password}`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
        process.exit(1);
      }
      console.log('Database connection closed');
      process.exit(0);
    });
  }
}

seedDatabase();
