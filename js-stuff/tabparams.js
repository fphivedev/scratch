<script>
  document.addEventListener("DOMContentLoaded", function () {
    // Get query param from URL
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");

    // If there's a tab param, activate that tab
    if (tabParam) {
      const tabTrigger = document.querySelector(`[href="#${tabParam}"]`);
      if (tabTrigger) {
        const tab = new bootstrap.Tab(tabTrigger);
        tab.show();
      }
    }

    // When a tab is shown, update the URL
    const tabLinks = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabLinks.forEach(link => {
      link.addEventListener("shown.bs.tab", e => {
        const id = e.target.getAttribute("href").substring(1); // e.g. "notes"
        const newUrl = `${window.location.pathname}?tab=${id}`;
        history.replaceState(null, "", newUrl); // update URL without reload
      });
    });
  });
</script>
