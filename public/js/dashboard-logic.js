// public/js/dashboard-logic.js

// تحقق من تسجيل الدخول
function checkAuth() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const fullName = localStorage.getItem('fullName');

  if (!token || !role) {
    window.location.href = '/pages/login-ar.html';
    return false;
  }

const roleElement = document.getElementById('userRoleDisplay');
if (roleElement) {
  roleElement.textContent = getRoleName(role);
}

  return { token, role, fullName };
}

// تحويل اسم الدور لعربي
function getRoleName(role) {
  const roles = {
    'admin': 'مدير النظام',
    'manager': 'مدير المعمل',
    'lab_technician': 'فني معمل',
    'receptionist': 'موظف استقبال',
    'accountant': 'محاسب'
  };
  return roles[role] || role;
}

// تسجيل الخروج
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('fullName');
  window.location.href = '/pages/login-ar.html';
}

// تحميل لوحة التحكم حسب الدور
function loadDashboardByRole(role) {
  const content = document.getElementById('dashboardContent');
  if (!content) return;

  switch(role) {
    case 'admin':
      content.innerHTML = renderAdminDashboard();
      loadAdminStats();
      break;
    case 'manager':
      content.innerHTML = renderManagerDashboard();
      loadManagerStats();
      break;
    case 'lab_technician':
      content.innerHTML = renderLabTechDashboard();
      loadPendingSamplesCount();
      break;
    case 'receptionist':
      content.innerHTML = renderReceptionistDashboard();
      loadTodaySamplesCount();
      break;
    case 'accountant':
      content.innerHTML = renderAccountantDashboard();
      loadFinancialStats();
      break;
    default:
      content.innerHTML = '<div class="alert alert-warning text-center">لا توجد صلاحيات كافية</div>';
  }
}

// === لوحات التحكم حسب الدور ===

function renderAdminDashboard() {
  return `
    <div class="row">
      <!-- الإحصائيات -->
      <div class="col-md-3 mb-4">
        <div class="card stat-card bg-primary text-white">
          <div class="card-body text-center">
            <h5>إجمالي العينات اليوم</h5>
            <h2 id="todaySamples">0</h2>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-4">
        <div class="card stat-card bg-success text-white">
          <div class="card-body text-center">
            <h5>الإيرادات اليوم</h5>
            <h2 id="todayRevenue">0 ج.م</h2>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-4">
        <div class="card stat-card bg-info text-white">
          <div class="card-body text-center">
            <h5>العينات المعلقة</h5>
            <h2 id="pendingSamples">0</h2>
          </div>
        </div>
      </div>
      <div class="col-md-3 mb-4">
        <div class="card stat-card bg-warning text-white">
          <div class="card-body text-center">
            <h5>عدد المستخدمين</h5>
            <h2 id="totalUsers">0</h2>
          </div>
        </div>
      </div>
    </div>

    <h3 class="section-title">الإجراءات السريعة</h3>
    <div class="row">
      <div class="col-md-4 mb-4">
        <a href="/pages/sample-register-ar.html" class="card-link">
          <div class="card text-center">
            <div class="card-body">
              <div class="card-icon">
                <i class="fas fa-plus-circle"></i>
              </div>
              <h5 class="card-title">تسجيل عينة جديدة</h5>
            </div>
          </div>
        </a>
      </div>
      <div class="col-md-4 mb-4">
        <a href="/pages/results-entry-ar.html" class="card-link">
          <div class="card text-center">
            <div class="card-body">
              <div class="card-icon">
                <i class="fas fa-pencil-square"></i>
              </div>
              <h5 class="card-title">إدخال نتائج</h5>
            </div>
          </div>
        </a>
      </div>
      <div class="col-md-4 mb-4">
        <a href="/pages/reports-ar.html" class="card-link">
          <div class="card text-center">
            <div class="card-body">
              <div class="card-icon">
                <i class="fas fa-bar-chart"></i>
              </div>
              <h5 class="card-title">التقارير</h5>
            </div>
          </div>
        </a>
      </div>
      <div class="col-md-4 mb-4">
        <a href="/pages/tests-ar.html" class="card-link">
          <div class="card text-center">
            <div class="card-body">
              <div class="card-icon">
                <i class="fas fa-list-ul"></i>
              </div>
              <h5 class="card-title">إدارة التحاليل</h5>
            </div>
          </div>
        </a>
      </div>
      <div class="col-md-4 mb-4">
        <a href="/pages/users-ar.html" class="card-link">
          <div class="card text-center">
            <div class="card-body">
              <div class="card-icon">
                <i class="fas fa-users"></i>
              </div>
              <h5 class="card-title">إدارة المستخدمين</h5>
            </div>
          </div>
        </a>
      </div>
      <div class="col-md-4 mb-4">
        <a href="/pages/backup-ar.html" class="card-link">
          <div class="card text-center">
            <div class="card-body">
              <div class="card-icon">
                <i class="fas fa-save"></i>
              </div>
              <h5 class="card-title">النسخ الاحتياطي</h5>
            </div>
          </div>
        </a>
      </div>
    </div>
  `;
}

