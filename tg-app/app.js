// Telegram Web App SDK — подключение и инициализация
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.expand();
  tg.ready();
  // Тёмная тема: если Telegram в тёмном режиме — добавляем класс body.dark
  if (tg.colorScheme === 'dark') document.body.classList.add('dark');
  tg.onEvent('themeChanged', () => {
    document.body.classList.toggle('dark', tg.colorScheme === 'dark');
  });
}

// ── LocalStorage: Fortschritt speichern ───────────────────────────────────
function loadProgress(studentId) {
  try { return JSON.parse(localStorage.getItem('pgc_' + studentId) || '{}'); }
  catch { return {}; }
}
function saveProgress(studentId, data) {
  localStorage.setItem('pgc_' + studentId, JSON.stringify(data));
  // Mirror to Firebase — works across devices
  if (typeof fbSetPublic === 'function') {
    fbSetPublic(`progress/${studentId}/criteria`, data).catch(() => {});
  }
}
function applyProgress(student, id) {
  const saved = loadProgress(id);
  student.skills.forEach((skill, si) => {
    if (!saved[si]) return;
    skill.criteria.forEach((c, ci) => {
      if (saved[si][ci] !== undefined) c.done = saved[si][ci];
    });
  });
}

// ── Глобальный студент (для submit-функций) ───────────────────────────────
let _student = null;
let _studentId = '';
// Firebase: данные педагога, загруженные до рендера
let _firebaseTeacherData = null;
// Firebase: фидбек педагога на сегодняшние домашки
let _teacherSubmissionFeedback = null;
// Расписание повторений слов
let _wordSchedule = {};

// Ключ слова для Firebase (без спецсимволов)
function wordKey(w) { return w.replace(/[.#$\/\[\] ]/g, '_'); }

// Интервал повторения по статусу
function nextReviewDays(status) {
  if (status === 'forgotten') return 1;
  if (status === 'red')       return 2;
  if (status === 'yellow')    return 4;
  if (status === 'green')     return 10;
  return 2;
}
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

// ── Telegram-уведомление преподавателю ───────────────────────────────────
async function notifyTeacher(text) {
  if (typeof NOTIFY_CONFIG === 'undefined') return;
  const { botToken, teacherChatId } = NOTIFY_CONFIG;
  if (!botToken || !teacherChatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: teacherChatId, text, parse_mode: 'HTML' })
    });
  } catch(e) { /* тихо — не мешать студенту если нет сети */ }
}

// ── Student ermitteln ─────────────────────────────────────────────────────
function getStudentId() {
  // Вариант 1: открыто через Telegram Mini App — t.me/PersonalGermanCoachBot/cabinet?startapp=artem
  const startParam = tg?.initDataUnsafe?.start_param;
  if (startParam) return startParam.toLowerCase();
  // Вариант 2: открыто по прямой ссылке — ?student=artem
  const params = new URLSearchParams(window.location.search);
  return params.get('student')?.toLowerCase() || '';
}

// ── Sprint: разбор [слово]-разметки в чанках ──────────────────────────────
function parseChunk(text, wordData) {
  const verbSet = new Set((wordData.verbForms || []).map(f => f.toLowerCase()));
  const reflexPronouns = new Set(['mich', 'sich', 'uns', 'mir', 'dir', 'euch', 'dich']);
  return text.replace(/\[([^\]]+)\]/g, (_match, inner) => {
    const firstWord = inner.toLowerCase().split(' ')[0];
    if (verbSet.has(firstWord) || verbSet.has(inner.toLowerCase())) {
      return `<strong class="chunk-verb">${inner}</strong>`;
    }
    if (reflexPronouns.has(firstWord)) {
      return `<em class="chunk-reflex">${inner}</em>`;
    }
    return `<span class="chunk-prep">${inner}</span>`;
  });
}

// ── Render ────────────────────────────────────────────────────────────────
let _studentLevel = 'B1'; // глобально — для Kultur

function render() {
  const id = getStudentId();
  const student = STUDENTS[id];
  const app = document.getElementById('app');

  if (!student) {
    app.innerHTML = `
      <div class="not-found">
        <div class="not-found-icon">🔒</div>
        <div class="not-found-title">Seite nicht gefunden</div>
        <div class="not-found-text">Bitte nutzen Sie den Link, den Ihre Lehrerin Ihnen geschickt hat.</div>
      </div>`;
    return;
  }

  _student = student;

  // ── Данные из панели педагога (teacher.html) ──────────────────────────────
  // Firebase (основной источник) → localStorage (резерв)
  // Мержим только заполненные поля — слова из students.js не трогаем если форма пустая
  try {
    let teacherRaw = null;
    if (_firebaseTeacherData) {
      teacherRaw = JSON.stringify(_firebaseTeacherData);
    } else {
      teacherRaw = localStorage.getItem(`pgc_teacher_${id}`);
    }
    if (teacherRaw) {
      const td = JSON.parse(teacherRaw);
      student.sprint = student.sprint || {};
      // Только метаданные дня — не трогаем words/wordsWriting
      if (td.today) {
        student.sprint.today = student.sprint.today || {};
        if (td.today.date) student.sprint.today.date = td.today.date;
        if (td.today.theme) student.sprint.today.theme = td.today.theme;
        // Задания говорения — только если заполнены
        if (td.today.task?.topic) student.sprint.today.task = td.today.task;
        if (td.today.deepen?.topic) student.sprint.today.deepen = td.today.deepen;
        if (td.today.immerse?.topic) student.sprint.today.immerse = td.today.immerse;
        // Слова — только если реально заполнены в форме
        if (td.today.words?.length) student.sprint.today.words = td.today.words;
        if (td.today.words2?.length) student.sprint.today.words2 = td.today.words2;
        // Пост-сабмишн
        if (td.today.postSubmit?.done) student.sprint.today.postSubmit = td.today.postSubmit;
        // Roter Faden + дополнительные материалы
        if (td.today.roterfaden?.length) student.sprint.today.roterfaden = td.today.roterfaden;
        if (td.today.extras?.length) student.sprint.today.extras = td.today.extras;
      }
      // Недельный план: берём задание сегодняшнего дня
      if (td.weekPlan) {
        const DAY_KEYS = ['sun','mon','tue','wed','thu','fri','sat'];
        const todayKey = DAY_KEYS[new Date().getDay()];
        const dayPlan = td.weekPlan[todayKey];
        if (dayPlan) {
          student.sprint.today = student.sprint.today || {};
          if (dayPlan.task)          student.sprint.today.task          = dayPlan.task;
          if (dayPlan.deepen)        student.sprint.today.deepen        = dayPlan.deepen;
          if (dayPlan.immerse)       student.sprint.today.immerse       = dayPlan.immerse;
          if (dayPlan.writingTask)   student.sprint.today.writingTask   = dayPlan.writingTask;
          if (dayPlan.writingDeepen) student.sprint.today.writingDeepen = dayPlan.writingDeepen;
          if (dayPlan.writingImmerse)student.sprint.today.writingImmerse= dayPlan.writingImmerse;
          if (dayPlan.theme)         student.sprint.today.theme         = dayPlan.theme;
        }
      }
      if (td.week) student.sprint.week = td.week;
      if (td.grammarWeek?.queen) {
        student.sprint.grammarWeek = student.sprint.grammarWeek || {};
        if (td.grammarWeek.queen) student.sprint.grammarWeek.queen = td.grammarWeek.queen;
        if (td.grammarWeek.context) student.sprint.grammarWeek.context = td.grammarWeek.context;
      }
      if (td.weekNarrative?.monday || td.weekNarrative?.saturday) {
        student.sprint.weekNarrative = student.sprint.weekNarrative || {};
        if (td.weekNarrative.monday) student.sprint.weekNarrative.monday = td.weekNarrative.monday;
        if (td.weekNarrative.saturday) student.sprint.weekNarrative.saturday = td.weekNarrative.saturday;
      }
      if (td.languageMarkers?.active?.length) {
        student.languageMarkers = { active: td.languageMarkers.active, teacherNote: td.languageMarkers.teacherNote };
      }
    }
  } catch(e) { /* молча пропускаем ошибки */ }
  _studentId = id;
  _studentLevel = student.level || 'B1';
  applyProgress(student, id);

  const _diaryKey = `pgc_diary_${id}`;
  const _diaryData = (() => { try { return JSON.parse(localStorage.getItem(_diaryKey) || '{}'); } catch(e) { return {}; } })();
  const _streak = _diaryData.streak || 0;

  const today = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });

  const feedbackHTML = buildFeedbackHTML(student, id);

  app.innerHTML = `
    <div class="header">
      <div class="header-title">Mein Bereich</div>
      <div class="header-level">${student.level}</div>
    </div>

  <div class="screen active" id="screen-task">
    <div class="greeting">
      <div class="greeting-name">Guten Tag, ${student.name} 👋</div>
      <div class="greeting-date">${today}</div>
      ${_streak > 0 ? `<div class="greeting-streak">🔥 ${_streak} Tage in Folge</div>` : ''}
    </div>

    ${_teacherSubmissionFeedback ? (() => {
      const fbText = _teacherSubmissionFeedback.text || '';
      const preview = fbText.length > 55 ? fbText.slice(0, 55).replace(/</g,'&lt;') + '…' : fbText.replace(/</g,'&lt;');
      const fullText = fbText.replace(/</g,'&lt;').replace(/\n/g,'<br>');
      const sentDate = _teacherSubmissionFeedback.sentAt
        ? new Date(_teacherSubmissionFeedback.sentAt).toLocaleString('ru-RU',{day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'})
        : '';
      return `
    <div class="teacher-reply-card" id="teacher-reply-card">
      <button class="teacher-reply-toggle" onclick="toggleTeacherReply()">
        <div class="teacher-reply-toggle-left">
          <div class="teacher-reply-label">💬 Kommentar der Lehrerin</div>
          <div class="teacher-reply-preview">${preview}</div>
        </div>
        <div class="teacher-reply-arrow">⌄</div>
      </button>
      <div class="teacher-reply-body" id="teacher-reply-body">
        <div class="teacher-reply-text">${fullText}</div>
        ${sentDate ? `<div class="teacher-reply-meta">${sentDate}</div>` : ''}
      </div>
    </div>`;
    })() : ''}

    ${student.review ? `
    <div class="review-card">
      <button class="review-toggle" id="review-toggle" onclick="toggleReview()">
        <div class="review-toggle-left">🔄 Zuerst wiederholen?</div>
        <div class="review-toggle-arrow">⌄</div>
      </button>
      <div class="review-body" id="review-body">
        <div class="review-topic">${student.review.topic}</div>
        <div class="review-text">${student.review.text}</div>
      </div>
    </div>
    ` : ''}

    <div class="mode-switcher">
      <button class="mode-btn mode-btn--speaking mode-btn--active" id="mode-speaking" onclick="switchMode('speaking')">🎤 Sprechen</button>
      <button class="mode-btn mode-btn--writing" id="mode-writing" onclick="switchMode('writing')">✍️ Schreiben</button>
    </div>

    <div id="speaking-tasks">

    ${student.sprint?.today ? (() => {
      const s = student.sprint.today;
      const todayISO = new Date().toISOString().split('T')[0];

      // Проверяем: сдавал ли уже сегодня Niveau 1 и 2
      let taskDoneToday = false;
      let deepenDoneToday = false;
      try {
        const sub = JSON.parse(localStorage.getItem('pgc_sub_' + id) || '{}');
        taskDoneToday = !!(sub.task && sub.task.date && sub.task.date.startsWith(todayISO));
        deepenDoneToday = !!(sub.deepen && sub.deepen.date && sub.deepen.date.startsWith(todayISO));
      } catch(e) {}

      const lbtn2Class = taskDoneToday ? 'level-btn' : 'level-btn level-btn--locked';
      const lbtn3Class = (taskDoneToday && deepenDoneToday) ? 'level-btn' : 'level-btn level-btn--locked';
      const lbtn2Click = taskDoneToday ? 'switchSpeakLevel(2)' : 'lockedLevelClick(2)';
      const lbtn3Click = (taskDoneToday && deepenDoneToday) ? 'switchSpeakLevel(3)' : 'lockedLevelClick(3)';

      // Проверяем: фидбек новый (не просмотренный)
      let fbSeen = false;
      try { fbSeen = localStorage.getItem('pgc_fb_seen_' + id) === 'true'; } catch(e) {}
      const showNotif = !!student.feedback && !fbSeen;

      // Проверяем: настроение уже выбрано сегодня
      let moodToday = null;
      try {
        const md = JSON.parse(localStorage.getItem('pgc_mood_' + id) || '{}');
        moodToday = md.date === todayISO ? md.mood : null;
      } catch(e) {}

      // Недельный нарратив — понедельник или суббота
      const dayOfWeek = new Date().getDay(); // 0=Вс, 1=Пн, 6=Сб
      const weekNarr = student.sprint?.weekNarrative;
      const weekNarrMsg = dayOfWeek === 1 ? weekNarr?.monday : (dayOfWeek === 6 ? weekNarr?.saturday : null);
      const weekNarrType = dayOfWeek === 1 ? 'monday' : 'saturday';

      const chunksHTML = s.words.map(w => `
        <div class="chunk-word-block">
          <div class="chunk-word-header">
            <span class="chunk-word">${w.word}</span>
            ${w.grammarTag ? `<span class="chunk-grammar-tag">${w.grammarTag}</span>` : ''}
          </div>
          <div class="chunk-hint">${w.hint}</div>
          <div class="chunk-list">
            ${w.chunks.map(c => `<div class="chunk-item">„${parseChunk(c, w)}"</div>`).join('')}
          </div>
        </div>
      `).join('');

      const moodLabels = { tired: '😰 Erschöpft — heute nur Niveau 1', ok: '😐 Es geht — los geht\'s!', good: '😊 Gut! — alle Levels offen' };

      return `
    <div class="mood-selector" id="mood-selector">
      ${moodToday ? `
      <div class="mood-selected">${moodLabels[moodToday]}</div>
      ` : `
      <div class="mood-selector-label">Wie geht es Ihnen heute?</div>
      <div class="mood-selector-btns">
        <button class="mood-btn" onclick="setMood('tired')">😰 Erschöpft</button>
        <button class="mood-btn" onclick="setMood('ok')">😐 Es geht</button>
        <button class="mood-btn" onclick="setMood('good')">😊 Gut!</button>
      </div>
      `}
    </div>
    <div class="mood-encourage" id="mood-encourage" style="display:none"></div>

    ${weekNarrMsg ? `
    <div class="week-narrative-banner week-narrative-${weekNarrType}">
      <div class="week-narrative-icon">${weekNarrType === 'monday' ? '📅' : '🏆'}</div>
      <div class="week-narrative-text">${weekNarrMsg}</div>
    </div>
    ` : ''}

    <div class="sprint-day-card">
      <div class="sprint-day-header">
        <div class="sprint-day-label">🗓 Sprint · ${s.date}</div>
        <div class="sprint-day-theme">${s.theme}</div>
      </div>
      ${student.sprint?.grammarWeek?.context ? `<div class="sprint-narrative">${student.sprint.grammarWeek.context}</div>` : ''}
      <button class="words-toggle" onclick="toggleWordsAccordion()">
        📖 Wörter von heute (${s.words.length}) <span class="words-toggle-arrow" id="words-toggle-arrow">⌄</span>
      </button>
      <div class="words-accordion-body" id="words-accordion-body">
        <div class="chunk-words-grid">${chunksHTML}</div>
      </div>
    </div>

    <div class="level-switcher" id="level-switcher">
      <button class="level-btn level-btn--active" id="lbtn-1" onclick="switchSpeakLevel(1)">
        <div class="level-btn-num">1</div>
        <div class="level-btn-name">Aufwärmen</div>
      </button>
      <button class="${lbtn2Class}" id="lbtn-2" onclick="${lbtn2Click}">
        <div class="level-btn-num">2</div>
        <div class="level-btn-name">Situation${!taskDoneToday ? ' 🔒' : ''}</div>
      </button>
      <button class="${lbtn3Class}" id="lbtn-3" onclick="${lbtn3Click}">
        <div class="level-btn-num">3</div>
        <div class="level-btn-name">Geschichte${!(taskDoneToday && deepenDoneToday) ? ' 🔒' : ''}</div>
      </button>
    </div>

    <div class="level-content" id="level-content-1">
      <div class="level-topic">${s.task.topic}</div>
      <div class="level-prompt">${s.task.prompt}</div>
      <div class="level-instruction">${s.task.instruction}</div>
      ${s.task.hint ? `<button class="hint-toggle" id="hint-toggle" onclick="toggleHint()">💡 Tipp — wenn es gar nicht klappt</button><div class="hint-body" id="hint-body">${s.task.hint}</div>` : ''}
      <div class="level-submit" id="submit-form-task">
        <div class="rec-zone" id="rec-zone-task">
          <button class="rec-btn" id="rec-btn-task" onclick="toggleRecording('task')">🎙 Aufnehmen</button>
          <span class="rec-timer" id="rec-timer-task"></span>
          <div class="rec-live" id="rec-live-task"></div>
          <div class="rec-status" id="rec-status-task"></div>
        </div>
        <button class="write-toggle-link" onclick="toggleWriteMode('task')">✍️ Lieber schreiben</button>
        <textarea class="submit-textarea" id="submit-text-task" placeholder="Schreiben Sie hier..." style="display:none"></textarea>
        <button class="level-send-btn" onclick="submitHomework('task')">✉️ Abschicken</button>
        <div class="submit-confirm" id="submit-confirm-task" style="display:none">✅ Gesendet!</div>
        <div class="post-submit-msg" id="post-submit-msg" style="display:none"></div>
      </div>
    </div>

    <div class="level-content" id="level-content-2" style="display:none">
      <div class="level-topic">${s.deepen.topic}</div>
      <div class="level-prompt">${s.deepen.prompt}</div>
      <div class="level-instruction">${s.deepen.instruction}</div>
      <div class="sprint-word-chips" style="margin-top:10px">
        ${s.words.map(w => `<span class="sprint-word-chip">${w.word}</span>`).join('')}
        ${(s.words2 || []).map(w => `<span class="sprint-word-chip sprint-word-chip--new">${w.word}</span>`).join('')}
      </div>
      ${s.deepen.hint ? `<div class="hint-body" style="display:block;margin-top:8px">💡 ${s.deepen.hint}</div>` : ''}
      <div class="level-submit" id="submit-form-deepen">
        <div class="rec-zone" id="rec-zone-deepen">
          <button class="rec-btn" id="rec-btn-deepen" onclick="toggleRecording('deepen')">🎙 Aufnehmen</button>
          <span class="rec-timer" id="rec-timer-deepen"></span>
          <div class="rec-live" id="rec-live-deepen"></div>
          <div class="rec-status" id="rec-status-deepen"></div>
        </div>
        <button class="write-toggle-link" onclick="toggleWriteMode('deepen')">✍️ Lieber schreiben</button>
        <textarea class="submit-textarea" id="submit-text-deepen" placeholder="Schreiben Sie hier..." style="display:none"></textarea>
        <button class="level-send-btn" onclick="submitHomework('deepen')">✉️ Abschicken</button>
        <div class="submit-confirm" id="submit-confirm-deepen" style="display:none">✅ Gesendet!</div>
      </div>
    </div>

    <div class="level-content" id="level-content-3" style="display:none">
      <div class="level-topic">${s.immerse.topic}</div>
      <div class="level-prompt">${s.immerse.prompt}</div>
      <div class="level-instruction">${s.immerse.instruction}</div>
      <div class="sprint-word-chips" style="margin-top:10px">
        ${s.words.map(w => `<span class="sprint-word-chip">${w.word}</span>`).join('')}
        ${(s.words2 || []).map(w => `<span class="sprint-word-chip sprint-word-chip--new">${w.word}</span>`).join('')}
        ${(s.words3 || []).map(w => `<span class="sprint-word-chip sprint-word-chip--deep">${w.word}</span>`).join('')}
      </div>
      <div class="level-submit" id="submit-form-immerse">
        <div class="rec-zone" id="rec-zone-immerse">
          <button class="rec-btn" id="rec-btn-immerse" onclick="toggleRecording('immerse')">🎙 Aufnehmen</button>
          <span class="rec-timer" id="rec-timer-immerse"></span>
          <div class="rec-live" id="rec-live-immerse"></div>
          <div class="rec-status" id="rec-status-immerse"></div>
        </div>
        <button class="write-toggle-link" onclick="toggleWriteMode('immerse')">✍️ Lieber schreiben</button>
        <textarea class="submit-textarea" id="submit-text-immerse" placeholder="Schreiben Sie hier..." style="display:none"></textarea>
        <button class="level-send-btn" onclick="submitHomework('immerse')">✉️ Abschicken</button>
        <div class="submit-confirm" id="submit-confirm-immerse" style="display:none">✅ Gesendet!</div>
      </div>
    </div>
      `;
    })() : ''}

    ${(() => {
      const rf = student.sprint?.today?.roterfaden;
      if (!rf?.length) return '';
      const rows = rf.map(r => {
        const parts = [r.lektion && `Lektion ${r.lektion}`, r.seiten && `S. ${r.seiten}`, r.uebungen && `Üb. ${r.uebungen}`].filter(Boolean).join(' · ');
        return `<div class="rf-student-row">
          <span class="rf-student-book">📖 ${r.book || 'Учебник'}</span>
          ${parts ? `<span class="rf-student-parts">${parts}</span>` : ''}
          ${r.note ? `<span class="rf-student-note">${r.note}</span>` : ''}
        </div>`;
      }).join('');
      return `<div class="rf-student-card" id="rf-card">
        <button class="rf-student-toggle" onclick="document.getElementById('rf-body').classList.toggle('open')">
          <span>📖 Lernpfad diese Woche</span>
          <span class="rf-arrow">⌄</span>
        </button>
        <div class="rf-student-body" id="rf-body">${rows}</div>
      </div>`;
    })()}

    ${(() => {
      const extras = student.sprint?.today?.extras;
      if (!extras?.length) return '';
      return `<div class="extras-section">
        <div class="extras-title">📎 Weitere Materialien</div>
        ${extras.map(e => `
          <a class="extras-item${e.url ? '' : ' extras-item--nolink'}" ${e.url ? `href="${e.url}" target="_blank" rel="noopener"` : ''}>
            <span class="extras-type">${e.type}</span>
            <div class="extras-item-body">
              <span class="extras-item-title">${e.title || e.url}</span>
              ${e.note ? `<span class="extras-note">${e.note}</span>` : ''}
            </div>
          </a>`).join('')}
      </div>`;
    })()}

    ${student.sprint?.today ? '' : `
    <div class="task-card">
      <div class="task-card-header">
        <div class="task-card-label">📌 Aufgabe für heute · <span style="opacity:.8;font-weight:400">Pflicht</span></div>
      </div>
      <div class="task-card-topic">${student.task.topic}</div>
      <div class="task-card-body">${student.task.text}</div>
      <div class="task-meta">
        <div class="task-meta-item">
          <div class="task-meta-label">Zeit</div>
          <div class="task-meta-value">${student.task.estimate}</div>
        </div>
        <div class="task-meta-item">
          <div class="task-meta-label">Abgabe bis</div>
          <div class="task-meta-value urgent">${student.task.deadline}</div>
        </div>
      </div>
      <button class="hint-toggle" id="hint-toggle" onclick="toggleHint()">
        💡 Tipp — wenn es gar nicht klappt
      </button>
      <div class="hint-body" id="hint-body">${student.task.hint}</div>
    </div>

    ${student.task.link ? `
    <a href="${student.task.link}" target="_blank" class="action-btn action-btn-secondary">
      📚 Übung öffnen
    </a>
    ` : ''}
    <div class="submit-form" id="submit-form-task">
      <div class="submit-form-label">✏️ Ihre Antwort</div>
      <textarea class="submit-textarea" id="submit-text-task" placeholder="Schreiben Sie Ihre Antwort hier... oder beschreiben Sie kurz, was Sie gemacht haben."></textarea>
      <label class="submit-file-label">
        <input type="file" accept="image/*,audio/*" id="submit-file-task" onchange="handleFileSelect('task', this)">
        <span class="submit-file-btn" id="submit-file-btn-task">📎 Screenshot / Datei anhängen</span>
      </label>
      <div class="submit-file-preview" id="submit-preview-task"></div>
      <button class="action-btn" onclick="submitHomework('task')">✉️ Aufgabe abschicken</button>
      <div class="submit-confirm" id="submit-confirm-task" style="display:none">
        ✅ Gesendet! Schauen Sie in Telegram nach.
      </div>
      <div class="post-submit-msg" id="post-submit-msg" style="display:none"></div>
    </div>

    ${student.deepen ? `
    <div class="optional-card">
      <button class="optional-toggle" id="deepen-toggle" onclick="toggleOptional('deepen')">
        <div class="optional-toggle-left">
          <div class="optional-toggle-title">➕ Vertiefung</div>
          <div class="optional-toggle-sub">Möchten Sie tiefer gehen?</div>
        </div>
        <div class="optional-toggle-arrow">⌄</div>
      </button>
      <div class="optional-body" id="deepen-body">
        <div class="optional-topic">${student.deepen.topic}</div>
        <div class="optional-text">${student.deepen.text}</div>
        <div class="submit-form submit-form--optional" id="submit-form-deepen">
          <textarea class="submit-textarea" id="submit-text-deepen" placeholder="Ihre Antwort..."></textarea>
          <label class="submit-file-label">
            <input type="file" accept="image/*,audio/*" id="submit-file-deepen" onchange="handleFileSelect('deepen', this)">
            <span class="submit-file-btn" id="submit-file-btn-deepen">📎 Datei anhängen</span>
          </label>
          <div class="submit-file-preview" id="submit-preview-deepen"></div>
          <button class="optional-send-btn" onclick="submitHomework('deepen')">✉️ Abschicken</button>
          <div class="submit-confirm" id="submit-confirm-deepen" style="display:none">✅ Gesendet!</div>
        </div>
      </div>
    </div>
    ` : ''}

    ${student.immerse ? `
    <div class="optional-card">
      <button class="optional-toggle" id="immerse-toggle" onclick="toggleOptional('immerse')">
        <div class="optional-toggle-left">
          <div class="optional-toggle-title">🚀 Sprachentwicklung</div>
          <div class="optional-toggle-sub">Für die Mutigen — echte Sprache</div>
        </div>
        <div class="optional-toggle-arrow">⌄</div>
      </button>
      <div class="optional-body" id="immerse-body">
        <div class="optional-topic">${student.immerse.topic}</div>
        <div class="optional-text">${student.immerse.text}</div>
        <div class="submit-form submit-form--optional" id="submit-form-immerse">
          <textarea class="submit-textarea" id="submit-text-immerse" placeholder="Ihre Antwort..."></textarea>
          <label class="submit-file-label">
            <input type="file" accept="image/*,audio/*" id="submit-file-immerse" onchange="handleFileSelect('immerse', this)">
            <span class="submit-file-btn" id="submit-file-btn-immerse">📎 Datei anhängen</span>
          </label>
          <div class="submit-file-preview" id="submit-preview-immerse"></div>
          <button class="optional-send-btn" onclick="submitHomework('immerse')">✉️ Abschicken</button>
          <div class="submit-confirm" id="submit-confirm-immerse" style="display:none">✅ Gesendet!</div>
        </div>
      </div>
    </div>
    ` : ''}
    `}

    </div><!-- /speaking-tasks -->

    <div id="writing-tasks" style="display:none">
    ${student.sprint?.today ? (() => {
      const sw = student.sprint.today;
      const ww1 = sw.wordsWriting1 || [];
      const ww2 = sw.wordsWriting2 || [];
      const ww3 = sw.wordsWriting3 || [];
      const tagClass = { 'Synonym': 'wtag--blue', 'Antonym': 'wtag--red', 'Kulturwort': 'wtag--orange', 'Sprichwort': 'wtag--orange', 'Redewendung': 'wtag--orange', 'Ausdruck': 'wtag--orange' };
      const wordRow = (w, lvl) => `
        <div class="wrow wrow--${lvl}">
          <span class="wrow-word">${w.word}</span>
          <span class="wrow-tag ${tagClass[w.tag] || ''}">${w.tag}</span>
          <span class="wrow-hint">${w.hint}</span>
        </div>`;
      return `
    <div class="task-card">
      <div class="task-card-header">
        <div class="task-card-label">✍️ Schreiben · <span style="opacity:.8;font-weight:400">Niveau 1</span></div>
      </div>
      <div class="task-card-topic">${sw.writingTask.topic}</div>
      <div class="task-card-body">${sw.writingTask.instruction}</div>
      ${ww1.length ? `<div class="wlist">${ww1.map(w => wordRow(w, 1)).join('')}</div>` : ''}
      <div class="submit-form" id="submit-form-writing1">
        <textarea class="submit-textarea" id="submit-text-writing1" placeholder="Schreiben Sie hier..."></textarea>
        <button class="action-btn" onclick="submitHomework('writing1')">✉️ Abschicken</button>
        <div class="submit-confirm" id="submit-confirm-writing1" style="display:none">✅ Gesendet!</div>
      </div>
    </div>
    <div class="optional-card">
      <button class="optional-toggle" id="writing2-toggle" onclick="toggleOptional('writing2')">
        <div class="optional-toggle-left">
          <div class="optional-toggle-title">✍️ Niveau 2 — Brief an eine Freundin</div>
          <div class="optional-toggle-sub">Bereit für mehr?</div>
        </div>
        <div class="optional-toggle-arrow">⌄</div>
      </button>
      <div class="optional-body" id="writing2-body">
        <div class="optional-topic">${sw.writingDeepen.topic}</div>
        <div class="optional-text">${sw.writingDeepen.instruction}</div>
        ${ww2.length ? `<div class="wlist">${ww1.map(w => wordRow(w, 1)).join('') + ww2.map(w => wordRow(w, 2)).join('')}</div>` : ''}
        <div class="submit-form submit-form--optional" id="submit-form-writing2">
          <textarea class="submit-textarea" id="submit-text-writing2" placeholder="Ihre Antwort..."></textarea>
          <button class="optional-send-btn" onclick="submitHomework('writing2')">✉️ Abschicken</button>
          <div class="submit-confirm" id="submit-confirm-writing2" style="display:none">✅ Gesendet!</div>
        </div>
      </div>
    </div>
    ${sw.writingImmerse ? `
    <div class="optional-card">
      <button class="optional-toggle" id="writing3-toggle" onclick="toggleOptional('writing3')">
        <div class="optional-toggle-left">
          <div class="optional-toggle-title">✍️ Niveau 3 — Ihre Geschichte</div>
          <div class="optional-toggle-sub">Freies Schreiben — alle Ebenen offen</div>
        </div>
        <div class="optional-toggle-arrow">⌄</div>
      </button>
      <div class="optional-body" id="writing3-body">
        <div class="optional-topic">${sw.writingImmerse.topic}</div>
        <div class="optional-text">${sw.writingImmerse.instruction}</div>
        ${ww3.length ? `<div class="wlist">${[...ww1, ...ww2].map(w => wordRow(w, w === ww2[0] || ww2.includes(w) ? 2 : 1)).join('') + ww3.map(w => wordRow(w, 3)).join('')}</div>` : ''}
        <div class="submit-form submit-form--optional" id="submit-form-writing3">
          <textarea class="submit-textarea" id="submit-text-writing3" placeholder="Ihre Geschichte..."></textarea>
          <button class="optional-send-btn" onclick="submitHomework('writing3')">✉️ Abschicken</button>
          <div class="submit-confirm" id="submit-confirm-writing3" style="display:none">✅ Gesendet!</div>
        </div>
      </div>
    </div>` : ''}
    `;
    })() : ''}
    ${!student.sprint?.today && student.writing ? `
    <div class="task-card">
      <div class="task-card-header">
        <div class="task-card-label">✍️ Schreiben · <span style="opacity:.8;font-weight:400">Niveau 1</span></div>
      </div>
      <div class="task-card-topic">${student.writing.task.topic}</div>
      <div class="task-card-body">${student.writing.task.text}</div>
      <div class="submit-form" id="submit-form-writing1">
        <textarea class="submit-textarea" id="submit-text-writing1" placeholder="Schreiben Sie hier..."></textarea>
        <button class="action-btn" onclick="submitHomework('writing1')">✉️ Abschicken</button>
        <div class="submit-confirm" id="submit-confirm-writing1" style="display:none">✅ Gesendet!</div>
      </div>
    </div>

    <div class="optional-card">
      <button class="optional-toggle" id="writing2-toggle" onclick="toggleOptional('writing2')">
        <div class="optional-toggle-left">
          <div class="optional-toggle-title">✍️ Niveau 2 — Situation</div>
          <div class="optional-toggle-sub">Bereit für mehr?</div>
        </div>
        <div class="optional-toggle-arrow">⌄</div>
      </button>
      <div class="optional-body" id="writing2-body">
        <div class="optional-topic">${student.writing.deepen.topic}</div>
        <div class="optional-text">${student.writing.deepen.text}</div>
        <div class="submit-form submit-form--optional" id="submit-form-writing2">
          <textarea class="submit-textarea" id="submit-text-writing2" placeholder="Ihre Antwort..."></textarea>
          <button class="optional-send-btn" onclick="submitHomework('writing2')">✉️ Abschicken</button>
          <div class="submit-confirm" id="submit-confirm-writing2" style="display:none">✅ Gesendet!</div>
        </div>
      </div>
    </div>

    <div class="optional-card">
      <button class="optional-toggle" id="writing3-toggle" onclick="toggleOptional('writing3')">
        <div class="optional-toggle-left">
          <div class="optional-toggle-title">✍️ Niveau 3 — Ihre Geschichte</div>
          <div class="optional-toggle-sub">Freies Schreiben</div>
        </div>
        <div class="optional-toggle-arrow">⌄</div>
      </button>
      <div class="optional-body" id="writing3-body">
        <div class="optional-topic">${student.writing.immerse.topic}</div>
        <div class="optional-text">${student.writing.immerse.text}</div>
        <div class="submit-form submit-form--optional" id="submit-form-writing3">
          <textarea class="submit-textarea" id="submit-text-writing3" placeholder="Ihre Geschichte..."></textarea>
          <button class="optional-send-btn" onclick="submitHomework('writing3')">✉️ Abschicken</button>
          <div class="submit-confirm" id="submit-confirm-writing3" style="display:none">✅ Gesendet!</div>
        </div>
      </div>
    </div>
    ` : ''}
    </div><!-- /writing-tasks (fallback) -->

    ${student.diary && student.diary.active ? (() => {
      const diaryKey = `pgc_diary_${id}`;
      const diaryData = JSON.parse(localStorage.getItem(diaryKey) || '{"streak":0,"total":0,"lastDate":null}');
      const streak = diaryData.streak || 0;
      const total = diaryData.total || 0;
      const goal = student.diary.goalDays || 19;
      const pct = Math.min(100, Math.round((total / goal) * 100));
      return `
    <div class="diary-card">
      <button class="diary-toggle" onclick="toggleDiary()">
        <div class="diary-toggle-left">
          <div class="diary-title">📓 ${student.diary.title}</div>
          <div class="diary-streak">${streak > 0 ? `🔥 ${streak} Tage in Folge` : `${total} von ${goal} Tagen`}</div>
        </div>
        <div class="diary-toggle-arrow" id="diary-toggle-arrow">⌄</div>
      </button>
      <div class="diary-progress-bar-wrap">
        <div class="diary-progress-bar" style="width:${pct}%"></div>
      </div>
      <div class="diary-body" id="diary-body">
        <div class="diary-instruction">${student.diary.instruction}</div>
        <div class="diary-prompt">💬 ${student.diary.prompt}</div>
        <textarea class="submit-textarea" id="diary-textarea" placeholder="5 Sätze auf Deutsch — los geht's..."></textarea>
        <button class="action-btn diary-send-btn" onclick="submitDiary()">✉️ Heute abschicken</button>
        <div class="submit-confirm" id="diary-confirm" style="display:none">✅ Super! Gesendet. Kommen Sie morgen wieder 💪</div>
      </div>
    </div>
      `;
    })() : ''}

    <button class="goal-star" onclick="toggleGoalTask()">
      <span class="goal-star-icon">✦</span>
      <span class="goal-star-text">${student.goal.title}</span>
      <span class="goal-star-deadline">bis ${student.goal.deadline}</span>
      <span class="goal-star-arrow" id="goal-star-arrow-task">›</span>
    </button>
    <div class="goal-star-body" id="goal-star-body-task" style="display:none">
      ${student.milestones.map(m => `
        <div class="milestone ${m.status}">
          <div class="milestone-dot">${m.status === 'done' ? '✓' : m.status === 'active' ? '▶' : '○'}</div>
          <div class="milestone-text">${m.label}</div>
          ${m.sub ? `<div class="milestone-sub">${m.sub}</div>` : ''}
        </div>
      `).join('')}
    </div>
  </div>

  <div class="screen" id="screen-grammar">
    <div id="grammar-content"></div>
  </div>

  <div class="screen" id="screen-lexik">
    <div id="lexik-content"></div>
  </div>

  <div class="screen" id="screen-progress">

    ${(() => {
      // ── Блок "Ваш немецкий сейчас" ──────────────────────────────────────
      const MARKER_PHRASES = {
        verb_place:     'Глагол стоит на своём месте — это заметно. Речь стала увереннее, и всё реже случается, что он прыгает. Это уже не случайность — это навык.',
        thinks_german:  'Чувствуется, что вы думаете на немецком языке. Перевод уходит на фон — вы думаете о сути, а не о словах.',
        calm_speech:    'В речи стало больше спокойствия. Вы не ищете слова — они приходят.',
        b2_words:       'Вы используете слова уровня B1/B2 естественно — не вставляете их, а говорите ими.',
        all_levels:     'Вы проходите все три уровня заданий. Это говорит о том, что ресурс есть — и вы его используете.',
        topic_closed:   'Тема недели закрепилась. Она не висит в воздухе — она уже в речи.',
      };

      // Берём маркеры из teacher.html или из students.js
      let markers = [];
      let teacherNote = '';
      try {
        const td = JSON.parse(localStorage.getItem('pgc_teacher_' + id) || '{}');
        if (td.languageMarkers?.active?.length) {
          markers = td.languageMarkers.active;
          teacherNote = td.languageMarkers.teacherNote || '';
        }
      } catch(e) {}
      if (!markers.length && student.languageMarkers?.active?.length) {
        markers = student.languageMarkers.active;
        teacherNote = student.languageMarkers.teacherNote || '';
      }

      // Цифры по банку слов
      let wordStats = { green: 0, yellow: 0, red: 0, total: 0 };
      try {
        const ws = JSON.parse(localStorage.getItem('pgc_words_' + id) || '{}');
        const weekWords = student.sprint?.today?.words || [];
        wordStats.total = weekWords.length;
        weekWords.forEach(w => {
          const st = ws[w.word];
          if (st === 'green') wordStats.green++;
          else if (st === 'yellow') wordStats.yellow++;
          else wordStats.red++;
        });
      } catch(e) {}

      // Статистика сданных заданий за неделю
      let tasksThisWeek = 0;
      try {
        const monday = new Date();
        monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
        const monISO = monday.toISOString().split('T')[0];
        const sub = JSON.parse(localStorage.getItem('pgc_sub_' + id) || '{}');
        ['task','deepen','immerse'].forEach(level => {
          if (sub[level]?.date >= monISO) tasksThisWeek++;
        });
      } catch(e) {}

      if (!markers.length) return '';

      const phrases = markers.map(m => MARKER_PHRASES[m]).filter(Boolean);

      return `
      <div class="lang-markers-block">
        <div class="lang-markers-title">Ваш немецкий сейчас</div>
        <div class="lang-markers-phrases">
          ${phrases.map(p => `<p class="lang-marker-phrase">${p}</p>`).join('')}
        </div>
        ${teacherNote ? `<div class="lang-markers-note">${teacherNote}</div>` : ''}
        <div class="lang-markers-stats">
          <div class="lang-stat"><span class="lang-stat-num">${wordStats.total}</span><span class="lang-stat-label">слов в банке</span></div>
          <div class="lang-stat green"><span class="lang-stat-num">🟢 ${wordStats.green}</span><span class="lang-stat-label">знаю</span></div>
          <div class="lang-stat yellow"><span class="lang-stat-num">🟡 ${wordStats.total - wordStats.green - wordStats.red}</span><span class="lang-stat-label">учу</span></div>
          <div class="lang-stat"><span class="lang-stat-num">📅 ${tasksThisWeek}</span><span class="lang-stat-label">заданий на этой неделе</span></div>
        </div>
      </div>
      `;
    })()}

    ${(() => {
      // ── Банк слов — оценка студента ─────────────────────────────────────
      const weekWords = student.sprint?.today?.words || [];
      if (!weekWords.length) return '';
      let ws = {};
      try { ws = JSON.parse(localStorage.getItem('pgc_words_' + id) || '{}'); } catch(e) {}

      const todayISO2 = new Date().toISOString().split('T')[0];
      const rows = weekWords.map(w => {
        const st = ws[w.word] || 'none';
        const wk = wordKey(w.word);
        const sched = _wordSchedule[wk];
        const isRepeat = sched && sched.introduced && sched.introduced < todayISO2;
        const esc = w.word.replace(/'/g,"\\'");
        return `
        <div class="wordbank-row" id="wb-${w.word.replace(/\s/g,'_')}">
          <div class="wordbank-word">
            ${w.word}
            ${isRepeat ? '<span class="repeat-badge">🔄 повторение</span>' : ''}
          </div>
          <div class="wordbank-btns">
            <button class="wb-btn ${st === 'forgotten' ? 'active' : ''}" onclick="setWordStatus('${esc}','forgotten','${id}')" title="Совсем забыла">⬛</button>
            <button class="wb-btn ${st === 'red'      ? 'active' : ''}" onclick="setWordStatus('${esc}','red','${id}')">🔴</button>
            <button class="wb-btn ${st === 'yellow'   ? 'active' : ''}" onclick="setWordStatus('${esc}','yellow','${id}')">🟡</button>
            <button class="wb-btn ${st === 'green'    ? 'active' : ''}" onclick="setWordStatus('${esc}','green','${id}')">🟢</button>
          </div>
        </div>`;
      }).join('');

      return `
      <div class="wordbank-block">
        <div class="progress-section-title">Слова недели</div>
        <div class="wordbank-hint">Нажмите на кружок — отметьте как идёт</div>
        <div class="wordbank-list">${rows}</div>
      </div>`;
    })()}

    <div class="progress-section-title">Kommunikation</div>
    <div class="growth-legend">
      <div class="legend-item"><span class="legend-arrow" style="color:var(--accent)">↑</span> besser geworden</div>
      <div class="legend-item"><span class="legend-arrow" style="color:var(--muted)">→</span> stabil</div>
      <div class="legend-item"><span class="legend-arrow" style="color:var(--urgent)">↓</span> üben</div>
    </div>

    ${(function renderSkillCard(skills) {
      return skills.map((s, i) => {
        const idx = student.skills.indexOf(s);
        const doneCnt = s.criteria.filter(c => c.done).length;
        const totalCnt = s.criteria.length;
        const pct = totalCnt > 0 ? Math.round(doneCnt / totalCnt * 100) : 0;
        return `
        <div class="skill-card" id="sk-card-${idx}">
          <button class="skill-header" onclick="toggleSkill(${idx})">
            <div class="skill-card-top">
              <div class="skill-name-row">
                <div class="skill-icon">${s.icon}</div>
                <div class="skill-name">${s.name}</div>
              </div>
              <div class="skill-right">
                <div class="skill-arrow ${s.personal}">${s.personal === 'up' ? '↑' : s.personal === 'down' ? '↓' : '→'}</div>
                <div class="skill-expand-arrow">⌄</div>
              </div>
            </div>
            <div class="skill-bar-wrap">
              <div class="skill-bar-fill" style="width:${pct}%"></div>
            </div>
            <div class="skill-bar-labels">
              <div class="skill-pct">${doneCnt} von ${totalCnt} Kriterien ✓</div>
              <div class="skill-goal-label">${pct}% zum Ziel</div>
            </div>
            <div class="skill-note">${s.note}</div>
          </button>
          <div class="skill-criteria" id="sk-criteria-${idx}">
            <div class="skill-criteria-title">Was auf diesem Niveau erwartet wird</div>
            ${s.criteria.map((c, ci) => `
              <div class="criterion-item ${c.done ? 'done' : ''}" id="crit-${idx}-${ci}" onclick="toggleCriterion(${idx}, ${ci})">
                <div class="criterion-dot">${c.done ? '✓' : '○'}</div>
                <div>${c.label}</div>
              </div>
            `).join('')}
          </div>
        </div>`;
      }).join('');
    })(student.skills.slice(0, 4))}

    <div class="fundament-bridge">
      <div class="fundament-bridge-line"></div>
      <div class="fundament-bridge-text">trägt alle Fertigkeiten</div>
      <div class="fundament-bridge-line"></div>
    </div>

    <div class="fundament-wrapper">
      <div class="fundament-label">🧱 Fundament — Grammatik &amp; Wortschatz</div>
      ${(function renderSkillCard(skills) {
        return skills.map((s, i) => {
          const idx = student.skills.indexOf(s);
          const doneCnt = s.criteria.filter(c => c.done).length;
          const totalCnt = s.criteria.length;
          const pct = totalCnt > 0 ? Math.round(doneCnt / totalCnt * 100) : 0;
          return `
          <div class="skill-card" id="sk-card-${idx}">
            <button class="skill-header" onclick="toggleSkill(${idx})">
              <div class="skill-card-top">
                <div class="skill-name-row">
                  <div class="skill-icon">${s.icon}</div>
                  <div class="skill-name">${s.name}</div>
                </div>
                <div class="skill-right">
                  <div class="skill-arrow ${s.personal}">${s.personal === 'up' ? '↑' : s.personal === 'down' ? '↓' : '→'}</div>
                  <div class="skill-expand-arrow">⌄</div>
                </div>
              </div>
              <div class="skill-bar-wrap">
                <div class="skill-bar-fill" style="width:${pct}%"></div>
              </div>
              <div class="skill-bar-labels">
                <div class="skill-pct">${doneCnt} von ${totalCnt} Themen ✓</div>
                <div class="skill-goal-label">${pct}% aufgebaut</div>
              </div>
              <div class="skill-note">${s.note}</div>
            </button>
            <div class="skill-criteria" id="sk-criteria-${idx}">
              <div class="skill-criteria-title">Themen im Aufbau</div>
              ${s.criteria.map((c, ci) => `
                <div class="criterion-item ${c.done ? 'done' : ''}" id="crit-${idx}-${ci}" onclick="toggleCriterion(${idx}, ${ci})">
                  <div class="criterion-dot">${c.done ? '✓' : '○'}</div>
                  <div>${c.label}</div>
                </div>
              `).join('')}
            </div>
          </div>`;
        }).join('');
      })(student.skills.slice(4))}
    </div>

    <button class="goal-star" onclick="toggleMilestones()">
      <span class="goal-star-icon">✦</span>
      <span class="goal-star-text">${student.goal.title}</span>
      <span class="goal-star-deadline">bis ${student.goal.deadline}</span>
      <span class="goal-star-arrow" id="goal-toggle-arrow">›</span>
    </button>
    <div class="goal-star-body" id="milestones-body" style="display:none;margin-bottom:20px">
      ${student.milestones.map(m => `
        <div class="milestone ${m.status}">
          <div class="milestone-dot">${m.status === 'done' ? '✓' : m.status === 'active' ? '▶' : '○'}</div>
          <div class="milestone-text">${m.label}</div>
          ${m.sub ? `<div class="milestone-sub">${m.sub}</div>` : ''}
        </div>
      `).join('')}
    </div>

    <div class="audio-journey-section" id="audio-journey-section">
      <div class="audio-journey-header">
        <div class="audio-journey-title">🎙 Meine Stimme — Reise</div>
        <div class="audio-journey-subtitle">Hören Sie, wie Sie sich verbessert haben</div>
      </div>
      <div id="audio-journey-list"><div class="audio-journey-loading">Lädt…</div></div>
    </div>

    <div id="feedback-archive-section"></div>

  </div>

  <div class="screen" id="screen-gaps">
    <div id="gaps-content"></div>
  </div>

  <div class="screen" id="screen-kultur">
    <div id="kultur-content"></div>
  </div>

  <div class="tab-bar">
    <button class="tab-btn active" id="tab-task" onclick="showTab('task')">
      <div class="tab-icon">📌</div>Aufgabe
    </button>
    <button class="tab-btn" id="tab-grammar" onclick="showTab('grammar')">
      <div class="tab-icon">📚</div>Grammatik
    </button>
    <button class="tab-btn" id="tab-lexik" onclick="showTab('lexik')">
      <div class="tab-icon">🃏</div>Lexik
    </button>
    <button class="tab-btn" id="tab-progress" onclick="showTab('progress')">
      <div class="tab-icon">📈</div>Fortschritt
    </button>
    <button class="tab-btn" id="tab-gaps" onclick="showTab('gaps')">
      <div class="tab-icon">🔎</div>Lücken
    </button>
    <button class="tab-btn" id="tab-kultur" onclick="showTab('kultur')">
      <div class="tab-icon">📖</div>Bibliothek
    </button>
  </div>

  `;

  renderGrammarScreen();
  renderLexikScreen(student);
  renderGapsScreen();
  renderKulturScreen(student);
  renderFeedbackArchiveSection();
  initDrafts();

  // Онбординг — только при первом входе
  const onboardingKey = `pgc_onboarded_${id}`;
  if (localStorage.getItem(onboardingKey)) {
    // Онбординг уже пройден — проверить опросник
    checkAndShowSurvey(id);
  } else {
    showOnboarding(id, student.name);
  }

  // Telegram MainButton
  if (tg) {
    tg.MainButton.setText('Lehrerin schreiben');
    tg.MainButton.show();
    tg.MainButton.onClick(() => {
      tg.openTelegramLink('https://t.me/mila_konstanz');
    });
  }
}

