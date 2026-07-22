/* VF Multi-Check-Engine (auto-assembliert). §34d. */
/* ---- bu ---- */
/* VersicherungsFuchs — BU/DU-Check Fragen (v1)
 * Geerdet in der echten iSurance-Risikovoranfrage Arbeitskraftabsicherung.
 * §34d-Orientierung: qualifiziert + ordnet ein, NIE Produktempfehlung, KEIN Antrags-Gesundheitsformular.
 * Format identisch zum Riester-Check (id/question/hint/options[{label,value}]).
 * Frage 1 (status='beamter') schaltet den Check auf den DU-Zweig (Dienstunfähigkeit).
 */
const QUESTIONS_BU = [
  {id:'status', question:'Was beschreibt Ihre berufliche Situation am besten?',
   hint:'Entscheidet, ob Berufsunfähigkeit (BU) oder – bei Beamten – Dienstunfähigkeit (DU) der richtige Schutz ist.',
   options:[
     {label:'Angestellt', value:'angestellt'},
     {label:'Beamter / Beamtin (auch Anwärter, Referendar)', value:'beamter'},
     {label:'Selbstständig / Freiberuflich', value:'selbststaendig'},
     {label:'In Ausbildung / Azubi', value:'azubi'},
     {label:'Student / Studentin', value:'student'}]},

  {id:'taetigkeit', question:'Wie sieht Ihr Arbeitsalltag überwiegend aus?',
   hint:'Der körperliche Anteil ist der größte Preisfaktor in der BU – Bürojob und Handwerk werden sehr unterschiedlich kalkuliert.',
   options:[
     {label:'Überwiegend Büro / Schreibtisch', value:'buero'},
     {label:'Gemischt (Büro + unterwegs / leicht körperlich)', value:'gemischt'},
     {label:'Überwiegend körperlich / handwerklich', value:'koerperlich'},
     {label:'Viel Reisetätigkeit / Außendienst', value:'reise'}]},

  {id:'alter', question:'Wie alt sind Sie?',
   hint:'Je früher der Abschluss, desto günstiger und leichter – das Eintrittsalter ist entscheidend.',
   options:[
     {label:'Unter 25', value:'u25'},{label:'25–34', value:'25_34'},
     {label:'35–44', value:'35_44'},{label:'45–54', value:'45_54'},{label:'55 oder älter', value:'ue55'}]},

  {id:'einkommen', question:'Wie hoch ist Ihr aktuelles Netto-Einkommen im Monat?',
   hint:'Damit schätzen wir Ihre Absicherungslücke – Faustregel: ca. 80 % des Nettos sollten abgesichert sein.',
   options:[
     {label:'Unter 1.500 €', value:'u1500'},{label:'1.500–2.500 €', value:'1500_2500'},
     {label:'2.500–4.000 €', value:'2500_4000'},{label:'Über 4.000 €', value:'ue4000'},
     {label:'Schwankend / noch kein festes Einkommen', value:'schwankend'}]},

  {id:'raucher', question:'Rauchen Sie?',
   hint:'Nichtraucher erhalten in der Regel deutlich günstigere Beiträge.',
   options:[{label:'Nichtraucher', value:'nein'},{label:'Raucher', value:'ja'}]},

  {id:'gesundheit', question:'Gibt es gesundheitlich etwas, das ein Versicherer wissen müsste?',
   hint:'Grobe Selbsteinschätzung – kein Gesundheitsformular. Besonders relevant sind Rücken/Gelenke und die Psyche (die häufigsten Gründe für Berufsunfähigkeit).',
   options:[
     {label:'Nein, alles unauffällig', value:'keine'},
     {label:'Einzelnes (z. B. Rücken, Allergie, ausgeheilt)', value:'einzeln'},
     {label:'Mehreres / chronisch / Psyche', value:'mehrere'},
     {label:'Weiß ich nicht genau', value:'unbekannt'}]},

  {id:'hobbys', question:'Üben Sie risikoreichere Hobbys aus?',
   hint:'Z. B. Motor-, Kampf-, Tauch- oder Bergsport, Klettern, Fallschirmspringen – kann zu Zuschlägen oder Ausschlüssen führen.',
   options:[
     {label:'Nein', value:'nein'},
     {label:'Ja, eines davon', value:'eines'},
     {label:'Ja, mehrere / regelmäßig', value:'mehrere'}]},

  {id:'bestehend', question:'Haben Sie bereits eine Berufsunfähigkeits-Absicherung?',
   hint:'Auch eine über den Arbeitgeber (z. B. in der betrieblichen Altersvorsorge) zählt.',
   options:[
     {label:'Nein', value:'nein'},
     {label:'Ja, privat', value:'privat'},
     {label:'Ja, über den Arbeitgeber', value:'ag'},
     {label:'Weiß ich nicht', value:'unbekannt'}]},

  {id:'wunschrente', question:'Welche monatliche BU-Rente hätten Sie gern abgesichert?',
   hint:'Der Betrag, der monatlich fließen soll, falls Sie Ihren Beruf nicht mehr ausüben können.',
   options:[
     {label:'Bis 1.000 €', value:'b1000'},{label:'1.000–1.500 €', value:'1000_1500'},
     {label:'1.500–2.500 €', value:'1500_2500'},{label:'Über 2.500 €', value:'ue2500'},
     {label:'Weiß ich noch nicht', value:'unbekannt'}]},

  {id:'zielbild', question:'Was möchten Sie als Nächstes tun?',
   hint:'',
   options:[
     {label:'Erst prüfen lassen, wie ich stehe', value:'pruefen'},
     {label:'Konkret Angebote vergleichen', value:'vergleich'},
     {label:'Ich habe eine Vorerkrankung – geht das überhaupt?', value:'voranfrage'}]},
];

/* DU-Zweig: Zusatzfragen, wenn status==='beamter' (werden im Wizard angehängt).
 * Der Knackpunkt aus RUV/ÖD-DBV-Zusatzblatt: echte DU-Klausel vs. nur BU mit DU-Baustein. */
const QUESTIONS_DU_EXTRA = [
  {id:'du_status', question:'In welchem Verbeamtungs-Status sind Sie?',
   hint:'Anwärter und Beamte auf Probe haben oft besonders wichtige (und günstige) Zeitfenster.',
   options:[
     {label:'Anwärter / Referendar', value:'anwaerter'},
     {label:'Beamter auf Probe', value:'probe'},
     {label:'Beamter auf Lebenszeit', value:'lebenszeit'},
     {label:'Noch nicht verbeamtet (geplant)', value:'geplant'}]},

  {id:'du_klausel', question:'Enthält eine bestehende Absicherung eine echte Dienstunfähigkeits-Klausel?',
   hint:'Wichtig: Eine „echte DU-Klausel" leistet, wenn Ihr Dienstherr Sie in den Ruhestand versetzt – anders als ein reiner BU-Baustein. Genau hier machen viele Verträge einen Unterschied.',
   options:[
     {label:'Ja, echte DU-Klausel', value:'echt'},
     {label:'Nur BU mit DU-Baustein', value:'baustein'},
     {label:'Keine Absicherung', value:'keine'},
     {label:'Weiß ich nicht', value:'unbekannt'}]},
];
/* ---- pkv ---- */
/* VersicherungsFuchs — PKV-Check Fragen (v1)
 * Geerdet in echten iSurance-Unterlagen: Erstkontakt-PKV-Lead, Beratungsscript KV,
 * Risikovorabanfrage KV Voll (SDV, 06.2024), Angebotsanforderung Beihilfe (06.2024),
 * PKV-Gesundheitsfragen/Selbstauskünfte (Einheitsantrag).
 * §34d-Orientierung: qualifiziert + ordnet ehrlich ein, NIE Produkt-/Tarifempfehlung,
 * KEIN Antrags-Gesundheitsformular (nur grober Indikator statt Antragsfragen).
 * Format identisch zum Riester-/BU-Check (id/question/hint/options[{label,value}]).
 * Frage 1 (status='beamter') schaltet den Beihilfe-Zweig frei (QUESTIONS_BEIHILFE_EXTRA).
 */
