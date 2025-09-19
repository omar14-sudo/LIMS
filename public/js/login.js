// public/js/login.js
document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const data = Object.fromEntries(formData);

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (result.token) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('role', result.role);
      alert('تم تسجيل الدخول بنجاح!');
      window.location.href = '/pages/dashboard-ar.html';
    } else {
      alert('خطأ في اسم المستخدم أو كلمة المرور');
    }
  } catch (err) {
    console.error(err);
    alert('حدث خطأ أثناء الاتصال بالسيرفر');
  }
});