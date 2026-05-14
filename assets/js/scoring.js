/* VersicherungsFuchs – Scoring Engine v2.1 */

function berechneScores(a){
  var s1=0;
  if(a.zulagen==='unbekannt')s1+=35;else if(a.zulagen==='selbst')s1+=22;
  if(a.anlage_av==='nie')s1+=28;else if(a.anlage_av==='manchmal')s1+=14;else if(a.anlage_av==='unbekannt')s1+=20;
  if(['2','3plus'].includes(a.kinder)&&a.zulagen!=='automatisch')s1+=15;
  // Selbststaendige: grundsaetzlich NICHT unmittelbar riester-foerderberechtigt (§10a EStG)
  if(a.beschaeftigung==='selbststaendig')s1+=40;
  else if(a.beschaeftigung==='nicht')s1+=20;
  if(a.einkommen==='selbststaendig')s1+=8;
  s1=Math.min(100,s1);

  var s2=0;
  if(a.vertragstyp==='unbekannt')s2+=18;
  if(['2013_2017','ab2018'].includes(a.abschlussjahr))s2+=22;else if(a.abschlussjahr==='unbekannt')s2+=12;
  if(a.vertrag_status==='beitragsfrei')s2+=18;
  else if(a.vertrag_status==='pausiert')s2+=18;
  else if(a.vertrag_status==='gekuendigt')s2+=30;
  else if(a.vertrag_status==='unbekannt')s2+=8;
  if(a.beitrag==='unter50')s2+=14;else if(a.beitrag==='unbekannt')s2+=8;
  if(a.transparenz==='hoch')s2+=28;else if(a.transparenz==='unklar')s2+=16;else if(a.transparenz==='unbekannt')s2+=10;
  s2=Math.min(100,s2);

  var s3=25;
  if(a.risikoprofil==='rendite')s3+=30;else if(a.risikoprofil==='balance')s3+=15;
  if(a.zielbild==='wechsel_pruefen')s3+=30;else if(a.zielbild==='erst_pruefen')s3+=12;
  if(['2013_2017','ab2018'].includes(a.abschlussjahr)&&['hoch','unklar'].includes(a.transparenz))s3+=12;
  if(a.risikoprofil!=='sicherheit')s3+=8;
  s3=Math.min(100,s3);

  return{s1:s1,s2:s2,s3:s3};
}

function berechneAmpel(a){var sc=berechneScores(a);if(sc.s1>=60||sc.s2>=60)return'red';if(sc.s1>=30||sc.s2>=30)return'yellow';return'green';}
function berechneScore(a){var sc=berechneScores(a);return Math.round(100-(sc.s1*0.5+sc.s2*0.5));}

