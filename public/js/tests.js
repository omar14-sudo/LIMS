// public/js/tests.js

let currentUser = null;

// تحقق من تسجيل الدخول
function checkAuth() {
  const token = localStorage.getItem('token');
  const fullName = localStorage.getItem('fullName');

  if (!token) {
    window.location.href = '/pages/login-ar.html';
    return false;
  }

  currentUser = { token, fullName };
  return true;
}

// جلب قائمة التحاليل
async function loadTests() {
  try {
    const response = await fetch('/api/tests', {
      headers: {
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('فشل جلب قائمة التحاليل');
    }

    const tests = await response.json();
    displayTests(tests);
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('testsTableBody').innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-danger">فشل تحميل التحاليل: ${error.message}</td>
      </tr>
    `;
  }
}

// عرض التحاليل في الجدول
function displayTests(tests) {
  const tableBody = document.getElementById('testsTableBody');
  tableBody.innerHTML = '';

  if (tests.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">لا يوجد تحاليل مسجلة</td>
      </tr>
    `;
    return;
  }

  tests.forEach((test, index) => {
    // حساب عدد حقول النتائج
      let fieldCount = 0;
    if (test.result_fields) {
      try {
        const fields = JSON.parse(test.result_fields);
        fieldCount = fields.length;
      } catch (e) {
        fieldCount = 0;
      }
    }

     const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${test.name_ar}</td>
      <td>${test.name_en}</td>
      <td>${test.price} ج.م</td>
      <td>${test.turnaround_hours}</td>
      <td>${fieldCount}</td>
      <td>
        <button class="btn btn-sm btn-warning action-btn edit-btn" data-id="${test.id}">
          <i class="fas fa-edit"></i> تعديل
        </button>
        <button class="btn btn-sm btn-danger action-btn delete-btn" data-id="${test.id}">
          <i class="fas fa-trash"></i> حذف
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // إضافة event listeners
  document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', function() {
      editTestModal(this.dataset.id);
    });
  });

  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', function() {
      deleteTest(this.dataset.id);
    });
  });
}

// إضافة تحليل جديد
async function addTest() {
  const form = document.getElementById('addTestForm');
  const formData = new FormData(form);
  
  // جمع حقول النتائج
  const fieldNames = formData.getAll('field_name[]');
  const fieldTypes = formData.getAll('field_type[]');
  const fieldUnits = formData.getAll('field_unit[]');

  // التحقق من الحقول
  const fields = [];
  for (let i = 0; i < fieldNames.length; i++) {
    if (fieldNames[i].trim() === '') {
      alert('اسم الحقل مطلوب');
      return;
    }
    fields.push({
      name: fieldNames[i].trim(),
      type: fieldTypes[i],
      unit: fieldUnits[i].trim() || ''
    });
  }

  const testData = {
    name_ar: formData.get('name_ar'),
	name_en: formData.get('name_en'),
    price: parseFloat(formData.get('price')),
    turnaround_hours: parseInt(formData.get('turnaround_hours')),
    result_fields: fields
  };

  // التحقق من البيانات
  if (!testData.name_ar || !testData.price || !testData.turnaround_hours) {
    alert('جميع الحقول مطلوبة');
    return;
  }

  try {
    const response = await fetch('/api/tests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'فشل إضافة التحليل');
    }

    alert('✅ تم إضافة التحليل بنجاح!');
    bootstrap.Modal.getInstance(document.getElementById('addTestModal')).hide();
    form.reset();
    // إعادة تعيين حقول النتائج
    document.getElementById('resultFieldsContainer').innerHTML = `
      <div class="result-field-item">
        <div class="row">
          <div class="col-md-4">
            <label>اسم الحقل</label>
            <input type="text" class="form-control" name="field_name[]" placeholder="مثال: wbc" required>
          </div>
          <div class="col-md-3">
            <label>النوع</label>
            <select class="form-select" name="field_type[]" required>
              <option value="number">رقم</option>
              <option value="text">نص</option>
            </select>
          </div>
          <div class="col-md-3">
            <label>الوحدة</label>
            <input type="text" class="form-control" name="field_unit[]" placeholder="مثال: x10³/µL">
          </div>
          <div class="col-md-2 d-flex align-items-end">
            <button type="button" class="btn btn-danger btn-sm" onclick="removeField(this)">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
    loadTests();
  } catch (error) {
    console.error('Error:', error);
    alert('❌ فشل إضافة التحليل: ' + error.message);
  }
}

// فتح نافذة تعديل التحليل
async function editTestModal(testId) {
  try {
    const response = await fetch(`/api/tests/${testId}`, {
      headers: {
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('فشل جلب بيانات التحليل');
    }

    const test = await response.json();
    displayEditTestForm(test);
    
    // فتح النافذة
    const modal = new bootstrap.Modal(document.getElementById('editTestModal'));
    modal.show();
  } catch (error) {
    console.error('Error:', error);
    alert('فشل تحميل بيانات التحليل');
  }
}

// عرض نموذج تعديل التحليل
function displayEditTestForm(test) {
  const form = document.getElementById('editTestForm');
  form.testId.value = test.id;
  form.name_ar.value = test.name_ar;
  form.name_ar.value = test.name_en;
  form.price.value = test.price;
  form.turnaround_hours.value = test.turnaround_hours;

  const container = document.getElementById('editResultFieldsContainer');
  container.innerHTML = '';

  let fields = [];
  if (test.result_fields) {
    try {
      fields = JSON.parse(test.result_fields);
    } catch (e) {
      fields = [];
    }
  }

  if (fields.length === 0) {
    addEditField();
  } else {
    fields.forEach(field => {
      const fieldHtml = `
        <div class="result-field-item">
          <div class="row">
            <div class="col-md-4">
              <label>اسم الحقل</label>
              <input type="text" class="form-control" name="field_name[]" value="${field.name}" required>
            </div>
            <div class="col-md-3">
              <label>النوع</label>
              <select class="form-select" name="field_type[]" required>
                <option value="number" ${field.type === 'number' ? 'selected' : ''}>رقم</option>
                <option value="text" ${field.type === 'text' ? 'selected' : ''}>نص</option>
              </select>
            </div>
            <div class="col-md-3">
              <label>الوحدة</label>
              <input type="text" class="form-control" name="field_unit[]" value="${field.unit || ''}" placeholder="مثال: x10³/µL">
            </div>
            <div class="col-md-2 d-flex align-items-end">
              <button type="button" class="btn btn-danger btn-sm" onclick="removeField(this)">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
      container.insertAdjacentHTML('beforeend', fieldHtml);
    });
  }
}

