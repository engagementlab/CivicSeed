'use strict'
/* global $ */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    admin.export

    - Setup export menu

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

module.exports = (function () {
  // Create event listeners to export data
  function setupExportButtons () {
    $(document.body).on('click', '#admin-export button', function () {
      var dataType = $(this).data().type
      window.location = '/admin/export/' + dataType
    })
  }

  return {
    init: function () {
      setupExportButtons()
    }
  }
}())
