// =====================================================
// Сервер сайта кинотеатра «Полярная звезда»
// Node.js + Express, данные хранятся в JSON-файлах
// =====================================================

const express = require('express'); // фреймворк для веб-сервера
const fs = require('fs');           // встроенный модуль для работы с файлами
const path = require('path');       // встроенный модуль для работы с путями

const app = express();
const PORT = 3000;

// Middleware: разбирать JSON из тела запроса (req.body)
app.use(express.json());
// Раздавать файлы сайта (html, css, js) из папки public
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Вспомогательные функции для JSON-файлов ----------

// Прочитать файл data/<name>.json и вернуть массив объектов
function readData(name) {
  const filePath = path.join(__dirname, 'data', name + '.json');
  const text = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(text);
}

// Записать массив объектов в файл data/<name>.json
function writeData(name, data) {
  const filePath = path.join(__dirname, 'data', name + '.json');
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Новый id = максимальный id в массиве + 1
function nextId(items) {
  let max = 0;
  for (const item of items) {
    if (item.id > max) max = item.id;
  }
  return max + 1;
}

// =====================================================
// АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ
// =====================================================

// POST /api/register — регистрация нового пользователя
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Заполните все поля' });
  }

  const users = readData('users');

  // Проверяем, что такого email ещё нет
  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ message: 'Пользователь с таким email уже есть' });
  }

  const newUser = { id: nextId(users), name, email, password };
  users.push(newUser);
  writeData('users', users);

  // Пароль обратно не отправляем
  res.status(201).json({ id: newUser.id, name: newUser.name, email: newUser.email });
});

// POST /api/login — вход по email и паролю
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Введите email и пароль' });
  }

  const users = readData('users');
  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ message: 'Неверный email или пароль' });
  }

  res.json({ id: user.id, name: user.name, email: user.email });
});

// =====================================================
// ФИЛЬМЫ И СЕАНСЫ (GET)
// =====================================================

// GET /api/movies — список всех фильмов
app.get('/api/movies', (req, res) => {
  res.json(readData('movies'));
});

// GET /api/movies/:id — один фильм по id
app.get('/api/movies/:id', (req, res) => {
  const id = Number(req.params.id);
  const movie = readData('movies').find((m) => m.id === id);

  if (!movie) {
    return res.status(404).json({ message: 'Фильм не найден' });
  }
  res.json(movie);
});

// GET /api/sessions?movieId=1 — сеансы фильма
app.get('/api/sessions', (req, res) => {
  const movieId = Number(req.query.movieId);
  const sessions = readData('sessions').filter((s) => s.movieId === movieId);
  res.json(sessions);
});

// =====================================================
// БРОНИРОВАНИЯ (GET, POST, PUT, DELETE)
// =====================================================

// GET /api/bookings?userId=1 — бронирования пользователя
app.get('/api/bookings', (req, res) => {
  const userId = Number(req.query.userId);
  const movies = readData('movies');
  const sessions = readData('sessions');

  // Берём брони пользователя и добавляем к ним данные сеанса и название фильма
  const result = readData('bookings')
    .filter((b) => b.userId === userId)
    .map((b) => {
      const session = sessions.find((s) => s.id === b.sessionId);
      const movie = movies.find((m) => m.id === session.movieId);
      return {
        id: b.id,
        seats: b.seats,
        movieTitle: movie.title,
        date: session.date,
        time: session.time,
        hall: session.hall,
        price: session.price,
      };
    });

  res.json(result);
});

// POST /api/bookings — создать бронирование
app.post('/api/bookings', (req, res) => {
  const userId = Number(req.body.userId);
  const sessionId = Number(req.body.sessionId);
  const seats = Number(req.body.seats);

  if (!userId || !sessionId || !seats || seats < 1) {
    return res.status(400).json({ message: 'Неверные данные бронирования' });
  }

  const sessions = readData('sessions');
  const session = sessions.find((s) => s.id === sessionId);

  if (!session) {
    return res.status(404).json({ message: 'Сеанс не найден' });
  }
  if (session.freeSeats < seats) {
    return res.status(400).json({ message: 'Недостаточно свободных мест' });
  }

  // Уменьшаем число свободных мест на сеансе
  session.freeSeats -= seats;
  writeData('sessions', sessions);

  const bookings = readData('bookings');
  const newBooking = { id: nextId(bookings), userId, sessionId, seats };
  bookings.push(newBooking);
  writeData('bookings', bookings);

  res.status(201).json(newBooking);
});

// PUT /api/bookings/:id — изменить количество мест в брони
app.put('/api/bookings/:id', (req, res) => {
  const id = Number(req.params.id);
  const seats = Number(req.body.seats);

  if (!seats || seats < 1) {
    return res.status(400).json({ message: 'Количество мест должно быть больше 0' });
  }

  const bookings = readData('bookings');
  const booking = bookings.find((b) => b.id === id);
  if (!booking) {
    return res.status(404).json({ message: 'Бронирование не найдено' });
  }

  const sessions = readData('sessions');
  const session = sessions.find((s) => s.id === booking.sessionId);

  // Разница: сколько мест добавили (+) или убрали (−)
  const difference = seats - booking.seats;
  if (difference > session.freeSeats) {
    return res.status(400).json({ message: 'Недостаточно свободных мест' });
  }

  session.freeSeats -= difference;
  booking.seats = seats;
  writeData('sessions', sessions);
  writeData('bookings', bookings);

  res.json(booking);
});

// DELETE /api/bookings/:id — отменить бронирование
app.delete('/api/bookings/:id', (req, res) => {
  const id = Number(req.params.id);
  const bookings = readData('bookings');
  const booking = bookings.find((b) => b.id === id);

  if (!booking) {
    return res.status(404).json({ message: 'Бронирование не найдено' });
  }

  // Возвращаем места на сеанс
  const sessions = readData('sessions');
  const session = sessions.find((s) => s.id === booking.sessionId);
  session.freeSeats += booking.seats;
  writeData('sessions', sessions);

  // Оставляем в массиве все брони, кроме удаляемой
  writeData('bookings', bookings.filter((b) => b.id !== id));

  res.json({ message: 'Бронирование отменено' });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сайт кинотеатра запущен: http://localhost:${PORT}`);
});
