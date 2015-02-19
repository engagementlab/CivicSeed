'use strict'
/* global $CONTAINER, JT */

module.exports = {

  loadRoutes: function (app) {
    app.bind('routeNotFound', function (req) {
      $CONTAINER.append(JT['pages-404']())
    })
  }

}
