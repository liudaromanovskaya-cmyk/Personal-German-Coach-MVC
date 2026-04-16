# ТЗ: UI-полировка и премиализация личного кабинета студента
*Персональный немецкий коучинг-кабинет — визуальный рефакторинг*
*Версия 1.0 — апрель 2026*

---

## 1. Цель и контекст

### Что это за продукт
Персональный кабинет студента немецкого языка. Преподаватель составляет задания, студент их выполняет, присылает записи и тексты, получает живой фидбек.

### Что нельзя сломать
- Всю логику (аккордеоны, вкладки, кнопки, Firebase) — не трогать
- Методическую структуру экранов — сохранить
- Ощущение персонального сопровождения преподавателя — это ядро продукта

### Что нужно сделать
Провести **визуальный рефакторинг** без изменения функциональности:
- Пересобрать design system (цвета, типографика, отступы, радиусы)
- Унифицировать карточки и кнопки
- Переработать первый экран вокруг одного главного фокуса
- Убрать визуальный шум, добавить воздух и иерархию

### Концепция стиля
> **Не** Duolingo, не корпоративная LMS, не игровое приложение.
> **Да**: личный кабинет премиального преподавателя — спокойный, профессиональный, тёплый, с интеллектуальной глубиной.

Ключевые слова стиля: **спокойно · точно · статусно · под контролем**

---

## 2. Design System: CSS-переменные

Заменить все текущие цветовые переменные в `:root` на следующую систему:

```css
:root {
  /* === ПОВЕРХНОСТИ === */
  --bg:              #F5F5F2;   /* основной фон страницы */
  --surface:         #FFFFFF;   /* фон карточек */
  --surface-soft:    #FAFAF8;   /* мягкий вторичный фон */
  --surface-tint:    #EAF1EC;   /* tinted фон (primary-tinted блоки) */
  --surface-lavender:#EEEDF8;   /* secondary soft accent (методические блоки) */

  /* === ОСНОВНОЙ ЦВЕТ (primary) === */
  --primary:         #2F5D46;   /* главный акцент: кнопки, активные элементы, progress */
  --primary-hover:   #274F3C;   /* hover/pressed state */
  --primary-light:   #EAF1EC;   /* primary-tinted фон */
  --primary-subtle:  #C8DDD1;   /* мягкий primary для второстепенных акцентов */

  /* === ТЕКСТ === */
  --text:            #1C2B22;   /* основной тёмный текст */
  --text-secondary:  #4E5E57;   /* вторичный текст */
  --text-muted:      #7B8880;   /* подписи, meta, плейсхолдеры */

  /* === ГРАНИЦЫ === */
  --border:          #D6DDD9;   /* основная граница */
  --border-soft:     #E4E9E6;   /* мягкая граница */

  /* === НАВИГАЦИЯ === */
  --nav:             #1A2820;   /* тёмный nav bar */
  --nav-text:        rgba(255,255,255,0.55);
  --nav-text-active: #FFFFFF;

  /* === СИГНАЛЬНЫЕ (только по функции, не для эстетики) === */
  --success:         #3D7A52;
  --success-light:   #E4F1E9;
  --warning:         #B8861F;
  --warning-light:   #FBF0D8;
  --error:           #B84B42;
  --error-light:     #FBECEB;
  --info:            #5B60B8;
  --info-light:      #EEEDF8;

  /* === РАДИУСЫ === */
  --r-card:          18px;
  --r-card-sm:       12px;
  --r-btn:           14px;
  --r-input:         14px;
  --r-pill:          999px;
  --r-chip:          8px;

  /* === ОТСТУПЫ === */
  --sp-1: 4px;
  --sp-2: 8px;
  --sp-3: 12px;
  --sp-4: 16px;
  --sp-5: 24px;
  --sp-6: 32px;
  --sp-7: 40px;
  --sp-8: 48px;

  /* === ТЕНИ === */
  --shadow-card: 0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px var(--border-soft);
  --shadow-hero: 0 2px 12px rgba(0,0,0,0.08);

  /* === ТИПОГРАФИКА === */
  --font-h1: 30px;
  --font-h2: 22px;
  --font-h3: 17px;
  --font-body: 15px;
  --font-small: 13px;
  --font-micro: 11px;

  --lh-h1: 1.2;
  --lh-h2: 1.3;
  --lh-body: 1.6;
  --lh-tight: 1.35;
}
```

### Что заменяет что

