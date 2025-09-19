// public/js/backup.js

// دالة مساعدة لإرسال الطلبات مع التوثيق
function authHeader() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// إظهار رسالة نجاح
function showSuccess(message, section) {
  const successElement = document.getElementById(`${section}SuccessMessage`);
  if (successElement) {
    successElement.style.display = 'block';
    if (message) successElement.querySelector('strong').textContent = message;
  }
  const errorElement = document.getElementById(`${section}ErrorMessage`);
  if (errorElement) {
    errorElement.style.display = 'none';
  }
}

// إظهار رسالة خطأ
function showError(message, section) {
  const errorElement = document.getElementById(`${section}ErrorMessage`);
  if (errorElement) {
    errorElement.style.display = 'block';
    errorElement.querySelector('span').textContent = message;
  }
  const successElement = document.getElementById(`${section}SuccessMessage`);
  if (successElement) {
    successElement.style.display = 'none';
  }
}

// إنشاء نسخة احتياطية
document.getElementById('createBackupBtn').addEventListener('click', async function() {
  const backupName = document.getElementById('backupName').value.trim() || 'نسخة احتياطية';
  
  // إخفاء الرسائل السابقة
  document.getElementById('backupSuccessMessage').style.display = 'none';
  document.getElementById('backupErrorMessage').style.display = 'none';

  try {
    const response = await fetch('/api/backup/create', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ name: backupName })
    });

    const result = await response.json();

    if (response.ok) {
      showSuccess('تم إنشاء النسخة الاحتياطية بنجاح!', 'backup');
      document.getElementById('backupName').value = '';
      loadBackups(); // إعادة تحميل قائمة النسخ الاحتياطية
    } else {
      showError(result.error || 'فشل إنشاء النسخة الاحتياطية', 'backup');
    }
  } catch (err) {
    console.error(err);
    showError('حدث خطأ أثناء الاتصال بالسيرفر', 'backup');
  }
});

// حفظ جدولة النسخ الاحتياطي
document.getElementById('scheduleForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const formData = new FormData(this);
  const scheduleData = Object.fromEntries(formData.entries());
  scheduleData.autoBackup = scheduleData.autoBackup === 'on';

  try {
    const response = await fetch('/api/backup/schedule', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify(scheduleData)
    });

    const result = await response.json();

    if (response.ok) {
      showSuccess('تم حفظ جدولة النسخ الاحتياطي بنجاح!', 'schedule');
    } else {
      showError(result.error || 'فشل حفظ الجدولة', 'schedule');
    }
  } catch (err) {
    console.error(err);
    showError('حدث خطأ أثناء الاتصال بالسيرفر', 'schedule');
  }
});

// تحميل قائمة النسخ الاحتياطية
async function loadBackups() {
  try {
    const response = await fetch('/api/backup/list', { headers: authHeader() });
    const backups = await response.json();

    const backupsList = document.getElementById('backupsList');
    const restoreSelect = document.getElementById('restoreSelect');

    if (backups.length === 0) {
      backupsList.innerHTML = '<div class="alert alert-info text-center">لا توجد نسخ احتياطية</div>';
      restoreSelect.innerHTML = '<option value="">لا توجد نسخ احتياطية</option>';
      document.getElementById('restoreBackupBtn').disabled = true;
      return;
    }

    // عرض النسخ الاحتياطية
    backupsList.innerHTML = backups.map(backup => `
      <div class="backup-item">
        <h5>${backup.name}</h5>
        <p><i class="fas fa-file me-1"></i> الحجم: ${formatFileSize(backup.size)}</p>
        <p><i class="fas fa-clock me-1"></i> تم الإنشاء: ${new Date(backup.created_at).toLocaleString('ar-EG')}</p>
        <div class="d-flex justify-content-end">
          <button class="btn btn-sm btn-outline-primary restore-btn" data-file="${backup.filename}">
            <i class="fas fa-upload"></i> استعادة
          </button>
          <button class="btn btn-sm btn-outline-danger delete-btn" data-file="${backup.filename}">
            <i class="fas fa-trash"></i> حذف
          </button>
        </div>
      </div>
    `).join('');

    // ملء قائمة الاستعادة
    restoreSelect.innerHTML = backups.map(backup => `
      <option value="${backup.filename}">${backup.name} - ${new Date(backup.created_at).toLocaleDateString('ar-EG')}</option>
    `).join('');

    document.getElementById('restoreBackupBtn').disabled = false;

    // ربط أزرار الاستعادة والحذف
    document.querySelectorAll('.restore-btn').forEach(button => {
      button.addEventListener('click', function() {
        restoreBackup(this.dataset.file);
      });
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', function() {
        deleteBackup(this.dataset.file);
      });
    });

  } catch (err) {
    console.error('فشل تحميل النسخ الاحتياطية:', err);
    document.getElementById('backupsList').innerHTML = '<div class="alert alert-danger text-center">فشل تحميل النسخ الاحتياطية</div>';
  }
}

