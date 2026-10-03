let currentResult = null;
let currentType = null;

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

    currentType = 'Mutuo';
    currentResult = {
        importo: importo,
        tassoAnnuo: tassoAnnuo,
        durata: anni + " anni",
        rata: rata
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

    currentType = 'Leasing';
    currentResult = {
        valoreBene: valoreBene,
        anticipo: anticipo,
        riscatto: riscatto,
        tassoAnnuo: tassoAnnuo,
        durata: mesi + " mesi",
        rata: rata
    };

    mostraRisultato(`Rata Mensile Leasing: €${rata.toFixed(2)}`);
}

function mostraRisultato(testo) {
    document.getElementById("risultato-testo").innerText = testo;
    document.getElementById("risultato").style.display = "block";
}

function generaPDF() {
    if (!currentResult) {
        alert("Calcola prima una rata per generare il PDF.");
        return;
    }

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

    const finalY = doc.lastAutoTable.finalY || 40;

    // Advertisement section in PDF
    doc.setFontSize(14);
    doc.setTextColor(211, 47, 47); // Red color for ad
    doc.text("Hai bisogno di un finanziamento?", 105, finalY + 20, null, null, "center");

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("#finsubito.org", 105, finalY + 30, null, null, "center");

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text("Per richiedere informazioni, compila il form su:", 105, finalY + 45, null, null, "center");

    doc.setTextColor(25, 118, 210); // Blue link
    doc.text("info.finsubito.org", 105, finalY + 55, null, null, "center");

    // Save PDF
    doc.save(`Preventivo_${currentType}_${new Date().getTime()}.pdf`);
}
