# UX / Функциональные спецификации — Dashboard Personal German Coach

---

## Обзор системы

**Пользователи:** Преподаватель (Teacher), Студент (Student)
**Доступ:** Web app (Bubble.io MVP → React PWA v2)
**Принцип:** Teacher Edit → Student View Only

---

## Экран 1: Student Profile

### Teacher View (полный доступ)

**Верхний блок:**
- Фото / аватар студента (инициалы если нет фото)
- Имя, CEFR текущий → CEFR цель (визуально: B1 → B2 со стрелкой)
- Статус: Active / Paused / Completed
- Подписка: план и дата окончания

**KPI-панель (4 карточки):**
- Accuracy %: текущий + динамика (↑ +8% за месяц)
- Fluency: [●●●○○] 3/5
- Pronunciation: [●●○○○] 2/5
- Assignments completion: 5/5 (100%)

**Мини-граф прогресса:**
- Линейный граф: accuracy_percent по неделям (последние 8 недель)
- Точки: заданные deadline / тесты

**Блоки информации:**
```
Профессия: Softwareentwicklerin (IT)        Цель: Career (B2)
Дедлайн: 15.06.2024                          Начало: 15.01.2024
Стиль: Analytical                            ДЗ/день: 20 мин
```

**Психологические барьеры (для teacher only):**
Tags: [Fear_of_mistakes] [Slow_recall]

**Teacher Notes (rich text, только учитель):**
Поле для заметок преподавателя

---

### Student View (ограниченный доступ)

Студент видит:
- Свой прогресс-граф
- Текущие KPI
- Своё расписание заданий
- НЕ видит: teacher notes, psych_barriers, AI draft comments (только финальные)

---

## Экран 2: Plan Editor

### Teacher View

**Заголовок плана:** "Анна — B1→B2 Sprint (январь 2024)"

**Редактор месячного плана:**
```
Неделя 1: [Тема] — [Цель]
  └── Задание 1: [Тип] [Тема] [Дата] [Статус]
  └── Задание 2: ...
Неделя 2: ...
```

**Правая панель:**
- Фокус: [Listening] [Writing] [Grammar] ✓ (чекбоксы)
- Профессиональный контекст: IT / Medizin / Management
- Кол-во занятий/неделю: [1] [2] [3]

**Кнопки:**
- [🤖 Сгенерировать с AI] → вызов prompts/plan_generator.txt
- [✅ Утвердить план] → teacher_approved = TRUE
- [📤 Отправить студенту]
- [📋 Дублировать план]

**AI Draft Badge:**
Если plan.ai_generated = true AND NOT teacher_approved:
→ Жёлтая плашка: ⚠️ AI DRAFT — не утверждён преподавателем

---

### Student View

Студент видит:
- Свои задания на неделю (без деталей плана)
- Статус каждого задания (Assigned / Done / Reviewed)
- Ближайший дедлайн

---

## Экран 3: Assignment Submissions

### Teacher View — Список submissions

**Таблица:**
| Студент | Задание | Тип | Дата | Теги | Статус | Действие |
|---|---|---|---|---|---|---|
| Анна К. | Roleplay Meeting | Audio | 21.01 | [Kasus][Gut] | AI Draft Ready | Проверить |
| Дмитрий В. | Mini-Email | Text | 28.01 | [Artikel] | Teacher Review | Проверить |

**Фильтры:** По студенту / По типу / По статусу / По дате

**Клик на submission → детальный просмотр:**

---

### Teacher View — Детальная страница submission

**Левая колонка (65%):**
- Аудиоплеер (если аудио) с временными метками
- Транскрипт (если аудио → Whisper)
- Или: текст студента

**Правая колонка (35%):**

*AI DRAFT комментарий (желтый фон):*
```
⚠️ AI DRAFT (не верифицирован)
─────────────────────────────
✅ Хорошо:
• ...

⚠️ Ошибки:
1. Kasus: "mit mein Team" → ...

📅 Фокус:
→ Nebensatz

🗂️ Anki:
seit;с (врем);...
─────────────────────────────
```

