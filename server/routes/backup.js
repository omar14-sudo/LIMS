// server/routes/backup.js
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');

const router = express.Router();

// Middleware للتحقق من التوثيق
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'غير مصرح بالدخول' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // التحقق من أن المستخدم لديه صلاحية (فقط الأدمن)
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'غير مصرح لك بهذه العملية' });
    }
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'التوثيق غير صالح' });
  }
}

// مجلد النسخ الاحتياطية
const BACKUP_DIR = path.join(__dirname, '../../backups');
const DB_PATH = path.join(__dirname, '../../database.sqlite');

// إنشاء مجلد النسخ الاحتياطية إذا لم يكن موجودًا
fs.mkdir(BACKUP_DIR, { recursive: true }).catch(console.error);

// POST /api/backup/create — إنشاء نسخة احتياطية
router.post('/create', auth, async (req, res) => {
  const { name } = req.body;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${timestamp}.sqlite`;
  const backupPath = path.join(BACKUP_DIR, filename);

  try {
    // نسخ ملف قاعدة البيانات
    await fs.copyFile(DB_PATH, backupPath);
    
    // الحصول على حجم الملف
    const stats = await fs.stat(backupPath);
    
    res.json({
      success: true,
      filename,
      name,
      size: stats.size,
      created_at: new Date().toISOString()
    });

  } catch (err) {
    console.error('فشل إنشاء النسخة الاحتياطية:', err);
    res.status(500).json({ error: 'فشل إنشاء النسخة الاحتياطية' });
  }
});

// POST /api/backup/schedule — حفظ جدولة النسخ الاحتياطي
router.post('/schedule', auth, async (req, res) => {
  const { frequency, backupTime, autoBackup } = req.body;

  // هنا يمكن حفظ الإعدادات في ملف أو قاعدة بيانات
  // في هذا المثال سنحفظها في ملف settings.json
  const settingsPath = path.join(__dirname, '../../settings.json');
  
  try {
    const currentSettings = await fs.readFile(settingsPath, 'utf8').catch(() => '{}');
    const settings = JSON.parse(currentSettings);
    
    settings.backupSchedule = {
      frequency,
      backupTime,
      autoBackup,
      lastUpdated: new Date().toISOString()
    };

    await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2));
    res.json({ success: true });

  } catch (err) {
    console.error('فشل حفظ جدولة النسخ الاحتياطي:', err);
    res.status(500).json({ error: 'فشل حفظ الجدولة' });
  }
});

// GET /api/backup/list — جلب قائمة النسخ الاحتياطية
router.get('/list', auth, async (req, res) => {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backups = [];

    for (const file of files) {
      if (file.endsWith('.sqlite')) {
        const stats = await fs.stat(path.join(BACKUP_DIR, file));
        const name = file.replace(/\.sqlite$/, '').replace(/_[^_]+$/, '');
        backups.push({
          filename: file,
          name,
          size: stats.size,
          created_at: stats.mtime.toISOString()
        });
      }
    }

    // ترتيب حسب التاريخ (الأحدث أولاً)
    backups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(backups);

  } catch (err) {
    console.error('فشل جلب قائمة النسخ الاحتياطية:', err);
    res.status(500).json({ error: 'فشل جلب قائمة النسخ الاحتياطية' });
  }
});

// POST /api/backup/restore — استعادة من نسخة احتياطية
router.post('/restore', auth, async (req, res) => {
  const { filename } = req.body;
  const backupPath = path.join(BACKUP_DIR, filename);

  try {
    // التحقق من وجود الملف
    await fs.access(backupPath);

    // عمل نسخة احتياطية من قاعدة البيانات الحالية قبل الاستعادة
    const currentBackupName = `pre_restore_${new Date().toISOString().replace(/[:.]/g, '-')}.sqlite`;
    const currentBackupPath = path.join(BACKUP_DIR, currentBackupName);
    await fs.copyFile(DB_PATH, currentBackupPath);

    // استعادة قاعدة البيانات من النسخة الاحتياطية
    await fs.copyFile(backupPath, DB_PATH);

    res.json({ success: true });

    // إعادة تشغيل السيرفر بعد 2 ثانية
    setTimeout(() => {
      process.exit(0); // السيرفر هيتعيد تشغيله تلقائيًا بواسطة nodemon
    }, 2000);

  } catch (err) {
    console.error('فشل استعادة النظام:', err);
    res.status(500).json({ error: 'فشل استعادة النظام' });
  }
});

// POST /api/backup/delete — حذف نسخة احتياطية
router.post('/delete', auth, async (req, res) => {
  const { filename } = req.body;
  const backupPath = path.join(BACKUP_DIR, filename);

  try {
    // التحقق من وجود الملف
    await fs.access(backupPath);
    
    // حذف الملف
    await fs.unlink(backupPath);
    
    res.json({ success: true });

  } catch (err) {
    console.error('فشل حذف النسخة الاحتياطية:', err);
    res.status(500).json({ error: 'فشل حذف النسخة الاحتياطية' });
  }
});

module.exports = router;