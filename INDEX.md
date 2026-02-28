# Personal German Coach — Навигатор по проекту

**Дата создания:** 2024 | **Версия:** MVP 1.0
**Назначение:** Полный набор артефактов для запуска платформы репетитора немецкого языка

---

## Быстрый старт — MVP за 7 дней

```
День 1 → typeform_onboarding.json + airtable_schema.json
День 2 → assignments/ (10 штук) + Google Drive
День 3 → landing_copy.md → Carrd.co + Gumroad
День 4 → zapier_flows.md → Flow A + Flow C
День 5 → Полный тест системы
День 6 → 5 бета-студентов (скрипт в roadmap_14days.md)
День 7 → Первые задания выданы
```

Подробный чек-лист → [roadmap_14days.md](roadmap_14days.md)

---

## Карта всех файлов

### Приоритет 1 — Сразу использовать

| Файл | Назначение | Куда импортировать |
|---|---|---|
| [typeform_onboarding.json](typeform_onboarding.json) | Анкета онбординга + диагностика | Typeform |
| [airtable_schema.json](airtable_schema.json) | Схема базы данных (6 таблиц) | Airtable (вручную) |
| [sample_records.csv](sample_records.csv) | Тестовые записи для Airtable | Airtable Import |
| [zapier_flows.md](zapier_flows.md) | 3 автоматизированных потока | Zapier / n8n |
| [feed_30_days.json](feed_30_days.json) | 30-дневный интеграционный фид | MailerLite / Email |

---

### Приоритет 2 — Контент и задания

| Файл | Тип задания | Уровень |
|---|---|---|
| [assignments/assignment_01_listening_summary.md](assignments/assignment_01_listening_summary.md) | Аудирование + пересказ | A2–B2 |
| [assignments/assignment_02_dictation.md](assignments/assignment_02_dictation.md) | Диктант | A1–B1 |
| [assignments/assignment_03_cloze_professional.md](assignments/assignment_03_cloze_professional.md) | Cloze (IT/Medizin/Management) | B1–B2 |
| [assignments/assignment_04_mini_email.md](assignments/assignment_04_mini_email.md) | Деловое письмо | A2–B2 |
| [assignments/assignment_05_sentence_correction.md](assignments/assignment_05_sentence_correction.md) | Коррекция предложений | A2–B2 |
| [assignments/assignment_06_pronunciation_drill.md](assignments/assignment_06_pronunciation_drill.md) | Произношение (ch, R, Umlaute) | A1–B2 |
| [assignments/assignment_07_roleplay_interview.md](assignments/assignment_07_roleplay_interview.md) | Ролевая игра / собеседование | B1–B2 |
| [assignments/assignment_08_reading_comprehension.md](assignments/assignment_08_reading_comprehension.md) | Чтение с пониманием | B1–B2 |
| [assignments/assignment_09_vocabulary_set.md](assignments/assignment_09_vocabulary_set.md) | Тематический словарь | A2–B2 |
| [assignments/assignment_10_mini_presentation.md](assignments/assignment_10_mini_presentation.md) | Мини-презентация | B1–C1 |

---

### Приоритет 3 — AI и автоматизация

| Файл | Назначение |
|---|---|
| [prompts/plan_generator.txt](prompts/plan_generator.txt) | Claude prompt для генерации персонального плана |
| [prompts/auto_analysis.txt](prompts/auto_analysis.txt) | Claude prompt для анализа транскрипта (DRAFT) |
| [prompts/microtask_generator.txt](prompts/microtask_generator.txt) | Claude prompt для генерации микро-заданий |
| [integrations/api_examples.md](integrations/api_examples.md) | curl + Node.js: Whisper / LanguageTool / Claude API |

---

### Диагностика и прогресс

| Файл | Назначение |
|---|---|
| [diagnostic_test_plan.md](diagnostic_test_plan.md) | Детальный план диагностики (30–45 мин) + алгоритм CEFR |
| [feedback_template.md](feedback_template.md) | Шаблон фидбека к заданию + месячный отчёт |
| [anki_export.csv](anki_export.csv) | 22 готовых Anki-карточки (интеграция, грамматика, профлексика) |

---

### Методологическая библиотека

| Файл | Навык |
|---|---|
| [methodology_library/skill_listening.md](methodology_library/skill_listening.md) | Аудирование |
| [methodology_library/skill_reading.md](methodology_library/skill_reading.md) | Чтение |
| [methodology_library/skill_writing.md](methodology_library/skill_writing.md) | Письмо |
| [methodology_library/skill_speaking.md](methodology_library/skill_speaking.md) | Говорение |
| [methodology_library/skill_grammar.md](methodology_library/skill_grammar.md) | Грамматика |
| [methodology_library/skill_vocabulary.md](methodology_library/skill_vocabulary.md) | Лексика |
| [methodology_library/skill_pronunciation.md](methodology_library/skill_pronunciation.md) | Произношение |
| [methodology_library/psychological_techniques.md](methodology_library/psychological_techniques.md) | Психологические техники (10 методов) |