// ── KULTUR DATA ───────────────────────────────────────────────────────────────
const KULTUR_WORT = [
  { level:'A2', title: 'der Feierabend', teaser: 'Kein direktes Äquivalent in anderen Sprachen!', body: '<strong>Feierabend</strong> ist der Moment nach der Arbeit, wenn der Tag "gefeiert" wird — Zeit zum Abschalten und Genießen. Deutsche nehmen Feierabend sehr ernst: nach 18 Uhr schreibt man in der Regel keine beruflichen E-Mails mehr.', example: '„Na dann, schönen Feierabend!" — Tschüss und erhol dich gut!\n<em>Sagen Sie das am Ende jedes Arbeitstages — alle werden es mögen.</em>', translation: 'Конец рабочего дня, время отдыха. Буквально: «праздновать вечер». Аналога в русском нет — это целая философия: после работы работа заканчивается.', source: 'Duden' },
  { level:'A2', title: 'die Wurst', teaser: '„Das ist mir Wurst" — egal, völlig egal', body: 'Mit <strong>Wurst</strong> verbinden Deutsche viel mehr als Essen. „Das ist mir Wurst" bedeutet: Das ist mir völlig egal. Über 1.500 Wurstarten gibt es in Deutschland — sie sind echter Kulturgut.', example: '„Magst du Mustafa oder Tim?" — „Ach, das ist mir Wurst."\n<em>Vorsicht: Nicht bei wichtigen Themen sagen — wirkt unhöflich.</em>', translation: '«Мне всё равно» — буквально «мне это колбаса». Используется, когда что-то совершенно неважно.', source: 'Duden' },
  { level:'A2', title: 'gemütlich', teaser: 'Mehr als nur "gemütlich" — ein ganzer Lebensstil', body: '<strong>Gemütlich</strong> bedeutet eine Atmosphäre, die gleichzeitig warm, einladend, entspannend und behaglich ist. Die Engländer haben kein Wort dafür — sie sagen einfach "cozy", aber das ist nicht dasselbe.', example: '„Es war so gemütlich bei dir — das Kaminfeuer, der Tee, die Decken..."\n<em>Sagen Sie das nach einem Besuch: Ihr Gastgeber wird strahlen.</em>', translation: 'Уютно, по-домашнему, тепло и комфортно — одновременно. Это слово описывает атмосферу, настроение и стиль жизни.', source: 'Duden' },
  { level:'A2', title: 'na', teaser: 'Das vielseitigste Wort Deutschlands', body: '<strong>Na</strong> kann Begrüßung sein ("Na?"), Bestätigung ("Na also!"), Zweifel ("Na, na..."), Ermutigung ("Na, dann mal los!") oder Zufriedenheit ("Na bitte!"). Kontext ist alles.', example: '„Na?" — „Na!" (= Hallo, wie geht\'s? / Gut, danke, und dir?)\n<em>Deutsche begrüßen sich oft nur mit „Na" — das reicht völlig.</em>', translation: 'Ну / Ну что / Ну вот / Давай. Одно слово — десятки значений в зависимости от интонации.', source: 'Duden' },
  { level:'B1', title: 'doch', teaser: 'Das mächtigste Ein-Wort-Gegenmittel', body: '<strong>Doch</strong> ist eine Partikel ohne direktes Äquivalent. Es widerspricht einer Verneinung: „Das stimmt nicht" → „Doch!" (= nein, doch!) Außerdem kann es Aussagen verstärken: „Komm doch!" = Komm schon!', example: '„Du sprichst kein Deutsch!" — „Doch, ich spreche Deutsch!"\n<em>Eines der ersten Wörter, die echte Kommunikation möglich machen.</em>', translation: '«Нет, наоборот!» — возражение на отрицание. «Ты не говоришь по-немецки» — «Doch, говорю!». Аналог — «а вот и нет».', source: 'Duden' },
  { level:'B1', title: 'tja', teaser: 'Sagt alles, ohne etwas zu sagen', body: '<strong>Tja</strong> ist eine Interjektion der Resignation, des Mitgefühls oder der stillen Zustimmung. Je nach Intonation bedeutet es: „Was soll man machen", „Das ist tragisch", „Ich hatte Recht" oder einfach Stille teilen.', example: '„Der Zug hatte wieder Verspätung." — „Tja... Deutsche Bahn."\n<em>Tiefe, leichte Aussprache mit einem Seufzer — und alle verstehen Sie.</em>', translation: 'Ну да... / Что поделаешь... / Вот именно. Звук философской resigned. Без перевода — но с правильной интонацией все поймут.', source: 'Duden' },
  { level:'B1', title: 'der Kummerspeck', teaser: 'Wortwörtlich: Speck aus Kummer', body: '<strong>Kummerspeck</strong> = Gewichtszunahme durch emotionales Essen — wenn man Stress, Trauer oder Liebeskummer mit Essen kompensiert. Dieses Wort kennen Psychologen weltweit, aber nur Deutsche haben einen Namen dafür.', example: '„Nach der Trennung habe ich fünf Kilo Kummerspeck bekommen."\n<em>Gut zu kennen — man hört es oft in echten Gesprächen.</em>', translation: 'Килограммы горя — вес, набранный от стресса, грусти или расставания. Буквально: «сало из печали».', source: 'Duden' },
  { level:'B2', title: 'verschlimmbessern', teaser: 'Etwas verbessern wollen, aber es schlimmer machen', body: '<strong>Verschlimmbessern</strong> kombiniert „verschlimmern" und „verbessern". Dieses Wort existiert nur auf Deutsch und beschreibt präzise, was passiert, wenn gut gemeinte Korrekturen das Problem vergrößern.', example: '„Ich habe den Code repariert..." — „Du hast ihn verschlimmbessert!"\n<em>Sehr nützlich in Diskussionen über Projekte und Renovierungen.</em>', translation: 'Улучшить, сделав хуже. Слово-портмоне: verschlimmern (ухудшать) + verbessern (улучшать). Аналога в русском нет.', source: 'Duden' },
  { level:'B2', title: 'das Fingerspitzengefühl', teaser: 'Feingefühl an den Fingerspitzen', body: '<strong>Fingerspitzengefühl</strong> = Taktgefühl, Einfühlungsvermögen, die Fähigkeit, sensibel und geschickt mit schwierigen Situationen umzugehen. Wörtlich: Gefühl an den Fingerspitzen.', example: '„Mit kranken Patienten braucht man viel Fingerspitzengefühl."\n<em>Im Beruf (Medizin, HR, Führung) sehr oft zu hören.</em>', translation: 'Чуткость, деликатность, умение чувствовать ситуацию. Буквально: «чувство кончиков пальцев» — тонкое ощущение.', source: 'Duden' },
  { level:'B2', title: 'der Weltschmerz', teaser: 'Schmerz über den Zustand der Welt', body: '<strong>Weltschmerz</strong> beschreibt das Gefühl, dass die Welt nie so gut sein kann, wie sie sein sollte. Erfunden von Jean Paul (1827) — heute in der Psychologie und in der Weltliteratur bekannt.', example: '„Ich kann keine Nachrichten mehr lesen. Dieser Weltschmerz macht mich krank."\n<em>Zeigt Tiefe und Bildung — perfekt für ernstere Gespräche.</em>', translation: 'Боль за мир, мировая скорбь. Ощущение, что реальность никогда не будет такой хорошей, какой должна быть. Термин вошёл в английский язык без перевода.', source: 'Duden / Литературный словарь' },
  { title: 'tja', teaser: 'Sagt alles, ohne etwas zu sagen', body: '<strong>Tja</strong> ist eine Interjektion der Resignation, des Mitgefühls oder der stillen Zustimmung. Je nach Intonation bedeutet es: „Was soll man machen", „Das ist tragisch", „Ich hatte Recht" oder einfach Stille teilen.', example: '„Der Zug hatte wieder Verspätung." — „Tja... Deutsche Bahn."\n<em>Tiefe, leichte Aussprache mit einem Seufzer — und alle verstehen Sie.</em>' },
  { title: 'der Weltschmerz', teaser: 'Schmerz über den Zustand der Welt', body: '<strong>Weltschmerz</strong> beschreibt das Gefühl, dass die Welt nie so gut sein kann, wie sie sein sollte. Erfunden von Jean Paul (1827) — heute in der Psychologie und in der Weltliteratur bekannt.', example: '„Ich kann keine Nachrichten mehr lesen. Dieser Weltschmerz macht mich krank."\n<em>Zeigt Tiefe und Bildung — perfekt für ernstere Gespräche.</em>' },
  { title: 'das Fingerspitzengefühl', teaser: 'Feingefühl an den Fingerspitzen', body: '<strong>Fingerspitzengefühl</strong> = Taktgefühl, Einfühlungsvermögen, die Fähigkeit, sensibel und geschickt mit schwierigen Situationen umzugehen. Wörtlich: Gefühl an den Fingerspitzen.', example: '„Mit kranken Patienten braucht man viel Fingerspitzengefühl."\n<em>Im Beruf (Medizin, HR, Führung) sehr oft zu hören.</em>' },
  { title: 'na', teaser: 'Das vielseitigste Wort Deutschlands', body: '<strong>Na</strong> kann Begrüßung sein ("Na?"), Bestätigung ("Na also!"), Zweifel ("Na, na..."), Ermutigung ("Na, dann mal los!") oder Zufriedenheit ("Na bitte!"). Kontext ist alles.', example: '„Na?" — „Na!" (= Hallo, wie geht\'s? / Gut, danke, und dir?)\n<em>Deutsche begrüßen sich oft nur mit „Na" — das reicht völlig.</em>' },
];

