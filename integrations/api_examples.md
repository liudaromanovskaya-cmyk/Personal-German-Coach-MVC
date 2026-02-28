# API Интеграции — Примеры вызовов

**Файл:** integrations/api_examples.md
**Содержание:** curl и Node.js примеры для Whisper, LanguageTool, Claude API

---

## 1. OpenAI Whisper API — Транскрипция аудио

### curl
```bash
# Транскрипция локального файла
curl https://api.openai.com/v1/audio/transcriptions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F file="@/path/to/student_audio.mp3" \
  -F model="whisper-1" \
  -F language="de" \
  -F response_format="json" \
  -F prompt="Transkript auf Deutsch. Der Sprecher ist Deutschlernender mit russischem Hintergrund."

# Ответ:
# {"text": "Guten Tag, mein Name ist Anna. Ich bin Softwareentwicklerin..."}
```

### Node.js (с fetch URL аудио)
```javascript
import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function transcribeAudio(audioUrl, apiKey) {
  // Шаг 1: Скачать аудиофайл
  const audioResponse = await fetch(audioUrl);
  const audioBuffer = await audioResponse.buffer();

  // Шаг 2: Подготовить FormData
  const formData = new FormData();
  formData.append('file', audioBuffer, {
    filename: 'audio.mp3',
    contentType: 'audio/mpeg'
  });
  formData.append('model', 'whisper-1');
  formData.append('language', 'de');
  formData.append('response_format', 'json');
  formData.append('prompt',
    'Transkribiere auf Deutsch. Sprecher ist Deutschlernender mit russischem Hintergrund.');

  // Шаг 3: Отправить запрос
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      ...formData.getHeaders()
    },
    body: formData
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Whisper API error: ${JSON.stringify(data)}`);
  }

  return {
    transcript: data.text,
    word_count: data.text.split(' ').length
  };
}

// Использование:
const result = await transcribeAudio(
  'https://drive.google.com/uc?id=ABC123',
  process.env.OPENAI_API_KEY
);
console.log(result.transcript);
```

### Пример ответа Whisper
```json
{
  "text": "Guten Tag! Mein Name ist Anna Kravchenko. Ich bin Softwareentwicklerin und arbeite seit zwei Jahren in München. Ich lerne Deutsch, weil ich besser mit meinen Kollegen und Kunden kommunizieren möchte. Am schwersten fällt mir das Sprechen, weil ich Angst habe, Fehler zu machen."
}
```

---

## 2. LanguageTool API — Грамматическая проверка

### curl
```bash
curl -X POST 'https://api.languagetool.org/v2/check' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'text=Ich habe ein Fehler gemacht. Ich arbeite mit mein Team zusammen.' \
  --data-urlencode 'language=de-DE' \
  --data-urlencode 'enabledOnly=false'
```

### Node.js
```javascript
async function checkGrammar(text, apiKey = null) {
  const params = new URLSearchParams({
    text: text,
    language: 'de-DE',
    enabledOnly: 'false'
  });

  // Для premium API (больше правил):
  if (apiKey) {
    params.append('apiKey', apiKey);
    params.append('username', process.env.LANGUAGETOOL_USERNAME);
  }

  const response = await fetch('https://api.languagetool.org/v2/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });

  const data = await response.json();

  // Форматировать ошибки для Claude prompt
  const formattedErrors = data.matches.map((match, i) => ({
    index: i + 1,
    message: match.message,
    rule_id: match.rule.id,
    category: match.rule.category.id,
    context: match.context.text,
    offset: match.offset,
    length: match.length,
    suggestion: match.replacements[0]?.value || null
  }));

  return {
    error_count: data.matches.length,
    errors: formattedErrors,
    top_categories: getTopCategories(formattedErrors)
  };
}

function getTopCategories(errors) {
  const cats = {};
  errors.forEach(e => {
    cats[e.category] = (cats[e.category] || 0) + 1;
  });
  return Object.entries(cats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat, count]) => ({ category: cat, count }));
}
```

### Пример ответа LanguageTool
```json
{
  "software": {"name": "LanguageTool", "version": "6.4"},
  "matches": [
    {
      "message": "Möglicherweise Artikel-Fehler. Bitte beachten Sie: 'Fehler' ist maskulin (der Fehler) und benötigt im Akkusativ 'einen'.",
      "shortMessage": "Falscher Artikel",
      "offset": 9,
      "length": 3,
      "replacements": [{"value": "einen"}],
      "context": {
        "text": "Ich habe ein Fehler gemacht.",
        "offset": 9,
        "length": 3
      },
      "rule": {
        "id": "DE_AGREEMENT",
        "description": "Übereinstimmung von Artikel und Substantiv",
        "issueType": "grammar",
        "category": {"id": "GRAMMAR", "name": "Grammatik"}
      }
    },
    {
      "message": "Nach 'mit' steht der Dativ. 'mein' müsste im Dativ 'meinem' heißen.",
      "shortMessage": "Falscher Kasus",
      "offset": 39,
      "length": 4,
      "replacements": [{"value": "meinem"}],
      "context": {
        "text": "Ich arbeite mit mein Team zusammen.",
        "offset": 16,
        "length": 4
      },
      "rule": {
        "id": "DATIV_NACH_MIT",
        "issueType": "grammar",
        "category": {"id": "GRAMMAR", "name": "Grammatik"}
      }
    }
  ]
}
```

---

## 3. Claude API — AI-анализ транскрипта

### curl
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-opus-4-6",
    "max_tokens": 1500,
    "messages": [
      {
        "role": "user",
        "content": "Analysiere die Sprachaufgabe eines Deutschlernenden.\n\nTRANSKRIPT:\nGuten Tag! Mein Name ist Anna. Ich bin Softwareentwicklerin. Ich arbeite mit mein Team... äh... seit zwei Jahre in München.\n\nLANGUAGETOOL-FEHLER:\n1. GRAMMAR: '\''mit mein Team'\'' → '\''mit meinem Team'\'' (Dativ nach mit)\n2. GRAMMAR: '\''seit zwei Jahre'\'' → '\''seit zwei Jahren'\'' (Dativ Plural)\n\nErstelle einen DRAFT-Kommentar auf Russisch. Format: Abschnitte mit Bullets."
      }
    ]
  }'
```

