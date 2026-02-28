# Стартовая диагностика — Тест-план

**Документ:** diagnostic_test_plan.md
**Назначение:** Детальный план диагностического тестирования для новых студентов
**Общее время:** 30–45 минут
**Кто проводит:** Преподаватель (с AI-поддержкой для первичного анализа)

---

## Обзор: Структура диагностики

| Секция | Навык | Время | Тип | Макс. баллов |
|---|---|---|---|---|
| 1. Онбординг-анкета | — | 5 мин | Форма | — |
| 2. Аудирование | Listening | 5–7 мин | MC × 3 | 3 |
| 3. Чтение | Reading | 5–7 мин | MC × 3 | 3 |
| 4. Письмо | Writing | 10–12 мин | Free text | 10 |
| 5. Говорение | Speaking | 5 мин | Audio upload | 10 |
| 6. Самооценка | Meta | 2 мин | Rating 1–5 | — |
| **Итого** | | **30–44 мин** | | **26** |

---

## Секция 1: Вводные данные (5 мин)

### Задания
- Заполнение анкеты онбординга (см. typeform_onboarding.json)
- Имя, профессия, цель, дедлайн, время на ДЗ

### Что фиксируем
- Профессиональный контекст (для адаптации заданий)
- Дедлайн (влияет на интенсивность плана)
- Психологические барьеры (влияет на методику)

---

## Секция 2: Аудирование — Listening Comprehension (5–7 мин)

### Материал (уровень B1)
**Аудио:** Диалог 1.5–2 мин. Бытовая или рабочая ситуация.
- Пример: запись на приём, встреча коллег, звонок в ведомство
- Скорость: нормальная (не "Langsam gesprochene Nachrichten")
- Акцент: стандартный Hochdeutsch

### Формат
3 вопроса с множественным выбором (4 варианта, 1 верный)

### Тайминг
```
0:00 – Инструкция и прослушивание первый раз (без остановок): 2 мин
2:00 – Второе прослушивание с паузами: 2 мин
4:00 – Ответы на вопросы: 1–2 мин
```

### Метрики
- listening_score: 0–3 (1 балл за верный ответ)
- listening_comprehension_percent = (score/3) × 100

### CEFR-маппинг Listening
| Score | Интерпретация | CEFR |
|---|---|---|
| 0–1 | Базовое понимание | ≤A2 |
| 2 | Понимает основное | B1 |
| 3 | Полное понимание | ≥B1 |

### Правила автоматической оценки (псевдокод)
```python
def score_listening(answers: dict) -> dict:
    correct = {
        "listening_q1": "c18_2",  # О поиске квартиры
        "listening_q2": "c19_1",  # Перенести встречу
        "listening_q3": "c20_3"   # Пятница
    }
    score = sum(1 for k, v in answers.items() if correct.get(k) == v)
    pct = round((score / 3) * 100)
    return {"listening_score": score, "listening_pct": pct}
```

---

## Секция 3: Чтение — Leseverstehen (5–7 мин)

### Материал
**Текст:** 120–150 слов. Административный или информационный контент.
- Пример: инструкция по Anmeldung, объявление о Mietrecht, правила Krankenkasse
- Уровень: B1 (доступен A2-студенту с усилием)

### Формат
3 вопроса с множественным выбором

### Тайминг
```
0:00 – Чтение текста: 3 мин
3:00 – Ответы на вопросы: 2–3 мин
```

### Метрики
- reading_score: 0–3
- reading_comprehension_percent = (score/3) × 100

### CEFR-маппинг Reading
| Score | Интерпретация | CEFR |
|---|---|---|
| 0–1 | Читает с трудом | ≤A2 |
| 2 | Понимает основное | B1 |
| 3 | Детальное понимание | ≥B1 |

### Правила автоматической оценки
```python
def score_reading(answers: dict) -> dict:
    correct = {
        "reading_q1": "c22_2",  # 2 недели
        "reading_q2": "c23_2",  # Wohnungsgeberbestätigung
        "reading_q3": "c24_3"   # Различные официальные процедуры
    }
    score = sum(1 for k, v in answers.items() if correct.get(k) == v)
    pct = round((score / 3) * 100)
    return {"reading_score": score, "reading_pct": pct}
```

---

## Секция 4: Письмо — Schreibprobe (10–12 мин)

### Материал
Свободный текст на выбранную тему (6–8 предложений, из анкеты)

### Оценка (manual + AI DRAFT)
**Критерии (каждый 0–2 балла, итого 0–10):**

| Критерий | 0 | 1 | 2 |
|---|---|---|---|
| **Выполнение задачи** | Текст не по теме | Частично | Полностью раскрыта |
| **Лексика** | <20 уникальных слов | 20–35 | >35 уникальных |
| **Грамматика** | >5 грубых ошибок | 2–5 ошибок | ≤1 ошибки |
| **Связность** | Нет связи между предложениями | Частичная | Логичная структура |
| **Длина** | <4 предложений | 4–5 | 6–8+ |

### Параметры для AI-анализа (LanguageTool + Claude)
- error_count: количество ошибок (LanguageTool)
- error_types: ["Kasus", "Artikel", "Verb_konj", ...]
- word_count: количество слов
- unique_word_count: уникальные слова
- sentence_count: количество предложений

