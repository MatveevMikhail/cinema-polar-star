// =====================================================
// Страница входа и регистрации
// =====================================================

// Вход: POST /api/login
async function login(event) {
  event.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const user = await request('/api/login', 'POST', { email, password });
    saveUser(user);                         // запоминаем пользователя
    window.location.href = 'profile.html';  // переходим в личный кабинет
  } catch (error) {
    document.getElementById('login-message').textContent = error.message;
  }
}

// Регистрация: POST /api/register
async function register(event) {
  event.preventDefault();
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;

  try {
    const user = await request('/api/register', 'POST', { name, email, password });
    saveUser(user);                         // после регистрации сразу входим
    window.location.href = 'profile.html';
  } catch (error) {
    document.getElementById('reg-message').textContent = error.message;
  }
}

document.getElementById('login-form').addEventListener('submit', login);
document.getElementById('register-form').addEventListener('submit', register);
