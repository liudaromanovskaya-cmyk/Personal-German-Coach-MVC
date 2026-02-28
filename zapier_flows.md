# Zapier / n8n Flows — Personal German Coach

Три автоматизированных потока для минимизации ручной работы преподавателя.

---

## FLOW A: Typeform → Airtable → Welcome Email + Calendly

### Триггер
- **Zapier:** Typeform → "New Entry"
- **n8n:** Typeform Trigger node

### Шаги

**A1. Trigger: Typeform — New Submission**
```
Input fields (mapping from Typeform):
  - student_name         ← f02.value
  - student_email        ← f03.value
  - student_city         ← f04.label
  - student_profession   ← f05.value
  - main_goal            ← f06.id → map to enum
  - target_exam          ← f06b.id → map to enum
  - deadline             ← f07.value (date)
  - homework_time        ← f08.label → extract number
  - preferred_formats    ← f09.labels (array)
  - self_listening       ← f11.value (1-5)
  - self_reading         ← f12.value
  - self_writing         ← f13.value
  - self_speaking        ← f14.value
  - self_grammar         ← f15.value
  - listening_q1_answer  ← f18.id
  - listening_q2_answer  ← f19.id
  - listening_q3_answer  ← f20.id
  - reading_q1_answer    ← f22.id
  - reading_q2_answer    ← f23.id
  - reading_q3_answer    ← f24.id
  - writing_sample       ← f27.value
  - speaking_audio_url   ← f29.file_url
  - psych_barriers       ← f31.labels (array)
  - learning_style       ← f33.id → map to enum
  - gdpr_data_consent    ← f36.value (bool)
  - gdpr_audio_consent   ← f37.value (bool)
  - gdpr_ai_consent      ← f38.value (bool)
  - consent_timestamp    ← submission.submitted_at
```

**A2. Code Step: Calculate Initial Scores**
```javascript
// Pseudo-code / JavaScript для Zapier Code или n8n Function

const correctAnswers = {
  listening_q1: "c18_2",
  listening_q2: "c19_1",
  listening_q3: "c20_3",
  reading_q1:   "c22_2",
  reading_q2:   "c23_2",
  reading_q3:   "c24_3"
};

const listening_score = [
  inputData.listening_q1_answer === correctAnswers.listening_q1,
  inputData.listening_q2_answer === correctAnswers.listening_q2,
  inputData.listening_q3_answer === correctAnswers.listening_q3,
].filter(Boolean).length;

const reading_score = [
  inputData.reading_q1_answer === correctAnswers.reading_q1,
  inputData.reading_q2_answer === correctAnswers.reading_q2,
  inputData.reading_q3_answer === correctAnswers.reading_q3,
].filter(Boolean).length;

const total_test_score = listening_score + reading_score; // max 6
const self_avg = (
  Number(inputData.self_listening) +
  Number(inputData.self_reading) +
  Number(inputData.self_writing) +
  Number(inputData.self_speaking) +
  Number(inputData.self_grammar)
) / 5;

// CEFR mapping
let cefr_initial = "A1";
if (total_test_score >= 6 && self_avg >= 4.5) cefr_initial = "C1";
else if (total_test_score >= 5 && self_avg >= 3.5) cefr_initial = "B2";
else if (total_test_score >= 4 && self_avg >= 2.5) cefr_initial = "B1";
else if (total_test_score >= 3 && self_avg >= 2.0) cefr_initial = "A2";

const listening_pct = Math.round((listening_score / 3) * 100);
const reading_pct   = Math.round((reading_score / 3) * 100);

return {
  cefr_initial,
  listening_comprehension: listening_pct,
  reading_comprehension:   reading_pct,
  self_avg: self_avg.toFixed(1)
};
```

**A3. Airtable — Create Record in "Students" table**
```
Table: Students
Fields to set:
  full_name               ← A1.student_name
  email                   ← A1.student_email
  city                    ← A1.student_city
  profession              ← A1.student_profession
  main_goal               ← A1.main_goal
  target_exam             ← A1.target_exam
  deadline                ← A1.deadline
  homework_time_minutes   ← A1.homework_time (parsed int)
  preferred_formats       ← A1.preferred_formats (array)
  self_listening          ← A1.self_listening
  self_reading            ← A1.self_reading
  self_writing            ← A1.self_writing
  self_speaking           ← A1.self_speaking
  self_grammar            ← A1.self_grammar
  learning_style          ← A1.learning_style
  psych_barriers          ← A1.psych_barriers
  cefr_initial            ← A2.cefr_initial
  listening_comprehension ← A2.listening_comprehension
  reading_comprehension   ← A2.reading_comprehension
  onboarding_audio_url    ← A1.speaking_audio_url
  gdpr_data_consent       ← A1.gdpr_data_consent
  gdpr_audio_consent      ← A1.gdpr_audio_consent
  gdpr_ai_consent         ← A1.gdpr_ai_consent
  gdpr_consent_date       ← A1.consent_timestamp
  status                  ← "Lead" (default)
  start_date              ← today()
  teacher_id              ← [YOUR_DEFAULT_TEACHER_ID]
```

