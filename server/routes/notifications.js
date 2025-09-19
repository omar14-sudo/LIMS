// server/routes/notifications.js
const express = require('express');
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const router = express.Router();

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

// GET /api/notifications — جلب كل الإشعارات
router.get('/', auth, (req, res) => {
  const userId = req.user.userId;
  
  db.all(`
    SELECT * FROM notifications 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `, [userId], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'فشل جلب الإشعارات' });
    }
    res.json(rows);
  });
});

// PUT /api/notifications/:id/read — تمييز إشعار كمقروء
router.put('/:id/read', auth, (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.userId;

  db.run(`
    UPDATE notifications 
    SET is_read = 1 
    WHERE id = ? AND user_id = ?
  `, [notificationId, userId], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'فشل تمييز الإشعار كمقروء' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'الإشعار غير موجود' });
    }
    res.json({ success: true });
  });
});

// PUT /api/notifications/read-all — تمييز كل الإشعارات كمقروءة
router.put('/read-all', auth, (req, res) => {
  const userId = req.user.userId;

  db.run(`
    UPDATE notifications 
    SET is_read = 1 
    WHERE user_id = ?
  `, [userId], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'فشل تمييز كل الإشعارات كمقروءة' });
    }
    res.json({ success: true });
  });
});

// DELETE /api/notifications/:id — حذف إشعار
router.delete('/:id', auth, (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.userId;

  db.run(`
    DELETE FROM notifications 
    WHERE id = ? AND user_id = ?
  `, [notificationId, userId], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'فشل حذف الإشعار' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'الإشعار غير موجود' });
    }
    res.json({ success: true });
  });
});

// DELETE /api/notifications/clear-all — مسح كل الإشعارات
router.delete('/clear-all', auth, (req, res) => {
  const userId = req.user.userId;

  db.run(`
    DELETE FROM notifications 
    WHERE user_id = ?
  `, [userId], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'فشل مسح كل الإشعارات' });
    }
    res.json({ success: true });
  });
});

module.exports = router;