const QUESTIONS_PKV = [
  {id:'status', question:'Was beschreibt Ihre berufliche Situation am besten?',
   hint:'Der wichtigste Weichensteller: Angestellte brauchen ein Einkommen über der Versicherungspflichtgrenze, Selbstständige haben freie Wahl – und für Beamte führt der Weg fast immer über die Beihilfe (nur der Rest wird privat abgesichert).',
   options:[
     {label:'Angestellt', value:'angestellt'},
     {label:'Beamter / Beamtin (auch Anwärter, Referendar, Soldat)', value:'beamter'},
     {label:'Selbstständig / Freiberuflich', value:'selbststaendig'},
     {label:'Student / Studentin', value:'student'},
     {label:'Aktuell nicht erwerbstätig / Sonstiges', value:'sonstiges'}]},

  {id:'einkommen', question:'Wie hoch ist Ihr Brutto-Einkommen im Jahr?',
   hint:'Nur für Angestellte entscheidend: Ihr Bruttoeinkommen muss über der gesetzlichen Versicherungspflichtgrenze (Jahresarbeitsentgeltgrenze) liegen, die jährlich angepasst wird – zuletzt im Bereich von rund 69.000–74.000 € pro Jahr. Für Beamte, Selbstständige und Studenten gilt diese Grenze nicht.',
   options:[
     {label:'Unter 60.000 €', value:'u60'},
     {label:'60.000–70.000 €', value:'60_70'},
     {label:'70.000–80.000 €', value:'70_80'},
     {label:'Über 80.000 €', value:'ue80'},
     {label:'Schwankend / kein festes Gehalt (z. B. selbstständig)', value:'schwankend'}]},

  {id:'aktuell', question:'Wie sind Sie aktuell krankenversichert?',
   hint:'Damit sehen wir, ob überhaupt ein Wechsel ansteht – und ob dabei Fristen (z. B. Kündigung der gesetzlichen Kasse) zu beachten sind.',
   options:[
     {label:'Gesetzlich (GKV) – pflichtversichert', value:'gkv_pflicht'},
     {label:'Gesetzlich (GKV) – freiwillig versichert', value:'gkv_freiwillig'},
     {label:'Bereits privat (PKV) – Optimierung/Wechsel', value:'pkv'},
     {label:'Familienversichert (über Partner/Eltern)', value:'familie'},
     {label:'Weiß ich nicht genau', value:'unbekannt'}]},

  {id:'ziel', question:'Was ist Ihr wichtigster Grund, sich mit der PKV zu beschäftigen?',
   hint:'Hilft uns, ehrlich einzuordnen, ob die PKV zu Ihrem Ziel passt – oder ob eine gute gesetzliche Lösung mit Zusatzschutz sinnvoller ist.',
   options:[
     {label:'Bessere Leistungen (Arzt, Klinik, Zahn)', value:'leistung'},
     {label:'Besseres Preis-Leistungs-Verhältnis / Beitrag', value:'beitrag'},
     {label:'Als Selbstständiger sinnvoll absichern', value:'selbststaendig'},
     {label:'Als Beamter die Beihilfe optimal ergänzen', value:'beihilfe'},
     {label:'Erst einmal Orientierung – weiß es noch nicht', value:'orientierung'}]},

  {id:'alter', question:'Wie alt sind Sie?',
   hint:'Das Eintrittsalter beeinflusst Beitrag und Annahme spürbar – je früher, desto günstiger die Alterungsrückstellungen. Bei Beamten sind Anwärter-Zeiten besonders attraktiv.',
   options:[
     {label:'Unter 25', value:'u25'},{label:'25–34', value:'25_34'},
     {label:'35–44', value:'35_44'},{label:'45–54', value:'45_54'},{label:'55 oder älter', value:'ue55'}]},

  {id:'familie', question:'Wer soll neben Ihnen mit abgesichert werden?',
   hint:'Wichtig: In der PKV gibt es keine kostenlose Familienversicherung wie in der GKV – jede Person zahlt einen eigenen Beitrag. Bei Beamten sind Kinder und oft der Partner aber eigenständig beihilfeberechtigt.',
   options:[
     {label:'Nur ich', value:'allein'},
     {label:'Ich und mein/e Partner/in', value:'partner'},
     {label:'Ich und mein(e) Kind(er)', value:'kinder'},
     {label:'Ich, Partner/in und Kind(er)', value:'familie'}]},

  {id:'gesundheit', question:'Gibt es gesundheitlich etwas, das ein Versicherer wissen müsste?',
   hint:'Nur eine grobe Selbsteinschätzung – kein Gesundheitsformular. In der PKV zählen später vor allem Behandlungen der letzten 3 Jahre (ambulant), 5 Jahre (stationär) und bis zu 10 Jahre (Psyche/Sucht). Die Details klären wir separat – bei Bedarf anonym.',
   options:[
     {label:'Nein, in den letzten Jahren alles unauffällig', value:'keine'},
     {label:'Einzelnes / ausgeheilt (z. B. Allergie, einmalige Behandlung)', value:'einzeln'},
     {label:'Chronisch / laufende Behandlung / Medikamente / Psyche', value:'mehrere'},
     {label:'Weiß ich nicht genau', value:'unbekannt'}]},

  {id:'leistung', question:'Welche Leistung wäre Ihnen im Ernstfall am wichtigsten?',
   hint:'Nur zur groben Schwerpunkt-Einordnung – nicht als Tarifauswahl. Typische Stellschrauben sind Chefarzt/Ein- oder Zweibettzimmer, Zahnersatz, freie Facharztwahl ohne Überweisung und (für Selbstständige) das Krankentagegeld ab dem 43. Tag.',
   options:[
     {label:'Freie Klinikwahl, Chefarzt, 1-/2-Bettzimmer', value:'stationaer'},
     {label:'Top-Zahnleistungen (Zahnersatz, Kieferorthopädie)', value:'zahn'},
     {label:'Freie Facharztwahl, kurze Wartezeiten', value:'ambulant'},
     {label:'Krankentagegeld – Einkommen bei langer Krankheit sichern', value:'krankentagegeld'},
     {label:'Noch unklar – erst beraten lassen', value:'unklar'}]},

  {id:'zielbild', question:'Was möchten Sie als Nächstes tun?',
   hint:'',
   options:[
     {label:'Erst prüfen lassen, ob die PKV für mich sinnvoll ist', value:'pruefen'},
     {label:'Konkret Leistungen und Beiträge vergleichen', value:'vergleich'},
     {label:'Ich habe eine Vorerkrankung – geht das überhaupt?', value:'voranfrage'}]},
];

/* Beihilfe-Zweig: Zusatzfragen, wenn status==='beamter' (werden im Wizard angehängt).
 * Geerdet in „Angebotsanforderung Beihilfe" + „Risikovorabanfrage KV Voll" (SDV, 06.2024):
 * Verbeamtungs-Status, Beihilfesatz/Bundesland und der Kreis der beihilfeberechtigten Personen
 * bestimmen, welcher Restanteil überhaupt privat abgesichert werden muss. */
const QUESTIONS_BEIHILFE_EXTRA = [
  {id:'beihilfe_status', question:'In welchem Verbeamtungs-Status sind Sie?',
   hint:'Anwärter und Beamte auf Probe haben oft besonders günstige Einstiegs-Zeitfenster. Der Beihilfeanspruch (und damit der privat abzusichernde Rest) hängt an diesem Status.',
   options:[
     {label:'Anwärter / Referendar', value:'anwaerter'},
     {label:'Beamter/Beamtin auf Probe', value:'probe'},
     {label:'Beamter/Beamtin auf Lebenszeit', value:'lebenszeit'},
     {label:'Soldat/Soldatin (auf Zeit)', value:'soldat'},
     {label:'Noch nicht verbeamtet (geplant)', value:'geplant'}]},

  {id:'beihilfe_wer', question:'Wer in Ihrer Familie ist beihilfeberechtigt bzw. soll abgesichert werden?',
   hint:'Die Beihilfe übernimmt einen prozentualen Anteil der Kosten – privat abgesichert wird nur der Rest. Für Ehepartner (je nach Einkommen) und Kinder gelten eigene Beihilfesätze, die den Beitrag deutlich senken.',
   options:[
     {label:'Nur ich', value:'nur_ich'},
     {label:'Ich und mein/e Partner/in', value:'partner'},
     {label:'Ich und mein(e) Kind(er)', value:'kinder'},
     {label:'Ganze Familie (Partner/in und Kinder)', value:'familie'},
     {label:'Weiß ich noch nicht', value:'unbekannt'}]},
];

/* ── Ergebnis-Dimensionen (nur Doku – NICHT hier gecodet, §34d: keine Tarifnennung) ──
 * 1) „PKV grundsätzlich möglich / prüfenswert":
 *    - Angestellt: nur wenn einkommen ∈ {70_80, ue80} bzw. glaubhaft über der Versicherungs-
 *      pflichtgrenze; bei u60/60_70 eher „noch nicht möglich, GKV + Zusatzschutz" einordnen.
 *    - Selbstständig/Freiberuflich & Student: grundsätzlich frei wählbar → „möglich".
 *    - Beamter: fast immer sinnvoll über Beihilfe → eigener Beihilfe-Zweig, „stark prüfenswert".
 * 2) „Wechsel-Sinnhaftigkeit" (ehrlich, kann auch „nicht sinnvoll" lauten):
 *    - aktuell=pkv → Optimierung statt Wechsel; aktuell=gkv_pflicht + niedriges Einkommen →
 *      abraten/GKV halten; ziel=beitrag allein → warnen (PKV ist kein Sparmodell, Beiträge im
 *      Alter); alter=ue55 → Wechsel kritisch hinterfragen.
 * 3) „Gesundheit klärungsbedürftig":
 *    - gesundheit ∈ {mehrere, unbekannt} ODER zielbild=voranfrage → KLÄRUNGSBEDÜRFTIG.
 *
 * Killer-CTA bei Klärungsbedarf (gesundheit=mehrere|unbekannt oder zielbild=voranfrage):
 *   anonyme/unverbindliche Risikovoranfrage über den Makler – Chancen prüfen, OHNE dass
 *   eine ablehnbare Antragshistorie entsteht (kein Arztbesuch nötig; Details separat).
 * Grundton durchgehend §34d-konform: einordnen + qualifizieren, NIE „Tarif X empfehlen". */
