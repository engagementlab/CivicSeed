'use strict'

var rootDir = require('app-root-path')
var winston = require('winston')

module.exports = {

  loadAll: function (app, service, callback) {
    winston.info('Loading controllers ...'.yellow)
    require(rootDir + '/server/controllers/app-control').init(app)

    winston.info('All controllers loaded.'.green)
    if (typeof callback === 'function') {
      callback()
    }
  }

}
