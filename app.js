// Inserisci qui l'URL dello script di Google Apps Script generato
const GOOGLE_SCRIPT_URL = 'INSERISCI_QUI_IL_TUO_URL_SCRIPT';

let currentResult = null;
let currentType = null;

async function accediAllApp(event) {
    event.preventDefault();

    const nome = document.getElementById('user-nome').value;
    const email = document.getElementById('user-email').value;
    const cellulare = document.getElementById('user-cellulare').value;
    const btnAccedi = document.getElementById('btn-accedi');
    const statusMsg = document.getElementById('login-status');

    if (!nome || !email || !cellulare) {
        alert('Compila tutti i campi per accedere.');
        return;
    }

    // Cambia stato del bottone
    btnAccedi.disabled = true;
    btnAccedi.innerText = "Salvataggio in corso...";
    statusMsg.style.display = "block";
    statusMsg.innerText = "Attendere prego...";

    try {
        // Prepariamo i dati per Google Sheets
        // Usiamo un URLSearchParams per inviare una richiesta POST come modulo
        const formData = new URLSearchParams();
        formData.append('nome', nome);
        formData.append('email', email);
        formData.append('cellulare', cellulare);

        if(GOOGLE_SCRIPT_URL !== 'INSERISCI_QUI_IL_TUO_URL_SCRIPT') {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: formData,
            });
        } else {
             console.log("Nota: URL Google Script non configurato. I dati non sono stati inviati, ma ti faccio accedere ugualmente per test.");
        }

        // Accesso consentito, nascondi il form e mostra l'app
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';

    } catch (error) {
        console.error('Errore di connessione:', error);
        alert("Si è verificato un errore durante l'accesso. Riprova.");
        btnAccedi.disabled = false;
        btnAccedi.innerText = "Accedi all'App";
        statusMsg.style.display = "none";
    }
}

function openTab(evt, tabName) {
    // Hide all tab contents
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].style.display = "none";
        tabContents[i].classList.remove("active");
    }

    // Remove "active" class from all tab buttons
    const tabBtns = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabBtns.length; i++) {
        tabBtns[i].classList.remove("active");
    }

    // Show the current tab and add an "active" class to the button that opened the tab
    document.getElementById(tabName).style.display = "block";
    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");

    // Hide result section when switching tabs
    document.getElementById("risultato").style.display = "none";
}

function calcolaMutuo() {
    const importo = parseFloat(document.getElementById("importo-mutuo").value);
    const tassoAnnuo = parseFloat(document.getElementById("tasso-mutuo").value);
    const anni = parseInt(document.getElementById("durata-mutuo").value);

    if (isNaN(importo) || isNaN(tassoAnnuo) || isNaN(anni) || importo <= 0 || anni <= 0 || tassoAnnuo < 0) {
        alert("Per favore, inserisci valori validi per il mutuo.");
        return;
    }

    const mesi = anni * 12;
    const tassoMensile = tassoAnnuo / 100 / 12;

    let rata;
    if (tassoMensile === 0) {
        rata = importo / mesi;
    } else {
        rata = importo * (tassoMensile * Math.pow(1 + tassoMensile, mesi)) / (Math.pow(1 + tassoMensile, mesi) - 1);
    }

    // Calcolo piano di ammortamento (francese)
    let pianoAmmortamento = [];
    let debitoResiduo = importo;
    for (let i = 1; i <= mesi; i++) {
        let quotaInteressi = debitoResiduo * tassoMensile;
        let quotaCapitale = rata - quotaInteressi;
        debitoResiduo -= quotaCapitale;

        // Evitare piccoli numeri negativi dovuti ad arrotondamenti
        if (debitoResiduo < 0) debitoResiduo = 0;

        pianoAmmortamento.push({
            mese: i,
            rata: rata,
            quotaCapitale: quotaCapitale,
            quotaInteressi: quotaInteressi,
            debitoResiduo: debitoResiduo
        });
    }

    currentType = 'Mutuo';
    currentResult = {
        importo: importo,
        tassoAnnuo: tassoAnnuo,
        durata: anni + " anni",
        rata: rata,
        pianoAmmortamento: pianoAmmortamento
    };

    mostraRisultato(`Rata Mensile Mutuo: €${rata.toFixed(2)}`);
}

