'use strict';
// Extends apprise 1.5 to fix a situation where pressing Enter/Esc to dismiss or confirm
// an apprise box will also trigger the event on other handlers.

module.exports = {

  init: function () {
    $(document).keydown(function (e) {
      if ($('.appriseOverlay').is(':visible')) {
        if (e.keyCode == 13) {
          e.preventDefault() // This line got added
          $('.aButtons > button[value="ok"]').click()
        }
        if (e.keyCode == 27) {
          e.preventDefault() // This line got added
          $('.aButtons > button[value="cancel"]').click()
        }
      }
    })
  }

}