### Псевдокод автоматической предварительной оценки
```python
def estimate_writing_score(text: str, lt_errors: list) -> dict:
    words = text.split()
    word_count = len(words)
    unique_words = len(set(w.lower() for w in words))
    sentence_count = text.count('.') + text.count('!') + text.count('?')
    error_count = len(lt_errors)

    # Оценочные критерии
    task_score = 2 if sentence_count >= 6 else (1 if sentence_count >= 4 else 0)
    vocab_score = 2 if unique_words >= 35 else (1 if unique_words >= 20 else 0)
    grammar_score = 2 if error_count <= 1 else (1 if error_count <= 4 else 0)
    # coherence и length — manual или через Claude

    estimated = task_score + vocab_score + grammar_score
    return {
        "writing_estimated": estimated,
        "word_count": word_count,
        "unique_words": unique_words,
        "error_count": error_count,
        "note": "DRAFT — требуется проверка преподавателя"
    }
```

---

## Секция 5: Говорение — Sprechprobe (5 мин + upload)

### Задание
Аудиозапись 60–90 секунд: самопрезентация на немецком.
- Кто вы, откуда, чем занимаетесь
- Почему учите немецкий
- Что для вас сложнее всего

### Оценка (manual + Whisper + Claude DRAFT)
**Параметры (каждый 0–2 балла, итого 0–10):**

| Параметр | 0 | 1 | 2 |
|---|---|---|---|
| **Беглость (Fluency)** | Очень медленно, много пауз | Умеренно, паузы есть | Относительно плавно |
| **Произношение** | Очень трудно понять | Понятно с усилием | Понятно легко |
| **Лексика (Speaking)** | <15 уникальных слов | 15–25 | >25 слов |
| **Грамматика (Speaking)** | >5 грубых ошибок | 2–5 | ≤1–2 |
| **Выполнение задачи** | Не рассказал | Частично | Полная самопрезентация |

### Процесс автоматической обработки
```
1. Whisper API: транскрибация audio → text
2. LanguageTool: анализ транскрипта → errors
3. Claude: DRAFT-оценка fluency + pronunciation + краткие заметки
4. Преподаватель: финальная оценка + комментарий
```

---

## Секция 6: Самооценка (2 мин)

### Данные
- self_listening, self_reading, self_writing, self_speaking, self_grammar (1–5)
- self_avg = среднее из 5 показателей

### Использование
Сравнивается с объективными тестовыми баллами:
- Если self_avg > тестовые баллы: студент переоценивает себя → важно скорректировать ожидания
- Если self_avg < тестовые баллы: студент недооценивает себя → важно поддержать уверенность

---

## Итоговый расчёт CEFR

### Алгоритм (псевдокод)
```python
def calculate_cefr(listening_score, reading_score, self_avg,
                   writing_score=None, speaking_score=None) -> str:
    """
    listening_score: 0-3
    reading_score:   0-3
    self_avg:        1.0-5.0
    writing_score:   0-10 (если есть teacher оценка)
    speaking_score:  0-10 (если есть teacher оценка)
    """
    test_total = listening_score + reading_score  # 0-6

    # Базовый CEFR по тестам + самооценке
    if test_total <= 2 or self_avg < 2.0:
        base_cefr = "A1"
    elif test_total == 3 or (test_total <= 4 and self_avg < 2.5):
        base_cefr = "A2"
    elif test_total == 4 or (test_total >= 4 and self_avg < 3.5):
        base_cefr = "B1"
    elif test_total == 5 or (test_total == 5 and self_avg < 4.5):
        base_cefr = "B2"
    else:
        base_cefr = "C1"

    # Корректировка по Writing/Speaking (если есть teacher-оценка)
    if writing_score is not None and speaking_score is not None:
        combined = (writing_score + speaking_score) / 2  # 0-10
        if combined < 3 and base_cefr in ["B1", "B2"]:
            base_cefr = "A2"  # Downgrade если сильная разница
        elif combined >= 8 and base_cefr in ["A2", "B1"]:
            base_cefr = "B1"  # Upgrade если сильные productive skills

    return base_cefr
```

---

## Итоговые KPI диагностики

После полной диагностики в Airtable фиксируем:

```json
{
  "cefr_initial": "B1",
  "listening_comprehension": 67,
  "reading_comprehension": 100,
  "accuracy_percent": 70,
  "fluency_score": 3,
  "pronunciation_score": 2,
  "writing_score": 7,
  "speaking_score": 6,
  "self_avg": 3.2,
  "top_weaknesses": ["Speaking", "Pronunciation", "Kasus"],
  "top_strengths": ["Reading", "Vocabulary"],
  "diagnostic_date": "2024-01-15",
  "diagnostic_notes": "DRAFT — teacher review pending"
}
```

---

## Чек-лист преподавателя после диагностики

- [ ] Прослушать аудио студента (5–7 мин)
- [ ] Оценить Speaking по 5 критериям
- [ ] Оценить Writing по 5 критериям
- [ ] Проверить AI DRAFT (listening + reading — автоматически)
- [ ] Подтвердить или скорректировать CEFR initial
- [ ] Обновить `cefr_initial` и все KPI-поля в Airtable
- [ ] Запустить Claude prompt для генерации персонального плана
- [ ] Проверить и одобрить план (teacher_approved = TRUE)
- [ ] Отправить первое задание студенту
- [ ] Занести в Airtable Progress (первая запись — baseline)