function calcolaLeasing() {
    const valoreBene = parseFloat(document.getElementById("valore-bene").value);
    const anticipo = parseFloat(document.getElementById("anticipo-leasing").value) || 0;
    const riscatto = parseFloat(document.getElementById("riscatto-leasing").value) || 0;
    const tassoAnnuo = parseFloat(document.getElementById("tasso-leasing").value);
    const mesi = parseInt(document.getElementById("durata-leasing").value);

    if (isNaN(valoreBene) || isNaN(tassoAnnuo) || isNaN(mesi) || valoreBene <= 0 || mesi <= 0 || tassoAnnuo < 0) {
        alert("Per favore, inserisci valori validi per il leasing.");
        return;
    }

    const importoFinanziato = valoreBene - anticipo;

    if (importoFinanziato <= 0) {
        alert("L'anticipo non può essere maggiore o uguale al valore del bene.");
        return;
    }

    const tassoMensile = tassoAnnuo / 100 / 12;

    let rata;
    if (tassoMensile === 0) {
        rata = (importoFinanziato - riscatto) / mesi;
    } else {
        // Formula that accounts for the present value of the balloon payment (riscatto)
        const pvRiscatto = riscatto / Math.pow(1 + tassoMensile, mesi);
        rata = (importoFinanziato - pvRiscatto) * (tassoMensile * Math.pow(1 + tassoMensile, mesi)) / (Math.pow(1 + tassoMensile, mesi) - 1);
    }

    // Calcolo piano di ammortamento
    let pianoAmmortamento = [];
    let debitoResiduo = importoFinanziato;

    for (let i = 1; i <= mesi; i++) {
        let quotaInteressi = debitoResiduo * tassoMensile;
        let quotaCapitale = rata - quotaInteressi;
        debitoResiduo -= quotaCapitale;

        // Se è l'ultimo mese, il debito residuo teorico dovrebbe corrispondere al valore di riscatto
        if (i === mesi && Math.abs(debitoResiduo - riscatto) < 0.01) {
            debitoResiduo = riscatto;
        } else if (debitoResiduo < 0) {
            debitoResiduo = 0;
        }

        pianoAmmortamento.push({
            mese: i,
            rata: rata,
            quotaCapitale: quotaCapitale,
            quotaInteressi: quotaInteressi,
            debitoResiduo: debitoResiduo
        });
    }

    currentType = 'Leasing';
    currentResult = {
        valoreBene: valoreBene,
        anticipo: anticipo,
        riscatto: riscatto,
        tassoAnnuo: tassoAnnuo,
        durata: mesi + " mesi",
        rata: rata,
        pianoAmmortamento: pianoAmmortamento
    };

    mostraRisultato(`Rata Mensile Leasing: €${rata.toFixed(2)}`);
}

function mostraRisultato(testo) {
    document.getElementById("risultato-testo").innerText = testo;
    document.getElementById("risultato").style.display = "block";
}

function generaOggettoPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Title
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("Riepilogo Calcolo " + currentType, 105, 20, null, null, "center");

    // Date
    doc.setFontSize(10);
    doc.text("Data: " + new Date().toLocaleDateString('it-IT'), 20, 30);

    let bodyData = [];

    if (currentType === 'Mutuo') {
        bodyData = [
            ['Importo Mutuo', `€ ${currentResult.importo.toFixed(2)}`],
            ['Tasso Annuo', `${currentResult.tassoAnnuo.toFixed(2)} %`],
            ['Durata', currentResult.durata],
            ['Rata Mensile Stimata', `€ ${currentResult.rata.toFixed(2)}`]
        ];
    } else if (currentType === 'Leasing') {
        bodyData = [
            ['Valore del Bene', `€ ${currentResult.valoreBene.toFixed(2)}`],
            ['Anticipo', `€ ${currentResult.anticipo.toFixed(2)}`],
            ['Valore di Riscatto', `€ ${currentResult.riscatto.toFixed(2)}`],
            ['Tasso Annuo', `${currentResult.tassoAnnuo.toFixed(2)} %`],
            ['Durata', currentResult.durata],
            ['Rata Mensile Stimata', `€ ${currentResult.rata.toFixed(2)}`]
        ];
    }

    doc.autoTable({
        startY: 40,
        head: [['Parametro', 'Valore']],
        body: bodyData,
        theme: 'striped',
        headStyles: { fillColor: [76, 175, 80] },
        styles: { fontSize: 12, cellPadding: 5 }
    });

    let finalY = doc.lastAutoTable.finalY || 40;

    const includiAmmortamento = document.getElementById("includi-ammortamento").checked;

    if (includiAmmortamento && currentResult.pianoAmmortamento) {
        let ammortamentoBody = currentResult.pianoAmmortamento.map(riga => [
            riga.mese,
            `€ ${riga.rata.toFixed(2)}`,
            `€ ${riga.quotaCapitale.toFixed(2)}`,
            `€ ${riga.quotaInteressi.toFixed(2)}`,
            `€ ${riga.debitoResiduo.toFixed(2)}`
        ]);

        doc.addPage();
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 40);
        doc.text("Piano di Ammortamento", 105, 20, null, null, "center");

        doc.autoTable({
            startY: 30,
            head: [['Mese', 'Rata', 'Q. Capitale', 'Q. Interessi', 'Debito Residuo']],
            body: ammortamentoBody,
            theme: 'striped',
            headStyles: { fillColor: [33, 150, 243] },
            styles: { fontSize: 10, cellPadding: 3 }
        });

        finalY = doc.lastAutoTable.finalY || 30;
    }

    // Aggiungi spazio prima della pubblicità
    let adStartY = finalY + 20;
    if (adStartY > doc.internal.pageSize.getHeight() - 50) {
        doc.addPage();
        adStartY = 20;
    }

    // Advertisement section in PDF
    doc.setFontSize(14);
    doc.setTextColor(211, 47, 47); // Red color for ad
    doc.text("Hai bisogno di un finanziamento?", 105, adStartY, null, null, "center");

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("#finsubito.org", 105, adStartY + 10, null, null, "center");

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Per richiedere informazioni, compila il form su:", 105, adStartY + 25, null, null, "center");

    doc.setTextColor(25, 118, 210); // Blue link
    doc.text("info.finsubito.org", 105, adStartY + 35, null, null, "center");

    return doc;
}

function salvaPDF() {
    if (!currentResult) {
        alert("Calcola prima una rata per salvare il PDF.");
        return;
    }
    const doc = generaOggettoPDF();
    doc.save(`Preventivo_${currentType}_${new Date().getTime()}.pdf`);
}

async function condividiPDF() {
    if (!currentResult) {
        alert("Calcola prima una rata per condividere il PDF.");
        return;
    }

    const doc = generaOggettoPDF();
    const pdfBlob = doc.output('blob');
    const fileName = `Preventivo_${currentType}_${new Date().getTime()}.pdf`;

    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                title: 'Preventivo ' + currentType,
                text: 'Ecco il riepilogo del calcolo.',
                files: [file]
            });
            console.log('Condivisione completata con successo');
        } catch (error) {
            console.error('Errore durante la condivisione:', error);
            // Se l'utente annulla non mostriamo l'alert, altrimenti sì
            if (error.name !== 'AbortError') {
                 alert("Errore durante la condivisione del file.");
            }
        }
    } else {
        alert("La condivisione di file non è supportata su questo browser/dispositivo. Verrà scaricato il file.");
        doc.save(fileName);
    }
}