| Было | Стало | Где используется |
|------|-------|-----------------|
| `#4A8C6E` (акцент) | `--primary: #2F5D46` | кнопки, прогресс, активные состояния |
| `#EDF7F1` (light) | `--primary-light: #EAF1EC` | tinted карточки |
| `#7CC8A0` (highlight) | `--primary-subtle: #C8DDD1` | вторичные акценты |
| `#2D3748` (nav) | `--nav: #1A2820` | нижняя навигация |
| `#D97706` (urgent) | `--warning: #B8861F` | только предупреждения |
| фиолетовый | `--surface-lavender` + `--info` | методические блоки, info-карточки |
| жёлтый, оранжевый | убрать из общей эстетики | только `--warning` по функции |

### Правила использования цвета
- `--primary` — только для одного главного действия или акцента в зоне
- `--warning`, `--error`, `--success`, `--info` — только для своих функций (никакой декоративной роли)
- Не смешивать на одном экране `--primary`, `--info`, `--warning` как равноправные акценты
- Фон блока = `--primary-light` OR `--surface-lavender` OR `--surface-soft`, но не всё сразу

---

## 3. Типографика

### Базовые стили body

```css
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', system-ui, sans-serif;
  font-size: var(--font-body);
  line-height: var(--lh-body);
  color: var(--text);
  letter-spacing: -0.01em;
  -webkit-font-smoothing: antialiased;
  background: var(--bg);
}
```

### Четыре уровня текста

```css
/* H1 — главный заголовок страницы (приветствие, название экрана) */
.text-h1 {
  font-size: var(--font-h1);
  font-weight: 700;
  line-height: var(--lh-h1);
  color: var(--text);
  letter-spacing: -0.025em;
}

/* H2 — заголовок секции */
.text-h2 {
  font-size: var(--font-h2);
  font-weight: 600;
  line-height: var(--lh-h2);
  color: var(--text);
  letter-spacing: -0.015em;
}

/* H3 — заголовок карточки */
.text-h3 {
  font-size: var(--font-h3);
  font-weight: 600;
  line-height: var(--lh-tight);
  color: var(--text);
}

/* Body — основной текст */
.text-body {
  font-size: var(--font-body);
  font-weight: 400;
  line-height: var(--lh-body);
  color: var(--text);
}

/* Small — подписи и meta */
.text-small {
  font-size: var(--font-small);
  line-height: 1.45;
  color: var(--text-secondary);
}

/* Micro — метки, теги */
.text-micro {
  font-size: var(--font-micro);
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--text-muted);
}
```

### Правила типографики
- **Капс (ALL CAPS)** — только для `.text-micro` меток (Niveau 1, A2, и т.п.). Не для заголовков секций.
- **Вторичный текст** — `--text-secondary` (`#4E5E57`), не делать светлее чем это значение
- **Мутный текст** — `--text-muted` только для подписей, меток, плейсхолдеров
- **Ширина текста** — ограничивать `max-width: 65ch` для длинного reading text

---

## 4. Система отступов

Единая шкала: **4 · 8 · 12 · 16 · 24 · 32 · 40 · 48 px**

### Применение

| Значение | Где использовать |
|----------|-----------------|
| `--sp-1` (4px) | между иконкой и текстом в chip; внутри inline-элемента |
| `--sp-2` (8px) | gap между chips; внутри мелких кнопок |
| `--sp-3` (12px) | padding кнопок (вертикальный); gap между строками внутри карточки |
| `--sp-4` (16px) | padding карточек; горизонтальные поля страницы |
| `--sp-5` (24px) | gap между карточками; между заголовком секции и контентом |
| `--sp-6` (32px) | между секциями на странице |
| `--sp-7` (40px) | вертикальный ритм между крупными смысловыми зонами |
| `--sp-8` (48px) | bottom padding страницы (запас под nav) |

### Поля страницы
```css
.page-content {
  padding: 0 var(--sp-4) var(--sp-8);
}
```

---

## 5. Карточки — три типа

### Тип A: Hero Card
Главная карточка дня / главный фокус. Одна на экран как доминирующий элемент.

```css
.card-hero {
  background: var(--surface);
  border-radius: var(--r-card);
  padding: var(--sp-5) var(--sp-4);
  box-shadow: var(--shadow-hero);
  margin: 0 var(--sp-4);
}
/* Или tinted вариант */
.card-hero--tinted {
  background: var(--primary-light);
  border: 1.5px solid var(--primary-subtle);
}
```