const KULTUR_SPRICHWORT = [
  { title: 'Übung macht den Meister', teaser: 'Lernmotivation seit dem Mittelalter', body: 'Ein Sprichwort aus dem 16. Jahrhundert. Die Deutschen glauben fest daran, dass Talent weniger wichtig ist als Ausdauer. Studien bestätigen dies: Deliberate Practice schlägt natürliche Begabung langfristig.', example: '„Ich kann das noch nicht perfekt." — „Macht nichts — Übung macht den Meister!"\n<em>Perfekt als Selbstmotivation beim Deutschlernen.</em>', translation: '«Повторение — мать учения» / «Практика делает мастера». Талант без труда ничего не стоит — немцы в это искренне верят.', source: 'Duden Redewendungen' },
  { title: 'Morgenstund hat Gold im Mund', teaser: 'Der frühe Morgen ist die beste Zeit', body: 'Deutsche sind bekannt für frühe Arbeitszeiten und frühe Meetings. Dieses Sprichwort erklärt viel über die Kultur: Wer früh aufsteht, hat mehr Energie, Klarheit und Erfolg. Produktivität vor 9 Uhr ist Pflicht.', example: '„Warum um 7 Uhr? Das ist zu früh!" — „Morgenstund hat Gold im Mund!"\n<em>Erwartet: pünktlicher Beginn, aktive Teilnahme, keine Schlaftrunkenheit.</em>', translation: '«Кто рано встаёт, тому Бог подаёт». Утренний час — золото. Немецкая культура очень ценит ранний старт дня.', source: 'Duden Redewendungen' },
  { title: 'Ohne Fleiß kein Preis', teaser: 'Arbeit kommt vor Belohnung — immer', body: 'Die deutsche Arbeitskultur basiert auf diesem Prinzip. Ergebnisse ohne Aufwand werden mit Skepsis betrachtet. Fleiß und Ernsthaftigkeit werden hoch geschätzt — mehr als schnelle Kreativlösungen.', example: '„Wie hat er so schnell die Prüfung bestanden?" — „Ohne Fleiß kein Preis — er hat drei Monate täglich gelernt."\n<em>Sagen Sie das und Sie klingen wie ein echter Deutscher.</em>', translation: '«Без труда не выловишь рыбку из пруда». Награда только за усилие — быстрых результатов без работы немцы не признают.', source: 'Duden Redewendungen' },
  { title: 'Aller Anfang ist schwer', teaser: 'Jeder Anfang braucht Mut', body: 'Dieses Sprichwort ist Trost und Realismus zugleich. Deutsche erwarten nicht, dass Neues sofort funktioniert — aber sie erwarten, dass man trotzdem weitermacht. Perfektionismus und Ausdauer gehen Hand in Hand.', example: '„Ich mache so viele Fehler auf Deutsch!" — „Aller Anfang ist schwer — das ist völlig normal."\n<em>Jede Lehrerin sagt das — jetzt können Sie es auch sagen.</em>', translation: '«Лиха беда начало» / «Начало — половина дела». Любое новое дело поначалу трудно — это нормально и ожидаемо.', source: 'Duden Redewendungen' },
  { title: 'Was Hänschen nicht lernt, lernt Hans nimmermehr', teaser: 'Lernen hat die beste Zeit', body: 'Dieses Sprichwort wurde durch Studien zur Neuroplastizität teilweise relativiert — Erwachsene können sehr gut lernen. Trotzdem zeigt es, wie ernst Deutsche Bildung im frühen Alter nehmen. Kindergärten und Grundschulen sind entsprechend anspruchsvoll.', example: '„Soll ich mit 40 noch Deutsch lernen?" — „Natürlich! Was Hänschen nicht lernt... aber Hänschen sind Sie noch lange!"\n<em>Gutes Gesprächsthema über deutsches Bildungssystem.</em>', translation: '«Чему Ваня не научился, того Иван не выучит». Учиться лучше в детстве — но взрослые тоже могут!', source: 'Duden Redewendungen' },
  { title: 'Wer rastet, der rostet', teaser: 'Stillstand ist Rückschritt', body: 'Deutsche Kultur bewertet kontinuierliche Weiterentwicklung. Stagnation — beruflich oder persönlich — wird als Fehler gesehen. Lebenslanges Lernen (lebenslanges Lernen) ist kein Modewort, sondern echter gesellschaftlicher Wert.', example: '„Ich habe drei Wochen nicht geübt." — „Vorsicht — wer rastet, der rostet!"\n<em>Ideal für Gespräche über Sport, Beruf oder Sprachen.</em>', translation: '«Кто стоит на месте — ржавеет». Остановился — значит, начал деградировать. Немцы не признают стагнации.', source: 'Duden Redewendungen' },
  { title: 'Kleider machen Leute', teaser: 'Der erste Eindruck zählt wirklich', body: 'In Deutschland ist gepflegtes Äußeres wichtig — besonders im Beruf. Casual ist erlaubt, aber ungepflegt nie. Das Sprichwort stammt von Gottfried Keller (1874) und ist heute so aktuell wie damals.', example: '„Muss ich mich für das Interview wirklich so anziehen?" — „Kleider machen Leute — unbedingt!"\n<em>In Kliniken, Büros und Behörden: Erscheinung zählt.</em>', translation: '«По одёжке встречают». Внешний вид определяет первое впечатление — в Германии особенно на работе.', source: 'Gottfried Keller / Duden' },
  { title: 'Viele Köche verderben den Brei', teaser: 'Zu viele Meinungen — kein Ergebnis', body: 'Deutsche lieben Struktur und klare Verantwortlichkeiten. Wenn zu viele Menschen entscheiden, leidet die Qualität. Deswegen gibt es in deutschen Firmen klare Hierarchien und Entscheidungsprozesse.', example: '„Warum dauert das Projekt so lange?" — „Viele Köche verderben den Brei — jeder hat eine andere Meinung."\n<em>Nützlich in Team-Diskussionen und Meetings.</em>', translation: '«У семи нянек дитя без глазу». Когда слишком много людей принимают решения — результат страдает.', source: 'Duden Redewendungen' },
  { title: 'Andere Länder, andere Sitten', teaser: 'Respekt vor kulturellen Unterschieden', body: 'Deutsche sind sich bewusst, dass ihre Direktheit, Pünktlichkeit und Regelorientierung nicht überall selbstverständlich ist. Dieses Sprichwort wird oft genutzt, um Kulturunterschiede anzuerkennen — ohne zu urteilen.', example: '„Warum stehen hier alle in der Schlange ohne zu reden?" — „Andere Länder, andere Sitten — hier ist das Normalität."\n<em>Perfekt, um Kulturschock zu beschreiben.</em>', translation: '«В чужой монастырь со своим уставом не ходят». У каждой страны свои правила — и это нормально.', source: 'Duden Redewendungen' },
  { title: 'Man soll den Tag nicht vor dem Abend loben', teaser: 'Vorsicht mit voreiligem Optimismus', body: 'Deutsche Nüchternheit zeigt sich in diesem Sprichwort. Erfolg wird erst anerkannt, wenn er tatsächlich eingetreten ist. Übertriebener Optimismus gilt als naiv — realistische Einschätzung als Stärke.', example: '„Ich denke, ich bestehe die Prüfung!" — „Man soll den Tag nicht vor dem Abend loben."\n<em>Hören Sie das oft — jetzt können Sie es einordnen.</em>', translation: '«Не говори гоп, пока не перепрыгнешь». Успех хвалят только когда он состоялся — не раньше.', source: 'Duden Redewendungen' },
];

const KULTUR_REDEWENDUNG = [
  { title: 'Daumen drücken', teaser: 'Deutsche drücken Daumen, keine Finger', body: 'Wo Angelsachsen „fingers crossed" sagen, drücken Deutsche den <strong>Daumen</strong>. Der Daumen war im antiken Rom das Symbol für Überleben in der Gladiatorenküche. Diese Geste kam durch die Römer zu uns.', example: '„Morgen habe ich mein Vorstellungsgespräch." — „Ich drücke dir die Daumen!"\n<em>Sagen Sie das auf Deutsch — und machen Sie die Geste dazu.</em>', translation: '«Держать кулачки» / «Желать удачи». Немцы не скрещивают пальцы, а нажимают большой палец — жест из Древнего Рима.', source: 'Duden Redewendungen' },
  { title: 'Ich verstehe nur Bahnhof', teaser: 'Nichts kapieren — der Bahnhof erklärt warum', body: 'Nach dem Ersten Weltkrieg wollten müde Soldaten nur noch den Heimatbahnhof sehen — nichts anderes verstand ihr Gehirn. Heute bedeutet es: Ich verstehe gar nichts von dem, was gesagt wird.', example: '„Die Anleitung war auf Technisch-Deutsch..." — „Ich habe nur Bahnhof verstanden!"\n<em>Perfekt, wenn der Arzt, Anwalt oder Techniker zu kompliziert spricht.</em>', translation: '«Я ничего не понял» — буквально «я понял только вокзал». После войны солдаты думали лишь о вокзале домой — всё остальное не воспринималось.', source: 'Duden Redewendungen' },
  { title: 'Hals- und Beinbruch!', teaser: 'Viel Erfolg — wörtlich: brich dir Hals und Bein', body: 'Aus dem Jiddischen: „hazlokhe un brókhe" (Glück und Segen) klingt im Deutschen wie Hals und Beinbruch. Schauspieler sagten: Damit das Böse nicht kommt, sagen wir das Schlimmste. Heute einfach: Viel Erfolg!', example: '„Ich habe gleich meine Prüfung!" — „Hals- und Beinbruch!"\n<em>Nur bei wichtigen Momenten sagen — Prüfung, Auftritt, Bewerbung.</em>' },
  { title: 'auf dem Holzweg sein', teaser: 'Auf dem falschen Weg — aber woher kommt Holz?', body: 'Im Mittelalter führten Holzwege tief in den Wald — und endeten einfach dort, wo das Holz gefällt wurde. Wer diesen Weg folgte, kam nirgends hin. Heute: eine falsche Annahme haben.', example: '„Ich denke, der Chef mag meinen Plan nicht." — „Da bist du auf dem Holzweg — er war begeistert!"\n<em>Sehr häufig in Gesprächen, wenn jemand falsch liegt.</em>' },
  { title: 'ins Fettnäpfchen treten', teaser: 'Ein peinlicher Fehler — wortwörtlich ins Fett', body: 'Früher stellten Schuster Fett auf den Boden, um Leder zu pflegen. Wer hineintrat, machte Schmutz und Chaos. Heute: aus Unwissenheit etwas Unangebrachtes sagen oder tun.', example: '„Wann kommt das Baby?" — (Stille) „Sie ist nicht schwanger..." — „Oh, ich bin ins Fettnäpfchen getreten!"\n<em>Sehr nützlich, um peinliche Situationen zu beschreiben.</em>' },
  { title: 'Das ist nicht mein Bier', teaser: 'Das ist nicht mein Problem', body: 'Bier ist in Deutschland Kulturgut. Wenn Bier nicht deins ist — kümmert es dich nicht. Diese Redewendung zeigt die direkte deutsche Art, Verantwortung abzugrenzen — ohne unhöflich zu sein.', example: '„Was sagst du zum Streit zwischen Kollegen?" — „Das ist nicht mein Bier — sollen sie es selbst klären."\n<em>Respektvoll, aber klar: Ich halte mich raus.</em>' },
  { title: 'Schwein haben', teaser: 'Glück haben — aber warum das Schwein?', body: 'Im Mittelalter gewann der letzte Platz beim Schützenfest ein Schwein — ein wertvolles Trost-Preis. Wer also Schwein hatte, gewann trotz schlechter Leistung. Heute einfach: großes Glück haben.', example: '„Du hast die letzte freie Wohnung bekommen!" — „Ja, ich hatte Schwein!"\n<em>Sagen Sie das locker — kein negativer Unterton, nur Freude.</em>' },
  { title: 'Hals- und Beinbruch!', teaser: 'Viel Erfolg — wörtlich: brich dir Hals und Bein', body: 'Aus dem Jiddischen: „hazlokhe un brókhe" (Glück und Segen) klingt im Deutschen wie Hals und Beinbruch. Schauspieler sagten: Damit das Böse nicht kommt, sagen wir das Schlimmste. Heute einfach: Viel Erfolg!', example: '„Ich habe gleich meine Prüfung!" — „Hals- und Beinbruch!"\n<em>Nur bei wichtigen Momenten sagen — Prüfung, Auftritt, Bewerbung.</em>', translation: '«Ни пуха ни пера!» — пожелание удачи, которое звучит как проклятие. Традиция: не говорить «удачи» напрямую, чтобы не сглазить.', source: 'Duden Etymologie' },
  { title: 'Das ist nicht mein Bier', teaser: 'Das ist nicht mein Problem', body: 'Bier ist in Deutschland Kulturgut. Wenn Bier nicht deins ist — kümmert es dich nicht. Diese Redewendung zeigt die direkte deutsche Art, Verantwortung abzugrenzen — ohne unhöflich zu sein.', example: '„Was sagst du zum Streit zwischen Kollegen?" — „Das ist nicht mein Bier — sollen sie es selbst klären."\n<em>Respektvoll, aber klar: Ich halte mich raus.</em>', translation: '«Это не моё дело» / «Меня это не касается». Пиво тут ни при чём — просто немецкая прямота в разграничении ответственности.', source: 'Duden Redewendungen' },
  { title: 'Schwein haben', teaser: 'Glück haben — aber warum das Schwein?', body: 'Im Mittelalter gewann der letzte Platz beim Schützenfest ein Schwein — ein wertvolles Trost-Preis. Wer also Schwein hatte, gewann trotz schlechter Leistung. Heute einfach: großes Glück haben.', example: '„Du hast die letzte freie Wohnung bekommen!" — „Ja, ich hatte Schwein!"\n<em>Sagen Sie das locker — kein negativer Unterton, nur Freude.</em>', translation: '«Повезло!» / «Счастливчик». Буквально «иметь свинью» — в средние века свинья была утешительным призом на соревнованиях.', source: 'Duden Etymologie' },
  { title: 'jemandem auf den Zahn fühlen', teaser: 'Jemanden genau befragen', body: 'Mittelalterliche Ärzte prüften den Gesundheitszustand durch Anfassen der Zähne. Heute: jemanden kritisch befragen, testen oder prüfen — ob er wirklich das weiß, was er behauptet zu wissen.', example: '„Der neue Mitarbeiter sagt, er spricht fließend Deutsch." — „Ich werde ihm auf den Zahn fühlen."\n<em>Oft in Bewerbungsgesprächen und Prüfungen zu hören.</em>', translation: '«Устроить допрос» / «Проверить на прочность». Средневековые врачи щупали зубы, чтобы оценить здоровье — отсюда выражение.', source: 'Duden Redewendungen' },
  { title: 'den Nagel auf den Kopf treffen', teaser: 'Genau das Richtige sagen', body: 'Aus dem Handwerk: Ein guter Schlag trifft den Nagel genau auf den Kopf. Kein Danebenschlagen, kein zweiter Versuch. Heute: etwas präzise und genau formulieren, den Kern einer Sache treffen.', example: '„Die Analyse war brilliant — du hast den Nagel auf den Kopf getroffen!"\n<em>Echtes Kompliment — zeigt, dass man den Deutschen wirklich zugehört hat.</em>', translation: '«Попасть в точку» / «Ударить в самую суть». Кузнечный образ: хороший удар точно в головку гвоздя — без промаха.', source: 'Duden Redewendungen' },
];

const KULTUR_WUSSTEN = [
  { title: 'Aspirin wurde in Deutschland erfunden', teaser: 'Bayer AG, 1897 — das meistverkaufte Medikament der Welt', body: 'Felix Hoffmann, Chemiker bei <strong>Bayer</strong> in Wuppertal, synthetisierte 1897 die Acetylsalicylsäure. Ursprünglich, um seinem Vater bei Rheuma zu helfen. Heute nehmen Menschen weltweit täglich 40.000 Tonnen Aspirin.', example: '🏥 Für angehende Mediziner: Aspirin blockiert COX-Enzyme und hemmt Prostaglandine — Standardwissen in deutschen Kliniken.\n<em>Nächstes Mal beim Arzt: ein tolles Gesprächsthema.</em>', translation: 'Аспирин изобрели в Германии в 1897 году на заводе Bayer. Сегодня это самое продаваемое лекарство в мире.' },
  { title: 'Das Automobil wurde in Deutschland erfunden', teaser: 'Carl Benz, 1885 — Patent-Motorwagen Nummer 1', body: '<strong>Carl Benz</strong> fuhr 1885 in Mannheim die erste motorisierte Fahrt der Geschichte. Seine Frau Bertha fuhr 1888 eigenmächtig 104 km nach Pforzheim — die erste Überlandfahrt und die erste Marketingaktion der Automobilgeschichte.', example: '🚗 Deutschland hat heute 41 Autos pro 100 Einwohner. BMW, Mercedes, Volkswagen, Porsche, Audi — alle made in Germany.\n<em>Autofahren ist in Deutschland Kulturidentität, nicht nur Transport.</em>', translation: 'Автомобиль изобрёл Карл Бенц в Германии в 1885 году. BMW, Mercedes, Volkswagen, Audi, Porsche — всё родом отсюда.' },
  { title: 'MP3 wurde in Deutschland entwickelt', teaser: 'Fraunhofer Institut, 1987 — die Musikrevolution', body: 'Das <strong>Fraunhofer Institut für Integrierte Schaltungen</strong> in Erlangen entwickelte das MP3-Format. Es verkleinerte Musikdateien um das 10-fache — und veränderte damit die gesamte Musikindustrie, Napster, iTunes und Streaming.', example: '🎵 Deutschland hat heute über 70 Fraunhofer-Institute — größte Organisation für angewandte Forschung weltweit.\n<em>Die nächste Mal, wenn Sie Musik hören: ein kleines Dankeschön nach Bayern.</em>', translation: 'Формат MP3 изобрели в Германии в институте Фраунгофера. Именно он произвёл революцию в музыкальной индустрии и породил эпоху стриминга.' },
  { title: 'Das Oktoberfest findet hauptsächlich im September statt', teaser: 'Warum September? Das hat historische Gründe', body: 'Das erste Oktoberfest war am <strong>17. Oktober 1810</strong> — zu Ehren der Hochzeit von Kronprinz Ludwig. Im Laufe der Zeit wurde es vorverlegt, um besseres Wetter zu haben. Die letzten Tage fallen noch in den Oktober — daher der Name.', example: '🍺 Fakten: 6 Millionen Besucher jährlich. 7,7 Millionen Liter Bier. 500.000 Hendl (Hähnchen). Eintritt zur Wiesn ist gratis — nur Bier und Essen kosten.\n<em>Das Wort „Wiesn" ist Münchner Dialekt für Theresienwiese.</em>', translation: 'Октоберфест проходит в основном в сентябре — так сложилось исторически ради лучшей погоды. Название осталось от первого праздника 1810 года.' },
  { title: 'Deutschland ist Weltmeister im Recycling', teaser: '67% aller Abfälle werden recycelt', body: 'Deutschland hat das komplexeste Abfallsystem der Welt: <strong>gelbe Tonne</strong> (Plastik/Metall), <strong>blaue Tonne</strong> (Papier), <strong>braune Tonne</strong> (Bio), <strong>schwarze Tonne</strong> (Restmüll), Glascontainer (weiß/grün/braun) und Pfandflaschen. Fehler haben soziale Konsequenzen.', example: '♻️ Pfand-System: 0,25€ pro Plastikflasche zurückbekommen. Supermärkte haben Automaten dafür.\n<em>Mülltrennung ist keine Empfehlung — es ist soziale Pflicht und manchmal Nachbarschaftsthema.</em>', translation: 'Германия — мировой чемпион по переработке мусора. Раздельный сбор отходов — не просьба, а социальная норма. Нарушение может испортить отношения с соседями.' },
  { title: 'Die Berliner Mauer fiel am 9. November 1989', teaser: 'Und ein Missverständnis löste alles aus', body: 'Günter Schabowski, DDR-Sprecher, verkündete die neuen Reiseregeln in einer Pressekonferenz — ohne zu wissen, wann sie gelten sollten. Auf die Frage „Ab wann?" sagte er: <strong>„Unverzüglich, sofort."</strong> Tausende gingen zur Mauer. Der Rest ist Geschichte.', example: '🧱 Die Mauer stand 28 Jahre, 2 Monate und 27 Tage. 171 Menschen starben beim Versuch, sie zu überqueren.\n<em>9. November ist auch Tag der Reichspogromnacht (1938) — ein komplexes Datum in Deutschland.</em>', translation: 'Берлинская стена пала 9 ноября 1989 года из-за случайной оговорки чиновника на пресс-конференции. Стена простояла 28 лет.' },
  { title: 'Currywurst wurde 1949 in Berlin erfunden', teaser: 'Herta Heuwer, 4. September 1949 — eine Wurst verändert Deutschland', body: '<strong>Herta Heuwer</strong> tauschte Alkohol gegen Ketchup und Currypulver von britischen Soldaten. Sie kombinierte das mit Brühwurst und verkaufte sie an ihrem Imbissstand. Heute werden in Deutschland 800 Millionen Currywürste pro Jahr gegessen.', example: '🌭 Das Currywurst Museum in Berlin (1,6 Mio. Besucher bis 2018) war dem Gericht gewidmet. VW hatte Currywurst im Speiseplan als eigenes Menü.\n<em>Bestellen Sie: „Einmal Currywurst mit Pommes, bitte" — damit sind Sie ein Berliner.</em>', translation: 'Карривурст изобрела берлинчанка Херта Хойвер в 1949 году. Сейчас в Германии съедают 800 миллионов карривурстов в год.' },
  { title: 'Das Röntgen wurde in Würzburg entdeckt', teaser: 'Wilhelm Röntgen, 8. November 1895 — ein Unfall verändert die Medizin', body: 'Wilhelm Röntgen arbeitete spät im Labor, als er bemerkte, dass ein fluoreszierender Schirm aufglühte — obwohl er abgedeckt war. Er hatte <strong>X-Strahlen</strong> entdeckt. Sechs Wochen später fotografierte er die Hand seiner Frau. Erster Nobelpreis für Physik (1901).', example: '🏥 Röntgen wollte sein Verfahren nicht patentieren: „Meine Entdeckungen gehören der Menschheit."\n<em>In deutschen Kliniken ist Röntgen Alltag — jetzt kennen Sie den Mann dahinter.</em>', translation: 'Рентгеновские лучи открыл немецкий учёный Вильгельм Рёнтген в 1895 году. Первый лауреат Нобелевской премии по физике отказался патентовать своё изобретение.' },
  { title: 'Deutsche trinken mehr Kaffee als Bier', teaser: '162 Liter Kaffee vs. 95 Liter Bier pro Person/Jahr', body: 'Das Kaffeepausen-System (<strong>Kaffeepause</strong>) ist in deutschen Büros heilig: 10–11 Uhr und 15 Uhr. Kaffee wird oft mit Kuchen kombiniert — besonders am Freitagnachmittag (<strong>Freitagskuchen</strong>). Filterkaffee dominiert, nicht Espresso.', example: '☕ „Darf ich Ihnen einen Kaffee anbieten?" ist der erste Satz bei jedem offiziellen Gespräch.\n<em>Bringen Sie Kuchen ins Büro an Ihrem Geburtstag — das ist Tradition.</em>', translation: 'Немцы пьют кофе больше, чем пиво: 162 против 95 литров в год на человека. Кофе-пауза в офисе — священный ритуал.' },
  { title: 'Es gibt über 1.500 Biersorten in Deutschland', teaser: 'Und das Reinheitsgebot von 1516 erklärt warum', body: 'Das <strong>Reinheitsgebot</strong> (1516) erlaubt nur Wasser, Gerste, Hopfen (und später Hefe) für Bier. Es ist das älteste noch gültige Lebensmittelgesetz der Welt. Deutsche Brauereien: über 1.300. Bier ist offiziell kein Alkohol in Bayern — es gilt als Grundnahrungsmittel.', example: '🍺 Wichtige Sorten: Weißbier (Bayern), Kölsch (Köln, nur in Köln!), Alt (Düsseldorf), Pils (überall).\n<em>In Köln Kölsch zu bestellen und in München Weißbier — das respektiert die Regionalstolz.</em>', translation: 'В Германии более 1500 сортов пива благодаря Закону о чистоте пива 1516 года — старейшему действующему продовольственному закону в мире.' },
];

const KULTUR_WARUM = [
  { title: 'Deutsch ist die meistgesprochene Muttersprache Europas', teaser: '130 Millionen Muttersprachler in 8 Ländern', body: 'Mehr Menschen in Europa sprechen Deutsch als Muttersprache als Englisch oder Französisch. <strong>Deutschland, Österreich, Schweiz, Luxemburg, Liechtenstein, Belgien, Südtirol, Ostbelgien</strong> — Deutsch verbindet eine riesige Region.', example: '🌍 Mit Deutschkenntnissen bewegen Sie sich in einem Wirtschaftsraum von über 400 Millionen Menschen.\n<em>C1-Deutsch öffnet nicht nur Deutschland — es öffnet Europa.</em>', translation: 'Немецкий — самый распространённый родной язык в Европе. 130 миллионов носителей в 8 странах. Это больше, чем английский или французский.' },
  { title: 'Deutschland sucht dringend Fachkräfte', teaser: 'Über 630.000 offene Stellen — der Markt wartet', body: 'Deutschland hat den größten Fachkräftemangel der Nachkriegsgeschichte. <strong>Pflege, Medizin, IT, Ingenieurwesen, Handwerk</strong> — überall fehlen qualifizierte Menschen. Mit B2/C1-Deutsch sind Sie sofort vermittelbar.', example: '📋 Durchschnittliches Gehalt Krankenpflege: 2.800–3.800€ brutto. Mit Zusatzqualifikation bis 4.500€.\n<em>Sprache ist Ihr Schlüssel — nicht nur zum Job, sondern zur Gehaltsklasse.</em>', translation: 'Германия остро нуждается в квалифицированных специалистах — свыше 630 000 вакансий. Знание немецкого на уровне B2/C1 делает вас востребованным сразу.' },
  { title: 'Deutschland ist die 3. größte Volkswirtschaft der Welt', teaser: '4,4 Billionen Euro BIP — Stabilität und Chancen', body: 'Nach den USA und China ist Deutschland die stärkste Wirtschaft der Welt. Deutsche Unternehmen sind Weltmarktführer in Maschinenbau, Chemie, Automobil und Medizintechnik. Mittelstand = 99% der Unternehmen, aber 60% der Beschäftigung.', example: '💼 Durchschnittslohn in Deutschland: 4.100€ brutto (2024). Mit akademischem Abschluss: 5.200€+.\n<em>Sprachkompetenz erhöht das Gehalt nachweislich um 15–30%.</em>', translation: 'Германия — третья экономика мира после США и Китая. Знание языка повышает зарплату на 15–30% — это статистически доказано.' },
  { title: 'Das Gesundheitssystem ist eines der besten der Welt', teaser: 'Universelle Versicherung, kurze Wartezeiten, hohe Qualität', body: 'Deutschland hat ein <strong>duales Krankenversicherungssystem</strong>: gesetzlich (GKV) und privat (PKV). Alle Einwohner sind versichert. Deutsche Kliniken sind technologisch führend — besonders in Onkologie, Kardiologie und Neurologie.', example: '🏥 Universitätskliniken (Unikliniken) sind oft Arbeitgeber und Forschungszentrum in einem.\n<em>Für Mediziner: Deutschland braucht 5.000+ ausländische Ärzte jährlich.</em>', translation: 'Система здравоохранения Германии — одна из лучших в мире. Все жители застрахованы. Немецкие клиники особенно сильны в онкологии и кардиологии.' },
  { title: 'Deutschlands Bildungssystem ist kostenlos', teaser: 'Studiengebühren: 0€ — auch für Ausländer', body: 'An den meisten deutschen Universitäten zahlen auch internationale Studierende keine Studiengebühren — nur einen <strong>Semesterbeitrag</strong> (ca. 200–350€ pro Semester). Inklusive Semesterticket für öffentliche Verkehrsmittel.', example: '🎓 Rangliste: LMU München, TU München, Heidelberg, Humboldt-Universität — weltweit unter Top 100.\n<em>Sprache = Zugang zu kostenloser Weltklasse-Bildung.</em>', translation: 'В большинстве немецких университетов обучение бесплатное — в том числе для иностранцев. Платите только семестровый взнос около 300€, в который входит проездной.' },
  { title: 'Deutsche Arbeitnehmer haben 20–30 Urlaubstage', teaser: 'Plus 10–13 Feiertage — Erholung ist Recht, nicht Privileg', body: 'Das deutsche Arbeitsrecht garantiert <strong>mindestens 20 Urlaubstage</strong> bei 5-Tage-Woche. Die meisten Tarifverträge geben 25–30 Tage. Überstunden müssen ausgeglichen werden. Burnout ist ernst genommen — Krankenstand wird nicht bestraft.', example: '⚖️ Mutterschutz: 14 Wochen. Elternzeit: bis 3 Jahre (bei vollem Kündigungsschutz).\n<em>Arbeitnehmerrechte sind in Deutschland Verfassungsrecht — nicht nur guter Wille.</em>', translation: 'Немецкие работники по закону имеют 20–30 дней отпуска плюс 10–13 праздников. Права сотрудников — не пожелание, а конституционная норма.' },
];