**A4. Gmail / Mailerlite — Send Welcome Email to Student**
```
To:      A1.student_email
Subject: Добро пожаловать в Personal German Coach, {{student_name}}!
Body:    [HTML шаблон — см. ниже]
```

```html
<!-- Welcome Email Template -->
Liebe/r {{student_name}},

vielen Dank für Ihre Anmeldung bei Personal German Coach!

Ihr vorläufiges Sprachniveau: <b>{{cefr_initial}}</b>

Ihr persönlicher Lehrerin wird Ihre Ergebnisse prüfen und sich
innerhalb von 48 Stunden bei Ihnen melden.

Buchen Sie Ihr erstes Gespräch hier: {{CALENDLY_URL}}

---
На русском: Ваш предварительный уровень: {{cefr_initial}}.
Преподаватель свяжется в течение 48 часов.

С уважением,
Personal German Coach Team
```

**A5. Slack / Email — Notify Teacher**
```
Channel: #new-students (или email преподавателя)
Message:
  🆕 Новый студент: {{student_name}} ({{student_email}})
  📊 CEFR initial: {{cefr_initial}}
  🎯 Цель: {{main_goal}} | Экзамен: {{target_exam}}
  🔊 Аудио онбординга: {{speaking_audio_url}}
  📋 Airtable: {{airtable_record_url}}
  ➡️ Действие: Проверить аудио → Подтвердить CEFR → Создать план
```

---

## FLOW B: Submission Upload → Transcription → AI Analysis → Teacher Notification

### Триггер
- **Zapier:** Airtable → "New/Updated Record in Submissions" (когда audio_url заполнен)
- **n8n:** Airtable Trigger (on record update) или Webhook от студенческого интерфейса

### Шаги

**B1. Trigger: New Submission (audio_url is set)**
```
Input:
  submission_id   ← Airtable record ID
  assignment_id   ← linked record
  student_id      ← linked record
  audio_url       ← URL аудиофайла
  text_content    ← текстовый ответ (если есть)
  submission_type ← "Audio" / "Text" / "Mixed"
```

**B2. Save Audio to Google Drive / S3 (опционально)**
```
Если audio_url — временный (напр. Typeform, Uploadcare):
  - Google Drive: Upload File action
    → Input: audio_url (fetch content)
    → Folder: /GermanCoach/Submissions/{{student_id}}/
    → Filename: submission_{{submission_id}}_{{date}}.mp3
    → Output: permanent_audio_url

  - ИЛИ AWS S3: PutObject
    → Bucket: german-coach-submissions
    → Key: {{student_id}}/{{submission_id}}.mp3
```

**B3. Update Airtable — Set transcript_status = "Processing"**
```
Table: Submissions
Record: B1.submission_id
Fields:
  audio_url: B2.permanent_audio_url (обновить на постоянный URL)
  transcript_status: "Processing"
```

**B4. HTTP Request — OpenAI Whisper API (транскрипция)**
```
URL: https://api.openai.com/v1/audio/transcriptions
Method: POST
Headers:
  Authorization: Bearer {{OPENAI_API_KEY}}
  Content-Type: multipart/form-data

Body (multipart):
  file: [binary audio content от B2]
  model: whisper-1
  language: de
  response_format: json
  prompt: "Transkribieren Sie auf Deutsch. Der Sprecher ist Deutschlernender mit russischem Hintergrund."

Response:
  {
    "text": "Das ist mein erster Arbeitstag hier. Ich bin sehr aufgeregt..."
  }

Результат: transcript_text = response.text
```

**B5. HTTP Request — LanguageTool API (грамматическая проверка)**
```
URL: https://api.languagetool.org/v2/check
Method: POST
Headers:
  Content-Type: application/x-www-form-urlencoded

Body:
  text:     B4.transcript_text (или B1.text_content)
  language: de-DE
  enabledOnly: false

Response (пример):
  {
    "matches": [
      {
        "message": "Möglicherweise fehlt hier ein Komma.",
        "shortMessage": "Komma fehlt",
        "offset": 45,
        "length": 3,
        "replacements": [{"value": ", und"}],
        "rule": {"id": "DE_COMMA_BEFORE_ABER", "category": {"id": "PUNCTUATION"}}
      }
    ]
  }

Обработка:
  - Извлечь топ-5 ошибок по frequency
  - Сгруппировать по типу: Grammatik / Rechtschreibung / Stil
  - Сформировать список: [{error, suggestion, context}]
```

