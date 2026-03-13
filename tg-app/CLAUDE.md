# Студенческий кабинет — навигация по коду

## Структура папки tg-app/

```
tg-app/
├── index.html    ← точка входа. Открывается в браузере и Telegram.
│                   Здесь только каркас — никакого содержимого не трогать.
├── style.css     ← весь дизайн: цвета, кнопки, карточки, вкладки.
├── students.js   ← данные ВСЕХ студентов. Сюда добавляем новых.
├── app.js        ← вся логика: отрисовка экранов, вкладки, анимации.
└── CLAUDE.md     ← этот файл. Шпаргалка.
```

---

## Как открыть кабинет студента

Каждый студент открывает свою ссылку:
```
index.html?student=artem   → кабинет Артёма
index.html?student=olga    → кабинет Ольги
index.html?student=julia   → кабинет Юлии
```

В Telegram: ссылка на Mini App + параметр startapp=artem (настраивается в BotFather).

---

## Как добавить нового студента

Открыть `students.js` → найти блок `artem: { ... }` → скопировать → вставить после закрывающей `},` → переименовать ключ.

Минимальный шаблон нового студента:
```js
anna: {
  name: 'Anna',
  level: 'A1',
  progressText: 'Guter Start!',
  goal: { title: 'Grundlagen sicher aufbauen', deadline: 'Herbst 2026' },
  milestones: [
    { label: 'Erste Sätze bilden', status: 'active', sub: 'Sie sind hier' },
    { label: 'Alltag auf Deutsch', status: 'upcoming' },
  ],
  review: null,
  task: {
    topic: 'Тема задания',
    text: 'Текст задания',
    estimate: '15 Minuten',
    deadline: '20. März',
    hint: 'Подсказка',
  },
  deepen: null,
  immerse: null,
  feedback: null,
  gaps: [],
  skills: [ /* скопировать из artem, подставить нужные данные */ ],
  grammar: [ /* скопировать из artem, подставить нужные темы */ ],
},
```

---

## Что где менять

| Хочу изменить | Открыть файл | Что искать |
|---|---|---|
| Задание студента | `students.js` | `task: { topic, text, estimate, deadline, hint }` |
| Лексические пробелы | `students.js` | `gaps: [ ... ]` |
| Грамматические темы | `students.js` | `grammar: [ ... ]` |
| Прогресс по навыкам | `students.js` | `skills: [ ... ]` → `criteria` → `done: true/false` |
| Цвета и дизайн | `style.css` | `:root { --accent, --bg, --nav ... }` |
| Логику вкладок | `app.js` | `function showTab(tab)` |
| Kultur-контент | `app.js` | `KULTUR_WORT`, `KULTUR_SPRICHWORT` и другие массивы |
| Кнопку Telegram | `app.js` | `tg.MainButton.setText(...)` |

---

## Экраны приложения

| Вкладка | ID экрана | Где рендерится |
|---|---|---|
| Aufgabe (задание) | `screen-task` | `render()` в app.js |
| Grammatik | `screen-grammar` | `renderGrammarScreen()` в app.js |
| Fortschritt | `screen-progress` | `render()` в app.js |
| Lücken | `screen-gaps` | `renderGapsScreen()` в app.js |
| Kultur | `screen-kultur` | `renderKulturScreen()` в app.js |

---

## Данные хранятся

- **Прогресс по критериям** → localStorage: ключ `pgc_ИМЯСТУДЕНТА`
- **Самооценка по грамматике** → localStorage: ключ `pgc_grammar_ИМЯСТУДЕНТА`
- **Личные Lücken студента** → localStorage: ключ `pgc_gaps_ИМЯСТУДЕНТА`
- **Статус Lücken** → localStorage: ключ `pgc_gap_st_ИМЯСТУДЕНТА`

---

## Telegram SDK

Файл подключён в index.html:
```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

Используется в app.js:
- `tg.expand()` — раскрыть на весь экран
- `tg.HapticFeedback` — вибрация при нажатии
- `tg.MainButton` — кнопка внизу (в Telegram)
- `tg.openTelegramLink()` — открыть чат с преподавателем
