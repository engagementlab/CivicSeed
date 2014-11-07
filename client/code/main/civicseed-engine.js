var self = module.exports = {

  init: function () {

    if (!CivicSeed.initialized) {

      window.$WINDOW = $(window)
      window.$HTML = $('html')
      window.$BODY = $(document.body)
      window.$CONTAINER = $('#container')

      window.$game = require('/game.main')

      self.setupRouter()

      require('/account').accountHandlers()

      CivicSeed.initialized = true

    }

  },

  setupRouter: function () {

    var $app

    Davis(function () {

      $app = this

      require('/routes.middleware').loadMiddleware($app)
      require('/routes.main').loadRoutes($app)
      require('/routes.account').loadRoutes($app)
      require('/routes.admin').loadRoutes($app)
      require('/routes.profile').loadRoutes($app)
      // should always be last
      require('/routes.errors').loadRoutes($app)

      $app.configure(function (config) {
        // config.linkSelector = 'a.davis'
        // config.formSelector = 'form.davis'
        // config.throwErrors = true
        // config.handleRouteNotFound = false
        config.generateRequestOnPageLoad = true
      })

      $app.start()

    })

  }

}