const KULTUR_LANDESKUNDE = [
  { title: 'Die 16 Bundesländer', teaser: 'Deutschland ist ein Bundesstaat — 16 Länder mit eigenen Regierungen', body: 'Deutschland besteht aus <strong>16 Bundesländern</strong> mit eigenen Parlamenten, Gesetzen und Kultushoheit (Schulsystem). Größtes: Bayern (70.550 km²). Kleinstes: Bremen (419 km²). Bevölkerungsreichstes: Nordrhein-Westfalen (18 Mio. Menschen).', example: '🗺️ Die drei Stadtstaaten: Berlin, Hamburg, Bremen — sie sind gleichzeitig Stadt und Bundesland.\n<em>Wichtig: Schulferien, Feiertage und Ladenöffnungszeiten variieren je nach Bundesland!</em>', translation: 'Германия — федерация из 16 земель с собственными парламентами и законами. Праздники, школьные каникулы и правила торговли отличаются от земли к земле.' },
  { title: 'Bayern — Freistaat mit Stolz', teaser: 'Mehr als Lederhose und Bier — eine eigene Weltanschauung', body: '<strong>Bayern</strong> nennt sich „Freistaat" — ein Titel aus 1918, der politische Selbstständigkeit symbolisiert. Bayern hat eigene Traditionen: Weißwurst nur bis 12 Uhr mittags, Bier als Grundnahrungsmittel, strenger Katholizismus und eine der stärksten Wirtschaftsregionen Europas.', example: '🥨 Typisch bayerisch: Weißwurst, Brezn, Obatzda, Weißbier. Begrüßung: „Servus!" oder „Grüß Gott!"\n<em>„Mia san mia" — Wir sind wir: bayerischer Selbstbewusstsein auf zwei Wörtern.</em>', translation: 'Бавария называет себя «Свободным государством» и очень этим гордится. Белая колбаса, пиво, «Grüß Gott!» — баварская идентичность не похожа ни на что другое.' },
  { title: 'Berlin — Hauptstadt mit zwei Seelen', teaser: '35 Jahre nach dem Mauerfall: arm aber sexy', body: 'Berlin war 28 Jahre lang geteilt. Heute ist es Europas größte Stadt nach Fläche, Startup-Hauptstadt Europas und kulturelles Zentrum. Berliner gelten als direkt, oft unfreundlich wirkend — das ist keine Unhöflichkeit, sondern Effizienz.', example: '🧱 Berliner Schnauze: Berliner reden direkt, schnell, ohne Höflichkeitsformeln. „Ick hab jesacht" = Ich habe gesagt.\n<em>Der Berliner Dialekt ist unverwechselbar — Hochdeutsch wird überall verstanden.</em>', translation: 'Берлин 28 лет был разделён стеной. Сегодня это стартап-столица Европы. Берлинцы говорят прямо и без лишних вежливостей — это не грубость, а стиль.' },
  { title: 'Der Rhein — Deutschlands Lebensader', teaser: '1.230 km, 5 Länder, unzählige Sagen', body: 'Der <strong>Rhein</strong> fließt durch die Schweiz, Österreich, Liechtenstein, Deutschland und die Niederlande. Das Mittelrheintal ist UNESCO-Weltkulturerbe. Die Loreley-Sage, Riesling-Weinberge und über 40 Burgen prägen die Landschaft.', example: '🍷 Das Rheinland-Pfalz produziert 70% des deutschen Weins. Riesling, Spätburgunder, Müller-Thurgau.\n<em>„Rheinländer" gelten als offener und geselliger als der Rest Deutschlands.</em>', translation: 'Рейн — главная река Германии, протекает через 5 стран. Долина Среднего Рейна с замками и виноградниками — объект ЮНЕСКО.' },
  { title: 'Der Schwarzwald', teaser: 'Kuckucksuhren, Kirschtorte und tiefe Wälder', body: 'Der <strong>Schwarzwald</strong> in Baden-Württemberg ist das größte Mittelgebirge Deutschlands. Bekannt für: Schwarzwälder Kirschtorte, Kuckucksuhren (wirklich hier erfunden!), Mineralwasser (Gerolsteiner kommt nicht von hier, aber Schwarzwald-Sprudel schon) und den Feldberg (1.493 m).', example: '🕰️ Triberg im Schwarzwald hat die größte Kuckucksuhr der Welt (4,5 m hoch).\n<em>Typische Begrüßung in Baden: „Guete Morge!" — Guten Morgen auf Badisch.</em>', translation: 'Шварцвальд — крупнейшее среднегорье Германии. Именно здесь изобрели часы с кукушкой, а торт «Шварцвальд» стал всемирно известным.' },
  { title: 'Hamburg — das Tor zur Welt', teaser: 'Deutschlands größter Hafen und reichste Stadt', body: '<strong>Hamburg</strong> ist Deutschlands zweitgrößte Stadt und einer der 10 größten Häfen Europas. Die Speicherstadt ist UNESCO-Weltkulturerbe. Hamburg hat die meisten Millionäre pro Kopf in Deutschland und den größten Musikal-Tourismus Europas (Stage Entertainment).', example: '⚓ „Moin!" — Hamburger Begrüßung zu jeder Tageszeit (Moin Moin = sehr herzlich).\n<em>Hamburg hat mehr Brücken als Venedig, Amsterdam und London zusammen: über 2.500.</em>', translation: 'Гамбург — второй город Германии и один из крупнейших портов Европы. «Moin!» — так здесь здороваются в любое время дня.' },
  { title: 'Die Zugspitze und die Alpen', teaser: 'Deutschlands höchster Berg: 2.962 m über Meer', body: 'Die <strong>Zugspitze</strong> an der bayerisch-österreichischen Grenze ist Deutschlands höchster Gipfel. Das Wettersteingebirge gehört zu den Nördlichen Kalkalpen. Skigebiete in Bayern (Garmisch-Partenkirchen) sind international bekannt — Olympia 1936 fand dort statt.', example: '🏔️ Mit der Zahnradbahn oder Seilbahn auf die Zugspitze — Panoramarestaurant auf dem Gipfel.\n<em>Deutsche lieben Wandern: 300.000 km markierte Wanderwege im Land.</em>', translation: 'Цугшпитце (2962 м) — высочайшая вершина Германии. Немцы обожают пешие прогулки: в стране 300 000 км размеченных маршрутов.' },
  { title: 'Nordrhein-Westfalen — das Herz der Industrie', teaser: 'Ruhrgebiet: vom Stahl zur Kreativwirtschaft', body: '<strong>NRW</strong> ist das bevölkerungsreichste Bundesland (18 Mio.) mit dem ehemaligen Industriezentrum Ruhrgebiet. Dortmund, Essen, Bochum, Duisburg — früher Kohle und Stahl, heute Universitäten, Museen und Kultur. Der Wandel wird als „Strukturwandel" gefeiert.', example: '⚙️ Das Ruhrgebiet hat mehr Einwohner als Wien und Budapest zusammen — und gilt als eine Stadt.\n<em>Kölner Dom: 632 Jahre Bauzeit (1248–1880). UNESCO-Weltkulturerbe seit 1996.</em>', translation: 'Северный Рейн-Вестфалия — самая населённая земля Германии. Рурская область превратилась из угольно-стального центра в регион культуры и университетов.' },
];

const KULTUR_LITERATUR = [
  { title: 'Johann Wolfgang von Goethe', teaser: 'Der Shakespeare Deutschlands — und viel mehr', body: '<strong>Goethe</strong> (1749–1832) ist Deutschlands größter Dichter, Naturwissenschaftler, Staatsmann und Universalgenie. „Faust" ist das meistgelesene Werk der deutschen Literatur. „Die Leiden des jungen Werthers" löste eine Selbstmordepidemie in Europa aus — Bücher wurden verboten.', example: '📖 Zitat: „Wer immer strebend sich bemüht, den können wir erlösen." (Faust II)\n<em>Das Goethe-Institut fördert die deutsche Sprache weltweit — benannt nach ihm.</em>', translation: 'Гёте — величайший немецкий поэт и мыслитель. «Фауст» — самое читаемое произведение немецкой литературы. Институт Гёте по всему миру носит его имя.' },
  { title: 'Friedrich Schiller', teaser: 'Freiheit, Freundschaft, Idealismus — der Dichter der Deutschen', body: '<strong>Schiller</strong> (1759–1805) war Goethes Freund und Gegenpol. „Die Räuber", „Don Carlos", „Wilhelm Tell" — alle über Freiheit gegen Unterdrückung. Seine „Ode an die Freude" wurde von Beethoven als Schlusschor der 9. Sinfonie vertont — heute Europahymne.', example: '🎵 „Alle Menschen werden Brüder" — Schillers Text, Beethovens Musik: die Europahymne seit 1985.\n<em>Der 10. November (Schillers Geburtstag) ist in Weimar ein Festtag.</em>', translation: 'Шиллер — друг Гёте и поэт свободы. Его «Ода к радости» в музыке Бетховена стала гимном Европейского союза.' },
  { title: 'Franz Kafka', teaser: '„Kafkaesk" steht heute im Duden — und im Oxford Dictionary', body: '<strong>Kafka</strong> (1883–1924) schrieb auf Deutsch in Prag. „Die Verwandlung" (Gregor Samsa erwacht als Ungeziefer), „Der Process", „Das Schloss" — Bürokratie, Schuld, Entfremdung. Das Adjektiv „kafkaesk" beschreibt absurde, bürokratische Albträume — in 50 Sprachen.', example: '🪲 „Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheueren Ungeziefer verwandelt." — Erster Satz der Weltliteratur.\n<em>Kafka wollte seine Werke verbrennen lassen. Sein Freund Max Brod rettete sie.</em>', translation: 'Кафка писал по-немецки в Праге. Слово «кафкианский» вошло в словари 50 языков. Его книги про абсурд бюрократии он хотел сжечь — друг спас их.' },
  { title: 'Thomas Mann', teaser: 'Nobelpreis 1929 — die Buddenbrooks und der Zauberberg', body: '<strong>Thomas Mann</strong> (1875–1955) erhielt den Nobelpreis für „Buddenbrooks" — ein Familienroman über den Verfall einer Lübecker Kaufmannsfamilie. „Der Zauberberg" ist ein Schlüsselroman des 20. Jahrhunderts über Krankheit, Zeit und Europa vor dem Ersten Weltkrieg.', example: '📚 Mann floh 1933 aus Nazi-Deutschland. Aus dem Exil: „Deutschland, hör auf mich! Kehre um!"\n<em>Sein Haus in München wurde von den Nazis beschlagnahmt — heute Gedenkstätte.</em>', translation: 'Томас Манн — лауреат Нобелевской премии 1929 года. «Будденброки» и «Волшебная гора» — вершины немецкой прозы XX века. Он бежал от нацистов в эмиграцию.' },
  { title: 'Die Brüder Grimm', teaser: 'Nicht nur Märchen — die Erfinder des deutschen Wörterbuchs', body: '<strong>Jacob und Wilhelm Grimm</strong> sammelten keine Märchen — sie dokumentierten mündliche Volksüberlieferungen. Ursprünglich waren die Märchen brutal (Aschenputtel: Tauben pickten die Augen der bösen Schwestern aus). Sanftere Versionen kamen später. Nebenbei: sie begannen das erste vollständige Deutsche Wörterbuch.', example: '📕 Das Deutsche Wörterbuch der Brüder Grimm: 33 Bände, 350.000 Stichwörter. Fertiggestellt 1961 — 100 Jahre nach dem Tod der Brüder.\n<em>„Rotkäppchen", „Hänsel und Gretel", „Schneewittchen" — alles aus dem deutschen Wald.</em>', translation: 'Братья Гримм не сочиняли сказки — они записывали народные предания. Оригиналы были намного жестче. Параллельно они создали первый полный словарь немецкого языка.' },
  { title: 'Bertolt Brecht', teaser: 'Theater als politische Waffe — episches Theater', body: '<strong>Brecht</strong> (1898–1956) erfand das „epische Theater": Zuschauer sollen nicht mitfühlen, sondern nachdenken. „Die Dreigroschenoper", „Mutter Courage", „Der gute Mensch von Sezuan". Er wollte das Publikum aufwecken, nicht unterhalten.', example: '🎭 Brechts berühmteste Aussage: „Erst kommt das Fressen, dann kommt die Moral."\n<em>Das Berliner Ensemble (Brechts eigenes Theater) existiert heute noch am Schiffbauerdamm.</em>', translation: 'Брехт изобрёл «эпический театр»: зрители должны думать, а не сопереживать. «Трёхгрошовая опера» и «Мамаша Кураж» — классика мирового театра.' },
  { title: 'Hermann Hesse', teaser: 'Nobelpreis 1946 — Siddhartha und der Steppenwolf', body: '<strong>Hesse</strong> (1877–1962) verband östliche Philosophie mit westlicher Psychologie. „Siddhartha" über die Suche nach Erleuchtung, „Steppenwolf" über innere Zerrissenheit, „Das Glasperlenspiel" über die Zukunft der Bildung. In den 1960ern Kultautor der Hippie-Bewegung in den USA.', example: '🔮 Hesse sagte: „Um nach innen zu gelangen, muss man durch sich selbst hindurchgehen."\n<em>Hesse lebte in Montagnola (Schweiz) — sein Haus ist heute Museum.</em>', translation: 'Гессе — лауреат Нобелевской премии 1946 года, соединил восточную философию с западной психологией. «Сиддхартха» и «Степной волк» — культовые романы.' },
  { title: 'Rainer Maria Rilke', teaser: 'Der größte deutschsprachige Lyriker des 20. Jahrhunderts', body: '<strong>Rilke</strong> (1875–1926) schrieb Lyrik, die emotionale Tiefe und Sprachpräzision vereint. „Das Stundenbuch", „Duineser Elegien", „Sonette an Orpheus". Er schrieb auf Deutsch, lebte aber in Paris, Rom und Russland — ein kosmopolitischer Dichter.', example: '✍️ Rilke-Zitat: „Ich lebe mein Leben in wachsenden Ringen, die sich über die Dinge ziehn."\n<em>Rilke schrieb auch auf Französisch und war Sekretär des Bildhauers Rodin.</em>', translation: 'Рильке — величайший немецкоязычный лирик XX века. Писал по-немецки, жил в Париже, Риме, России. Был личным секретарём скульптора Родена.' },
];

const KULTUR_GESUNDHEIT = [
  { title: 'GKV vs. PKV — das Krankenversicherungssystem', teaser: 'Alle sind versichert — aber nicht alle gleich', body: '<strong>GKV</strong> (Gesetzliche Krankenversicherung): für Arbeitnehmer unter 69.300€/Jahr Pflicht. Beitrag: ca. 14,6% des Gehalts (halb-halb mit Arbeitgeber). <strong>PKV</strong> (Private KV): für Besserverdienende, Selbstständige, Beamte. Schnellere Termine, Chefarztbehandlung.', example: '🏥 Wichtige Kassen: AOK, TK (Techniker Krankenkasse), Barmer, DAK. TK gilt als besonders digital und serviceorientiert.\n<em>Kasse wechseln ist möglich — mindestens 18 Monate Mitgliedschaft, dann 2 Monate Kündigungsfrist.</em>', translation: 'В Германии два вида медстрахования: GKV (обязательное, для большинства) и PKV (частное, для высокооплачиваемых). Все жители застрахованы.' },
  { title: 'Der Hausarzt — Ihr erster Ansprechpartner', teaser: 'Ohne Hausarzt kein Facharzt — das Überweisungssystem', body: 'In Deutschland gibt es das <strong>Lotsen-System</strong>: Der Hausarzt (Allgemeinmediziner) ist der erste Kontakt. Für Fachärzte braucht man meist eine <strong>Überweisung</strong>. Ausnahme: Notfall, Augenarzt, Gynäkologe, Zahnarzt — direkt möglich.', example: '📋 Hausarzt finden: Kassenärztliche Vereinigung → „Arztsuche" auf kvno.de (je nach Bundesland).\n<em>„Ich bin krank" auf Deutsch: „Ich bin erkrankt" (formell) oder „Mir geht es nicht gut" (direkt zum Arzt).</em>', translation: 'Семейный врач (Hausarzt) — первая точка контакта. К специалисту без направления не попасть. Исключения: глазной врач, гинеколог, стоматолог, скорая помощь.' },
  { title: 'Krankmeldung — wie man sich krankmeldet', teaser: 'Tag 1: Arbeitgeber anrufen. Tag 4: Attest zum Arzt', body: 'Bei Krankheit sofort (vor Arbeitsbeginn) den <strong>Arbeitgeber informieren</strong> — per Telefon, nicht per SMS. Ab dem <strong>4. Krankheitstag</strong> brauchen Sie eine ärztliche <strong>Arbeitsunfähigkeitsbescheinigung (AU)</strong> — die „gelbe Schein" (heute oft digital).', example: '📞 Was sagen: „Ich bin leider erkrankt und kann heute nicht kommen. Ich gehe zum Arzt und reiche die AU-Bescheinigung ein."\n<em>Seit 2023: eAU — der Arzt schickt die Krankmeldung direkt digital an die Krankenkasse.</em>', translation: 'Заболели — сразу звоните работодателю (до начала рабочего дня). С 4-го дня нужна справка от врача (AU). С 2023 года врач отправляет её в кассу цифровым способом.' },
  { title: 'Apotheke und Rezept', teaser: 'Ohne Rezept geht hier wenig — aber Beratung ist kostenlos', body: 'In Deutschland dürfen nur <strong>Apotheken</strong> Medikamente verkaufen (keine Drogeriemärkte für rezeptpflichtige Mittel). Mit GKV-Versicherung zahlen Sie <strong>10€ Zuzahlung</strong> pro Medikament (max.). Kinder bis 18: kostenlos. Apotheken bieten kostenlose Beratung — nutzen Sie das.', example: '💊 Wichtige Begriffe: Rezept (Verordnung), rezeptfrei (OTC), rezeptpflichtig (Rx), Zuzahlung (co-pay), Packungsbeilage (Beipackzettel).\n<em>Nacht-Apotheke: jede Stadt hat rotierende Notapotheke. Aushang an jeder Apothekentür.</em>', translation: 'Лекарства в Германии продают только в аптеках. По рецепту — доплата максимум 10€. Аптекари консультируют бесплатно — не стесняйтесь спрашивать.' },
  { title: 'Notaufnahme vs. Notarzt — wann was?', teaser: 'Falsche Wahl kostet Zeit und Geld', body: '<strong>Notarzt (112)</strong>: Lebensgefahr, Herzinfarkt, Schlaganfall, schwerer Unfall. <strong>Notaufnahme (Krankenhaus)</strong>: Weniger dringende Notfälle — Knochenbrüche, starke Schmerzen. <strong>Ärztlicher Bereitschaftsdienst (116117)</strong>: Dringendes, aber kein Notfall — Abends, Wochenende, Feiertage.', example: '📞 Merken Sie sich: 112 = Feuerwehr/Notarzt | 110 = Polizei | 116117 = Ärztlicher Bereitschaftsdienst.\n<em>Falsch in die Notaufnahme zu gehen kostet nichts mit GKV — aber die Wartezeit ist lang.</em>', translation: 'Три номера, которые нужно знать: 112 (скорая/пожарные), 110 (полиция), 116117 (дежурный врач вечером и в выходные). Каждый для своей ситуации.' },
  { title: 'Vorsorgeuntersuchungen — kostenlos und wichtig', teaser: 'Die Krankenkasse bezahlt regelmäßige Checks', body: 'Deutsche Krankenkassen übernehmen zahlreiche <strong>Vorsorgeuntersuchungen</strong> ohne Zuzahlung: Krebsvorsorge, Zahnreinigung (2x/Jahr), Blutuntersuchungen, Augen-Screening. Das <strong>Gesundheits-Checkup</strong> (ab 35) alle 3 Jahre ist umfangreich und kostenlos.', example: '🩺 Checkliste: Check-up 35+ (alle 3 Jahre), Hautkrebsvorsorge (alle 2 Jahre), Darmspiegelung (ab 50), Mammografie (ab 50).\n<em>Fragen Sie Ihren Hausarzt: „Welche Vorsorgeuntersuchungen stehen mir zu?"</em>', translation: 'Касса оплачивает регулярные профилактические осмотры — чистка зубов, анализы крови, онкоскрининг. Всё бесплатно — просто спросите врача, что вам положено.' },
  { title: 'Psychotherapie in Deutschland', teaser: 'Kostenlos mit Kassenzulassung — aber mit Wartezeit', body: 'Psychotherapie ist in Deutschland eine anerkannte Leistung der GKV. Der Weg: <strong>Hausarzt</strong> → Überweisung → <strong>Psychotherapeut</strong> mit Kassenzulassung → Kostenübernahme. Wartezeit: oft 3–6 Monate. Alternativ: Privatpraxis (schneller, aber ca. 100–200€/Stunde).', example: '🧠 Wichtig: psychische Erkrankungen sind in Deutschland genauso anerkannt wie körperliche — kein Stigma im Rechtssystem.\n<em>In der Krise: Telefonseelsorge 0800 111 0 111 (kostenlos, 24/7).</em>', translation: 'Психотерапия в Германии — официальная услуга медстрахования. Касса покрывает расходы, но ждать приходится 3–6 месяцев. Психические болезни юридически приравнены к физическим.' },
  { title: 'Zahngesundheit in Deutschland', teaser: 'Grundversorgung kostenlos, Extras selbst zahlen', body: 'GKV übernimmt: 2 Kontrollen/Jahr, Füllungen (aber oft nur Amalgam/Standard), Zahnreinigung (2x/Jahr teilweise). Inlays, Implantate, Veneers: <strong>Eigenanteil</strong> oft 50–80%. Tipp: <strong>Bonusheft</strong> führen — regelmäßige Kontrollen senken den Eigenanteil.', example: '🦷 Bonusheft: jeder Zahnarztbesuch wird eingetragen. Nach 5 Jahren: höhere Kassenleistung bei Zahnersatz.\n<em>Privatpatienten beim Zahnarzt: Wartezeit kürzer, Behandlung oft umfangreicher.</em>', translation: 'Базовая стоматология оплачивается кассой: два осмотра в год, пломбы. Имплантаты и виниры — за свой счёт. Ведите Bonusheft: регулярность снижает вашу долю оплаты.' },
];

const KULTUR_BUEROKRATIE = [
  { title: 'Die Anmeldung — erste Pflicht in Deutschland', teaser: 'Innerhalb von 14 Tagen nach Einzug — sonst Bußgeld', body: 'Wer in Deutschland wohnt, muss sich beim <strong>Einwohnermeldeamt</strong> (auch: Bürgerbüro) anmelden. Benötigt: Reisepass/Personalausweis, ausgefülltes Anmeldeformular, <strong>Wohnungsgeberbestätigung</strong> (Unterschrift des Vermieters). Ergebnis: <strong>Meldebescheinigung</strong> — Ihr wichtigstes Dokument.', example: '📋 Ohne Anmeldung: kein Bankkonto, keine Sozialleistungen, kein Führerschein, keine Steuernummer.\n<em>Online-Termin buchen unter: [Einwohnermeldeamt + Ihr Stadtname] — oft Wochen im Voraus.</em>', translation: 'Anmeldung — регистрация по месту жительства. Обязательна в течение 14 дней после переезда. Без неё нет счёта в банке, нет налогового номера, нет ничего.' },
  { title: 'Personalausweis vs. Reisepass', teaser: 'Zwei Dokumente — verschiedene Zwecke', body: '<strong>Personalausweis</strong>: für Deutsche Pflicht ab 16, gilt in allen EU-Ländern + einigen anderen. Gültig 10 Jahre (ab 24), 6 Jahre (unter 24). Kosten: ca. 37€. <strong>Reisepass</strong>: für Reisen außerhalb der EU. 64-seitig für Vielreisende. Kosten: ca. 70–100€.', example: '🛂 Ausländer in Deutschland: brauchen Aufenthaltstitel + Reisepass. Niederlassungserlaubnis = unbefristetes Recht.\n<em>Abgelaufener Ausweis? Sofort zum Bürgeramt — Reisen ohne gültiges Dokument ist strafbar.</em>', translation: 'Personalausweis — удостоверение личности для поездок внутри ЕС. Reisepass — для стран вне ЕС. Иностранцам нужен вид на жительство плюс загранпаспорт.' },
  { title: 'Die Behörden — wer macht was?', teaser: 'Deutschland hat viele Ämter — jedes hat seine Aufgabe', body: '<strong>Einwohnermeldeamt/Bürgerbüro</strong>: Anmeldung, Abmeldung, Ummeldung. <strong>Ausländerbehörde</strong>: Aufenthaltstitel, Visa. <strong>Finanzamt</strong>: Steuern. <strong>Jobcenter</strong>: Arbeitslosengeld II. <strong>Agentur für Arbeit</strong>: Arbeitslosengeld I, Arbeitsvermittlung. <strong>Standesamt</strong>: Geburten, Heiraten, Sterbefälle.', example: '🏛️ Alle Behörden auf einen Blick: buergerservice.de oder die App der jeweiligen Stadt.\n<em>Termin ohne Termin? In manchen Städten gibt es Warteschlangenmanagement — anstehen ist nicht nötig.</em>', translation: 'В Германии у каждого ведомства своя роль: Einwohnermeldeamt — регистрация, Ausländerbehörde — виза, Finanzamt — налоги, Jobcenter — пособие по безработице.' },
  { title: 'Der Briefkasten — Ihr wichtigstes Kommunikationsmittel', teaser: 'Deutsche Behörden schreiben Briefe — viele Briefe', body: 'In Deutschland kommunizieren Behörden per <strong>Brief</strong>. Ignorieren = teuer. Wichtige Absender: Finanzamt, Krankenkasse, Agentur für Arbeit, Gericht, GEZ (Rundfunkbeitrag). Briefe mit <strong>Einschreiben</strong> (Unterschrift nötig) sind besonders wichtig.', example: '📬 Regel: Jeder Behördenbrief hat eine <strong>Frist</strong>. Frist verpasst = Konsequenzen. Sofort lesen, sofort reagieren.\n<em>Nicht verstanden? Schreiben Sie zurück und bitten um Erläuterung — das ist Ihr Recht.</em>', translation: 'Немецкие ведомства общаются письмами. Игнорировать — дорого. Каждое письмо от государства содержит срок ответа: пропустили — получите последствия.' },
  { title: 'Das Formular — Deutschlands heiliger Gegenstand', teaser: 'Alles braucht ein Formular — und eine Unterschrift', body: 'Deutsche Formulare haben Felder für: Nachname, Vorname (genau in dieser Reihenfolge!), Geburtsdatum, Geburtsort, Staatsangehörigkeit, Anschrift, Datum, <strong>eigenhändige Unterschrift</strong>. Tipp: immer in <strong>Druckbuchstaben</strong> (Blockschrift) schreiben — lesbar und anerkannt.', example: '✍️ „Unterschrift, Ort, Datum" — diese drei erscheinen auf jedem deutschen Formular.\n<em>Online-Formulare: viele Ämter bieten PDF-Formulare an. Ausfüllen, ausdrucken, unterschreiben, einreichen.</em>', translation: 'Формуляры — священный объект немецкой бюрократии. Сначала фамилия, потом имя. Всегда печатными буквами. Подпись, место, дата — без исключений.' },
  { title: 'Steuern in Deutschland — Grundwissen', teaser: 'Steuerklassen, Freibeträge, Pflicht zur Abgabe', body: 'Deutschland hat 6 <strong>Steuerklassen</strong>: I (ledig), II (Alleinerziehend), III (verheiratet, höheres Einkommen), IV (verheiratet, gleich), V (verheiratet, niedrigeres), VI (Zweitjob). Einkommenssteuer: 14–45%. <strong>Steuererklärung</strong> freiwillig, aber lohnt sich — Ø Rückerstattung: 1.095€.', example: '💰 Elster (elster.de) = kostenloses Programm für die Steuererklärung. Frist: 31. Juli des Folgejahres.\n<em>Steuerberater: ca. 150–400€ — bei komplizierter Situation oft günstiger als Selbermachen.</em>', translation: 'В Германии 6 налоговых классов. Налоговая декларация не обязательна, но в среднем возвращают 1095€. Подавать её выгодно почти всегда.' },
  { title: 'Der Rundfunkbeitrag — 18,36€ pro Monat', teaser: 'Pflicht für jeden Haushalt — unabhängig vom TV-Konsum', body: 'Der <strong>Rundfunkbeitrag</strong> (früher GEZ) finanziert ARD, ZDF und Deutschlandradio. Jeder Haushalt zahlt 18,36€/Monat — egal ob Fernseher, Tablet oder gar nichts. Befreiung möglich bei: Bürgergeld-Empfang, BAföG, bestimmten Behinderungen.', example: '📺 Anmelden unter: rundfunkbeitrag.de. Nicht anmelden und nicht zahlen = Bußgeld bis 1.000€.\n<em>WG (Wohngemeinschaft): nur ein Beitrag für alle Bewohner — wer zahlt, entscheiden Sie selbst.</em>', translation: 'Rundfunkbeitrag — обязательный сбор 18,36€/месяц с каждого домохозяйства на общественное телерадиовещание. Телевизора может не быть — платить всё равно надо.' },
  { title: 'Fristen — Deutschlands heiliges Prinzip', teaser: 'Zu spät = Konsequenzen. Immer. Ohne Ausnahme.', body: 'Deutsche Bürokratie kennt <strong>keine Gnade bei Fristversäumnis</strong>. Widerspruchsfrist (Einspruch gegen Bescheid): meist 4 Wochen. Steuererklärung: 31. Juli. Kündigung: 3 Monate vor Vertragsende. Anmeldung: 14 Tage nach Einzug. Verpassen Sie eine Frist — schreiben Sie sofort und erklären warum.', example: '⏰ Tipp: Alle Fristen sofort im Kalender eintragen. Bei Unklarheit: anrufen und fragen. Behörden helfen gerne — wenn man höflich fragt.\n<em>„Ich bitte um Fristverlängerung" — dieser Satz kann viel retten.</em>', translation: 'Сроки в Германии — святое. Пропустили дедлайн — получите штраф или откажут в праве. Сразу вносите все сроки в календарь. Фраза «прошу продлить срок» может спасти ситуацию.' },
];

