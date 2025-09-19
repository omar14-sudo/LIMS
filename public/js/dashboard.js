// public/js/dashboard.js

// تحقق من تسجيل الدخول
function checkAuth() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const fullName = localStorage.getItem('fullName');

  if (!token || !role) {
    alert('يجب تسجيل الدخول أولاً');
    window.location.href = '/pages/login-ar.html';
    return false;
  }

  document.getElementById('userFullName').textContent = fullName || 'مستخدم';
  document.getElementById('userRoleDisplay').textContent = getRoleName(role);

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

  switch(role) {
    case 'admin':
    case 'manager':
      content.innerHTML = renderAdminDashboard();
      loadAdminStats();
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
        <a href="/pages/sample-register-ar.html" class="btn btn-outline-primary quick-action-btn w-100">
          <i class="bi bi-plus-circle"></i> تسجيل عينة جديدة
        </a>
      </div>
      <div class="col-md-4 mb-4">
        <a href="/pages/results-entry-ar.html" class="btn btn-outline-success quick-action-btn w-100">
          <i class="bi bi-pencil-square"></i> إدخال نتائج
        </a>
      </div>
      <div class="col-md-4 mb-4">
        <a href="/pages/reports-ar.html" class="btn btn-outline-info quick-action-btn w-100">
          <i class="bi bi-bar-chart"></i> التقارير
        </a>
      </div>
      <div class="col-md-4 mb-4">
        <a href="/pages/tests-ar.html" class="btn btn-outline-secondary quick-action-btn w-100">
          <i class="bi bi-list-ul"></i> إدارة التحاليل
        </a>
      </div>
      <div class="col-md-4 mb-4">
        <a href="/pages/users-ar.html" class="btn btn-outline-dark quick-action-btn w-100">
          <i class="bi bi-people"></i> إدارة المستخدمين
        </a>
      </div>
    </div>
  `;
}

function renderLabTechDashboard() {
  return `
    <div class="row">
      <div class="col-md-4 mb-4">
        <div class="card stat-card bg-danger text-white">
          <div class="card-body text-center">
            <h5>العينات المطلوب إدخالها</h5>
            <h2 id="pendingSamplesCount">0</h2>
          </div>
        </div>
      </div>
    </div>

    <h3 class="section-title">الإجراءات السريعة</h3>
    <div class="row">
      <div class="col-md-6 mb-4">
        <a href="/pages/results-entry-ar.html" class="btn btn-outline-success quick-action-btn w-100">
          <i class="bi bi-pencil-square"></i> إدخال نتائج التحاليل
        </a>
      </div>
      <div class="col-md-6 mb-4">
        <a href="/pages/sample-register-ar.html" class="btn btn-outline-primary quick-action-btn w-100">
          <i class="bi bi-search"></i> البحث عن عينة
        </a>
      </div>
    </div>
  `;
}

function renderReceptionistDashboard() {
  return `
    <div class="row">
      <div class="col-md-4 mb-4">
        <div class="card stat-card bg-primary text-white">
          <div class="card-body text-center">
            <h5>العينات المسجلة اليوم</h5>
            <h2 id="todayRegistered">0</h2>
          </div>
        </div>
      </div>
    </div>

    <h3 class="section-title">الإجراءات السريعة</h3>
    <div class="row">
      <div class="col-md-6 mb-4">
        <a href="/pages/sample-register-ar.html" class="btn btn-outline-primary quick-action-btn w-100">
          <i class="bi bi-plus-circle"></i> تسجيل عينة جديدة
        </a>
      </div>
      <div class="col-md-6 mb-4">
        <a href="/pages/sample-search-ar.html" class="btn btn-outline-info quick-action-btn w-100">
          <i class="bi bi-search"></i> البحث عن عينة
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
    </div>

    <h3 class="section-title">الإجراءات