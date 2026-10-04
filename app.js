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

    currentType = 'Prestito / Mutuo';
    currentResult = {
        importo: importo,
        tassoAnnuo: tassoAnnuo,
        durata: anni + " anni",
        rata: rata,
        pianoAmmortamento: pianoAmmortamento
    };

    mostraRisultato(`Rata Mensile: €${rata.toFixed(2)}`);
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

    if (currentType === 'Prestito / Mutuo') {
        bodyData = [
            ['Importo', `€ ${currentResult.importo.toFixed(2)}`],
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

// ----------------------------------------------------
// LOGICA NEWS FEED
// ----------------------------------------------------
(function() {
    'use strict';

    const FEED_BASE = 'https://www.google.it/alerts/feeds/03705093258573153679/7724034719465165919';
    const container = document.getElementById('feed-container');
    const lastUpdateTime = document.getElementById('last-update-time');
    let isFirstLoad = true;

    function formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
        } catch (_) {
            return dateStr;
        }
    }

    function formatTime() {
        const now = new Date();
        return now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second:'2-digit' });
    }

    function escapeHtml(text) {
        if (!text) return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    function cleanSummary(htmlString) {
        if (!htmlString) return '';
        let text = htmlString.replace(/<[^>]*>/g, ' ');
        text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
        return text.replace(/\s+/g, ' ').trim();
    }

    async function fetchRawData(feedUrl) {
        const cbUrl = feedUrl + '?t=' + new Date().getTime();

        try {
            const r1 = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(cbUrl)}`);
            if (r1.ok) {
                const data = await r1.json();
                if (data.status === 'ok' && data.items && data.items.length > 0) {
                    return { type: 'json', items: data.items };
                }
            }
        } catch (e) { console.warn("Proxy 1 fallito..."); }

        try {
            const r2 = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(cbUrl)}`);
            if (r2.ok) {
                const text = await r2.text();
                if (text && text.includes('<entry>')) return { type: 'xml', data: text };
            }
        } catch (e) { console.warn("Proxy 2 fallito..."); }

        try {
            const r3 = await fetch(`https://corsproxy.io/?${encodeURIComponent(cbUrl)}`);
            if (r3.ok) {
                const text = await r3.text();
                if (text && text.includes('<entry>')) return { type: 'xml', data: text };
            }
        } catch (e) { console.warn("Proxy 3 fallito."); }

        throw new Error("Tutti i proxy hanno fallito.");
    }

    async function fetchFeed(isManualRefresh = false) {
        if (isFirstLoad || isManualRefresh) {
            container.innerHTML = `<div class="loading">⏳ Sincronizzazione in corso...</div>`;
        }

        try {
            const result = await fetchRawData(FEED_BASE);
            let html = '';

            if (result.type === 'json') {
                result.items.forEach(item => {
                    const title = cleanSummary(item.title);
                    const link = item.link || '#';
                    const pubDate = formatDate(item.pubDate);
                    let desc = cleanSummary(item.description);

                    let source = "News";
                    try {
                        const urlObj = new URL(link);
                        const realUrlStr = urlObj.searchParams.get("url");
                        if (realUrlStr) source = new URL(realUrlStr).hostname.replace('www.', '');
                    } catch(e) {}

                    if (!desc || desc.length < 20) desc = 'Dettagli non disponibili nell\'anteprima. Accedi all\'articolo completo.';
                    else if (desc.length > 180) desc = desc.substring(0, 180) + '...';

                    html += `
                        <div class="feed-item">
                            <div class="meta"><span class="source">${escapeHtml(source)}</span><span>${pubDate}</span></div>
                            <h2><a href="${escapeHtml(link)}" target="_blank" rel="noopener">${escapeHtml(title)}</a></h2>
                            <div class="summary">${escapeHtml(desc)}</div>
                            <a href="${escapeHtml(link)}" target="_blank" class="read-more-link">Leggi l'articolo</a>
                        </div>`;
                });
            } else if (result.type === 'xml') {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(result.data, "text/xml");
                const entries = xmlDoc.querySelectorAll("entry");

                entries.forEach(entry => {
                    const titleNode = entry.querySelector("title");
                    const title = titleNode ? cleanSummary(titleNode.textContent) : '(Senza titolo)';
                    const linkNode = entry.querySelector("link");
                    const link = linkNode ? linkNode.getAttribute("href") : '#';
                    const pubDateNode = entry.querySelector("published") || entry.querySelector("updated");
                    const pubDate = formatDate(pubDateNode ? pubDateNode.textContent : '');
                    const contentNode = entry.querySelector("content");
                    let desc = cleanSummary(contentNode ? contentNode.textContent : '');

                    let source = "News";
                    try {
                        const urlObj = new URL(link);
                        const realUrlStr = urlObj.searchParams.get("url");
                        if (realUrlStr) source = new URL(realUrlStr).hostname.replace('www.', '');
                    } catch(e) {}

                    if (!desc || desc.length < 20) desc = 'Dettagli non disponibili nell\'anteprima. Accedi all\'articolo completo.';
                    else if (desc.length > 180) desc = desc.substring(0, 180) + '...';

                    html += `
                        <div class="feed-item">
                            <div class="meta"><span class="source">${escapeHtml(source)}</span><span>${pubDate}</span></div>
                            <h2><a href="${escapeHtml(link)}" target="_blank" rel="noopener">${escapeHtml(title)}</a></h2>
                            <div class="summary">${escapeHtml(desc)}</div>
                            <a href="${escapeHtml(link)}" target="_blank" class="read-more-link">Leggi l'articolo</a>
                        </div>`;
                });
            }

            container.innerHTML = html;
            lastUpdateTime.textContent = `Aggiornato alle ${formatTime()}`;
            isFirstLoad = false;

        } catch (err) {
            console.error('Errore durante la sincronizzazione:', err);
            lastUpdateTime.textContent = "Aggiornamento fallito";

            container.innerHTML = `
                <div class="error">
                    <strong>Impossibile sincronizzare le notizie in questo momento</strong><br />
                    Si è verificato un blocco di rete. Clicca su "Aggiorna Ora" per riprovare.
                </div>
            `;
        }
    }

    // Delay the initial fetch slightly to prioritize the calculator rendering
    setTimeout(() => {
        fetchFeed();
        setInterval(() => fetchFeed(), 180000);
    }, 1000);

    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            lastUpdateTime.textContent = "Sincronizzazione in corso...";
            fetchFeed(true);
        });
    }

})();
