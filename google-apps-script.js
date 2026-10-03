function doPost(e) {
  try {
    var action = e.parameter.action;
    var email = e.parameter.email;
    var nome = e.parameter.nome;
    var cache = CacheService.getScriptCache();

    if (action === "send_code") {
      // Genera un codice a 6 cifre
      var code = Math.floor(100000 + Math.random() * 900000).toString();

      // Salva il codice nella cache per 10 minuti (600 secondi) associato all'email
      cache.put(email, code, 600);

      // Invia l'email con il codice
      var subject = "Il tuo codice di accesso per il Calcolatore";
      var body = "Ciao " + nome + ",\n\nIl tuo codice di verifica per accedere all'app è: " + code + "\n\nQuesto codice scadrà in 10 minuti.";

      MailApp.sendEmail(email, subject, body);

      return ContentService
        .createTextOutput(JSON.stringify({ "status": "success", "message": "Codice inviato" }))
        .setMimeType(ContentService.MimeType.JSON);

    } else if (action === "verify_code") {
      var userCode = e.parameter.code;
      var cachedCode = cache.get(email);

      if (cachedCode && cachedCode === userCode) {
        // Codice corretto, rimuovi dalla cache e salva i dati
        cache.remove(email);

        // Salva nel foglio
        var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
        var timestamp = new Date();
        sheet.appendRow([timestamp, nome, email]);

        return ContentService
          .createTextOutput(JSON.stringify({ "status": "success", "message": "Accesso verificato" }))
          .setMimeType(ContentService.MimeType.JSON);
      } else {
        // Codice errato o scaduto
        return ContentService
          .createTextOutput(JSON.stringify({ "status": "error", "message": "Codice errato o scaduto" }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ "status": "error", "message": "Azione non valida" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