/* ---- kvzusatz ---- */
/* VersicherungsFuchs — Krankenzusatz-Check Fragen (v1)
 * Zielgruppe: gesetzlich Versicherte (GKV). Schwerpunkte: Zahn, ambulant (Brille/
 * Heilpraktiker/Vorsorge), stationär (Chefarzt/Einbett), Pflegezusatz.
 * Geerdet in echten iSurance-Unterlagen: Zahnzusatz-Vergleich (DKV/Barmenia/AXA),
 * Signal-Zahnstaffel 01/2023, uni-med|A ambulant (uniVersa), ARAG-Antrag (Gesundheitsfragen).
 * §34d-Orientierung: qualifiziert + ordnet ein, NIE Produktempfehlung, KEIN Antrags-Gesundheitsformular.
 * Format identisch zum Riester-/BU-Check (id/question/hint/options[{label,value}]).
 *
 * Fachlicher Kern = Zahnstaffel + Wartezeit: In den ersten Jahren begrenzt der Tarif die
 * Leistung (z. B. Jahr 1 ~500–1.000 €, steigend, ab Jahr 5–9 unbegrenzt), dazu meist 8 Monate
 * Wartezeit. Für bereits angeratene/laufende Behandlungen wird i. d. R. NICHT geleistet.
 * → Kernbotschaft: früh + VOR erkennbarem Behandlungsbedarf abschließen, solange die Zähne gesund sind.
 *
 * Ergebnis-Dimensionen (im Wizard/Auswertung nutzen):
 *   1) „Lücke je Bereich"  — wo klafft GKV-seitig die größte Lücke (Zahn/ambulant/stationär/Pflege)?
 *   2) „Timing (Staffel/vor Bedarf)" — wie dringend? Staffel/Wartezeit vs. absehbarer Behandlungsbedarf.
 *   3) „passt Zusatz oder eher PKV" — bei breitem Bedarf + Budget + Alter ggf. Vollversicherung/PKV prüfen.
 * CTA: persönliche §34d-Beratung (keine Produktempfehlung im Tool).
 */
const QUESTIONS_KVZUSATZ = [
  {id:'bereich', question:'Welcher Bereich ist Ihnen am wichtigsten?',
   hint:'Die gesetzliche Kasse zahlt je Bereich unterschiedlich viel dazu – das entscheidet, wo eine Zusatzversicherung am meisten bringt.',
   options:[
     {label:'Zähne (Zahnersatz, Behandlung, Prophylaxe)', value:'zahn'},
     {label:'Ambulant (Brille/Laser-OP, Heilpraktiker, Vorsorge)', value:'ambulant'},
     {label:'Krankenhaus (Chefarzt, Ein-/Zweibettzimmer)', value:'stationaer'},
     {label:'Pflege (Pflegezusatz / Pflegetagegeld)', value:'pflege'},
     {label:'Rundum-Schutz / mehrere Bereiche', value:'kombi'}]},

  {id:'fuer_wen', question:'Für wen soll der Schutz sein?',
   hint:'Kinder sind oft eigenständig und günstig versicherbar – z. B. eine Zahnspange (Kieferorthopädie) wird meist nur bis 18 bzw. 21 Jahre geleistet.',
   options:[
     {label:'Für mich selbst', value:'selbst'},
     {label:'Für meine Partnerin / meinen Partner', value:'partner'},
     {label:'Für mein Kind / meine Kinder', value:'kind'},
     {label:'Für die ganze Familie', value:'familie'}]},

  {id:'alter', question:'Wie alt ist die zu versichernde Person?',
   hint:'Je früher der Einstieg, desto günstiger und leichter die Annahme – der Beitrag richtet sich nach dem Eintrittsalter.',
   options:[
     {label:'Kind (unter 18)', value:'kind'},
     {label:'18–30', value:'18_30'},
     {label:'31–45', value:'31_45'},
     {label:'46–60', value:'46_60'},
     {label:'Über 60', value:'ue60'}]},

  {id:'zahn_bedarf', question:'Steht bei den Zähnen in absehbarer Zeit etwas an?',
   hint:'Wichtigster Punkt beim Zahnzusatz: In den ersten Jahren gilt eine „Zahnstaffel" (gedeckelte Höchstbeträge, die langsam steigen) plus meist 8 Monate Wartezeit. Für bereits empfohlene oder laufende Behandlungen wird in der Regel nicht mehr geleistet – deshalb lohnt der Abschluss, solange die Zähne gesund sind.',
   options:[
     {label:'Nein, Zähne gesund – ich möchte vorsorgen', value:'vorsorge'},
     {label:'Zahnersatz / Implantat ist absehbar oder schon empfohlen', value:'ersatz_absehbar'},
     {label:'Zahnspange fürs Kind (Kieferorthopädie)', value:'kfo'},
     {label:'Aktuell in Behandlung / Heil- und Kostenplan liegt vor', value:'in_behandlung'},
     {label:'Zähne sind für mich kein Schwerpunkt', value:'na'}]},

  {id:'gesundheit', question:'Gibt es gesundheitlich etwas, das ein Versicherer wissen müsste?',
   hint:'Grobe Selbsteinschätzung – kein Gesundheitsformular. Für die Zusatzversicherung zählen vor allem fehlende oder überkronte Zähne, laufende Behandlungen, eine Sehhilfe oder Vorerkrankungen: Sie entscheiden über Annahme, Beitrag und mögliche Wartezeiten.',
   options:[
     {label:'Nein, alles unauffällig', value:'keine'},
     {label:'Brille/Kontaktlinsen oder Kleinigkeiten', value:'einzeln'},
     {label:'Fehlende / überkronte Zähne oder laufende Zahnbehandlung', value:'zahn_vorbelastet'},
     {label:'Chronische Erkrankung / Psyche / Pflegebedarf', value:'mehrere'},
     {label:'Weiß ich nicht genau', value:'unbekannt'}]},

  {id:'bestehend', question:'Haben Sie bereits eine Krankenzusatzversicherung?',
   hint:'Auch ein Tarif über den Arbeitgeber oder eine Gruppen-/Kollektivvereinbarung zählt – Vorversicherungszeiten können auf Wartezeiten angerechnet werden.',
   options:[
     {label:'Nein', value:'nein'},
     {label:'Ja, eine Zahnzusatzversicherung', value:'zahn'},
     {label:'Ja, eine andere (ambulant / stationär / Pflege)', value:'andere'},
     {label:'Weiß ich nicht genau', value:'unbekannt'}]},

  {id:'budget', question:'Was möchten Sie monatlich ungefähr investieren?',
   hint:'Nur zur Orientierung – ein solider Zahnzusatz startet oft im niedrigen zweistelligen Bereich, ein Rundum-Schutz liegt höher.',
   options:[
     {label:'Bis 15 €', value:'b15'},
     {label:'15–30 €', value:'15_30'},
     {label:'30–50 €', value:'30_50'},
     {label:'Über 50 €', value:'ue50'},
     {label:'Noch offen', value:'offen'}]},

  {id:'zielbild', question:'Was möchten Sie als Nächstes tun?',
   hint:'',
   options:[
     {label:'Erst prüfen, wo meine größte Lücke ist', value:'pruefen'},
     {label:'Konkret Leistungen vergleichen', value:'vergleich'},
     {label:'Ich habe ein Zahn-/Vorerkrankungsthema – geht das noch?', value:'voranfrage'}]},
];
/* ---- basisrente ---- */
/* VersicherungsFuchs — Basisrenten-Check (Rürup) Fragen (v1)
 * Zielgruppe: Selbstständige/Freiberufler ohne Riester-Zugang + Gutverdiener mit hohem Grenzsteuersatz.
 * Fachlich geerdet: Beiträge als Sonderausgaben abziehbar (§10 EStG, seit 2023 zu 100 %); lebenslange Rente;
 * NICHT kapitalisierbar / kündbar / vererbbar (nur mit Zusatz), nicht pfändbar/Hartz-IV-sicher.
 * §34d-Orientierung: qualifiziert + ordnet ein (Steuer-Hebel, Eignung, Flexibilitäts-Trade-off),
 * NIE Produktempfehlung, KEINE erfundenen Renditen, KEIN Antragsformular.
 * Format identisch zum BU-/Riester-Check (id/question/hint/options[{label,value}]).
 *
 * Ergebnis-Dimensionen (im Auswerte-Layer):
 *   - „Steuer-Hebel"           → aus status + zvE/Steuersatz-Band + sparbetrag
 *   - „Eignung"                → Selbstständig/Freiberufler ohne Riester bzw. hoher Steuersatz = starke Passung
 *   - „Flexibilitäts-Trade-off" → flexibilitaet + ziel: Unflexibilität (nicht kündbar/kapitalisierbar) muss klar sein
 */