const KULTUR_FINANZEN = [
  { title: 'IBAN und das deutsche Banksystem', teaser: 'Deutschland: Barzahlung plus modernes Banking', body: 'Deutsche IBAN beginnt mit <strong>DE</strong> + 2 Prüfziffern + 18-stellige Kontonummer. Für alles in Deutschland brauchen Sie ein Girokonto: Gehalt, Miete, Versicherungen. Top-Banken: Sparkasse, Volksbank, Deutsche Bank, Commerzbank. Online: DKB, N26, ING — oft kostenlos.', example: '💳 N26 und DKB sind bei Ausländern beliebt: kein Mindestgehalt, einfache Eröffnung mit Ausweis.\n<em>SEPA-Überweisung innerhalb EU: 1 Werktag. Dauerauftrag: automatische monatliche Zahlung.</em>', translation: 'Без расчётного счёта в Германии не обойтись: зарплата, аренда, страховки — всё через банк. N26 и DKB открывают счёт иностранцам без сложностей.' },
  { title: 'Die Haftpflichtversicherung — Pflicht für jeden', teaser: 'Wichtigste Versicherung Deutschlands — ca. 5€/Monat', body: '<strong>Private Haftpflichtversicherung</strong>: übernimmt Schäden, die Sie anderen zufügen — versehentlich. Beispiele: Fahrradunfall, kaputtes Tablet eines Freundes, Wasserrohrbruch in der Mietwohnung. Ohne sie haften Sie persönlich — für immer, auch mit zukünftigem Einkommen.', example: '🛡️ Kosten: 3–8€/Monat. Leistung: oft bis 10 Millionen Euro Deckungssumme.\n<em>„Ohne Haftpflicht bist du in Deutschland nackt" — so sagen es Deutsche unter sich.</em>', translation: 'Haftpflichtversicherung — страховка личной ответственности. Стоит 3–8€/месяц, покрывает до 10 млн€. Без неё вы лично отвечаете за любой причинённый ущерб — пожизненно.' },
  { title: 'Die Nebenkostenabrechnung', teaser: 'Januar = Nachzahlung oder Rückerstattung aus dem Vorjahr', body: 'Neben der Kaltmiete zahlen Mieter monatliche <strong>Vorauszahlungen</strong> für Heizung, Wasser, Müllentsorgung, Gebäudeversicherung. Im Januar/Februar kommt die <strong>Nebenkostenabrechnung</strong> — Endabrechnung. Zu viel gezahlt → Rückerstattung. Zu wenig → Nachzahlung. Frist zum Widerspruch: 12 Monate.', example: '🏠 Typische Nebenkosten: 2,00–3,50€/m² pro Monat. Bei 60m² Wohnung: 120–210€/Monat extra.\n<em>Heizkosten prüfen: Heizkosten.de — Verbrauchsabrechnung verstehen.</em>', translation: 'Nebenkostenabrechnung — ежегодный перерасчёт коммунальных расходов. Переплатили — возвращают деньги. Недоплатили — выставляют счёт. Проверяйте в течение 12 месяцев.' },
  { title: 'Schufa — Deutschlands Kreditauskunft', teaser: 'Ihr finanzieller Ruf — Vermieter und Banken prüfen ihn', body: '<strong>Schufa</strong> (Schutzgemeinschaft für allgemeine Kreditsicherung) sammelt Ihre Zahlungshistorie. Vermieter und Banken prüfen den Schufa-Score. Gut: pünktliche Zahlungen, wenige Konten. Schlecht: Mahnungen, Inkasso, viele Kreditanfragen. Einmal jährlich: kostenlose Selbstauskunft unter meineschufa.de.', example: '📊 Score über 97%: sehr gut. Unter 90%: schwierig für Wohnungen und Kredite.\n<em>Negative Einträge bleiben 3 Jahre nach Begleichung der Schuld gespeichert.</em>', translation: 'Schufa — немецкое бюро кредитных историй. Арендодатели и банки запрашивают ваш рейтинг. Хороший скор (97%+) — ключ к квартире и кредиту.' },
  { title: 'Versicherungen — was man wirklich braucht', teaser: 'Deutsche sind Weltmeister im Versichern — zu Recht', body: 'Pflicht: <strong>Krankenversicherung</strong>, <strong>KFZ-Haftpflicht</strong> (Auto). Sehr empfohlen: <strong>Haftpflicht</strong>, <strong>Hausratversicherung</strong> (Diebstahl, Feuer, Wasserschäden). Optional: Berufsunfähigkeit, Lebensversicherung, Rechtsschutz. Überschätzt: Handyversicherung, Reisegepäckversicherung.', example: '📋 Vergleich: check24.de oder verivox.de — transparent, kostenlos, unabhängig.\n<em>Versicherungen kündigen: zum Jahresende mit 3 Monaten Frist. Immer schriftlich (Brief oder E-Mail mit Bestätigung).</em>', translation: 'Обязательно: медстраховка и ОСАГО (для авто). Очень рекомендуется: Haftpflicht и страховка имущества. Страховка смартфона и багажа — как правило, лишнее.' },
  { title: 'Steuererklärung — mehr zurückbekommen als gedacht', teaser: 'Ø 1.095€ Rückerstattung — fast jeder macht sie zu selten', body: 'Absetzbar: <strong>Werbungskosten</strong> (Fahrtkosten, Arbeitsmittel), Handwerkerleistungen, Sonderausgaben (Spenden, Versicherungen), außergewöhnliche Belastungen (Krankheitskosten). Kostenloses Tool: Elster. Günstige Software: Wundertax, Taxfix (ab 35€).', example: '💰 Pendlerpauschale: 0,38€/km einfache Fahrt ab dem 21. km. Bei 30 km Arbeitsweg: ca. 750€/Jahr absetzbar.\n<em>Steuererklärung abgeben lohnt sich bei: Homeoffice, Umzug wegen Job, Weiterbildung, Kinderbetreuung.</em>', translation: 'Налоговая декларация не обязательна, но в среднем возвращают 1095€. Учитываются расходы на дорогу, домашний офис, обучение. Подавать почти всегда выгодно.' },
  { title: 'Miete in Deutschland — was man wissen muss', teaser: 'Kaltmiete + Warmmiete + Kaution + Makler', body: '<strong>Kaltmiete</strong>: Grundmiete ohne Nebenkosten. <strong>Warmmiete</strong>: alles inklusive. <strong>Kaution</strong>: max. 3 Nettokaltmieten (legal). Rückgabe: nach Auszug, wenn keine Schäden. <strong>Mietpreisbremse</strong>: in vielen Städten gilt eine Begrenzung für Mieterhöhungen.', example: '🏡 Mietspiegel: zeigt die ortsübliche Vergleichsmiete. Vermieter dürfen in manchen Städten nur 10% darüber gehen.\n<em>Mietvertrag: immer schriftlich. Kündigung: 3 Monate Frist. Eigenbedarfskündigung: 3–9 Monate Frist.</em>', translation: 'Kaltmiete — аренда без коммунальных. Warmmiete — всё включено. Залог — максимум 3 холодные месячные ставки. Закон о «тормозе арендной платы» ограничивает рост цен.' },
  { title: 'Deutsches Strom- und Gasnetz', teaser: 'Anbieter wechseln — und 200–500€ sparen', body: 'Strom und Gas sind in Deutschland liberalisiert — Sie wählen Ihren Anbieter frei. Grundversorger ist teuer — aber sicher. Alternativanbieter: oft 20–40% günstiger. Vergleich: verivox.de, check24.de. Wechsel dauert ca. 4–6 Wochen, läuft automatisch.', example: '⚡ Durchschnittlicher Stromverbrauch: 1.500 kWh/Person/Jahr. Kosten: ca. 600–800€/Jahr.\n<em>Beim Einzug sofort Zählerstand fotografieren und dem Vermieter melden — schützt vor falschen Abrechnungen.</em>', translation: 'Газ и электричество в Германии можно выбирать свободно. Сменить поставщика — сэкономить 200–500€ в год. При въезде сразу сфотографируйте показания счётчика.' },
];

const KULTUR_POLITIK = [
  { title: 'Das Grundgesetz — Deutschlands Verfassung', teaser: '1949: aus dem Trauma des Nationalsozialismus geboren', body: 'Das <strong>Grundgesetz</strong> (GG) wurde 1949 als Reaktion auf die Nazi-Diktatur verfasst. Artikel 1: „Die Würde des Menschen ist unantastbar." Artikel 20: „Alle Staatsgewalt geht vom Volke aus." Es enthält unveränderbare Grundrechte — die „Ewigkeitsklausel" schützt sie vor jeder Mehrheit.', example: '🏛️ Das Grundgesetz kann nicht per Volksabstimmung geändert werden — extra Schutz vor populistischen Mehrheiten.\n<em>Bundesverfassungsgericht in Karlsruhe: die höchste rechtliche Instanz — prüft, ob Gesetze dem GG entsprechen.</em>', translation: 'Grundgesetz — конституция Германии 1949 года, написанная после ужасов нацизма. Статья 1: «Достоинство человека неприкосновенно». Ключевые права нельзя изменить никаким большинством.' },
  { title: 'Bundestag und Bundesrat', teaser: 'Zwei Kammern — aber sehr unterschiedlich', body: '<strong>Bundestag</strong>: direkt gewähltes Parlament (736 Abgeordnete). Wählt den Bundeskanzler. <strong>Bundesrat</strong>: Vertretung der 16 Bundesländer (69 Mitglieder). Kein direktes Volksmandat. Bei vielen Gesetzen braucht man beide — besonders bei föderalen Themen.', example: '🗳️ Bundestag-Wahl: alle 4 Jahre im Herbst. Zwei Stimmen: Erststimme (Direktkandidat), Zweitstimme (Partei).\n<em>5%-Hürde: Parteien unter 5% der Zweitstimmen kommen nicht in den Bundestag — Schutz vor Zersplitterung.</em>', translation: 'Бундестаг — прямо избираемый парламент. Бундесрат — представительство земель. У избирателя два голоса: за кандидата и за партию. Барьер 5% защищает от раздробленности.' },
  { title: 'Koalitionsregierung — Deutschlands Normalfall', teaser: 'Deutschland regiert immer zusammen — nie allein', body: 'Durch das Verhältniswahlrecht (5%-Hürde, viele Parteien) hat Deutschland fast immer <strong>Koalitionsregierungen</strong>. Koalitionsvertrag: ein Vertrag zwischen Parteien, wer welche Politik umsetzt. Koalitionsverhandlungen dauern oft 2–4 Monate.', example: '🤝 Bekannte Koalitionen: Große Koalition (CDU/CSU + SPD = „Groko"), Ampel (SPD + FDP + Grüne), Schwarz-Grün.\n<em>Koalitionskrise = Regierung verliert ihre Mehrheit. Das führt manchmal zu Neuwahlen.</em>', translation: 'В Германии почти всегда правят коалиции — одна партия не набирает большинство. Переговоры о коалиции длятся месяцами. Это норма, не слабость.' },
  { title: 'Die großen deutschen Parteien', teaser: 'Sechs Parteien im Bundestag — und ihre Positionen', body: '<strong>CDU/CSU</strong>: konservativ-christlich. <strong>SPD</strong>: sozialdemokratisch. <strong>Grüne</strong>: ökologisch-liberal. <strong>FDP</strong>: wirtschaftsliberal. <strong>Linke</strong>: sozialistisch. <strong>AfD</strong>: rechtspopulistisch. Neueste: <strong>BSW</strong> (Sahra Wagenknecht Bündnis) — links-konservativ.', example: '🏛️ In Deutschland ist es normal, dass Koalitionspartner sehr unterschiedlich sind — Kompromiss ist Pflicht.\n<em>Parteimitgliedschaft: in Deutschland verbreitet — SPD hat 400.000, CDU 370.000 Mitglieder.</em>', translation: 'Главные партии: CDU/CSU (консерваторы), SPD (социал-демократы), Зелёные, FDP (либералы), Левые, AfD (правые популисты). Компромисс между ними — основа политики.' },
  { title: 'Soziale Marktwirtschaft', teaser: 'Weder reiner Kapitalismus noch Sozialismus — ein deutsches Modell', body: 'Die <strong>Soziale Marktwirtschaft</strong> (Ludwig Erhard, 1948) kombiniert freie Märkte mit sozialem Ausgleich. Starker Sozialstaat: Rente, Krankenversicherung, Arbeitslosengeld, Kindergeld. Gleichzeitig: Eigentumsfreiheit, Wettbewerb, keine Verstaatlichung.', example: '⚖️ Deutschland gibt ca. 25% des BIP für Sozialleistungen aus — EU-Spitze.\n<em>„Rheinischer Kapitalismus" nennen Wirtschaftswissenschaftler dieses Modell — Vorbild für viele EU-Staaten.</em>', translation: 'Социальная рыночная экономика — немецкая модель: свободный рынок плюс сильное социальное государство. Ни чистый капитализм, ни социализм — особый путь.' },
  { title: 'Föderalismus — 16 Länder mit echten Rechten', teaser: 'Bayern und Berlin können sehr unterschiedliche Gesetze haben', body: 'In Deutschland haben die Bundesländer eigene <strong>Gesetzgebungskompetenzen</strong>: Bildung, Polizei, Kultur, Medien. Deswegen: verschiedene Schulferien, unterschiedliche Feiertage, andere Schulformen. Das schützt gegen zentralistische Machtkonzentration — Lehre aus der NS-Zeit.', example: '📚 Bildung ist Ländersache: Bayern hat G8 (8 Jahre Gymnasium), andere Länder G9. Abitur in Bayern gilt als schwerer.\n<em>Schulferien 2025: Bayern endet am 8. August, Berlin erst am 22. August — selbes Land, anderer Rhythmus.</em>', translation: 'Федерализм: каждая из 16 земель имеет свои законы в образовании, полиции, культуре. Поэтому каникулы, праздники и правила везде разные — это защита от централизации.' },
  { title: 'Deutschland und die Europäische Union', teaser: 'Gründungsmitglied, größter Nettozahler, stärkste Stimme', body: 'Deutschland ist seit 1951 dabei (Europäische Gemeinschaft für Kohle und Stahl) und einer der wichtigsten EU-Treiber. Zahlt ca. 25 Milliarden Euro netto/Jahr in die EU. Der Euro wurde maßgeblich nach Vorbild der Deutschen Mark gestaltet.', example: '🇪🇺 EU-Institutionen: Europaparlament (Straßburg), EU-Kommission (Brüssel), Europäischer Rat (Brüssel).\n<em>Deutsche EU-Abgeordnete: 96 (die meisten aller Länder). Europawahl: alle 5 Jahre, auch mit 16 Jahren.</em>', translation: 'Германия — главный донор и движущая сила ЕС. Платит ~25 млрд€ в год в бюджет союза. Евро создавался по образцу немецкой марки.' },
  { title: 'Bundesverfassungsgericht — der stärkste Hüter', teaser: 'Karlsruhe entscheidet, was Recht ist — auch gegen Parlamente', body: 'Das <strong>Bundesverfassungsgericht</strong> (BVerfG) in Karlsruhe prüft, ob Gesetze dem Grundgesetz entsprechen. Es kann Gesetze des Bundestags für nichtig erklären. 16 Richter, je 8 vom Bundestag und Bundesrat gewählt, je 12 Jahre (keine Wiederwahl).', example: '⚖️ Berühmte Urteile: Volkszählung 1983 (Recht auf informationelle Selbstbestimmung), Rundfunkbeitrag (verfassungsgemäß), Klimaschutz (zu wenig — Gesetz nachgebessert).\n<em>Bürger können direkt Verfassungsbeschwerde einreichen — Deutschlands Besonderheit.</em>', translation: 'Федеральный конституционный суд в Карлсруэ может отменить любой закон парламента. Каждый гражданин вправе подать жалобу напрямую — уникальная черта немецкой системы.' },
];

// ── Kategorie-Pool für tägliche Rotation ──────────────────────────────────────
const KULTUR_KUNST = [
  { title: 'Das Pergamonmuseum — Weltkultur in Berlin', teaser: 'Eines der meistbesuchten Museen Europas — mitten in Berlin', body: 'Das <strong>Pergamonmuseum</strong> auf der Museumsinsel Berlin beherbergt den Pergamonaltar (180 v. Chr.), das Ischtar-Tor aus Babylon und die Markttor von Milet. Die Museumsinsel ist UNESCO-Weltkulturerbe und besteht aus 5 Museen. Bis 2037 wird das Pergamonmuseum schrittweise renoviert.', example: '🏛️ Museumsinsel Berlin: Pergamonmuseum, Bode-Museum, Alte Nationalgalerie, Neues Museum (Nofretete!), Altes Museum.\n<em>Eintrittskarte für alle 5 Museen: Tageskarte ca. 19€ — lohnt sich für den ganzen Tag.</em>', translation: 'Пергамский музей — один из главных музеев мира в сердце Берлина. Хранит античные и ближневосточные шедевры.', source: 'Staatliche Museen zu Berlin' },
  { title: 'Ludwig van Beethoven — Bonner Weltbürger', teaser: 'Geboren in Bonn, gestorben in Wien — Musik für die Welt', body: '<strong>Ludwig van Beethoven</strong> (1770–1827) wurde in Bonn geboren und ist einer der bedeutendsten Komponisten der Weltgeschichte. Er komponierte die 9. Sinfonie — mit dem Schlusschor „Ode an die Freude" — bereits vollständig taub. Das Beethovenhaus in Bonn ist heute Museum.', example: '🎵 Die 9. Sinfonie ist seit 2001 UNESCO-Weltdokumentenerbe. Ihre letzte Zeile: „Alle Menschen werden Brüder."\n<em>Bonn ist Beethovens Geburtsstadt — heute auch Sitz vieler UN-Organisationen.</em>', translation: 'Бетховен родился в Бонне. Он написал величайшие симфонии мира, будучи глухим. «Ода к радости» стала гимном Европы.', source: 'Beethoven-Haus Bonn' },
  { title: 'Das Schloss Neuschwanstein', teaser: 'Das Märchenschloss — Vorbild für Disneyland', body: '<strong>Neuschwanstein</strong> in Bayern (1869–1886) ließ König Ludwig II. bauen — als romantische Traumburg, nicht als Festung. Er lebte nur 172 Tage darin. Walt Disney ließ sich vom Schloss für das Cinderella Castle inspirieren. Heute: 1,4 Millionen Besucher pro Jahr.', example: '🏰 Lage: Schwangau bei Füssen, Bayern. Eintritt: 15€ Erwachsene. Tickets im Voraus buchen — Wartezeiten bis 4 Stunden ohne Reservierung.\n<em>Beste Aussicht vom Marienbrücke — 5 Minuten Fußweg vom Schloss.</em>', translation: 'Замок Нойшванштайн — «сказочный замок» Баварии. Вдохновил Диснея на создание замка Золушки. Один из самых фотографируемых объектов мира.', source: 'Bayerische Schlösserverwaltung' },
  { title: 'Das Deutsche Museum München', teaser: 'Größtes naturwissenschaftlich-technisches Museum der Welt', body: 'Das <strong>Deutsche Museum</strong> in München (gegründet 1903) hat 73.000 Exponate auf 79.000 m². Von der ersten Dampfmaschine bis zur Raumfahrt. U-Boot aus dem Zweiten Weltkrieg, echte Flugzeuge, Bergwerk zum Anfassen. Jährlich 1,5 Millionen Besucher.', example: '⚙️ Highlight: Originalstücke von Foucault-Pendel, erster BMW-Motor, Originalteile der V2-Rakete.\n<em>Für Kinder ab 6: Kinderreich — interaktive Ausstellung zum Anfassen und Ausprobieren.</em>', translation: 'Немецкий музей в Мюнхене — крупнейший в мире музей науки и техники. 73 000 экспонатов от паровозов до космических ракет.', source: 'Deutsches Museum München' },
  { title: 'Johann Sebastian Bach — Thüringens Geschenk an die Welt', teaser: 'Eisenach, 1685 — die Musik, die nie veraltet', body: '<strong>Johann Sebastian Bach</strong> wurde in Eisenach (Thüringen) geboren. Er arbeitete in Leipzig als Thomaskantor 27 Jahre lang. Bachs Werke — Matthäus-Passion, Brandenburgische Konzerte, Wohltemperiertes Klavier — gelten als Höhepunkt der Barockmusik und beeinflussen Musiker bis heute.', example: '🎹 Das Bach-Museum in Leipzig und das Bachhaus in Eisenach sind die wichtigsten Gedenkstätten.\n<em>Jeden Juni: Bachfest Leipzig — eine Woche Konzerte überall in der Stadt, viele kostenlos.</em>', translation: 'Иоганн Себастьян Бах — отец западной классической музыки. Родился в Эйзенахе, работал в Лейпциге. Его музыка звучит повсюду в Германии.', source: 'Bach-Archiv Leipzig' },
  { title: 'Die Dresdner Zwinger und Frauenkirche', teaser: 'Dresden — das Florenz an der Elbe', body: '<strong>Dresden</strong> war vor dem Zweiten Weltkrieg eine der schönsten Barockstädte Europas. Der <strong>Zwinger</strong> (1728) — barocker Palastkomplex mit Gemäldegalerie (Sixtinische Madonna von Raffael). Die <strong>Frauenkirche</strong> — 1945 zerstört, bis 2005 originalgetreu wiederaufgebaut — Symbol der Versöhnung.', example: '🎨 Gemäldegalerie Alte Meister: Raffaels Sixtinische Madonna, Vermeer, Rubens, Rembrandt — Weltklasse.\n<em>Dresden liegt 2 Stunden von Berlin mit dem ICE entfernt — idealer Tagesausflug.</em>', translation: 'Дрезден — «Флоренция на Эльбе». Цвингер и Фрауэнкирхе — символы немецкого барокко и послевоенного восстановления.', source: 'Staatliche Kunstsammlungen Dresden' },
  { title: 'Albrecht Dürer — der erste Künstler-Star Deutschlands', teaser: 'Nürnberg, 1471 — der deutsche Leonardo da Vinci', body: '<strong>Albrecht Dürer</strong> aus Nürnberg war Maler, Grafiker, Mathematiker und Kunsttheoretiker. Seine Werke — „Feldhase", „Betende Hände", „Selbstbildnis" — sind weltbekannt. Er war der erste Künstler, der konsequent Selbstporträts malte und sein Werk mit einem Monogramm signierte.', example: '🐇 Der „Feldhase" (1502) ist eines der bekanntesten Tierbilder der Kunstgeschichte — in der Albertina Wien.\n<em>Nürnberg: Dürer-Haus Museum + Kaiserburg — perfekte Kombination für einen Kulturtag.</em>', translation: 'Альбрехт Дюрер — «немецкий Леонардо». Первый художник-суперзвезда, автор «Зайца», «Молящихся рук» и знаменитых автопортретов.', source: 'Germanisches Nationalmuseum Nürnberg' },
  { title: 'Der Kölner Dom — 632 Jahre Bauzeit', teaser: 'Begonnen 1248, fertiggestellt 1880 — und noch immer in Arbeit', body: 'Der <strong>Kölner Dom</strong> ist die größte gotische Kathedrale Deutschlands und UNESCO-Weltkulturerbe. Bauzeit: 632 Jahre (mit langer Pause). Höhe: 157 m — war 4 Jahre lang das höchste Gebäude der Welt (1880–1884). Täglich 20.000 Besucher. Die Restaurierungsarbeiten enden nie — dafür gibt es eine eigene Dombauhütte.', example: '⛪ Schrein der Heiligen Drei Könige: Goldener Reliquienschrein (12. Jh.) — Pilgerort seit dem Mittelalter.\n<em>Turm besteigen: 533 Stufen, 97 m — Panoramablick über Köln. Eintritt: 6€.</em>', translation: 'Кёльнский собор — крупнейший готический собор Германии, строился 632 года. Объект ЮНЕСКО, 20 000 посетителей ежедневно.', source: 'Hohe Domkirche Köln' },
  { title: 'Die Wartburg — wo Luther die Bibel übersetzte', teaser: 'Eisenach, 1521 — zehn Monate, die Deutsch veränderten', body: 'Auf der <strong>Wartburg</strong> in Thüringen versteckte sich Martin Luther 1521–1522 nach dem Reichstag zu Worms. In nur 10 Wochen übersetzte er das Neue Testament ins Deutsche. Diese Übersetzung legte den Grundstein für die moderne deutsche Schriftsprache. Die Wartburg ist UNESCO-Weltkulturerbe.', example: '📖 Luther übersetzte nicht wörtlich: „Ich habe dem Volk aufs Maul geschaut" — er wollte, dass alle es verstehen.\n<em>Eisenach: Wartburg + Bachhaus + Lutherhaus — drei UNESCO-Stätten in einer Stadt.</em>', translation: 'Вартбург — замок, где Лютер за 10 недель перевёл Новый Завет. Этот перевод сформировал современный немецкий язык. Объект ЮНЕСКО.', source: 'Wartburg-Stiftung / UNESCO' },
  { title: 'Die Hamburger Kunsthalle und Caspar David Friedrich', teaser: 'Der romantischste Maler Deutschlands — und sein Jubiläum 2024', body: '<strong>Caspar David Friedrich</strong> (1774–1840) ist der bedeutendste Maler der deutschen Romantik. Sein berühmtestes Werk: „Der Wanderer über dem Nebelmeer" (1818). 2024 war sein 250. Geburtstag — mit großen Ausstellungen in Hamburg und Dresden. Die Hamburger Kunsthalle besitzt die weltweit größte Sammlung seiner Werke.', example: '🌫️ „Der Wanderer" zeigt einen Mann, der von hinten auf Nebel schaut — Symbol für Einsamkeit, Natur und innere Suche.\n<em>Hamburger Kunsthalle: eine der größten Kunstsammlungen Deutschlands — von Mittelalter bis Gegenwart.</em>', translation: 'Каспар Давид Фридрих — самый романтичный немецкий художник. «Странник над морем тумана» — икона немецкого романтизма XIX века.', source: 'Hamburger Kunsthalle' },
];

const KULTUR_CATEGORY_POOL = [
  { type:'sprichwort',   emoji:'📖', label:'Sprichwort',           arr: KULTUR_SPRICHWORT },
  { type:'redewendung',  emoji:'🎭', label:'Redewendung',          arr: KULTUR_REDEWENDUNG },
  { type:'wussten',      emoji:'🗺️', label:'Wussten Sie schon?',   arr: KULTUR_WUSSTEN },
  { type:'warum',        emoji:'🎯', label:'Warum Deutsch?',       arr: KULTUR_WARUM },
  { type:'landeskunde',  emoji:'🏛️', label:'Landeskunde',          arr: KULTUR_LANDESKUNDE },
  { type:'literatur',    emoji:'📚', label:'Literatur & Kunst',    arr: KULTUR_LITERATUR },
  { type:'gesundheit',   emoji:'🏥', label:'Gesundheit & Medizin', arr: KULTUR_GESUNDHEIT },
  { type:'buerokratie',  emoji:'📋', label:'Bürokratie & Alltag',  arr: KULTUR_BUEROKRATIE },
  { type:'finanzen',     emoji:'💳', label:'Finanzen & Wohnen',    arr: KULTUR_FINANZEN },
  { type:'politik',      emoji:'🏛️', label:'Staat & Politik',      arr: KULTUR_POLITIK },
  { type:'kunst',        emoji:'🎨', label:'Kunst & Sehenswürdigkeiten', arr: KULTUR_KUNST },
];

function buildGrammarWeekHTML(student) {
  if (!student.sprint?.grammarWeek) return '';
  const gw = student.sprint.grammarWeek;
  const typeColors = { verb: '#4A8C6E', refl: '#4A8C6E', prep: '#7C3AED', T: '#D97706', K: '#DC2626', M: '#0369A1', Lo: '#0369A1' };
  const typeBg    = { verb: '#EDF7F1', refl: '#EDF7F1', prep: '#EDE9FE', T: '#FEF3C7', K: '#FEE2E2', M: '#E0F2FE', Lo: '#E0F2FE' };
  const mkSentence = (parts) => parts.map(p => {
    if (p.type === 'plain') return `<span>${p.text}</span>`;
    const col = typeColors[p.type] || '#333';
    const bg  = typeBg[p.type] || 'transparent';
    const italic = p.type === 'refl' ? 'font-style:italic;' : '';
    return `<span style="color:${col};background:${bg};border-radius:4px;padding:1px 5px;font-weight:700;${italic}">${p.text}</span>`;
  }).join('');
  const tekamoloLegend = `<span style="color:${typeColors.T};font-weight:700">Te</span><span style="color:#718096">·</span><span style="color:#DC2626;font-weight:700">Ka</span><span style="color:#718096">·</span><span style="color:${typeColors.M};font-weight:700">Mo</span><span style="color:#718096">·</span><span style="color:${typeColors.Lo};font-weight:700">Lo</span>`;
  return `
    <div class="grammar-queen-banner">
      <div class="grammar-queen-top-row">
        <div>
          <div class="grammar-queen-label">Грамматика недели</div>
          <div class="grammar-queen-title">${gw.queen}</div>
        </div>
        <button class="grammar-infographic-btn" onclick="openInfographic()">📊 Схема</button>
      </div>
      <div class="grammar-queen-sentence">${mkSentence(gw.sentence || [])}</div>
      ${gw.sentenceNote ? `<div class="grammar-queen-note">${gw.sentenceNote}</div>` : ''}
      ${gw.sentenceNote2 ? `<div class="grammar-queen-note2">${gw.sentenceNote2}</div>` : ''}
      ${gw.sentence2 ? `
      <div class="grammar-queen-divider"></div>
      <div class="grammar-queen-teka-label">${tekamoloLegend}</div>
      <div class="grammar-queen-sentence">${mkSentence(gw.sentence2)}</div>` : ''}
    </div>
    <div class="infographic-modal" id="infographic-modal" onclick="closeInfographic()">
      <div class="infographic-modal-inner" onclick="event.stopPropagation()">
        <button class="infographic-close" onclick="closeInfographic()">×</button>
        ${gw.infographic
          ? `<img src="${gw.infographic}" class="infographic-img" alt="Infografik">`
          : `<div class="infographic-upload-zone">
              <div class="infographic-upload-icon">📊</div>
              <div class="infographic-upload-text">Выберите картинку для схемы</div>
              <label class="infographic-upload-btn">
                Открыть файл
                <input type="file" accept="image/*" style="display:none" onchange="previewInfographic(this)">
              </label>
              <img id="infographic-preview" class="infographic-img" style="display:none">
            </div>`
        }
      </div>
    </div>`;
}

function renderGrammarScreen() {
  const el = document.getElementById('grammar-content');
  if (!el) return;
  const id = getStudentId();
  const student = STUDENTS[id];
  if (!student) return;

  // Если у студента есть шаблон уровня — показываем модули из levels.js
  if (student.template && typeof LEVELS !== 'undefined' && LEVELS[student.template]) {
    renderGrammarModules(el, id, student);
    return;
  }

  // Старый режим — для студентов без шаблона
  let grammarSelf = {};
  try { grammarSelf = JSON.parse(localStorage.getItem('pgc_grammar_' + id) || '{}'); } catch {}

  const ordered = [
    ...student.grammar.filter(g => g.status === 'done'),
    ...student.grammar.filter(g => g.status === 'current'),
    ...student.grammar.filter(g => g.status === 'upcoming'),
  ];

  const doneCount = ordered.filter(g => g.status === 'done').length;
  const dotMap   = { done: '✓', current: '▶', upcoming: '○' };
  const labelMap = { done: 'Gelernt', current: 'Jetzt', upcoming: 'Kommt' };

  const rows = ordered.map((g, i) => {
    const self       = grammarSelf['path-' + i] || null;
    const hasContent = !!(g.summary || g.warum);
    const isOpen     = g.status === 'current' && hasContent;
    const isLast     = i === ordered.length - 1;
    const warum   = g.warum   ? '<div class="grammar-warum">💡 ' + g.warum + '</div>' : '';
    const summary = g.summary ? '<div class="grammar-summary">' + g.summary + '</div>' : '';
    const example = g.example ? '<div class="grammar-example">' + g.example.replace(/\n/g,'<br>') + '</div>' : '';
    const selfRow = (hasContent && g.status !== 'upcoming')
      ? '<div class="grammar-self-row">'
        + '<div class="grammar-self-btn' + (self==='ueben'?' active-ueben':'') + '" data-self="ueben" data-selfidx="' + i + '">🔄 Ich übe noch</div>'
        + '<div class="grammar-self-btn' + (self==='verstanden'?' active-ok':'') + '" data-self="verstanden" data-selfidx="' + i + '">✓ Verstanden</div>'
        + '</div>'
      : '';
    return '<div class="gpath-node ' + g.status + '">'
      + '<div class="gpath-row' + (hasContent ? ' clickable' : '') + '" data-idx="' + i + '">'
        + '<div class="gpath-dot ' + g.status + '">' + dotMap[g.status] + '</div>'
        + '<div class="gpath-info">'
          + '<div class="gpath-label">' + labelMap[g.status] + '</div>'
          + '<div class="gpath-topic">' + g.topic + '</div>'
          + '<div class="gpath-level">Niveau ' + g.level + '</div>'
        + '</div>'
        + (hasContent ? '<div class="gpath-arrow" id="gpa-' + i + '">⌄</div>' : '')
      + '</div>'
      + '<div class="gpath-body' + (isOpen ? ' visible' : '') + '" id="gpb-' + i + '">'
        + warum + summary + example + selfRow
      + '</div>'
      + (!isLast ? '<div class="gpath-connector"></div>' : '')
      + '</div>';
  }).join('');

  el.innerHTML = buildGrammarWeekHTML(student)
    + '<div class="gpath-header-block">'
    + '<div class="gpath-title">Ihr Grammatikweg</div>'
    + '<div class="gpath-progress">' + doneCount + ' von ' + ordered.length + ' Themen abgeschlossen</div>'
    + '</div>'
    + '<div class="gpath-container" id="gpath-container">' + rows + '</div>';

  const container = document.getElementById('gpath-container');
  if (container) {
    container.addEventListener('click', function(e) {
      const row = e.target.closest('.gpath-row.clickable');
      if (row) { toggleGrammarPath(parseInt(row.dataset.idx, 10)); return; }
      const selfBtn = e.target.closest('[data-self]');
      if (selfBtn) toggleGrammarSelf('path-' + selfBtn.dataset.selfidx, selfBtn.dataset.self);
    });
  }
}

