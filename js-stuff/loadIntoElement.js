/**
 * Loads HTML from a URL into the given element.
 * @param {HTMLElement} el - The element that will receive the HTML.
 */
async function loadHtmlIntoElement(el) {
    const url = el.dataset.url;
    if (!url) return;

    try {
        const response = await fetch(url, { method: "GET" });
        if (!response.ok) {
            throw new Error(`Failed to load ${url}: ${response.status}`);
        }

        const html = await response.text();
        el.innerHTML = html;
    } catch (err) {
        console.error(err);
        el.innerHTML = "<!-- failed to load content -->";
    }
}

/**
 * Auto-load all elements with class 'action-load-url'
 */
function initAutoLoadHtml() {
    const elements = document.querySelectorAll(".action-load-url");
    elements.forEach(el => loadHtmlIntoElement(el));
}

// Call on page load
document.addEventListener("DOMContentLoaded", initAutoLoadHtml);
