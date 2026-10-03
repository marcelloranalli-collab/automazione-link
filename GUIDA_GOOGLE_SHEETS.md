# Configurazione Google Sheets per Accesso App

Per salvare i dati di accesso (Nome, Email, Cellulare) direttamente in un Foglio di Calcolo di Google (Google Sheets), devi creare un "Web App" usando Google Apps Script.

Ecco i passaggi dettagliati:

## Passo 1: Crea il Foglio Google
1. Vai su [Google Sheets](https://docs.google.com/spreadsheets) e crea un nuovo foglio di calcolo vuoto.
2. Nominalo come preferisci (es: "Accessi Calcolatore Rata").
3. (Opzionale) Nella prima riga, scrivi le intestazioni delle colonne: `Data`, `Nome e Cognome`, `Email`.

## Passo 2: Crea lo Script
1. Dal menu in alto del tuo Foglio Google, clicca su **Estensioni** > **Apps Script**.
2. Si aprirà una nuova scheda. Cancella tutto il codice presente nell'editor.
3. Copia l'intero contenuto del file `google-apps-script.js` fornito in questa repository e incollalo nell'editor.
4. Salva il progetto cliccando sull'icona del floppy disk o premendo `Ctrl+S` (o `Cmd+S`). Puoi chiamare il progetto "Salva Accessi".

## Passo 3: Autorizzazioni e Pubblicazione come Web App
Questo script ha bisogno dei permessi per inviare email a nome tuo.
**IMPORTANTE:** Se hai già creato un'App Web in precedenza e stai aggiornando il codice, devi *sempre* selezionare "Nuovo deployment".

1. In alto a destra, clicca sul pulsante blu **Esegui deployment** (o "Deploy") e seleziona **Nuovo deployment**.
2. Clicca sull'icona dell'ingranaggio accanto a "Seleziona tipo" e scegli **App Web**.
3. Compila il modulo in questo modo:
   - **Descrizione:** Versione 1
   - **Esegui come:** Seleziona "Me" (il tuo indirizzo email).
   - **Chi ha accesso:** Seleziona **"Chiunque"** (o "Qualsiasi utente", è fondamentale affinché l'app possa inviare i dati senza chiedere all'utente di fare il login con Google).
4. Clicca su **Esegui deployment**.
5. Google ti chiederà di autorizzare l'accesso (sia per modificare il foglio di calcolo, sia per *inviare email*). Clicca su "Autorizza l'accesso", seleziona il tuo account Google. Potrebbe comparire un avviso "Google non ha verificato quest'app". Clicca su **Avanzate** (in basso) e poi su "Apri [nome progetto] (non sicura)" e clicca su "Consenti".
6. Alla fine, otterrai un **URL della web app**. Copialo. (Inizia con `https://script.google.com/macros/s/.../exec`).

## Passo 4: Collega l'URL alla tua App
1. Apri il file `app.js` del calcolatore rata.
2. Trova la prima riga di codice:
   ```javascript
   const GOOGLE_SCRIPT_URL = 'INSERISCI_QUI_IL_TUO_URL_SCRIPT';
   ```
3. Sostituisci `'INSERISCI_QUI_IL_TUO_URL_SCRIPT'` con l'URL che hai copiato al passaggio precedente.
4. Salva il file.

Ora l'app è configurata! Quando un utente compila il modulo iniziale e clicca "Accedi", i suoi dati verranno salvati nel tuo foglio Google.
