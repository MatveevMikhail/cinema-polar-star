// =====================================================
// Главная страница: афиша фильмов
// =====================================================

let allMovies = []; // здесь храним фильмы, полученные с сервера

// Нарисовать карточки фильмов в блоке #movies
function renderMovies(movies) {
  const container = document.getElementById('movies');

  if (movies.length === 0) {
    container.innerHTML = '<p>Фильмы не найдены</p>';
    return;
  }

  let html = '';
  for (const movie of movies) {
    html += `
      <div class="card">
        <div class="poster" style="background-color: ${movie.color}">${movie.title}</div>
        <div class="card-body">
          <h3>${movie.title}</h3>
          <p class="muted">${movie.genre} · ${movie.duration} мин · ${movie.age}</p>
          <a class="btn" href="movie.html?id=${movie.id}">Сеансы и билеты</a>
        </div>
      </div>`;
  }
  container.innerHTML = html;
}

// Заполнить выпадающий список жанров
function fillGenres(movies) {
  const select = document.getElementById('genre');
  const genres = [];
  for (const movie of movies) {
    if (!genres.includes(movie.genre)) genres.push(movie.genre);
  }
  for (const genre of genres) {
    select.innerHTML += `<option value="${genre}">${genre}</option>`;
  }
}

// Фильтр по жанру (без запроса к серверу — фильтруем уже загруженный массив)
function filterMovies() {
  const genre = document.getElementById('genre').value;
  if (genre === 'all') {
    renderMovies(allMovies);
  } else {
    renderMovies(allMovies.filter((m) => m.genre === genre));
  }
}

// Загрузка фильмов при открытии страницы: GET /api/movies
async function loadMovies() {
  try {
    allMovies = await request('/api/movies');
    fillGenres(allMovies);
    renderMovies(allMovies);
  } catch (error) {
    document.getElementById('movies').innerHTML = '<p>Не удалось загрузить афишу</p>';
  }
}

document.getElementById('genre').addEventListener('change', filterMovies);
loadMovies();
