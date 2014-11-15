'use strict';

var self = module.exports = (function () {

  var $body

  return {

    init: function () {

      $body = $(document.body)

      self.setupExportButtons()

    },

    // Create event listeners to export data
    setupExportButtons: function () {

      $body.on('click', '#admin-export button', function () {
        var dataType = $(this).data().type

        window.location = '/admin/export/' + dataType
      })

    }

  }

}())
