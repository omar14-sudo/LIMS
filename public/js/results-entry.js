// public/js/results-entry.js

// دالة مساعدة لإرسال الطلبات مع التوثيق
function authHeader() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// إظهار رسالة نجاح
function showSuccess(message, container = 'modal') {
  const successElement = container === 'modal' ? 
    document.getElementById('modalSuccessMessage') : 
    document.getElementById('successMessage');
  if (successElement) {
    successElement.style.display = 'block';
    if (message) successElement.textContent = message;
  }
  const errorElement = container === 'modal' ? 
    document.getElementById('modalErrorMessage') : 
    document.getElementById('errorMessage');
  if (errorElement) {
    errorElement.style.display = 'none';
  }
}

// إظهار رسالة خطأ
function showError(message, container = 'modal') {
  const errorElement = container === 'modal' ? 
    document.getElementById('modalErrorMessage') : 
    document.getElementById('errorMessage');
  if (errorElement) {
    errorElement.style.display = 'block';
    errorElement.querySelector('span').textContent = message;
  }
  const successElement = container === 'modal' ? 
    document.getElementById('modalSuccessMessage') : 
    document.getElementById('successMessage');
  if (successElement) {
    successElement.style.display = 'none';
  }
}

// جلب العينات الجاهزة لإدخال نتائجها
async function loadPendingSamples() {
  try {
    const res = await fetch('/api/samples/pending', { headers: authHeader() });
    const samples = await res.json();

    const container = document.getElementById('samplesContainer');
    
    if (samples.length === 0) {
      container.innerHTML = `
        <div class="no-samples">
          <i class="fas fa-search"></i>
          <h3>لا توجد عينات جاهزة</h3>
          <p>جميع العينات تم إدخال نتائجها أو لم يتم تسجيل أي عينات بعد</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    samples.forEach(sample => {
      const card = document.createElement('div');
      card.className = 'sample-card';
      card.innerHTML = `
        <h4>عينة #${sample.id}</h4>
        <p><strong>المريض:</strong> ${sample.patient_name}</p>
        <p><strong>التحليل:</strong> ${sample.test_name}</p>
        <p><strong>تاريخ أخذ العينة:</strong> ${new Date(sample.collection_date).toLocaleString('ar-EG')}</p>
        <p class="status">⏱️ جاهزة للإدخال</p>
      `;
      card.addEventListener('click', function() {
        openResultsModal(sample);
      });
      container.appendChild(card);
    });

  } catch (err) {
    console.error('فشل تحميل العينات:', err);
    showError('فشل تحميل قائمة العينات. تأكد من اتصال السيرفر.', 'page');
  }
}

// فتح نافذة إدخال النتائج
async function openResultsModal(sample) {
  // تعبئة بيانات العينة
  document.getElementById('modalSampleId').textContent = sample.id;
  document.getElementById('modalPatientName').textContent = sample.patient_name;
  document.getElementById('modalTestName').textContent = sample.test_name;
  document.getElementById('modalCollectionDate').textContent = new Date(sample.collection_date).toLocaleString('ar-EG');

  // جلب حقول النتائج لهذا التحليل
  await loadTestFields(sample.test_type_id, sample.id);

  // إخفاء أزرار الطباعة في البداية
  document.getElementById('modalPrintBtn').style.display = 'none';

  // فتح المودال
  const modal = new bootstrap.Modal(document.getElementById('resultsModal'));
  modal.show();
}

// جلب حقول النتائج للتحليل
async function loadTestFields(testTypeId, sampleId) {
  try {
    const res = await fetch(`/api/tests/${testTypeId}`, { headers: authHeader() });
    const test = await res.json();

    const container = document.getElementById('modalResultFieldsContainer');
    container.innerHTML = '';

    if (!test.result_fields) {
      container.innerHTML = '<div class="alert alert-warning">هذا التحليل لا يحتوي على حقول نتائج محددة.</div>';
      const textarea = document.createElement('textarea');
      textarea.className = 'form-control';
      textarea.placeholder = 'أدخل النتيجة العامة أو الملاحظات...';
      textarea.rows = 4;
      textarea.id = 'generalResult';
      container.appendChild(textarea);
      return;
    }

    try {
      const fields = JSON.parse(test.result_fields);
      if (fields.length === 0) {
        container.innerHTML = '<div class="alert alert-warning">لا توجد حقول نتائج محددة لهذا التحليل.</div>';
        return;
      }

      fields.forEach(field => {
        const div = document.createElement('div');
        div.className = 'result-field';

        const label = document.createElement('label');
        label.textContent = `${field.name} ${field.unit ? `(${field.unit})` : ''}`;
        label.htmlFor = `field_${field.name}`;

        const input = document.createElement('input');
        input.type = field.type === 'number' ? 'number' : 'text';
        input.className = 'form-control';
        input.id = `field_${field.name}`;
        input.dataset.fieldName = field.name;
        input.dataset.unit = field.unit || '';
        input.placeholder = field.name;
        input.step = field.type === 'number' ? '0.01' : undefined;
        input.required = true;

        div.appendChild(label);
        div.appendChild(input);
        container.appendChild(div);
      });

    } catch (e) {
      console.error('خطأ في تحليل حقول النتائج:', e);
      container.innerHTML = '<div class="alert alert-danger">خطأ في تكوين حقول النتائج لهذا التحليل.</div>';
    }
  } catch (err) {
    console.error('فشل تحميل حقول النتائج:', err);
    showError('فشل تحميل حقول النتائج. تأكد من اتصال السيرفر.', 'modal');
  }
}

// عند الضغط على "حفظ النتيجة"
document.getElementById('modalResultsForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  // إخفاء الرسائل السابقة
  document.getElementById('modalSuccessMessage').style.display = 'none';
  document.getElementById('modalErrorMessage').style.display = 'none';

  const sampleId = document.getElementById('modalSampleId').textContent;
  if (!sampleId) {
    showError('لم يتم اختيار عينة', 'modal');
    return;
  }

  const resultData = {};

  // جمع البيانات من الحقول
  const inputs = document.querySelectorAll('#modalResultFieldsContainer input, #modalResultFieldsContainer textarea');
  let hasError = false;

  inputs.forEach(input => {
    if (input.id === 'generalResult') {
      if (input.value.trim()) {
        resultData.general_notes = input.value.trim();
      }
    } else {
      const fieldName = input.dataset.fieldName;
      const value = input.value.trim();
      if (value === '') {
        showError(`الرجاء إدخال قيمة لحقل: ${fieldName}`, 'modal');
        hasError = true;
        return;
      }
      resultData[fieldName] = value;
    }
  });

  if (hasError) return;

  try {
    const res = await fetch(`/api/samples/${sampleId}/result`, {
      method: 'PUT',
      headers: authHeader(),
      body: JSON.stringify({ result_data: resultData })
    });

    const result = await res.json();

    if (res.ok && result.success) {
      showSuccess('تم حفظ النتيجة بنجاح!', 'modal');
      
      // إظهار زر الطباعة
      document.getElementById('modalPrintBtn').style.display = 'inline-block';
      document.getElementById('modalPrintBtn').onclick = function() {
        printSampleReport(sampleId);
      };
      
      // إعادة تحميل قائمة العينات بعد 2 ثانية
      setTimeout(() => {
        loadPendingSamples();
      }, 2000);
    } else {
      showError(result.error || 'فشل حفظ النتيجة', 'modal');
    }
  } catch (err) {
    console.error(err);
    showError('حدث خطأ أثناء الاتصال بالسيرفر', 'modal');
  }
});

// طباعة تقرير العينة
function printSampleReport(sampleId) {
  window.open(`/pages/print-report-ar.html?id=${sampleId}`, '_blank');
}

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', loadPendingSamples);