document.addEventListener('DOMContentLoaded', () => {
    // 1. Handle Form Submission
    const form = document.getElementById('contact-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const submitBtn = document.getElementById('submit-btn');
            const originalText = submitBtn.innerHTML;

            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'INVIO IN CORSO... ⏳';

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // TODO: In a real environment, replace this URL with your Google Apps Script Web App URL
            // const scriptURL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

            /* Example of real fetch:
            fetch(scriptURL, { method: 'POST', body: formData })
                .then(response => {
                    window.location.href = 'thankyou.html';
                })
                .catch(error => {
                    console.error('Error!', error.message);
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                    alert("Si è verificato un errore. Riprova più tardi.");
                });
            */

            // Simulate network request for demonstration
            setTimeout(() => {
                console.log('Form data submitted:', data);
                // Redirect to thank you page
                window.location.href = 'thankyou.html';
            }, 1500);
        });
    }

    // 2. Load RSS Feed
    const rssContainer = document.getElementById('rss-feed-container');
    if (rssContainer) {
        // Using an RSS-to-JSON API to fetch public news (e.g., Il Sole 24 Ore or similar financial news)
        // Note: For a real production site, you might want to proxy this through your own backend to avoid CORS/rate limits.
        const rssUrl = 'https://corsproxy.io/?' + encodeURIComponent('https://feeds.ilsole24ore.com/c/32276/f/438722/index.rss');

        // A simpler alternative if the above fails is using a public JSON feed or api.rss2json.com
        const fallbackRssUrl = 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeeds.ilsole24ore.com%2Fc%2F32276%2Ff%2F438722%2Findex.rss';

        fetch(fallbackRssUrl)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'ok' && data.items && data.items.length > 0) {
                    let html = '';
                    // Display top 3 news items
                    data.items.slice(0, 3).forEach(item => {
                        html += `
                            <div class="news-item">
                                <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.title}</a>
                                <p style="font-size: 0.85rem; color: #94a3b8; margin-top: 0.5rem;">${new Date(item.pubDate).toLocaleDateString('it-IT')}</p>
                            </div>
                        `;
                    });
                    rssContainer.innerHTML = html;
                } else {
                    rssContainer.innerHTML = '<p>Nessuna notizia disponibile al momento.</p>';
                }
            })
            .catch(error => {
                console.error('Error fetching RSS:', error);
                rssContainer.innerHTML = '<p>Impossibile caricare le notizie in questo momento.</p>';
            });
    }
});