*Форма финального комментария учителя:*
```
[Текстовое поле для teacher_comment]

Оценка: [0-10]  [Слайдер или число]

Теги: [+Tag] (автозаполнение из списка)

[✅ Сохранить и отправить студенту]
[📋 Скопировать из AI Draft]  ← удобная кнопка!
```

*Anki слова для добавления:*
```
[слово;перевод;пример] + [кнопка Добавить в Anki export]
```

---

### Student View — Просмотр фидбека

Студент видит:
- Своё аудио / текст
- **Только финальный** teacher_comment (НЕ AI Draft)
- Оценку
- Рекомендации
- Кнопка: "Отметить как прочитанное"

---

## Экран 4: Auto-Analysis Dashboard (Teacher Only)

**Агрегированная статистика по всем студентам:**

**Топ-10 ошибок (за последние 30 дней):**
```
1. Nebensatz (weil/dass) — 34 случая
2. Dativ nach Präpositionen — 28 случаев
3. Akkusativ maskulin — 21 случай
...
```

**По каждому студенту:**
- Радарная диаграмма: Listening / Reading / Writing / Speaking / Grammar / Vocabulary
- Динамика accuracy % (8 недель)

**AI Usage:**
- AI Draft создан: N submissions
- Teacher approved без изменений: X%
- Teacher изменил существенно: Y%
- Среднее время teacher review: Z мин

---

## Экран 5: Methodology Library

**Структура (два режима):**

**Visual Mode:**
- Карточки навыков с иконками
- Клик → разворачивается микро-упражнения
- Поиск по типу упражнения / уровню / навыку

**Analytical Mode (Teacher):**
- Полная библиотека в табличном виде
- Фильтры: CEFR level / Skill / Duration / Learning Style
- Кнопка "Добавить в план студента" прямо из библиотеки

**Для каждого навыка (skill_reading.md и т.д.):**
- Цель
- 8–10 упражнений (карточки)
- Checklist
- Research references
- Psychological techniques

---

## Экран 6: Market-Intel Dashboard (Teacher Only)

**Заголовок:** Market Intelligence — [неделя]

**Секции:**
1. **What Sells** — топ-3 тренда с YouTube/Udemy данными
2. **What Engages** — топ-форматы соцсетей
3. **Niche Gaps** — незанятые ниши (карточки с рейтингом важности)
4. **Suggested Build** — рекомендованный продукт недели

**Архив:** История weekly reports (последние 12 недель)

**Кнопка:** [🤖 Обновить Report (Claude prompt)] — ручной запуск обновления

---

## Кастомизация интерфейса

### Visual Mode (по умолчанию для студентов с learning_style = Visual)
- Большие цветные карточки
- Графики прогресса в центре
- Иконки для типов заданий
- Цветовое кодирование статусов: 🟢 Done / 🟡 In Progress / 🔴 Overdue

### Analytical Mode (по умолчанию для learning_style = Analytical)
- Компактные таблицы
- Больше числовых данных
- Меньше декоративных элементов
- CSV export доступен везде

**Переключение:** Кнопка в правом верхнем углу [Visual / Table]

---

## Права доступа

| Функция | Student | Teacher |
|---|---|---|
| Видеть свой профиль | ✅ | ✅ |
| Редактировать профиль | ✅ (базово) | ✅ (полностью) |
| Видеть план | ✅ (только задания) | ✅ (редактировать) |
| Сдавать задания | ✅ | — |
| Видеть AI Draft | ❌ | ✅ |
| Видеть финальный фидбек | ✅ | ✅ |
| Оставлять teacher_comment | ❌ | ✅ |
| Утверждать план | ❌ | ✅ |
| Market-Intel | ❌ | ✅ |
| Methodology Library | ✅ (просмотр) | ✅ (полностью) |
| Видеть других студентов | ❌ | ✅ |
| Экспорт данных | Свои | Все |

---

## Технический стек (рекомендации)

**MVP (Месяц 1–2):**
- Airtable as backend (уже настроен)
- Bubble.io as frontend (no-code, быстро)
- Zapier для automation

**Продакшн (Месяц 3+):**
- React + TypeScript (PWA)
- Supabase / PostgreSQL as DB
- Node.js API
- Vercel deployment
- Stripe billing