function renderManagerDashboard() {
  return `
    <div class="row">
      <!-- الإحصائيات -->
      <div class="col-md-4 mb-4">
        <div class="card stat-card bg-primary text-white">
          <div class="card-body text-center">
            <h5>إجمالي العينات اليوم</h5>
            <h2 id="todaySamples">0</h2>
          </div>
        </div>
      </div>
      <div class="col-md-4 mb-4">
        <div class="card stat-card bg-success text-white">
          <div class="card-body text-center">
            <h5>الإيرادات اليوم</h5>
            <h2 id="todayRevenue">0 ج.م</h2>
          </div>
        </div>
      </div>
      <div class="col-md-4 mb-4">
        <div class="card stat-card bg-info text-white">
          <div class="card-body text-center">
            <h5>العينات المعلقة</h5>
            <h2 id="pendingSamples">0</h2>
          </div>
        </div>
      </div>
    </div>

    <h3 class="section-title">الإجراءات السريعة</h3>
    <div class="row">
      <div class="col-md-4 mb-4">
        <a href="/pages/reports-ar.html" class="card-link">
          <div class="card text-center">
            <div class="card-body">
              <div class="card-icon">
                <i class="fas fa-chart-bar"></i>
              </div>
              <h5 class="card-title">التقارير المالية</h5>
            </div>
          </div>
        </a>
      </div>
      <div class="col-md-4 mb-4">
        <a href="/pages/operational-reports-ar.html" class="card-link">
          <div class="card text-center">
            <div class="card-body">
              <div class="card-icon">
                <i class="fas fa-tasks"></i>
              </div>
              <h5 class="card-title">التقارير التشغيلية</h5>
            </div>
          </div>
        </a>
      </div>
      <div class="col-md-4 mb-4">
        <a href="/pages/tests-ar.html" class="card-link">
          <div class="card text-center">
            <div class="card-body">
              <div class="card-icon">
                <i class="fas fa-vial"></i>
              </div>
              <h5 class="card-title">إدارة التحاليل</h5>
            </div>
          </div>
        </a>
      </div>
    </div>
  `;
}

function renderLabTechDashboard() {
  return `
    <div class="row">
      <div class="col-md-6 mb-4">
        <div class="card stat-card bg-danger text-white">
          <div class="card-body text-center">
            <h5>العينات المطلوب إدخالها</h5>
            <h2 id="pendingSamplesCount">0</h2>
          </div>
        </div>
      </div>
      <div class="col-md-6 mb-4">
        <div class="card stat-card bg-success text-white">
          <div class="card-body text-center">
            <h5>العينات المكتملة اليوم</h5>
            <h2 id="completedToday">0</h2>
          </div>
        </div>
      </div>
    </div>

    <h3 class="section-title">الإجراءات السريعة</h3>
	<div class="row">
      <div class="col-md-6 mb-4">
        <a href="/pages/sample-register-ar.html" class="card-link">
          <div class="card text-center">
            <div class="card-body">
              <div class="card-icon">
                <i class="fas fa-plus-circle"></i>
              </div>
              <h5 class="card-title">تسجيل عينة جديدة</h5>
            </div>
          </div>
        </a>
      </div>
    
      <div class="col-md-6 mb-4">
        <a href="/pages/results-entry-ar.html" class="card-link">
          <div class="card text-center">
            <div class="card-body">
              <div class="card-icon">
                <i class="fas fa-pencil-square"></i>
              </div>
              <h5 class="card-title">إدخال نتائج التحاليل</h5>
            </div>
          </div>
        </a>
      </div>
	  
      <div class="col-md-6 mb-4">
        <a href="/pages/sample-search-ar.html" class="card-link">
          <div class="card text-center">
            <div class="card-body">
              <div class="card-icon">
                <i class="fas fa-search"></i>
              </div>
              <h5 class="card-title">البحث عن عينة</h5>
            </div>
          </div>
        </a>
      </div>
    </div>
  `;
}

