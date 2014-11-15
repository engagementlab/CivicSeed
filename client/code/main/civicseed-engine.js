'use strict';

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

    // Note: Davis.js has not been actively
    // supported since v0.9.9 in 2012.

    var app = Davis(function () {

      require('/routes.middleware').loadMiddleware(this)
      require('/routes.main').loadRoutes(this)
      require('/routes.account').loadRoutes(this)
      require('/routes.admin').loadRoutes(this)
      require('/routes.profile').loadRoutes(this)
      // Should always be last
      require('/routes.errors').loadRoutes(this)

    })

    app.configure(function (config) {
      config.throwErrors = true
      config.handleRouteNotFound = false
      config.generateRequestOnPageLoad = true
    })

    app.start()

  }

}
