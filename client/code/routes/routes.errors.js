var self = module.exports = {

  loadRoutes: function ($app) {

    $app.get('/404', function (req) {
      $CONTAINER.append(JT['pages-404']())
    })

    $app.bind('routeNotFound', function (req) {
      req.redirect('/404')
    })

  }

}