**Структура внутри:**
1. Метка (text-micro)
2. Заголовок (text-h3 / text-h2)
3. Краткое описание
4. Один Primary CTA

### Тип B: Content Card
Для заданий, грамматики, слов, наблюдений.

```css
.card-content {
  background: var(--surface);
  border-radius: var(--r-card);
  padding: var(--sp-4);
  border: 1px solid var(--border-soft);
  margin: 0 var(--sp-4);
}
```

Альтернатива без явного border — использовать `box-shadow: var(--shadow-card)`.

### Тип C: Utility Card
Счётчики, статусы, метки прогресса.

```css
.card-utility {
  background: var(--surface-soft);
  border-radius: var(--r-card-sm);
  padding: var(--sp-3) var(--sp-4);
  /* без border, без тени */
}
```

### Правила карточек
- На одном экране не должны конкурировать больше 2-х карточек типа A или B с одинаковым визуальным весом
- Если контент второстепенный — убирать border, заменять на фон или отступ
- Не обводить рамкой всё подряд — это главная причина ощущения "дешевизны"

---

## 6. Кнопки — три типа

### Primary Button
Главное действие в зоне. Один на экран как ключевой CTA.

```css
.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: var(--r-btn);
  padding: 13px var(--sp-5);
  font-size: var(--font-body);
  font-weight: 600;
  min-height: 48px;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}
.btn-primary:active {
  background: var(--primary-hover);
  transform: scale(0.98);
}
```

**Примеры:** Abschicken, Weiter, Starten, Aufgabe öffnen

### Secondary Button

```css
.btn-secondary {
  background: var(--primary-light);
  color: var(--primary);
  border: 1.5px solid var(--primary-subtle);
  border-radius: var(--r-btn);
  padding: 11px var(--sp-4);
  font-size: var(--font-body);
  font-weight: 600;
  min-height: 44px;
  cursor: pointer;
}
```

**Примеры:** Mehr anzeigen, Kommentar öffnen, Wiederholen

### Tertiary / Text Button

```css
.btn-text {
  background: none;
  border: none;
  color: var(--primary);
  font-size: var(--font-small);
  font-weight: 500;
  padding: var(--sp-2) var(--sp-3);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: var(--primary-subtle);
}
```

**Примеры:** Später senden, Mehr lesen, Überspringen

### Правила кнопок
- На одном экране — один Primary, все остальные Secondary или Tertiary
- Не делать несколько Primary на одном экране — это уничтожает иерархию
- Минимальная высота touch-target: 44px

---

## 7. Поля ввода

```css
.input-field,
.textarea-field {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--r-input);
  padding: 13px var(--sp-4);
  font-size: var(--font-body);
  color: var(--text);
  line-height: var(--lh-body);
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.textarea-field {
  min-height: 120px;
  resize: vertical;
}
.input-field:focus,
.textarea-field:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-light);
}
::placeholder {
  color: var(--text-muted);
}
```

---

## 8. Chips / теги

Единый стиль для всех словарных тегов и категорий.

```css
.chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--r-chip);
  font-size: var(--font-small);
  font-weight: 500;
  background: var(--surface-soft);
  border: 1px solid var(--border-soft);
  color: var(--text-secondary);
}
/* Акцентный chip */
.chip--primary {
  background: var(--primary-light);
  border-color: var(--primary-subtle);
  color: var(--primary);
}
/* Информационный chip */
.chip--info {
  background: var(--surface-lavender);
  border-color: #D4D3F0;
  color: var(--info);
}
```

**Правило:** не использовать 5–6 разных цветных вариантов chip на одном экране. Максимум 2 вида.

---

## 9. Progress bars

```css
.progress-track {
  height: 6px;
  background: var(--border-soft);
  border-radius: var(--r-pill);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: var(--r-pill);
  transition: width 0.4s ease;
}
/* Толстый прогресс-бар для Fortschritt */
.progress-track--lg {
  height: 10px;
}
```

---

## 10. Header / Top Bar

```css
.top-bar {
  background: var(--nav);
  padding: 14px var(--sp-4) 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.top-bar-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--nav-text-active);
  letter-spacing: -0.01em;
}
.level-badge {
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: var(--r-pill);
  padding: 4px 10px;
  font-size: var(--font-small);
  font-weight: 600;
  color: var(--nav-text-active);
  letter-spacing: 0.01em;
}
```

---

## 11. Нижняя навигация

