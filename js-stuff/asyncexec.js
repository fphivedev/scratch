function initAsyncActionResults() {
  // Attach behavior to a single element
  const attachHandler = el => {
    if (el.dataset.asyncBound) return; // avoid double-binding
    el.dataset.asyncBound = 'true';

    el.addEventListener('click', async () => {
      const url = el.dataset.url;
      if (!url) return;

      // Remove any existing badge
      const existingBadge = el.querySelector('.badge');
      if (existingBadge) existingBadge.remove();

      try {
        const response = await fetch(url, { method: 'GET' });
        const text = await response.text();

        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = `[${text.trim()}]`;
        el.appendChild(badge);

        // Fade out and remove after 3 seconds
        setTimeout(() => {
          badge.style.transition = 'opacity 1s';
          badge.style.opacity = '0';
          setTimeout(() => badge.remove(), 1000);
        }, 3000);
      } catch (error) {
        console.error('Async action failed:', error);
      }
    });
  };

  // Initial binding
  document.querySelectorAll('.action-async-result').forEach(attachHandler);

  // Observe for dynamically added elements
  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.classList.contains('action-async-result')) {
            attachHandler(node);
          } else {
            node.querySelectorAll?.('.action-async-result').forEach(attachHandler);
          }
        }
      });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// Run once on page load
document.addEventListener('DOMContentLoaded', initAsyncActionResults);