function renderReceptionistDashboard() {
  return `
    <div class="row">
      <div class="col-md-6 mb-4">
        <div class="card stat-card bg-primary text-white">
          <div class="card-body text-center">
            <h5>العينات المسجلة اليوم</h5>
            <h2 id="todayRegistered">0</h2>
          </div>
        </div>
      </div>
      <div class="col-md-6 mb-4">
        <div class="card stat-card bg-info text-white">
          <div class="card-body text-center">
            <h5>العينات المعلقة</h5>
            <h2 id="pendingSamples">0</h2>
          </div>
        </div>
      </div>
    </div>

    <h3 class="section-title">الإجراءات السريعة</h3>
    <div class="row">
      <div class="col-md-6 mb-4">
        <a href="/pages/sample-register-ar.html" class="card-link">
          <div class="card text-center">
            <div class="card-body">
              <div class="card-icon">
                <i class="fas fa-plus-circle"></i>
              </div>
              <h5 class="card-title">تسجيل عينة جديدة</h5>
            </div>
          </div>
        </a>
      </div>
      <div class="col-md-6 mb-4">
        <a href="/pages/sample-search-ar.html" class="card-link">
          <div class="card text-center">
            <div class="card-body">
              <div class="card-icon">
                <i class="fas fa-search"></i>
              </div>
              <h5 class="card-title">البحث عن عينة</h5>
            </div>
          </div>
        </a>
      </div>
    </div>
  `;
}

function renderAccountantDashboard() {
  return `
    <div class="row">
      <div class="col-md-4 mb-4">
        <div class="card stat-card bg-success text-white">
          <div class="card-body text-center">
            <h5>الإيرادات اليوم</h5>
            <h2 id="dailyRevenue">0 ج.م</h2>
          </div>
        </div>
      </div>
      <div class="col-md-4 mb-4">
        <div class="card stat-card bg-info text-white">
          <div class="card-body text-center">
            <h5>الإيرادات هذا الأسبوع</h5>
            <h2 id="weeklyRevenue">0 ج.م</h2>
          </div>
        </div>
      </div>
      <div class="col-md-4 mb-4">
        <div class="card stat-card bg-primary text-white">
          <div class="card-body text-center">
            <h5>إجمالي العينات اليوم</h5>
            <h2 id="todaySamples">0</h2>
          </div>
        </div>
      </div>
    </div>

    <h3 class="section-title">الإجراءات السريعة</h3>
    <div class="row">
      <div class="col-md-6 mb-4">
        <a href="/pages/reports-ar.html" class="card-link">
          <div class="card text-center">
            <div class="card-body">
              <div class="card-icon">
                <i class="fas fa-cash"></i>
              </div>
              <h5 class="card-title">التقارير المالية</h5>
            </div>
          </div>
        </a>
      </div>
      <div class="col-md-6 mb-4">
        <a href="/pages/operational-reports-ar.html" class="card-link">
          <div class="card text-center">
            <div class="card-body">
              <div class="card-icon">
                <i class="fas fa-file-invoice"></i>
              </div>
              <h5 class="card-title">تقارير المحاسبة</h5>
            </div>
          </div>
        </a>
      </div>
    </div>
  `;
}

// === تحميل البيانات ===