### Node.js (полная интеграция)
```javascript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function analyzeSubmission({
  transcript,
  languageToolErrors,
  assignmentType,
  studentName,
  cefrLevel,
  learningStyle
}) {
  // Форматировать ошибки LanguageTool в читаемый список
  const errorsText = languageToolErrors.errors
    .slice(0, 10) // Топ-10 ошибок
    .map((e, i) => `${i + 1}. ${e.category}: "${e.context}" → "${e.suggestion}" (${e.message})`)
    .join('\n');

  const prompt = `Du analysierst die Sprachaufgabe eines Deutschlernenden.

STUDENT: ${studentName} | CEFR: ${cefrLevel} | Lernstil: ${learningStyle}
AUFGABENTYP: ${assignmentType}

TRANSKRIPT / TEXT:
---
${transcript}
---

LANGUAGETOOL-FEHLER (automatisch erkannt):
---
${errorsText}
---

Erstelle einen strukturierten DRAFT-Kommentar auf RUSSISCH.

Format:
---
⚠️ [DRAFT — AI-Analyse, vom Lehrer zu prüfen]

**✅ Was gut gelungen ist:**
• [Punkt 1]
• [Punkt 2]

**⚠️ Top-3 Fehler mit Erklärung:**
1. **[Fehlertyp]**: "[Zitat]" → "[Korrektur]"
   Правило: [1 Satz auf Russisch]

2. ...
3. ...

**📅 Fokus für 2 Wochen:**
→ Priorität: [konkrete Aufgabe]
→ Zusätzlich: [zweite Aufgabe]

**🗂️ Anki-Karten:**
слово;перевод;пример ошибки;правильный пример
[3-5 Zeilen]
---`;

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1200,
    messages: [{ role: 'user', content: prompt }]
  });

  return {
    draft_comment: response.content[0].text,
    tokens_used: response.usage.input_tokens + response.usage.output_tokens
  };
}

// Генерация тегов
async function generateTags(transcript) {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',  // Быстрая модель для простых задач
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `Analysiere diesen deutschen Text und antworte NUR mit JSON.
Mögliche Tags: Grammatikfehler, Aussprache, Wortschatz, Satzstruktur, Kasus, Verb_konj, Artikel, Praepositionen, Gut
Wähle maximal 4 zutreffende Tags.

Text: "${transcript}"

Antworte nur: {"tags": ["Tag1", "Tag2"]}`
    }]
  });

  try {
    return JSON.parse(response.content[0].text);
  } catch {
    return { tags: ["Grammatikfehler"] };
  }
}

// Генерация персонального плана
async function generateLearningPlan(studentData) {
  const { name, cefrInitial, cefrTarget, goal, profession,
          learningStyle, weaknesses, homeworkMinutes } = studentData;

  const response = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Erstelle einen personalisierten Monats-Lernplan auf Russisch.

STUDENT: ${name}
LEVEL: ${cefrInitial} → Ziel: ${cefrTarget}
ZIEL: ${goal}
BERUF: ${profession}
LERNSTIL: ${learningStyle}
SCHWACHSTELLEN: ${weaknesses.join(', ')}
HAUSAUFGABENZEIT: ${homeworkMinutes} Min/Tag

Erstelle:
1. Monatsplan (4 Wochen, Thema + Aufgaben)
2. Detaillierter Wochenplan (Woche 1)
3. Psychologische Strategie für ${learningStyle}-Lerner
4. KPIs für Ende des Monats

Sprache: Russisch mit deutschen Fachbegriffen. Markiere als [DRAFT].`
    }]
  });

  return response.content[0].text;
}
```

---

## 4. Полный Pipeline (Node.js)

```javascript
// main-pipeline.js
// Полный поток обработки submission

