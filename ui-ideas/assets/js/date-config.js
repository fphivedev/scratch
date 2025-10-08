/*!
 * Shared datepicker configuration
 * Usage: window.Ideas.datepicker.locale / options
 */
(function(global){
  var Ideas = global.Ideas = global.Ideas || {};
  var enLocale = {
    days: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    daysShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    daysMin: ['Su','Mo','Tu','We','Th','Fr','Sa'],
    months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    monthsShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    firstDay: 1,
    weekHeader: 'Wk'
  };

  Ideas.datepicker = {
    locale: enLocale,
    options: {
      dateFormat: 'dd/MM/yyyy',
      autoClose: true
    }
  };
})(window);
