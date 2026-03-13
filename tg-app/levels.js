// ═══════════════════════════════════════════════════════════
// NIVEAU-VORLAGEN — Kursarchitektur nach Sprachniveau
// Jeder Student erbt sein Niveau aus dieser Datei.
// Neue Niveaus: c1_telc, b2_goethe, b1_goethe usw. hinzufügen.
// ═══════════════════════════════════════════════════════════

const LEVELS = {

  c1_goethe: {
    name: 'C1 Goethe-Zertifikat',
    eingang: 'Sicheres B2 / B2+',
    ausgang: [
      'Komplexe, logisch dichte Aussagen formulieren',
      'Formellen und halbakademischen Stil verwenden',
      'Syntaktisch anspruchsvolle Konstruktionen verstehen und produzieren',
      'Mit kontrollierter grammatischer Präzision schreiben und sprechen',
      'Aufgaben im Format Goethe C1 / telc C1 / TestDaF / DSH sicher bewältigen',
    ],

    // ── Durchgehende Linien (in allen 12 Modulen) ──────────────
    linien: [
      { id: 'grammatik',   titel: 'Grammatik im Kontext',       beschreibung: 'Grammatik nicht isoliert, sondern im Text und in der Aufgabe' },
      { id: 'fehler',      titel: 'Fehlerkorrektur',             beschreibung: 'Kontinuierliche Korrektur typischer Fehler' },
      { id: 'schreiben',   titel: 'Schreiben C1',                beschreibung: 'Mindestens ein schriftlicher Output pro Modul' },
      { id: 'sprechen',    titel: 'Sprechen C1',                 beschreibung: 'Mindestens ein mündlicher Output pro Modul' },
      { id: 'redemittel',  titel: 'Redemittel + Wortschatz',     beschreibung: 'Lexikalisch-grammatische Vorlagen und Wendungen' },
    ],

    // ── Modulformel ─────────────────────────────────────────────
    modulformel: [
      { lektion: 1, fokus: 'Erkennen und Erklären' },
      { lektion: 2, fokus: 'Kontrollierte Übung' },
      { lektion: 3, fokus: 'Transformation und Variabilität' },
      { lektion: 4, fokus: 'Produktiver Output im Prüfungs- oder Kommunikationsformat' },
    ],

    // ── Unterrichtsvorlage (gilt für alle 48 Lektionen) ─────────
    unterrichtsvorlage: [
      { schritt: 1, phase: 'Aktivierung',        inhalt: 'Kurzes Warm-up zur Strukturerkennung' },
      { schritt: 2, phase: 'Input',              inhalt: 'Text, Audio, Essay-Fragment, Prüfungsbeispiel' },
      { schritt: 3, phase: 'Analyse',            inhalt: 'Lernende entdecken selbst die Regelmäßigkeit' },
      { schritt: 4, phase: 'Regelbildung',       inhalt: 'Regel oder Modell wird formuliert' },
      { schritt: 5, phase: 'Kontrollierte Übung', inhalt: 'Übungen nach Vorlage' },
      { schritt: 6, phase: 'Transformation',     inhalt: 'Umformung, Umstrukturierung, Komplexitätssteigerung' },
      { schritt: 7, phase: 'Produktion',         inhalt: 'Sprechen oder Schreiben' },
      { schritt: 8, phase: 'Fehleranalyse',      inhalt: 'Typische Fehler besprechen' },
      { schritt: 9, phase: 'Hausaufgabe',        inhalt: 'Festigung und Transfer in neuen Kontext' },
    ],

    // ── Hausaufgaben-Schichten ───────────────────────────────────
    hausaufgabenSchichten: [
      {
        schicht: 1,
        name: 'Automatisierung',
        aufgabentypen: ['Lückentext', 'Transformation', 'Fehlerkorrektur', 'Sätze ordnen'],
      },
      {
        schicht: 2,
        name: 'Halbkontrollierte Übung',
        aufgabentypen: ['Absatz vervollständigen', 'Stil ändern', 'Sätze verbinden', 'Position des Autors wiedergeben'],
      },
      {
        schicht: 3,
        name: 'Freie Produktion',
        aufgabentypen: ['Mini-Essay', 'Kommentar', 'Zusammenfassung', 'Mündliche Aufnahme 2–3 Min.'],
      },
    ],

    // ── Kontrollsystem ───────────────────────────────────────────
    kontrolle: {
      nachJedemModul: [
        'Kurzer Grammatiktest',
        'Schriftlicher Output',
        'Mündlicher Output',
        'Korrektur häufiger Fehler',
      ],
      nachJe3Modulen: [
        'Kumulativer Review',
        'Gemischtes Grammar-Drill',
        'Schriftliche Aufgabe im Prüfungsformat',
        'Speaking Task',
      ],
      abschluss: [
        'Großer Grammar-Review',
        'Schreiben C1',
        'Sprechen C1',
        'Individuelle Fehlerkarte',
      ],
    },

    // ── 12 Module ────────────────────────────────────────────────
    module: [
      {
        nr: 1,
        titel: 'Brücke B2→C1: Zeiten und Textperspektive',
        ziel: 'Instabilität bei den Zeiten beseitigen — Zeiten als Textinstrument begreifen, nicht als bloße Formen',
        ergebnis: [
          'Präsens, Perfekt, Präteritum, Plusquamperfekt, Futur I, Futur II unterscheiden und bewusst einsetzen',
          'Zeitperspektive in Nacherzählung und Argumentation steuern',
        ],
        lektionen: [
          {
            nr: 1,
            titel: 'Präsens, Perfekt, Präteritum im Text',
            fokus: 'Nicht Formenbildung, sondern Formenwahl nach Genre und Funktion',
            inhalt: [
              'Gesprochenen, schriftlichen und erzählenden Register vergleichen',
              'Wann Perfekt natürlicher ist, wann Präteritum',
              'Zeitsignale im Text erkennen',
            ],
            uebungen: ['Erkennen im Text', 'Beispiele sortieren', 'Text mini-redigieren'],
            hausaufgabe: 'Kurzen Text in zwei Versionen umschreiben: neutral und erzählend',
          },
          {
            nr: 2,
            titel: 'Plusquamperfekt und Zeitperspektive',
            fokus: 'Vorzeitigkeit in der Vergangenheit und komplexe Ereignisfolge',
            inhalt: [
              'Chronologie aufbauen',
              'Konnektoren üben: nachdem, bevor, schon vorher, bis dahin',
              'Vom linearen Text zum mehrschichtigen Text',
            ],
            uebungen: ['Ereignisreihenfolge wiederherstellen', 'Text umstrukturieren', 'Zeitlogik erklären'],
            hausaufgabe: 'Geschichte schreiben (120–150 Wörter) mit mind. 5 Fällen von Vorzeitigkeit',
          },
          {
            nr: 3,
            titel: 'Futur I / Futur II und modale Bedeutungen',
            fokus: 'Zukunft, Vermutung, Prognose, Abgeschlossenheit zum Zeitpunkt',
            inhalt: [
              'Echte Zukunft vs. modale Vermutung unterscheiden',
              'Futur II als logische Ergebnisprognose üben',
              'Vergleich mit Präsens für Zukunftshandlungen',
            ],
            uebungen: ['Prognosen', 'Fakteninterpretation', 'Mündliche Hypothesen'],
            hausaufgabe: '10 Transformationen: Präsens ↔ Futur I ↔ modale Vermutung',
          },
          {
            nr: 4,
            titel: 'Zeitenfolge in Nacherzählung und Argumentation',
            fokus: 'Zeitliche Logik in langen Texten aufrechterhalten',
            inhalt: [
              'Artikel nacherzählen',
              'Mehrere Zeitebenen kombinieren',
              'Typische B2+-Fehler bearbeiten',
            ],
            produktiverOutput: 'Mündliche Nacherzählung + schriftlicher Kommentar',
            kontrolle: ['Mini-Test Zeitenwahl', 'Schriftliche Aufgabe 180 Wörter'],
          },
        ],
      },

      {
        nr: 2,
        titel: 'Satzverbindungen I: Logik des komplexen Satzes',
        ziel: 'Gedanken nicht "ungefähr sinngemäß", sondern grammatisch präzise verknüpfen',
        ergebnis: [
          'Kausal, adversativ und additive Verbindungen über Konjunktionen, Konjunktionaladverbien, Hauptsatzverbindungen',
        ],
        lektionen: [
          {
            nr: 1,
            titel: 'Koordination: denn, aber, sondern',
            fokus: 'Unterschied zwischen logischer Ergänzung und Gegenüberstellung; aber vs. sondern; Rhythmus der komplexen Aussage',
            uebungen: ['Satzpaare verbinden', 'Logikfehler korrigieren', 'Kurze Dialoge'],
            hausaufgabe: null,
          },
          {
            nr: 2,
            titel: 'Konjunktionaladverbien',
            fokus: 'deshalb, daher, darum, trotzdem, außerdem, hingegen, allerdings — Inversion und Wortstellung',
            uebungen: ['Transformationen', 'Nach Logik sortieren', 'Absatz rekonstruieren'],
            hausaufgabe: null,
          },
          {
            nr: 3,
            titel: 'Kausal, konsekutiv, adversativ',
            fokus: 'Verschiedene Ausdrucksmöglichkeiten für dieselbe Logik — Stilwahl, formal vs. neutral',
            uebungen: ['Umformulierung', 'Stilvergleich', 'Argumentation aufbauen'],
            hausaufgabe: null,
          },
          {
            nr: 4,
            titel: 'Transformation: von zwei einfachen zu einem komplexen Satz',
            fokus: 'Syntaktische Verdichtung — weg von "Schulsprache" hin zu C1',
            produktiverOutput: 'Argumentationsabsatz mit mind. 8 verschiedenen Konnektoren',
            kontrolle: ['Test Konnektor-Wahl', 'Mündlicher Mikromonolog'],
          },
        ],
      },

      {
        nr: 3,
        titel: 'Satzverbindungen II: Nebensätze und Infinitivkonstruktionen',
        ziel: 'Von einzelnen Konnektoren zum System logischer Relationen',
        ergebnis: [
          'Temporale, finale, modale, konditionale, konzessive Strukturen',
          'Infinitivkonstruktionen sicher verwenden',
        ],
        lektionen: [
          { nr: 1, titel: 'Temporale Zusammenhänge', fokus: 'während, nachdem, bevor, sobald, seitdem, solange — Zeitachse, Gleichzeitigkeit und Abfolge' },
          { nr: 2, titel: 'Finale und modale Zusammenhänge', fokus: 'damit, um...zu, dadurch, indem — Ziel vs. Weg, häufige Verwechslungen' },
          { nr: 3, titel: 'Konditional und Konzessiv', fokus: 'wenn, falls, obwohl, auch wenn, selbst wenn — real vs. hypothetisch, Einräumung als Argumentationsmittel' },
          {
            nr: 4,
            titel: 'Infinitivkonstruktionen',
            fokus: 'um...zu, ohne...zu, anstatt...zu — nominale und verbale Ausdrucksweise, stilistische Verdichtung',
            produktiverOutput: 'Schriftlicher Vergleich zweier Positionen mit allen 4 Logiktypen',
            kontrolle: ['Transformationstest', 'Mündlicher Debate-Response'],
          },
        ],
      },

      {
        nr: 4,
        titel: 'Präpositionen + Rektion',
        ziel: 'Rektion und Präpositionen stabil und automatisiert machen',
        ergebnis: [
          'Präpositionen nach Bedeutung',
          'Dativ / Akkusativ / Genitiv',
          'Verben / Adjektive / Nomen mit Präpositionen',
        ],
        lektionen: [
          { nr: 1, titel: 'Lokale und temporale Präpositionen', fokus: 'Räumliche Logik, zeitliche Rahmung, typische Schwierigkeiten' },
          { nr: 2, titel: 'Dativ / Akkusativ / Wechselpräpositionen', fokus: 'Bewegung vs. Position, abstrakte Verwendung, Verb als Hinweis' },
          { nr: 3, titel: 'Genitivpräpositionen', fokus: 'Formeller Stil, häufige Muster, schriftliches C1' },
          {
            nr: 4,
            titel: 'Rektion',
            fokus: 'Verben, Adjektive und Nomen mit Präpositionen',
            produktiverOutput: 'Argumentationsbrief mit 12 Rektion-Konstruktionen',
            kontrolle: ['Diktat-Konstruktor', 'Text mit Rektionsfehlern redigieren'],
          },
        ],
      },

      {
        nr: 5,
        titel: 'Modalität',
        ziel: 'Nicht nur den Sachverhalt, sondern die Einstellung zum Sachverhalt ausdrücken',
        ergebnis: [
          'Modalverben in Grundbedeutung und subjektiver Bedeutung',
          'Wahrscheinlichkeit, Distanz, Alternativen',
        ],
        lektionen: [
          { nr: 1, titel: 'Grundbedeutung der Modalverben', fokus: 'müssen, dürfen, können, sollen, wollen, mögen — Pflicht, Möglichkeit, Erlaubnis' },
          { nr: 2, titel: 'Subjektive Bedeutung', fokus: 'Vermutung und Interpretation — Er muss krank sein, Er dürfte schon angekommen sein' },
          { nr: 3, titel: 'Wahrscheinlichkeit und Distanz', fokus: 'Sicherheitsskala — nicht kategorisch sprechen, akademische und höfliche Distanz' },
          {
            nr: 4,
            titel: 'Alternativen zu Modalverben',
            fokus: 'es ist möglich, es lässt sich, vermutlich, wahrscheinlich, aller Voraussicht nach',
            produktiverOutput: 'Mündliche Expertenbewertung + schriftlicher Kommentar mit Wahrscheinlichkeitsabstufung',
            kontrolle: ['Test Bedeutungsnuancen', '8 mündliche Mini-Cases'],
          },
        ],
      },

      {
        nr: 6,
        titel: 'Konjunktiv II',
        ziel: 'Irrealität, Hypothese, Abschwächung und Bedingung beherrschen',
        ergebnis: [
          'Wünsche, Ratschläge, hypothetische Bedingungen',
          'Irreale Vergleiche und irreale Folgen',
        ],
        lektionen: [
          { nr: 1, titel: 'Formen und Wahl: würde vs. synthetische Formen', fokus: 'Was natürlicher klingt — häufige Formen, typische Fehler von Lernenden' },
          { nr: 2, titel: 'Wünsche, Höflichkeit, Ratschläge', fokus: 'Weiche Sprache, beratender Stil, gesellschaftlich akzeptable Abschwächung' },
          { nr: 3, titel: 'Irreale Bedingungen und Vergleiche', fokus: 'wenn ich..., würde ich... — als ob, als hätte, als wäre' },
          {
            nr: 4,
            titel: 'Irreale Folgen',
            fokus: 'Fast eingetretenes Ergebnis, Bedauern, alternativer Verlauf',
            produktiverOutput: 'Schriftlicher Text "Was wäre, wenn..." + mündliche Beratung',
            kontrolle: ['Transformationen Indikativ → Konjunktiv II', 'Case: mündliche Problemlösung'],
          },
        ],
      },

      {
        nr: 7,
        titel: 'Relativ- und Partizipialstrukturen',
        ziel: 'Informationen verdichten und zur syntaktisch dichten C1-Verpackung übergehen',
        ergebnis: [
          'Relativsätze aufbauen',
          'Zu Attributen verkürzen',
          'Partizipialattribute und Partizipialsätze verwenden',
        ],
        lektionen: [
          { nr: 1, titel: 'Relativsätze: Kern', fokus: 'Wiederholung und Erweiterung — Kongruenz, Referent und Kasus' },
          { nr: 2, titel: 'Besondere Modelle', fokus: 'was, wer, wo, wodurch, worauf — Relativpronomen außerhalb des Schulstandards' },
          { nr: 3, titel: 'Partizipialattribute', fokus: 'Vom Relativsatz zum Attribut — formeller Schriftstil' },
          {
            nr: 4,
            titel: 'Wahl zwischen Relativsatz und Partizipialkonstruktion',
            fokus: 'Was natürlicher klingt — wann hoher Stil angemessen ist',
            produktiverOutput: 'Akademischer Absatz mit 5 Fällen von Informationsverdichtung',
            kontrolle: ['Text in formelleren Stil umschreiben', 'Überladene Konstruktionen redigieren'],
          },
        ],
      },

      {
        nr: 8,
        titel: 'Adjektive und Attribute',
        ziel: 'Morphologie stabilisieren und attributive Präzision auf C1-Niveau bringen',
        ergebnis: [
          'Adjektivdeklination',
          'Vergleichsformen',
          'Substantivierte Adjektive',
          'Attributive Modelle auf hohem Niveau',
        ],
        lektionen: [
          { nr: 1, titel: 'Adjektivdeklination nach Artikel', fokus: 'Systematisierung, keine Mechanik — Muster erkennen' },
          { nr: 2, titel: 'Nach Nullartikel / Zahlen / anderen Determinativen', fokus: 'Nicht-standardmäßige Auslöser, typische Fehler im schriftlichen C1' },
          { nr: 3, titel: 'Komparativ / Superlativ', fokus: 'Nicht Form, sondern Bedeutung — präziser Vergleich, schriftliche Argumentation' },
          {
            nr: 4,
            titel: 'Substantivierte Adjektive und Partizipien',
            fokus: 'Formeller Stil — soziale Gruppen, Abstraktionen, Charakterisierungen',
            produktiverOutput: 'Beschreibung eines Diagramms / Phänomens / sozialen Problems',
            kontrolle: ['Morphologischer Trainer', 'Schriftfragment redigieren'],
          },
        ],
      },

      {
        nr: 9,
        titel: 'Indirekte Rede / Konjunktiv I',
        ziel: 'Fremde Positionen neutral, präzise und stilistisch korrekt wiedergeben',
        ergebnis: [
          'Konjunktiv I verwenden',
          'Aussagen, indirekte Fragen und Aufforderungen wiedergeben',
        ],
        lektionen: [
          { nr: 1, titel: 'Redewiedergabe ohne Überlastung', fokus: 'nach, laut, zufolge, wie — fremde Position ohne schwere Konstruktion einführen' },
          { nr: 2, titel: 'Konjunktiv I: Formen und Funktion', fokus: 'Grundformen, Neutralität und Distanz, Autorenposition' },
          { nr: 3, titel: 'Fragen in der indirekten Rede', fokus: 'ob, W-Fragen — Interview, Umfragen, Diskussionen nacherzählen' },
          {
            nr: 4,
            titel: 'Aufforderung und Befehl in der indirekten Rede',
            fokus: 'Bitten, Forderungen, Empfehlungen, fremde Absichten berichten',
            produktiverOutput: 'Schriftliche Summary eines Artikels / Interviews + mündliche Wiedergabe mehrerer Positionen',
            kontrolle: ['Direkte → indirekte Rede umformen', 'Analytische Nacherzählung'],
          },
        ],
      },

      {
        nr: 10,
        titel: 'Nominalstil + Nomen-Verb-Verbindungen',
        ziel: 'Sprache akademischer, dichter und formal reifer machen',
        ergebnis: [
          'Verben und Adjektive nominalisieren',
          'Verbal- und Nominalstil unterscheiden',
          'Nomen-Verb-Verbindungen als Ressource des hohen Registers verwenden',
        ],
        lektionen: [
          { nr: 1, titel: 'Nominalisierung von Verben', fokus: 'Prozess in Begriff verwandeln — syntaktische Verdichtung' },
          { nr: 2, titel: 'Nominalisierung von Adjektiven / Partizipien', fokus: 'Abstraktionen, Kategorien, formelles Schreiben' },
          { nr: 3, titel: 'Verbalstil ↔ Nominalstil', fokus: 'Gleicher Inhalt in zwei Registern — was für Essay, Bericht, Kommentar wählen?' },
          {
            nr: 4,
            titel: 'Nomen-Verb-Verbindungen',
            fokus: 'eine Entscheidung treffen, in Betracht ziehen, zur Verfügung stehen — Standardgruppen nach Funktion',
            produktiverOutput: 'Umgangssprachlichen Text in formellen umschreiben + Essay-Absatz im akademischen Stil',
            kontrolle: ['Transformationstest', 'Wortschatz-Matrix nach Funktionen'],
          },
        ],
      },

      {
        nr: 11,
        titel: 'Passiv und Passivumschreibungen',
        ziel: 'Den Fokus der Aussage steuern und im formellen Register natürlich schreiben',
        ergebnis: [
          'Vorgangspassiv, Zustandspassiv',
          'Passiv mit Modalverben',
          'Passivumschreibungen',
        ],
        lektionen: [
          { nr: 1, titel: 'Vorgangspassiv', fokus: 'Prozess und Handlung — Agens und Unpersönlichkeit, formelle Textsorten' },
          { nr: 2, titel: 'Zustandspassiv', fokus: 'Zustand als Ergebnis — Unterschied zum Vorgangspassiv' },
          { nr: 3, titel: 'Passiv mit Modalverben', fokus: 'Normen, Vorschriften, Möglichkeiten — Verwaltungs- und Akademikerstil' },
          {
            nr: 4,
            titel: 'Passivumschreibungen',
            fokus: 'Gerundiv, bekommen + Partizip II, weitere Ersatzformen im natürlichen Sprachgebrauch',
            produktiverOutput: 'Prozess / Verfahren beschreiben + formeller Text mit Aktiv, Passiv und Passivumschreibung',
            kontrolle: ['Aktiv ↔ Passiv ↔ Nominalstil transformieren', 'Text auf Stil redigieren'],
          },
        ],
      },

      {
        nr: 12,
        titel: 'Satzbau C1 + Wortbildung + Abschlussredaktion',
        ziel: 'Das gesamte C1-System zu kontrollierter Produktion zusammenführen',
        ergebnis: [
          'Wortstellung variieren',
          'es und Verweiswörter verwenden',
          'Wortbildung anwenden',
          'Eigenen Text auf C1-Niveau redigieren',
        ],
        lektionen: [
          { nr: 1, titel: 'Vorfeld, Mittelfeld, Nachfeld', fokus: 'Logik der Informationsanordnung — Thema und Rhema, Natürlichkeit langer Sätze' },
          { nr: 2, titel: 'es, Verweiswörter und Textkohäsion', fokus: 'Obligatorisches / fakultatives es, pronominale Verkettung, textuelle Kohäsion' },
          { nr: 3, titel: 'Wortbildung', fokus: 'Verbpräfixe, Substantiv- und Adjektivsuffixe, Wortfamilien' },
          {
            nr: 4,
            titel: 'Textredaktion C1',
            fokus: 'Zeichensetzung, Register, stilistische Bereinigung, abschließende Selbstkontrolle',
            produktiverOutput: 'Vollständiger schriftlicher Text im Prüfungsformat + Mündliches Referat mit anschließender Sprachkorrektur',
            kontrolle: ['Abschließender Grammatiktest', 'Schriftliche Arbeit mit Bewertungsraster'],
          },
        ],
      },
    ], // Ende module
  }, // Ende c1_goethe

  // ── Freie Studenten (kein Prüfungsziel) ─────────────────────
  free: {
    name: 'Individueller Kurs',
    eingang: 'Beliebiges Niveau',
    ausgang: 'Persönliche Ziele — kein festes Prüfungsformat',
    module: [], // Wird individuell befüllt
  },

}; // Ende LEVELS
