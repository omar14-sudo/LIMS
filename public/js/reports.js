// public/js/reports.js

// تحقق من تسجيل الدخول
function checkAuth() {
  const token = localStorage.getItem('token');
  const fullName = localStorage.getItem('fullName');

  if (!token) {
    window.location.href = '/pages/login-ar.html';
    return false;
  }

  document.getElementById('userFullName').textContent = fullName || 'مستخدم';
  return token;
}

// تسجيل الخروج
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('fullName');
  window.location.href = '/pages/login-ar.html';
}

// توليد التقرير
async function generateReport() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  if (!startDate || !endDate) {
    alert('الرجاء اختيار تاريخ البداية والنهاية');
    return;
  }

  try {
    const token = checkAuth();
    const response = await fetch(`/api/reports/financial?start=${startDate}&end=${endDate}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('فشل جلب التقرير');
    }

    const data = await response.json();
    displayReport(data, startDate, endDate);
  } catch (error) {
    console.error('Error:', error);
    alert('حدث خطأ أثناء جلب التقرير');
  }
}

// عرض التقرير
function displayReport(data, startDate, endDate) {
  // حساب الإجماليات
  let totalRevenue = 0;
  let totalSamples = 0;

  data.forEach(item => {
    totalRevenue += item.total_revenue || 0;
    totalSamples += item.count || 0;
  });

  const avgPrice = totalSamples > 0 ? totalRevenue / totalSamples : 0;

  // تحديث الإجماليات
  document.getElementById('totalRevenue').textContent = `${totalRevenue.toFixed(2)} ج.م`;
  document.getElementById('totalSamples').textContent = totalSamples;
  document.getElementById('avgPrice').textContent = `${avgPrice.toFixed(2)} ج.م`;

  // تحديث الجدول
  const tableBody = document.getElementById('reportTableBody');
  tableBody.innerHTML = '';

  if (data.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">لا توجد بيانات في هذا النطاق الزمني</td></tr>';
    return;
  }

  data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.test_name}</td>
      <td>${item.count}</td>
      <td>${item.total_revenue.toFixed(2)} ج.م</td>
      <td>${(item.total_revenue / item.count).toFixed(2)} ج.م</td>
    `;
    tableBody.appendChild(row);
  });

  // تحديث الرسم البياني
  updateChart(data);
}

// تحديث الرسم البياني
function updateChart(data) {
  const ctx = document.getElementById('revenueChart')?.getContext('2d');
  
  if (!ctx) {
    console.error('Canvas element with ID "revenueChart" not found');
    return;
  }

  if (window.revenueChart && typeof window.revenueChart.destroy === 'function') {
    console.log('Destroying existing revenueChart');
    window.revenueChart.destroy();
  }

  const labels = data.map(item => item.test_name);
  const values = data.map(item => item.total_revenue);

  try {
    window.revenueChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'الإيرادات (ج.م)',
          data: values,
          backgroundColor: 'rgba(13, 110, 253, 0.7)',
          borderColor: 'rgba(13, 110, 253, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'الإيرادات (جنيه مصري)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'نوع التحليل'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `الإيرادات: ${context.parsed.y.toFixed(2)} ج.م`;
              }
            }
          }
        }
      }
    });
    console.log('New revenueChart created:', window.revenueChart);
  } catch (error) {
    console.error('Error creating revenueChart:', error);
  }
}

// تصدير التقرير
async function exportReport(format) {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  if (!startDate || !endDate) {
    alert('الرجاء اختيار تاريخ البداية والنهاية أولاً');
    return;
  }

  const token = checkAuth();
  const url = `/api/reports/export?format=${format}&start=${startDate}&end=${endDate}`;
  
  window.open(url, '_blank');
}

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  const btn = document.getElementById("generateReportBtn");
  if (btn) {
    btn.addEventListener("click", generateReport);
  }
  // تعيين تواريخ افتراضية (اليوم)
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  document.getElementById('startDate').value = weekAgo;
  document.getElementById('endDate').value = today;
});