/* Shared datepicker configuration (ES module) */
const datepicker = {
  locale: {
    days: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    daysShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    daysMin: ['Su','Mo','Tu','We','Th','Fr','Sa'],
    months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    monthsShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    firstDay: 1,
    weekHeader: 'Wk'
  },
  options: {
    dateFormat: 'dd/MM/yyyy',
    autoClose: true
  }
};

function initDatepickers(root){
  const scope = root || document;
  const dateEls = scope.querySelectorAll('.js-datepicker');
  try {
    if (window.AirDatepicker) {
      const shared = datepicker;
      const enLocale = shared.locale;
      dateEls.forEach((el) => {
        if (el.dataset.adpBound === '1') return;
        const baseOptions = shared.options;
        // eslint-disable-next-line no-new
        new window.AirDatepicker(el, Object.assign({}, baseOptions, { locale: enLocale }));
        el.dataset.adpBound = '1';
      });
    }
  } catch (e) {
    console.warn('Datepicker init failed', e);
  }
}

// Class to update the template batch prioritisation
class BatchUpdater {
    constructor(options = {}) {
        this.inputSelector = options.inputSelector || 'input.batch-updater';
        this.indicatorText = options.indicatorText || 'Saved';
        this.indicatorDuration = options.indicatorDuration || 15000;
        this.saveUrlBuilder = options.saveUrlBuilder || ((input, normalized) => (
            'jsonUpdates.asp?page=templates_batch_save'
            + '&batchNumber=' + encodeURIComponent(normalized)
            + '&workId=' + encodeURIComponent(input.dataset.workid || '')
        ));
    }

    // normalize to digits-only
    normalize(value) {
        return (value || '').replace(/\D/g, '');
    }

    showSavedIndicator(inputEl, { text, duration } = {}) {
        const next = inputEl.nextSibling;
        if (next?.nodeType === 1 && next.classList?.contains('save-indicator')) next.remove();

        const badge = document.createElement('span');
        badge.className = 'save-indicator save-indicator--enter';
        badge.setAttribute('aria-live', 'polite');
        const label = text ?? this.indicatorText;
        const ms = duration ?? this.indicatorDuration;
        badge.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.285 6.708a1 1 0 0 1 0 1.414l-9.9 9.9a1 1 0 0 1-1.414 0l-4.243-4.243a1 1 0 0 1 1.414-1.414l3.536 3.536 9.193-9.193a1 1 0 0 1 1.414 0z"/>
    </svg>
    <span>${label}</span>
  `;
        inputEl.insertAdjacentElement('afterend', badge);
        requestAnimationFrame(() => {
            badge.classList.remove('save-indicator--enter');
            badge.classList.add('save-indicator--visible');
        });
        setTimeout(() => {
            badge.classList.remove('save-indicator--visible');
            badge.classList.add('save-indicator--exit');
            badge.addEventListener('transitionend', () => badge.remove(), { once: true });
        }, ms);
    }

    async saveBatchNumber(input) {
        const normalized = this.normalize(input.value);
        const prev = input.dataset.currentValue ?? '';
        if (normalized === prev) return; // nothing to do

        input.value = normalized; // keep the digits-only version in the field
        const url = this.saveUrlBuilder(input, normalized);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Response status: ${response.status}`);
        this.showSavedIndicator(input, { text: this.indicatorText });
        input.dataset.currentValue = normalized; // update baseline
    }

    moveToRowInput(currentInput, dir /* 'up'|'down' */) {
        const currentRow = currentInput.closest('tr');
        if (!currentRow) return;

        const rowInputs = Array.from(currentRow.querySelectorAll('input:not([type=hidden]):not([disabled])'));
        const colIndex = Math.max(0, rowInputs.indexOf(currentInput));

        let targetRow = currentRow;
        while (true) {
            targetRow = dir === 'down' ? targetRow.nextElementSibling : targetRow.previousElementSibling;
            if (!targetRow) return; // no more rows
            if (targetRow.matches('tr') && targetRow.querySelector('input:not([type=hidden]):not([disabled])')) break;
        }

        const targetInputs = Array.from(targetRow.querySelectorAll('input:not([type=hidden]):not([disabled])'));
        const target = targetInputs[colIndex] || targetInputs[0];
        if (target) {
            target.focus();
            if (typeof target.select === 'function') target.select();
        }
    }

    handleKeyNav(e) {
        if (e.key === 'ArrowDown' || e.key === 'Down') {
            e.preventDefault();
            this.moveToRowInput(e.currentTarget || e.target, 'down');
        } else if (e.key === 'ArrowUp' || e.key === 'Up') {
            e.preventDefault();
            this.moveToRowInput(e.currentTarget || e.target, 'up');
        }
    }

    attachTo(input) {
        // Baseline current value
        if (input.dataset.currentValue == null) input.dataset.currentValue = this.normalize(input.value);
        // Events
        input.addEventListener('keydown', this.handleKeyNav.bind(this));
        input.addEventListener('change', (e) => this.saveBatchNumber(e.currentTarget));
    }

    init(root = document) {
        const inputs = Array.from(root.querySelectorAll(this.inputSelector));
        inputs.forEach((el) => this.attachTo(el));
    }
}

// Expose a global singleton
var BATCH_UPDATER = new BatchUpdater();
window.BatchUpdater = BatchUpdater;
window.BATCH_UPDATER = BATCH_UPDATER;


document.addEventListener('DOMContentLoaded', function () {
    if (window.BATCH_UPDATER) window.BATCH_UPDATER.init();
    initDatepickers(document);
});


function onlyAllowNumbers(input) {
    input.value = input.value.replace(/\D/g, '')
}

function openUrl(e, clickableItem) {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (e.target.tagName.toUpperCase() === "TD") {
        location.href = clickableItem.dataset.url;
    }
}