// تحديث التحليل
async function updateTest() {
  const form = document.getElementById('editTestForm');
  const formData = new FormData(form);
  
  // جمع حقول النتائج
  const fieldNames = formData.getAll('field_name[]');
  const fieldTypes = formData.getAll('field_type[]');
  const fieldUnits = formData.getAll('field_unit[]');

  // التحقق من الحقول
  const fields = [];
  for (let i = 0; i < fieldNames.length; i++) {
    if (fieldNames[i].trim() === '') {
      alert('اسم الحقل مطلوب');
      return;
    }
    fields.push({
      name: fieldNames[i].trim(),
      type: fieldTypes[i],
      unit: fieldUnits[i].trim() || ''
    });
  }

  const testData = {
    name_ar: formData.get('name_ar'),
	name_en: formData.get('name_en'),
    price: parseFloat(formData.get('price')),
    turnaround_hours: parseInt(formData.get('turnaround_hours')),
    result_fields: fields
  };

  // التحقق من البيانات
  if (!testData.name_ar || !testData.price || !testData.turnaround_hours) {
    alert('جميع الحقول مطلوبة');
    return;
  }

  try {
    const response = await fetch(`/api/tests/${formData.get('testId')}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'فشل تحديث التحليل');
    }

    alert('✅ تم تحديث التحليل بنجاح!');
    bootstrap.Modal.getInstance(document.getElementById('editTestModal')).hide();
    loadTests();
  } catch (error) {
    console.error('Error:', error);
    alert('❌ فشل تحديث التحليل: ' + error.message);
  }
}

// حذف التحليل
async function deleteTest(testId) {
  if (!confirm('⚠️ تحذير: هل أنت متأكد أنك تريد حذف هذا التحليل؟ هذه العملية لا يمكن التراجع عنها!')) {
    return;
  }

  try {
    const response = await fetch(`/api/tests/${testId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'فشل حذف التحليل');
    }

    alert('✅ تم حذف التحليل بنجاح!');
    loadTests();
  } catch (error) {
    console.error('Error:', error);
    alert('❌ فشل حذف التحليل: ' + error.message);
  }
}

// إضافة حقل جديد في نموذج الإضافة
function addField() {
  const container = document.getElementById('resultFieldsContainer');
  const fieldHtml = `
    <div class="result-field-item">
      <div class="row">
        <div class="col-md-4">
          <label>اسم الحقل</label>
          <input type="text" class="form-control" name="field_name[]" placeholder="مثال: wbc" required>
        </div>
        <div class="col-md-3">
          <label>النوع</label>
          <select class="form-select" name="field_type[]" required>
            <option value="number">رقم</option>
            <option value="text">نص</option>
          </select>
        </div>
        <div class="col-md-3">
          <label>الوحدة</label>
          <input type="text" class="form-control" name="field_unit[]" placeholder="مثال: x10³/µL">
        </div>
        <div class="col-md-2 d-flex align-items-end">
          <button type="button" class="btn btn-danger btn-sm" onclick="removeField(this)">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', fieldHtml);
}

// إضافة حقل جديد في نموذج التعديل
function addEditField() {
  const container = document.getElementById('editResultFieldsContainer');
  const fieldHtml = `
    <div class="result-field-item">
      <div class="row">
        <div class="col-md-4">
          <label>اسم الحقل</label>
          <input type="text" class="form-control" name="field_name[]" placeholder="مثال: wbc" required>
        </div>
        <div class="col-md-3">
          <label>النوع</label>
          <select class="form-select" name="field_type[]" required>
            <option value="number">رقم</option>
            <option value="text">نص</option>
          </select>
        </div>
        <div class="col-md-3">
          <label>الوحدة</label>
          <input type="text" class="form-control" name="field_unit[]" placeholder="مثال: x10³/µL">
        </div>
        <div class="col-md-2 d-flex align-items-end">
          <button type="button" class="btn btn-danger btn-sm" onclick="removeField(this)">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', fieldHtml);
}

// حذف حقل
function removeField(button) {
  const fieldItem = button.closest('.result-field-item');
  if (fieldItem) {
    fieldItem.remove();
  }
}

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  if (checkAuth()) {
    loadTests();
    
    // ربط الأزرار
    document.getElementById('saveTestBtn').addEventListener('click', addTest);
    document.getElementById('updateTestBtn').addEventListener('click', updateTest);
  }
});