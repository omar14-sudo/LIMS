// server/routes/tests.js
const express = require('express');
const db = require('../config/database');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Middleware للتحقق من التوثيق
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

// GET /api/tests — جلب كل التحاليل
router.get('/', auth, (req, res) => {
  db.all("SELECT id, name_ar, price, turnaround_hours, result_fields, created_at FROM tests ORDER BY name_ar", (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'فشل جلب التحاليل' });
    }
    res.json(rows);
  });
});

// GET /api/tests/:id — جلب تحليل معين
router.get('/:id', auth, (req, res) => {
  const testId = req.params.id;
  db.get("SELECT id, name_ar, price, turnaround_hours, result_fields, created_at FROM tests WHERE id = ?", [testId], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'فشل جلب بيانات التحليل' });
    }
    if (!row) {
      return res.status(404).json({ error: 'التحليل غير موجود' });
    }
    res.json(row);
  });
});

// POST /api/tests — إضافة تحليل جديد
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ error: 'غير مصرح لك بإضافة تحاليل' });
  }

  const { name_ar, name_en, price, turnaround_hours, result_fields } = req.body;

  // التحقق من البيانات
  if (!name_ar || !name_en || !price || !turnaround_hours) {
    return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
  }

  try {
    let resultFieldsJson = null;
    if (result_fields && result_fields.length > 0) {
      resultFieldsJson = JSON.stringify(result_fields);
    }

    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO tests (name_ar, price, turnaround_hours, result_fields) VALUES (?, ?, ?, ?)`,
        [name_ar, price, turnaround_hours, resultFieldsJson],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });

    res.json({ success: true, testId: result.id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'فشل إضافة التحليل' });
  }
});

// PUT /api/tests/:id — تعديل تحليل
router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ error: 'غير مصرح لك بتعديل تحاليل' });
  }

  const testId = req.params.id;
  const { name_ar, name_en, price, turnaround_hours, result_fields } = req.body;

  // التحقق من البيانات
  if (!name_ar || !name_en || !price || !turnaround_hours) {
    return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
  }

  try {
    // التحقق من وجود التحليل
    const existingTest = await new Promise((resolve, reject) => {
      db.get("SELECT id FROM tests WHERE id = ?", [testId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!existingTest) {
      return res.status(404).json({ error: 'التحليل غير موجود' });
    }

    let resultFieldsJson = null;
    if (result_fields && result_fields.length > 0) {
      resultFieldsJson = JSON.stringify(result_fields);
    }

    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE tests SET name_ar = ?, price = ?, turnaround_hours = ?, result_fields = ? WHERE id = ?`,
        [name_ar, price, turnaround_hours, resultFieldsJson, testId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'فشل تحديث التحليل' });
  }
});

// DELETE /api/tests/:id — حذف تحليل
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ error: 'غير مصرح لك بحذف تحاليل' });
  }

  const testId = req.params.id;

  try {
    // التحقق من وجود التحليل
    const existingTest = await new Promise((resolve, reject) => {
      db.get("SELECT id FROM tests WHERE id = ?", [testId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!existingTest) {
      return res.status(404).json({ error: 'التحليل غير موجود' });
    }

    // التحقق من عدم وجود عينات مرتبطة بهذا التحليل
    const samplesCount = await new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM samples WHERE test_type_id = ?", [testId], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    if (samplesCount > 0) {
      return res.status(400).json({ error: 'لا يمكن حذف هذا التحليل لأنه مرتبط بعينات موجودة' });
    }

    await new Promise((resolve, reject) => {
      db.run("DELETE FROM tests WHERE id = ?", [testId], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'فشل حذف التحليل' });
  }
});

module.exports = router;