async function processSubmission(submissionId, audioUrl, textContent) {
  console.log(`Processing submission ${submissionId}...`);

  // Шаг 1: Транскрипция (если есть аудио)
  let transcript = textContent;
  if (audioUrl) {
    console.log('Step 1: Whisper transcription...');
    const whisperResult = await transcribeAudio(audioUrl, process.env.OPENAI_API_KEY);
    transcript = whisperResult.transcript;
    await updateAirtable(submissionId, {
      transcript,
      transcript_status: 'Processing'
    });
  }

  // Шаг 2: LanguageTool анализ
  console.log('Step 2: LanguageTool grammar check...');
  const grammarResult = await checkGrammar(transcript);

  // Шаг 3: Claude — теги
  console.log('Step 3: Claude tagging...');
  const tagsResult = await generateTags(transcript);

  // Шаг 4: Claude — DRAFT комментарий
  console.log('Step 4: Claude analysis...');
  const { draft_comment } = await analyzeSubmission({
    transcript,
    languageToolErrors: grammarResult,
    assignmentType: 'Roleplay',  // Получить из Airtable
    studentName: 'Anna',
    cefrLevel: 'B1',
    learningStyle: 'Analytical'
  });

  // Шаг 5: Обновить Airtable
  console.log('Step 5: Update Airtable...');
  await updateAirtable(submissionId, {
    transcript,
    transcript_status: 'Done',
    auto_tags: tagsResult.tags,
    draft_comment: `[DRAFT — nicht verifiziert]\n\n${draft_comment}`,
    ai_error_list: JSON.stringify(grammarResult.errors),
    review_status: 'Teacher_review_pending'
  });

  // Шаг 6: Уведомить преподавателя
  console.log('Step 6: Notify teacher...');
  await notifyTeacher({
    submissionId,
    studentName: 'Anna',
    tags: tagsResult.tags,
    draftPreview: draft_comment.substring(0, 200)
  });

  console.log('Pipeline complete!');
  return { success: true, submissionId };
}
```

---

## 5. Шаблон ответа (пример полного DRAFT)

```
⚠️ [DRAFT — AI-анализ. Не верифицирован. Преподаватель проверит перед отправкой.]

✅ ЧТО ПОЛУЧИЛОСЬ ХОРОШО:
• Чёткая самопрезентация! "Ich bin Softwareentwicklerin und arbeite seit zwei Jahren in München" — отличное начало.
• Профессиональная лексика использована уверенно. "Deployment", "Sprint" — правильно и в контексте.

⚠️ ТОП-3 ОШИБКИ:

1. **Kasus (Dativ nach MIT)**: "mit mein Team" → "mit meinem Team"
   Правило: После предлога MIT всегда Dativ. Maskulin/Neutrum: mein → meinem; Feminin: meine → meiner.

2. **Kasus (Dativ Plural)**: "seit zwei Jahre" → "seit zwei Jahren"
   Правило: После SEIT (темпоральный) — Dativ. Во множественном числе Dativ добавляет -n: Jahre → Jahren.

3. **Nebensatz**: "weil ich Angst haben" → "weil ich Angst habe"
   Правило: В придаточном (weil, dass, ob) глагол идёт В КОНЕЦ предложения, но сам по себе спрягается нормально.

📅 ФОКУС НА 2 НЕДЕЛИ:
→ Приоритет: Предлоги + Dativ (mit, bei, nach, seit, von, zu, aus) — выучить наизусть + задание 05
→ Дополнительно: Порядок слов в Nebensatz — по 2-3 предложения ежедневно

🗂️ ANKI-КАРТОЧКИ:
mit + Dativ;с (Дательный);mit mein Team (❌);mit meinem Team (✅)
seit + Dativ;с (временной);seit zwei Jahre (❌);seit zwei Jahren (✅)
weil + Verb-Ende;потому что;weil ich Angst haben (❌);weil ich Angst habe (✅)
```

---

## 6. Переменные окружения (.env)

```env
# OpenAI / Whisper
OPENAI_API_KEY=sk-...

# Anthropic / Claude
ANTHROPIC_API_KEY=sk-ant-...

# LanguageTool Premium (опционально)
LANGUAGETOOL_API_KEY=...
LANGUAGETOOL_USERNAME=email@example.com

# Airtable
AIRTABLE_API_KEY=pat...
AIRTABLE_BASE_ID=app...
AIRTABLE_STUDENTS_TABLE=Students
AIRTABLE_SUBMISSIONS_TABLE=Submissions

# Storage
GOOGLE_DRIVE_FOLDER_ID=...
# ИЛИ
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=eu-central-1
S3_BUCKET_NAME=german-coach-submissions

# Notifications
SLACK_BOT_TOKEN=xoxb-...
SLACK_TEACHER_CHANNEL=#teacher-reviews
TEACHER_EMAIL=your@email.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
```
