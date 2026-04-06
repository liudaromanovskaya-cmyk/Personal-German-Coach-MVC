const FB = 'https://personal-german-coach-default-rtdb.europe-west1.firebasedatabase.app';

// Ольга: в России, готовится к переезду в Германию, сдаёт B2
// Тон: позитивный, динамичный, страноведение, никакой депрессии
// Тема недели: Freundschaft, Vereine, menschliche Beziehungen in Deutschland

const weekPlan = {
  mon: {
    theme: "Freundschaft in Deutschland — wie funktioniert das?",
    task: {
      topic: "Aufwaermen — Was weisst du schon?",
      prompt: "Eine Freundin fragt: Sie lernen Deutsch — wissen Sie schon, wie Freundschaften in Deutschland so funktionieren? Was haben Sie darueber gelesen oder gehoert?",
      instruction: "5 Saetze. Kein Perfekt noetig — einfach erzaehlen, was Sie wissen oder sich vorstellen.",
      hint: "Einstieg: Ich habe gehoert, dass... In Deutschland befinden sich viele Menschen in... Das ermoeglicht..."
    },
    deepen: {
      topic: "Situation — Brief an eine deutsche Bekannte",
      prompt: "Sie schreiben einer deutschen Bekannten: Ich bereite mich auf Deutschland vor. Ich haette gern gewusst: Wie lernt man dort neue Leute kennen? Worauf kommt es dabei an?",
      instruction: "7-8 Saetze. Nutzen Sie alle Woerter des Tages. Stellen Sie echte Fragen.",
      hint: "Worum geht es bei Freundschaften in Deutschland wirklich... Ich unterhalte mich gern ueber... Das ermoeglicht mir vorzustellen..."
    },
    immerse: {
      topic: "Ihre Geschichte — Was macht eine gute Freundschaft aus?",
      prompt: "Erzaehlen Sie von einer Freundschaft, die Ihnen besonders wichtig ist. Was schaetzen Sie an dieser Person? Worueberuntehalten Sie sich?",
      instruction: "Erzaehlen Sie frei. Alle Woerter dieser Woche stehen zur Verfuegung.",
      hint: "In dieser Freundschaft geht es wirklich darum... Ein Wunsch ging in Erfuellung als..."
    },
    writingTask: {
      topic: "Schreiben — Aufwaermen",
      instruction: "Schreiben Sie 5 Saetze: Was wissen Sie ueber Freundschaften in Deutschland? Verwenden Sie: sich befinden, sich unterhalten mit, ermoeglichten\nLandeskunde-Tipp: In Deutschland sagt man, Freundschaften entstehen langsamer — aber sie halten laenger."
    },
    writingDeepen: {
      topic: "Schreiben — Brief an eine Freundin",
      instruction: "Schreiben Sie 7-8 Saetze an eine Freundin: Was erwarten Sie von Freundschaften in Deutschland? Verwenden Sie: worum geht es, ankommen auf, in Erfuellung gehen, sich unterhalten mit"
    },
    writingImmerse: {
      topic: "Schreiben — Ihre Geschichte",
      instruction: "Freies Schreiben. Kulturwort einbauen: Stammtisch — ein regelmaessiges Treffen mit Freunden oder Bekannten, typisch fuer Deutschland. Oft in einem Cafe oder Restaurant, jeden Monat.\nTipp: Ein Stammtisch ermoeglicht es mir vorzustellen..."
    }
  },
  tue: {
    theme: "Vereinskultur — Deutschland und seine 600.000 Vereine",
    task: {
      topic: "Aufwaermen — Vereine in Deutschland",
      prompt: "Eine Freundin fragt: Haben Sie schon von der deutschen Vereinskultur gehoert? In Deutschland gibt es ueber 600.000 Vereine — Sportvereine, Musikvereine, Gartenvereine. Was finden Sie daran interessant?",
      instruction: "5 Saetze. Erzaehlen Sie, was Sie sich vorstellen oder was Sie interessiert.",
      hint: "Ich befinde mich gerade in einer Phase wo ich... Eine Fahrt zu einem deutschen Verein... Das ermoeglicht mir..."
    },
    deepen: {
      topic: "Situation — Welcher Verein passt zu Ihnen?",
      prompt: "Ihre zukuenftige Nachbarin schreibt Ihnen: Herzlich willkommen bald in Deutschland! Hier gibt es viele Moeglichkeiten, Leute kennenzulernen. Wofuer interessieren Sie sich? Ich kann einen Verein empfehlen!",
      instruction: "7-8 Saetze. Beschreiben Sie Ihre Interessen und fragen Sie nach. Nutzen Sie alle Woerter.",
      hint: "Worum es mir dabei geht... Ich unterhalte mich gern ueber... Das ermoeglicht mir..."
    },
    immerse: {
      topic: "Ihre Geschichte — Sport, Musik oder Garten?",
      prompt: "Stellen Sie sich vor: Sie sind in Deutschland und suchen einen Verein. Welchen wuerden Sie waehlen und warum? Erzaehlen Sie von Ihren Hobbys und Interessen.",
      instruction: "Erzaehlen Sie frei. Positiv und konkret.",
      hint: "In diesem Verein koennte ein Wunsch in Erfuellung gehen... Ich unterhalte mich gern mit Menschen die..."
    },
    writingTask: {
      topic: "Schreiben — Aufwaermen",
      instruction: "Schreiben Sie 5 Saetze: Welche Hobbys haben Sie? Was wuerden Sie in einem deutschen Verein machen? Verwenden Sie: sich befinden, eine Fahrt machen, ermoeglichten\nLandeskunde: Der Turnverein (TV) ist einer der aeltesten deutschen Vereinstypen — seit 1811."
    },
    writingDeepen: {
      topic: "Schreiben — E-Mail an die Nachbarin",
      instruction: "Schreiben Sie 7-8 Saetze: Antworten Sie der Nachbarin. Beschreiben Sie Ihre Interessen und fragen Sie nach einem passenden Verein. Verwenden Sie: ermoeglichten, in Erfuellung gehen, ankommen auf, worum geht es"
    },
    writingImmerse: {
      topic: "Schreiben — Ihre Geschichte",
      instruction: "Freies Schreiben. Kulturwort: Vereinsmeier — jemand, der sehr aktiv in Vereinen ist (positiv gemeint, manchmal humorvoll). Sprichwort: Viele Haende machen der Arbeit ein Ende.\nTipp: Vielleicht werde ich auch eine Vereinsmeier..."
    }
  },
  wed: {
    theme: "Beziehungen am deutschen Arbeitsplatz",
    task: {
      topic: "Aufwaermen — Arbeitskultur in Deutschland",
      prompt: "Eine Freundin fragt: Du arbeitest bald in Deutschland. Weisst du, wie der Umgang unter Kollegen dort ist? Was hast du gehoert oder gelesen?",
      instruction: "5 Saetze. Erzaehlen Sie was Sie wissen oder sich vorstellen.",
      hint: "Ich habe gehoert, dass man sich in Deutschland am Arbeitsplatz... Ich befinde mich gerade in der Vorbereitung... Das ermoeglicht mir..."
    },
    deepen: {
      topic: "Situation — Email von der zukuenftigen Kollegin",
      prompt: "Ihre zukuenftige Kollegin schreibt: Hallo! Wir freuen uns schon sehr auf Sie. Haben Sie Fragen ueber unseren Arbeitsalltag oder die Teamkultur bei uns?",
      instruction: "7-8 Saetze. Schreiben Sie zurueck — stellen Sie echte Fragen, erzaehlen Sie von sich. Nutzen Sie alle Woerter.",
      hint: "Worum es mir besonders geht... Ich unterhalte mich gern ueber... Das ermoeglicht mir..."
    },
    immerse: {
      topic: "Ihre Geschichte — Mein erster Arbeitstag in Deutschland",
      prompt: "Stellen Sie sich vor: Ihr erster Arbeitstag in Deutschland. Wie sieht er aus? Was passiert? Mit wem unterhalten Sie sich?",
      instruction: "Erzaehlen Sie frei und positiv. Alle Woerter dieser Woche zur Verfuegung.",
      hint: "An diesem Tag geht ein Wunsch in Erfuellung... Ich befinde mich im neuen Buero..."
    },
    writingTask: {
      topic: "Schreiben — Aufwaermen",
      instruction: "Schreiben Sie 5 Saetze: Was wissen Sie ueber den deutschen Arbeitsplatz? Was erwarten Sie? Verwenden Sie: sich befinden, worum geht es, ermoeglichten\nLandeskunde: In Deutschland ist Puenktlichkeit am Arbeitsplatz sehr wichtig — 'puenktlich' bedeutet sogar 5 Minuten frueher."
    },
    writingDeepen: {
      topic: "Schreiben — Antwort an die Kollegin",
      instruction: "Schreiben Sie 7-8 Saetze: Antworten Sie der Kollegin. Stellen Sie sich vor und stellen Sie Fragen. Verwenden Sie: sich unterhalten mit, ankommen auf, in Erfuellung gehen, abhaengen von"
    },
    writingImmerse: {
      topic: "Schreiben — Ihre Geschichte",
      instruction: "Freies Schreiben. Kulturwort: Feierabend — das Ende des Arbeitstages, aber auch: das Gefuehl der Freiheit danach. Sehr wichtiges deutsches Konzept.\nTipp: Nach dem Feierabend ermoeglicht mir Deutschland..."
    }
  },
  thu: {
    theme: "Vorbereitung auf den Alltag in Deutschland",
    task: {
      topic: "Aufwaermen — Was habe ich schon vorbereitet?",
      prompt: "Eine Freundin fragt: Sie ziehen bald um! Was haben Sie schon alles vorbereitet? Sprache, Dokumente, Informationen ueber Deutschland?",
      instruction: "5 Saetze. Erzaehlen Sie konkret — was haben Sie schon getan.",
      hint: "Ich befinde mich gerade in einer aktiven Vorbereitungsphase... Eine Fahrt nach Deutschland plane ich... Das ermoeglicht mir..."
    },
    deepen: {
      topic: "Situation — Gespraech mit einer Deutschen",
      prompt: "Sie treffen eine Deutsche, die in Russland lebt. Sie fragt: Was interessiert Sie an Deutschland am meisten? Worauf freuen Sie sich? Worauf bereiten Sie sich besonders vor?",
      instruction: "7-8 Saetze. Antworten Sie konkret und positiv. Nutzen Sie alle Woerter.",
      hint: "Worum es mir dabei geht... Es kommt darauf an dass... In Erfuellung gehen wird..."
    },
    immerse: {
      topic: "Ihre Geschichte — Mein Weg mit der deutschen Sprache",
      prompt: "Erzaehlen Sie von Ihrem Weg mit Deutsch. Wann haben Sie angefangen? Was war schwer? Was macht Ihnen Freude? Wo stehen Sie heute?",
      instruction: "Erzaehlen Sie frei und persoenlich. So lang wie Sie moechten.",
      hint: "Als ich angefangen habe Deutsch zu lernen... Worum es mir wirklich geht... Ein Wunsch geht in Erfuellung wenn..."
    },
    writingTask: {
      topic: "Schreiben — Aufwaermen",
      instruction: "Schreiben Sie 5 Saetze: Was haben Sie schon fuer den Umzug vorbereitet? Verwenden Sie: sich befinden, worum geht es, ermoeglichten\nLandeskunde: In Deutschland braucht man eine Anmeldung — innerhalb von 14 Tagen nach dem Einzug beim Einwohnermeldeamt."
    },
    writingDeepen: {
      topic: "Schreiben — Brief an eine Freundin",
      instruction: "Schreiben Sie 7-8 Saetze: Erzaehlen Sie einer Freundin von Ihrer Vorbereitung auf Deutschland. Verwenden Sie: ankommen auf, abhaengen von, in Erfuellung gehen, sich unterhalten mit"
    },
    writingImmerse: {
      topic: "Schreiben — Ihre Geschichte",
      instruction: "Freies Schreiben. Zwei Kulturwoerter: Gemutlichkeit — Gemuetlichkeit, Wohlgefuehl, Behaglichkeit in der Gesellschaft anderer. Weltoffenheit — Offenheit gegenueber anderen Kulturen und Menschen.\nTipp: Deutschland steht fuer mich fuer Gemuetlichkeit und Weltoffenheit..."
    }
  },
  fri: {
    theme: "Meine Ziele — B2 und das neue Leben",
    task: {
      topic: "Aufwaermen — Meine Ziele auf Deutsch",
      prompt: "Eine Freundin fragt: Sie machen bald den B2-Test! Wie laeuft die Vorbereitung? Was machen Sie jeden Tag dafuer?",
      instruction: "5 Saetze. Erzaehlen Sie konkret und motiviert.",
      hint: "Ich befinde mich gerade in der intensiven Vorbereitungsphase... Das ermoeglicht mir jeden Tag... Eine Fahrt nach Deutschland wird moeglich wenn..."
    },
    deepen: {
      topic: "Situation — Im Deutschkurs-Forum",
      prompt: "Sie schreiben in einem Online-Forum fuer Deutschlernende: Ich bereite mich auf den B2-Test vor und plane den Umzug nach Deutschland. Hier ist mein Lernplan und meine Motivation...",
      instruction: "7-8 Saetze. Beschreiben Sie Ihren Plan und motivieren Sie andere. Nutzen Sie alle Woerter.",
      hint: "Worum es mir wirklich geht... Das ermoeglicht mir... In Erfuellung gehen wird der Traum wenn..."
    },
    immerse: {
      topic: "Ihre Geschichte — Warum Deutschland?",
      prompt: "Erzaehlen Sie: Warum haben Sie sich fuer Deutschland entschieden? Was erwarten Sie vom neuen Leben? Was nehmen Sie aus Russland mit?",
      instruction: "Erzaehlen Sie frei — so persoenlich und lang wie Sie moechten. Das ist Ihre Geschichte.",
      hint: "Worum es mir wirklich geht... Wir haben uns immer gefragt worum es geht... In Erfuellung geht ein Traum wenn..."
    },
    writingTask: {
      topic: "Schreiben — Aufwaermen",
      instruction: "Schreiben Sie 5 Saetze: Beschreiben Sie Ihren Lernplan fuer den B2-Test. Verwenden Sie: sich befinden, worum geht es, ermoeglichten\nLandeskunde: Der B2-Test wird in Deutschland von Goethe-Institut, telc oder OeSD angeboten — alle sind offiziell anerkannt."
    },
    writingDeepen: {
      topic: "Schreiben — Mein Motivationsbrief",
      instruction: "Schreiben Sie 7-8 Saetze: Warum lernen Sie Deutsch? Was sind Ihre Ziele? Verwenden Sie: ermoeglichten, in Erfuellung gehen, abhaengen von, ankommen auf"
    },
    writingImmerse: {
      topic: "Schreiben — Ihre Geschichte",
      instruction: "Freies Schreiben — alles erlaubt. Kulturwoerter: Fernweh — die Sehnsucht nach der Ferne, nach neuen Orten. Aufbruch — der Beginn von etwas Neuem, ein Neustart.\nTipp: Mein Fernweh und mein Aufbruch nach Deutschland... Das ermoeglicht mir..."
    }
  }
};

const res = await fetch(`${FB}/teacher/olga/weekPlan.json`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(weekPlan)
});
const result = await res.json();
console.log(res.ok ? 'OK — новый план записан в Firebase!' : 'Ошибка: ' + JSON.stringify(result));
