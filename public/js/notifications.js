// public/js/notifications.js

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

// جلب الإشعارات
async function loadNotifications() {
  try {
    const response = await fetch('/api/notifications', {
      headers: {
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('فشل جلب الإشعارات');
    }

    const notifications = await response.json();
    displayNotifications(notifications);
  } catch (error) {
    console.error('Error:', error);
    document.getElementById('notificationsContainer').innerHTML = `
      <div class="alert alert-danger text-center">
        فشل تحميل الإشعارات: ${error.message}
      </div>
    `;
  }
}

// عرض الإشعارات
function displayNotifications(notifications) {
  const container = document.getElementById('notificationsContainer');
  
  if (notifications.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-bell-slash"></i>
        <h3>لا توجد إشعارات</h3>
        <p>ستظهر هنا أي إشعارات جديدة تتعلق بالعينات أو المهام</p>
      </div>
    `;
    return;
  }

  container.innerHTML = notifications.map(notification => {
    let badgeClass = 'badge-info';
    let icon = 'fa-info-circle';
    let typeText = 'معلومات';
    
    switch(notification.type) {
      case 'warning':
        badgeClass = 'badge-warning';
        icon = 'fa-exclamation-triangle';
        typeText = 'تحذير';
        break;
      case 'urgent':
        badgeClass = 'badge-danger';
        icon = 'fa-bell';
        typeText = 'عاجل';
        break;
      case 'success':
        badgeClass = 'badge-success';
        icon = 'fa-check-circle';
        typeText = 'نجاح';
        break;
    }

    return `
      <div class="card notification-card" data-type="${notification.type}" data-read="${notification.is_read}">
        <div class="notification-header">
          <div>
            <span class="badge ${badgeClass}">${typeText}</span>
            <strong class="me-2">${notification.title}</strong>
          </div>
          <div class="actions">
            ${!notification.is_read ? 
              `<button class="btn btn-sm btn-outline-primary mark-btn" onclick="markAsRead(${notification.id})">
                <i class="fas fa-check"></i> تم
              </button>` : ''}
            <button class="btn btn-sm btn-outline-danger delete-btn" onclick="deleteNotification(${notification.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="notification-body">
          <p>${notification.message}</p>
        </div>
        <div class="notification-footer">
          <i class="fas fa-clock me-1"></i> ${new Date(notification.created_at).toLocaleString('ar-EG')}
          ${notification.is_read ? '<span class="badge bg-secondary ms-2">مقروء</span>' : ''}
        </div>
      </div>
    `;
  }).join('');
}

// تصفية الإشعارات
function filterNotifications(type) {
  if (type === 'all') {
    loadNotifications();
  } else {
    const cards = document.querySelectorAll('.notification-card');
    cards.forEach(card => {
      if (card.dataset.type === type) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }
}

// تمييز إشعار كمقروء
async function markAsRead(notificationId) {
  try {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('فشل تمييز الإشعار كمقروء');
    }

    // تحديث القائمة المحلية
    const notification = document.querySelector(`.notification-card[data-type][data-read="false"]`);
    if (notification) {
      notification.dataset.read = "true";
      const readBadge = notification.querySelector('.notification-footer').innerHTML += '<span class="badge bg-secondary ms-2">مقروء</span>';
      const markBtn = notification.querySelector('.mark-btn');
      if (markBtn) markBtn.style.display = 'none';
    }
    
  } catch (error) {
    console.error('Error:', error);
    alert('فشل تمييز الإشعار كمقروء: ' + error.message);
  }
}

// تمييز كل الإشعارات كمقروءة
async function markAllAsRead() {
  if (!confirm('هل أنت متأكد أنك تريد تمييز كل الإشعارات كمقروءة؟')) {
    return;
  }

  try {
    const response = await fetch('/api/notifications/read-all', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('فشل تمييز كل الإشعارات كمقروءة');
    }

    // تحديث القائمة المحلية
    const notifications = document.querySelectorAll('.notification-card');
    notifications.forEach(notification => {
      notification.dataset.read = "true";
      const footer = notification.querySelector('.notification-footer');
      if (footer) {
        footer.innerHTML += '<span class="badge bg-secondary ms-2">مقروء</span>';
      }
      const markBtn = notification.querySelector('.mark-btn');
      if (markBtn) markBtn.style.display = 'none';
    });
    
    alert('✅ تم تمييز كل الإشعارات كمقروءة');
    
  } catch (error) {
    console.error('Error:', error);
    alert('فشل تمييز كل الإشعارات كمقروءة: ' + error.message);
  }
}

// حذف إشعار
async function deleteNotification(notificationId) {
  if (!confirm('هل أنت متأكد أنك تريد حذف هذا الإشعار؟')) {
    return;
  }

  try {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('فشل حذف الإشعار');
    }

    // تحديث القائمة المحلية
    const notification = document.querySelector(`.notification-card[data-type][data-read]`);
    if (notification) {
      notification.remove();
    }
    
    // إعادة تحميل القائمة لو اتحذفت كل الإشعارات
    const remaining = document.querySelectorAll('.notification-card').length;
    if (remaining === 0) {
      loadNotifications();
    }
    
  } catch (error) {
    console.error('Error:', error);
    alert('فشل حذف الإشعار: ' + error.message);
  }
}

// مسح كل الإشعارات
async function clearAllNotifications() {
  if (!confirm('⚠️ تحذير: هل أنت متأكد أنك تريد مسح كل الإشعارات؟ هذه العملية لا يمكن التراجع عنها!')) {
    return;
  }

  try {
    const response = await fetch('/api/notifications/clear-all', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${currentUser.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('فشل مسح كل الإشعارات');
    }

    // تحديث القائمة المحلية
    document.getElementById('notificationsContainer').innerHTML = `
      <div class="empty-state">
        <i class="fas fa-bell-slash"></i>
        <h3>تم مسح كل الإشعارات</h3>
        <p>ستظهر هنا أي إشعارات جديدة تتعلق بالعينات أو المهام</p>
      </div>
    `;
    
    alert('✅ تم مسح كل الإشعارات بنجاح');
    
  } catch (error) {
    console.error('Error:', error);
    alert('فشل مسح كل الإشعارات: ' + error.message);
  }
}

// عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
  if (checkAuth()) {
    loadNotifications();
  }
});