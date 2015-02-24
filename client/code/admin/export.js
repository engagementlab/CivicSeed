'use strict'
/* global $ */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    admin.export

    - Setup export menu

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// Create event listeners to export data
function setupExportButtons () {
  $(document.body).on('click', '#admin-export button', function () {
    var dataType = $(this).data().type
    window.location = '/admin/export/' + dataType
  })
}

module.exports = {
  init: function () {
    setupExportButtons()
  }
}
