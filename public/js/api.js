// =====================================================
// Общие функции для всех страниц сайта
// =====================================================

// Универсальная функция запроса к серверу.
// method — GET, POST, PUT, DELETE; body — объект с данными (необязательно)
async function request(url, method = 'GET', body = null) {
  const options = {
    method: method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body); // объект -> строка JSON
  }

  const response = await fetch(url, options);
  const data = await response.json(); // строка JSON -> объект

  // Если сервер вернул ошибку (статус не 2xx) — выбрасываем её с текстом от сервера
  if (!response.ok) {
    throw new Error(data.message);
  }
  return data;
}

// ---------- Текущий пользователь (хранится в localStorage) ----------

function getUser() {
  const text = localStorage.getItem('user');
  return text ? JSON.parse(text) : null;
}

function saveUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
}

function logout() {
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// В шапке показываем имя пользователя или ссылку «Войти»
function showUserInHeader() {
  const block = document.getElementById('user-block');
  const user = getUser();
  if (user) {
    block.innerHTML = `
      <a href="profile.html">${user.name}</a>
      <button class="btn-link" onclick="logout()">Выйти</button>`;
  }
}

// Дата "2026-10-20" -> "20.10.2026"
function formatDate(date) {
  return date.split('-').reverse().join('.');
}

// Запускаем, когда страница загрузилась
document.addEventListener('DOMContentLoaded', showUserInHeader);