const QUESTIONS_BASISRENTE = [
  {id:'status', question:'Was beschreibt Ihre berufliche Situation am besten?',
   hint:'Entscheidend für die Passung: Selbstständige und Freiberufler haben oft keinen Riester-Zugang – für sie ist die Basisrente häufig der einzige staatlich geförderte Weg. Für Gutverdiener zählt vor allem der Steuervorteil.',
   options:[
     {label:'Selbstständig (Gewerbe / eigene Firma)', value:'selbststaendig'},
     {label:'Freiberuflich (z. B. Arzt, Anwalt, IT, Kreativ)', value:'freiberufler'},
     {label:'Angestellt mit hohem Einkommen', value:'angestellt_gut'},
     {label:'Gesellschafter-Geschäftsführer (GmbH)', value:'gesellschafter_gf'},
     {label:'Angestellt mit normalem Einkommen', value:'angestellt_normal'}]},

  {id:'zve', question:'In welchem Bereich liegt Ihr zu versteuerndes Jahreseinkommen ungefähr?',
   hint:'Das ist der wichtigste Faktor für den Steuer-Hebel: Je höher Ihr persönlicher Steuersatz, desto mehr Förderung holt jeder Euro Beitrag zurück. Grobe Einordnung genügt – keine exakte Angabe nötig.',
   options:[
     {label:'Unter 30.000 €', value:'u30'},
     {label:'30.000–60.000 €', value:'30_60'},
     {label:'60.000–100.000 € (hoher Steuersatz)', value:'60_100'},
     {label:'Über 100.000 € (Spitzensteuersatz)', value:'ue100'},
     {label:'Stark schwankend', value:'schwankend'}]},

  {id:'sparbetrag', question:'Welchen Betrag könnten Sie monatlich für die Altersvorsorge zurücklegen?',
   hint:'Bei der Basisrente sind hohe Beiträge steuerlich absetzbar (bis zu einem gesetzlichen Höchstbetrag) – gerade für gute Verdiener ein spürbarer Hebel. Der Betrag hilft uns, Ihre Vorsorgelücke und den möglichen Steuervorteil einzuordnen.',
   options:[
     {label:'Bis 100 € / Monat', value:'b100'},
     {label:'100–300 € / Monat', value:'100_300'},
     {label:'300–600 € / Monat', value:'300_600'},
     {label:'Über 600 € / Monat', value:'ue600'},
     {label:'Eher Einmalbeträge (z. B. am Jahresende)', value:'einmal'}]},

  {id:'bestehend', question:'Welche Altersvorsorge haben Sie bereits?',
   hint:'Wichtig für die Einordnung: Wer keinen Riester-Zugang und wenig gesetzliche Rente hat (typisch für Selbstständige), profitiert oft am meisten. Mehrfachauswahl-Gedanke – wählen Sie, was am ehesten passt.',
   options:[
     {label:'Praktisch nichts / nur wenig', value:'nichts'},
     {label:'Gesetzliche Rente (Pflicht)', value:'gesetzlich'},
     {label:'Riester und/oder betriebliche Altersvorsorge (bAV)', value:'riester_bav'},
     {label:'Private Rente / Fonds / ETF-Sparplan', value:'privat'},
     {label:'Mehreres davon', value:'mehreres'}]},

  {id:'ziel', question:'Was ist Ihnen bei der Vorsorge am wichtigsten?',
   hint:'Die Basisrente ist besonders stark, wenn beides zusammenkommt: Steuern jetzt senken und eine lebenslange Rente aufbauen. Ihre Priorität hilft uns, den Fokus richtig zu setzen.',
   options:[
     {label:'Jetzt möglichst viel Steuern sparen', value:'steuer'},
     {label:'Später eine möglichst hohe lebenslange Rente', value:'rente'},
     {label:'Beides gleichermaßen', value:'beides'},
     {label:'Noch unklar – erst mal verstehen', value:'unklar'}]},

  {id:'risiko', question:'Wie möchten Sie Ihr Vorsorgekapital anlegen?',
   hint:'Eine Basisrente gibt es klassisch (sicherheitsorientiert, garantierte Verzinsung) oder fondsgebunden bis hin zur ETF-Basisrente (mehr Renditechance, aber Wertschwankungen). Keine Sorge – das legen wir gemeinsam fest.',
   options:[
     {label:'Sicherheit zuerst (klassisch, mit Garantien)', value:'klassisch'},
     {label:'Ausgewogen (Mischung Sicherheit + Fonds)', value:'gemischt'},
     {label:'Renditechance (fondsgebunden / ETF-Basisrente)', value:'etf'},
     {label:'Weiß ich noch nicht', value:'unbekannt'}]},

  {id:'alter', question:'Wie alt sind Sie?',
   hint:'Der Zeithorizont bestimmt, wie viel sich bis zur Rente aufbauen kann und wie viel Renditechance sinnvoll ist – je früher, desto mehr wirkt der Zinseszins.',
   options:[
     {label:'Unter 30', value:'u30'},{label:'30–39', value:'30_39'},
     {label:'40–49', value:'40_49'},{label:'50–59', value:'50_59'},
     {label:'60 oder älter', value:'ue60'}]},

  {id:'flexibilitaet', question:'Wie wichtig ist Ihnen, jederzeit an das Geld zu kommen?',
   hint:'Ehrlich und wichtig: Eine Basisrente ist bewusst „gebunden" – Sie können sie nicht kündigen, nicht als Kapital auf einen Schlag auszahlen lassen und (ohne Zusatz) nicht frei vererben. Dafür ist sie in der Ansparphase pfändungs- und Hartz-IV-sicher. Sie sollten das bewusst mittragen.',
   options:[
     {label:'Kann ich gut akzeptieren – ist als Rente gedacht', value:'ok'},
     {label:'Teils – ein Teil sollte flexibel bleiben', value:'teils'},
     {label:'Sehr wichtig – ich will jederzeit rankommen', value:'wichtig'},
     {label:'Das war mir neu – muss ich verstehen', value:'neu'}]},

  {id:'hinterbliebene', question:'Sollen im Todesfall Angehörige abgesichert sein?',
   hint:'Basisrenten-Guthaben verfällt grundsätzlich, wenn kein Zusatz vereinbart ist. Über eine Hinterbliebenenrente (z. B. für Partner/Kinder) lässt sich das absichern – kostet aber etwas Rente. Nur relevant, wenn Menschen von Ihnen abhängig sind.',
   options:[
     {label:'Ja, Partner/in und/oder Kinder absichern', value:'ja'},
     {label:'Nein, brauche ich nicht', value:'nein'},
     {label:'Weiß ich noch nicht', value:'unbekannt'}]},

  {id:'zielbild', question:'Was möchten Sie als Nächstes tun?',
   hint:'',
   options:[
     {label:'Meinen Steuer-Hebel & meine Vorsorgelücke prüfen lassen', value:'pruefen'},
     {label:'Konkret Varianten (klassisch / ETF) vergleichen', value:'vergleich'},
     {label:'Erst mal verstehen, ob Rürup überhaupt zu mir passt', value:'verstehen'}]},
];
/* ---- kinder ---- */
/* VersicherungsFuchs — Kindervorsorge-Check Fragen (v1)
 * Geerdet in echten iSurance-Unterlagen: Zinseszins-Berechnung Familie Jandt
 * (früh anfangen: 25 €/61J ≈ 72,50 €/41J ≈ 124 €/30J für dasselbe Endkapital)
 * + NÜRNBERGER Kindervorsorge (Vermögensaufbau4Kids + EKS4Future: Schulunfähigkeit,
 *   Schüler-BU, Grundfähigkeit = Absicherung DES Kindes).
 * §34d-Orientierung: qualifiziert + ordnet ehrlich ein, NIE Produktempfehlung,
 * KEINE erfundenen Renditen, KEIN Antrags-Gesundheitsformular.
 * Format identisch zum Riester-/BU-Check (id/question/hint/options[{label,value}]).
 *
 * Ergebnis-Dimensionen (nur intern, im Auswerter zu füllen):
 *   - "Zeit-Vorteil": je jünger das Kind, desto stärker der Zinseszins-Hebel
 *     (alter=baby|klein → hoch; schule → mittel; teenager → gering).
 *   - "passende Bausteine offen": Sparen vs. auch Invaliditäts-/Gesundheits-
 *     Absicherung des Kindes (aspekt), Flexibilität (flexibilitaet).
 *   - "Klärungsbedarf": bestehende Vorsorge unbekannt, Ziel/Sparbetrag offen,
 *     Risikobereitschaft unklar.
 */
