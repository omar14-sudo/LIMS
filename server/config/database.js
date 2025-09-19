// server/config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database connection
const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.message);
  } else {
    console.log('✅ Database connected successfully');
  }
});

// Create tables
db.serialize(() => {
  // Users table
  db.run(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT CHECK(role IN ('admin', 'manager', 'lab_technician', 'receptionist', 'accountant')) NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) {
        console.error('❌ Error creating users table:', err.message);
      } else {
        console.log('✅ Users table created or already exists');
      }
    }
  );

  // Tests table
  db.run(
    `CREATE TABLE IF NOT EXISTS tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_ar TEXT NOT NULL,
      name_en TEXT,
      price REAL NOT NULL,
      turnaround_hours INTEGER,
      result_fields TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) {
        console.error('❌ Error creating tests table:', err.message);
      } else {
        console.log('✅ Tests table created or already exists');
      }
    }
  );

  // Samples table
  db.run(
    `CREATE TABLE IF NOT EXISTS samples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_name TEXT NOT NULL,
      national_id TEXT,
      test_type_id INTEGER NOT NULL,
      collection_date DATETIME NOT NULL,
      status TEXT CHECK(status IN ('registered', 'in_progress', 'completed', 'cancelled')) DEFAULT 'registered',
      registered_by INTEGER,
      completed_by INTEGER,
      result_data TEXT,
      result_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (test_type_id) REFERENCES tests(id),
      FOREIGN KEY (registered_by) REFERENCES users(id),
      FOREIGN KEY (completed_by) REFERENCES users(id)
    )`,
    (err) => {
      if (err) {
        console.error('❌ Error creating samples table:', err.message);
      } else {
        console.log('✅ Samples table created or already exists');
      }
    }
  );

  // Notifications table
  db.run(
    `CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT CHECK(type IN ('info', 'warning', 'urgent', 'success')) DEFAULT 'info',
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    (err) => {
      if (err) {
        console.error('❌ Error creating notifications table:', err.message);
      } else {
        console.log('✅ Notifications table created or already exists');
      }
    }
  );

  

  // Insert admin user
  const adminCheck = db.prepare('SELECT id FROM users WHERE username = ?');
  adminCheck.get('admin', (err, row) => {
    if (err) {
      console.error('❌ Error checking admin user:', err.message);
      return;
    }
    if (!row) {
      const bcrypt = require('bcrypt');
      const saltRounds = 10;
      bcrypt.hash('123456', saltRounds, (err, hash) => {
        if (err) {
          console.error('❌ Error hashing password:', err.message);
          return;
        }
        db.run(
          `INSERT INTO users (username, password_hash, full_name, role) VALUES (?, ?, ?, ?)`,
          ['admin', hash, 'مدير النظام', 'admin'],
          (err) => {
            if (err) {
              console.error('❌ Error inserting admin user:', err.message);
            } else {
              console.log('✅ Created admin user: username=admin, password=123456');
            }
          }
        );
      });
    }
  });
  adminCheck.finalize();

  // Insert sample tests (comprehensive list)
  const testCheck = db.prepare('SELECT COUNT(*) as count FROM tests');
  testCheck.get((err, row) => {
    if (err) {
      console.error('❌ Error checking tests:', err.message);
      return;
    }
    if (row.count === 0) {
      const sampleTests = [
        // Blood Tests
        {
          name_ar: 'صورة دم كاملة',
          name_en: 'Complete Blood Count (CBC)',
          price: 80,
          turnaround_hours: 24,
          result_fields: JSON.stringify([
            { name: 'WBC', type: 'number', unit: 'x10³/µL' },
            { name: 'RBC', type: 'number', unit: 'x10⁶/µL' },
            { name: 'Hemoglobin', type: 'number', unit: 'g/dL' },
            { name: 'Hematocrit', type: 'number', unit: '%' },
            { name: 'Platelets', type: 'number', unit: 'x10³/µL' },
            { name: 'MCV', type: 'number', unit: 'fL' },
            { name: 'MCH', type: 'number', unit: 'pg' },
            { name: 'MCHC', type: 'number', unit: 'g/dL' },
            { name: 'RDW', type: 'number', unit: '%' }
          ])
        },
        {
          name_ar: 'سكر صيام',
          name_en: 'Fasting Blood Sugar (FBS)',
          price: 30,
          turnaround_hours: 2,
          result_fields: JSON.stringify([
            { name: 'Glucose', type: 'number', unit: 'mg/dL' }
          ])
        },
        {
          name_ar: 'سكر تراكمي',
          name_en: 'HbA1c Test',
          price: 100,
          turnaround_hours: 24,
          result_fields: JSON.stringify([
            { name: 'HbA1c', type: 'number', unit: '%' },
            { name: 'Estimated Average Glucose', type: 'number', unit: 'mg/dL' }
          ])
        },
        {
          name_ar: 'ملف الدهون',
          name_en: 'Lipid Profile',
          price: 90,
          turnaround_hours: 24,
          result_fields: JSON.stringify([
            { name: 'Total Cholesterol', type: 'number', unit: 'mg/dL' },
            { name: 'HDL', type: 'number', unit: 'mg/dL' },
            { name: 'LDL', type: 'number', unit: 'mg/dL' },
            { name: 'Triglycerides', type: 'number', unit: 'mg/dL' },
            { name: 'VLDL', type: 'number', unit: 'mg/dL' }
          ])
        },
        {
          name_ar: 'إلكتروليتات',
          name_en: 'Electrolytes Panel',
          price: 70,
          turnaround_hours: 12,
          result_fields: JSON.stringify([
            { name: 'Sodium (Na)', type: 'number', unit: 'mmol/L' },
            { name: 'Potassium (K)', type: 'number', unit: 'mmol/L' },
            { name: 'Chloride (Cl)', type: 'number', unit: 'mmol/L' },
            { name: 'Bicarbonate (HCO3)', type: 'number', unit: 'mmol/L' }
          ])
        },
        {
          name_ar: 'إنزيمات القلب',
          name_en: 'Cardiac Enzymes',
          price: 250,
          turnaround_hours: 6,
          result_fields: JSON.stringify([
            { name: 'Troponin I', type: 'number', unit: 'ng/mL' },
            { name: 'CK-MB', type: 'number', unit: 'U/L' },
            { name: 'Myoglobin', type: 'number', unit: 'ng/mL' }
          ])
        },
        {
          name_ar: 'مؤشرات التخثر',
          name_en: 'Coagulation Profile',
          price: 140,
          turnaround_hours: 24,
          result_fields: JSON.stringify([
            { name: 'PT', type: 'number', unit: 'seconds' },
            { name: 'PTT', type: 'number', unit: 'seconds' },
            { name: 'INR', type: 'number', unit: '' },
            { name: 'Fibrinogen', type: 'number', unit: 'mg/dL' }
          ])
        },
        // Organ Function Tests
        {
          name_ar: 'وظائف كبد',
          name_en: 'Liver Function Tests (LFT)',
          price: 120,
          turnaround_hours: 48,
          result_fields: JSON.stringify([
            { name: 'ALT', type: 'number', unit: 'U/L' },
            { name: 'AST', type: 'number', unit: 'U/L' },
            { name: 'Albumin', type: 'number', unit: 'g/dL' },
            { name: 'Total Bilirubin', type: 'number', unit: 'mg/dL' },
            { name: 'Direct Bilirubin', type: 'number', unit: 'mg/dL' },
            { name: 'ALP', type: 'number', unit: 'U/L' },
            { name: 'GGT', type: 'number', unit: 'U/L' }
          ])
        },
        {
          name_ar: 'وظائف كلى',
          name_en: 'Kidney Function Tests (KFT)',
          price: 150,
          turnaround_hours: 24,
          result_fields: JSON.stringify([
            { name: 'Creatinine', type: 'number', unit: 'mg/dL' },
            { name: 'Urea', type: 'number', unit: 'mg/dL' },
            { name: 'Uric Acid', type: 'number', unit: 'mg/dL' },
            { name: 'BUN', type: 'number', unit: 'mg/dL' },
            { name: 'Sodium', type: 'number', unit: 'mmol/L' },
            { name: 'Potassium', type: 'number', unit: 'mmol/L' }
          ])
        },
        {
          name_ar: 'أميلاز وليباز',
          name_en: 'Amylase and Lipase',
          price: 130,
          turnaround_hours: 12,
          result_fields: JSON.stringify([
            { name: 'Amylase', type: 'number', unit: 'U/L' },
            { name: 'Lipase', type: 'number', unit: 'U/L' }
          ])
        },
        // Hormone Tests
        {
          name_ar: 'هرمونات الغدة الدرقية',
          name_en: 'Thyroid Function Tests',
          price: 200,
          turnaround_hours: 72,
          result_fields: JSON.stringify([
            { name: 'TSH', type: 'number', unit: 'µIU/mL' },
            { name: 'T3', type: 'number', unit: 'ng/dL' },
            { name: 'T4', type: 'number', unit: 'µg/dL' },
            { name: 'Free T4', type: 'number', unit: 'ng/dL' },
            { name: 'Free T3', type: 'number', unit: 'pg/mL' }
          ])
        },
        {
          name_ar: 'كورتيزول',
          name_en: 'Cortisol',
          price: 160,
          turnaround_hours: 48,
          result_fields: JSON.stringify([
            { name: 'Cortisol', type: 'number', unit: 'µg/dL' }
          ])
        },
        {
          name_ar: 'تستوستيرون',
          name_en: 'Testosterone',
          price: 140,
          turnaround_hours: 48,
          result_fields: JSON.stringify([
            { name: 'Total Testosterone', type: 'number', unit: 'ng/dL' },
            { name: 'Free Testosterone', type: 'number', unit: 'pg/mL' }
          ])
        },
        {
          name_ar: 'هرمونات الإباضة',
          name_en: 'FSH and LH',
          price: 190,
          turnaround_hours: 48,
          result_fields: JSON.stringify([
            { name: 'FSH', type: 'number', unit: 'mIU/mL' },
            { name: 'LH', type: 'number', unit: 'mIU/mL' }
          ])
        },
        {
          name_ar: 'برولاكتين',
          name_en: 'Prolactin',
          price: 120,
          turnaround_hours: 48,
          result_fields: JSON.stringify([
            { name: 'Prolactin', type: 'number', unit: 'ng/mL' }
          ])
        },
        {
          name_ar: 'هرمون النمو',
          name_en: 'Growth Hormone (GH)',
          price: 220,
          turnaround_hours: 72,
          result_fields: JSON.stringify([
            { name: 'GH', type: 'number', unit: 'ng/mL' }
          ])
        },
        // Vitamins and Minerals
        {
          name_ar: 'فيتامين د',
          name_en: 'Vitamin D (25-OH)',
          price: 300,
          turnaround_hours: 48,
          result_fields: JSON.stringify([
            { name: '25-Hydroxy Vitamin D', type: 'number', unit: 'ng/mL' }
          ])
        },
        {
          name_ar: 'فيتامين ب12',
          name_en: 'Vitamin B12',
          price: 150,
          turnaround_hours: 48,
          result_fields: JSON.stringify([
            { name: 'Vitamin B12', type: 'number', unit: 'pg/mL' }
          ])
        },
        {
          name_ar: 'فيريتين',
          name_en: 'Ferritin',
          price: 120,
          turnaround_hours: 24,
          result_fields: JSON.stringify([
            { name: 'Ferritin', type: 'number', unit: 'ng/mL' }
          ])
        },
        {
          name_ar: 'حديد الدم',
          name_en: 'Serum Iron',
          price: 80,
          turnaround_hours: 24,
          result_fields: JSON.stringify([
            { name: 'Iron', type: 'number', unit: 'µg/dL' },
            { name: 'TIBC', type: 'number', unit: 'µg/dL' },
            { name: 'Transferrin Saturation', type: 'number', unit: '%' }
          ])
        },
        {
          name_ar: 'كالسيوم',
          name_en: 'Calcium',
          price: 60,
          turnaround_hours: 12,
          result_fields: JSON.stringify([
            { name: 'Total Calcium', type: 'number', unit: 'mg/dL' },
            { name: 'Ionized Calcium', type: 'number', unit: 'mmol/L' }
          ])
        },
        {
          name_ar: 'مغنيسيوم',
          name_en: 'Magnesium',
          price: 60,
          turnaround_hours: 12,
          result_fields: JSON.stringify([
            { name: 'Magnesium', type: 'number', unit: 'mg/dL' }
          ])
        },
        // Immunology and Infectious Diseases
        {
          name_ar: 'مستضد البروستاتا',
          name_en: 'Prostate Specific Antigen (PSA)',
          price: 200,
          turnaround_hours: 24,
          result_fields: JSON.stringify([
            { name: 'Total PSA', type: 'number', unit: 'ng/mL' },
            { name: 'Free PSA', type: 'number', unit: 'ng/mL' }
          ])
        },
        {
          name_ar: 'بروتين سي التفاعلي',
          name_en: 'C-Reactive Protein (CRP)',
          price: 80,
          turnaround_hours: 12,
          result_fields: JSON.stringify([
            { name: 'CRP', type: 'number', unit: 'mg/L' }
          ])
        },
        {
          name_ar: 'سرعة الترسيب',
          name_en: 'Erythrocyte Sedimentation Rate (ESR)',
          price: 40,
          turnaround_hours: 2,
          result_fields: JSON.stringify([
            { name: 'ESR', type: 'number', unit: 'mm/hr' }
          ])
        },
        {
          name_ar: 'فحص فيروس نقص المناعة',
          name_en: 'HIV Test',
          price: 250,
          turnaround_hours: 72,
          result_fields: JSON.stringify([
            { name: 'HIV Result', type: 'text', unit: '' },
            { name: 'Antibody Status', type: 'text', unit: '' }
          ])
        },
        {
          name_ar: 'فحص التهاب الكبد',
          name_en: 'Hepatitis Panel',
          price: 400,
          turnaround_hours: 48,
          result_fields: JSON.stringify([
            { name: 'HBsAg', type: 'text', unit: '' },
            { name: 'Anti-HCV', type: 'text', unit: '' },
            { name: 'HAV IgM', type: 'text', unit: '' },
            { name: 'HBV Core Ab', type: 'text', unit: '' }
          ])
        },
        {
          name_ar: 'عامل الروماتويد',
          name_en: 'Rheumatoid Factor (RF)',
          price: 110,
          turnaround_hours: 24,
          result_fields: JSON.stringify([
            { name: 'RF', type: 'number', unit: 'IU/mL' }
          ])
        },
        {
          name_ar: 'جسم مضاد نووي',
          name_en: 'Antinuclear Antibody (ANA)',
          price: 220,
          turnaround_hours: 48,
          result_fields: JSON.stringify([
            { name: 'ANA Titer', type: 'text', unit: '' },
            { name: 'Pattern', type: 'text', unit: '' }
          ])
        },
        {
          name_ar: 'فحص السل',
          name_en: 'Tuberculosis (TB) Test',
          price: 300,
          turnaround_hours: 72,
          result_fields: JSON.stringify([
            { name: 'TST Result', type: 'text', unit: '' },
            { name: 'Interferon-Gamma Release', type: 'text', unit: '' }
          ])
        },
        // Other Tests
        {
          name_ar: 'تحليل البول',
          name_en: 'Urine Analysis',
          price: 50,
          turnaround_hours: 24,
          result_fields: JSON.stringify([
            { name: 'Color', type: 'text', unit: '' },
            { name: 'Appearance', type: 'text', unit: '' },
            { name: 'pH', type: 'number', unit: '' },
            { name: 'Protein', type: 'text', unit: '' },
            { name: 'Glucose', type: 'text', unit: '' },
            { name: 'RBC', type: 'text', unit: '/HPF' },
            { name: 'WBC', type: 'text', unit: '/HPF' },
            { name: 'Specific Gravity', type: 'number', unit: '' },
            { name: 'Ketones', type: 'text', unit: '' }
          ])
        },
        {
          name_ar: 'تحليل البراز',
          name_en: 'Stool Analysis',
          price: 70,
          turnaround_hours: 48,
          result_fields: JSON.stringify([
            { name: 'Consistency', type: 'text', unit: '' },
            { name: 'Color', type: 'text', unit: '' },
            { name: 'Mucus', type: 'text', unit: '' },
            { name: 'Blood', type: 'text', unit: '' },
            { name: 'Parasites', type: 'text', unit: '' },
            { name: 'Occult Blood', type: 'text', unit: '' }
          ])
        },
        {
          name_ar: 'تحليل الحمل',
          name_en: 'Pregnancy Test (Beta HCG)',
          price: 60,
          turnaround_hours: 1,
          result_fields: JSON.stringify([
            { name: 'Result', type: 'text', unit: '' },
            { name: 'HCG Level', type: 'number', unit: 'mIU/mL' }
          ])
        },
        {
          name_ar: 'تحليل السائل المنوي',
          name_en: 'Semen Analysis',
          price: 180,
          turnaround_hours: 72,
          result_fields: JSON.stringify([
            { name: 'Volume', type: 'number', unit: 'mL' },
            { name: 'Sperm Count', type: 'number', unit: 'million/mL' },
            { name: 'Motility', type: 'number', unit: '%' },
            { name: 'Morphology', type: 'number', unit: '%' },
            { name: 'pH', type: 'number', unit: '' },
            { name: 'Liquefaction Time', type: 'number', unit: 'minutes' }
          ])
        },
        {
          name_ar: 'فصيلة الدم',
          name_en: 'Blood Group and Rh Factor',
          price: 50,
          turnaround_hours: 1,
          result_fields: JSON.stringify([
            { name: 'ABO Group', type: 'text', unit: '' },
            { name: 'Rh Factor', type: 'text', unit: '' }
          ])
        },
        {
          name_ar: 'نقص إنزيم G6PD',
          name_en: 'G6PD Deficiency Test',
          price: 180,
          turnaround_hours: 72,
          result_fields: JSON.stringify([
            { name: 'G6PD Activity', type: 'number', unit: 'U/g Hb' },
            { name: 'Result', type: 'text', unit: '' }
          ])
        },
        {
          name_ar: 'فحص الثلاسيميا',
          name_en: 'Thalassemia Screening',
          price: 250,
          turnaround_hours: 72,
          result_fields: JSON.stringify([
            { name: 'Hemoglobin Electrophoresis', type: 'text', unit: '' },
            { name: 'HbA2', type: 'number', unit: '%' },
            { name: 'HbF', type: 'number', unit: '%' }
          ])
        },
        {
          name_ar: 'فحص فقر الدم',
          name_en: 'Anemia Panel',
          price: 200,
          turnaround_hours: 24,
          result_fields: JSON.stringify([
            { name: 'Hemoglobin', type: 'number', unit: 'g/dL' },
            { name: 'Ferritin', type: 'number', unit: 'ng/mL' },
            { name: 'Iron', type: 'number', unit: 'µg/dL' },
            { name: 'TIBC', type: 'number', unit: 'µg/dL' }
          ])
        },
        {
          name_ar: 'فحص السكر العشوائي',
          name_en: 'Random Blood Sugar (RBS)',
          price: 35,
          turnaround_hours: 2,
          result_fields: JSON.stringify([
            { name: 'Glucose', type: 'number', unit: 'mg/dL' }
          ])
        },
        {
          name_ar: 'فحص الأجسام المضادة للغدة الدرقية',
          name_en: 'Thyroid Antibodies',
          price: 250,
          turnaround_hours: 72,
          result_fields: JSON.stringify([
            { name: 'Anti-TPO', type: 'number', unit: 'IU/mL' },
            { name: 'Anti-Thyroglobulin', type: 'number', unit: 'IU/mL' }
          ])
        },
        {
          name_ar: 'فحص الكلى الشامل',
          name_en: 'Comprehensive Kidney Profile',
          price: 220,
          turnaround_hours: 48,
          result_fields: JSON.stringify([
            { name: 'Creatinine', type: 'number', unit: 'mg/dL' },
            { name: 'Urea', type: 'number', unit: 'mg/dL' },
            { name: 'Uric Acid', type: 'number', unit: 'mg/dL' },
            { name: 'Albumin', type: 'number', unit: 'g/dL' },
            { name: 'Electrolytes', type: 'text', unit: '' }
          ])
        }
      ];

      sampleTests.forEach((test) => {
        db.run(
          `INSERT INTO tests (name_ar, name_en, price, turnaround_hours, result_fields) VALUES (?, ?, ?, ?, ?)`,
          [test.name_ar, test.name_en, test.price, test.turnaround_hours, test.result_fields],
          (err) => {
            if (err) {
              console.error(`❌ Error inserting test ${test.name_ar}:`, err.message);
            }
          }
        );
      });
      console.log(`✅ Inserted ${sampleTests.length} sample tests`);
    }
  });
  testCheck.finalize();
});

module.exports = db;