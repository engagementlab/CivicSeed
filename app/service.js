'use strict';

var rootDir       = process.cwd(),
    config        = require(rootDir + '/app/config'),
    serverHelpers = require(rootDir + '/server/utils/server-helpers')

var mongoose      = require('mongoose'),
    winston       = require('winston')

var self = module.exports = {

  db: null,

  mongooseConnected: (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2),

  connectMongoose: function (app, callback) {
    winston.info('Starting database services ...'.yellow)

    if (!self.mongooseConnected) {
      self.db = mongoose.createConnection(config.get('MONGO_URL'))
      self.db.on('error', function (err) {
        // err is not a string; have to force it
        winston.error('MongoDB: '.blue + ' %s '.white.bgRed, err.toString())
      })
      self.db.once('open', function () {
        winston.info('MongoDB: '.blue + 'Connected to '.green + app.get('env').yellow.inverse)
        if (typeof callback === 'function') {
          callback({ mongooseDb: self.db })
        }
      })
    }
  },

  useModel: function (modelFilename) {
    var model = require(rootDir + '/models/' + modelFilename)

    winston.info('CS: '.blue + 'Preloading model for SS RPC: '.green + model.name.yellow.underline)
    return self.db.model(model.name, new mongoose.Schema(model.schema, { collection: model.collection }))
  },

  getAndSetNetworkIp: function (callback) {
    serverHelpers.getNetworkIPs(function (err, ips) {
      if (err || !ips.length) {
        config.set('IP', 'localhost')
        winston.warn('CS:'.blue + ' Could not find network IP. Defaulting to \'localhost.\''.red)
      } else {
        config.set('IP', ips[0]);
        winston.info('CS:'.blue + ' Running on network IP: ' + ips[0].yellow)
      }
      if (typeof callback === 'function') {
        callback()
      }
    })
  }

}