const QUESTIONS_KINDER = [
  {id:'alter', question:'Wie alt ist Ihr Kind aktuell?',
   hint:'Je früher Sie starten, desto stärker arbeitet der Zinseszins für Sie – bei gleichem Ziel reicht dann ein deutlich kleinerer monatlicher Betrag.',
   options:[
     {label:'Noch nicht geboren / im ersten Jahr', value:'baby'},
     {label:'1–5 Jahre', value:'klein'},
     {label:'6–11 Jahre', value:'schule'},
     {label:'12–17 Jahre', value:'teenager'}]},

  {id:'ziel', question:'Wofür möchten Sie in erster Linie vorsorgen?',
   hint:'Das Ziel bestimmt den Zeithorizont und wie das Geld angelegt werden sollte.',
   options:[
     {label:'Ausbildung / Studium / Führerschein', value:'ausbildung'},
     {label:'Startkapital mit 18 (Auto, erste Wohnung, Weltreise)', value:'startkapital'},
     {label:'Langfristiger Vermögensaufbau fürs Kind', value:'vermoegen'},
     {label:'Absicherung des Kindes (Gesundheit/Invalidität)', value:'absicherung'},
     {label:'Noch offen / mehreres davon', value:'offen'}]},

  {id:'sparbetrag', question:'Welchen Betrag könnten Sie monatlich zurücklegen?',
   hint:'Eine grobe Hausnummer genügt – auch kleine Beträge werden über viele Jahre erstaunlich groß. Der Betrag lässt sich später anpassen.',
   options:[
     {label:'Bis 25 €', value:'b25'},
     {label:'25–50 €', value:'25_50'},
     {label:'50–100 €', value:'50_100'},
     {label:'100–200 €', value:'100_200'},
     {label:'Über 200 €', value:'ue200'},
     {label:'Weiß ich noch nicht', value:'unbekannt'}]},

  {id:'risiko', question:'Wie sollen die Ersparnisse angelegt werden?',
   hint:'Über lange Laufzeiten können schwankungsreichere Anlagen (z. B. ETF) mehr Chancen bieten, sind aber nicht garantiert. Was zu Ihnen passt, klären wir gemeinsam.',
   options:[
     {label:'Möglichst sicher, Schwankungen vermeiden', value:'sicher'},
     {label:'Ausgewogen (Mischung aus Sicherheit und Chance)', value:'ausgewogen'},
     {label:'Chancenorientiert (z. B. ETF/Fonds, mehr Schwankung ok)', value:'chancen'},
     {label:'Weiß ich nicht genau', value:'unbekannt'}]},

  {id:'bestehend', question:'Gibt es bereits eine Vorsorge oder ein Sparprodukt fürs Kind?',
   hint:'Auch ein Sparbuch, ein Fondssparplan oder etwas von den Großeltern zählt – so vermeiden wir Doppelungen.',
   options:[
     {label:'Nein, noch nichts', value:'nein'},
     {label:'Ja, ein Sparbuch / Tagesgeld', value:'sparbuch'},
     {label:'Ja, ein Fonds-/ETF-Sparplan oder eine Versicherung', value:'plan'},
     {label:'Weiß ich nicht genau', value:'unbekannt'}]},

  {id:'aspekt', question:'Was ist Ihnen am wichtigsten?',
   hint:'Manche wollen nur Kapital aufbauen, anderen ist zusätzlich wichtig, das Kind selbst abzusichern – etwa gegen Invalidität oder gesundheitliche Einschränkungen (z. B. Schulunfähigkeit, Grundfähigkeit).',
   options:[
     {label:'Vor allem Geld fürs Kind ansparen', value:'sparen'},
     {label:'Vor allem das Kind absichern (Gesundheit/Invalidität)', value:'schutz'},
     {label:'Beides gleich wichtig', value:'beides'},
     {label:'Bin mir unsicher – bitte einordnen', value:'unsicher'}]},

  {id:'wer', question:'Wer möchte für das Kind sparen?',
   hint:'Oft legen mehrere zusammen – das erhöht den Betrag und den Zinseszins-Effekt spürbar.',
   options:[
     {label:'Eltern', value:'eltern'},
     {label:'Groß­eltern', value:'grosseltern'},
     {label:'Eltern und Großeltern gemeinsam', value:'beide'},
     {label:'Pate / andere Angehörige', value:'andere'}]},

  {id:'flexibilitaet', question:'Wie wichtig ist Ihnen Flexibilität?',
   hint:'Zum Beispiel: Beitrag pausieren, erhöhen/senken oder zwischendurch entnehmen zu können. Das kann sinnvoll sein, hat aber manchmal einen Preis.',
   options:[
     {label:'Sehr wichtig – ich möchte jederzeit anpassen können', value:'hoch'},
     {label:'Eher wichtig, aber Rendite geht vor', value:'mittel'},
     {label:'Weniger wichtig – ich lasse es lange einfach laufen', value:'gering'}]},

  {id:'zielbild', question:'Was möchten Sie als Nächstes tun?',
   hint:'',
   options:[
     {label:'Erst einordnen lassen, wie ich am besten starte', value:'einordnen'},
     {label:'Konkret Wege vergleichen (Sparen / Absicherung)', value:'vergleich'},
     {label:'Ich habe schon etwas – bitte auf Lücken prüfen', value:'check'}]},
];
/* ---- schul ---- */
/* VersicherungsFuchs — Schulunfähigkeits-Check Fragen (v1)
 * Schulunfähigkeit = BU-Äquivalent für Kinder/Schüler: sichert ab, wenn ein Kind
 * die Schule/Ausbildung dauerhaft nicht mehr schaffen kann (Nische; später EU / Pflege).
 * Geerdet in der echten NÜRNBERGER Schulunfähigkeitsversicherung (Angebot Zoe Jandt):
 *   → monatliche Rente + Beitragsbefreiung, Endalter 67, Option auf Umstellung in eine BU.
 * Zielgruppe = ELTERN → durchgängig Sie-Ansprache, kindbezogene Fragen.
 * §34d-Orientierung: qualifiziert + ordnet ein, NIE Produktempfehlung,
 *   KEIN Antrags-Gesundheitsformular (nur grobe Selbsteinschätzung).
 * Format identisch zum BU-/Riester-Check (id/question/hint/options[{label,value}]).
 *
 * Ergebnis-Dimensionen (Auswertung, nicht Frage):
 *   • "Absicherungslücke Kind"     – hat das Kind bei dauerhafter Invalidität eine Einkommens-/Rentenlücke?
 *   • "Versicherbarkeit prüfenswert" – lohnt eine Risikovoranfrage (Gesundheit/Hobbys)?
 *   • "früh = leichter"            – junges, gesundes Kind → günstiger Beitrag + Nachversicherung ohne neue Gesundheitsprüfung.
 * CTA: kostenlose Beratung / unverbindliche Einschätzung.
 */
const QUESTIONS_SCHUL = [
  {id:'kind_alter', question:'Wie alt ist Ihr Kind?',
   hint:'Das Eintrittsalter ist der größte Hebel: Je jünger und gesünder das Kind, desto günstiger der Beitrag – und desto leichter der spätere Wechsel in eine Berufsunfähigkeits-Absicherung ohne neue Gesundheitsprüfung.',
   options:[
     {label:'Unter 6 (Kita / Vorschule)', value:'u6'},
     {label:'6–9 (Grundschule)', value:'6_9'},
     {label:'10–13', value:'10_13'},
     {label:'14–17', value:'14_17'},
     {label:'18 oder älter (Ausbildung / Studium)', value:'ue18'}]},

  {id:'schulform', question:'In welcher Schul- bzw. Ausbildungsphase ist Ihr Kind?',
   hint:'Die Tätigkeit des Kindes (Schüler, Azubi, Student) fließt wie ein „Beruf" in die Einstufung ein – ähnlich wie der Arbeitsalltag bei der Berufsunfähigkeit von Erwachsenen.',
   options:[
     {label:'Kita / Kindergarten', value:'kita'},
     {label:'Grundschule', value:'grundschule'},
     {label:'Weiterführende Schule', value:'schule'},
     {label:'In Ausbildung / Azubi', value:'azubi'},
     {label:'Studium', value:'student'}]},

  {id:'gesundheit', question:'Gibt es beim Kind gesundheitlich etwas, das ein Versicherer wissen müsste?',
   hint:'Grobe Selbsteinschätzung – kein Gesundheitsformular. Relevant sind z. B. chronische Erkrankungen, Therapien (auch Logopädie/Ergo), ADHS oder psychische Auffälligkeiten. Das entscheidet, ob eine Risikovoranfrage sinnvoll ist.',
   options:[
     {label:'Nein, alles unauffällig', value:'keine'},
     {label:'Einzelnes / ausgeheilt (z. B. Allergie, Brille)', value:'einzeln'},
     {label:'Chronisch / laufende Therapie / Psyche / ADHS', value:'mehrere'},
     {label:'Weiß ich nicht genau', value:'unbekannt'}]},

  {id:'bestehend', question:'Hat Ihr Kind bereits eine Absicherung gegen Invalidität?',
   hint:'Wichtig: Eine Kinderunfall- oder Invaliditätsversicherung zahlt meist nur bei Unfällen. Die häufigsten Ursachen für dauerhafte Einschränkungen sind aber Krankheiten – genau hier greift die Schulunfähigkeits-Absicherung.',
   options:[
     {label:'Nein, noch keine', value:'nein'},
     {label:'Ja, eine Kinder-Unfallversicherung', value:'unfall'},
     {label:'Ja, eine Invaliditäts-/Kinderinvaliditäts-Police', value:'invaliditaet'},
     {label:'Weiß ich nicht', value:'unbekannt'}]},

  {id:'wunschrente', question:'Welche monatliche Rente hätten Sie im Fall der Fälle gern abgesichert?',
   hint:'Der Betrag, der monatlich fließen soll, wenn Ihr Kind dauerhaft nicht arbeiten kann. Er sichert später den Lebensunterhalt, wenn keine Ausbildung oder Berufstätigkeit möglich ist.',
   options:[
     {label:'Bis 500 €', value:'b500'},
     {label:'500–1.000 €', value:'500_1000'},
     {label:'1.000–1.500 €', value:'1000_1500'},
     {label:'Über 1.500 €', value:'ue1500'},
     {label:'Weiß ich noch nicht', value:'unbekannt'}]},

  {id:'schwerpunkt', question:'Was ist Ihnen bei der Absicherung am wichtigsten?',
   hint:'Es gibt zwei Wege: eine reine Schulunfähigkeits-Rente (Fokus: späteres Einkommen, Option auf Umstellung in eine BU) oder eine breite Kinderinvaliditäts-Absicherung (auch Einmalzahlung/Pflege bei schweren Erkrankungen/Behinderung). Ihre Priorität lenkt die Einschätzung.',
   options:[
     {label:'Vor allem spätere Berufs-/Einkommensabsicherung (Schulunfähigkeit + BU-Option)', value:'schulunfaehigkeit'},
     {label:'Breiter Schutz bei schwerer Krankheit/Behinderung (Kinderinvalidität)', value:'invaliditaet'},
     {label:'Beides kombinieren', value:'beides'},
     {label:'Bin unsicher – bitte einordnen', value:'unbekannt'}]},

  {id:'hobbys', question:'Übt Ihr Kind risikoreichere Hobbys oder Sportarten aus?',
   hint:'Z. B. Reiten, Kampfsport, Klettern, Motocross, Tauchen, Ski-Rennsport. Kann zu Zuschlägen oder Ausschlüssen führen – ist aber im Kindesalter oft noch unkompliziert absicherbar.',
   options:[
     {label:'Nein', value:'nein'},
     {label:'Ja, eines davon', value:'eines'},
     {label:'Ja, mehrere / im Verein / Wettkampf', value:'mehrere'}]},

  {id:'zielbild', question:'Was möchten Sie als Nächstes tun?',
   hint:'',
   options:[
     {label:'Erst prüfen lassen, wie mein Kind steht', value:'pruefen'},
     {label:'Konkret Möglichkeiten & Beiträge vergleichen', value:'vergleich'},
     {label:'Mein Kind hat eine Vorerkrankung – geht das überhaupt?', value:'voranfrage'}]},
];
/* ---- rlv ---- */
/* VersicherungsFuchs — Risikolebensversicherungs-Check / Hinterbliebenenschutz (v1)
 * Geerdet in der echten iSurance-RLV-Fallakte (verbundene Leben "Messing") + Risikovoranfrage RLV.
 * §34d-Orientierung: qualifiziert + ordnet ein, NIE Produktempfehlung, KEIN Antrags-Gesundheitsformular.
 * Format identisch zum Riester-/BU-Check (id/question/hint/options[{label,value}]).
 *
 * Ergebnis-Dimensionen (nur Kommentar, für die Auswertung):
 *   1) "Absicherungsbedarf (Summe)"  — aus Anlass × Verpflichtung/Einkommen × Kinder abgeleitet.
 *      Faustregel-Orientierung (KEIN Produkt): Todesfallsumme ~3–5× Jahres-Nettoeinkommen ODER
 *      offene Restschuld des Kredits; bei Baufi: fallende Summe entlang der Restschuld (siehe Fall Messing).
 *   2) "Dringlichkeit (Kinder/Kredit)" — hoch, wenn minderjährige Kinder ODER laufender Immobilienkredit.
 *   3) "Versicherbarkeit" — aus Alter, Raucher, Gesundheits-Indikator; bei Vorerkrankung → anonyme Voranfrage.
 *
 * Killer-CTA: Bei Gesundheits-Indikator "mehrere/chronisch" ODER Zielbild "Vorerkrankung" →
 *   anonyme Risikovoranfrage anbieten (mehrere Versicherer prüfen lassen, ohne Antrag/ohne Datenweitergabe).
 */
