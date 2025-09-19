// public/js/dashboard.bundle.js

document.addEventListener('DOMContentLoaded', function() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const fullName = localStorage.getItem('fullName');

  if (!token || !role) {
    alert('يجب تسجيل الدخول أولاً');
    window.location.href = '/pages/login-ar.html';
    return;
  }

  // عرض اسم المستخدم في الهيدر
  const headerUserName = document.getElementById('headerUserName');
  if (headerUserName) {
    headerUserName.innerHTML = `<i class="fas fa-user me-1"></i> ${fullName || 'مستخدم'}`;
  }

  // عرض الدور في مكان مخصص
  const roleDisplay = document.getElementById('userRoleDisplay');
  if (roleDisplay) {
    roleDisplay.textContent = getRoleName(role);
  }

  // تحميل لوحة التحكم المناسبة حسب الدور
  const dashboardContent = document.getElementById('dashboardContent');
  if (dashboardContent) {
    loadDashboardByRole(role, dashboardContent);
  }
});

// ============== الدوال ==============

// تحويل اسم الدور للعربية
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
  localStorage.clear();
  window.location.href = '/pages/login-ar.html';
}

// تحميل لوحة التحكم حسب الدور
function loadDashboardByRole(role, container) {
  switch(role) {
    case 'admin':
    case 'manager':
      container.innerHTML = renderAdminDashboard();
      break;
    case 'lab_technician':
      container.innerHTML = renderLabTechDashboard();
      break;
    case 'receptionist':
      container.innerHTML = renderReceptionistDashboard();
      break;
    case 'accountant':
      container.innerHTML = renderAccountantDashboard();
      break;
    default:
      container.innerHTML = '<div class="alert alert-warning text-center">لا توجد صلاحيات كافية</div>';
  }
}

// ============== لوحات التحكم ==============

function renderAdminDashboard() {
  return `
    <div class="row g-4">
      <div class="col-md-3">
        <div class="card stat-card bg-primary text-white shadow">
          <div class="card-body text-center">
            <h6>إجمالي العينات اليوم</h6>
            <h2 id="todaySamples">0</h2>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card stat-card bg-success text-white shadow">
          <div class="card-body text-center">
            <h6>الإيرادات اليوم</h6>
            <h2 id="todayRevenue">0 ج.م</h2>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card stat-card bg-info text-white shadow">
          <div class="card-body text-center">
            <h6>العينات المعلقة</h6>
            <h2 id="pendingSamples">0</h2>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card stat-card bg-warning text-white shadow">
          <div class="card-body text-center">
            <h6>عدد المستخدمين</h6>
            <h2 id="totalUsers">0</h2>
          </div>
        </div>
      </div>
    </div>

    <h3 class="section-title mt-4">الإجراءات السريعة</h3>
    <div class="row g-3">
      <div class="col-md-4"><a href="/pages/sample-register-ar.html" class="btn btn-outline-primary w-100"><i class="fas fa-plus-circle"></i> تسجيل عينة جديدة</a></div>
      <div class="col-md-4"><a href="/pages/results-entry-ar.html" class="btn btn-outline-success w-100"><i class="fas fa-pen-square"></i> إدخال نتائج</a></div>
      <div class="col-md-4"><a href="/pages/reports-ar.html" class="btn btn-outline-info w-100"><i class="fas fa-chart-bar"></i> التقارير</a></div>
      <div class="col-md-4"><a href="/pages/tests-ar.html" class="btn btn-outline-secondary w-100"><i class="fas fa-vial"></i> إدارة التحاليل</a></div>
      <div class="col-md-4"><a href="/pages/users-ar.html" class="btn btn-outline-dark w-100"><i class="fas fa-users"></i> إدارة المستخدمين</a></div>
    </div>
  `;
}

function renderLabTechDashboard() {
  return `
    <div class="card bg-danger text-white shadow mb-4">
      <div class="card-body text-center">
        <h6>العينات المطلوب إدخالها</h6>
        <h2 id="pendingSamplesCount">0</h2>
      </div>
    </div>
    <h3 class="section-title">الإجراءات السريعة</h3>
    <div class="row g-3">
      <div class="col-md-6"><a href="/pages/results-entry-ar.html" class="btn btn-outline-success w-100"><i class="fas fa-pen"></i> إدخال نتائج التحاليل</a></div>
      <div class="col-md-6"><a href="/pages/sample-search-ar.html" class="btn btn-outline-primary w-100"><i class="fas fa-search"></i> البحث عن عينة</a></div>
    </div>
  `;
}

function renderReceptionistDashboard() {
  return `
    <div class="card bg-primary text-white shadow mb-4">
      <div class="card-body text-center">
        <h6>العينات المسجلة اليوم</h6>
        <h2 id="todayRegistered">0</h2>
      </div>
    </div>
    <h3 class="section-title">الإجراءات السريعة</h3>
    <div class="row g-3">
      <div class="col-md-6"><a href="/pages/sample-register-ar.html" class="btn btn-outline-primary w-100"><i class="fas fa-plus-circle"></i> تسجيل عينة جديدة</a></div>
      <div class="col-md-6"><a href="/pages/sample-search-ar.html" class="btn btn-outline-info w-100"><i class="fas fa-search"></i> البحث عن عينة</a></div>
    </div>
  `;
}

function renderAccountantDashboard() {
  return `
    <div class="row g-4">
      <div class="col-md-6">
        <div class="card bg-success text-white shadow">
          <div class="card-body text-center">
            <h6>الإيرادات اليوم</h6>
            <h2 id="dailyRevenue">0 ج.م</h2>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card bg-info text-white shadow">
          <div class="card-body text-center">
            <h6>الإيرادات هذا الأسبوع</h6>
            <h2 id="weeklyRevenue">0 ج.م</h2>
          </div>
        </div>
      </div>
    </div>
  `;
}
