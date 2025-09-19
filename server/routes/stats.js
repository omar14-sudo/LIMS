// server/routes/stats.js
const express = require('express');
const db = require('../config/database');

const router = express.Router();

// GET /api/samples/count — عدّ العينات حسب التاريخ
router.get('/count', (req, res) => {
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

// GET /api/samples/pending/count — عدّ العينات المعلقة
router.get('/pending/count', (req, res) => {
  db.get("SELECT COUNT(*) as count FROM samples WHERE status = 'registered'", (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'فشل جلب عدد العينات المعلقة' });
    }
    res.json({ count: row.count });
  });
});

// GET /api/users/count — عدّ المستخدمين
router.get('/users/count', (req, res) => {
  db.get("SELECT COUNT(*) as count FROM users WHERE is_active = 1", (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'فشل جلب عدد المستخدمين' });
    }
    res.json({ count: row.count });
  });
});

module.exports = router;