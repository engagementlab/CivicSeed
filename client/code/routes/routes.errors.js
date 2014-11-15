'use strict';

var self = module.exports = {

  loadRoutes: function (app) {

    app.bind('routeNotFound', function (req) {
      $CONTAINER.append(JT['pages-404']())
    })

  }

}