async function loadAdminStats() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // العينات اليوم
    const samplesRes = await fetch(`/api/samples/count?date=${today}`, { headers: authHeader() });
    const samplesData = await samplesRes.json();
    document.getElementById('todaySamples').textContent = samplesData.count || 0;

    // الإيرادات اليوم
    const revenueRes = await fetch(`/api/reports/financial?start=${today}&end=${today}`, { headers: authHeader() });
    const revenueData = await revenueRes.json();
    const total = revenueData.reduce((sum, item) => sum + (item.total_revenue || 0), 0);
    document.getElementById('todayRevenue').textContent = `${total.toFixed(2)} ج.م`;

    // العينات المعلقة
    const pendingRes = await fetch('/api/samples/pending/count', { headers: authHeader() });
    const pendingData = await pendingRes.json();
    document.getElementById('pendingSamples').textContent = pendingData.count || 0;

    // عدد المستخدمين
    const usersRes = await fetch('/api/users/count', { headers: authHeader() });
    const usersData = await usersRes.json();
    document.getElementById('totalUsers').textContent = usersData.count || 0;

  } catch (err) {
    console.error('فشل تحميل الإحصائيات:', err);
  }
}

async function loadManagerStats() {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // العينات اليوم
    const samplesRes = await fetch(`/api/samples/count?date=${today}`, { headers: authHeader() });
    const samplesData = await samplesRes.json();
    document.getElementById('todaySamples').textContent = samplesData.count || 0;

    // الإيرادات اليوم
    const revenueRes = await fetch(`/api/reports/financial?start=${today}&end=${today}`, { headers: authHeader() });
    const revenueData = await revenueRes.json();
    const total = revenueData.reduce((sum, item) => sum + (item.total_revenue || 0), 0);
    document.getElementById('todayRevenue').textContent = `${total.toFixed(2)} ج.م`;

    // العينات المعلقة
    const pendingRes = await fetch('/api/samples/pending/count', { headers: authHeader() });
    const pendingData = await pendingRes.json();
    document.getElementById('pendingSamples').textContent = pendingData.count || 0;

  } catch (err) {
    console.error('فشل تحميل الإحصائيات:', err);
  }
}

async function loadPendingSamplesCount() {
  try {
    const res = await fetch('/api/samples/pending/count', { headers: authHeader() });
    const data = await res.json();
    document.getElementById('pendingSamplesCount').textContent = data.count || 0;
  } catch (err) {
    console.error('فشل تحميل عدد العينات المعلقة:', err);
  }
}

async function loadTodaySamplesCount() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`/api/samples/count?date=${today}`, { headers: authHeader() });
    const data = await res.json();
    document.getElementById('todayRegistered').textContent = data.count || 0;
  } catch (err) {
    console.error('فشل تحميل عدد العينات اليوم:', err);
  }
}

async function loadFinancialStats() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // اليوم
    const todayRes = await fetch(`/api/reports/financial?start=${today}&end=${today}`, { headers: authHeader() });
    const todayData = await todayRes.json();
    const todayTotal = todayData.reduce((sum, item) => sum + (item.total_revenue || 0), 0);
    document.getElementById('dailyRevenue').textContent = `${todayTotal.toFixed(2)} ج.م`;

    // الأسبوع
    const weekRes = await fetch(`/api/reports/financial?start=${weekAgo}&end=${today}`, { headers: authHeader() });
    const weekData = await weekRes.json();
    const weekTotal = weekData.reduce((sum, item) => sum + (item.total_revenue || 0), 0);
    document.getElementById('weeklyRevenue').textContent = `${weekTotal.toFixed(2)} ج.م`;

    // العينات اليوم
    const samplesRes = await fetch(`/api/samples/count?date=${today}`, { headers: authHeader() });
    const samplesData = await samplesRes.json();
    document.getElementById('todaySamples').textContent = samplesData.count || 0;

  } catch (err) {
    console.error('فشل تحميل الإحصائيات المالية:', err);
  }
}

// دالة مساعدة للتوثيق
function authHeader() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  const authData = checkAuth();
  if (authData) {
    loadDashboardByRole(authData.role);
  }
});