function getHandlungsempfehlung(a,ampel){
  var sc=berechneScores(a);var s1=sc.s1,s2=sc.s2,s3=sc.s3;

  if(a.beschaeftigung==='selbststaendig'){
    return{action:'foerderpruefung_dringend',icon:'⚠️',titel:'Förderberechtigungs-Prüfung empfohlen',
    kurzinterpretation:'Selbstständige sind in der Regel nicht unmittelbar riester-förderberechtigt (§ 10a EStG). Ob das bei Ihnen zutrifft, hängt von Ihrer Rentenversicherungspflicht ab – und ist entscheidend dafür, ob Sie Zulagen und Steuervorteile tatsächlich erhalten.',
    was_bedeutet_das:'Unmittelbar förderberechtigt sind Personen mit Pflichtbeiträgen zur gesetzlichen Rentenversicherung. Viele Selbstständige erfüllen das nicht. Ausnahmen: Pflichtversicherte auf Antrag (z. B. bestimmte Handwerker), Empfänger von Leistungen der Bundesagentur sowie mittelbar Förderberechtigte (Ehe-/Lebenspartner). Wer nicht förderberechtigt ist, zahlt Beiträge ohne staatlichen Zuschuss.',
    naechste_schritte:['Bei der Deutschen Rentenversicherung klären, ob Pflichtbeiträge bestehen','Zulagenhistorie der letzten 3 Jahre beim Anbieter anfordern','Im Deep-Check Förderberechtigung und Vertragsstatus bewerten lassen']};
  }

  if(a.beschaeftigung==='beamter'&&s1>=40){
    return{action:'beamter_pruefung',icon:'🔍',titel:'Beamtenstatus: Förderung prüfen',
    kurzinterpretation:'Beamte sind über die Beamtenversorgung abgesichert – trotzdem unmittelbar riester-förderberechtigt. Wichtig ist, ob die steuerliche Förderung korrekt genutzt wird.',
    was_bedeutet_das:'Da Beamte keine Pflichtbeiträge zur GRV zahlen, gibt es keine Zulagen aus der ZfA. Die steuerliche Förderung über Anlage AV (bis 2.100 € Sonderausgaben) ist jedoch möglich. Ob sich der Vertrag lohnt, hängt vom Grenzsteuersatz und den Vertragskosten ab.',
    naechste_schritte:['Anlage AV jährlich in der Steuererklärung nutzen','Standmitteilung auf Kostentransparenz prüfen','Im Deep-Check steuerliche Vorteilhaftigkeit berechnen lassen']};
  }

  if(a.vertrag_status==='gekuendigt'){
    return{action:'bereits_beendet',icon:'ℹ️',titel:'Vertrag scheint nicht mehr aktiv zu sein',
    kurzinterpretation:'Auf Basis Ihrer Angaben scheint der Vertrag nicht mehr aktiv zu sein. Ob noch Handlungsbedarf besteht, lässt sich erst mit den Unterlagen klären.',
    was_bedeutet_das:'Es könnten noch nicht abgerufene Restwerte oder offene Fragen bestehen. Belastbare Aussagen sind nur mit dem tatsächlichen Vertragsdokument möglich. Auch ein beendeter Vertrag sollte formal korrekt dokumentiert sein.',
    naechste_schritte:['Letzte Standmitteilung beim Anbieter anfordern','Prüfen, ob Restwerte noch vorhanden sind','Im Deep-Check klären, ob weitere Schritte sinnvoll sind']};
  }

  if(s1>=55){
    return{action:'foerder_risiko',icon:'⚠️',titel:'Hinweise auf möglicherweise ungenutzte Förderung',
    kurzinterpretation:'Ihre Antworten deuten darauf hin, dass staatliche Förderungen möglicherweise nicht vollständig abgerufen werden. Das lässt sich oft verbessern – ob das bei Ihnen zutrifft, zeigen erst Ihre Unterlagen.',
    was_bedeutet_das:'Zulagen müssen aktiv beantragt werden und können teils rückwirkend nachgeholt werden. Wie groß eine mögliche Lücke ist, zeigt erst eine Prüfung der tatsächlichen Zulagenhistorie. Bestehende Verträge haben Bestandsschutz.',
    naechste_schritte:['Zulagen-Status schriftlich beim Anbieter anfragen','Anlage AV bei der nächsten Steuererklärung sorgfältig ausfüllen','Im Deep-Check Optimierungspotenzial prüfen lassen']};
  }

  if(s2>=55){
    return{action:'kosten_risiko',icon:'🔍',titel:'Hinweise auf mögliche Kosten- oder Strukturthemen',
    kurzinterpretation:'Einige Ihrer Angaben – insbesondere zu Kosten und Vertragsstatus – deuten auf mögliche Stellschrauben hin. Das muss nicht negativ sein, sollte aber geprüft werden.',
    was_bedeutet_das:'Ob und wie stark Kosten die Entwicklung Ihres Vertrags beeinflussen, lässt sich erst mit den tatsächlichen Vertragsdaten beurteilen. Effektivkostenquoten stehen in der Regel auf der Standmitteilung.',
    naechste_schritte:['Aktuelle Standmitteilung heraussuchen','Effektivkostenquote und Vertragsstruktur identifizieren','Im Deep-Check Kosten- und Strukturanalyse durchführen lassen']};
  }

  if(s3>=65&&ampel!=='green'){
    return{action:'depot_pruefen',icon:'🔄',titel:'Altersvorsorgedepot ab 2027 als Option prüfen',
    kurzinterpretation:'Basierend auf Ihren Angaben spricht einiges dafür, die neue Depotoption ab 2027 in die Überlegungen einzubeziehen. Ein datenbasierter Vergleich ist der richtige Schritt.',
    was_bedeutet_das:'Ob ein Wechsel oder eine Parallelführung sinnvoll ist, hängt von Ihrem Vertrag im Detail ab – Garantien, verbleibende Laufzeit und Wechselkosten spielen eine Rolle. Bestandsschutz für bestehende Verträge bleibt bestehen.',
    naechste_schritte:['Standmitteilung und Garantiewerte heraussuchen','Depot-Option 2027 als Ergänzung oder Alternative im Blick behalten','Im Deep-Check beide Szenarien evidenzbasiert gegenüberstellen']};
  }

  if(ampel==='green'){
    return{action:'solide',icon:'✅',titel:'Keine offensichtlichen Warnsignale erkennbar',
    kurzinterpretation:'Auf Basis Ihrer Antworten ergeben sich keine direkten Hinweise auf dringenden Handlungsbedarf. Das ist eine gute Ausgangslage – aber kein abschließendes Urteil.',
    was_bedeutet_das:'Auch bei einem unauffälligen Quick-Check können im Detail Optimierungspotenziale stecken – etwa bei Kostentransparenz, Zulagenhistorie oder der neuen Depotoption ab 2027. Es gibt keinen Grund für hektische Schritte.',
    naechste_schritte:['Nächste Standmitteilung sorgfältig lesen','Zulagenquittung beim Anbieter anfordern','Optional: Depot-Option ab 2027 als mögliche Ergänzung klären lassen']};
  }

  return{action:'optimieren',icon:'🔧',titel:'Prüfung empfohlen – mögliche Stellschrauben erkennbar',
  kurzinterpretation:'Einige Ihrer Antworten deuten auf Felder hin, die sich lohnen könnten zu überprüfen. Ohne Vertragsdaten lässt sich das nicht präziser eingrenzen.',
  was_bedeutet_das:'Ob und in welchem Umfang Verbesserungen möglich sind, hängt von Ihrem konkreten Vertrag ab. Der Quick-Check gibt eine Orientierung – mehr nicht. Belastbar entscheiden lässt sich erst mit Ihrer Standmitteilung.',
  naechste_schritte:['Aktuelle Standmitteilung heraussuchen','Zulagen- und Beitragsstatus klären','Im Deep-Check alle relevanten Details analysieren lassen']};
}
