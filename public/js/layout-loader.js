// public/js/layout-loader.js

document.addEventListener('DOMContentLoaded', function() {
  // تحميل الهيدر
  fetch('/partials/header-ar.html')
    .then(response => response.text())
    .then(html => {
      const headerContainer = document.getElementById('header-container');
      if (headerContainer) {
        headerContainer.innerHTML = html;
        
        // ⬇️ الجديد: شغل كود الوقت واسم المستخدم بعد ما الهيدر يتحط
        initializeHeaderComponents();
      }
    })
    .catch(error => {
      console.error('فشل تحميل الهيدر:', error);
    });

  // تحميل الفوتر
  fetch('/partials/footer-ar.html')
    .then(response => response.text())
    .then(html => {
      const footerContainer = document.getElementById('footer-container');
      if (footerContainer) {
        footerContainer.innerHTML = html;
      }
    })
    .catch(error => {
      console.error('فشل تحميل الفوتر:', error);
    });

  // ⬇️ الجديد: شغل كود الداشبورد بعد ما الهيدر يتحط
  setTimeout(() => {
    if (typeof loadDashboardByRole === 'function') {
      const role = localStorage.getItem('role');
      if (role) {
        loadDashboardByRole(role);
      }
    }
  }, 100);
});

// ⬇️ الجديد: دالة تهيئة مكونات الهيدر
function initializeHeaderComponents() {
  // تحديث الوقت والتاريخ
  function updateDateTime() {
    const now = new Date();
    const optionsDate = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    
    const dateElement = document.getElementById('currentDate');
    const timeElement = document.getElementById('currentTime');
    
    if (dateElement) dateElement.textContent = now.toLocaleDateString('ar-EG', optionsDate);
    if (timeElement) timeElement.textContent = now.toLocaleTimeString('ar-EG', optionsTime);
  }

  // تحميل اسم المستخدم
  function loadHeaderUserInfo() {
    const fullName = localStorage.getItem('fullName');
    const userNameElement = document.getElementById('userFullName');
    const roleElement = document.getElementById('userRoleDisplay');
    
    if (userNameElement && fullName) {
      userNameElement.textContent = fullName;
    } else if (userNameElement) {
      userNameElement.textContent = 'جار التحميل...';
    }
    
    // لو في عنصر للدور في الهيدر — نحطه
    if (roleElement) {
      const role = localStorage.getItem('role');
      if (role) {
        roleElement.textContent = getRoleName(role);
      }
    }
  }
  
  


  // تسجيل الخروج
  const logoutBtn = document.getElementById('headerLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('fullName');
      window.location.href = '/pages/login-ar.html';
    });
  }

  // تشغيل التحديثات
  loadHeaderUserInfo(); // ← هنا بنشغل تحميل اسم المستخدم
  updateDateTime();
  setInterval(updateDateTime, 1000);
}

