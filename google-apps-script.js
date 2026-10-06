/*
Istruzioni per salvare le richieste su Google Drive (Fogli Google):

1. Vai su Google Drive e crea un nuovo "Foglio Google" (Google Sheets).
2. Nella prima riga, inserisci le seguenti intestazioni di colonna:
   A1: Timestamp
   B1: Nome e Cognome
   C1: Email
   D1: Cellulare
   E1: Motivo

3. Dal menu in alto del foglio Google, seleziona "Estensioni" -> "Apps Script".
4. Cancella il codice presente e incolla il codice qui sotto.
5. Sostituisci 'NOME_DEL_TUO_FOGLIO' con il nome reale del tab del foglio (di solito "Foglio1" o "Sheet1").
6. Clicca sull'icona del floppy disk per salvare (o File -> Salva).
7. Clicca su "Esegui" -> "Configurazione iniziale" (potrebbe chiederti i permessi, accettali).
8. Clicca sul pulsante "Esegui il deployment" in alto a destra -> "Nuovo deployment".
9. Seleziona tipo: "App web".
10. Descrizione: "Integrazione Form Finsubito".
11. Esegui come: "Me".
12. Chi ha accesso: "Chiunque" (importante, altrimenti il form non funziona).
13. Clicca "Esegui il deployment". Copia l'URL della Web App generato.
14. Apri il file `app.js` del tuo sito, e sostituisci il commento della fetch con l'URL copiato e de-commenta il blocco fetch.
*/

var sheetName = 'Foglio1'; // Sostituisci se il nome del tab è diverso
var scriptProp = PropertiesService.getScriptProperties();

function initialSetup () {
  var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  scriptProp.setProperty('key', activeSpreadsheet.getId());
}

function doPost (e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.openById(scriptProp.getProperty('key'));
    var sheet = doc.getSheetByName(sheetName);

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var nextRow = sheet.getLastRow() + 1;

    var newRow = headers.map(function(header) {
      if (header === 'Timestamp') {
        return new Date();
      } else if (header === 'Nome e Cognome') {
        return e.parameter['nome_cognome'];
      } else if (header === 'Email') {
        return e.parameter['email'];
      } else if (header === 'Cellulare') {
        return e.parameter['cellulare'];
      } else if (header === 'Motivo') {
        return e.parameter['motivo'];
      } else {
        return e.parameter[header];
      }
    });

    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'row': nextRow }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': e }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  finally {
    lock.releaseLock();
  }
}