// ── Рендер модулей из levels.js (3 статуса: серый / оранжевый / зелёный) ──
function renderGrammarModules(el, id, student) {
  const level    = LEVELS[student.template];
  const modules  = level.module;
  const storeKey = 'pgc_mod_' + id;
  let modState   = {};
  try { modState = JSON.parse(localStorage.getItem(storeKey) || '{}'); } catch {}

  // Статус → классы и иконки
  function stateClass(s) { return s === 'automatisiert' ? 'mod-green' : s === 'bekannt' ? 'mod-orange' : 'mod-grey'; }
  function stateIcon(s)  { return s === 'automatisiert' ? '●' : s === 'bekannt' ? '●' : '○'; }

  const greenCount = modules.filter(m => modState['m' + m.nr] === 'automatisiert').length;
  const curMod     = student.currentModule || 0;

  const html = modules.map(m => {
    const mKey   = 'm' + m.nr;
    const mState = modState[mKey] || null;
    const isCur  = m.nr === curMod;
    const isOpen = isCur; // текущий модуль открыт по умолчанию

    // Подпункты — уроки
    const lessonRows = (m.lektionen || []).map(l => {
      const lKey   = 'l' + m.nr + '_' + l.nr;
      const lState = modState[lKey] || null;
      return '<div class="mod-lesson">'
        + '<span class="mod-dot ' + stateClass(lState) + '" data-key="' + lKey + '" data-store="' + storeKey + '" title="Tippen zum Ändern">' + stateIcon(lState) + '</span>'
        + '<span class="mod-lesson-title">L' + l.nr + '. ' + l.titel + '</span>'
        + '</div>';
    }).join('');

    return '<div class="mod-card' + (isCur ? ' mod-current' : '') + '" id="modc-' + m.nr + '">'
      + '<div class="mod-header" data-mod="' + m.nr + '">'
        + '<span class="mod-dot mod-dot-main ' + stateClass(mState) + '" data-key="' + mKey + '" data-store="' + storeKey + '" title="Tippen: grau → orange → grün">' + stateIcon(mState) + '</span>'
        + '<div class="mod-header-text">'
          + '<div class="mod-nr">' + (isCur ? '▶ Jetzt · ' : '') + 'Modul ' + m.nr + '</div>'
          + '<div class="mod-title">' + m.titel + '</div>'
        + '</div>'
        + '<span class="mod-arrow" id="moda-' + m.nr + '">' + (isOpen ? '⌃' : '⌄') + '</span>'
      + '</div>'
      + '<div class="mod-body' + (isOpen ? ' visible' : '') + '" id="modb-' + m.nr + '">'
        + '<div class="mod-ziel">' + m.ziel + '</div>'
        + (m.infografik ? '<a href="' + m.infografik + '" target="_blank" class="mod-infografik-btn">📊 Infografik öffnen</a>' : '')
        + lessonRows
      + '</div>'
      + '</div>';
  }).join('');

  el.innerHTML = buildGrammarWeekHTML(student)
    + '<div class="gpath-header-block">'
    + '<div class="gpath-title">Grammatikprogramm · ' + level.name + '</div>'
    + '<div class="gpath-progress">'
      + '<span class="mod-legend"><span class="mod-dot mod-green">●</span> automatisiert</span>'
      + '<span class="mod-legend"><span class="mod-dot mod-orange">●</span> bekannt</span>'
      + '<span class="mod-legend"><span class="mod-dot mod-grey">○</span> noch nicht</span>'
    + '</div>'
    + '<div class="mod-stats">' + greenCount + ' von ' + modules.length + ' Modulen automatisiert</div>'
    + '</div>'
    + '<div id="mod-container">' + html + '</div>';

  // Обработчики событий
  document.getElementById('mod-container').addEventListener('click', function(e) {
    // Клик по кружку — сменить статус
    const dot = e.target.closest('.mod-dot[data-key]');
    if (dot) {
      e.stopPropagation();
      const key      = dot.dataset.key;
      const store    = dot.dataset.store;
      let state      = {};
      try { state = JSON.parse(localStorage.getItem(store) || '{}'); } catch {}
      const cur      = state[key] || null;
      const next     = cur === null ? 'bekannt' : cur === 'bekannt' ? 'automatisiert' : null;
      if (next === null) delete state[key]; else state[key] = next;
      localStorage.setItem(store, JSON.stringify(state));
      if (tg) tg.HapticFeedback.impactOccurred('light');
      // Запоминаем открытые модули перед перерендером
      const openMods = new Set();
      document.querySelectorAll('.mod-body.visible').forEach(b => openMods.add(b.id));
      renderGrammarModules(el, id, student);
      // Восстанавливаем открытые модули
      openMods.forEach(bid => {
        const b = document.getElementById(bid);
        const nr = bid.replace('modb-', '');
        const a = document.getElementById('moda-' + nr);
        if (b) { b.classList.add('visible'); if (a) a.textContent = '⌃'; }
      });
      return;
    }
    // Клик по заголовку модуля — открыть/закрыть
    const header = e.target.closest('.mod-header');
    if (header) {
      const nr   = header.dataset.mod;
      const body = document.getElementById('modb-' + nr);
      const arr  = document.getElementById('moda-' + nr);
      if (body) {
        const open = body.classList.toggle('visible');
        if (arr) arr.textContent = open ? '⌃' : '⌄';
      }
    }
  });
}

// ── Lexik ─────────────────────────────────────────────────────────────────
const LEXIK_BLOCKS = [
  {
    key:      'bank',
    icon:     '🗃️',
    title:    'Wortschatzbank',
    sub:      'Alle gesammelten Wörter — alles bisher Gelernte an einem Ort',
    cls:      'lexik-block--bank',
    btnLabel: '📂 Öffnen',
  },
  {
    key:      'aktuell',
    icon:     '⚡',
    title:    'Aktuell',
    sub:      'Was wir gerade üben — neue Wörter und Redemittel aus den letzten Stunden',
    cls:      'lexik-block--aktuell',
    btnLabel: '⚡ Zum Deck',
  },
  {
    key:      'niveau',
    icon:     '🎯',
    title:    'C1-Niveau',
    sub:      'Alles was Sie auf C1 beherrschen sollten — Redemittel, Sätze, Karten, alles gemischt',
    cls:      'lexik-block--niveau',
    btnLabel: '🎯 Öffnen',
  },
];

function renderLexikScreen(student) {
  const el = document.getElementById('lexik-content');
  if (!el) return;

  const lexik = student?.lexik || {};

  el.innerHTML = '<div class="lexik-blocks">' +
    LEXIK_BLOCKS.map(b => {
      const link = lexik[b.key];
      return `
      <div class="lexik-block ${b.cls}">
        <div class="lexik-block-top">
          <span class="lexik-block-icon">${b.icon}</span>
          <span class="lexik-block-title">${b.title}</span>
        </div>
        <div class="lexik-block-sub">${b.sub}</div>
        ${link
          ? `<a href="${link}" target="_blank" class="lexik-block-btn">${b.btnLabel}</a>`
          : '<div class="lexik-block-soon">Ссылка появится здесь</div>'}
      </div>`;
    }).join('') +
  '</div>';
}

const METHODIK_SKILLS = [
  { key: 'lesen',     label: 'Lesen',     icon: '📖' },
  { key: 'hoeren',    label: 'Hören',     icon: '🎧' },
  { key: 'schreiben', label: 'Schreiben', icon: '✍️' },
  { key: 'sprechen',  label: 'Sprechen',  icon: '🗣️' },
];

function renderFeedbackArchiveSection() {
  const el = document.getElementById('feedback-archive-section');
  if (!el) return;

  const entries = _feedbackArchive
    ? Object.entries(_feedbackArchive).sort(([a],[b]) => b.localeCompare(a))
    : [];

  if (!entries.length) return; // ничего нет — блок скрыт

  const items = entries.map(([date, fb], i) => {
    const d = new Date(fb.sentAt || date);
    const dateLabel = isNaN(d) ? date : d.toLocaleDateString('de-DE', {day:'numeric', month:'long', year:'numeric'});
    const preview = (fb.text || '').slice(0, 70).replace(/\n/g,' ') + ((fb.text||'').length > 70 ? '…' : '');
    const fullText = (fb.text || '').replace(/</g,'&lt;').replace(/\n/g,'<br>');
    return `
      <div class="fb-archive-item">
        <button class="fb-archive-toggle" onclick="toggleFortschrittArchive(${i})">
          <div class="fb-archive-toggle-left">
            <div class="fb-archive-date">${dateLabel}</div>
            <div class="fb-archive-preview">${preview.replace(/</g,'&lt;')}</div>
          </div>
          <div class="fb-archive-arrow" id="fpa-arrow-${i}">⌄</div>
        </button>
        <div class="fb-archive-body" id="fpa-body-${i}">
          <div class="fb-archive-text">${fullText}</div>
        </div>
      </div>`;
  }).join('');

  el.innerHTML = `
    <div class="progress-section-title" style="margin-top:24px">Kommentare der Lehrerin</div>
    <div class="fb-archive" style="margin-bottom:20px">${items}</div>`;
}