**B6. HTTP Request — Claude API (AI анализ + черновой комментарий)**
```
URL: https://api.anthropic.com/v1/messages
Method: POST
Headers:
  x-api-key: {{ANTHROPIC_API_KEY}}
  anthropic-version: 2023-06-01
  Content-Type: application/json

Body:
{
  "model": "claude-opus-4-6",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "Du analysierst die Sprachaufgabe eines Deutschlernenden.\n\nTRANSKRIPT:\n{{B4.transcript_text}}\n\nGRAMMATIKFEHLER (LanguageTool):\n{{B5.errors_list}}\n\nAufgabe: Erstelle einen kurzen DRAFT-Kommentar auf Russisch (2-3 Abschnitte):\n1. Was gut gelungen ist (1-2 Punkte)\n2. Die 3 wichtigsten Fehler mit Korrektur und kurzem Regelhinweis\n3. Empfehlung: worauf sich der Lernende als nächstes konzentrieren soll\n\nFormat: Bullet Points. Beginne jede Sektion mit dem Label. Markiere deutlich: [DRAFT — nicht verifiziert, Lehrer prüft]"
    }
  ]
}

Response:
  {
    "content": [{"type": "text", "text": "[DRAFT — nicht verifiziert...]\n\n✅ **Gut gelungen:**\n- ..."}]
  }
```

**B7. HTTP Request — Claude API (auto_tags)**
```
Отдельный запрос для тегов:

Body content:
  "Analysiere den folgenden deutschen Text und gib NUR eine JSON-Liste mit maximal 5 Tags zurück.
   Mögliche Tags: Grammatikfehler, Aussprache, Wortschatz, Satzstruktur, Kasus, Verb_konj, Artikel, Praepositionen, Gut

   Text: {{transcript_text}}

   Antworte NUR mit JSON: {\"tags\": [\"Tag1\", \"Tag2\"]}"

Response: {"tags": ["Kasus", "Artikel", "Gut"]}
```

**B8. Airtable — Update Submission Record**
```
Table: Submissions
Record: B1.submission_id
Fields:
  transcript:         B4.transcript_text
  transcript_status:  "Done"
  auto_tags:          B7.tags (array)
  draft_comment:      "[DRAFT — nicht verifiziert]\n" + B6.response_text
  ai_error_list:      B5.formatted_errors
  review_status:      "Teacher_review_pending"
```

**B9. Slack / Email — Notify Teacher**
```
To: teacher@email.com / Slack #reviews
Subject: 📥 Новое задание для проверки — {{student_name}}

Студент: {{student_name}} ({{cefr_current}})
Задание: {{assignment_title}}
Тип: {{submission_type}}
Теги: {{auto_tags}}

🤖 AI DRAFT готов (не верифицирован):
{{draft_comment_preview (first 200 chars)...}}

→ Открыть в Airtable: {{airtable_record_url}}
→ Аудио: {{audio_url}}

Пожалуйста, проверьте DRAFT и добавьте финальный комментарий.
```

---

## FLOW C: Purchase (Gumroad/Stripe) → Create Plan → Welcome Sequence

### Триггер
- **Zapier:** Gumroad "New Sale" ИЛИ Stripe "Payment Succeeded"
- **n8n:** Webhook

### Шаги

**C1. Trigger: New Purchase**
```
Gumroad input:
  buyer_name:   sale.full_name
  buyer_email:  sale.email
  product_name: sale.product_name  (→ map to subscription_plan)
  amount:       sale.price
  sale_id:      sale.sale_id

Stripe input:
  buyer_email:  payment_intent.receipt_email
  product_name: metadata.product_name
  amount:       amount_received / 100
  payment_id:   payment_intent.id
```

**C2. Find or Create Student in Airtable**
```
Search: Students WHERE email = C1.buyer_email
If found: update subscription_plan, status = "Active"
If not found: create new record with:
  email:             C1.buyer_email
  full_name:         C1.buyer_name
  subscription_plan: map product_name → plan type
  status:            "Active"
  start_date:        today()
  teacher_id:        [DEFAULT_TEACHER_ID]
```