// استعادة من نسخة احتياطية
async function restoreBackup(filename) {
  if (!confirm('⚠️ تحذير: هل أنت متأكد أنك تريد استعادة النظام من هذه النسخة الاحتياطية؟ هذه العملية ستستبدل جميع البيانات الحالية!')) {
    return;
  }

  // إخفاء الرسائل السابقة
  document.getElementById('restoreSuccessMessage').style.display = 'none';
  document.getElementById('restoreErrorMessage').style.display = 'none';

  try {
    const response = await fetch('/api/backup/restore', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ filename })
    });

    const result = await response.json();

    if (response.ok) {
      showSuccess('تم استعادة النظام بنجاح! سيتم إعادة تشغيل السيرفر...', 'restore');
      // إعادة تشغيل السيرفر بعد 3 ثواني
      setTimeout(() => {
        location.reload();
      }, 3000);
    } else {
      showError(result.error || 'فشل استعادة النظام', 'restore');
    }
  } catch (err) {
    console.error(err);
    showError('حدث خطأ أثناء الاتصال بالسيرفر', 'restore');
  }
}

// حذف نسخة احتياطية
async function deleteBackup(filename) {
  if (!confirm('هل أنت متأكد أنك تريد حذف هذه النسخة الاحتياطية؟')) {
    return;
  }

  try {
    const response = await fetch('/api/backup/delete', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ filename })
    });

    const result = await response.json();

    if (response.ok) {
      alert('✅ تم حذف النسخة الاحتياطية بنجاح!');
      loadBackups(); // إعادة تحميل القائمة
    } else {
      alert('❌ فشل حذف النسخة الاحتياطية: ' + (result.error || 'خطأ غير معروف'));
    }
  } catch (err) {
    console.error(err);
    alert('حدث خطأ أثناء الاتصال بالسيرفر');
  }
}

// عند تغيير اختيار النسخة للاستعادة
document.getElementById('restoreSelect').addEventListener('change', function() {
  document.getElementById('restoreBackupBtn').disabled = !this.value;
});

// استعادة عند الضغط على الزر
document.getElementById('restoreBackupBtn').addEventListener('click', function() {
  const filename = document.getElementById('restoreSelect').value;
  if (filename) {
    restoreBackup(filename);
  }
});

// تنسيق حجم الملف
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  loadBackups();
  
  // تحميل إعدادات الجدولة المحفوظة
  const savedSchedule = localStorage.getItem('backupSchedule');
  if (savedSchedule) {
    const schedule = JSON.parse(savedSchedule);
    if (schedule.frequency) {
      document.querySelector(`select[name="frequency"] option[value="${schedule.frequency}"]`).selected = true;
    }
    if (schedule.backupTime) {
      document.querySelector('input[name="backupTime"]').value = schedule.backupTime;
    }
    if (schedule.autoBackup !== undefined) {
      document.getElementById('autoBackup').checked = schedule.autoBackup;
    }
  }
});