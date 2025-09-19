// server/routes/users.js
const express = require('express');
const db = require('../config/database');
const bcrypt = require('bcrypt');
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

// GET /api/users — جلب كل المستخدمين
router.get('/', auth, (req, res) => {
  // التحقق من أن المستخدم لديه صلاحية (فقط الأدمن والمانجر)
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ error: 'غير مصرح لك بعرض هذه الصفحة' });
  }

  db.all("SELECT id, username, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'فشل جلب قائمة المستخدمين' });
    }
    res.json(rows);
  });
});
// GET /api/users/count — عدّ المستخدمين (استخدمناه في الداشبورد)
router.get('/count', (req, res) => {
  db.get("SELECT COUNT(*) as count FROM users WHERE is_active = 1", (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'فشل جلب عدد المستخدمين' });
    }
    res.json({ count: row.count });
  });
});
// GET /api/users/:id — جلب مستخدم معين
router.get('/:id', auth, (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ error: 'غير مصرح لك بعرض هذه الصفحة' });
  }

  const userId = req.params.id;
  db.get("SELECT id, username, full_name, role, is_active, created_at FROM users WHERE id = ?", [userId], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'فشل جلب بيانات المستخدم' });
    }
    if (!row) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    res.json(row);
  });
});

// POST /api/users — إضافة مستخدم جديد
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'فقط مدير النظام يمكنه إضافة مستخدمين' });
  }

  const { username, fullName, password, role, isActive } = req.body;

  // التحقق من البيانات
  if (!username || !fullName || !password || !role) {
    return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
  }

  try {
    // التحقق من عدم وجود اسم مستخدم مكرر
    const existingUser = await new Promise((resolve, reject) => {
      db.get("SELECT id FROM users WHERE username = ?", [username], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingUser) {
      return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
    }

    // تشفير كلمة المرور
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // إدخال المستخدم في قاعدة البيانات
    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (username, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, ?)`,
        [username, passwordHash, fullName, role, isActive !== undefined ? isActive : 1],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });

    res.json({ success: true, userId: result.id });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'فشل إضافة المستخدم' });
  }
});

// PUT /api/users/:id — تعديل مستخدم
router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'فقط مدير النظام يمكنه تعديل المستخدمين' });
  }

  const userId = req.params.id;
  const { username, fullName, password, role, isActive } = req.body;

  // التحقق من البيانات
  if (!username || !fullName || !role) {
    return res.status(400).json({ error: 'جميع الحقول مطلوبة' });
  }

  try {
    // التحقق من وجود المستخدم
    const existingUser = await new Promise((resolve, reject) => {
      db.get("SELECT id FROM users WHERE id = ?", [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // التحقق من عدم تكرار اسم المستخدم (لو اتغير)
    if (username !== existingUser.username) {
      const duplicateUser = await new Promise((resolve, reject) => {
        db.get("SELECT id FROM users WHERE username = ? AND id != ?", [username, userId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (duplicateUser) {
        return res.status(400).json({ error: 'اسم المستخدم موجود بالفعل' });
      }
    }

    let updateFields = [];
    let updateValues = [];

    updateFields.push("username = ?");
    updateValues.push(username);

    updateFields.push("full_name = ?");
    updateValues.push(fullName);

    updateFields.push("role = ?");
    updateValues.push(role);

    if (isActive !== undefined) {
      updateFields.push("is_active = ?");
      updateValues.push(isActive ? 1 : 0);
    }

    // إذا تم توفير كلمة مرور جديدة
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updateFields.push("password_hash = ?");
      updateValues.push(passwordHash);
    }

    updateValues.push(userId); // للـ WHERE

    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

    await new Promise((resolve, reject) => {
      db.run(sql, updateValues, function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'فشل تحديث المستخدم' });
  }
});

// PUT /api/users/:id/toggle — تفعيل/تعطيل مستخدم
router.put('/:id/toggle', auth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'فقط مدير النظام يمكنه تفعيل/تعطيل المستخدمين' });
  }

  const userId = req.params.id;
  const { is_active } = req.body;

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'يجب تحديد حالة الحساب (true/false)' });
  }

  db.run("UPDATE users SET is_active = ? WHERE id = ?", [is_active ? 1 : 0, userId], function(err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'فشل تغيير حالة المستخدم' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    res.json({ success: true });
  });
});

// DELETE /api/users/:id — حذف مستخدم
router.delete('/:id', auth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'فقط مدير النظام يمكنه حذف المستخدمين' });
  }

  const userId = req.params.id;

  // منع حذف الأدمن
  db.get("SELECT username FROM users WHERE id = ?", [userId], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'فشل التحقق من المستخدم' });
    }
    if (!row) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }
    if (row.username === 'admin') {
      return res.status(400).json({ error: 'لا يمكن حذف حساب الأدمن' });
    }

    db.run("DELETE FROM users WHERE id = ?", [userId], function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'فشل حذف المستخدم' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'المستخدم غير موجود' });
      }
      res.json({ success: true });
    });
  });
});




// POST /api/users/change-password — تغيير كلمة المرور
router.post('/change-password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId;

  // التحقق من البيانات
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'كلمة المرور الحالية والجديدة مطلوبتان' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
  }

  try {
    // جلب كلمة المرور الحالية من قاعدة البيانات
    const user = await new Promise((resolve, reject) => {
      db.get("SELECT password_hash FROM users WHERE id = ?", [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    // التحقق من كلمة المرور الحالية
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
    }

    // تشفير كلمة المرور الجديدة
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // تحديث كلمة المرور في قاعدة البيانات
    await new Promise((resolve, reject) => {
      db.run("UPDATE users SET password_hash = ? WHERE id = ?", [newPasswordHash, userId], function(err) {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'فشل تغيير كلمة المرور' });
  }
});


module.exports = router;