### Состав (не менять порядок)
1. **Aufgabe** — сегодняшнее задание
2. **Grammatik** — правило недели
3. **Fortschritt** — прогресс и путь
4. **Lücken** → переименовать в **Wachstum** или **Nächstes**
5. **Kultur** — культурный блок

> ⚠️ Раздел "Lücken" — психологически слабое название для постоянного видимого таба. Заменить на нейтральное или позитивное: **Wachstum**, **Nächstes**, **Feinschliff**.

```css
.bottom-nav {
  background: var(--nav);
  display: flex;
  padding: 8px 0 calc(8px + env(safe-area-inset-bottom));
}
.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 4px;
  color: var(--nav-text);
  font-size: 10px;
  font-weight: 500;
  border: none;
  background: none;
  cursor: pointer;
  transition: color 0.15s;
}
.nav-item--active {
  color: var(--nav-text-active);
}
.nav-item--active .nav-icon {
  background: rgba(255,255,255,0.1);
  border-radius: 8px;
}
.nav-icon {
  font-size: 20px;
  padding: 4px 8px;
  border-radius: 8px;
}
```

---

## 12. Первый экран — новая структура

Это **приоритет №1** всего редизайна.

### Порядок блоков сверху вниз

```
┌─────────────────────────────────┐
│  TOP BAR (nav, тёмный)          │
├─────────────────────────────────┤
│  ПРИВЕТСТВИЕ                    │
│  Guten Tag, Olga                │
│  [дата] · [короткий фокус]      │
├─────────────────────────────────┤
│  КОММЕНТАРИЙ ПРЕПОДАВАТЕЛЯ      │
│  (если есть — первым, важнее    │
│  всего остального)              │
├─────────────────────────────────┤
│  HERO CARD — главный фокус дня  │
│  Тема · Навык · CTA             │
├─────────────────────────────────┤
│  НАСТРОЕНИЕ (mood selector)     │
├─────────────────────────────────┤
│  СЛОВА (аккордеон — закрыт)     │
├─────────────────────────────────┤
│  ЗАДАНИЕ (level switcher)       │
│  [1] [2] [3]                    │
├─────────────────────────────────┤
│  ДНЕВНИК (аккордеон — закрыт)   │
├─────────────────────────────────┤
│  ЦЕЛЬ-ЗВЕЗДА (goal-star strip)  │
└─────────────────────────────────┘
```

### Приветствие

```html
<div class="greeting">
  <div class="greeting-name">Guten Tag, Olga</div>
  <div class="greeting-sub">Mittwoch, 16. April · Heute: Ihre Geschichte</div>
</div>
```

```css
.greeting {
  padding: var(--sp-5) var(--sp-4) var(--sp-4);
}
.greeting-name {
  font-size: var(--font-h1);
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.025em;
  line-height: var(--lh-h1);
}
.greeting-sub {
  font-size: var(--font-small);
  color: var(--text-muted);
  margin-top: 4px;
}
```

### Комментарий преподавателя

Убрать ощущение "тревожного алерта". Сделать как личную заметку наставника.

```css
.teacher-comment {
  margin: 0 var(--sp-4) var(--sp-4);
  background: var(--surface);
  border-radius: var(--r-card);
  border-left: 3px solid var(--primary);
  padding: var(--sp-4);
  box-shadow: var(--shadow-card);
}
.teacher-comment-label {
  font-size: var(--font-micro);
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--primary);
  margin-bottom: 6px;
}
.teacher-comment-text {
  font-size: var(--font-body);
  color: var(--text);
  line-height: var(--lh-body);
}
.teacher-comment-preview {
  /* Первые 2 строки, без обрезки на полуслове */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

- Убрать красную/оранжевую рамку
- Левый зелёный акцент-бордер = "это от преподавателя"
- Свёрнут по умолчанию (первые 2 строки)
- "Vollständig lesen" → раскрывается

---

## 13. Level Switcher (вкладки заданий 1–2–3)

```css
.level-switcher {
  display: flex;
  gap: var(--sp-2);
  margin: 0 var(--sp-4);
  padding-bottom: var(--sp-3);
}
.level-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 6px;
  border: 1.5px solid var(--border);
  border-radius: var(--r-card-sm);
  background: var(--surface);
  cursor: pointer;
  transition: all 0.15s;
}
.level-btn__num {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-muted);
  line-height: 1;
}
.level-btn__label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-top: 3px;
}
.level-btn--active {
  background: var(--nav);
  border-color: var(--nav);
}
.level-btn--active .level-btn__num,
.level-btn--active .level-btn__label {
  color: #fff;
}
.level-content {
  margin: var(--sp-3) var(--sp-4) 0;
  background: var(--surface);
  border: 1.5px solid var(--border-soft);
  border-radius: var(--r-card);
  padding: var(--sp-5) var(--sp-4);
}
```

---

## 14. Goal-Star (полоса цели)

```css
.goal-star {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  width: calc(100% - 32px);
  margin: 0 var(--sp-4);
  padding: 10px 14px;
  background: transparent;
  border: none;
  border-left: 3px solid var(--primary-subtle);
  border-radius: 0 var(--r-card-sm) var(--r-card-sm) 0;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}
