// =====================================================
// Личный кабинет: мои бронирования
// =====================================================

const user = getUser();

// Если пользователь не вошёл — отправляем на страницу входа
if (!user) {
  window.location.href = 'login.html';
}

// Нарисовать таблицу бронирований
function renderBookings(bookings) {
  const tbody = document.getElementById('bookings');

  if (bookings.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">У вас пока нет бронирований</td></tr>';
    return;
  }

  let html = '';
  for (const b of bookings) {
    html += `
      <tr>
        <td>${b.movieTitle}</td>
        <td>${formatDate(b.date)} ${b.time}</td>
        <td>${b.hall}</td>
        <td><input type="number" id="seats-${b.id}" value="${b.seats}" min="1" max="10"></td>
        <td>${b.price * b.seats} ₽</td>
        <td>
          <button class="btn" onclick="changeBooking(${b.id})">Изменить</button>
          <button class="btn btn-danger" onclick="cancelBooking(${b.id})">Отменить</button>
        </td>
      </tr>`;
  }
  tbody.innerHTML = html;
}

// Загрузка бронирований: GET /api/bookings?userId=...
async function loadBookings() {
  const bookings = await request('/api/bookings?userId=' + user.id);
  renderBookings(bookings);
}

// Изменить количество мест: PUT /api/bookings/:id
async function changeBooking(id) {
  const seats = Number(document.getElementById('seats-' + id).value);
  try {
    await request('/api/bookings/' + id, 'PUT', { seats });
    loadBookings();
  } catch (error) {
    alert(error.message);
  }
}

// Отменить бронирование: DELETE /api/bookings/:id
async function cancelBooking(id) {
  if (!confirm('Отменить бронирование?')) return;
  await request('/api/bookings/' + id, 'DELETE');
  loadBookings();
}

if (user) {
  document.getElementById('user-name').textContent = user.name;
  loadBookings();
}
