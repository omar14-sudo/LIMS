// public/js/sample-search.js

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

// البحث عن العينات
async function searchSamples() {
  const patientName = document.getElementById('searchPatientName').value.trim();
  const nationalId = document.getElementById('searchNationalId').value.trim();
  const sampleId = document.getElementById('searchSampleId').value.trim();
  const startDate = document.getElementById('searchStartDate').value;
  const endDate = document.getElementById('searchEndDate').value;

  // التحقق من وجود معايير بحث
  if (!patientName && !nationalId && !sampleId && !startDate && !endDate) {
    alert('الرجاء إدخال على الأقل معيار بحث واحد');
    return;
  }

  try {
    const params = new URLSearchParams();
    if (patientName) params.append('patientName', patientName);
    if (nationalId) params.append('nationalId', nationalId);
    if (sampleId) params.append('sampleId', sampleId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`/api/samples/search?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('فشل البحث عن العينات');
    }

    const samples = await response.json();
    displaySearchResults(samples);
  } catch (error) {
    console.error('Error:', error);
    alert('حدث خطأ أثناء البحث: ' + error.message);
  }
}

// عرض نتائج البحث
function displaySearchResults(samples) {
  const container = document.getElementById('searchResultsContainer');
  
  if (samples.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <i class="fas fa-search"></i>
        <h3>لا توجد نتائج</h3>
        <p>لا توجد عينات مطابقة لمعايير البحث</p>
      </div>
    `;
    return;
  }

  let html = `
    <div class="table-responsive">
      <table class="table table-hover">
        <thead class="table-light">
          <tr>
            <th>رقم العينة</th>
            <th>اسم المريض</th>
            <th>الرقم القومي</th>
            <th>نوع التحليل</th>
            <th>تاريخ أخذ العينة</th>
            <th>الحالة</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody>
  `;

  samples.forEach(sample => {
    let statusClass = '';
    let statusText = '';
    switch(sample.status) {
      case 'registered':
        statusClass = 'status-registered';
        statusText = 'مسجلة';
        break;
      case 'completed':
        statusClass = 'status-completed';
        statusText = 'مكتملة';
        break;
      case 'cancelled':
        statusClass = 'status-cancelled';
        statusText = 'ملغاة';
        break;
      default:
        statusClass = '';
        statusText = sample.status;
    }

    html += `
      <tr>
        <td>${sample.id}</td>
        <td>${sample.patient_name}</td>
        <td>${sample.national_id || 'غير متوفر'}</td>
        <td>${sample.test_name}</td>
        <td>${new Date(sample.collection_date).toLocaleString('ar-EG')}</td>
        <td><span class="${statusClass}">${statusText}</span></td>
        <td>
          <button class="btn btn-sm btn-info action-btn details-btn" data-id="${sample.id}">
            <i class="fas fa-eye"></i> عرض
          </button>
          ${sample.status === 'completed' ? 
            `<button class="btn btn-sm print-btn action-btn print-btn-${sample.id}" data-id="${sample.id}">
              <i class="fas fa-print"></i> طباعة
            </button>` : ''}
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;

  // ربط أزرار العرض
  document.querySelectorAll('.details-btn').forEach(button => {
    button.addEventListener('click', function() {
      showSampleDetails(this.dataset.id);
    });
  });

  // ربط أزرار الطباعة
  document.querySelectorAll('.print-btn').forEach(button => {
    button.addEventListener('click', function() {
      printSampleReport(this.dataset.id);
    });
  });
}

// مسح معايير البحث
function resetSearch() {
  document.getElementById('searchPatientName').value = '';
  document.getElementById('searchNationalId').value = '';
  document.getElementById('searchSampleId').value = '';
  document.getElementById('searchStartDate').value = '';
  document.getElementById('searchEndDate').value = '';
  
  document.getElementById('searchResultsContainer').innerHTML = `
    <div class="no-results">
      <i class="fas fa-search"></i>
      <h3>ابدأ البحث الآن</h3>
      <p>أدخل معايير البحث ثم اضغط على زر "بحث"</p>
    </div>
  `;
}

// عرض تفاصيل العينة
async function showSampleDetails(sampleId) {
  try {
    const response = await fetch(`/api/samples/${sampleId}`, {
      headers: {
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('فشل جلب تفاصيل العينة');
    }

    const sample = await response.json();
    displaySampleDetails(sample);
    
    // فتح النافذة
    const modal = new bootstrap.Modal(document.getElementById('sampleDetailsModal'));
    modal.show();

    // ربط زر الطباعة في المودال
    document.getElementById('printDetailsBtn').onclick = function() {
      printSampleReport(sampleId);
    };
  } catch (error) {
    console.error('Error:', error);
    alert('حدث خطأ أثناء جلب التفاصيل: ' + error.message);
  }
}

// عرض تفاصيل العينة في المودال
function displaySampleDetails(sample) {
  document.getElementById('modalSampleId').textContent = sample.id;
  document.getElementById('modalPatientName').textContent = sample.patient_name;
  document.getElementById('modalNationalId').textContent = sample.national_id || 'غير متوفر';
  document.getElementById('modalTestName').textContent = sample.test_name;
  document.getElementById('modalCollectionDate').textContent = new Date(sample.collection_date).toLocaleString('ar-EG');
  document.getElementById('modalCreatedAt').textContent = new Date(sample.created_at).toLocaleString('ar-EG');

  // تحديث حالة العينة
  const statusElement = document.getElementById('modalStatus');
  statusElement.textContent = getStatusText(sample.status);
  statusElement.className = 'fw-bold ' + getStatusClass(sample.status);

  // عرض نتائج التحليل إذا كانت مكتملة
  const resultSection = document.getElementById('resultSection');
  const resultData = document.getElementById('resultData');
  
  if (sample.status === 'completed' && sample.result_data) {
    resultSection.style.display = 'block';
    try {
      const results = JSON.parse(sample.result_data);
      let html = '<div class="row">';
      for (const [key, value] of Object.entries(results)) {
        if (key !== 'general_notes') {
          html += `
            <div class="col-md-6 mb-2">
              <strong>${key}:</strong> ${value}
            </div>
          `;
        }
      }
      if (results.general_notes) {
        html += `
          <div class="col-12 mb-2">
            <strong>ملاحظات عامة:</strong> ${results.general_notes}
          </div>
        `;
      }
      html += '</div>';
      resultData.innerHTML = html;
    } catch (e) {
      resultData.innerHTML = '<p class="text-danger">خطأ في تحميل النتائج</p>';
    }
  } else {
    resultSection.style.display = 'none';
  }
}

// طباعة تقرير العينة
function printSampleReport(sampleId) {
  window.open(`/pages/print-report-ar.html?id=${sampleId}`, '_blank');
}

// تحويل حالة العينة لنص عربي
function getStatusText(status) {
  const statuses = {
    'registered': 'مسجلة',
    'completed': 'مكتملة',
    'cancelled': 'ملغاة'
  };
  return statuses[status] || status;
}

// الحصول على كلاس CSS للحالة
function getStatusClass(status) {
  const classes = {
    'registered': 'status-registered',
    'completed': 'status-completed',
    'cancelled': 'status-cancelled'
  };
  return classes[status] || '';
}

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  if (checkAuth()) {
    // ربط الأزرار بالأحداث
    document.getElementById('searchBtn').addEventListener('click', searchSamples);
    document.getElementById('resetBtn').addEventListener('click', resetSearch);
    
    // لو جايين بالـ URL فيه رقم عينة — نعرضها مباشرة
    const urlParams = new URLSearchParams(window.location.search);
    const sampleId = urlParams.get('id');
    if (sampleId) {
      showSampleDetails(sampleId);
    }
  }
});