const QUESTIONS_RLV = [
  {id:'anlass', question:'Was möchten Sie mit einer Risikolebensversicherung vor allem absichern?',
   hint:'Der Anlass bestimmt Höhe und Verlauf der Todesfallsumme – Familie absichern, einen Kredit tilgen oder einen Geschäftspartner schützen.',
   options:[
     {label:'Meine Familie / Hinterbliebenen finanziell absichern', value:'familie'},
     {label:'Einen Immobilienkredit / eine Baufinanzierung absichern', value:'immobilie'},
     {label:'Einen Geschäftspartner / Teilhaber absichern', value:'geschaeft'},
     {label:'Mehreres davon', value:'mehrere'}]},

  {id:'wer', question:'Wer soll abgesichert werden?',
   hint:'Paare können sich in einem Vertrag gegenseitig absichern („verbundene Leben") – das ist oft günstiger als zwei Einzelverträge.',
   options:[
     {label:'Nur ich (Einzelabsicherung)', value:'einzeln'},
     {label:'Mein Partner / meine Partnerin und ich gegenseitig (verbundene Leben)', value:'verbunden'},
     {label:'Ich, mit meinem Partner als Begünstigten', value:'einzeln_beguenstigt'},
     {label:'Geschäftspartner gegenseitig', value:'geschaeftspartner'}]},

  {id:'familie', question:'Wie ist Ihre familiäre Situation?',
   hint:'Vor allem minderjährige Kinder erhöhen den Absicherungsbedarf und die Dringlichkeit deutlich.',
   options:[
     {label:'Alleinstehend, keine Kinder', value:'single'},
     {label:'Partnerschaft / verheiratet, keine Kinder', value:'paar'},
     {label:'Mit Kind(ern) im Haushalt', value:'kinder'},
     {label:'Alleinerziehend', value:'alleinerziehend'}]},

  {id:'verpflichtung', question:'Welchen Betrag müssten Ihre Hinterbliebenen im Ernstfall stemmen können?',
   hint:'Zur Orientierung: die offene Restschuld eines Kredits ODER grob 3–5 Jahres-Nettoeinkommen als Puffer für die Familie. Nur ein Richtwert, keine Produktempfehlung.',
   options:[
     {label:'Bis 100.000 €', value:'b100'},
     {label:'100.000–250.000 €', value:'100_250'},
     {label:'250.000–500.000 €', value:'250_500'},
     {label:'Über 500.000 €', value:'ue500'},
     {label:'Weiß ich noch nicht', value:'unbekannt'}]},

  {id:'alter', question:'Wie alt ist die zu versichernde Person (bei Paaren: die ältere)?',
   hint:'Je früher der Abschluss, desto günstiger und leichter – das Eintrittsalter ist der zweitgrößte Preisfaktor nach der Gesundheit.',
   options:[
     {label:'Unter 30', value:'u30'},{label:'30–39', value:'30_39'},
     {label:'40–49', value:'40_49'},{label:'50–59', value:'50_59'},{label:'60 oder älter', value:'ue60'}]},

  {id:'raucher', question:'Rauchen Sie (bzw. die zu versichernde Person)?',
   hint:'Nichtraucher erhalten in der Risikolebensversicherung meist deutlich günstigere Beiträge. Als Nichtraucher gilt in der Regel, wer seit mindestens 12 Monaten nicht raucht (auch E-Zigarette/Shisha zählt).',
   options:[{label:'Nichtraucher', value:'nein'},{label:'Raucher', value:'ja'},{label:'Bei Paaren gemischt', value:'gemischt'}]},

  {id:'gesundheit', question:'Gibt es gesundheitlich etwas, das ein Versicherer wissen müsste?',
   hint:'Grobe Selbsteinschätzung – kein Gesundheitsformular. Bei Vorerkrankungen lässt sich vorab anonym prüfen, welcher Versicherer zu welchen Konditionen annimmt.',
   options:[
     {label:'Nein, alles unauffällig', value:'keine'},
     {label:'Einzelnes (z. B. ausgeheilt, leichte Sache)', value:'einzeln'},
     {label:'Mehreres / chronisch / in Behandlung', value:'mehrere'},
     {label:'Weiß ich nicht genau', value:'unbekannt'}]},

  {id:'laufzeit', question:'Wie lange soll der Schutz laufen?',
   hint:'Sinnvoll ist meist so lange, wie die Verpflichtung besteht – bis der Kredit getilgt ist oder die Kinder wirtschaftlich auf eigenen Beinen stehen.',
   options:[
     {label:'Bis der Kredit getilgt ist', value:'kredit'},
     {label:'Bis die Kinder aus dem Haus sind (ca. 15–20 Jahre)', value:'kinder'},
     {label:'Bis zum Ruhestand', value:'ruhestand'},
     {label:'Weiß ich noch nicht', value:'unbekannt'}]},

  {id:'bestehend', question:'Haben Sie bereits eine Risikolebensversicherung?',
   hint:'Wichtig, um Lücken oder Doppelungen zu erkennen – z. B. eine bestehende Absicherung über einen früheren Kredit.',
   options:[
     {label:'Nein', value:'nein'},
     {label:'Ja, aber vermutlich zu niedrig', value:'zu_niedrig'},
     {label:'Ja, passt vermutlich', value:'vorhanden'},
     {label:'Weiß ich nicht', value:'unbekannt'}]},

  {id:'zielbild', question:'Was möchten Sie als Nächstes tun?',
   hint:'',
   options:[
     {label:'Erst prüfen lassen, welche Summe zu mir passt', value:'pruefen'},
     {label:'Konkret Angebote vergleichen', value:'vergleich'},
     {label:'Ich habe eine Vorerkrankung – geht das überhaupt?', value:'voranfrage'}]},
];
/* VersicherungsFuchs — Check-Engine Kern (Scoring + Registry + Helper).
 * Wird an die konkatenierten Fragen-Configs angehängt (QUESTIONS_* sind dann im Scope).
 * §34d: jede Auswertung liefert Einordnung + Handlungsoptionen, NIE eine Produktempfehlung.
 */
var VF_LABEL = {rot:'Deutlicher Handlungsbedarf', gelb:'Prüfenswert', gruen:'Gut aufgestellt'};
function vfIn(v, arr){ return arr.indexOf(v) !== -1; }
function vfRes(ampel, label, titel, bloecke, voranfrage){
  return {ampel:ampel, ampelLabel:label||VF_LABEL[ampel], titel:titel, bloecke:bloecke, voranfrage:!!voranfrage};
}
function vfHealthFlag(a){ return vfIn(a.gesundheit,['einzeln','mehrere','zahn_vorbelastet','unbekannt']) || a.zielbild==='voranfrage'; }

