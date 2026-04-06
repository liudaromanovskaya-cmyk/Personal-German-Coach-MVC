const FB = 'https://personal-german-coach-default-rtdb.europe-west1.firebasedatabase.app';

const weekPlan = {
  mon: {
    theme: "Freundschaft im Alltag",
    task: { topic: "Aufwaermen - Wochenende mit Freunden", prompt: "Eine Freundin fragt: Wie hast du das Wochenende verbracht? Warst du mit jemandem zusammen?", instruction: "5 Saetze. Kein Perfekt noetig - einfach erzaehlen.", hint: "Einstieg: Am Wochenende befand ich mich... Wir haben eine Fahrt gemacht... Das hat mir ermoeglicht..." },
    deepen: { topic: "Situation - Kontakte in Deutschland", prompt: "Ihre Freundin sagt: Ich fuehle mich so einsam hier. Wie schaffst du es, Kontakte zu knuepfen?", instruction: "7-8 Saetze. Nutzen Sie alle Woerter des Tages.", hint: "Fuer mich kommt es darauf an... Ich unterhalte mich gern mit... Das ermoeglicht mir..." },
    immerse: { topic: "Ihre Geschichte - Eine wichtige Freundschaft", prompt: "Erzaehlen Sie von einer Freundschaft, die Ihnen wichtig ist. Wie haben Sie sich kennengelernt?", instruction: "Erzaehlen Sie frei. Alle Woerter dieser Woche stehen zur Verfuegung.", hint: "Worum es in dieser Freundschaft wirklich geht... In diesem Moment ging ein Wunsch in Erfuellung..." },
    writingTask: { topic: "Schreiben - Aufwaermen", instruction: "Schreiben Sie 5 Saetze: Beschreiben Sie eine Person, mit der Sie sich gern unterhalten. Verwenden Sie: sich befinden, sich unterhalten mit, ermoeglichten" },
    writingDeepen: { topic: "Schreiben - Brief an eine Freundin", instruction: "Schreiben Sie 7-8 Saetze: Was bedeutet Freundschaft fuer Sie in Deutschland? Verwenden Sie: worum geht es, ankommen auf, in Erfuellung gehen, sich unterhalten mit" },
    writingImmerse: { topic: "Schreiben - Ihre Geschichte", instruction: "Freies Schreiben. Kulturwort: Stammtisch - regelmaessiges Treffen mit Freunden, typisch deutsches Kulturgut." }
  },
  tue: {
    theme: "Kollegen und Zusammenhalt",
    task: { topic: "Aufwaermen - Kollegen ausserhalb der Arbeit", prompt: "Eine Kollegin fragt in der Pause: Kennst du eigentlich jemanden hier ausserhalb der Arbeit?", instruction: "5 Saetze. Einfach und direkt erzaehlen.", hint: "Ich befinde mich gerade in einer Phase, wo... Eine Fahrt haben wir mal gemacht..." },
    deepen: { topic: "Situation - Rat geben", prompt: "Ihre Kollegin sagt: Ich fuehle mich so isoliert. Hast du einen Tipp, wie man in Deutschland Anschluss findet?", instruction: "7-8 Saetze. Geben Sie echten Rat. Nutzen Sie alle Woerter.", hint: "Worum es dabei geht... Es ermoeglicht einem... In Erfuellung geht ein Wunsch wenn..." },
    immerse: { topic: "Ihre Geschichte - Ein Kollege der zaehlt", prompt: "Erzaehlen Sie von einem Kollegen, mit dem Sie sich besonders gut verstehen. Was macht diese Beziehung besonders?", instruction: "Erzaehlen Sie frei.", hint: "Wir unterhalten uns oft ueber... Worum es in unserer Beziehung wirklich geht..." },
    writingTask: { topic: "Schreiben - Aufwaermen", instruction: "Schreiben Sie 5 Saetze ueber einen Kollegen. Verwenden Sie: sich befinden, sich unterhalten mit, worum geht es" },
    writingDeepen: { topic: "Schreiben - E-Mail an eine Freundin", instruction: "Schreiben Sie 7-8 Saetze ueber das Verhaeltnis zu Ihren Kollegen. Verwenden Sie: ermoeglichten, in Erfuellung gehen, ankommen auf" },
    writingImmerse: { topic: "Schreiben - Ihre Geschichte", instruction: "Freies Schreiben. Kulturwort: Kollegialitaet - professionelle Solidaritaet am Arbeitsplatz. Sprichwort: Eine Hand waescht die andere." }
  },
  wed: {
    theme: "Vereine und Gemeinschaft",
    task: { topic: "Aufwaermen - Verein oder Gruppe?", prompt: "Eine Nachbarin fragt: Bist du in einem Verein? Machst du irgendwas in der Freizeit mit anderen?", instruction: "5 Saetze. Erzaehlen Sie was Sie machen oder was Sie sich wuenschen.", hint: "Ich befinde mich gerade... Wir haben mal eine Fahrt gemacht... Das ermoeglicht mir..." },
    deepen: { topic: "Situation - Eine Bekannte braucht Rat", prompt: "Eine Bekannte vom Kindergarten sagt: Wie findet man hier eigentlich Leute? Ich fuehle mich so fremd.", instruction: "7-8 Saetze. Beraten Sie sie - nutzen Sie alle Woerter.", hint: "Worum es geht ist... Es ermoeglicht einem... Ich unterhalte mich oft mit..." },
    immerse: { topic: "Ihre Geschichte - Dazugehoeren", prompt: "Erzaehlen Sie von einem Moment, wo Sie sich wirklich dazugehoerig gefuehlt haben - oder wo Sie sich fremd gefuehlt haben.", instruction: "Erzaehlen Sie frei. Ehrlich und persoenlich.", hint: "In diesem Moment ging ein kleiner Wunsch in Erfuellung..." },
    writingTask: { topic: "Schreiben - Aufwaermen", instruction: "Schreiben Sie 5 Saetze: Was machen Sie in Ihrer Freizeit? Verwenden Sie: sich befinden, eine Fahrt machen, ermoeglichten" },
    writingDeepen: { topic: "Schreiben - Warum Vereine?", instruction: "Schreiben Sie 7-8 Saetze: Warum sind Vereine in Deutschland so wichtig? Verwenden Sie: worum geht es, ankommen auf, in Erfuellung gehen" },
    writingImmerse: { topic: "Schreiben - Ihre Geschichte", instruction: "Freies Schreiben. Kulturwort: Vereinskultur - Deutschland hat ueber 600.000 Vereine. Sprichwort: Viele Haende machen der Arbeit ein Ende." }
  },
  thu: {
    theme: "Was Beziehungen stark macht",
    task: { topic: "Aufwaermen - Gespraech mit der Schwester", prompt: "Ihre Schwester ruft aus Russland an: Wie laeuft es bei dir? Hast du Freunde gefunden?", instruction: "5 Saetze. Ehrlich und direkt - wie im echten Gespraech.", hint: "Ich befinde mich gerade in einer guten Phase... Das hat mir ermoeglicht..." },
    deepen: { topic: "Situation - Eine schwierige Frage", prompt: "Eine gute Freundin sagt: Ich glaube, unsere Freundschaft hat sich veraendert. Worum geht es dir eigentlich wirklich?", instruction: "7-8 Saetze. Antworten Sie ehrlich - nutzen Sie alle Woerter.", hint: "Worum es mir wirklich geht... Das ermoeglicht mir... In Erfuellung gegangen ist..." },
    immerse: { topic: "Ihre Geschichte - Eine Beziehung die sich veraendert hat", prompt: "Erzaehlen Sie von einer menschlichen Beziehung die sich veraendert hat. Was ist passiert?", instruction: "Erzaehlen Sie frei. Alle Woerter dieser Woche zur Verfuegung.", hint: "Wir haben uns oft miteinander unterhalten... Worum es in dieser Beziehung geht..." },
    writingTask: { topic: "Schreiben - Aufwaermen", instruction: "Schreiben Sie 5 Saetze: Was ist Ihnen in einer Freundschaft am wichtigsten? Verwenden Sie: sich befinden, worum geht es, ermoeglichten" },
    writingDeepen: { topic: "Schreiben - Brief an eine Freundin", instruction: "Schreiben Sie 7-8 Saetze an eine Freundin, die Sie vermissen. Verwenden Sie: ankommen auf, abhaengen von, in Erfuellung gehen, sich unterhalten mit" },
    writingImmerse: { topic: "Schreiben - Ihre Geschichte", instruction: "Freies Schreiben. Kulturwort: Herzlichkeit - echte Waerme in menschlichen Beziehungen. Sprichwort: Gleich und gleich gesellt sich gern." }
  },
  fri: {
    theme: "Meine Beziehungen - mein Zuhause",
    task: { topic: "Aufwaermen - Freundschaft: Russland vs. Deutschland", prompt: "Sie erklaeren einem deutschen Bekannten, wie Freundschaft in Russland funktioniert. Was ist anders?", instruction: "5 Saetze. Vergleichen Sie - kein Stress, einfach erzaehlen.", hint: "In Russland befinden sich Freunde oft... Das ermoeglicht eine andere Naehe..." },
    deepen: { topic: "Situation - Was vermisst du? Was hast du gefunden?", prompt: "Ihr Bekannter fragt: Was vermisst du am meisten? Was hast du hier gefunden, womit du nicht gerechnet hast?", instruction: "7-8 Saetze. Alle Woerter verwenden. Ehrlich und persoenlich.", hint: "Worum es mir wirklich geht... In Erfuellung gegangen ist... Das ermoeglicht mir heute..." },
    immerse: { topic: "Ihre Geschichte - Der Moment des Ankommens", prompt: "Erzaehlen Sie von einem Moment, der Ihnen gezeigt hat: Hier bin ich angekommen.", instruction: "Erzaehlen Sie frei - so persoenlich wie Sie moechten.", hint: "Worum es wirklich geht, habe ich erst hier verstanden..." },
    writingTask: { topic: "Schreiben - Aufwaermen", instruction: "Schreiben Sie 5 Saetze: Vergleichen Sie Freundschaft in Russland und in Deutschland. Verwenden Sie: sich befinden, sich unterhalten mit, worum geht es" },
    writingDeepen: { topic: "Schreiben - Was bedeutet Zuhause?", instruction: "Schreiben Sie 7-8 Saetze: Was bedeutet Zuhause fuer Sie heute? Verwenden Sie: ermoeglichten, in Erfuellung gehen, abhaengen von, ankommen auf" },
    writingImmerse: { topic: "Schreiben - Ihre Geschichte", instruction: "Freies Schreiben. Kulturwoerter: Heimweh - Sehnsucht nach der Heimat. Fernweh - Sehnsucht nach der Ferne. Sprichwort: Wo man sich wohl fuehlt, ist man zu Hause." }
  }
};

const res = await fetch(`${FB}/teacher/olga/weekPlan.json`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(weekPlan)
});
const result = await res.json();
console.log(res.ok ? 'OK - план записан в Firebase!' : 'Ошибка: ' + JSON.stringify(result));
