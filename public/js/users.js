// public/js/users.js

let currentUser = null;

// تحقق من تسجيل الدخول
function checkAuth() {
  const token = localStorage.getItem('token');
  const fullName = localStorage.getItem('fullName');

  if (!token) {
    window.location.href = '/pages/login-ar.html';
    return false;
  }

  document.getElementById('userFullName').textContent = fullName || 'مستخدم';
  currentUser = { token, fullName };
  return true;
}

// تسجيل الخروج
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('fullName');
  window.location.href = '/pages/login-ar.html';
}

// جلب قائمة المستخدمين
async function loadUsers() {
  try {
    const response = await fetch('/api/users', {
      headers: {
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('فشل جلب قائمة المستخدمين');
    }

    const users = await response.json();
    displayUsers(users);
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('usersTableBody').innerHTML = `
      <tr>
        <td colspan="7" class="text-center text-danger">فشل تحميل المستخدمين: ${error.message}</td>
      </tr>
    `;
  }
}

// عرض المستخدمين في الجدول
function displayUsers(users) {
  const tableBody = document.getElementById('usersTableBody');
  tableBody.innerHTML = '';

  if (users.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center">لا يوجد مستخدمين مسجلين</td>
      </tr>
    `;
    return;
  }

  users.forEach((user, index) => {
    const row = document.createElement('tr');
    
    // تحديد لون الدور
    let roleClass = 'badge ';
    switch(user.role) {
      case 'admin': roleClass += 'role-admin'; break;
      case 'manager': roleClass += 'role-manager'; break;
      case 'lab_technician': roleClass += 'role-lab'; break;
      case 'receptionist': roleClass += 'role-reception'; break;
      case 'accountant': roleClass += 'role-accountant'; break;
      default: roleClass += 'bg-secondary';
    }

    // تحديد حالة الحساب
    const statusHtml = user.is_active ? 
      '<span class="status-active">نشط</span>' : 
      '<span class="status-inactive">معطل</span>';

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${user.username}</td>
      <td>${user.full_name}</td>
      <td><span class="role-badge ${roleClass}">${getRoleName(user.role)}</span></td>
      <td>${statusHtml}</td>
      <td>${new Date(user.created_at).toLocaleDateString('ar-EG')}</td>
      <td>
        <button class="btn btn-sm btn-warning action-btn edit-btn" data-id="${user.id}">
          <i class="fas fa-edit"></i> تعديل
        </button>
        <button class="btn btn-sm ${user.is_active ? 'btn-danger' : 'btn-success'} action-btn toggle-btn" 
                data-id="${user.id}" data-status="${user.is_active}">
          <i class="fas fa-${user.is_active ? 'times' : 'check'}"></i> ${user.is_active ? 'تعطيل' : 'تفعيل'}
        </button>
        ${user.username !== 'admin' ? 
          `<button class="btn btn-sm btn-danger action-btn delete-btn" data-id="${user.id}">
            <i class="fas fa-trash"></i> حذف
          </button>` : ''}
      </td>
    `;
    tableBody.appendChild(row);
  });

  // إضافة event listeners
  document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', function() {
      editUserModal(this.dataset.id);
    });
  });

  document.querySelectorAll('.toggle-btn').forEach(button => {
    button.addEventListener('click', function() {
      toggleUserStatus(this.dataset.id, this.dataset.status === 'true');
    });
  });

  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', function() {
      deleteUser(this.dataset.id);
    });
  });
}

// إضافة مستخدم جديد
async function addUser() {
  const form = document.getElementById('addUserForm');
  const formData = new FormData(form);
  const userData = Object.fromEntries(formData.entries());

  // التحقق من كلمة المرور
  if (userData.password.length < 6) {
    alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    return;
  }

  try {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'فشل إضافة المستخدم');
    }

    const newUser = await response.json();
    alert('✅ تم إضافة المستخدم بنجاح!');
    bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
    form.reset();
    loadUsers();
  } catch (error) {
    console.error('Error:', error);
    alert('❌ فشل إضافة المستخدم: ' + error.message);
  }
}

// فتح نافذة تعديل المستخدم
function editUserModal(userId) {
  // جلب بيانات المستخدم
  fetch(`/api/users/${userId}`, {
    headers: {
      'Authorization': `Bearer ${currentUser.token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => response.json())
  .then(user => {
    const form = document.getElementById('editUserForm');
    form.userId.value = user.id;
    form.username.value = user.username;
    form.fullName.value = user.full_name;
    form.role.value = user.role;
    document.getElementById('editIsActive').checked = user.is_active;
    
    // فتح النافذة
    const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
    modal.show();
  })
  .catch(error => {
    console.error('Error:', error);
    alert('فشل تحميل بيانات المستخدم');
  });
}

// تحديث المستخدم
async function updateUser() {
  const form = document.getElementById('editUserForm');
  const formData = new FormData(form);
  const userData = Object.fromEntries(formData.entries());

  // إذا لم يتم إدخال كلمة مرور جديدة، نحذف الحقل
  if (!userData.password) {
    delete userData.password;
  } else if (userData.password.length < 6) {
    alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    return;
  }

  try {
    const response = await fetch(`/api/users/${userData.userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'فشل تحديث المستخدم');
    }

    alert('✅ تم تحديث المستخدم بنجاح!');
    bootstrap.Modal.getInstance(document.getElementById('editUserModal')).hide();
    loadUsers();
  } catch (error) {
    console.error('Error:', error);
    alert('❌ فشل تحديث المستخدم: ' + error.message);
  }
}

// تفعيل/تعطيل المستخدم
async function toggleUserStatus(userId, currentStatus) {
  const newStatus = !currentStatus;
  const action = newStatus ? 'تفعيل' : 'تعطيل';
  
  if (!confirm(`هل أنت متأكد أنك تريد ${action} هذا الحساب؟`)) {
    return;
  }

  try {
    const response = await fetch(`/api/users/${userId}/toggle`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ is_active: newStatus })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'فشل تغيير حالة المستخدم');
    }

    alert(`✅ تم ${action} الحساب بنجاح!`);
    loadUsers();
  } catch (error) {
    console.error('Error:', error);
    alert(`❌ فشل ${action} الحساب: ` + error.message);
  }
}

// حذف المستخدم
async function deleteUser(userId) {
  if (!confirm('⚠️ تحذير: هل أنت متأكد أنك تريد حذف هذا المستخدم؟ هذه العملية لا يمكن التراجع عنها!')) {
    return;
  }

  try {
    const response = await fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'فشل حذف المستخدم');
    }

    alert('✅ تم حذف المستخدم بنجاح!');
    loadUsers();
  } catch (error) {
    console.error('Error:', error);
    alert('❌ فشل حذف المستخدم: ' + error.message);
  }
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

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  if (checkAuth()) {
    loadUsers();
    
    // ربط الأزرار
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('saveUserBtn').addEventListener('click', addUser);
    document.getElementById('updateUserBtn').addEventListener('click', updateUser);
  }
});