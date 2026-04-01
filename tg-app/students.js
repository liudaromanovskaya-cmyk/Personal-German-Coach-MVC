// ═══════════════════════════════════════════════════════════
// ДАННЫЕ СТУДЕНТОВ — здесь всё менять и добавлять
// Чтобы добавить нового студента:
//   1. Скопируй блок artem: { ... } ниже
//   2. Замени имя ключа (например: anna)
//   3. Замени все поля под этого студента
//   4. Студент получит ссылку: ?student=anna
// ═══════════════════════════════════════════════════════════

const STUDENTS = {
  artem: {
    name: 'Artem',
    level: 'B2/C1',
    template: 'c1_goethe',  // шаблон из levels.js
    currentModule: 11,       // модуль где сейчас (Passiv)
    currentLektion: 2,       // урок где сейчас
    progressText: 'Deutlich präziser geworden — besonders in schriftlichen Texten',
    goal: { title: 'Goethe-Zertifikat C1 bestehen', deadline: 'Dezember 2026' },
    milestones: [
      { label: 'Grammatik stabilisieren',    status: 'done' },
      { label: 'Schreiben auf C1-Niveau',    status: 'active', sub: 'Sie sind hier' },
      { label: 'Mündlicher Ausdruck C1',     status: 'upcoming' },
    ],
    review: {
      topic: 'Nominalisierung — kurze Wiederholung',
      text: 'Erinnern Sie sich: Verben werden zu Substantiven. «entscheiden» → «die Entscheidung». Schauen Sie sich Ihre Aufgabe vom 11. März an — haben Sie die Korrekturen notiert?',
    },
    task: {
      topic: 'Passiv — Stellung im Nebensatz',
      text: 'Schreiben Sie 5 Sätze aus dem Text im Passiv um. Achten Sie besonders auf die Stellung des Hilfsverbs im Nebensatz.',
      estimate: '20–25 Minuten',
      deadline: '15. März',
      hint: 'Im Nebensatz steht das Hilfsverb „werden" immer an letzter Stelle: «..., dass das Projekt abgeschlossen wird.» — nicht «wird abgeschlossen».',
      link: 'https://aussprachetraining.goethe.de/lesson/602ec08cc2227afbba1adb3d',
    },
    deepen: {
      topic: 'Passiv im eigenen Text',
      text: 'Schreiben Sie einen kurzen Absatz (5–7 Sätze) über ein Projekt bei der Arbeit oder aus dem Alltag — im Passiv. Mindestens 2 Nebensätze mit Passiv.',
    },
    immerse: {
      topic: 'Passiv in echten Texten finden',
      text: 'Lesen Sie einen kurzen Artikel auf tagesschau.de oder spiegel.de (3–5 Minuten). Unterstreichen Sie alle Passiv-Konstruktionen. Wie viele haben Sie gefunden? Schicken Sie mir die interessantesten 3.',
    },
    feedback: {
      date: '11. März',
      text: 'Artem, gute Arbeit mit der Nominalisierung — man sieht, dass die Regel automatischer geworden ist. In Satz 3 der Artikel: «der Beschluss», nicht «die». Typische Fossilisierung — wir erkennen sie und üben weiter zusammen.',
      score: 'Guter Fortschritt 📈',
    },
    // Lexik: ссылки на 3 колоды. null = показывает "Ссылка появится здесь".
    // bank    — весь банк слов (Quizlet / Google Sheets / Anki)
    // aktuell — текущая тема (что сейчас учим)
    // niveau  — всё для C1 (Redemittel + предложения + карточки)
    lexik: {
      bank:    null,
      aktuell: null,
      niveau:  null,
    },

    // Prüfungskriterien: Bewertungsraster pro Fertigkeit. null = Platzhalter.
    // Beispiel: lesen: { kriterien: ['Globales Verstehen', 'Detailverstehen'], link: 'https://...' }
    pruefung: {
      lesen:     null,
      hoeren:    null,
      schreiben: null,
      sprechen:  null,
    },

    // Methodik: Tipps nach Fertigkeit (in Bibliothek). null = Platzhalter.
    // Beispiel: lesen: { tipps: ['Tipp 1', 'Tipp 2'], link: 'https://...' }
    methodik: {
      lesen:     null,
      hoeren:    null,
      schreiben: null,
      sprechen:  null,
    },
    // Aktuelles Buch. null = kein Buch zugewiesen.
    // Beispiel: { title: 'Der Vorleser', author: 'Bernhard Schlink', note: 'C1-Lektüre', link: null }
    book: null,

    // Lücken: status 'sos' | 'aktiv' | 'geloest'  by: 'lehrerin' | 'student'
    gaps: [
      { id: 'a1', level: 'B1', category: 'Grammatik', text: 'Dativ-Artikel im schnellen Sprechen — «dem» / «den» verwechselt', status: 'sos', by: 'lehrerin', date: '11. März' },
      { id: 'a2', level: 'B2', category: 'Grammatik', text: 'Reflexive Verben im Nebensatz — Position von «sich» nicht automatisch', status: 'sos', by: 'lehrerin', date: '11. März' },
      { id: 'a3', level: 'B1', category: 'Wortschatz', text: 'Präpositionen mit Dativ / Akkusativ — Unsicherheit in echten Gesprächen', status: 'aktiv', by: 'lehrerin', date: '5. März' },
      { id: 'a4', level: 'B2', category: 'Sprechen', text: 'Übergang zwischen Themen im Monolog — stockt, sucht Redemittel', status: 'aktiv', by: 'lehrerin', date: '5. März' },
    ],
    // personal: 'up' | 'stable' | 'down' — Sie setzen das nach dem Unterricht
    // done: true/false — Sie haken ab wenn der Student das Thema beherrscht
    // pct wird automatisch berechnet: done/total * 100
    skills: [
      { name: 'Hören', icon: '🎧', personal: 'up', note: 'Längere Texte werden deutlich leichter', criteria: [
        { label: 'Vorträge und Reden (20+ Min.) verstehen', done: true },
        { label: 'Verschiedene Akzente und Sprechtempo', done: true },
        { label: 'Implizite Bedeutungen und Ironie erkennen', done: false },
        { label: 'Authentische Medientexte (Radio, TV)', done: true },
        { label: 'Prüfung: Radiobeiträge / Interviews (Aufgabe 1–3)', done: false },
      ]},
      { name: 'Sprechen', icon: '🗣️', personal: 'stable', note: 'Tempo ist gut — Spontaneität üben', criteria: [
        { label: 'Spontan und fließend zu Themen sprechen', done: false },
        { label: 'Ideen präzise und nuanciert ausdrücken', done: false },
        { label: 'Prüfung: Monolog (3–4 Min.) — ein Thema entwickeln', done: false },
        { label: 'Prüfung: Diskussion mit Gesprächspartner', done: false },
        { label: 'Redemittel zur Argumentation aktiv nutzen', done: false },
      ]},
      { name: 'Lesen', icon: '📖', personal: 'up', note: 'C1-Texte sind spürbar leichter geworden', criteria: [
        { label: 'Lange, komplexe Texte (Fachartikel, Essays)', done: true },
        { label: 'Implizite Bedeutungen und Autorenabsicht erfassen', done: true },
        { label: 'Literarische Texte und Prosa verstehen', done: false },
        { label: 'Prüfung: Lückentexte / Satzteile zuordnen', done: true },
        { label: 'Prüfung: Multiple Choice zu langen Texten', done: false },
      ]},
      { name: 'Schreiben', icon: '✍️', personal: 'up', note: 'Struktur und Präzision wachsen sichtbar', criteria: [
        { label: 'Klare Textstruktur (Einleitung – Hauptteil – Schluss)', done: true },
        { label: 'Erörterung / Stellungnahme (Prüfungsteil)', done: false },
        { label: 'Formeller Brief oder E-Mail auf C1-Niveau', done: false },
        { label: 'Komplexe Satzkonstruktionen aktiv einsetzen', done: false },
        { label: 'Stilsicherheit: Register und Ton anpassen', done: false },
      ]},
      { name: 'Grammatik', icon: '🔧', personal: 'up', note: 'Passiv und Nebensätze werden sicherer', criteria: [
        { label: 'Passiv (alle Formen und Zeiten)', done: true },
        { label: 'Nominalisierung von Verben und Adjektiven', done: true },
        { label: 'Konjunktiv II (inkl. indirekte Rede)', done: false },
        { label: 'Partizipialkonstruktionen', done: false },
        { label: 'Infinitivkonstruktionen (statt dass-Sätze)', done: false },
        { label: 'Erweitertes Attribut', done: false },
      ]},
      { name: 'Wortschatz', icon: '📝', personal: 'stable', note: 'Neues Vokabular — noch mehr aktivieren', criteria: [
        { label: 'Thema: Beruf & Karriere', done: true },
        { label: 'Thema: Gesellschaft & Politik', done: false },
        { label: 'Thema: Wissenschaft & Forschung', done: false },
        { label: 'Thema: Kultur & Medien', done: false },
        { label: 'Bildungssprache: Synonyme & Umschreibungen aktiv', done: false },
        { label: 'Idiomatische Ausdrücke (20+ im aktiven Gebrauch)', done: false },
      ]},
    ],
    grammar: [
      {
        status: 'done',
        topic: 'Nominalisierung',
        level: 'C1',
        warum: 'Damit Berichte, Präsentationen und C1-Texte professionell und präzise klingen.',
        summary: 'Verben und Adjektive werden zu Substantiven umgewandelt. Typisch für formelle Texte, Berichte, C1-Prüfungen.',
        example: '«entscheiden» → «die Entscheidung treffen»\n«untersuchen» → «die Untersuchung durchführen»',
      },
      {
        status: 'current',
        topic: 'Passiv im Nebensatz',
        level: 'C1',
        warum: 'Damit Nebensätze in Berichten und formellen Texten grammatikalisch korrekt sind.',
        summary: 'Im Nebensatz steht das Hilfsverb „werden" immer am Ende — nach dem Partizip II. Diese Position ist fest, egal wie lang der Satz ist.',
        example: '✓ «..., dass das Projekt abgeschlossen wird.»\n✗ «..., dass wird das Projekt abgeschlossen.»',
      },
      {
        status: 'upcoming',
        topic: 'Konjunktivformen C1',
        level: 'C1',
        warum: 'Für Hypothesen, indirekte Rede und höfliche Formulierungen auf C1-Niveau.',
      },
      {
        status: 'upcoming',
        topic: 'Mündlicher Ausdruck — Stellungnahme',
        level: 'C1',
        warum: 'Damit Argumente bei der C1-Prüfung strukturiert und überzeugend klingen.',
      },
    ],
  },

  olga: {
    name: 'Olga',
    level: 'B1 → B2',
    progressText: 'Toller Start — die Systematik ist schon zu erkennen',
    goal: { title: 'Sicheres B2 — flüssig und automatisch sprechen', deadline: 'Herbst 2026' },
    milestones: [
      { label: 'Grundstrukturen aktivieren',  status: 'active', sub: 'Sie sind hier' },
      { label: 'Automatisierung im Sprechen', status: 'upcoming' },
      { label: 'B2-Prüfung ablegen',          status: 'upcoming' },
    ],
    review: {
      topic: 'Mittelpunkt B2 — Lektion 3A: Wortschatz Freundschaft',
      text: 'Heute arbeiten wir mit echten Ausdrücken aus dem Lehrbuch. Schauen Sie sich kurz die Bedeutungen an — kennen Sie schon welche?',
    },
    task: {
      topic: 'Aufwärmen — Was machst du gerade so?',
      text: 'Eine Bekannte fragt: „Was machst du gerade so in deiner Freizeit?"\n\nErzählen Sie kurz — Sport, Ausflüge, Pläne, kleine Freuden. 5 Sätze.\n\nVerwenden Sie:\n• sich befinden → „Ich befinde mich gerade in einer aktiven Phase"\n• sich wohl fühlen → „Beim Sport fühle ich mich am wohlsten"\n• sich freuen auf → „Ich freue mich auf das Theaterstück am Wochenende"\n• sich unterhalten mit → „Ich unterhalte mich gern mit Freunden bei einem Spaziergang"\n• eine Fahrt → „Wir planen eine Fahrt ins Grüne"',
      estimate: '10 Minuten',
      deadline: '5. April',
      hint: 'Einstieg: „Im Moment bin ich viel draußen. Ich freue mich besonders auf... Beim Sport fühle ich mich..."',
    },
    deepen: {
      topic: 'Situation — Was gibt dir Kraft?',
      text: 'Eine Kollegin fragt: „Wie schaffst du es, nach der Arbeit noch Energie zu haben? Was ist dein Geheimnis?"\n\nErzählen Sie — was Ihnen Kraft gibt, wie Sie sich erholen, worauf es Ihnen im Leben ankommt. 7–8 Sätze.\n\nPräpositionalverben — alle verwenden:\n• Worauf freust du dich? → Ich freue mich auf...\n• Worauf kommt es dir an? → Es kommt mir darauf an...\n• Wovon hängt deine Energie ab? → Das hängt davon ab...\n• Woran denkst du nach der Arbeit? → Ich denke daran...\n• Woran arbeitest du gerade? → Ich arbeite daran...\n\nWeitere Wörter:\nermöglichen · beitragen zu · beeinflussen · die Erkenntnis · übertreiben · führen zu\n\nTipp: „Für mich kommt es darauf an, dass ich regelmäßig Sport mache. Das ermöglicht mir... Ich habe die Erkenntnis gehabt, dass..."',
    },
    immerse: {
      topic: 'Ihre Geschichte — Ein Moment der zählt',
      text: 'Erzählen Sie von einem Ausflug, einem Sporterlebnis oder einem besonderen Moment — ein Abend, ein Spaziergang, etwas das Sie aufgetankt hat.\n\nKeine perfekten Sätze nötig — einfach erzählen.\n\nAlle Wörter dieser Woche stehen Ihnen zur Verfügung:\nin Erfüllung gehen · im Vergleich zu · die Erkenntnis · beitragen zu · worum geht es · übernehmen · der Strom · retten · sich erholen\n\nBeispiele:\n• „In diesem Moment ging ein kleiner Wunsch in Erfüllung"\n• „Im Vergleich zum Alltag war das wie eine andere Welt"\n• „Solche Abende retten manchmal die ganze Woche"\n\nTipp zum Einstieg: „Ich erinnere mich an einen Moment, als... Im Vergleich zum normalen Alltag war das... Ich hatte dabei die Erkenntnis..."',
    },
    writing: {
      task: {
        topic: 'Schreiben — Aufwärmen',
        text: 'Schreiben Sie 5 Sätze: Was machen Sie gerade in Ihrer Freizeit?\n\nVerwenden Sie:\n• sich befinden · sich wohl fühlen · sich freuen auf · fehlen · eine Fahrt\n\nTipp: „Im Moment befinde ich mich... Ich fühle mich besonders wohl, wenn... Mir fehlt manchmal..."',
      },
      deepen: {
        topic: 'Schreiben — Was gibt dir Kraft?',
        text: 'Schreiben Sie 7–8 Sätze an eine Freundin: Was hilft Ihnen nach einem langen Tag?\n\nPräpositionalverben — alle einbauen:\nankommen auf · abhängen von · sich freuen auf · denken an · arbeiten an\n\nWeitere Wörter:\nermöglichen · beitragen zu · die Erkenntnis · führen zu · beeinflussen\n\nTipp: „Für mich kommt es darauf an... Das hängt davon ab... Ich habe die Erkenntnis gehabt, dass..."',
      },
      immerse: {
        topic: 'Schreiben — Ihr besonderer Moment',
        text: 'Schreiben Sie einen kurzen Text (8–10 Sätze) über einen Moment der Ihnen Energie gegeben hat — ein Ausflug, ein Abend, ein Erlebnis in der Natur.\n\nAlle Wörter dieser Woche zur Auswahl:\nin Erfüllung gehen · im Vergleich zu · die Erkenntnis · beitragen zu · retten · sich erholen · übernehmen · der Wohlstand · worum geht es\n\nTipp: „Es war ein Abend, als... Im Vergleich zum Alltag... Das hat dazu geführt, dass ich..."',
      },
    },
    sprint: {
      week: 'April 2026 — Woche 1',
      // Все слова с живых занятий — полный банк
      allWords: [
        'sich befinden', 'in der Region', 'eine Fahrt', 'übertreiben', 'übernachten', 'übersetzen',
        'überfahren', 'überqueren', 'erlauben', 'die Erlaubnis', 'möglich', 'ermöglichen',
        'Das ermöglicht / ermöglichte / hat ermöglicht', 'führen zu + Dat.',
        'Das hat dazu geführt, dass...', 'das Unternehmen', 'übernehmen',
        'Werte übernehmen', 'Verantwortung übernehmen', 'das Geschäft übernehmen',
        'Das erlaubt uns', 'der Staat', 'unterbrechen', 'die Rettung', 'retten + Akk.',
        'der Rettungsdienst', 'sich unterhalten mit + Dat.', 'worum geht es',
        'gehen um + Akk.', 'der Stoff', 'der Lernstoff', 'rechnen', 'der Mentor',
        'fehlen', 'anwenden', 'die Anwendung', 'der Zweifel', 'die Wiederholung',
        'interessiert an + Dat.', 'das Interesse an + Dat.', 'sich interessieren für + Akk.',
        'die Erkenntnis', 'die Lücke', 'der Strom', 'die Heizung', 'überfordert sein',
        'die Senkung der Motivation', 'kraftlos', 'zittern', 'beeinflussen',
        'Einfluss auf etw. nehmen', 'sich beziehen auf + Akk.', 'der Bezug auf + Akk.',
        'bezüglich', 'ankommen auf + Akk.', 'abhängen von + Dat.',
        'Es kommt darauf an', 'das hängt davon ab', 'sich freuen auf', 'warten auf',
        'sich erinnern an + Akk.', 'denken an + Akk.', 'arbeiten an + Dat.',
        'vergleichen', 'der Vergleich', 'im Vergleich zu', 'das Volk',
        'sich wohl fühlen', 'der Wohlstand', 'die Wohlfahrt',
        'ausgehen von + Dat.', 'eintreten', 'vertreten in + Dat.',
        'beitragen zu + Dat.', 'der Garten', 'der Gärtner', 'der Kindergarten',
        'in Erfüllung gehen', 'erfüllt werden', 'einen Traum erfüllen',
      ],
      // Задание одного дня — 6 слов с чанками
      // grammarTag: тип глагола для подсветки
      // verbForms: формы глагола которые подсвечиваем в примерах
      // prep: предлог если есть — подсвечиваем управление
      today: {
        date: '1. April',
        theme: 'Ein Ausflug am Wochenende',
        words: [
          {
            word: 'sich befinden',
            grammarTag: 'reflexiv',
            hint: 'wo man ist / wie die Lage ist',
            verbForms: ['befinden', 'befinde', 'befindest', 'befindet', 'befand', 'befunden'],
            chunks: [
              'Wo [befinden] Sie [sich] gerade?',
              'Ich [befinde] [mich] gerade in einer aktiven Phase.',
              'Das Hotel [befindet] [sich] direkt am See.',
            ],
          },
          {
            word: 'eine Fahrt machen',
            grammarTag: 'Verb + Nomen',
            hint: 'Ausflug, Reise, Strecke',
            verbForms: ['machen', 'mache', 'machst', 'macht', 'gemacht'],
            chunks: [
              'Wir haben eine Fahrt ins Grüne [gemacht].',
              'Die Fahrt hat zwei Stunden gedauert.',
              'Eine kurze Fahrt — aber so wertvoll!',
            ],
          },
          {
            word: 'ermöglichen',
            grammarTag: 'insep.',
            hint: 'etwas möglich machen',
            verbForms: ['ermöglichen', 'ermöglicht', 'ermöglichte', 'ermöglicht'],
            chunks: [
              'Das [ermöglicht] mir, mehr Zeit draußen zu verbringen.',
              'Der freie Tag hat uns diese Fahrt [ermöglicht].',
              'Das hat uns [ermöglicht], endlich abzuschalten.',
            ],
          },
          {
            word: 'in Erfüllung gehen',
            grammarTag: 'feste Wendung',
            hint: 'ein Wunsch wird wahr',
            verbForms: ['gehen', 'geht', 'ging', 'gegangen'],
            chunks: [
              'Mein kleiner Wunsch ist in Erfüllung [gegangen].',
              'Ich wünsche dir, dass deine Träume in Erfüllung [gehen].',
              'Endlich ist es in Erfüllung [gegangen]!',
            ],
          },
          {
            word: 'sich unterhalten mit',
            grammarTag: 'reflexiv + mit + Dat.',
            hint: 'sprechen, plaudern — mit wem?',
            prep: 'mit',
            verbForms: ['unterhalten', 'unterhalte', 'unterhältst', 'unterhält', 'unterhielt'],
            chunks: [
              'Ich habe [mich] lange [mit ihr] [unterhalten].',
              '[Mit wem] haben Sie [sich] [unterhalten]?',
              'Wir haben [uns] wunderbar [unterhalten].',
            ],
          },
          {
            word: 'worum geht es',
            grammarTag: 'gehen um + Akk.',
            hint: 'was ist das Thema / der Kern',
            prep: 'um',
            verbForms: ['gehen', 'geht', 'ging', 'gegangen'],
            chunks: [
              '[Worum] [geht] es in diesem Film?',
              '[Worum] [geht] es dir eigentlich?',
              'Es [geht] darum, dass wir mehr Zeit füreinander haben.',
            ],
          },
        ],
        task: {
          topic: 'Aufwärmen — Wo warst du am Wochenende?',
          prompt: 'Eine Bekannte fragt: „Wo warst du am Wochenende? Was hast du gemacht?"',
          instruction: '5 Sätze. Kein Perfekt nötig — einfach erzählen.',
          hint: 'Einstieg: „Am Wochenende befand ich mich... Wir haben eine Fahrt gemacht... Das hat mir ermöglicht..."',
        },
        words2: [
          { word: 'abschalten', hint: 'den Kopf frei machen, Stress vergessen' },
          { word: 'genießen', hint: 'bewusst, mit Freude erleben' },
          { word: 'sich erholen', hint: 'neue Kraft schöpfen' },
          { word: 'der Ausblick', hint: 'Blick in die Ferne — auch übertragen: Perspektive' },
          { word: 'innehalten', hint: 'kurz stoppen, nachdenken, atmen' },
          { word: 'loslassen', hint: 'loslassen von Gedanken, Stress, Alltag' },
        ],
        words3: [
          { word: 'prägen', hint: 'etwas hinterlässt einen bleibenden Eindruck' },
          { word: 'aufatmen', hint: 'Erleichterung spüren, endlich frei sein' },
          { word: 'der Alltag', hint: 'das tägliche Einerlei — was man durchbricht' },
          { word: 'bewusst werden', hint: 'etwas erkennen, was man vorher nicht gesehen hat' },
          { word: 'entfalten', hint: 'sich entfalten = sich frei entwickeln, aufblühen' },
        ],
        deepen: {
          topic: 'Situation — Ein Moment der zählt',
          prompt: 'Ihre Kollegin fragt: „Hattest du letzte Woche einen schönen Moment? Erzähl mal!"',
          instruction: '7–8 Sätze. Nutzen Sie die Wörter von Niveau 1 und die neuen Ausdrücke.',
          hint: '„Es war ein Moment, als... Das hat mir ermöglicht abzuschalten... Ich habe genossen... In diesem Moment ging ein kleiner Wunsch in Erfüllung..."',
        },
        immerse: {
          topic: 'Ihre Geschichte — Was bedeutet das für Sie?',
          prompt: 'Erinnern Sie sich an einen Ausflug oder Moment, der Ihnen gut getan hat. Was hat er in Ihnen geprägt?',
          instruction: 'Erzählen Sie frei — alle Wörter aus Niveau 1, 2 und 3 stehen Ihnen zur Verfügung. So lange wie Sie möchten.',
          hint: '',
        },
        // Письменный вариант — отдельные задания
        writingTask: {
          topic: 'Schreiben — Aufwärmen',
          instruction: 'Schreiben Sie 5 Sätze: Wo waren Sie am Wochenende?\n\nVerwenden Sie:\n• sich befinden · eine Fahrt · ermöglichen\n\nTipp: „Am Wochenende befand ich mich... Wir haben eine Fahrt gemacht... Das hat mir ermöglicht..."',
        },
        writingDeepen: {
          topic: 'Schreiben — Ein besonderer Moment',
          instruction: 'Schreiben Sie 7–8 Sätze an eine Freundin über einen Moment der Ihnen gut getan hat.\n\nVerwenden Sie alle 6 Wörter des Tages:\nsich befinden · eine Fahrt · ermöglichen · in Erfüllung gehen · sich unterhalten mit · worum geht es\n\nTipp: „Es war ein Nachmittag, als... Worum es dabei wirklich ging... In diesem Moment ging etwas in Erfüllung..."',
        },
      },
    },
    lexik: {
      bank: null,
      aktuell: {
        title: 'April-Sprint — Woche 1',
        description: 'Präpositionalverben + Verben des Ermöglichens + Alltagswortschatz',
        words: ['sich befinden', 'eine Fahrt', 'ermöglichen', 'in Erfüllung gehen', 'sich unterhalten mit', 'worum geht es', 'sich erinnern an', 'ankommen auf', 'abhängen von', 'arbeiten an', 'sich freuen auf', 'beitragen zu', 'führen zu', 'übernehmen', 'beeinflussen', 'sich wohl fühlen', 'die Erkenntnis', 'der Zweifel', 'überfordert sein', 'fehlen', 'der Strom', 'retten'],
        link: null,
      },
      niveau: null,
      archiv: [],
    },
    gaps: [
      { id: 'o1', level: 'A2', category: 'Grammatik', text: 'Verbendungen in der 3. Person — «sie hat» / «er haben» Fehler unter Druck', status: 'sos', by: 'lehrerin', date: '11. März' },
      { id: 'o2', level: 'B1', category: 'Wortschatz', text: 'Konnektoren fehlen — Sätze werden nicht verbunden, alles in Einzelsätzen', status: 'aktiv', by: 'lehrerin', date: '5. März' },
    ],
    skills: [
      { name: 'Hören', icon: '🎧', personal: 'up', note: 'Alltagsgespräche gut verständlich', criteria: [
        { label: 'Alltagsgespräche und Diskussionen verstehen', done: true },
        { label: 'Berichte und Interviews im Radio', done: false },
        { label: 'Hauptaussagen in längeren Vorträgen', done: false },
        { label: 'Prüfung: Dialog / Diskussion hören (Aufgabe)', done: false },
      ]},
      { name: 'Sprechen', icon: '🗣️', personal: 'up', note: 'Erste Sätze fließender — gut!', criteria: [
        { label: 'Zu vertrauten Themen flüssig sprechen', done: true },
        { label: 'Meinung ausdrücken und begründen', done: false },
        { label: 'An Gesprächen und Diskussionen teilnehmen', done: false },
        { label: 'Prüfung: Bild beschreiben + Diskussion', done: false },
      ]},
      { name: 'Lesen', icon: '📖', personal: 'stable', note: 'B1-Texte sicher, B2 in Arbeit', criteria: [
        { label: 'Alltagstexte und einfache Fachartikel', done: true },
        { label: 'Zeitungsartikel zu aktuellen Themen', done: false },
        { label: 'Prüfung: Textabschnitte zuordnen', done: false },
        { label: 'Detailverständnis in längeren Texten', done: false },
      ]},
      { name: 'Schreiben', icon: '✍️', personal: 'up', note: 'Struktur wird klarer — weiter so', criteria: [
        { label: 'Einfache Texte strukturiert schreiben', done: true },
        { label: 'Formeller Brief / E-Mail (beruflich)', done: false },
        { label: 'Stellungnahme zu einem Thema', done: false },
        { label: 'Prüfung: Brief oder Erörterung (250 Wörter)', done: false },
      ]},
      { name: 'Grammatik', icon: '🔧', personal: 'up', note: 'Konjunktiv II — aktiv in Übung', criteria: [
        { label: 'Grundstrukturen sicher (Verb Pos. 2, Nebensätze)', done: true },
        { label: 'Konjunktiv II für höfliche Kommunikation', done: false },
        { label: 'Relativsätze (Nom., Akk., Dat.)', done: false },
        { label: 'Zweiteilige Konnektoren (sowohl... als auch...)', done: false },
      ]},
      { name: 'Wortschatz', icon: '📝', personal: 'stable', note: 'Berufswortschatz aufbauen', criteria: [
        { label: 'Thema: Alltag & Familie', done: true },
        { label: 'Thema: Beruf & Büro', done: false },
        { label: 'Thema: Gesundheit & Freizeit', done: false },
        { label: 'Feste Ausdrücke & Redewendungen (10+ aktiv)', done: false },
      ]},
    ],
    feedback: {
      date: '31. März',
      notifText: 'Ihr Feedback ist da! Heute: wie klingt Erschöpfung auf Deutsch — wie ein echter Berliner.',
      blocks: [
        {
          said: 'Ich war sehr müde nach der Arbeit.',
          native: 'Ich war total am Ende.',
          nativeNote: '— живо, точно. Именно так говорят коллеги в пятницу вечером.',
          praise: '«eingespannt» — вы использовали это слово точно в нужный момент. Это уже B2.',
          anchor: '«am Ende sein» — представьте: лампочка мигает и гаснет. Заряд кончился. Вот так немец чувствует усталость — она заканчивается, как батарейка.',
          question: 'А когда у вас последний раз Akku закончился?',
          questionDE: 'Wann ist bei Ihnen zuletzt der Akku leer geworden?',
          questionHint: 'Используйте: «Ich war total am Ende, als...»',
        },
      ],
      feedbackWords: ['total am Ende', 'der Akku ist leer', 'am Ende sein', 'eingespannt'],
    },
    diary: {
      active: true,
      title: 'Tagebuch — April-Sprint',
      instruction: 'Schreiben Sie jeden Tag 5 Sätze auf Deutsch — oder schicken Sie eine Sprachnachricht. Thema: was auch immer heute passiert ist.',
      sentenceTarget: 5,
      prompt: 'Was ist heute passiert? Wo waren Sie? Mit wem? Was haben Sie gefühlt? Was denken Sie darüber?',
      streak: 0,
      totalDone: 0,
      goalDays: 19,
      note: 'April-Sprint: Sprechen aktivieren. Fehler sind erlaubt — der Mut zählt.',
    },
    grammar: [
      {
        status: 'current',
        topic: 'Präpositionalverben',
        level: 'B1–B2',
        warum: 'Diese Verben klingen sofort natürlich — genau wie ein Muttersprachler. Ohne sie klingt die Sprache steif.',
        summary: 'Verben mit festen Präpositionen + Pronominaladverbien (daran, darauf, davon...)',
        example: 'sich erinnern an → Woran erinnerst du dich? — Ich erinnere mich daran.\nankommen auf → Worauf kommt es an? — Es kommt darauf an.\nabhängen von → Wovon hängt das ab? — Das hängt davon ab.\narbeiten an → Woran arbeitest du? — Daran arbeite ich gerade.\nsich freuen auf → Worauf freust du dich? — Ich freue mich darauf.',
      },
      {
        status: 'current',
        topic: 'Konjunktiv II',
        level: 'B2',
        warum: 'Damit Sie im Beruf höflich und professionell klingen — unerlässlich im deutschen Arbeitsalltag.',
        summary: 'Wird für höfliche Bitten, Wünsche und irreale Situationen verwendet. Wichtig im Berufsleben.',
        example: '«Könnten Sie mir helfen?» — höflich ✓\n«Ich würde gern... / Das sollte man...»',
      },
      {
        status: 'upcoming',
        topic: 'Relativsätze',
        level: 'B2',
        warum: 'Damit Sie Personen und Dinge präzise beschreiben können, ohne Sätze abzuhacken.',
      },
      {
        status: 'upcoming',
        topic: 'Zweiteilige Konnektoren',
        level: 'B2',
        warum: 'Für komplexe Argumente und fließende Übergänge zwischen Gedanken.',
      },
    ],
  },

  mikhail: {
    name: 'Mikhail',
    level: 'A2/B1',
    progressText: 'Guter Start — wir bauen gemeinsam das Fundament',
    goal: { title: 'Sicher auf Deutsch im Alltag kommunizieren', deadline: 'Herbst 2026' },
    milestones: [
      { label: 'Grundwortschatz aufbauen',   status: 'active', sub: 'Sie sind hier' },
      { label: 'Alltagsgespräche führen',     status: 'upcoming' },
      { label: 'B1 erreichen',               status: 'upcoming' },
    ],
    review: null,
    task: {
      topic: 'Sich vorstellen — auf Deutsch',
      text: 'Schreiben Sie 5 Sätze über sich selbst: Name, Herkunft, Beruf, Hobby, warum Sie Deutsch lernen. Keine Angst vor Fehlern — das ist ein Anfang!',
      estimate: '15 Minuten',
      deadline: '1. April',
      hint: 'Muster: «Ich heiße... Ich komme aus... Ich arbeite als... Mein Hobby ist... Ich lerne Deutsch, weil...»',
    },
    deepen: null,
    immerse: null,
    feedback: null,
    lexik: { bank: null, aktuell: null, niveau: null },
    pruefung: { lesen: null, hoeren: null, schreiben: null, sprechen: null },
    methodik: { lesen: null, hoeren: null, schreiben: null, sprechen: null },
    book: null,
    gaps: [],
    skills: [
      { name: 'Hören', icon: '🎧', personal: 'stable', note: 'Einfache Sätze gut verstehen', criteria: [
        { label: 'Einfache Alltagsgespräche verstehen', done: false },
        { label: 'Zahlen, Zeiten, Preise hören', done: false },
        { label: 'Kurze Ansagen und Durchsagen', done: false },
      ]},
      { name: 'Sprechen', icon: '🗣️', personal: 'stable', note: 'Erste Schritte — Mut ist da!', criteria: [
        { label: 'Sich vorstellen', done: false },
        { label: 'Einkaufen und bestellen', done: false },
        { label: 'Um Hilfe bitten', done: false },
      ]},
      { name: 'Lesen', icon: '📖', personal: 'stable', note: 'Einfache Texte lesen', criteria: [
        { label: 'Kurze Nachrichten lesen', done: false },
        { label: 'Schilder und Formulare verstehen', done: false },
        { label: 'Einfache E-Mails lesen', done: false },
      ]},
      { name: 'Schreiben', icon: '✍️', personal: 'stable', note: 'Erste Sätze schreiben', criteria: [
        { label: 'Sich schriftlich vorstellen', done: false },
        { label: 'Kurze Nachrichten schreiben', done: false },
        { label: 'Einfache Formulare ausfüllen', done: false },
      ]},
      { name: 'Grammatik', icon: '🔧', personal: 'stable', note: 'Grundstrukturen aufbauen', criteria: [
        { label: 'Verb auf Position 2', done: false },
        { label: 'Artikel: der / die / das', done: false },
        { label: 'Präsens — alle Personen', done: false },
      ]},
      { name: 'Wortschatz', icon: '📝', personal: 'stable', note: 'Grundwortschatz Alltag', criteria: [
        { label: 'Zahlen und Zeiten', done: false },
        { label: 'Familie und Beruf', done: false },
        { label: 'Essen und Einkaufen', done: false },
      ]},
    ],
    grammar: [
      {
        status: 'current',
        topic: 'Verb auf Position 2',
        level: 'A1',
        warum: 'Das ist die wichtigste Regel im Deutschen — ohne sie klingt kein Satz richtig.',
        summary: 'Das Verb steht immer auf Platz 2 im Satz. Immer.',
        example: '«Ich lerne Deutsch.» ✓\n«Heute lerne ich Deutsch.» ✓',
      },
      {
        status: 'upcoming',
        topic: 'Artikel der / die / das',
        level: 'A1',
        warum: 'Jedes Substantiv hat einen Artikel — das müssen wir zusammen mit dem Wort lernen.',
      },
    ],
  },

  julia: {
    name: 'Julia',
    level: 'B1/B2',
    progressText: 'Guter Start — wir kommen gut voran',
    goal: { title: 'Selbstsicher auf Deutsch im Berufsalltag sprechen', deadline: 'Sommer 2026' },
    milestones: [
      { label: 'Satzstruktur sicher machen',  status: 'active', sub: 'Sie sind hier' },
      { label: 'Sprechen ohne Angst',          status: 'upcoming' },
      { label: 'Frei kommunizieren bei der Arbeit', status: 'upcoming' },
    ],
    review: null,
    task: {
      topic: 'Wortstellung — Ihr Arbeitstag',
      text: 'Schreiben Sie 5 Sätze über Ihren Arbeitstag in der Ausbildung. Beginnen Sie jeden Satz mit einer Zeitangabe (heute, morgens, um 8 Uhr). Keine Angst vor Fehlern — das ist eine Übung, keine Prüfung.',
      estimate: '15 Minuten',
      deadline: '15. März',
      hint: 'Wenn der Satz mit «Heute» beginnt, kommt das Verb direkt danach: «Heute arbeite ich bis 17 Uhr.» Das Subjekt rückt auf Stelle drei.',
    },
    deepen: {
      topic: 'Wortstellung mit Nebensatz',
      text: 'Verbinden Sie je 2 Ihrer Sätze mit „weil", „obwohl" oder „wenn". Achten Sie auf die Verbposition im Nebensatz. 3 kombinierte Sätze reichen.',
    },
    immerse: {
      topic: 'Einen echten Satz aus der Arbeit beschreiben',
      text: 'Denken Sie an eine Situation von dieser Woche bei der Ausbildung. Beschreiben Sie sie in 4–5 Sätzen auf Deutsch. Schicken Sie mir den Text — ich gebe Ihnen Feedback.',
    },
    gaps: [
      { id: 'j1', level: 'A2', category: 'Grammatik', text: 'Verb auf Position 2 vergessen wenn Satz mit Zeitangabe beginnt', status: 'sos', by: 'lehrerin', date: '11. März' },
      { id: 'j2', level: 'A2', category: 'Sprechen', text: 'Stockt beim Antworten auf Kolleginnen — braucht zu viel Zeit zum Formulieren', status: 'aktiv', by: 'lehrerin', date: '5. März' },
    ],
    skills: [
      { name: 'Hören', icon: '🎧', personal: 'stable', note: 'Kolleginnen gut verstehen — super', criteria: [
        { label: 'Kolleginnen im Alltag verstehen', done: true },
        { label: 'Anweisungen in der Ausbildung', done: true },
        { label: 'Telefongespräche und Ansagen', done: false },
        { label: 'Besprechungen und Erklärungen folgen', done: false },
      ]},
      { name: 'Sprechen', icon: '🗣️', personal: 'up', note: 'Weniger Pausen — Mut wächst', criteria: [
        { label: 'Einfache Fragen und Antworten bei der Arbeit', done: true },
        { label: 'Situation erklären und um Hilfe bitten', done: false },
        { label: 'Eigene Meinung kurz sagen', done: false },
        { label: 'Frei über den Arbeitstag erzählen', done: false },
      ]},
      { name: 'Lesen', icon: '📖', personal: 'stable', note: 'Berufliche Texte gut verständlich', criteria: [
        { label: 'E-Mails und Nachrichten von Kollegen', done: true },
        { label: 'Arbeitsanweisungen und Protokolle', done: true },
        { label: 'Formulare und offizielle Briefe', done: false },
        { label: 'Kurze Artikel zu Berufsthemen', done: false },
      ]},
      { name: 'Schreiben', icon: '✍️', personal: 'up', note: 'Satzstellung üben — guter Anfang', criteria: [
        { label: 'Kurze Nachrichten an Kolleginnen', done: true },
        { label: 'Einfache E-Mail schreiben', done: false },
        { label: 'Sätze mit korrekter Wortstellung', done: false },
        { label: 'Kurzer Bericht über eine Situation', done: false },
      ]},
      { name: 'Grammatik', icon: '🔧', personal: 'up', note: 'Verb auf Pos. 2 — wird sicherer', criteria: [
        { label: 'Verb auf Position 2 (Hauptsatz)', done: false },
        { label: 'Verb am Ende (Nebensatz mit weil / dass)', done: false },
        { label: 'Modalverben im Alltag (müssen, können, dürfen)', done: false },
        { label: 'Vergangenheit: Perfekt im Gespräch', done: false },
      ]},
      { name: 'Wortschatz', icon: '📝', personal: 'stable', note: 'Ausbildungs-Vokabular aufbauen', criteria: [
        { label: 'Thema: Ausbildungsalltag & Abläufe', done: true },
        { label: 'Thema: Kolleginnen & Kommunikation', done: false },
        { label: 'Thema: Zahlen, Zeiten, Pläne beschreiben', done: false },
        { label: 'Höfliche Formulierungen im Beruf (10+ aktiv)', done: false },
      ]},
    ],
    feedback: null,
    grammar: [
      {
        status: 'current',
        topic: 'Wortstellung im Hauptsatz',
        level: 'B1',
        warum: 'Das ist die Basis jedes deutschen Satzes — ohne das klingt alles schief, auch wenn die Wörter stimmen.',
        summary: 'Das Verb steht immer auf Position 2. Egal was vorne steht — das Verb bleibt auf Platz 2, das Subjekt geht dahinter.',
        example: '«Heute arbeite ich bis 17 Uhr.» ✓\n«Morgens trinke ich Kaffee.» ✓\n«Um 8 Uhr beginnt die Arbeit.» ✓',
      },
      {
        status: 'upcoming',
        topic: 'Nebensätze mit weil / obwohl',
        level: 'B1',
        warum: 'Damit Sie erklären und begründen können — für echte Gespräche bei der Arbeit unverzichtbar.',
      },
      {
        status: 'upcoming',
        topic: 'Modalverben im Alltag',
        level: 'B1',
        warum: 'Müssen, können, dürfen, sollen — ohne diese Verben kommt man im Berufsalltag nicht aus.',
      },
    ],
  },
};
