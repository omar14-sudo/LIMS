// public/js/sample-register.js

// دالة مساعدة لإرسال الطلبات مع التوثيق
function authHeader() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// إظهار رسالة نجاح
function showSuccess(sampleId) {
  document.getElementById('successMessage').style.display = 'block';
  document.getElementById('sampleIdDisplay').textContent = sampleId;
  document.getElementById('errorMessage').style.display = 'none';
}

// إظهار رسالة خطأ
function showError(message) {
  document.getElementById('errorMessage').style.display = 'block';
  document.getElementById('errorText').textContent = message;
  document.getElementById('successMessage').style.display = 'none';
}

// جلب التحاليل وعرضها
// جلب التحاليل وعرضها
async function loadTests() {
  try {
    const res = await fetch('/api/tests', { headers: authHeader() });
    const tests = await res.json();

    const container = document.getElementById('testsContainer');
    container.innerHTML = '';

    if (tests.length === 0) {
      container.innerHTML = `
        <div class="alert alert-warning text-center col-12">
          لا توجد تحاليل مسجلة. يرجى إضافة تحاليل من صفحة إدارة التحاليل.
        </div>
      `;
      return;
    }

    tests.forEach(test => {
      const englishName = getEnglishTestName(test.name_ar);
      const card = document.createElement('div');
      card.className = 'test-card';
      card.innerHTML = `
        <h3>${englishName}</h3>
        
        
      `;
      card.addEventListener('click', function() {
        selectTest(test);
      });
      container.appendChild(card);
    });

  } catch (err) {
    console.error('فشل تحميل التحاليل:', err);
    showError('فشل تحميل قائمة التحاليل. تأكد من اتصال السيرفر.');
  }
}

// اختيار تحليل
function selectTest(test) {
  // إزالة التحديد من كل الكروت
  document.querySelectorAll('.test-card').forEach(card => {
    card.classList.remove('selected');
  });

  // تحديد الكارت المختار
  event.currentTarget.classList.add('selected');

  // تعبئة بيانات التحليل في المودال
  document.getElementById('selectedTestName').textContent = test.name_ar;
  document.getElementById('selectedTestId').value = test.id;

  // فتح المودال
  const modal = new bootstrap.Modal(document.getElementById('registerSampleModal'));
  modal.show();
}

// تحديد طريقة الدفع
document.querySelectorAll('.payment-option').forEach(option => {
  option.addEventListener('click', function() {
    // إزالة التحديد من كل الخيارات
    document.querySelectorAll('.payment-option').forEach(opt => {
      opt.classList.remove('selected');
    });

    // تحديد الخيار المختار
    this.classList.add('selected');
    document.getElementById('paymentMethod').value = this.dataset.payment;
  });
});

// عند تحميل الصفحة — نحمل التحاليل
document.addEventListener('DOMContentLoaded', loadTests);

// عند الضغط على "تسجيل العينة"
document.getElementById('sampleForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  // التحقق من اختيار طريقة الدفع
  if (!document.getElementById('paymentMethod').value) {
    showError('الرجاء اختيار طريقة الدفع');
    return;
  }

  // إخفاء الرسائل السابقة
  document.getElementById('successMessage').style.display = 'none';
  document.getElementById('errorMessage').style.display = 'none';

  const formData = new FormData(this);
  const sampleData = Object.fromEntries(formData);
  sampleData.testType = document.getElementById('selectedTestId').value;

  // التأكد من اختيار تحليل
  if (!sampleData.testType) {
    showError('الرجاء اختيار نوع التحليل');
    return;
  }

  // التأكد من تاريخ أخذ العينة
  if (!sampleData.collectionDate) {
    showError('الرجاء إدخال تاريخ ووقت أخذ العينة');
    return;
  }

  try {
    const res = await fetch('/api/samples', {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify(sampleData)
    });

    const result = await res.json();

    if (res.ok && result.sampleId) {
      showSuccess(result.sampleId);
      this.reset();
      document.getElementById('paymentMethod').value = '';
      document.querySelectorAll('.payment-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      
      // إغلاق المودال بعد 3 ثواني
      setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById('registerSampleModal')).hide();
      }, 3000);
    } else {
      showError(result.error || 'فشل تسجيل العينة');
    }
  } catch (err) {
    console.error(err);
    showError('حدث خطأ أثناء الاتصال بالسيرفر');
  }
});

// دالة للحصول على اسم التحليل بالإنجليزي
function getEnglishTestName(arabicName) {
  const translations = {
    'صورة دم كاملة': 'Complete Blood Count',
    'سكر صيام': 'Fasting Blood Sugar',
    'وظائف كبد': 'Liver Function Tests',
    'هرمونات الغدة الدرقية': 'Thyroid Hormones',
    'تحليل البول': 'Urine Analysis',
    'تحليل البراز': 'Stool Analysis',
    'وظائف كلى': 'Kidney Function Tests',
    'تحليل الحمل': 'Pregnancy Test',
    'تحليل السائل المنوي': 'Semen Analysis',
    'تحليل السكر التراكمي': 'HbA1c Test'
  };
  return translations[arabicName] || arabicName;
}

// إضافة حقل مخفي لحفظ ID التحليل المختار
document.addEventListener('DOMContentLoaded', function() {
  const modalBody = document.querySelector('#registerSampleModal .modal-body');
  const hiddenInput = document.createElement('input');
  hiddenInput.type = 'hidden';
  hiddenInput.id = 'selectedTestId';
  hiddenInput.name = 'selectedTestId';
  modalBody.insertBefore(hiddenInput, modalBody.firstChild);
});