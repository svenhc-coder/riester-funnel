/* VersicherungsFuchs — Multi-Check-Engine Registry (v1)
 * Ein Ort für alle Checks: Fragen + optionaler Verzweigungs-Block + Scoring + Meta.
 * Der generische Wizard (/versicherungs-check/q/) und die Ergebnis-Seite lesen daraus.
 * §34d: Einordnung, nie Produktempfehlung. Neue Checks = hier ein Eintrag ergänzen.
 */
(function () {
  'use strict';

  /* ---------------- BU / DU ---------------- */
  var QUESTIONS_BU = [
    {id:'status', question:'Was beschreibt Ihre berufliche Situation am besten?',
     hint:'Entscheidet, ob Berufsunfähigkeit (BU) oder – bei Beamten – Dienstunfähigkeit (DU) der richtige Schutz ist.',
     options:[{label:'Angestellt',value:'angestellt'},{label:'Beamter / Beamtin (auch Anwärter, Referendar)',value:'beamter'},
       {label:'Selbstständig / Freiberuflich',value:'selbststaendig'},{label:'In Ausbildung / Azubi',value:'azubi'},{label:'Student / Studentin',value:'student'}]},
    {id:'taetigkeit', question:'Wie sieht Ihr Arbeitsalltag überwiegend aus?',
     hint:'Der körperliche Anteil ist der größte Preisfaktor in der BU – Bürojob und Handwerk werden sehr unterschiedlich kalkuliert.',
     options:[{label:'Überwiegend Büro / Schreibtisch',value:'buero'},{label:'Gemischt (Büro + unterwegs / leicht körperlich)',value:'gemischt'},
       {label:'Überwiegend körperlich / handwerklich',value:'koerperlich'},{label:'Viel Reisetätigkeit / Außendienst',value:'reise'}]},
    {id:'alter', question:'Wie alt sind Sie?',
     hint:'Je früher der Abschluss, desto günstiger und leichter – das Eintrittsalter ist entscheidend.',
     options:[{label:'Unter 25',value:'u25'},{label:'25–34',value:'25_34'},{label:'35–44',value:'35_44'},{label:'45–54',value:'45_54'},{label:'55 oder älter',value:'ue55'}]},
    {id:'einkommen', question:'Wie hoch ist Ihr aktuelles Netto-Einkommen im Monat?',
     hint:'Damit schätzen wir Ihre Absicherungslücke – Faustregel: ca. 80 % des Nettos sollten abgesichert sein.',
     options:[{label:'Unter 1.500 €',value:'u1500'},{label:'1.500–2.500 €',value:'1500_2500'},{label:'2.500–4.000 €',value:'2500_4000'},
       {label:'Über 4.000 €',value:'ue4000'},{label:'Schwankend / noch kein festes Einkommen',value:'schwankend'}]},
    {id:'raucher', question:'Rauchen Sie?', hint:'Nichtraucher erhalten in der Regel deutlich günstigere Beiträge.',
     options:[{label:'Nichtraucher',value:'nein'},{label:'Raucher',value:'ja'}]},
    {id:'gesundheit', question:'Gibt es gesundheitlich etwas, das ein Versicherer wissen müsste?',
     hint:'Grobe Selbsteinschätzung – kein Gesundheitsformular. Besonders relevant sind Rücken/Gelenke und die Psyche (die häufigsten Gründe für Berufsunfähigkeit).',
     options:[{label:'Nein, alles unauffällig',value:'keine'},{label:'Einzelnes (z. B. Rücken, Allergie, ausgeheilt)',value:'einzeln'},
       {label:'Mehreres / chronisch / Psyche',value:'mehrere'},{label:'Weiß ich nicht genau',value:'unbekannt'}]},
    {id:'hobbys', question:'Üben Sie risikoreichere Hobbys aus?',
     hint:'Z. B. Motor-, Kampf-, Tauch- oder Bergsport, Klettern, Fallschirmspringen – kann zu Zuschlägen oder Ausschlüssen führen.',
     options:[{label:'Nein',value:'nein'},{label:'Ja, eines davon',value:'eines'},{label:'Ja, mehrere / regelmäßig',value:'mehrere'}]},
    {id:'bestehend', question:'Haben Sie bereits eine Berufsunfähigkeits-Absicherung?',
     hint:'Auch eine über den Arbeitgeber (z. B. in der betrieblichen Altersvorsorge) zählt.',
     options:[{label:'Nein',value:'nein'},{label:'Ja, privat',value:'privat'},{label:'Ja, über den Arbeitgeber',value:'ag'},{label:'Weiß ich nicht',value:'unbekannt'}]},
    {id:'wunschrente', question:'Welche monatliche BU-Rente hätten Sie gern abgesichert?',
     hint:'Der Betrag, der monatlich fließen soll, falls Sie Ihren Beruf nicht mehr ausüben können.',
     options:[{label:'Bis 1.000 €',value:'b1000'},{label:'1.000–1.500 €',value:'1000_1500'},{label:'1.500–2.500 €',value:'1500_2500'},
       {label:'Über 2.500 €',value:'ue2500'},{label:'Weiß ich noch nicht',value:'unbekannt'}]},
    {id:'zielbild', question:'Was möchten Sie als Nächstes tun?', hint:'',
     options:[{label:'Erst prüfen lassen, wie ich stehe',value:'pruefen'},{label:'Konkret Angebote vergleichen',value:'vergleich'},
       {label:'Ich habe eine Vorerkrankung – geht das überhaupt?',value:'voranfrage'}]},
  ];
  var QUESTIONS_DU_EXTRA = [
    {id:'du_status', question:'In welchem Verbeamtungs-Status sind Sie?',
     hint:'Anwärter und Beamte auf Probe haben oft besonders wichtige (und günstige) Zeitfenster.',
     options:[{label:'Anwärter / Referendar',value:'anwaerter'},{label:'Beamter auf Probe',value:'probe'},
       {label:'Beamter auf Lebenszeit',value:'lebenszeit'},{label:'Noch nicht verbeamtet (geplant)',value:'geplant'}]},
    {id:'du_klausel', question:'Enthält eine bestehende Absicherung eine echte Dienstunfähigkeits-Klausel?',
     hint:'Eine „echte DU-Klausel" leistet, wenn Ihr Dienstherr Sie in den Ruhestand versetzt – anders als ein reiner BU-Baustein. Genau hier machen viele Verträge einen Unterschied.',
     options:[{label:'Ja, echte DU-Klausel',value:'echt'},{label:'Nur BU mit DU-Baustein',value:'baustein'},
       {label:'Keine Absicherung',value:'keine'},{label:'Weiß ich nicht',value:'unbekannt'}]},
  ];

  function bandv(v, map, def){ return (v in map)?map[v]:def; }
  function scoreBU(a){
    a = a || {};
    var isDU = a.status === 'beamter';
    // Absicherungslücke
    var eink = bandv(a.einkommen,{u1500:1,'1500_2500':2,'2500_4000':3,ue4000:3,schwankend:2},2);
    var L;
    if(a.bestehend==='privat') L={score:1,stufe:'gedeckt',text:'Sie haben bereits eine private BU. Sinnvoll ist ein Blick, ob Höhe und Bedingungen noch zu Ihrer heutigen Situation passen.'};
    else if(a.bestehend==='ag') L={score:2,stufe:'teilweise',text:'Eine Absicherung über den Arbeitgeber ist ein guter Anfang – sie ist aber oft an den Job gebunden und niedriger als der eigene Bedarf. Eine ergänzende private BU ist häufig sinnvoll.'};
    else L={score:3,stufe:(eink>=3?'gross':(eink===2?'mittel':'grundlegend')),text:'Aktuell ist Ihre Arbeitskraft – Ihr wichtigstes Vermögen – nicht privat abgesichert. Fällt das Einkommen weg, entsteht schnell eine große Lücke.'};
    // Dringlichkeit
    var s = bandv(a.alter,{u25:3,'25_34':3,'35_44':2,'45_54':1,ue55:1},2);
    if(a.bestehend==='nein'||a.bestehend==='unbekannt') s+=1;
    if(a.gesundheit==='keine') s+=1;
    if(a.taetigkeit==='koerperlich') s+=1;
    var Dstufe = s>=4?'hoch':(s>=2?'mittel':'niedrig');
    var Dtext = Dstufe==='hoch'?'Je früher und gesünder, desto günstiger und einfacher – für Sie spricht gerade viel dafür, das jetzt anzugehen.'
      :(Dstufe==='mittel'?'Ein Abschluss wird mit jedem Jahr tendenziell teurer. Es lohnt sich, das Thema nicht liegen zu lassen.'
      :'Auch wenn kein Zeitdruck besteht: eine saubere Bestandsaufnahme schadet nie.');
    // Versicherbarkeit
    var risk=0;
    if(a.gesundheit==='einzeln')risk+=1; if(a.gesundheit==='mehrere')risk+=2; if(a.gesundheit==='unbekannt')risk+=1;
    if(a.hobbys==='eines')risk+=1; if(a.hobbys==='mehrere')risk+=2; if(a.zielbild==='voranfrage')risk+=1;
    var voranfrage = risk>0;
    var Vtext = voranfrage
      ? 'Ein paar Punkte sollten wir vorab klären. Das Gute: Bevor irgendwo ein Antrag steht, machen wir für Sie eine <strong>anonyme Risiko-Voranfrage</strong> bei mehreren Versicherern – so wissen Sie, woran Sie sind, ohne dass ein Eintrag entsteht.'
      : 'Nach Ihren Angaben spricht nichts gegen eine unkomplizierte Annahme – das lässt sich mit wenigen Gesundheitsfragen klären.';
    var ampel = 'gelb';
    if(L.score>=3 && (Dstufe==='hoch'||Dstufe==='mittel')) ampel='rot';
    else if(L.stufe==='gedeckt' && !voranfrage) ampel='gruen';
    var bloecke = [
      {h:'Ihre Absicherungslücke', t:L.text},
      {h:'Wie dringlich ist das für Sie?', t:Dtext},
      {h:'Versicherbarkeit', t:Vtext}];
    if(isDU){
      var du = a.du_klausel==='baustein'?'Wichtig für Beamte: Ihre Absicherung sollte eine <strong>echte Dienstunfähigkeits-Klausel</strong> enthalten – ein reiner BU-Baustein leistet nicht automatisch, wenn Ihr Dienstherr Sie in den Ruhestand versetzt. Genau das prüfen wir.'
        :((a.du_klausel==='keine'||a.du_klausel==='unbekannt')?'Für Beamte ist die <strong>echte Dienstunfähigkeits-Klausel</strong> der entscheidende Punkt – sie leistet, wenn Sie dienstunfähig werden. Ob und wie Sie hier abgesichert sind, klären wir gemeinsam.'
        :'Sie haben bereits eine echte DU-Klausel – wir prüfen, ob Höhe und Bedingungen zu Ihrem Verbeamtungs-Status passen.');
      bloecke.splice(1,0,{h:'Dienstunfähigkeit: der entscheidende Punkt', t:du});
    }
    return {ampel:ampel, ampelLabel:{rot:'Deutlicher Handlungsbedarf',gelb:'Prüfenswert',gruen:'Gut aufgestellt'}[ampel],
      titel: isDU?'Ihre Dienstunfähigkeits-Einordnung':'Ihre Berufsunfähigkeits-Einordnung', bloecke:bloecke, voranfrage:voranfrage};
  }

  /* ---------------- Registry ---------------- */
  window.VF_CHECKS = {
    bu: {
      key:'bu', label:'Berufsunfähigkeits-Check', kurz:'BU-Check',
      intro:'10 kurze Fragen zu Beruf, Situation und Absicherung. Am Ende: eine ehrliche Einordnung – kein Verkauf.',
      questions: QUESTIONS_BU,
      branch:{when:function(a){return a.status==='beamter';}, after:'status', questions:QUESTIONS_DU_EXTRA},
      score: scoreBU,
      leadSource:'bu-check'
    }
  };

  // Fragenliste je nach Antworten (Verzweigung einbauen)
  window.vfCheckQuestions = function(type, answers){
    var c = window.VF_CHECKS[type]; if(!c) return [];
    var list = c.questions.slice();
    if(c.branch && c.branch.when(answers||{})){
      var idx = list.findIndex(function(q){return q.id===c.branch.after;});
      var ins = idx>=0?idx+1:list.length;
      list = list.slice(0,ins).concat(c.branch.questions).concat(list.slice(ins));
    }
    return list;
  };
})();