/* ---------- BU / DU ---------- */
function scoreBU(a){
  a=a||{}; var isDU=a.status==='beamter';
  var eink=({u1500:1,'1500_2500':2,'2500_4000':3,ue4000:3,schwankend:2})[a.einkommen]||2;
  var L;
  if(a.bestehend==='privat') L={score:1,stufe:'gedeckt',t:'Sie haben bereits eine private BU. Sinnvoll ist ein Blick, ob Höhe und Bedingungen noch zu Ihrer heutigen Situation passen.'};
  else if(a.bestehend==='ag') L={score:2,t:'Eine Absicherung über den Arbeitgeber ist ein guter Anfang – sie ist aber oft an den Job gebunden und niedriger als der eigene Bedarf. Eine ergänzende private BU ist häufig sinnvoll.'};
  else L={score:3,t:'Aktuell ist Ihre Arbeitskraft – Ihr wichtigstes Vermögen – nicht privat abgesichert. Fällt das Einkommen weg, entsteht schnell eine große Lücke.'};
  var s=({u25:3,'25_34':3,'35_44':2,'45_54':1,ue55:1})[a.alter]||2;
  if(vfIn(a.bestehend,['nein','unbekannt']))s+=1; if(a.gesundheit==='keine')s+=1; if(a.taetigkeit==='koerperlich')s+=1;
  var Dt=s>=4?'Je früher und gesünder, desto günstiger und einfacher – für Sie spricht gerade viel dafür, das jetzt anzugehen.':(s>=2?'Ein Abschluss wird mit jedem Jahr tendenziell teurer. Es lohnt sich, das Thema nicht liegen zu lassen.':'Auch wenn kein Zeitdruck besteht: eine saubere Bestandsaufnahme schadet nie.');
  var vor=vfHealthFlag(a)||a.hobbys==='eines'||a.hobbys==='mehrere';
  var Vt=vor?'Ein paar Punkte sollten wir vorab klären. Das Gute: Bevor irgendwo ein Antrag steht, machen wir für Sie eine <strong>anonyme Risiko-Voranfrage</strong> bei mehreren Versicherern – so wissen Sie, woran Sie sind, ohne dass ein Eintrag entsteht.':'Nach Ihren Angaben spricht nichts gegen eine unkomplizierte Annahme – das lässt sich mit wenigen Gesundheitsfragen klären.';
  var ampel=(L.score>=3&&s>=2)?'rot':((L.stufe==='gedeckt'&&!vor)?'gruen':'gelb');
  var b=[{h:'Ihre Absicherungslücke',t:L.t},{h:'Wie dringlich ist das für Sie?',t:Dt},{h:'Versicherbarkeit',t:Vt}];
  if(isDU){var du=a.du_klausel==='baustein'?'Wichtig für Beamte: Ihre Absicherung sollte eine <strong>echte Dienstunfähigkeits-Klausel</strong> enthalten – ein reiner BU-Baustein leistet nicht automatisch, wenn Ihr Dienstherr Sie in den Ruhestand versetzt.':(vfIn(a.du_klausel,['keine','unbekannt'])?'Für Beamte ist die <strong>echte Dienstunfähigkeits-Klausel</strong> der entscheidende Punkt – sie leistet, wenn Sie dienstunfähig werden. Ob und wie Sie abgesichert sind, klären wir gemeinsam.':'Sie haben bereits eine echte DU-Klausel – wir prüfen, ob Höhe und Bedingungen zu Ihrem Verbeamtungs-Status passen.');
    b.splice(1,0,{h:'Dienstunfähigkeit: der entscheidende Punkt',t:du});}
  return vfRes(ampel,null,isDU?'Ihre Dienstunfähigkeits-Einordnung':'Ihre Berufsunfähigkeits-Einordnung',b,vor);
}

/* ---------- PKV ---------- */
function scorePKV(a){
  a=a||{}; var beamter=a.status==='beamter';
  var zugang, ampel;
  if(beamter) zugang={t:'Als Beamter/Beamtin haben Sie über die <strong>Beihilfe</strong> einen oft attraktiven Zugang zur PKV. Ob eine beihilfekonforme PKV im Einzelfall passt, hängt u. a. von Bundesland, Familienkonstellation, Leistungsumfang und langfristiger Beitragsbelastung ab – das prüfen wir mit Ihnen.'};
  else if(a.status==='selbststaendig') zugang={t:'Als Selbstständige/r können Sie frei zwischen gesetzlicher und privater Krankenversicherung wählen. Ob die PKV für Sie passt, hängt von Leistung, Beitragsstabilität und Ihrer Situation ab.'};
  else if(a.status==='student') zugang={t:'Als Student/in gelten besondere Regeln – ein früher Blick lohnt sich, weil sich mit dem Berufseinstieg das Zeitfenster ändert.'};
  else { // angestellt: Versicherungspflichtgrenze
    zugang = vfIn(a.einkommen,['ue80','70_80']) ? {t:'Als Angestellte/r können Sie in die PKV wechseln, wenn Ihr Bruttoeinkommen über der Versicherungspflichtgrenze (jährlich angepasst, rund 69.000–74.000 €) liegt. Nach Ihren Angaben ist das prüfenswert.'} : {t:'Als Angestellte/r ist der PKV-Zugang an die Versicherungspflichtgrenze (rund 69.000–74.000 € Jahresbrutto) gebunden. Nach Ihren Angaben liegen Sie eher darunter – dann ist die PKV aktuell meist nicht möglich, aber Kranken-Zusätze können Lücken schließen.'};
  }
  var vor=vfHealthFlag(a);
  ampel = beamter?'gruen':(vor?'gelb':'gelb');
  var b=[{h:'Kommt die PKV für Sie infrage?',t:zugang.t}];
  if(beamter) b.push({h:'Beihilfe: Ihr Vorteil',t:'Der Staat übernimmt als Dienstherr einen Teil Ihrer Krankheitskosten (Beihilfe) – die PKV versichert nur den Rest. Das macht sie für Beamte besonders günstig. Höhe und mitzuversichernde Familienmitglieder klären wir konkret.'});
  b.push({h:'Was zu klären ist',t:'Wichtig ist eine ehrliche Abwägung: Leistung, Beitrag im Alter und Ihre Lebensplanung. Wir zeigen die Vor- und Nachteile – ohne Verkaufsdruck.'});
  b.push({h:'Versicherbarkeit',t:vor?'Vor einem Wechsel machen wir für Sie eine <strong>anonyme Risiko-Voranfrage</strong> – so kennen Sie Ihre Annahme-Chancen, bevor ein Antrag gestellt wird.':'Nach Ihren Angaben spricht gesundheitlich nichts gegen eine unkomplizierte Prüfung.'});
  return vfRes(ampel,{gruen:'Sehr prüfenswert',gelb:'Prüfenswert'}[ampel],'Ihre PKV-Einordnung',b,vor);
}

/* ---------- Kranken-Zusatz ---------- */
function scoreKVZusatz(a){
  a=a||{};
  var timing;
  if(a.zahn_bedarf==='in_behandlung') timing={ampel:'rot',t:'Sie sind bereits in Behandlung – für laufende oder angeratene Maßnahmen leistet eine neue Zahnzusatz-Versicherung in der Regel nicht mehr. Umso wichtiger ist es, für die Zukunft jetzt vorzusorgen. Wir zeigen ehrlich, was noch geht.'};
  else if(vfIn(a.zahn_bedarf,['ersatz_absehbar','kfo'])) timing={ampel:'rot',t:'Weil ein Bedarf absehbar ist, zählt jetzt das Timing: Zahntarife haben eine <strong>Leistungsstaffel</strong> (in den ersten Jahren begrenzt) und Wartezeiten. Je früher der Abschluss vor der Behandlung, desto mehr wird übernommen.'};
  else timing={ampel:'gelb',t:'Guter Zeitpunkt: Solange kein Bedarf besteht, ist die Annahme unkompliziert und die <strong>Leistungsstaffel</strong> läuft an, bevor Sie sie brauchen. Genau dafür ist ein Zusatz gedacht.'};
  var vor=vfHealthFlag(a);
  var b=[
    {h:'Ihre Lücke in der gesetzlichen Kasse',t:'Im Bereich <strong>'+({zahn:'Zahn',ambulant:'ambulant (Brille, Heilpraktiker)',stationaer:'Krankenhaus (Chefarzt, Einbett)',pflege:'Pflege',kombi:'mehreren Bereichen'})[a.bereich]||'Ihrer Wahl'+'</strong> zahlt die GKV oft nur einen Teil. Ein passender Zusatz kann genau diese Lücke schließen – für '+({selbst:'Sie',partner:'Ihren Partner',kind:'Ihr Kind',familie:'Ihre Familie'})[a.fuer_wen]||'Sie'+'.'},
    {h:'Warum das Timing zählt',t:timing.t},
    {h:'Versicherbarkeit',t:vor?'Bei Vorbelastung (z. B. fehlende Zähne) klären wir vorab, welche Tarife annehmen – gern über eine <strong>anonyme Voranfrage</strong>.':'Nach Ihren Angaben ist die Annahme voraussichtlich unkompliziert.'}
  ];
  return vfRes(timing.ampel,{rot:'Jetzt handeln',gelb:'Prüfenswert'}[timing.ampel],'Ihre Kranken-Zusatz-Einordnung',b,vor);
}