**C3. Map Product → Subscription Plan**
```javascript
const planMap = {
  "Diagnostics Report":  "Free_trial",
  "Integration Feed 30": "Feed_only",
  "German Intensive 8h": "Intensive_8h",
  "Strategic Track":     "Strategic_track",
  "Premium Mentorship":  "Premium_mentorship"
};
const plan = planMap[inputData.product_name] || "Free_trial";
```

**C4. Airtable — Create Plan Record**
```
Table: Plans
Fields:
  plan_name:      "{{full_name}} — {{plan_type}} ({{start_date}})"
  student_id:     C2.student_airtable_id
  teacher_id:     [DEFAULT_TEACHER_ID]
  plan_type:      "Monthly"
  start_date:     today()
  end_date:       today() + 30 days
  status:         "Draft"
  ai_generated:   false
  teacher_approved: false
```

**C5. Gmail / Mailerlite — Welcome Sequence Email 1 (immediate)**
```
To: C1.buyer_email
Subject: Ваша программа активирована! Следующий шаг — знакомство с преподавателем

Hallo {{buyer_name}}!

Ваша программа "{{product_name}}" успешно активирована.

СЛЕДУЮЩИЙ ШАГ: Забронируйте вводную сессию с вашим преподавателем:
→ {{CALENDLY_URL}}

Что вас ждёт:
✓ Подтверждение вашего уровня CEFR
✓ Персональный учебный план
✓ Первое задание уже на этой неделе

С уважением,
[Имя преподавателя]
Personal German Coach
```

**C6. Delay + Email 2 (через 24 часа)**
```
Subject: Как подготовиться к первому уроку

Содержание:
- Что взять с собой (документы об образовании, сертификаты)
- Что ожидать от первого занятия
- Как устроена платформа
- FAQ
```

**C7. Delay + Email 3 (через 72 часа — если нет booking)**
```
Subject: Не пропустите ваш стартовый урок!

IF Calendly booking NOT detected:
  - Напоминание
  - Ссылка на бронирование
  - Кнопка "Перенести на другое время"

IF Calendly booking detected:
  - Подтверждение
  - Инструкции по первому уроку
```

**C8. Slack — Notify Teacher of New Student**
```
💳 Новая продажа: {{product_name}} — {{full_name}} ({{email}})
💰 Сумма: {{amount}}€
📋 Airtable: {{student_record_url}}
📅 Calendly booking: проверьте dashboard
```

---

## Пример HTTP вызовов (curl)

### Whisper API
```bash
curl https://api.openai.com/v1/audio/transcriptions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F file="@submission_audio.mp3" \
  -F model="whisper-1" \
  -F language="de" \
  -F response_format="json"
```

### LanguageTool API
```bash
curl -X POST 'https://api.languagetool.org/v2/check' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'text=Ich habe ein Fehler gemacht heute.' \
  --data-urlencode 'language=de-DE'
```

### Claude API
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-opus-4-6",
    "max_tokens": 1024,
    "messages": [
      {
        "role": "user",
        "content": "Analysiere den folgenden Deutschtext eines Lernenden: [TRANSCRIPT]"
      }
    ]
  }'
```

---

## n8n-специфичные узлы (для справки)

```
Flow A:
  [Typeform Trigger] → [Function: Calculate Scores] → [Airtable: Create Student]
  → [Gmail: Send Welcome] → [Slack: Notify Teacher]

Flow B:
  [Airtable Trigger] → [HTTP: Whisper] → [HTTP: LanguageTool]
  → [HTTP: Claude Analysis] → [HTTP: Claude Tags]
  → [Airtable: Update Submission] → [Gmail/Slack: Notify Teacher]

Flow C:
  [Webhook: Gumroad/Stripe] → [Airtable: Find/Create Student]
  → [Airtable: Create Plan] → [Gmail: Email 1]
  → [Wait 24h] → [Gmail: Email 2]
  → [Wait 72h] → [IF: Calendly booked?] → [Gmail: Email 3a/3b]
  → [Slack: Notify Teacher]
```

---

## Переменные окружения (secrets)

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
AIRTABLE_API_KEY=pat...
AIRTABLE_BASE_ID=app...
TYPEFORM_WEBHOOK_SECRET=...
GUMROAD_API_KEY=...
STRIPE_WEBHOOK_SECRET=...
CALENDLY_URL=https://calendly.com/yourname/intro
GMAIL_SMTP_USER=...
SLACK_BOT_TOKEN=xoxb-...
SLACK_CHANNEL_ID=C0123456789
TEACHER_EMAIL=teacher@yourdomain.com
DEFAULT_TEACHER_AIRTABLE_ID=rec...
S3_BUCKET=german-coach-submissions
AWS_REGION=eu-central-1
```
