// ── Telegram WebApp init ──
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.expand();
  tg.ready();
}

// ── State ──
let selectedPackage = null;
const user = tg?.initDataUnsafe?.user || {};

// ── Screens ──
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id)?.classList.add('active');
  window.scrollTo(0, 0);
}

// ── MainButton helper ──
function setMainButton(text, onClick) {
  if (!tg) return;
  tg.MainButton.setText(text);
  tg.MainButton.show();
  tg.MainButton.offClick();
  tg.MainButton.onClick(onClick);
}
function hideMainButton() {
  if (tg) tg.MainButton.hide();
}

// ── BackButton helper ──
function setBackButton(onClick) {
  if (!tg) return;
  tg.BackButton.show();
  tg.BackButton.offClick();
  tg.BackButton.onClick(onClick);
}
function hideBackButton() {
  if (tg) tg.BackButton.hide();
}

// ── Haptic ──
function haptic(type) {
  if (tg?.HapticFeedback) {
    if (type === 'light') tg.HapticFeedback.impactOccurred('light');
    if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
    if (type === 'select') tg.HapticFeedback.selectionChanged();
  }
}

// ────────────────────────────────────────────
// SCREEN 1: HOME
// ────────────────────────────────────────────
function initHome() {
  hideBackButton();
  setMainButton('Записаться на диагностику — 29€', () => {
    haptic('light');
    goToServices();
  });
}

// ────────────────────────────────────────────
// SCREEN 2: SERVICES
// ────────────────────────────────────────────
const packages = [
  {
    id: 'diagnostics',
    name: 'Диагностика',
    price: '29€',
    features: [
      '60 мин с преподавателем',
      'Точный уровень CEFR (A1–C1)',
      'Личный план на 3 месяца',
      'Разбор ваших главных пробелов',
    ],
    popular: false,
  },
  {
    id: 'month',
    name: 'Месяц занятий',
    price: '149€',
    features: [
      '4 урока по 60 мин',
      'Домашние задания + AI-фидбек',
      'Доступ к материалам и словарям',
      '2 встречи в неделю по расписанию',
    ],
    popular: true,
  },
  {
    id: 'track',
    name: 'Стратегический трек 3 мес',
    price: '349€',
    features: [
      '12 уроков + AI-сопровождение',
      'Еженедельный отчёт о прогрессе',
      'Подготовка к экзамену (Goethe, TestDaF)',
      'Приоритетная связь с преподавателем',
    ],
    popular: false,
  },
];

function goToServices() {
  showScreen('services');

  const list = document.getElementById('packages-list');
  list.innerHTML = '';

  packages.forEach(pkg => {
    const card = document.createElement('div');
    card.className = 'package-card' + (pkg.popular ? ' popular' : '');
    card.dataset.id = pkg.id;

    card.innerHTML = `
      ${pkg.popular ? '<div class="popular-badge">★ Популярный</div>' : ''}
      <div class="package-name">${pkg.name}</div>
      <ul class="package-features">
        ${pkg.features.map(f => `<li>${f}</li>`).join('')}
      </ul>
      <div class="package-footer">
        <div class="package-price">${pkg.price}</div>
        <button class="package-select-btn" onclick="selectPackage('${pkg.id}')">Выбрать</button>
      </div>
    `;
    list.appendChild(card);
  });

  hideMainButton();
  setBackButton(() => {
    haptic('light');
    initHome();
    showScreen('home');
  });
}

function selectPackage(id) {
  haptic('select');
  selectedPackage = packages.find(p => p.id === id);

  document.querySelectorAll('.package-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.id === id);
  });

  setMainButton(`Выбрать: ${selectedPackage.name} — ${selectedPackage.price}`, () => {
    haptic('light');
    goToBooking();
  });
}

// ────────────────────────────────────────────
// SCREEN 3: BOOKING
// ────────────────────────────────────────────
function goToBooking() {
  showScreen('booking');

  // Pre-fill name from Telegram
  const nameInput = document.getElementById('input-name');
  if (nameInput && user.first_name) {
    nameInput.value = user.first_name + (user.last_name ? ' ' + user.last_name : '');
  }

  // Show selected package
  document.getElementById('selected-pkg-name').textContent = selectedPackage.name;
  document.getElementById('selected-pkg-price').textContent = selectedPackage.price;

  // Time option toggles
  document.querySelectorAll('.time-option').forEach(opt => {
    opt.addEventListener('click', () => {
      haptic('select');
      opt.classList.toggle('checked');
      const cb = opt.querySelector('.time-checkbox');
      cb.textContent = opt.classList.contains('checked') ? '✓' : '';
    });
  });

  setMainButton('Подтвердить запись →', () => {
    haptic('light');
    submitBooking();
  });

  setBackButton(() => {
    haptic('light');
    goToServices();
  });
}

function submitBooking() {
  const name = document.getElementById('input-name').value.trim();
  const email = document.getElementById('input-email').value.trim();
  const times = [...document.querySelectorAll('.time-option.checked')]
    .map(o => o.dataset.time).join(', ');

  if (!name) {
    if (tg) tg.showPopup({ message: 'Пожалуйста, введите ваше имя.' });
    return;
  }
  if (!email || !email.includes('@')) {
    if (tg) tg.showPopup({ message: 'Пожалуйста, введите корректный email.' });
    return;
  }
  if (!times) {
    if (tg) tg.showPopup({ message: 'Выберите хотя бы один удобный интервал.' });
    return;
  }

  // Send to Make webhook (замените URL на свой из Make.com)
  const MAKE_WEBHOOK = 'https://hook.eu1.make.com/ВСТАВЬТЕ_СВОЙ_ВЕБХУК';

  const payload = {
    name,
    email,
    package: selectedPackage.name,
    price: selectedPackage.price,
    times,
    comment: document.getElementById('input-comment').value.trim(),
    telegram_username: user.username || '',
    telegram_id: user.id || '',
  };

  if (tg) tg.MainButton.showProgress();

  fetch(MAKE_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(() => {
      haptic('success');
      goToConfirm(name);
    })
    .catch(() => {
      // Даже если вебхук не настроен — показываем подтверждение
      haptic('success');
      goToConfirm(name);
    })
    .finally(() => {
      if (tg) tg.MainButton.hideProgress();
    });
}

// ────────────────────────────────────────────
// SCREEN 4: CONFIRM
// ────────────────────────────────────────────
function goToConfirm(name) {
  showScreen('confirm');

  const firstName = name.split(' ')[0];
  document.getElementById('confirm-name').textContent = firstName + ', заявка принята!';
  document.getElementById('confirm-pkg').textContent = selectedPackage.name + ' — ' + selectedPackage.price;

  hideBackButton();
  setMainButton('Закрыть', () => {
    haptic('light');
    if (tg) tg.close();
  });
}

// ────────────────────────────────────────────
// INIT
// ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initHome();
});