---

### Юридические документы

| Файл | Назначение |
|---|---|
| [gdpr_consent_ru.md](gdpr_consent_ru.md) | Согласие GDPR на русском (3 блока) |
| [gdpr_consent_de.md](gdpr_consent_de.md) | Einwilligungserklärung auf Deutsch |

---

### Маркетинг и рост

| Файл | Назначение |
|---|---|
| [landing_copy.md](landing_copy.md) | Тексты лендинга + email-воронка (5 писем) + реферальная программа |
| [market_intel_spec.md](market_intel_spec.md) | Market-Intel агент: 20 источников, weekly report шаблон |
| [roadmap_14days.md](roadmap_14days.md) | MVP план (по дням) + бета-тест скрипт + интервью вопросы |

---

### UX и архитектура

| Файл | Назначение |
|---|---|
| [dashboard_ux_spec.md](dashboard_ux_spec.md) | 6 экранов dashboard: Student Profile / Plan Editor / Submissions / Auto-Analysis / Methodology Library / Market-Intel |

---

## Архитектура системы (обзор)

```
СТУДЕНТ                    СИСТЕМА                      ПРЕПОДАВАТЕЛЬ
─────────                  ────────                     ─────────────
Typeform анкета
    ↓
Zapier Flow A ──────────→ Airtable: Students ─────────→ Slack/Email уведомление
    ↓                          ↓
Welcome Email           Airtable: Plans ←──────── Claude: plan_generator.txt
    ↓                          ↓                         ↑ teacher_approved
Задания (Assignments)   Airtable: Assignments        Plan Editor (Dashboard)
    ↓
Студент загружает аудио/текст
    ↓
Zapier Flow B:
  1. Google Drive / S3
  2. Whisper API → transcript
  3. LanguageTool → grammar errors
  4. Claude: auto_analysis.txt → DRAFT comment
  5. Airtable: Submissions (draft_comment)
    ↓
                    ────────────────────────────→ Teacher Review (Dashboard)
                                                     ↓
                                                 teacher_comment (верифицированный)
                                                     ↓
                    ←──────────────────────────── Email студенту
                                                     ↓
                                                 Airtable: Progress
                                                 (еженедельные / месячные KPI)
```

---

## Ключевые переменные окружения (нужны для запуска)

```env
OPENAI_API_KEY=          # Whisper транскрипция
ANTHROPIC_API_KEY=       # Claude анализ и генерация планов
AIRTABLE_API_KEY=        # База данных
AIRTABLE_BASE_ID=        # ID вашей Airtable базы
TYPEFORM_WEBHOOK_SECRET= # Безопасность вебхука
GUMROAD_API_KEY=         # Монетизация (опционально)
CALENDLY_URL=            # Ссылка на бронирование
TEACHER_EMAIL=           # Email преподавателя
SLACK_BOT_TOKEN=         # Уведомления (опционально)
```

---

## Маппинг: Typeform → Airtable (поля)

| Typeform поле (ref) | Airtable поле | Тип |
|---|---|---|
| student_name | full_name | Text |
| student_email | email | Email |
| student_city | city | Select |
| student_profession | profession | Text |
| main_goal | main_goal | Select |
| target_exam | target_exam | Select |
| deadline | deadline | Date |
| homework_time | homework_time_minutes | Number |
| self_listening–self_grammar | self_* (5 поля) | Number |
| learning_style | learning_style | Select |
| psych_barriers | psych_barriers | Multi-select |
| speaking_audio | onboarding_audio_url | URL |
| gdpr_* | gdpr_* | Checkbox |
| *_q1–*_q3 | *(вычисляются в Zapier code step) | — |

---

## CEFR маппинг (быстрый справочник)

| Тест-балл (0–6) | Self avg (1–5) | CEFR |
|---|---|---|
| 0–2 | < 2.0 | A1 |
| 3 | 2.0–2.4 | A2 |
| 4 | 2.5–3.4 | B1 |
| 5 | 3.5–4.4 | B2 |
| 6 | 4.5–5.0 | C1 |

*Финальное решение всегда за преподавателем после проверки Speaking и Writing.*

---

## Контакт и поддержка

- Вопросы по Typeform API: typeform.com/developers
- Вопросы по Airtable: airtable.com/developers
- Anthropic Claude API: docs.anthropic.com
- OpenAI Whisper: platform.openai.com/docs
- LanguageTool API: languagetool.org/http-api
- n8n документация: docs.n8n.io

---

*Все AI-сгенерированные комментарии помечаются как [DRAFT] и требуют верификации преподавателя перед отправкой студенту.*