.goal-star:hover, .goal-star:active {
  background: var(--primary-light);
}
.goal-star-icon {
  font-size: 12px;
  color: var(--primary);
  opacity: 0.6;
  flex-shrink: 0;
}
.goal-star-text {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}
.goal-star-deadline {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 400;
  white-space: nowrap;
}
.goal-star-arrow {
  font-size: 15px;
  color: var(--text-muted);
  transition: transform 0.2s;
}
.goal-star-body {
  margin: 0 var(--sp-4) 0 calc(var(--sp-4) + 15px);
  padding-top: var(--sp-2);
}
```

---

## 15. Fortschritt — экран прогресса

### Что изменить
- Progress bars → толще (`height: 10px`)
- Рядом с каждым показателем добавить **human-readable смысл**, не только проценты
- Разделить на 3 слоя: **Навыки → Фундамент → Путь**

### Пример структуры

```html
<div class="progress-section">
  <div class="section-label">Навыки</div>
  <div class="progress-item">
    <div class="progress-item-header">
      <span class="progress-item-name">Schreiben</span>
      <span class="progress-item-note">Struktur wird klarer</span>
    </div>
    <div class="progress-track progress-track--lg">
      <div class="progress-fill" style="width: 42%"></div>
    </div>
  </div>
  <!-- ещё 3 навыка -->
</div>
```

```css
.progress-item {
  margin-bottom: var(--sp-4);
}
.progress-item-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}
.progress-item-name {
  font-size: var(--font-body);
  font-weight: 600;
  color: var(--text);
}
.progress-item-note {
  font-size: var(--font-small);
  color: var(--text-muted);
  font-style: italic;
}
```

---

## 16. Grammatik — карточка грамматики

### Что изменить
- Убрать разноцветные акценты внутри одного блока
- Цветом выделять только: **ключевую конструкцию** и **пример**
- Разделить типографически: тема → формула → пример → пояснение → практика

### Рекомендуемая цветовая схема для грамматики

```css
.grammar-rule-formula {
  background: var(--primary-light);
  border-left: 3px solid var(--primary);
  padding: 10px var(--sp-4);
  border-radius: 0 var(--r-card-sm) var(--r-card-sm) 0;
  font-family: monospace;
  font-size: var(--font-body);
  color: var(--text);
  margin: var(--sp-3) 0;
}
.grammar-example {
  background: var(--surface-soft);
  border: 1px solid var(--border-soft);
  border-radius: var(--r-card-sm);
  padding: var(--sp-3) var(--sp-4);
}
.grammar-highlight {
  color: var(--primary);
  font-weight: 600;
}
/* Убрать .grammar-highlight--purple, --orange и т.п. */
```

---

## 17. Sprechen / Schreiben tabs

### Что изменить
- Сделать как полноценные tabs с чётким active state, не просто кнопки
- Шаги 1–2–3 → stepper с состояниями done / current / next

### Stepper

```css
.stepper {
  display: flex;
  align-items: center;
  gap: 0;
  margin: var(--sp-4) var(--sp-4) 0;
}
.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}
.step::after {
  content: '';
  position: absolute;
  top: 14px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: var(--border);
}
.step:last-child::after { display: none; }
.step--done::after { background: var(--primary); }

