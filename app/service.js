var rootDir       = process.cwd()
    config        = require(rootDir + '/app/config'),
    serverHelpers = require(rootDir + '/server/utils/server-helpers')

var mongoose      = require('mongoose'),
    winston       = require('winston')

var Schema        = mongoose.Schema,
    ObjectId      = Schema.ObjectId

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

  useModel: function (modelName, state) {
    if (state === 'preload') {
      winston.info('CS: '.blue + 'Preloading model for SS RPC: '.green + modelName.yellow.underline)
    } else if (state === 'ss') {
      winston.info('CS: '.blue + 'Importing model '.magenta + modelName.yellow.underline + ' into socket stream RPC.'.magenta)
    } else {
      winston.info('CS: '.blue + 'Import model '.blue + modelName.yellow.underline + ' into following controller: '.blue)
    }
    return require(rootDir + '/models/' + modelName + '-model')(mongoose, self.db, Schema, ObjectId)
  },

  useModule: function (moduleName, state) {
    return require(rootDir + '/modules/' + moduleName)
  },

  getAndSetNetworkIp: function (callback) {
    serverHelpers.getNetworkIPs(function (err, ips) {
      if (err || !ips.length) {
        config.set('IP', 'localhost')
        winston.warn('Civic Seed:'.yellow + ' could not find network ip. Defaulting to \'localhost.\''.red)
      } else {
        config.set('IP', ips[0]);
        winston.info('Civic Seed:'.yellow + ' running on network ip: ' + ips[0].yellow)
      }
      if (typeof callback === 'function') {
        callback()
      }
    })
  }

}
