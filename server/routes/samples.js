// server/routes/samples.js
const express = require('express');
const db = require('../config/database');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware للتحقق من التوثيق واستخراج بيانات المستخدم
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'غير مصرح بالدخول' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'التوثيق غير صالح' });
  }
}

// POST /api/samples — تسجيل عينة جديدة
router.post('/', auth, async (req, res) => {
  const { patientName, nationalId, testType, collectionDate } = req.body;

  // التحقق من البيانات
  if (!patientName || !testType || !collectionDate) {
    return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
  }

  try {
    // التحقق من وجود التحليل
    const testExists = await new Promise((resolve, reject) => {
      db.get("SELECT id FROM tests WHERE id = ?", [testType], (err, row) => {
        if (err) reject(err);
        else resolve(!!row);
      });
    });

    if (!testExists) {
      return res.status(400).json({ error: 'نوع التحليل غير موجود' });
    }

    // إدخال العينة في قاعدة البيانات
    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO samples (patient_name, national_id, test_type_id, collection_date, status, registered_by)
         VALUES (?, ?, ?, ?, 'registered', ?)`,
        [patientName, nationalId, testType, collectionDate, req.user.userId],
        function(err) {
          if (err) reject(err);
          else resolve({ sampleId: this.lastID });
        }
      );
    });

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'فشل تسجيل العينة' });
  }
  const notificationSql = `
  INSERT INTO notifications (user_id, title, message, type) 
  VALUES (?, ?, ?, ?)
`;

const notificationMessage = `تم تسجيل عينة جديدة #${result.sampleId} للمريض ${patientName}`;
db.run(notificationSql, [
  req.user.userId,
  'عينة جديدة',
  notificationMessage,
  'info'
]);
});

// GET /api/samples/pending — جلب العينات الجاهزة لإدخال نتائجها
router.get('/pending', auth, (req, res) => {
  db.all(`
    SELECT s.id, s.patient_name, s.collection_date, t.name_ar as test_name, t.id as test_type_id
    FROM samples s
    JOIN tests t ON s.test_type_id = t.id
    WHERE s.status = 'registered'
    ORDER BY s.collection_date DESC
  `, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'فشل جلب العينات' });
    }
    res.json(rows);
  });
});

// GET /api/samples/search — البحث عن العينات
router.get('/search', auth, (req, res) => {
  const { patientName, nationalId, sampleId, startDate, endDate } = req.query;

  let sql = `
    SELECT 
      s.*,
      t.name_ar as test_name
    FROM samples s
    JOIN tests t ON s.test_type_id = t.id
    WHERE 1=1
  `;
  let params = [];

  if (patientName) {
    sql += " AND s.patient_name LIKE ?";
    params.push(`%${patientName}%`);
  }

  if (nationalId) {
    sql += " AND s.national_id LIKE ?";
    params.push(`%${nationalId}%`);
  }

  if (sampleId) {
    sql += " AND s.id = ?";
    params.push(sampleId);
  }

  if (startDate) {
    sql += " AND DATE(s.collection_date) >= ?";
    params.push(startDate);
  }

  if (endDate) {
    sql += " AND DATE(s.collection_date) <= ?";
    params.push(endDate);
  }

  sql += " ORDER BY s.created_at DESC";

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'فشل البحث عن العينات' });
    }
    res.json(rows);
  });
});
// GET /api/samples/count — عدّ العينات حسب التاريخ
router.get('/count', auth, (req, res) => {
  const { date } = req.query;
  
  let sql = "SELECT COUNT(*) as count FROM samples WHERE DATE(created_at) = ?";
  let params = [date];

  if (!date) {
    sql = "SELECT COUNT(*) as count FROM samples";
    params = [];
  }

  db.get(sql, params, (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'فشل جلب عدد العينات' });
    }
    res.json({ count: row.count });
  });
});

// GET /api/samples/:id — جلب بيانات عينة معينة
router.get('/:id', auth, (req, res) => {
  const sampleId = req.params.id;
  db.get(`
    SELECT s.*, t.name_ar as test_name
    FROM samples s
    JOIN tests t ON s.test_type_id = t.id
    WHERE s.id = ?
  `, [sampleId], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'فشل جلب بيانات العينة' });
    }
    if (!row) {
      return res.status(404).json({ error: 'العينة غير موجودة' });
    }
    res.json(row);
  });
});

// PUT /api/samples/:id/result — حفظ نتيجة العينة
router.put('/:id/result', auth, (req, res) => {
  const sampleId = req.params.id;
  const { result_data } = req.body;

  if (!result_data) {
    return res.status(400).json({ error: 'بيانات النتيجة مطلوبة' });
  }

  try {
    const resultJson = JSON.stringify(result_data);

    db.run(`
      UPDATE samples 
      SET result_data = ?, 
          result_date = CURRENT_TIMESTAMP, 
          status = 'completed', 
          completed_by = ?
      WHERE id = ? AND status = 'registered'
    `, [resultJson, req.user.userId, sampleId], function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'فشل حفظ النتيجة' });
      }
      if (this.changes === 0) {
        return res.status(400).json({ error: 'العينة غير موجودة أو تم إدخال نتيجتها مسبقًا' });
      }
      res.json({ success: true });
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'خطأ في معالجة بيانات النتيجة' });
  }
  // إنشاء إشعار للمستخدم
const notificationSql = `
  INSERT INTO notifications (user_id, title, message, type) 
  VALUES (?, ?, ?, ?)
`;

const notificationMessage = `تم إدخال نتيجة العينة #${sampleId} بنجاح`;
db.run(notificationSql, [
  req.user.userId,
  'نتيجة مدخلة',
  notificationMessage,
  'success'
]);
});


// GET /api/samples/pending/count — عدّ العينات المعلقة
router.get('/pending/count', auth, (req, res) => {
  db.get("SELECT COUNT(*) as count FROM samples WHERE status = 'registered'", (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'فشل جلب عدد العينات المعلقة' });
    }
    res.json({ count: row.count });
  });
});



module.exports = router;