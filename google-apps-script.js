function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
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

      return createResponse(e, { "status": "success", "message": "Codice inviato" });

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

        return createResponse(e, { "status": "success", "message": "Accesso verificato" });
      } else {
        // Codice errato o scaduto
        return createResponse(e, { "status": "error", "message": "Codice errato o scaduto" });
      }
    }

    return createResponse(e, { "status": "error", "message": "Azione non valida" });

  } catch (error) {
    return createResponse(e, { "status": "error", "message": error.toString() });
  }
}

// Funzione helper per supportare sia JSON che JSONP (bypassa gli errori CORS dei file locali)
function createResponse(e, responseObject) {
  var jsonString = JSON.stringify(responseObject);

  if (e.parameter.callback) {
    // Risposta JSONP
    return ContentService
      .createTextOutput(e.parameter.callback + '(' + jsonString + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    // Risposta JSON normale
    return ContentService
      .createTextOutput(jsonString)
      .setMimeType(ContentService.MimeType.JSON);
  }
}
