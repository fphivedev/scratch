<script>
  document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab");

    // Show the correct tab if ?tab= exists
    if (tabParam) {
      const tabTrigger = document.querySelector(`[data-bs-target="#${tabParam}"]`);
      if (tabTrigger) {
        const tab = new bootstrap.Tab(tabTrigger);
        tab.show();
      }
    }

    // Listen for tab changes and update only the "tab" param
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(link => {
      link.addEventListener("shown.bs.tab", e => {
        const targetSelector = e.target.getAttribute("data-bs-target"); // e.g. "#notes"
        const tabId = targetSelector.substring(1);

        // Copy current URL params
        const newParams = new URLSearchParams(window.location.search);
        newParams.set("tab", tabId); // add or update the tab param

        const newUrl = `${window.location.pathname}?${newParams.toString()}`;
        history.replaceState(null, "", newUrl); // update URL without reload
      });
    });
  });
</script>