/* ---------- Basisrente (Rürup) ---------- */
function scoreBasisrente(a){
  a=a||{};
  var hebel=vfIn(a.zve,['ue100','60_100'])?'hoch':(a.zve==='30_60'?'mittel':'gering');
  var geeignet=vfIn(a.status,['selbststaendig','freiberufler','gesellschafter_gf'])||a.status==='angestellt_gut';
  // Positiv-Check: hohe Eignung = gruen (Chance), nie rot (rot bleibt Handlungsbedarf/Gefahr vorbehalten)
  var ampel=(hebel==='hoch'&&geeignet)?'gruen':'gelb';
  var b=[
    {h:'Ihr Steuer-Hebel',t:hebel==='hoch'?'Bei Ihrem Einkommen kann der <strong>Steuervorteil</strong> groß sein: Basisrenten-Beiträge sind zu 100 % als Sonderausgaben absetzbar – ein Teil kann über die Steuer zurückfließen. Die genaue Höhe hängt von Ihrer Steuersituation ab.':(hebel==='mittel'?'Ihr Steuersatz macht die Basisrente interessant: Die Beiträge sind absetzbar, ein Teil kann über die Steuererklärung zurückkommen.':'Der Steuervorteil dürfte bei Ihrem Einkommen eher moderat sein – die Basisrente kann trotzdem passen, andere Bausteine sind aber ggf. flexibler.')},
    {h:'Passt die Basisrente zu Ihnen?',t:geeignet?'Für viele Selbstständige und Gutverdiener – gerade ohne Zugang zu Riester – ist die Basisrente ein prüfenswerter, steuerlich geförderter Baustein. Ob sie im Einzelfall die beste Wahl ist, hängt von Ihren Zielen, bestehender Vorsorge und Ihrem Flexibilitätsbedarf ab.':'Prüfen wir gemeinsam, ob die Basisrente oder ein anderer Baustein besser zu Ihrer Situation passt.'},
    {h:'Ehrlich zum Trade-off',t:'Wichtig zu wissen: Eine Basisrente ist <strong>nicht kündbar und nicht kapitalisierbar</strong> – Sie erhalten sie als lebenslange Rente, kein Einmalkapital. Dafür ist sie pfändungs- und Hartz-IV-geschützt. Ob dieser Trade-off für Sie passt, klären wir offen.'}
  ];
  return vfRes(ampel,{gruen:'Hoher Steuer-Hebel',gelb:'Prüfenswert'}[ampel],'Ihre Basisrenten-Einordnung',b,false);
}

/* ---------- Kindervorsorge ---------- */
function scoreKinder(a){
  a=a||{};
  var jung=vfIn(a.alter,['baby','klein']);
  var ampel=jung?'gruen':'gelb';  // Positiv-Check: Chance = gruen, nie rot (rot = Handlungsbedarf/Gefahr)
  var schutz=vfIn(a.aspekt,['schutz','beides']);
  var b=[
    {h:'Ihr Zeit-Vorteil',t:jung?'Je jünger Ihr Kind, desto stärker wirkt der <strong>Zinseszins</strong>: Wer früh und klein anfängt, erreicht mit deutlich weniger Einsatz dasselbe Ziel. Jetzt ist der ideale Zeitpunkt.':'Auch jetzt lohnt sich der Start – wichtig ist, überhaupt anzufangen. Der Zinseszins arbeitet ab dem ersten Tag für Ihr Kind.'},
    {h:'Passende Bausteine',t:schutz?'Sie möchten nicht nur sparen, sondern Ihr Kind auch <strong>absichern</strong> (z. B. gegen Invalidität) – dafür gibt es sinnvolle Bausteine, die wir Ihnen zeigen.':'Für reines Sparen fürs Kind gibt es flexible, chancenorientierte Wege (z. B. ETF-basiert) – abgestimmt auf Ihr Ziel und Ihren Zeithorizont.'},
    {h:'Ihr nächster Schritt',t:'Wir ordnen Ihre Möglichkeiten ein – ohne erfundene Renditeversprechen – und Sie entscheiden in Ruhe.'}
  ];
  return vfRes(ampel,{gruen:'Großer Zeit-Vorteil',gelb:'Guter Zeitpunkt'}[ampel],'Ihre Kindervorsorge-Einordnung',b,false);
}

/* ---------- Schulunfähigkeit ---------- */
function scoreSchul(a){
  a=a||{};
  var luecke=vfIn(a.bestehend,['nein','unbekannt'])||a.bestehend==='unfall';
  var jung=vfIn(a.kind_alter,['u6','6_9']);
  var ampel=(luecke)?'rot':'gelb';
  var vor=vfHealthFlag(a)||a.hobbys==='mehrere';
  var b=[
    {h:'Die Absicherungslücke Ihres Kindes',t:a.bestehend==='unfall'?'Eine Unfallversicherung deckt nur Unfälle – die meisten Ursachen für eine dauerhafte Einschränkung sind aber <strong>Krankheiten</strong>. Genau diese Lücke schließt die Schulunfähigkeits-/Kinderinvaliditäts-Absicherung.':(luecke?'Aktuell ist Ihr Kind gegen den Verlust seiner „Arbeitskraft" (Schul-/spätere Berufsunfähigkeit) nicht abgesichert – eine Lücke, die viele unterschätzen.':'Sie haben bereits eine Absicherung – wir prüfen, ob Höhe und Bedingungen wirklich passen.')},
    {h:'Warum früh leichter ist',t:jung?'Je jünger und gesünder Ihr Kind, desto einfacher und günstiger die Aufnahme – und oft mit der Option, später ohne erneute Gesundheitsprüfung in eine Berufsunfähigkeit umzustellen.':'Ein früher Abschluss sichert den Gesundheitszustand und oft die Option, später ohne neue Prüfung in eine BU umzustellen.'},
    {h:'Versicherbarkeit',t:vor?'Bei gesundheitlichen Themen klären wir vorab die Chancen – gern über eine <strong>anonyme Voranfrage</strong>.':'Nach Ihren Angaben ist die Aufnahme voraussichtlich unkompliziert.'}
  ];
  return vfRes(ampel,{rot:'Handlungsbedarf',gelb:'Prüfenswert'}[ampel],'Ihre Schulunfähigkeits-Einordnung',b,vor);
}

/* ---------- Risikoleben ---------- */
function scoreRLV(a){
  a=a||{};
  var hoch=vfIn(a.familie,['kinder','alleinerziehend'])||vfIn(a.verpflichtung,['250_500','ue500']);
  var luecke=vfIn(a.bestehend,['nein','zu_niedrig','unbekannt']);
  var ampel=(hoch&&luecke)?'rot':(luecke?'gelb':'gruen');
  var vor=vfHealthFlag(a);
  var b=[
    {h:'Ihr Absicherungsbedarf',t:'Als Orientierung (kein Produkt): Die Todesfallsumme sollte offene Verpflichtungen decken – z. B. die <strong>Restschuld eines Immobilienkredits</strong> oder etwa das 3- bis 5-fache Jahres-Nettoeinkommen, damit Ihre Familie abgesichert ist.'+(a.anlass==='immobilie'?' Bei einer Immobilie orientiert sich die Summe an der Restschuld.':'')},
    {h:'Wie dringlich ist das?',t:hoch?'Mit '+((a.familie==='kinder'||a.familie==='alleinerziehend')?'Kindern':'Ihrer Verpflichtung')+' trägt jemand die Folgen, wenn Ihnen etwas zustößt – hier ist eine ausreichende Absicherung besonders wichtig.':'Der Bedarf ist überschaubar, eine saubere Einordnung lohnt sich trotzdem.'},
    {h:'Versicherbarkeit',t:vor?'Vor dem Antrag machen wir für Sie eine <strong>anonyme Risiko-Voranfrage</strong> – so kennen Sie Ihre Konditionen, ohne dass ein Eintrag entsteht.':'Nach Ihren Angaben ist die Annahme voraussichtlich unkompliziert und günstig.'}
  ];
  return vfRes(ampel,{rot:'Wichtige Lücke',gelb:'Prüfenswert',gruen:'Gut aufgestellt'}[ampel],'Ihre Risikoleben-Einordnung',b,vor);
}

/* ---------- Registry ---------- */
window.VF_CHECKS = {
  bu:        {key:'bu',        kurz:'BU-Check',              questions:QUESTIONS_BU,        branch:{when:function(a){return a.status==='beamter';},after:'status',questions:QUESTIONS_DU_EXTRA}, score:scoreBU,        leadSource:'bu-check'},
  pkv:       {key:'pkv',       kurz:'PKV-Check',             questions:QUESTIONS_PKV,       branch:{when:function(a){return a.status==='beamter';},after:'status',questions:QUESTIONS_BEIHILFE_EXTRA}, score:scorePKV,       leadSource:'pkv-check'},
  kvzusatz:  {key:'kvzusatz',  kurz:'Kranken-Zusatz-Check',  questions:QUESTIONS_KVZUSATZ,  score:scoreKVZusatz,  leadSource:'kranken-zusatz-check'},
  basisrente:{key:'basisrente',kurz:'Basisrenten-Check',     questions:QUESTIONS_BASISRENTE,score:scoreBasisrente,leadSource:'basisrente-check'},
  kinder:    {key:'kinder',    kurz:'Kindervorsorge-Check',  questions:QUESTIONS_KINDER,    score:scoreKinder,    leadSource:'kindervorsorge-check'},
  schul:     {key:'schul',     kurz:'Schulunfähigkeits-Check',questions:QUESTIONS_SCHUL,    score:scoreSchul,     leadSource:'schulunfaehigkeit-check'},
  rlv:       {key:'rlv',       kurz:'Risikoleben-Check',     questions:QUESTIONS_RLV,       score:scoreRLV,       leadSource:'risikoleben-check'}
};

window.vfCheckQuestions = function(type, answers){
  var c=window.VF_CHECKS[type]; if(!c) return [];
  var list=c.questions.slice();
  if(c.branch && c.branch.when(answers||{})){
    var idx=-1; for(var i=0;i<list.length;i++){ if(list[i].id===c.branch.after){idx=i;break;} }
    var ins=idx>=0?idx+1:list.length;
    list=list.slice(0,ins).concat(c.branch.questions).concat(list.slice(ins));
  }
  return list;
};
