// public/js/login-logic.js

document.addEventListener('DOMContentLoaded', function() {

  // إظهار/إخفاء كلمة المرور
  const togglePassword = document.getElementById('togglePassword');
  if (togglePassword) {
    togglePassword.addEventListener('click', function() {
      const passwordInput = document.getElementById('password');
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      this.classList.toggle('fa-eye');
      this.classList.toggle('fa-eye-slash');
    });
  }

  // التحقق من صحة الحقول قبل الإرسال
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username')?.value.trim();
      const password = document.getElementById('password')?.value.trim();
      let isValid = true;

      // التحقق من اسم المستخدم
      const usernameError = document.getElementById('usernameError');
      if (username === '') {
        if (usernameError) usernameError.style.display = 'block';
        isValid = false;
      } else {
        if (usernameError) usernameError.style.display = 'none';
      }

      // التحقق من كلمة المرور
      const passwordError = document.getElementById('passwordError');
      if (password === '') {
        if (passwordError) passwordError.style.display = 'block';
        isValid = false;
      } else {
        if (passwordError) passwordError.style.display = 'none';
      }

      // إذا كانت البيانات صحيحة — نرسل الطلب
      if (isValid) {
        const formData = new FormData(this);
        const data = Object.fromEntries(formData);

        fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
          if (result.token) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('role', result.role);
            localStorage.setItem('fullName', result.fullName);
            window.location.href = '/pages/dashboard-ar.html';
          } else {
            alert('❌ خطأ في تسجيل الدخول: ' + (result.error || 'اسم المستخدم أو كلمة المرور غير صحيحة'));
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('❌ حدث خطأ أثناء الاتصال بالسيرفر');
        });
      }
    });
  }

});