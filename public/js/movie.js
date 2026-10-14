// =====================================================
// Страница фильма: описание, сеансы, бронирование
// =====================================================

// Берём id фильма из адреса страницы: movie.html?id=3
const params = new URLSearchParams(window.location.search);
const movieId = params.get('id');

let selectedSessionId = null; // выбранный сеанс

// Показать информацию о фильме
function renderMovie(movie) {
  document.title = movie.title + ' — Полярная звезда';
  document.getElementById('movie').innerHTML = `
    <div class="poster poster-big" style="background-color: ${movie.color}">${movie.title}</div>
    <div>
      <h1>${movie.title}</h1>
      <p class="muted">${movie.genre} · ${movie.year} · ${movie.duration} мин · ${movie.age}</p>
      <p>${movie.description}</p>
    </div>`;
}

// Показать сеансы в виде кнопок
function renderSessions(sessions) {
  const container = document.getElementById('sessions');
  let html = '';
  for (const s of sessions) {
    html += `
      <button class="session" onclick="selectSession(${s.id}, this)">
        <b>${formatDate(s.date)} ${s.time}</b><br>
        ${s.hall} · ${s.price} ₽<br>
        <span class="muted">свободно: ${s.freeSeats}</span>
      </button>`;
  }
  container.innerHTML = html;
}

// Клик по сеансу: запоминаем его и подсвечиваем кнопку
function selectSession(id, button) {
  selectedSessionId = id;
  document.querySelectorAll('.session').forEach((b) => b.classList.remove('active'));
  button.classList.add('active');
  document.getElementById('booking-message').textContent = '';
}

// Бронирование: POST /api/bookings
async function bookTickets(event) {
  event.preventDefault(); // не перезагружать страницу при отправке формы
  const message = document.getElementById('booking-message');
  message.className = 'message';  // по умолчанию — красный текст ошибки
  const user = getUser();

  if (!user) {
    message.innerHTML = 'Чтобы забронировать билеты, <a href="login.html">войдите</a>';
    return;
  }
  if (!selectedSessionId) {
    message.textContent = 'Выберите сеанс';
    return;
  }

  const seats = Number(document.getElementById('seats').value);
  try {
    await request('/api/bookings', 'POST', {
      userId: user.id,
      sessionId: selectedSessionId,
      seats: seats,
    });
    message.className = 'message success'; // зелёный текст
    message.innerHTML = 'Билеты забронированы! Смотрите их в <a href="profile.html">личном кабинете</a>';
    loadSessions(); // обновляем число свободных мест
    selectedSessionId = null;
  } catch (error) {
    message.textContent = error.message;
  }
}

// Загрузка сеансов: GET /api/sessions?movieId=...
async function loadSessions() {
  const sessions = await request('/api/sessions?movieId=' + movieId);
  renderSessions(sessions);
}

// Загрузка фильма: GET /api/movies/:id
async function loadMovie() {
  try {
    const movie = await request('/api/movies/' + movieId);
    renderMovie(movie);
    await loadSessions();
  } catch (error) {
    document.getElementById('movie').innerHTML = '<p>Фильм не найден</p>';
  }
}

document.getElementById('booking-form').addEventListener('submit', bookTickets);
loadMovie();