function toggleFortschrittArchive(i) {
  const body = document.getElementById('fpa-body-' + i);
  const arrow = document.getElementById('fpa-arrow-' + i);
  if (!body) return;
  const open = body.classList.toggle('visible');
  if (arrow) arrow.textContent = open ? '⌃' : '⌄';
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function renderKulturScreen(student) {
  const el = document.getElementById('kultur-content');
  if (!el) return;

  // ── Methodik ──────────────────────────────────────────────
  const methodik = student?.methodik || {};
  const methodikHTML = METHODIK_SKILLS.map((s, i) => {
    const content = methodik[s.key];
    const bodyHTML = content
      ? `${Array.isArray(content.tipps)
          ? content.tipps.map(t => `<div class="bib-tip">• ${t}</div>`).join('')
          : `<div class="bib-tip">${content}</div>`
        }${content.link ? `<a href="${content.link}" target="_blank" class="bib-link-btn">🔗 Material öffnen</a>` : ''}`
      : `<div class="bib-placeholder">Wird von Ihrer Lehrerin ergänzt.</div>`;
    return `
    <div class="bib-skill-card" id="bms-${i}">
      <button class="bib-skill-toggle" onclick="toggleBibMethodik(${i})">
        <span class="bib-skill-icon">${s.icon}</span>
        <span class="bib-skill-label">${s.label}</span>
        <span class="bib-skill-arrow" id="bma-${i}">⌄</span>
      </button>
      <div class="bib-skill-body" id="bmb-${i}">${bodyHTML}</div>
    </div>`;
  }).join('');

  // ── Prüfungskriterien ─────────────────────────────────────
  const pruefung = student?.pruefung || [];
  const PRUEF_SKILLS = [
    { key: 'lesen',     label: 'Lesen',     icon: '📄' },
    { key: 'hoeren',    label: 'Hören',     icon: '🔊' },
    { key: 'schreiben', label: 'Schreiben', icon: '🖊️' },
    { key: 'sprechen',  label: 'Sprechen',  icon: '🎤' },
  ];
  const pruefungHTML = PRUEF_SKILLS.map((s, i) => {
    const content = pruefung[s.key];
    const bodyHTML = content
      ? `${Array.isArray(content.kriterien)
          ? content.kriterien.map(k => `<div class="pruef-kriterium">• ${k}</div>`).join('')
          : `<div class="pruef-kriterium">${content}</div>`
        }${content.link ? `<a href="${content.link}" target="_blank" class="bib-link-btn">📋 Öffnen</a>` : ''}`
      : `<div class="bib-placeholder">Wird von Ihrer Lehrerin ergänzt.</div>`;
    return `
    <div class="pruef-card" id="prs-${i}">
      <button class="pruef-toggle" onclick="togglePruefung(${i})">
        <span class="pruef-icon">${s.icon}</span>
        <span class="pruef-label">${s.label}</span>
        <span class="pruef-arrow" id="pra-${i}">⌄</span>
      </button>
      <div class="pruef-body" id="prb-${i}">${bodyHTML}</div>
    </div>`;
  }).join('');

  // ── Bücher ────────────────────────────────────────────────
  const book = student?.book;
  const buecherHTML = book
    ? `<div class="bib-book-card">
        <div class="bib-book-emoji">📚</div>
        <div class="bib-book-info">
          <div class="bib-book-title">${book.title}</div>
          <div class="bib-book-author">${book.author}</div>
          ${book.note ? `<div class="bib-book-note">${book.note}</div>` : ''}
          ${book.link ? `<a href="${book.link}" target="_blank" class="bib-link-btn" style="margin-top:10px">📖 Öffnen</a>` : ''}
        </div>
      </div>`
    : `<div class="bib-empty-card"><div class="bib-empty-icon">📚</div><div class="bib-empty-text">Noch kein Buch zugewiesen.</div></div>`;

  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
  const days = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
  const months = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  const now = new Date();
  const dateStr = `${days[now.getDay()]}, ${now.getDate()}. ${months[now.getMonth()]}`;

  // Wort des Tages — nach Studentenlevel filtern
  const levelOrder = ['A1','A2','B1','B2','C1','C2'];
  const studentLvl = levelOrder.indexOf(_studentLevel) >= 0 ? _studentLevel : 'B1';
  const levelIdx = levelOrder.indexOf(studentLvl);
  const wordsForLevel = KULTUR_WORT.filter(w => {
    const wLvl = levelOrder.indexOf(w.level || 'B1');
    return wLvl <= levelIdx + 1; // показываем свой уровень и один выше
  });
  const wortPool = wordsForLevel.length ? wordsForLevel : KULTUR_WORT;
  const wort = wortPool[dayOfYear % wortPool.length];

  // 4 Kategorien aus dem Pool — deterministisch per Tag rotiert
  const pool = [...KULTUR_CATEGORY_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = (dayOfYear * 17 + i * 31) % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const todayCategories = pool.slice(0, 4);

  const cards = [
    { type:'wort', emoji:'🔤', label:'Wort des Tages', data: wort, open: true },
    ...todayCategories.map(cat => ({
      type: cat.type,
      emoji: cat.emoji,
      label: cat.label,
      data: cat.arr[dayOfYear % cat.arr.length],
      open: false,
    })),
  ];

  el.innerHTML = `
    <div class="bib-section">
      <div class="bib-section-title">📚 Methodik</div>
      ${methodikHTML}
    </div>
    <div class="bib-section bib-section--pruef">
      <div class="bib-section-title">Prüfungskriterien 📋</div>
      ${pruefungHTML}
    </div>
    <div class="bib-section">
      <div class="bib-section-title">📖 Bücher</div>
      ${buecherHTML}
    </div>
    <div class="bib-section">
      <div class="bib-section-title">🌍 Tägliches Deutsch</div>
      <div class="kultur-header">
      <div class="kultur-header-top">
        <div class="kultur-day-label">Ihr tägliches Stück Deutschland</div>
        <div class="kultur-day-badge">${dateStr}</div>
      </div>
      <div class="kultur-headline">Was Deutschland ausmacht 🇩🇪</div>
      <div class="kultur-sub">Sprache, Kultur, Mentalität — jeden Tag ein bisschen tiefer.</div>
    </div>
    ${cards.map((c, i) => `
    <div class="kultur-card kultur-card-${c.type}${c.open ? ' open' : ''}" id="kc-${i}">
      <button class="kultur-toggle" onclick="toggleKultur(${i})">
        <div class="kultur-emoji">${c.emoji}</div>
        <div class="kultur-toggle-text">
          <div class="kultur-type">${c.label}</div>
          <div class="kultur-title">${c.data.title}</div>
          <div class="kultur-teaser">${c.data.teaser}</div>
        </div>
        <div class="kultur-arrow">⌄</div>
      </button>
      <div class="kultur-body${c.open ? ' visible' : ''}" id="kb-${i}">
        <div class="kultur-body-text">${c.data.body}</div>
        ${c.data.example ? `<div class="kultur-body-example">${c.data.example.replace(/\n/g,'<br>')}</div>` : ''}
        ${c.data.translation && levelIdx <= 3 ? `
        <button class="kultur-translate-btn" onclick="toggleTranslation(${i})" id="ktb-${i}">
          🇷🇺 Перевод
        </button>
        <div class="kultur-translation" id="kt-${i}">
          ${c.data.translation}
        </div>` : ''}
        ${c.data.source ? `<div class="kultur-source">Quelle: ${c.data.source}</div>` : ''}
      </div>
    </div>`).join('')}
    <div style="height:16px"></div>
    </div>
  `;
}

function toggleKultur(i) {
  const card = document.getElementById('kc-' + i);
  const body = document.getElementById('kb-' + i);
  if (!card || !body) return;
  const open = body.classList.toggle('visible');
  card.classList.toggle('open', open);
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function togglePruefung(i) {
  const body = document.getElementById('prb-' + i);
  const arrow = document.getElementById('pra-' + i);
  if (!body) return;
  const open = body.classList.toggle('visible');
  if (arrow) arrow.textContent = open ? '⌃' : '⌄';
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function toggleBibMethodik(i) {
  const body = document.getElementById('bmb-' + i);
  const arrow = document.getElementById('bma-' + i);
  if (!body) return;
  const open = body.classList.toggle('visible');
  if (arrow) arrow.textContent = open ? '⌃' : '⌄';
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function toggleTranslation(i) {
  const btn = document.getElementById('ktb-' + i);
  const box = document.getElementById('kt-' + i);
  if (!btn || !box) return;
  const show = box.classList.toggle('visible');
  btn.classList.toggle('active', show);
  btn.textContent = show ? '🇷🇺 Перевод скрыть' : '🇷🇺 Перевод';
}

function showTab(tab) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('screen-' + tab)?.classList.add('active');
  document.getElementById('tab-' + tab)?.classList.add('active');
  window.scrollTo(0, 0);
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
  if (tab === 'progress') {
    const list = document.getElementById('audio-journey-list');
    if (list && list.querySelector('.audio-journey-loading')) loadAudioJourney();
  }
}

function toggleGrammar(id) {
  const btn = document.querySelector(`#gc-${id} .grammar-toggle`);
  const body = document.getElementById('gb-' + id);
  if (!body) return;
  const open = body.classList.toggle('visible');
  btn?.classList.toggle('open', open);
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function toggleGrammarPath(i) {
  document.title = 'CLICK:' + i;
  const body = document.getElementById('gpb-' + i);
  if (!body) { document.title = 'NO-BODY:' + i; return; }
  const open = body.classList.toggle('visible');
  document.title = 'OK:' + i + ':' + open;
  const arrow = document.getElementById('gpa-' + i);
  if (arrow) arrow.style.transform = open ? 'rotate(180deg)' : '';
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function toggleGrammarSelf(cardId, state) {
  const sid = getStudentId();
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('pgc_grammar_' + sid) || '{}'); } catch {}
  saved[cardId] = saved[cardId] === state ? null : state;
  localStorage.setItem('pgc_grammar_' + sid, JSON.stringify(saved));
  if (typeof fbSetPublic === 'function') {
    fbSetPublic(`progress/${sid}/grammar`, saved).catch(() => {});
  }

  // DOM: update both buttons in this card's row
  const body = document.getElementById('gb-' + cardId);
  if (!body) return;
  const btns = body.querySelectorAll('.grammar-self-btn');
  btns[0]?.classList.toggle('active-ueben',  saved[cardId] === 'ueben');
  btns[1]?.classList.toggle('active-ok',      saved[cardId] === 'verstanden');
  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

function switchSpeakLevel(n) {
  [1,2,3].forEach(i => {
    const content = document.getElementById('level-content-' + i);
    const btn = document.getElementById('lbtn-' + i);
    if (content) content.style.display = i === n ? 'block' : 'none';
    if (btn) btn.classList.toggle('level-btn--active', i === n);
  });
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function toggleWriteMode(level) {
  const ta = document.getElementById('submit-text-' + level);
  const btn = event.target;
  if (!ta) return;
  const show = ta.style.display === 'none';
  ta.style.display = show ? 'block' : 'none';
  btn.textContent = show ? '✍️ Schreiben schließen' : '✍️ Lieber schreiben';
  if (show) ta.focus();
}

function toggleMilestones() {
  const body = document.getElementById('milestones-body');
  const arrow = document.getElementById('goal-toggle-arrow');
  if (!body) return;
  const open = body.style.display === 'none' || body.style.display === '';
  body.style.display = open ? 'block' : 'none';
  if (arrow) arrow.style.transform = open ? 'rotate(-90deg)' : '';
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function toggleGoalTask() {
  const body = document.getElementById('goal-star-body-task');
  const arrow = document.getElementById('goal-star-arrow-task');
  if (!body) return;
  const open = body.style.display === 'none' || body.style.display === '';
  body.style.display = open ? 'block' : 'none';
  if (arrow) arrow.style.transform = open ? 'rotate(-90deg)' : '';
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function toggleDiary() {
  const body = document.getElementById('diary-body');
  const arrow = document.getElementById('diary-toggle-arrow');
  if (!body) return;
  const open = body.classList.toggle('visible');
  if (arrow) arrow.textContent = open ? '⌃' : '⌄';
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function toggleWordsAccordion() {
  const body = document.getElementById('words-accordion-body');
  const arrow = document.getElementById('words-toggle-arrow');
  if (!body) return;
  const open = body.classList.toggle('visible');
  if (arrow) arrow.textContent = open ? '⌃' : '⌄';
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function toggleReview() {
  const btn = document.getElementById('review-toggle');
  const body = document.getElementById('review-body');
  const open = body.classList.toggle('visible');
  btn.classList.toggle('open', open);
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function toggleOptional(id) {
  const btn = document.getElementById(id + '-toggle');
  const body = document.getElementById(id + '-body');
  const open = body.classList.toggle('visible');
  btn.classList.toggle('open', open);
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function toggleHint() {
  const btn = document.getElementById('hint-toggle');
  const body = document.getElementById('hint-body');
  const open = body.classList.toggle('visible');
  btn.classList.toggle('open', open);
  btn.textContent = open ? '💡 Tipp ausblenden' : '💡 Tipp — wenn es gar nicht klappt';
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function toggleCriterion(skillIdx, criterionIdx) {
  const id = getStudentId();
  const student = STUDENTS[id];
  if (!student) return;
  const skill = student.skills[skillIdx];
  const c = skill.criteria[criterionIdx];
  c.done = !c.done;

  // In localStorage speichern
  const saved = loadProgress(id);
  if (!saved[skillIdx]) saved[skillIdx] = {};
  saved[skillIdx][criterionIdx] = c.done;
  saveProgress(id, saved);

  // DOM aktualisieren (ohne re-render)
  const item = document.getElementById('crit-' + skillIdx + '-' + criterionIdx);
  if (item) {
    item.classList.toggle('done', c.done);
    item.querySelector('.criterion-dot').textContent = c.done ? '✓' : '○';
  }

  // Balken aktualisieren
  const doneCnt = skill.criteria.filter(c => c.done).length;
  const totalCnt = skill.criteria.length;
  const pct = totalCnt > 0 ? Math.round(doneCnt / totalCnt * 100) : 0;
  const card = document.getElementById('sk-card-' + skillIdx);
  if (card) {
    const fill = card.querySelector('.skill-bar-fill');
    const pctLabel = card.querySelector('.skill-pct');
    const goalLabel = card.querySelector('.skill-goal-label');
    if (fill) fill.style.width = pct + '%';
    if (pctLabel) pctLabel.textContent = (skillIdx >= 4)
      ? doneCnt + ' von ' + totalCnt + ' Themen ✓'
      : doneCnt + ' von ' + totalCnt + ' Kriterien ✓';
    if (goalLabel) goalLabel.textContent = (skillIdx >= 4)
      ? pct + '% aufgebaut'
      : pct + '% zum Ziel';
  }

  if (pct === 100) {
    fireCometCannon();
    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
  } else {
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
  }
}

// ── Lücken-Log ────────────────────────────────────────────────────────────
function loadGaps(studentId) {
  try { return JSON.parse(localStorage.getItem('pgc_gaps_' + studentId) || '[]'); }
  catch { return []; }
}
function saveGaps(studentId, gaps) {
  localStorage.setItem('pgc_gaps_' + studentId, JSON.stringify(gaps));
  if (typeof fbSetPublic === 'function') {
    fbSetPublic(`progress/${studentId}/gaps`, gaps).catch(() => {});
  }
}
function loadGapStatus(studentId) {
  try { return JSON.parse(localStorage.getItem('pgc_gap_st_' + studentId) || '{}'); }
  catch { return {}; }
}
function saveGapStatus(studentId, data) {
  localStorage.setItem('pgc_gap_st_' + studentId, JSON.stringify(data));
  if (typeof fbSetPublic === 'function') {
    fbSetPublic(`progress/${studentId}/gapStatus`, data).catch(() => {});
  }
}

function renderGapsScreen() {
  const id = getStudentId();
  const student = STUDENTS[id];
  const container = document.getElementById('gaps-content');
  if (!student || !container) return;

  const statusOverrides = loadGapStatus(id);
  const userGaps = loadGaps(id);

  // Teacher gaps
  const teacherGaps = student.gaps.map((g, i) => ({
    ...g, _idx: i,
    status: statusOverrides[i] !== undefined ? statusOverrides[i] : g.status
  }));

  // Student gaps
  const studentGaps = userGaps.map((g, i) => {
    const idx = student.gaps.length + i;
    return { ...g, _idx: idx, status: statusOverrides[idx] !== undefined ? statusOverrides[idx] : g.status };
  });

  const statusIcon = s => s === 'sos' ? '🚨' : s === 'aktiv' ? '🔄' : '✅';
  const statusLabel = s => s === 'sos' ? 'Jetzt lösen' : s === 'aktiv' ? 'In Arbeit' : 'Gelöst';

  const card = g => `
    <div class="gap-card ${g.status}" id="gap-card-${g._idx}" onclick="toggleGapStatus(${g._idx})">
      <div class="gap-card-top">
        <div class="gap-badges">
          ${g.level && g.level !== '—' ? `<span class="gap-level">${g.level}</span>` : ''}
          <span class="gap-category">${g.category}</span>
        </div>
        <div class="gap-status-icon" title="${statusLabel(g.status)}">${statusIcon(g.status)}</div>
      </div>
      <div class="gap-text">${g.text}</div>
      <div class="gap-meta">${g.date}</div>
    </div>`;

  const teacherActive  = teacherGaps.filter(g => g.status !== 'geloest');
  const teacherGeloest = teacherGaps.filter(g => g.status === 'geloest');
  const studentActive  = studentGaps.filter(g => g.status !== 'geloest');
  const studentGeloest = studentGaps.filter(g => g.status === 'geloest');
  const allGeloest     = [...teacherGeloest, ...studentGeloest];

  container.innerHTML = `
    <div class="gaps-who-section">
      <div class="gaps-who-header">
        <span class="gaps-who-icon">👩‍🏫</span>
        <span class="gaps-who-title">Von Ihrer Lehrerin</span>
      </div>
      ${teacherActive.length
        ? teacherActive.map(card).join('')
        : '<div class="gaps-empty-small">Noch keine offenen Punkte von der Lehrerin.</div>'}
    </div>

    <div class="gaps-who-section student">
      <div class="gaps-who-header">
        <span class="gaps-who-icon">👤</span>
        <span class="gaps-who-title">Meine Beobachtungen</span>
      </div>
      ${studentActive.length
        ? studentActive.map(card).join('')
        : '<div class="gaps-empty-small">Sie können jederzeit etwas eintragen — was im Gespräch gefehlt hat, was unklar war.</div>'}
      <button class="add-gap-btn" id="add-gap-btn" onclick="toggleAddGapForm()">+ Was habe ich bemerkt?</button>
      <div class="add-gap-form" id="add-gap-form">
        <label class="add-gap-label">Was ist aufgefallen?</label>
        <textarea class="add-gap-textarea" id="gap-textarea" placeholder="Zum Beispiel: Ich wusste nicht wie man «anrufen» im Nebensatz benutzt. Oder: Das Wort fehlte mir beim Gespräch mit der Kollegin."></textarea>
        <select class="add-gap-select" id="gap-category">
          <option value="Grammatik">Grammatik</option>
          <option value="Wortschatz">Wortschatz</option>
          <option value="Sprechen">Sprechen</option>
          <option value="Schreiben">Schreiben</option>
          <option value="Anderes">Anderes</option>
        </select>
        <button class="add-gap-submit" onclick="submitGap()">Eintragen</button>
      </div>
    </div>

    ${allGeloest.length ? `
    <div class="gaps-who-section geloest">
      <div class="gaps-who-header">
        <span class="gaps-who-icon">✅</span>
        <span class="gaps-who-title">Gelöst</span>
      </div>
      ${allGeloest.map(card).join('')}
    </div>` : ''}
  `;
}

function toggleGapStatus(gapIdx) {
  const id = getStudentId();
  const student = STUDENTS[id];
  if (!student) return;

  const overrides = loadGapStatus(id);
  const userGaps = loadGaps(id);
  const allGaps = [...student.gaps, ...userGaps];
  const gap = allGaps[gapIdx];
  if (!gap) return;

  const statuses = ['sos', 'aktiv', 'geloest'];
  const current = overrides[gapIdx] !== undefined ? overrides[gapIdx] : gap.status;
  overrides[gapIdx] = statuses[(statuses.indexOf(current) + 1) % statuses.length];
  saveGapStatus(id, overrides);

  renderGapsScreen();
  if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

function toggleAddGapForm() {
  const form = document.getElementById('add-gap-form');
  const btn  = document.getElementById('add-gap-btn');
  if (!form) return;
  const visible = form.classList.toggle('visible');
  if (btn) btn.textContent = visible ? '✕ Schließen' : '+ Was habe ich bemerkt?';
}

function submitGap() {
  const id = getStudentId();
  const textarea = document.getElementById('gap-textarea');
  const select   = document.getElementById('gap-category');
  if (!textarea || !select) return;
  const text = textarea.value.trim();
  if (!text) return;

  const gaps = loadGaps(id);
  const today = new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
  gaps.push({ id: 'u' + Date.now(), level: '—', category: select.value, text, status: 'sos', by: 'student', date: today });
  saveGaps(id, gaps);

  textarea.value = '';
  renderGapsScreen();
  if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

function toggleSkill(idx) {
  const card = document.getElementById('sk-card-' + idx);
  const criteria = document.getElementById('sk-criteria-' + idx);
  if (!card || !criteria) return;
  const open = criteria.classList.toggle('visible');
  card.classList.toggle('open', open);
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

// ── Kometen-Kanone 🌠 ─────────────────────────────────────────────────────
function fireCometCannon() {
  let canvas = document.getElementById('comet-canvas');
  if (canvas) canvas.remove(); // bei Doppelaufruf neu starten
  canvas = document.createElement('canvas');
  canvas.id = 'comet-canvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const W = canvas.width, H = canvas.height;

  const COLORS = ['#7CC8A0','#4A8C6E','#B5E8D0','#FFD97D','#FF9F7E','#A5C8F0','#ffffff'];
  const comets = [];

  for (let i = 0; i < 22; i++) {
    const angle  = (-(35 + Math.random() * 70)) * Math.PI / 180; // вверх 35–105°
    const speed  = 9 + Math.random() * 10;
    const side   = Math.random() < 0.5; // слева или справа
    comets.push({
      x:       side ? Math.random() * W * 0.45 : W - Math.random() * W * 0.45,
      y:       H + 30 + Math.random() * 60,
      vx:      Math.cos(angle) * speed * (side ? 1 : -1),
      vy:      Math.sin(angle) * speed,
      size:    2.5 + Math.random() * 3.5,
      color:   COLORS[Math.floor(Math.random() * COLORS.length)],
      tail:    [],
      tailLen: 18 + Math.floor(Math.random() * 18),
      delay:   Math.floor(Math.random() * 28),
      alpha:   1,
    });
  }

  let frame = 0;
  const TOTAL = 130;

  function draw() {
    ctx.clearRect(0, 0, W, H);
    frame++;
    let alive = false;

    for (const c of comets) {
      if (frame <= c.delay) { alive = true; continue; }

      c.tail.push({ x: c.x, y: c.y });
      if (c.tail.length > c.tailLen) c.tail.shift();

      c.x  += c.vx;
      c.y  += c.vy;
      c.vy += 0.07; // лёгкая гравитация

      if (frame > TOTAL * 0.65)
        c.alpha = Math.max(0, 1 - (frame - TOTAL * 0.65) / (TOTAL * 0.35));

      if (c.alpha <= 0) continue;
      alive = true;

      // хвост
      for (let t = 0; t < c.tail.length; t++) {
        const p = t / c.tail.length;
        const a = p * c.alpha * 0.75;
        const hex = Math.floor(a * 255).toString(16).padStart(2,'0');
        ctx.beginPath();
        ctx.arc(c.tail[t].x, c.tail[t].y, c.size * p * 0.9, 0, Math.PI * 2);
        ctx.fillStyle = c.color + hex;
        ctx.fill();
      }

      // свечение вокруг головы
      const grd = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.size * 4);
      grd.addColorStop(0,   c.color + 'cc');
      grd.addColorStop(0.4, c.color + '55');
      grd.addColorStop(1,   c.color + '00');
      ctx.globalAlpha = c.alpha;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size * 4, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      // яркое ядро
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.size, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (alive && frame < TOTAL + 30) {
      requestAnimationFrame(draw);
    } else {
      canvas.remove();
    }
  }

  requestAnimationFrame(draw);
}

function toggleFeedback() {
  const btn = document.getElementById('fb-toggle');
  const body = document.getElementById('fb-body');
  const open = body.classList.toggle('visible');
  btn.classList.toggle('open', open);
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function toggleArchiveItem(i) {
  const body = document.getElementById(`fb-archive-body-${i}`);
  const arrow = document.getElementById(`fb-archive-arrow-${i}`);
  const open = body.classList.toggle('visible');
  if (arrow) arrow.style.transform = open ? 'rotate(180deg)' : '';
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function toggleTeacherReply() {
  const card = document.getElementById('teacher-reply-card');
  const body = document.getElementById('teacher-reply-body');
  const open = body.classList.toggle('visible');
  card.classList.toggle('open', open);
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

// ── Сдача домашнего задания ───────────────────────────────────────────────

function handleFileSelect(level, input) {
  const file = input.files[0];
  const preview = document.getElementById('submit-preview-' + level);
  const btn = document.getElementById('submit-file-btn-' + level);
  if (!file) return;
  btn.textContent = '📎 ' + file.name;
  if (file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.innerHTML = `<img src="${e.target.result}" class="submit-preview-img" alt="Screenshot">`;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = `<div class="submit-preview-audio">🎵 ${file.name}</div>`;
  }
}

function submitHomework(level) {
  if (!_student) return;
  const textarea = document.getElementById('submit-text-' + level);
  const fileInput = document.getElementById('submit-file-' + level);
  const text = textarea ? textarea.value.trim() : '';
  const hasFile = fileInput && fileInput.files.length > 0;

  const levelLabel = level === 'task' ? 'Pflichtaufgabe' : level === 'deepen' ? 'Vertiefung' : 'Eintauchen';
  const topic = level === 'task' ? _student.task.topic
              : level === 'deepen' ? _student.deepen?.topic
              : _student.immerse?.topic;

  let msg = `📚 Hausaufgabe von ${_student.name}\n`;
  msg += `📌 ${levelLabel}: ${topic}\n`;
  if (text) msg += `\n${text}`;
  if (hasFile) msg += `\n\n[Screenshot/Datei folgt]`;

  // Сохраняем в localStorage
  let subData = {};
  try {
    subData = JSON.parse(localStorage.getItem('pgc_sub_' + _studentId) || '{}');
    subData[level] = { date: new Date().toISOString(), text, hasFile, topic };
    localStorage.setItem('pgc_sub_' + _studentId, JSON.stringify(subData));
  } catch(e) {}
  // Синхронизируем статус сданных заданий в Firebase
  if (typeof fbSetPublic === 'function') {
    fbSetPublic(`progress/${_studentId}/submissions`, subData).catch(() => {});
  }

  // Сохраняем в Firebase — для Eingänge в teacher.html (публично, без токена)
  const today = new Date().toISOString().split('T')[0];
  if (typeof fbSetPublic === 'function') {
    const submission = {
      text, topic, level,
      studentName: _student.name,
      timestamp: new Date().toISOString(),
      audioUrl: _audioUrls[level] || null,
      transcript: _liveTranscripts[level] || null,
      hasFile: false
    };
    // Если Cloudinary не сработал — сохраняем base64 прямо в Firebase
    if (!submission.audioUrl && _audioData[level]) {
      submission.audioData = _audioData[level].data;
      submission.audioType = _audioData[level].type;
    }
    fbSetPublic(`submissions/${_studentId}/${today}/${level}`, submission);
  }

  // Короткий пинг преподавателю (полный текст — в Eingänge)
  notifyTeacher(`📬 ${_student.name} · ${levelLabel}\n📌 ${topic}\n\n👁 Откройте Eingänge в панели педагога`);

  // Открываем Telegram с готовым сообщением (студент отправляет сам)
  const url = 'https://t.me/mila_konstanz?text=' + encodeURIComponent(msg);
  window.open(url, '_blank');

  // Помечаем как отправлено, показываем подтверждение с кнопкой редактирования
  setDraftStatus(level, 'sent');
  if (textarea) textarea.readOnly = true;
  const confirm = document.getElementById('submit-confirm-' + level);
  if (confirm) {
    confirm.style.display = 'block';
    confirm.innerHTML = hasFile
      ? `✅ Текст отправлен! Прикрепите скриншот в Telegram. <button class="edit-sent-btn" onclick="editSubmission('${level}')">Bearbeiten</button>`
      : `✅ Gesendet! <button class="edit-sent-btn" onclick="editSubmission('${level}')">Bearbeiten</button>`;
  }
  // Убираем баннер "не сделано" после первой сдачи
  if (level === 'task') {
    const banner = document.getElementById('not-done-banner');
    if (banner) banner.style.display = 'none';

    // Пост-сабмишн сообщение — если педагог заполнил в teacher.html
    const ps = _student.sprint?.today?.postSubmit;
    const psEl = document.getElementById('post-submit-msg');
    if (ps?.done && psEl) {
      psEl.style.display = 'block';
      psEl.innerHTML = `
        <div class="post-submit-done">✓ ${ps.done}</div>
        ${ps.why ? `<div class="post-submit-why">${ps.why}</div>` : ''}
      `;
    }
    unlockNextLevel('task');
  } else if (level === 'deepen') {
    unlockNextLevel('deepen');
  }
  if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

// ── Черновики — автосохранение и восстановление ──────────────────────────────

function _draftKey(level) {
  const today = new Date().toISOString().split('T')[0];
  return `pgc_draft_${_studentId}_${level}_${today}`;
}
function _draftStKey(level) {
  const today = new Date().toISOString().split('T')[0];
  return `pgc_draftst_${_studentId}_${level}_${today}`;
}
function saveDraft(level, text) {
  try { localStorage.setItem(_draftKey(level), text); } catch(e) {}
}
function loadDraft(level) {
  try { return localStorage.getItem(_draftKey(level)) || ''; } catch(e) { return ''; }
}
function getDraftStatus(level) {
  try { return localStorage.getItem(_draftStKey(level)) || 'new'; } catch(e) { return 'new'; }
}
function setDraftStatus(level, status) {
  try { localStorage.setItem(_draftStKey(level), status); } catch(e) {}
}

function openInfographic() {
  const modal = document.getElementById('infographic-modal');
  if (modal) modal.classList.add('open');
}
function closeInfographic() {
  const modal = document.getElementById('infographic-modal');
  if (modal) modal.classList.remove('open');
}
function previewInfographic(input) {
  const file = input.files[0];
  if (!file) return;
  const img = document.getElementById('infographic-preview');
  if (img) {
    img.src = URL.createObjectURL(file);
    img.style.display = 'block';
    img.previousElementSibling.style.display = 'none'; // скрываем кнопку
  }
}

function editSubmission(level) {
  const textarea = document.getElementById('submit-text-' + level);
  const confirm = document.getElementById('submit-confirm-' + level);
  if (textarea) { textarea.readOnly = false; textarea.focus(); }
  if (confirm) confirm.style.display = 'none';
  setDraftStatus(level, 'draft');
}

function submitLater(level) {
  const textarea = document.getElementById('submit-text-' + level);
  const text = textarea ? textarea.value.trim() : '';
  if (!text) return;
  saveDraft(level, text);
  setDraftStatus(level, 'draft');
  const confirm = document.getElementById('submit-confirm-' + level);
  if (confirm) {
    confirm.style.display = 'block';
    confirm.innerHTML = `💾 Gespeichert — <button class="edit-sent-btn" onclick="submitHomework('${level}')">Jetzt senden</button> · <button class="edit-sent-btn" onclick="editSubmission('${level}')">Bearbeiten</button>`;
  }
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function checkAutoSubmitYesterday() {
  if (!_studentId) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const levels = ['task', 'deepen', 'immerse', 'writing1', 'writing2', 'writing3'];
  levels.forEach(level => {
    const draftKey = `pgc_draft_${_studentId}_${level}_${yesterday}`;
    const stKey = `pgc_draftst_${_studentId}_${level}_${yesterday}`;
    try {
      const text = localStorage.getItem(draftKey);
      const status = localStorage.getItem(stKey) || 'new';
      if (text && text.trim() && status === 'draft') {
        // Автоотправка вчерашнего черновика
        localStorage.setItem(stKey, 'auto-sent');
        const sub = JSON.parse(localStorage.getItem('pgc_sub_' + _studentId) || '{}');
        sub[level + '_' + yesterday] = { date: yesterday + 'T23:59:00', text, auto: true };
        localStorage.setItem('pgc_sub_' + _studentId, JSON.stringify(sub));
      }
    } catch(e) {}
  });
}

function initDrafts() {
  checkAutoSubmitYesterday();
  const levels = ['task', 'deepen', 'immerse', 'writing1', 'writing2', 'writing3'];
  levels.forEach(level => {
    const textarea = document.getElementById('submit-text-' + level);
    if (!textarea) return;
    // Восстановить черновик
    const draft = loadDraft(level);
    if (draft) textarea.value = draft;
    // Если уже отправлено — показать статус
    const status = getDraftStatus(level);
    if (status === 'sent') {
      textarea.readOnly = true;
      const confirm = document.getElementById('submit-confirm-' + level);
      if (confirm) {
        confirm.style.display = 'block';
        confirm.innerHTML = `✅ Gesendet! <button class="edit-sent-btn" onclick="editSubmission('${level}')">Bearbeiten</button>`;
      }
    } else if (status === 'draft' && draft) {
      const confirm = document.getElementById('submit-confirm-' + level);
      if (confirm) {
        confirm.style.display = 'block';
        confirm.innerHTML = `💾 Entwurf gespeichert · <button class="edit-sent-btn" onclick="submitHomework('${level}')">Jetzt senden</button>`;
      }
    }
    // Автосохранение при вводе
    textarea.addEventListener('input', () => {
      saveDraft(level, textarea.value);
      if (getDraftStatus(level) !== 'sent') setDraftStatus(level, 'draft');
    });
    // Добавить кнопку "Später senden" рядом с "Abschicken"
    const form = textarea.closest('.submit-form');
    if (form && !form.querySelector('.send-later-btn')) {
      const sendBtn = form.querySelector('.action-btn, .optional-send-btn');
      if (sendBtn) {
        const laterBtn = document.createElement('button');
        laterBtn.className = 'send-later-btn';
        laterBtn.textContent = '💾 Später senden';
        laterBtn.onclick = () => submitLater(level);
        sendBtn.insertAdjacentElement('afterend', laterBtn);
      }
    }
  });
}

function switchMode(mode) {
  const speaking = document.getElementById('speaking-tasks');
  const writing = document.getElementById('writing-tasks');
  const btnS = document.getElementById('mode-speaking');
  const btnW = document.getElementById('mode-writing');
  if (mode === 'speaking') {
    speaking.style.display = 'block';
    writing.style.display = 'none';
    btnS.classList.add('mode-btn--active');
    btnW.classList.remove('mode-btn--active');
  } else {
    speaking.style.display = 'none';
    writing.style.display = 'block';
    btnW.classList.add('mode-btn--active');
    btnS.classList.remove('mode-btn--active');
  }
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function submitDiary() {
  if (!_student || !_student.diary) return;
  const textarea = document.getElementById('diary-textarea');
  const text = textarea ? textarea.value.trim() : '';
  if (!text) { if (textarea) textarea.focus(); return; }

  // Считаем streak и total
  const diaryKey = `pgc_diary_${_studentId}`;
  const today = new Date().toISOString().split('T')[0];
  let data = JSON.parse(localStorage.getItem(diaryKey) || '{"streak":0,"total":0,"lastDate":null}');

  if (data.lastDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    data.streak = data.lastDate === yesterday ? (data.streak || 0) + 1 : 1;
    data.total = (data.total || 0) + 1;
    data.lastDate = today;
    localStorage.setItem(diaryKey, JSON.stringify(data));
    // Mirror to Firebase — streak survives device change
    if (typeof fbSetPublic === 'function') {
      fbSetPublic(`progress/${_studentId}/diary`, data).catch(() => {});
    }
  }

  // Формируем сообщение в Telegram
  let msg = `📓 Tagebuch von ${_student.name} — ${new Date().toLocaleDateString('de-DE')}\n\n${text}`;
  if (data.streak > 1) msg += `\n\n🔥 ${data.streak} Tage in Folge!`;

  // Сохраняем в Firebase — для Eingänge в teacher.html (публично, без токена)
  if (typeof fbSetPublic === 'function') {
    fbSetPublic(`submissions/${_studentId}/${today}/diary`, {
      text, topic: 'Tagebuch',
      level: 'diary', studentName: _student.name,
      timestamp: new Date().toISOString()
    });
  }

  // Короткий пинг преподавателю
  notifyTeacher(`📓 ${_student.name} написала Tagebuch${data.streak > 1 ? ` · 🔥 ${data.streak} Tage` : ''}\n\n👁 Откройте Eingänge в панели педагога`);

  const url = 'https://t.me/mila_konstanz?text=' + encodeURIComponent(msg);
  window.open(url, '_blank');

  const confirm = document.getElementById('diary-confirm');
  if (confirm) confirm.style.display = 'block';
  if (textarea) textarea.value = '';
  if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');

  // Обновляем счётчик на экране без перерендера
  const label = document.querySelector('.diary-progress-label');
  const bar = document.querySelector('.diary-progress-bar');
  if (label && bar) {
    const goal = _student.diary.goalDays || 19;
    const pct = Math.min(100, Math.round((data.total / goal) * 100));
    label.textContent = `${data.total} von ${goal} Tagen · ${pct}%`;
    bar.style.width = pct + '%';
  }
  const streakEl = document.querySelector('.diary-streak');
  if (streakEl && data.streak > 0) streakEl.textContent = `🔥 ${data.streak} Tage in Folge`;
}

function buildStudentFromProfile(p) {
  const levelSkills = {
    'A1': [
      { name: 'Hören',     icon: '🎧', personal: 'stable', note: 'Einfache Sätze verstehen', criteria: [{ label: 'Alltagsgespräche verstehen', done: false }, { label: 'Zahlen und Zeiten hören', done: false }] },
      { name: 'Sprechen',  icon: '🗣️', personal: 'stable', note: 'Erste Schritte', criteria: [{ label: 'Sich vorstellen', done: false }, { label: 'Einkaufen und bestellen', done: false }] },
      { name: 'Lesen',     icon: '📖', personal: 'stable', note: 'Einfache Texte', criteria: [{ label: 'Kurze Nachrichten lesen', done: false }, { label: 'Schilder verstehen', done: false }] },
      { name: 'Schreiben', icon: '✍️', personal: 'stable', note: 'Erste Sätze', criteria: [{ label: 'Sich vorstellen', done: false }, { label: 'Kurze Nachrichten schreiben', done: false }] },
      { name: 'Grammatik', icon: '🔧', personal: 'stable', note: 'Grundstrukturen', criteria: [{ label: 'Verb auf Position 2', done: false }, { label: 'Artikel: der / die / das', done: false }] },
    ],
    'A2': [
      { name: 'Hören',     icon: '🎧', personal: 'stable', note: 'Vertraute Themen verstehen', criteria: [{ label: 'Kurze Dialoge verstehen', done: false }, { label: 'Einfache Nachrichten verstehen', done: false }] },
      { name: 'Sprechen',  icon: '🗣️', personal: 'stable', note: 'Einfache Kommunikation', criteria: [{ label: 'Über Alltag sprechen', done: false }, { label: 'Termine vereinbaren', done: false }] },
      { name: 'Lesen',     icon: '📖', personal: 'stable', note: 'Kurze Texte lesen', criteria: [{ label: 'E-Mails lesen', done: false }, { label: 'Einfache Artikel verstehen', done: false }] },
      { name: 'Schreiben', icon: '✍️', personal: 'stable', note: 'Einfache Texte schreiben', criteria: [{ label: 'E-Mails schreiben', done: false }, { label: 'Kurze Nachrichten formulieren', done: false }] },
      { name: 'Grammatik', icon: '🔧', personal: 'stable', note: 'Grundgrammatik', criteria: [{ label: 'Perfekt bilden', done: false }, { label: 'Modalverben', done: false }] },
    ],
    'B1': [
      { name: 'Hören',     icon: '🎧', personal: 'stable', note: 'Hauptpunkte verstehen', criteria: [{ label: 'Gespräche über vertraute Themen', done: false }, { label: 'Nachrichten verstehen', done: false }] },
      { name: 'Sprechen',  icon: '🗣️', personal: 'stable', note: 'Flüssiger werden', criteria: [{ label: 'Meinungen ausdrücken', done: false }, { label: 'Über Erfahrungen berichten', done: false }] },
      { name: 'Lesen',     icon: '📖', personal: 'stable', note: 'Texte erschließen', criteria: [{ label: 'Zeitungsartikel verstehen', done: false }, { label: 'Literarische Texte lesen', done: false }] },
      { name: 'Schreiben', icon: '✍️', personal: 'stable', note: 'Zusammenhängende Texte', criteria: [{ label: 'Kurze Aufsätze schreiben', done: false }, { label: 'Formelle E-Mails', done: false }] },
      { name: 'Grammatik', icon: '🔧', personal: 'stable', note: 'Strukturen festigen', criteria: [{ label: 'Konjunktiv II', done: false }, { label: 'Passiv', done: false }] },
    ],
    'B2': [
      { name: 'Hören',     icon: '🎧', personal: 'stable', note: 'Komplexe Inhalte verstehen', criteria: [{ label: 'Vorträge und Debatten folgen', done: false }, { label: 'Implizite Bedeutungen erkennen', done: false }] },
      { name: 'Sprechen',  icon: '🗣️', personal: 'stable', note: 'Klar und spontan', criteria: [{ label: 'Spontan diskutieren', done: false }, { label: 'Standpunkte begründen', done: false }] },
      { name: 'Lesen',     icon: '📖', personal: 'stable', note: 'Anspruchsvolle Texte', criteria: [{ label: 'Fachartikeln folgen', done: false }, { label: 'Nuancen verstehen', done: false }] },
      { name: 'Schreiben', icon: '✍️', personal: 'stable', note: 'Strukturiert schreiben', criteria: [{ label: 'Argumentative Texte', done: false }, { label: 'Formelle Briefe', done: false }] },
      { name: 'Grammatik', icon: '🔧', personal: 'stable', note: 'Komplexe Strukturen', criteria: [{ label: 'Nominalstil', done: false }, { label: 'Relativsätze sicher', done: false }] },
    ],
  };
  const level = p.level || 'B1';
  const baseLevel = level.replace(/[^A-Z0-9]/g, '').substring(0, 2);
  return {
    name: p.name,
    level,
    progressText: 'Wir arbeiten gemeinsam — Schritt für Schritt',
    goal: { title: p.goal || 'Deutsch sicher sprechen', deadline: p.deadline || '2026' },
    milestones: (p.milestones || []).length
      ? p.milestones
      : [
          { label: `${level} sicher erreichen`, status: 'active', sub: 'Sie sind hier' },
          { label: 'Flüssig kommunizieren',    status: 'upcoming' },
          { label: p.goal || 'Ziel erreichen', status: 'upcoming' },
        ],
    review: null,
    task: null,
    deepen: null,
    immerse: null,
    feedback: null,
    gaps: [],
    diary: { instruction: 'Jeden Tag 5 Sätze auf Deutsch', prompt: 'Was haben Sie heute gemacht?' },
    skills: levelSkills[baseLevel] || levelSkills['B1'],
    grammar: [],
    sprint: { today: {} },
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  // Загружаем данные педагога из Firebase перед рендером
  const id = getStudentId();
  if (id && typeof fbGet === 'function') {
    const [teacherData, progress, feedbackArchive, fbProfile] = await Promise.all([
      fbGet(`teacher/${id}`),
      fbGet(`progress/${id}`),
      fbGet(`feedback/${id}`),
      STUDENTS[id] ? Promise.resolve(null) : fbGet(`students/${id}/profile`)
    ]);
    if (progress?.wordSchedule) _wordSchedule = progress.wordSchedule;
    _firebaseTeacherData = teacherData;
    // Фидбек педагога хранится в progress (читается без авторизации)
    _teacherSubmissionFeedback = progress?.lastTeacherFeedback || null;
    _feedbackArchive = feedbackArchive || null;
    // Если студент не в students.js — строим из Firebase профиля
    if (!STUDENTS[id] && fbProfile) {
      STUDENTS[id] = buildStudentFromProfile(fbProfile);
    }
    // Сохраняем Telegram chat ID студента (если открыто через Telegram)
    const tgUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    if (tgUserId) {
      fbSetPublic(`progress/${id}/tgChatId`, tgUserId).catch(() => {});
    }
    // Синхронизируем прогресс из Firebase в localStorage — работает при смене устройства
    if (progress) {
      try {
        if (progress.words)       localStorage.setItem('pgc_words_' + id,   JSON.stringify(progress.words));
        if (progress.grammar)     localStorage.setItem('pgc_grammar_' + id, JSON.stringify(progress.grammar));
        if (progress.submissions) localStorage.setItem('pgc_sub_' + id,     JSON.stringify(progress.submissions));
        if (progress.criteria)    localStorage.setItem('pgc_' + id,         JSON.stringify(progress.criteria));
        if (progress.gaps)        localStorage.setItem('pgc_gaps_' + id,    JSON.stringify(progress.gaps));
        if (progress.gapStatus)   localStorage.setItem('pgc_gap_st_' + id,  JSON.stringify(progress.gapStatus));
        if (progress.diary)       localStorage.setItem(`pgc_diary_${id}`,   JSON.stringify(progress.diary));
        if (progress.mood) {
          // Восстанавливаем настроение только если оно за сегодня
          const todayISO = new Date().toISOString().split('T')[0];
          if (progress.mood.date === todayISO) {
            localStorage.setItem('pgc_mood_' + id, JSON.stringify(progress.mood));
          }
        }
      } catch(e) {}
    }
  }
  render();
});

// ── Sprint P0: Фидбек + Настроение + Баннеры ────────────────────────────────

function buildFeedbackHTML(student, id) {
  // Вкладка Feedback = только архив комментариев педагога из Firebase
  if (!_feedbackArchive && !_teacherSubmissionFeedback) return `
    <div class="fb-empty">
      <div class="fb-empty-icon">💬</div>
      <div class="fb-empty-text">Kommentare der Lehrerin erscheinen hier</div>
    </div>`;

  // Собираем все записи архива
  const archiveEntries = _feedbackArchive
    ? Object.entries(_feedbackArchive).sort(([a],[b]) => b.localeCompare(a))
    : [];

  // Если в архиве нет последнего фидбека — добавляем его первым
  let entries = archiveEntries;
  if (_teacherSubmissionFeedback && entries.length === 0) {
    entries = [['latest', _teacherSubmissionFeedback]];
  }

  if (!entries.length) return `
    <div class="fb-empty">
      <div class="fb-empty-icon">💬</div>
      <div class="fb-empty-text">Kommentare der Lehrerin erscheinen hier</div>
    </div>`;

  const items = entries.map(([date, fb], i) => {
    const d = new Date(fb.sentAt || date);
    const dateLabel = isNaN(d) ? date : d.toLocaleDateString('de-DE', {day:'numeric', month:'long', year:'numeric'});
    const preview = (fb.text || '').slice(0, 70).replace(/\n/g,' ') + ((fb.text||'').length > 70 ? '…' : '');
    const fullText = (fb.text || '').replace(/</g,'&lt;').replace(/\n/g,'<br>');
    return `
      <div class="fb-archive-item">
        <button class="fb-archive-toggle" onclick="toggleArchiveItem(${i})">
          <div class="fb-archive-toggle-left">
            <div class="fb-archive-date">${dateLabel}</div>
            <div class="fb-archive-preview">${preview.replace(/</g,'&lt;')}</div>
          </div>
          <div class="fb-archive-arrow" id="fb-archive-arrow-${i}">⌄</div>
        </button>
        <div class="fb-archive-body" id="fb-archive-body-${i}">
          <div class="fb-archive-text">${fullText}</div>
        </div>
      </div>`;
  }).join('');

  return `<div class="fb-archive">${items}</div>`;
}

function setMood(mood) {
  const id = _studentId;
  const todayISO = new Date().toISOString().split('T')[0];
  try {
    localStorage.setItem('pgc_mood_' + id, JSON.stringify({ date: todayISO, mood }));
  } catch(e) {}
  if (typeof fbSetPublic === 'function') {
    fbSetPublic(`progress/${id}/mood`, { date: todayISO, mood }).catch(() => {});
  }

  const labels = {
    tired: '😰 Erschöpft — heute nur Niveau 1',
    ok: '😐 Es geht — los geht\'s!',
    good: '😊 Gut! — alle Levels offen',
  };
  const sel = document.getElementById('mood-selector');
  if (sel) sel.innerHTML = `<div class="mood-selected">${labels[mood]}</div>`;

  const encourageEl = document.getElementById('mood-encourage');
  if (mood === 'tired') {
    ['lbtn-2','lbtn-3','level-content-2','level-content-3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    switchSpeakLevel(1);
    if (encourageEl) {
      encourageEl.style.display = 'block';
      const teacherEncourage = _student?.sprint?.today?.encourageTired;
      encourageEl.textContent = teacherEncourage || 'Heute reicht Niveau 1 — das ist schon viel. Jeder Tag zählt. 💙';
    }
  } else {
    ['lbtn-2','lbtn-3'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = '';
    });
    if (encourageEl) encourageEl.style.display = 'none';
  }

  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function dismissNotDone() {
  const banner = document.getElementById('not-done-banner');
  if (banner) banner.style.display = 'none';
}

function dismissFeedbackNotif() {
  const banner = document.getElementById('sprint-notif-banner');
  if (banner) banner.style.display = 'none';
  try { localStorage.setItem('pgc_fb_seen_' + _studentId, 'true'); } catch(e) {}
}

function submitFeedbackResponse(idx) {
  if (!_student) return;
  const textarea = document.getElementById('fb-response-text-' + idx);
  const fileInput = document.getElementById('submit-file-fbresponse' + idx);
  const text = textarea ? textarea.value.trim() : '';
  const hasFile = fileInput && fileInput.files.length > 0;

  const block = _student.feedback?.blocks?.[idx];
  let msg = `💬 Antwort auf Feedback — ${_student.name}\n`;
  msg += `❓ ${block?.questionDE || 'Frage-Aktivierung'}\n`;
  if (text) msg += `\n${text}`;
  if (hasFile) msg += `\n\n[Sprachnachricht folgt]`;

  window.open('https://t.me/mila_konstanz?text=' + encodeURIComponent(msg), '_blank');

  const confirm = document.getElementById('fb-response-confirm-' + idx);
  if (confirm) confirm.style.display = 'block';
  if (textarea) textarea.value = '';
  if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

// ── Банк слов — оценка студента ───────────────────────────────────────────
function setWordStatus(word, status, studentId) {
  let ws = {};
  try {
    const key = 'pgc_words_' + studentId;
    ws = JSON.parse(localStorage.getItem(key) || '{}');
    ws[word] = status;
    localStorage.setItem(key, JSON.stringify(ws));
  } catch(e) {}
  // Обновляем расписание повторений
  const today = new Date().toISOString().split('T')[0];
  const wk = wordKey(word);
  const existing = _wordSchedule[wk] || {};
  const student = STUDENTS[studentId];
  const chunk = student?.sprint?.today?.words?.find(w => w.word === word)?.chunks?.[0] || null;
  _wordSchedule[wk] = {
    word,
    chunk,
    introduced: existing.introduced || today,
    lastDate: today,
    lastStatus: status,
    nextReview: addDays(today, nextReviewDays(status)),
    timesUsed: existing.timesUsed || 0
  };
  if (typeof fbSetPublic === 'function') {
    fbSetPublic(`progress/${studentId}/words`, ws).catch(() => {});
    fbSetPublic(`progress/${studentId}/wordSchedule`, _wordSchedule).catch(() => {});
  }
  // Обновить кнопки визуально без полного ре-рендера
  const rowId = 'wb-' + word.replace(/\s/g,'_');
  const row = document.getElementById(rowId);
  if (row) {
    row.querySelectorAll('.wb-btn').forEach(btn => btn.classList.remove('active'));
    const statuses = ['forgotten','red','yellow','green'];
    const idx = statuses.indexOf(status);
    if (idx >= 0) row.querySelectorAll('.wb-btn')[idx]?.classList.add('active');
  }
  // Обновить цифры в блоке маркеров
  _refreshMarkerStats(studentId);
  if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
}

function _refreshMarkerStats(id) {
  const student = STUDENTS[id];
  if (!student) return;
  let green = 0, yellow = 0, red = 0;
  const weekWords = student.sprint?.today?.words || [];
  try {
    const ws = JSON.parse(localStorage.getItem('pgc_words_' + id) || '{}');
    weekWords.forEach(w => {
      const st = ws[w.word];
      if (st === 'green') green++;
      else if (st === 'yellow') yellow++;
      else if (st === 'red' || st === 'forgotten') red++;
    });
  } catch(e) {}
  // Обновить только цифры если блок виден
  const statsEl = document.querySelector('.lang-markers-stats');
  if (!statsEl) return;
  const nums = statsEl.querySelectorAll('.lang-stat-num');
  if (nums[0]) nums[0].textContent = weekWords.length;
  if (nums[1]) nums[1].textContent = '🟢 ' + green;
  if (nums[2]) nums[2].textContent = '🟡 ' + yellow;
}

// ── Онбординг ─────────────────────────────────────────────────────────────
const ONBOARDING_SCREENS = [
  {
    icon: '👋',
    title: (name) => `${name}, добро пожаловать в ваш кабинет`,
    body: 'Это ваше личное пространство с педагогом. Здесь живут <strong>задания, прогресс</strong> и <strong>обратная связь</strong> — всё в одном месте.',
  },
  {
    icon: '📅',
    title: () => 'Как это работает',
    body: '<strong>Каждый день</strong> — 6 слов и задание на говорение.<br>Три уровня сложности: начинаете с лёгкого, идёте дальше если готовы.<br><strong>Грамматика недели</strong> — всегда перед глазами.',
  },
  {
    icon: '🚀',
    title: () => 'Ваше первое задание уже здесь',
    body: 'Прокрутите вниз — там слова дня и задание. Начните когда удобно: в метро, дома, в паузе.',
  },
];

let _onboardStep = 0;

function showOnboarding(studentId, studentName) {
  const key = `pgc_onboarded_${studentId}`;
  if (localStorage.getItem(key)) return;

  _onboardStep = 0;
  _renderOnboardingStep(studentName);
}

function _renderOnboardingStep(name) {
  const existing = document.getElementById('onboarding-overlay');
  if (existing) existing.remove();

  const screen = ONBOARDING_SCREENS[_onboardStep];
  const isLast = _onboardStep === ONBOARDING_SCREENS.length - 1;

  const dots = ONBOARDING_SCREENS.map((_, i) =>
    `<div class="onboarding-dot ${i === _onboardStep ? 'active' : ''}"></div>`
  ).join('');

  const el = document.createElement('div');
  el.id = 'onboarding-overlay';
  el.className = 'onboarding-overlay';
  el.innerHTML = `
    <div class="onboarding-card">
      <button class="onboarding-skip" onclick="dismissOnboarding()" aria-label="Пропустить">×</button>
      <div class="onboarding-icon">${screen.icon}</div>
      <div class="onboarding-title">${screen.title(name)}</div>
      <div class="onboarding-body">${screen.body}</div>
      <div class="onboarding-dots">${dots}</div>
      <button class="onboarding-next" onclick="onboardNext('${name}')">
        ${isLast ? 'Начать →' : 'Далее'}
      </button>
    </div>
  `;
  document.body.appendChild(el);
}

function onboardNext(name) {
  if (_onboardStep < ONBOARDING_SCREENS.length - 1) {
    _onboardStep++;
    _renderOnboardingStep(name);
  } else {
    dismissOnboarding();
  }
}

function dismissOnboarding() {
  const key = `pgc_onboarded_${_studentId}`;
  localStorage.setItem(key, '1');
  const el = document.getElementById('onboarding-overlay');
  if (el) el.remove();
  // После онбординга — проверить есть ли опросник
  checkAndShowSurvey(_studentId);
}

// ── ОПРОСНИК СТУДЕНТА ───────────────────────────────────────────────────────
const SURVEY_QUESTIONS = [
  { id: 'q1', cat: 'Мотивация', q: 'Зачем вам немецкий?', type: 'single', opts: ['Работа','Переезд/интеграция','Экзамен','Учёба в вузе','Семья/партнёр','Путешествия/культура'], other: true },
  { id: 'q2', cat: 'Мотивация', q: 'Что хотите уметь через 3 месяца?', type: 'text' },
  { id: 'q3', cat: 'Мотивация', q: 'Есть ли дедлайн?', type: 'single', opts: ['Экзамен','Собеседование','Переезд','Требование на работе','Нет дедлайна'], date: true },
  { id: 'q4', cat: 'Мотивация', q: 'Какие ситуации самые важные?', type: 'multi', opts: ['Коллеги','Совещания','Врачи/чиновники','Smalltalk','Emails','Понимать на слух','Читать'], other: true },
  { id: 'q5', cat: 'Опыт', q: 'Как учили немецкий до этого?', type: 'multi', opts: ['Курсы','Репетитор','Самостоятельно','Приложения','В школе','Интеграционный курс','Не учил(а)'], other: true },
  { id: 'q6', cat: 'Опыт', q: 'Что помогало учиться эффективнее всего?', type: 'text' },
  { id: 'q7', cat: 'Опыт', q: 'Что точно НЕ работало?', type: 'text' },
  { id: 'q8', cat: 'Опыт', q: 'Какой примерный уровень?', type: 'single', opts: ['A1 — базовые фразы','A2 — простые ситуации','B1 — понимаю главное','B2 — свободно с ошибками','C1 — почти всё понимаю','Не знаю'] },
  { id: 'q9', cat: 'Время', q: 'Сколько времени в день реально?', type: 'single', opts: ['10-15 мин','20-30 мин','30-45 мин','Час+','Только выходные','Нерегулярно'] },
  { id: 'q10', cat: 'Время', q: 'Когда обычно занимаетесь?', type: 'multi', opts: ['Утро','Обед','Вечер','В дороге','Выходные','Когда получится'] },
  { id: 'q11', cat: 'Время', q: 'Где обычно учитесь?', type: 'multi', opts: ['Дома','На работе','В транспорте','Кафе/коворкинг','На прогулке'] },
  { id: 'q12', cat: 'Время', q: 'Можете говорить вслух там где учитесь?', type: 'single', opts: ['Да, свободно','Иногда','Редко','Нет'] },
  { id: 'q13', cat: 'Психология', q: 'Что мешает говорить прямо сейчас?', type: 'multi', opts: ['Боюсь ошибки','Не подбираю слова','Нервничаю с носителями','Стесняюсь акцента','Мало слов','Путаюсь в грамматике','Нет практики','Не уверен(а) в уровне','Ничего не мешает'] },
  { id: 'q14', cat: 'Психология', q: 'Когда не можете найти слово — что происходит?', type: 'single', opts: ['Нервничаю, замолкаю','Описываю иначе','Жду пока вспомню','Перехожу на другой язык','Спрашиваю'] },
  { id: 'q15', cat: 'Психология', q: 'Насколько комфортно делать ошибки?', type: 'scale', min: 1, max: 5, labels: ['Очень некомфортно','','Нормально','','Спокойно'] },
  { id: 'q16', cat: 'Психология', q: 'Как относитесь к акценту?', type: 'single', opts: ['Стесняюсь','Немного беспокоит','Не думаю об этом','Нормально'] },
  { id: 'q17', cat: 'Ожидания', q: 'Как исправлять ошибки?', type: 'single', opts: ['Сразу во время речи','После того как договорю','Письменно после урока','Только критичные','На ваше усмотрение'] },
  { id: 'q18', cat: 'Ожидания', q: 'Нужна строгость и дедлайны?', type: 'single', opts: ['Да — нужен контроль','Умеренно','Нет — сам(а) организую','Не знаю'] },
  { id: 'q19', cat: 'Ожидания', q: 'Что важнее сейчас?', type: 'single', opts: ['Говорить правильно','Говорить свободно','Баланс'] },
  { id: 'q20', cat: 'Ожидания', q: 'Что точно НЕ хотите в работе со мной?', type: 'text' },
  { id: 'q21', cat: 'Форматы', q: 'Какие форматы заданий нравятся?', type: 'multi', opts: ['Говорить','Диалоги','Слушать','Читать','Писать','Грамматика','Карточки','Свободный разговор'] },
  { id: 'q22', cat: 'Форматы', q: 'Какие форматы НЕ любите?', type: 'multi', opts: ['Таблицы','Зубрёжка','Переводить','Длинные тексты','Спонтанно говорить','Слушать без текста','Готов(а) ко всему'], other: true },
  { id: 'q23', cat: 'Форматы', q: 'Как запоминаете слова лучше всего?', type: 'multi', opts: ['Карточки','В контексте','Аудио','Пишу от руки','Сразу в речи','Образы','Плохо запоминаю'] },
  { id: 'q24', cat: 'Форматы', q: 'Какие ресурсы уже используете?', type: 'multi', opts: ['Duolingo','Babbel','Anki/Quizlet','YouTube','Подкасты','Netflix','Книги','Ничего'], other: true },
  { id: 'q25a', cat: 'Самооценка', q: 'Понимание на слух (1-5)', type: 'scale', min: 1, max: 5 },
  { id: 'q25b', cat: 'Самооценка', q: 'Понимание текста (1-5)', type: 'scale', min: 1, max: 5 },
  { id: 'q25c', cat: 'Самооценка', q: 'Говорение (1-5)', type: 'scale', min: 1, max: 5 },
  { id: 'q25d', cat: 'Самооценка', q: 'Письмо (1-5)', type: 'scale', min: 1, max: 5 },
  { id: 'q26', cat: 'Самооценка', q: 'Какой навык приоритетный?', type: 'single', opts: ['Говорение','Слушание','Чтение','Письмо','Грамматика','Словарный запас'] },
  { id: 'q27', cat: 'Самооценка', q: 'В чём уже чувствуете уверенность?', type: 'text' },
  { id: 'q28', cat: 'Самооценка', q: 'Как выглядит для вас "я знаю немецкий"?', type: 'text' },
];

let _surveyConfig = [];
let _surveyAnswers = {};
let _surveyStep = 0;

async function checkAndShowSurvey(studentId) {
  if (typeof fbGet !== 'function') return;
  // Проверяем: есть ли конфиг опросника, но нет ответов
  const [config, answers] = await Promise.all([
    fbGet(`students/${studentId}/surveyConfig`),
    fbGet(`students/${studentId}/survey`)
  ]);
  if (!config || answers) {
    // Входящий опросник не нужен — проверить ежемесячный чек-ин
    checkAndShowMonthlyCheckin(studentId);
    return;
  }
  _surveyConfig = SURVEY_QUESTIONS.filter(q => config.includes(q.id));
  if (!_surveyConfig.length) return;
  _surveyAnswers = {};
  _surveyStep = 0;
  renderSurveyStep();
}

function renderSurveyStep() {
  const existing = document.getElementById('survey-overlay');
  if (existing) existing.remove();

  if (_surveyStep >= _surveyConfig.length) {
    submitSurvey();
    return;
  }

  const q = _surveyConfig[_surveyStep];
  const progress = `${_surveyStep + 1} из ${_surveyConfig.length}`;

  let inputHtml = '';
  if (q.type === 'single') {
    inputHtml = q.opts.map((opt, i) => `
      <button class="survey-opt" onclick="surveySelectSingle('${q.id}','${opt.replace(/'/g, "\\'")}')">
        ${opt}
      </button>
    `).join('');
    if (q.other) {
      inputHtml += `<div style="margin-top:10px"><input type="text" id="survey-other" class="survey-input" placeholder="Другое..."></div>`;
    }
  } else if (q.type === 'multi') {
    inputHtml = q.opts.map((opt, i) => `
      <label class="survey-multi">
        <input type="checkbox" value="${opt}"> ${opt}
      </label>
    `).join('');
    if (q.other) {
      inputHtml += `<div style="margin-top:10px"><input type="text" id="survey-other" class="survey-input" placeholder="Другое..."></div>`;
    }
    inputHtml += `<button class="survey-next" onclick="surveySelectMulti('${q.id}')">Далее →</button>`;
  } else if (q.type === 'scale') {
    const labels = q.labels || [];
    inputHtml = '<div class="survey-scale">';
    for (let i = q.min; i <= q.max; i++) {
      inputHtml += `<button class="survey-scale-btn" onclick="surveySelectSingle('${q.id}','${i}')">${i}</button>`;
    }
    inputHtml += '</div>';
    if (labels[0] || labels[q.max - 1]) {
      inputHtml += `<div class="survey-scale-labels"><span>${labels[0] || ''}</span><span>${labels[q.max - 1] || ''}</span></div>`;
    }
  } else if (q.type === 'text') {
    inputHtml = `
      <textarea id="survey-text" class="survey-textarea" placeholder="Напишите здесь..."></textarea>
      <button class="survey-next" onclick="surveySelectText('${q.id}')">Далее →</button>
    `;
  }

  const el = document.createElement('div');
  el.id = 'survey-overlay';
  el.className = 'onboarding-overlay';
  el.innerHTML = `
    <div class="onboarding-card" style="max-width:380px">
      <div style="font-size:12px;color:#718096;margin-bottom:12px">${progress}</div>
      <div class="onboarding-title" style="font-size:17px;margin-bottom:${q.hint ? '8px' : '16px'}">${q.q}</div>
      ${q.hint ? `<div style="font-size:12px;color:#718096;margin-bottom:14px;line-height:1.5">${q.hint}</div>` : ''}
      <div class="survey-options">${inputHtml}</div>
      ${_surveyStep > 0 ? `<button class="survey-back" onclick="surveyBack()">← Назад</button>` : ''}
    </div>
  `;
  document.body.appendChild(el);
}

function surveySelectSingle(qId, value) {
  const otherEl = document.getElementById('survey-other');
  const other = otherEl ? otherEl.value.trim() : '';
  _surveyAnswers[qId] = other ? { value, other } : value;
  _surveyStep++;
  renderSurveyStep();
}

function surveySelectMulti(qId) {
  const checks = document.querySelectorAll('#survey-overlay .survey-multi input:checked');
  const values = Array.from(checks).map(c => c.value);
  const otherEl = document.getElementById('survey-other');
  const other = otherEl ? otherEl.value.trim() : '';
  if (other) values.push(other);
  if (!values.length) return; // нужен хотя бы один
  _surveyAnswers[qId] = values;
  _surveyStep++;
  renderSurveyStep();
}

function surveySelectText(qId) {
  const el = document.getElementById('survey-text');
  const val = el ? el.value.trim() : '';
  if (!val) return; // нужен текст
  _surveyAnswers[qId] = val;
  _surveyStep++;
  renderSurveyStep();
}

function surveyBack() {
  if (_surveyStep > 0) {
    _surveyStep--;
    renderSurveyStep();
  }
}

async function submitSurvey() {
  const el = document.getElementById('survey-overlay');
  if (el) {
    el.innerHTML = `<div class="onboarding-card" style="text-align:center">
      <div class="onboarding-icon">✅</div>
      <div class="onboarding-title">Спасибо!</div>
      <div class="onboarding-body">Ваши ответы сохранены. Педагог увидит их.</div>
    </div>`;
  }
  _surveyAnswers._completedAt = new Date().toISOString();
  if (typeof fbSetPublic === 'function') {
    if (_checkinMode && _checkinMonthKey) {
      await fbSetPublic(`students/${_studentId}/monthlyCheckin/${_checkinMonthKey}`, _surveyAnswers);
    } else {
      await fbSetPublic(`students/${_studentId}/survey`, _surveyAnswers);
    }
  }
  _checkinMode = false;
  setTimeout(() => {
    if (el) el.remove();
  }, 2000);
}

// ── ЕЖЕМЕСЯЧНЫЙ ЧЕК-ИН ────────────────────────────────────────────────────
let _checkinMode = false;
let _checkinMonthKey = '';

const MONTHLY_CHECKIN_QUESTIONS = [
  { id: 'm1', q: 'Как в целом ощущается этот месяц?', type: 'scale', min: 1, max: 5, labels: ['Тяжело, ничего не клеится', 'Здорово, чувствую что расту'] },
  { id: 'm2', q: 'Вспомните один момент когда немецкий вам помог или удивил вас', type: 'text', hint: 'Даже маленький момент: поняли что-то, сказали фразу — что угодно.' },
  { id: 'm3', q: 'Что до сих пор кажется самым трудным?', type: 'text', hint: 'Конкретная ситуация — когда чувствуете что не хватает языка.' },
  { id: 'm4', q: 'Каких заданий хотелось бы больше в следующем месяце?', type: 'multi', opts: ['Говорить — монологи', 'Ролевые диалоги', 'Слушать — аудио, видео', 'Читать тексты', 'Писать', 'Больше грамматики', 'Больше слов', 'Разбор моих ошибок', 'Всё устраивает'] },
  { id: 'm5', q: 'Есть что-то чего не хватает — чего мы вообще не делали?', type: 'text', hint: 'Тема, формат, ситуация — что хотелось бы, но ещё не было.' },
  { id: 'm6', q: 'Как было бы лучше для вас лично?', type: 'text', hint: 'Темп, сложность, формат заданий, обратная связь — что изменить?' },
  { id: 'm7', q: 'Изменилось ли что-то в вашей жизни или расписании?', type: 'single', opts: ['Нет, всё как прежде', 'Стало меньше времени', 'Стало больше времени', 'Изменилась ситуация или цель'] },
  { id: 'm8', q: 'Что мне важно знать о вас прямо сейчас?', type: 'text', hint: 'Настроение, усталость, изменения на работе — всё что влияет на учёбу.' },
];

async function checkAndShowMonthlyCheckin(studentId) {
  if (typeof fbGet !== 'function') return;
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

  const [config, existing] = await Promise.all([
    fbGet(`students/${studentId}/monthlyCheckinConfig/${monthKey}`),
    fbGet(`students/${studentId}/monthlyCheckin/${monthKey}`)
  ]);

  if (!config || existing?._completedAt) return; // нет запроса или уже заполнен

  _checkinMode = true;
  _checkinMonthKey = monthKey;
  _surveyConfig = MONTHLY_CHECKIN_QUESTIONS;
  _surveyAnswers = {};
  _surveyStep = 0;
  renderCheckinIntro();
}

function renderCheckinIntro() {
  const existing = document.getElementById('survey-overlay');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = 'survey-overlay';
  el.className = 'onboarding-overlay';
  el.innerHTML = `
    <div class="onboarding-card" style="max-width:380px">
      <div class="onboarding-icon">📊</div>
      <div class="onboarding-title">Чек-ин за месяц</div>
      <div class="onboarding-body">8 вопросов · 5-7 минут<br>Педагог читает каждый ответ — пишите честно.</div>
      <button class="survey-next" onclick="renderSurveyStep()" style="margin-top:20px">Начать →</button>
    </div>
  `;
  document.body.appendChild(el);
}

// ── ЗАПИСЬ ГОЛОСА ──────────────────────────────────────────────────────────
const REC_MAX_SECONDS = 90;
let _recMediaRecorder = null;
let _recChunks = [];
let _recLevel = null;
let _recTimerInterval = null;
let _recSeconds = 0;
let _recRecognition = null;
let _audioUrls = {};
let _audioData = {}; // base64 резерв если Cloudinary недоступен
let _liveTranscripts = {};
let _feedbackArchive = null;

async function toggleRecording(level) {
  if (_recMediaRecorder && _recMediaRecorder.state === 'recording') {
    stopRecording(level);
  } else {
    if (_recMediaRecorder && _recLevel && _recLevel !== level) stopRecording(_recLevel);
    await startRecording(level);
  }
}

async function startRecording(level) {
  const btn = document.getElementById('rec-btn-' + level);
  const status = document.getElementById('rec-status-' + level);
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    _recChunks = [];
    _recLevel = level;
    _liveTranscripts[level] = '';

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus'
                   : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
                   : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';

    _recMediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
    _recMediaRecorder.ondataavailable = e => { if (e.data.size > 0) _recChunks.push(e.data); };
    _recMediaRecorder.onstop = () => handleRecordingStop(level);
    _recMediaRecorder.start(200);

    if (btn) { btn.textContent = '⏹ Stopp'; btn.classList.add('recording'); }

    _recSeconds = 0;
    updateRecTimer(level);
    _recTimerInterval = setInterval(() => {
      _recSeconds++;
      updateRecTimer(level);
      if (_recSeconds >= REC_MAX_SECONDS) stopRecording(level);
    }, 1000);

    startLiveTranscript(level);
  } catch(e) {
    if (status) status.textContent = 'Нет доступа к микрофону — напишите текст';
    if (btn) { btn.textContent = '🎙 Aufnehmen'; btn.classList.remove('recording'); }
  }
}

function stopRecording(level) {
  if (_recMediaRecorder && _recMediaRecorder.state !== 'inactive') {
    _recMediaRecorder.stop();
    _recMediaRecorder.stream?.getTracks().forEach(t => t.stop());
  }
  clearInterval(_recTimerInterval);
  const btn = document.getElementById('rec-btn-' + level);
  const timer = document.getElementById('rec-timer-' + level);
  if (btn) { btn.textContent = '🎙 Aufnehmen'; btn.classList.remove('recording'); }
  if (timer) timer.textContent = '';
  if (_recRecognition) { try { _recRecognition.stop(); } catch {} _recRecognition = null; }
}

function updateRecTimer(level) {
  const timer = document.getElementById('rec-timer-' + level);
  if (!timer) return;
  const m = Math.floor(_recSeconds / 60);
  const s = String(_recSeconds % 60).padStart(2, '0');
  timer.textContent = `${m}:${s} / 1:30`;
  if (REC_MAX_SECONDS - _recSeconds <= 10) timer.style.color = '#E53E3E';
}

async function handleRecordingStop(level) {
  if (!_recChunks.length) return;
  const mimeType = _recChunks[0]?.type || 'audio/webm';
  const blob = new Blob(_recChunks, { type: mimeType });
  _recChunks = [];

  // Локальный плеер сразу
  const zone = document.getElementById('rec-zone-' + level);
  const status = document.getElementById('rec-status-' + level);
  const localUrl = URL.createObjectURL(blob);
  if (zone) {
    const old = zone.querySelector('.rec-audio-preview');
    if (old) old.remove();
    const preview = document.createElement('div');
    preview.className = 'rec-audio-preview';
    preview.innerHTML = `🎙 <audio controls src="${localUrl}"></audio>`;
    zone.appendChild(preview);
  }

  // Сначала пробуем Cloudinary, при неудаче — base64 в Firebase
  if (status) status.textContent = 'Загружаю аудио...';
  if (typeof fbUploadAudio === 'function') {
    const url = await fbUploadAudio(blob, _studentId, level);
    if (url) {
      _audioUrls[level] = url;
      if (status) status.textContent = '✓ Готово к отправке';
    } else {
      // Cloudinary недоступен — сохраняем как base64
      if (status) status.textContent = 'Конвертирую...';
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          _audioData[level] = { data: reader.result, type: blob.type };
          if (status) status.textContent = '✓ Готово к отправке';
        };
        reader.readAsDataURL(blob);
      } catch(e) {
        if (status) status.textContent = '⚠ Не удалось сохранить аудио';
      }
    }
  }
}

function startLiveTranscript(level) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return;
  try {
    _recRecognition = new SR();
    _recRecognition.lang = 'de-DE';
    _recRecognition.continuous = true;
    _recRecognition.interimResults = true;
    _recRecognition.onresult = e => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript + ' ';
      _liveTranscripts[level] = text.trim();
      const el = document.getElementById('rec-live-' + level);
      if (el) el.textContent = text.trim();
    };
    _recRecognition.onerror = () => {};
    _recRecognition.start();
  } catch {}
}

// ── Прогрессивная разблокировка уровней ──────────────────────────────────────
function unlockNextLevel(completedLevel) {
  let targetBtn = null;
  let targetContent = null;
  if (completedLevel === 'task') {
    targetBtn = document.getElementById('lbtn-2');
    targetContent = document.getElementById('level-content-2');
  } else if (completedLevel === 'deepen') {
    targetBtn = document.getElementById('lbtn-3');
    targetContent = document.getElementById('level-content-3');
  }
  if (!targetBtn) return;

  targetBtn.classList.remove('level-btn--locked');
  targetBtn.classList.add('level-btn--just-unlocked');
  targetBtn.onclick = () => switchSpeakLevel(completedLevel === 'task' ? 2 : 3);

  // Убрать 🔒 из названия
  const nameEl = targetBtn.querySelector('.level-btn-name');
  if (nameEl) nameEl.textContent = nameEl.textContent.replace(' 🔒', '');

  // Анимация — убрать класс через секунду
  setTimeout(() => targetBtn.classList.remove('level-btn--just-unlocked'), 1200);

  // Показать контент если не скрыт из-за режима "tired"
  const encourageVisible = document.getElementById('mood-encourage')?.style.display === 'block';
  if (!encourageVisible && targetContent) {
    // Контент пока не показываем — студент сам нажмёт кнопку
  }
}

function lockedLevelClick(level) {
  const btn = document.getElementById('lbtn-' + level);
  if (!btn) return;
  btn.classList.add('level-btn--shake');
  setTimeout(() => btn.classList.remove('level-btn--shake'), 500);

  // Краткое сообщение
  const switcher = document.getElementById('level-switcher');
  if (switcher) {
    let hint = switcher.querySelector('.level-lock-hint');
    if (!hint) {
      hint = document.createElement('div');
      hint.className = 'level-lock-hint';
      switcher.appendChild(hint);
    }
    hint.textContent = level === 2 ? 'Erst Niveau 1 abschicken ↑' : 'Erst Niveau 1 und 2 abschicken ↑';
    hint.style.display = 'block';
    clearTimeout(hint._timeout);
    hint._timeout = setTimeout(() => { hint.style.display = 'none'; }, 2500);
  }
}

// ── Аудио-архив "Meine Stimme — Reise" ───────────────────────────────────────
async function loadAudioJourney() {
  const container = document.getElementById('audio-journey-list');
  if (!container || !_studentId) return;

  const db = typeof firebase !== 'undefined' ? firebase.database() : null;
  if (!db) { container.innerHTML = '<div class="audio-journey-empty">Keine Aufnahmen verfügbar.</div>'; return; }

  try {
    const snap = await db.ref('submissions/' + _studentId).once('value');
    const allSubs = snap.val() || {};

    // Собираем все записи с аудио
    const entries = [];
    for (const [date, dayData] of Object.entries(allSubs)) {
      if (typeof dayData !== 'object') continue;
      for (const [level, levelData] of Object.entries(dayData)) {
        if (level === 'teacherFeedback') continue;
        const url = levelData?.audioUrl || (levelData?.audioData ? 'data:audio/webm;base64,' + levelData.audioData : null);
        if (url) {
          const levelLabel = level === 'task' ? 'Niveau 1' : level === 'deepen' ? 'Niveau 2' : level === 'immerse' ? 'Niveau 3' : level;
          entries.push({ date, level, levelLabel, url });
        }
      }
    }

    if (entries.length === 0) {
      container.innerHTML = '<div class="audio-journey-empty">Noch keine Aufnahmen. Nach der ersten Einreichung erscheinen sie hier.</div>';
      return;
    }

    // Группируем по месяцу
    entries.sort((a, b) => b.date.localeCompare(a.date));
    const byMonth = {};
    for (const e of entries) {
      const [year, month] = e.date.split('-');
      const monthKey = `${year}-${month}`;
      const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
      if (!byMonth[monthKey]) byMonth[monthKey] = { label: monthLabel, items: [] };
      byMonth[monthKey].items.push(e);
    }

    let html = '';
    for (const [, { label, items }] of Object.entries(byMonth)) {
      html += `<div class="audio-month-group">
        <div class="audio-month-label">${label} · ${items.length} Aufnahme${items.length !== 1 ? 'n' : ''}</div>`;
      for (const item of items) {
        const dateFormatted = new Date(item.date).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
        html += `<div class="audio-journey-item">
          <div class="audio-journey-meta">${dateFormatted} · ${item.levelLabel}</div>
          <audio controls preload="none" class="audio-journey-player" src="${item.url}"></audio>
        </div>`;
      }
      html += '</div>';
    }
    container.innerHTML = html;
  } catch(e) {
    container.innerHTML = '<div class="audio-journey-empty">Fehler beim Laden der Aufnahmen.</div>';
  }
}

