// public/js/operational-reports.js

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

// توليد التقرير
async function generateReport() {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  if (!startDate || !endDate) {
    alert('الرجاء اختيار تاريخ البداية والنهاية');
    return;
  }

  try {
    const token = currentUser.token;
    const response = await fetch(`/api/reports/operational?start=${startDate}&end=${endDate}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('فشل جلب التقرير التشغيلي');
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
  document.getElementById('totalSamples').textContent = data.summary.total_samples || 0;
  document.getElementById('avgTurnaround').textContent = data.summary.avg_turnaround_hours ? data.summary.avg_turnaround_hours.toFixed(1) : 0;
  document.getElementById('completionRate').textContent = data.summary.completion_rate ? `${data.summary.completion_rate.toFixed(1)}%` : '0%';

  updateTechniciansChart(data.technicians);
  updatePopularTestsChart(data.popular_tests);
  updateTechniciansTable(data.technicians);
}

// تحديث رسم بياني أداء الفنيين
function updateTechniciansChart(technicians) {
  const ctx = document.getElementById('techniciansChart')?.getContext('2d');
  
  if (!ctx) {
    console.error('Canvas element with ID "techniciansChart" not found');
    return;
  }

  if (window.techniciansChart && typeof window.techniciansChart.destroy === 'function') {
    console.log('Destroying existing techniciansChart');
    window.techniciansChart.destroy();
  }

  const labels = technicians.map(item => item.full_name);
  const values = technicians.map(item => item.samples_completed);

  try {
    window.techniciansChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'عدد العينات المكتملة',
          data: values,
          backgroundColor: 'rgba(40, 167, 69, 0.7)',
          borderColor: 'rgba(40, 167, 69, 1)',
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
              text: 'عدد العينات'
            }
          },
          x: {
            title: {
              display: true,
              text: 'اسم الفني'
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
                return `عدد العينات: ${context.parsed.y}`;
              }
            }
          }
        }
      }
    });
    console.log('New techniciansChart created:', window.techniciansChart);
  } catch (error) {
    console.error('Error creating techniciansChart:', error);
  }
}

// تحديث رسم بياني التحاليل الأكثر طلبًا
function updatePopularTestsChart(tests) {
  const ctx = document.getElementById('popularTestsChart')?.getContext('2d');
  
  if (!ctx) {
    console.error('Canvas element with ID "popularTestsChart" not found');
    return;
  }

  if (window.popularTestsChart && typeof window.popularTestsChart.destroy === 'function') {
    console.log('Destroying existing popularTestsChart');
    window.popularTestsChart.destroy();
  }

  const labels = tests.map(item => item.test_name);
  const values = tests.map(item => item.count);

  try {
    window.popularTestsChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: [
            'rgba(13, 110, 253, 0.7)',
            'rgba(25, 135, 84, 0.7)',
            'rgba(255, 193, 7, 0.7)',
            'rgba(220, 53, 69, 0.7)',
            'rgba(108, 117, 125, 0.7)',
            'rgba(111, 66, 193, 0.7)',
            'rgba(253, 126, 20, 0.7)',
            'rgba(23, 162, 184, 0.7)'
          ],
          borderColor: [
            'rgba(13, 110, 253, 1)',
            'rgba(25, 135, 84, 1)',
            'rgba(255, 193, 7, 1)',
            'rgba(220, 53, 69, 1)',
            'rgba(108, 117, 125, 1)',
            'rgba(111, 66, 193, 1)',
            'rgba(253, 126, 20, 1)',
            'rgba(23, 162, 184, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.label}: ${context.parsed} عينة (${(context.parsed / context.dataset.data.reduce((a, b) => a + b, 0) * 100).toFixed(1)}%)`;
              }
            }
          }
        }
      }
    });
    console.log('New popularTestsChart created:', window.popularTestsChart);
  } catch (error) {
    console.error('Error creating popularTestsChart:', error);
  }
}

// تحديث جدول أداء الفنيين
function updateTechniciansTable(technicians) {
  const tableBody = document.getElementById('techniciansTableBody');
  tableBody.innerHTML = '';

  if (technicians.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">لا توجد بيانات في هذا النطاق الزمني</td></tr>';
    return;
  }

  technicians.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.full_name}</td>
      <td>${item.samples_completed}</td>
      <td>${item.avg_turnaround_hours ? item.avg_turnaround_hours.toFixed(1) : 0} ساعة</td>
      <td>${item.completion_rate ? item.completion_rate.toFixed(1) : 0}%</td>
    `;
    tableBody.appendChild(row);
  });
}

// تصدير التقرير
async function exportReport(format) {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  if (!startDate || !endDate) {
    alert('الرجاء اختيار تاريخ البداية والنهاية أولاً');
    return;
  }

  const token = currentUser.token;
  const url = `/api/reports/operational/export?format=${format}&start=${startDate}&end=${endDate}`;
  
  window.open(url, '_blank');
}

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  if (checkAuth()) {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    document.getElementById('startDate').value = weekAgo;
    document.getElementById('endDate').value = today;

    document.getElementById('generateReportBtn').addEventListener('click', generateReport);
    document.getElementById('exportPdfBtn').addEventListener('click', () => exportReport('pdf'));
    document.getElementById('exportExcelBtn').addEventListener('click', () => exportReport('excel'));
  }
});