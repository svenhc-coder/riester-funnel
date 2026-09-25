/*
 * Plausibilitaetspruefung fuer Lead-Formulare aller iSurance-Marken (Sven 25.09.2026:
 * „Wir brauchen Mail, Name und Telefonnummer und dabei nicht sdfsdf, sdf@sdfsdf und im
 * Zweifel 123456789").
 *
 * EINE Quelle fuer alle Marken: diese Datei wird unveraendert in jede Website kopiert
 * (Regionalmarken, B Insurance, MaklerHaus, VF, iSurance, maklerverkaufen, cyberpolicen)
 * und serverseitig im Dashboard-Inbound gespiegelt. Aendern nur hier, dann verteilen.
 *
 * Nutzung im Browser:   window.IsuPlausi.name(v) / .email(v) / .telefon(v)
 * Nutzung in Node/TS:   const P = require('./plausi.js'); P.name(v)
 * Rueckgabe jeweils:    { ok: true } oder { ok: false, meldung: "..." }
 * Formular-Anschluss:   IsuPlausi.anschliessen(formElement) prueft beim Absenden alle
 *                       Felder mit data-plausi="name|email|telefon" und zeigt Meldungen an.
 */
(function (root, fabrik) {
  var P = fabrik();
  if (typeof module === 'object' && module.exports) module.exports = P;
  else root.IsuPlausi = P;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Tastatur-Geklimper nur als GANZES Wort (v1.1.0): als Teilstring traf die Liste echte Namen
  // („Hertz“ ⊃ ertz, „Schwertfeger“ ⊃ wert) und Domains (hertz.com) — GPT-Gegenpruefung 25.09.
  var TASTATUR = ['qwertz', 'qwerty', 'qwert', 'asdf', 'asdfg', 'asdfgh', 'yxcv', 'zxcv', 'sdfg', 'dfgh',
    'fghj', 'ghjk', 'hjkl', 'jklö', 'uiop', 'xcvb', 'cvbn', 'vbnm', 'ycxv', 'sdf', 'dfg', 'fgh', 'jkl',
    'asd', 'qwe', 'yxc', 'xcv'];
  var PLATZHALTER = ['test', 'tester', 'testtest', 'asd', 'asdf', 'sdf', 'abc', 'xxx', 'xyz',
    'aaa', 'bla', 'blabla', 'foo', 'bar', 'dummy', 'muster', 'mustermann', 'max mustermann',
    'name', 'vorname', 'nachname', 'keine', 'kein', 'nein', 'nix', 'egal', 'hallo'];
  var WEGWERF = ['mailinator.com', 'trashmail.com', 'trashmail.de', 'wegwerfmail.de',
    'guerrillamail.com', '10minutemail.com', 'temp-mail.org', 'yopmail.com', 'sharklasers.com',
    'dispostable.com', 'einrot.com', 'spambog.com', 'muellmail.com', 'example.com', 'example.de',
    'test.de', 'test.com'];
  var TIPPFEHLER = { 'gmial.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gmail.de': 'gmail.com',
    'gmx.dee': 'gmx.de', 'gmx.ed': 'gmx.de', 'web.dee': 'web.de', 'wbe.de': 'web.de',
    'hotmial.com': 'hotmail.com', 'outlok.com': 'outlook.com', 'outlook.de ': 'outlook.de',
    't-onlien.de': 't-online.de', 't-onine.de': 't-online.de', 'tonline.de': 't-online.de' };

  function ok() { return { ok: true }; }
  function nein(m) { return { ok: false, meldung: m }; }
  // NFC: „Renée“ (zerlegter Akzent) wird zu „Renée“, sonst scheitert \p{L}.
  function norm(v) {
    var s = String(v == null ? '' : v);
    if (s.normalize) s = s.normalize('NFC');
    return s.trim();
  }

  // „sdfsdf", „abab", „hahaha": derselbe Baustein (>= 1 Zeichen) mehrfach hintereinander.
  function wiederholt(s) { return /^(.{1,4})\1+$/.test(s); }
  function tastatur(s) { return TASTATUR.indexOf(s) !== -1; }
  function vokal(s) { return /[aeiouäöüyéèáàâêîôûíóúåæøœ]/i.test(s); }
  // Gleiches Zeichen dreimal hintereinander kommt in echten Namen praktisch nicht vor.
  function dreifach(s) { return /(.)\1\1/.test(s); }

  // Kein Vokal-Zwang je Wort (v1.1.0): echte Namen wie „Vlk“ haben keinen. Der Gesamtname
  // braucht weiterhin einen Vokal.
  function wortPlausibel(w) {
    var s = w.toLowerCase().replace(/[.'’-]/g, '');
    if (!s) return true;                       // reine Satzzeichen zwischen Teilen
    if (s.length >= 4 && wiederholt(s)) return false;
    if (dreifach(s)) return false;
    if (tastatur(s)) return false;
    return true;
  }

  function name(v) {
    var s = norm(v).replace(/\s+/g, ' ');
    if (!s) return nein('Bitte geben Sie Ihren Namen an.');
    if (s.length < 3) return nein('Bitte geben Sie Ihren vollständigen Namen an.');
    if (s.length > 80) return nein('Der Name ist zu lang.');
    if (/[0-9@_#$%&*+=<>{}\[\]\\/|~^`"]/.test(s)) return nein('Der Name darf nur Buchstaben enthalten.');
    if (!/^[\p{L}][\p{L}\p{M} .'’-]*$/u.test(s)) return nein('Der Name darf nur Buchstaben enthalten.');
    var klein = s.toLowerCase();
    if (PLATZHALTER.indexOf(klein) !== -1) return nein('Bitte geben Sie Ihren echten Namen an.');
    var buchstaben = klein.replace(/[^\p{L}]/gu, '');
    if (buchstaben.length < 3) return nein('Bitte geben Sie Ihren vollständigen Namen an.');
    if (wiederholt(buchstaben) || !vokal(buchstaben)) return nein('Bitte geben Sie Ihren echten Namen an.');
    var worte = klein.split(' ');
    for (var i = 0; i < worte.length; i++) {
      if (PLATZHALTER.indexOf(worte[i]) !== -1 && worte.length <= 2) return nein('Bitte geben Sie Ihren echten Namen an.');
      if (!wortPlausibel(worte[i])) return nein('Bitte geben Sie Ihren echten Namen an.');
    }
    return ok();
  }

  function email(v) {
    var s = norm(v).toLowerCase();
    if (!s) return nein('Bitte geben Sie Ihre E-Mail-Adresse an.');
    if (s.length > 254) return nein('Die E-Mail-Adresse ist zu lang.');
    // Umlaut-Domains (müller.de) in Punycode wandeln; Browser und Node koennen das ueber URL.
    var at = s.lastIndexOf('@');
    if (at > 0 && /[^\x00-\x7f]/.test(s.slice(at + 1))) {
      try { s = s.slice(0, at + 1) + new URL('http://' + s.slice(at + 1)).hostname; } catch (x) { /* bleibt */ }
    }
    var m = /^([a-z0-9!#$%&'*+/=?^_`{|}~.-]+)@([a-z0-9-]+(?:\.[a-z0-9-]+)*\.([a-z]{2,24}|xn--[a-z0-9-]{1,59}))$/.exec(s);
    if (!m) return nein('Bitte prüfen Sie Ihre E-Mail-Adresse (z. B. name@beispiel.de).');
    var lokal = m[1], domain = m[2], tld = m[3];
    if (lokal.length > 64 || /^\.|\.$|\.\./.test(lokal)) return nein('Bitte prüfen Sie Ihre E-Mail-Adresse.');
    var labels = domain.split('.');
    for (var i = 0; i < labels.length; i++) {
      if (!labels[i] || labels[i].length > 63 || /^-|-$/.test(labels[i])) return nein('Bitte prüfen Sie Ihre E-Mail-Adresse.');
    }
    if (TIPPFEHLER[domain]) return nein('Meinten Sie …@' + TIPPFEHLER[domain] + '?');
    if (WEGWERF.indexOf(domain) !== -1) return nein('Bitte verwenden Sie Ihre persönliche E-Mail-Adresse.');
    // Hauptname der Domain (ohne TLD): „sdfsdf", „asdf", „xxx" sind keine echten Anbieter.
    // KEIN Vokal-Zwang (v1.1.0): wwk.de, vkb.de sind echte Versicherer.
    var haupt = labels[labels.length - 2];
    var lokalBuchst = lokal.replace(/[^a-z]/g, '');
    if (haupt.length >= 3 && (wiederholt(haupt) || tastatur(haupt) || dreifach(haupt)))
      return nein('Bitte prüfen Sie Ihre E-Mail-Adresse.');
    if (lokalBuchst.length >= 4 && (wiederholt(lokalBuchst) || tastatur(lokalBuchst)))
      return nein('Bitte prüfen Sie Ihre E-Mail-Adresse.');
    if (PLATZHALTER.indexOf(lokal) !== -1 && ['test', 'asdf', 'sdf', 'xxx', 'abc', 'dummy', 'bla'].indexOf(lokal) !== -1)
      return nein('Bitte verwenden Sie Ihre persönliche E-Mail-Adresse.');
    if (tld.length > 1 && wiederholt(tld) && tld.length >= 4) return nein('Bitte prüfen Sie Ihre E-Mail-Adresse.');
    return ok();
  }

  // Liefert die Nummer als Ziffernfolge in nationaler Form (0…), oder null.
  function telefonNormal(v) {
    var s = norm(v);
    if (!s) return null;
    if (/[^0-9+()\/ .-]/.test(s)) return null;
    if ((s.match(/\+/g) || []).length > 1 || (s.indexOf('+') > 0)) return null;
    var d = s.replace(/[^0-9+]/g, '');
    if (d.indexOf('+49') === 0) d = '0' + d.slice(3);
    else if (d.indexOf('0049') === 0) d = '0' + d.slice(4);
    else if (d.charAt(0) === '+') return d.replace('+', 'INT');   // Ausland: gesondert
    else if (d.indexOf('00') === 0) return 'INT' + d.slice(2);
    return d;
  }

  function ziffernFolge(z) {
    // Abgelehnt wird nur, wenn die GANZE Nummer eine Folge ist (123456789, 0123456789, 987654321),
    // hoechstens eine Stelle daneben. Echte Anschluesse wie 0221 1234567 enthalten Folgen als Block
    // hinter der Vorwahl und muessen durchgehen (Backend-Hinweis 25.09.2026, v1.0.1).
    var auf = 1, ab = 1, max = 1;
    for (var i = 1; i < z.length; i++) {
      var dlt = z.charCodeAt(i) - z.charCodeAt(i - 1);
      auf = dlt === 1 ? auf + 1 : 1;
      ab = dlt === -1 ? ab + 1 : 1;
      max = Math.max(max, auf, ab);
    }
    return max >= 6 && max >= z.length - 1;
  }

  function telefon(v) {
    var s = norm(v);
    if (!s) return nein('Bitte geben Sie Ihre Telefonnummer an, damit wir Sie erreichen.');
    var n = telefonNormal(s);
    if (!n) return nein('Bitte geben Sie eine gültige Telefonnummer an (nur Ziffern, + ( ) / -).');
    var ausland = n.indexOf('INT') === 0;
    var z = ausland ? n.slice(3) : n;
    if (!/^[0-9]+$/.test(z)) return nein('Bitte geben Sie eine gültige Telefonnummer an.');
    if (ausland) {
      if (z.length < 7 || z.length > 15) return nein('Bitte prüfen Sie die Länge Ihrer Telefonnummer.');
    } else {
      if (z.charAt(0) !== '0') return nein('Bitte geben Sie Ihre Nummer mit Vorwahl an (z. B. 0221 …).');
      if (z.length < 8 || z.length > 13) return nein('Bitte prüfen Sie die Länge Ihrer Telefonnummer.');
      if (z.charAt(1) === '0') return nein('Bitte prüfen Sie die Vorwahl.');
      // Mobilnummern: 015x/016x/017x brauchen mindestens 10 Stellen
      if (/^01[567]/.test(z) && z.length < 10) return nein('Bitte prüfen Sie Ihre Mobilnummer.');
    }
    var kern = z.replace(/^0/, '');
    var verschieden = {};
    for (var i = 0; i < kern.length; i++) verschieden[kern.charAt(i)] = 1;
    // Nur EINE Ziffer (0111111111) ist sicher unecht; zwei (030 30003000) kommen real vor (v1.1.0).
    if (Object.keys(verschieden).length <= 1) return nein('Bitte geben Sie Ihre echte Telefonnummer an.');
    if (ziffernFolge(kern)) return nein('Bitte geben Sie Ihre echte Telefonnummer an.');
    if (/(\d)\1{5,}/.test(kern)) return nein('Bitte geben Sie Ihre echte Telefonnummer an.');
    if (/(\d{3,4})\1\1/.test(kern) || /(\d{2})\1\1\1/.test(kern)) return nein('Bitte geben Sie Ihre echte Telefonnummer an.');
    return ok();
  }

  var PRUEFER = { name: name, email: email, telefon: telefon };
  var zaehler = 0;

  // Browser: haengt sich an ein Formular. Felder markieren mit data-plausi="name|email|telefon".
  // Blockiert das Absenden (Capture-Phase, vor anderen Submit-Handlern), zeigt die Meldung
  // unter dem Feld und setzt setCustomValidity, damit Screenreader sie ansagen.
  function anschliessen(form) {
    if (!form || form.__isuPlausi) return;
    form.__isuPlausi = true;
    var felder = function () { return form.querySelectorAll('[data-plausi]'); };
    // aria-describedby tokenweise pflegen: vorhandene Hilfetext-IDs bleiben erhalten (v1.1.0).
    function beschreibung(feld, id, an) {
      var ids = (feld.getAttribute('aria-describedby') || '').split(/\s+/).filter(function (x) { return x && x !== id; });
      if (an) ids.push(id);
      if (ids.length) feld.setAttribute('aria-describedby', ids.join(' '));
      else feld.removeAttribute('aria-describedby');
    }
    function zeige(feld, erg) {
      // Meldung haengt am Feld selbst (keine aus Feldnamen gebauten Selektoren, eindeutige ID).
      var box = feld.__isuPlausiBox;
      if (!erg.ok) {
        if (!box) {
          box = document.createElement('p');
          box.id = 'isu-plausi-' + (++zaehler);
          box.className = 'plausi-meldung';
          box.setAttribute('role', 'alert');
          feld.insertAdjacentElement('afterend', box);
          feld.__isuPlausiBox = box;
        }
        box.textContent = erg.meldung;
        feld.setAttribute('aria-invalid', 'true');
        beschreibung(feld, box.id, true);
        if (feld.setCustomValidity) feld.setCustomValidity(erg.meldung);
      } else {
        if (box) { beschreibung(feld, box.id, false); box.remove(); feld.__isuPlausiBox = null; }
        feld.removeAttribute('aria-invalid');
        if (feld.setCustomValidity) feld.setCustomValidity('');
      }
    }
    function pruefe(feld) {
      var f = PRUEFER[feld.getAttribute('data-plausi')];
      if (!f) return true;
      var erg = f(feld.value);
      zeige(feld, erg);
      return erg.ok;
    }
    Array.prototype.forEach.call(felder(), function (feld) {
      feld.addEventListener('blur', function () { if (feld.value) pruefe(feld); });
      feld.addEventListener('input', function () { if (feld.getAttribute('aria-invalid')) pruefe(feld); });
    });
    form.addEventListener('submit', function (e) {
      var erstes = null;
      Array.prototype.forEach.call(felder(), function (feld) {
        if (!pruefe(feld) && !erstes) erstes = feld;
      });
      if (erstes) {
        e.preventDefault();
        e.stopImmediatePropagation();
        try { erstes.focus(); } catch (x) { /* egal */ }
      }
    }, true);
  }

  function alleAnschliessen(wurzel) {
    var r = wurzel || (typeof document !== 'undefined' ? document : null);
    if (!r) return;
    Array.prototype.forEach.call(r.querySelectorAll('form'), function (f) {
      if (f.querySelector('[data-plausi]')) anschliessen(f);
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { alleAnschliessen(); });
    else alleAnschliessen();
  }

  return { name: name, email: email, telefon: telefon, telefonNormal: telefonNormal,
    anschliessen: anschliessen, alleAnschliessen: alleAnschliessen, version: '1.1.0' };
});
