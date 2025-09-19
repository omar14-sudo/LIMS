// public/js/settings.js

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

// تغيير كلمة المرور
document.getElementById('passwordForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const currentPassword = this.currentPassword.value;
  const newPassword = this.newPassword.value;
  const confirmPassword = this.confirmPassword.value;

  // التحقق من البيانات
  if (!currentPassword || !newPassword || !confirmPassword) {
    showError('جميع الحقول مطلوبة', 'password');
    return;
  }

  if (newPassword.length < 6) {
    showError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل', 'password');
    return;
  }

  if (newPassword !== confirmPassword) {
    showError('كلمة المرور الجديدة وتأكيدها غير متطابقين', 'password');
    return;
  }

  try {
    const response = await fetch('/api/users/change-password', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    const result = await response.json();

    if (response.ok) {
      showSuccess('تم تغيير كلمة المرور بنجاح!', 'password');
      this.reset();
    } else {
      showError(result.error || 'فشل تغيير كلمة المرور', 'password');
    }
  } catch (err) {
    console.error(err);
    showError('حدث خطأ أثناء الاتصال بالسيرفر', 'password');
  }
});

// تغيير اللغة
document.getElementById('languageForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const selectedLanguage = document.querySelector('input[name="language"]:checked').value;
  
  // حفظ اللغة في localStorage
  localStorage.setItem('language', selectedLanguage);
  
  // عرض رسالة نجاح
  showSuccess('تم تغيير اللغة بنجاح! سيتم إعادة تحميل الصفحة...', 'language');
  
  // إعادة تحميل الصفحة بعد ثانيتين
  setTimeout(() => {
    location.reload();
  }, 2000);
});

// حفظ إعدادات النظام
document.getElementById('systemForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const formData = new FormData(this);
  const systemSettings = Object.fromEntries(formData.entries());

  // تحويل القيم المنطقية
  systemSettings.darkMode = systemSettings.darkMode === 'on';

  // حفظ الإعدادات في localStorage
  localStorage.setItem('systemSettings', JSON.stringify(systemSettings));

  // عرض رسالة نجاح
  showSuccess('تم حفظ إعدادات النظام بنجاح!', 'system');

  // تطبيق الوضع الداكن إذا تم اختياره
  if (systemSettings.darkMode) {
    document.body.classList.add('bg-dark');
    document.body.classList.add('text-white');
  } else {
    document.body.classList.remove('bg-dark');
    document.body.classList.remove('text-white');
  }
});

// عند تحميل الصفحة — تحميل الإعدادات المحفوظة
document.addEventListener('DOMContentLoaded', function() {
  // تحميل إعدادات اللغة
  const savedLanguage = localStorage.getItem('language') || 'ar';
  document.querySelector(`input[name="language"][value="${savedLanguage}"]`).checked = true;

  // تحميل إعدادات النظام
  const savedSettings = localStorage.getItem('systemSettings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    if (settings.currency) {
      document.querySelector(`select[name="currency"] option[value="${settings.currency}"]`).selected = true;
    }
    if (settings.dateFormat) {
      document.querySelector(`select[name="dateFormat"] option[value="${settings.dateFormat}"]`).selected = true;
    }
    if (settings.itemsPerPage) {
      document.querySelector(`select[name="itemsPerPage"] option[value="${settings.itemsPerPage}"]`).selected = true;
    }
    if (settings.darkMode) {
      document.getElementById('darkMode').checked = true;
      if (settings.darkMode) {
        document.body.classList.add('bg-dark');
        document.body.classList.add('text-white');
      }
    }
  }
});