.step-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  border: 2px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  position: relative;
  z-index: 1;
}
.step--done .step-circle {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.step--current .step-circle {
  border-color: var(--primary);
  color: var(--primary);
  font-weight: 700;
}
.step-label {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 4px;
  font-weight: 500;
}
.step--current .step-label {
  color: var(--primary);
  font-weight: 600;
}
```

---

## 18. Словарные теги / Wortschatzbank

### Что изменить
- Привести карточки уровней к **единой визуальной семье**
- Aktuell = Hero Card (главный модуль)
- Уровни (A1, A2, B1...) = Content Cards одного стиля
- Убрать случайную разноцветность секций

### Принцип
- Один базовый стиль карточки слова для всех уровней
- Отличие уровней = только label/badge, не весь цвет карточки
- Chip уровня: `--chip--primary` для текущего спринта, `--chip` для остальных

---

## 19. Блок "Von Ihrer Lehrerin" / "Meine Beobachtungen"

### Что изменить
- Убрать ощущение ошибки/тревоги
- Сделать как **пространство рефлексии**, а не поле диагностики

```css
.observation-card {
  background: var(--surface-lavender);
  border: 1px solid #D4D3F0;
  border-radius: var(--r-card);
  padding: var(--sp-4);
}
.observation-label {
  font-size: var(--font-micro);
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--info);
  margin-bottom: var(--sp-2);
}
```

---

## 20. Копирайт — тон интерфейса

### Что заменить

| Сейчас | Должно быть |
|--------|-------------|
| Lücken | Nächste Lernpunkte / Wachstum |
| Fehler | Beobachtung / Das festigen wir |
| Problem | Feinschliff |
| Nicht geschafft | Noch in Arbeit |
| Falsch | Noch unsicher |

### Принципы тона
- Тепло, собранно, профессионально
- Без канцелярита
- Без диагностических названий как главных навигационных меток
- Ошибки = точки роста, а не провалы
- Прогресс = путь, а не отчёт

---

## 21. Что нельзя делать

- ❌ Добавлять новые яркие акцентные цвета
- ❌ Использовать градиенты как способ выглядеть дороже
- ❌ Делать интерфейс "игровым" или gamified
- ❌ Несколько Primary CTA на одном экране
- ❌ Border у каждого блока — рамочность убивает премиальность
- ❌ Разные стили рамок вперемешку
- ❌ Слишком маленький или слишком светлый текст
- ❌ Диагностические названия как главные пункты навигации

---

## 22. Приоритеты внедрения

### Этап 1 — критично (делать первым)
1. CSS-переменные (новая палитра)
2. Типографика (4 уровня + antialiasing)
3. Система отступов
4. Первый экран: структура + приветствие + hero-card + комментарий преподавателя
5. Карточки: 3 типа
6. Кнопки: 3 типа

### Этап 2 — важно
7. Fortschritt: прогресс-бары + human-readable
8. Grammatik: типографика + убрать цветовой шум
9. Sprechen/Schreiben: tabs + stepper
10. Kommentar-карточка: убрать тревожность
11. Нижняя навигация: переименование Lücken

### Этап 3 — полировка
12. Wortschatzbank: единый стиль
13. Observation cards: лавандовый стиль
14. Chips/теги: унификация
15. Иконки: один стиль
16. Копирайт: замена слов

---

## 23. Acceptance Criteria

Редизайн считается успешным, если:

- [ ] За 3 секунды на первом экране понятно: **где я, что делать сейчас, куда нажать**
- [ ] Цветов стало меньше, но смысл стал понятнее
- [ ] Главные и второстепенные элементы чётко различаются без объяснений
- [ ] Комментарий преподавателя выглядит как ценность, а не уведомление
- [ ] Прогресс ощущается как путь роста, а не admin-dashboard
- [ ] Интерфейс воспринимается как единый продукт, а не набор разных блоков
- [ ] Сохранена методическая глубина и ощущение личного сопровождения
- [ ] Нет ощущения детскости, игровости или шаблонности

---

## 24. Суть задачи в одном абзаце

Провести визуальный рефакторинг существующего кабинета студента без изменения функциональности: сократить цветовой шум до дисциплинированной палитры из 1 primary + 1 secondary, выстроить типографическую иерархию из 4 уровней, переработать первый экран вокруг одного главного фокуса дня, унифицировать карточки (hero / content / utility) и кнопки (primary / secondary / tertiary), убрать избыточную рамочность, добавить воздух через единую spacing-систему, сделать прогресс и обратную связь человеческими и статусными — при этом полностью сохранив сильную методическую архитектуру и ощущение живого личного сопровождения преподавателя.

---

*Файл создан 16 апреля 2026. Актуален для tg-app/style.css и tg-app/app.js.*
*Архитектура продукта — tg-app/CLAUDE.md и RUKOVODSTVO.md.*
