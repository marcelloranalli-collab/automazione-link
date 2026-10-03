function doPost(e) {
  try {
    // Apri il foglio di calcolo attivo
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Ottieni i dati dalla richiesta POST
    var nome = e.parameter.nome;
    var email = e.parameter.email;
    var cellulare = e.parameter.cellulare;
    var timestamp = new Date();

    // Aggiungi i dati alla prima riga vuota
    sheet.appendRow([timestamp, nome, email, cellulare]);

    // Ritorna una risposta di successo
    return ContentService
      .createTextOutput(JSON.stringify({ "status": "success" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // In caso di errore
    return ContentService
      .createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
