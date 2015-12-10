var rootDir = process.cwd()

var fs = require('fs')
var nconf = require('nconf')
var env = require('node-env-file')
var colors = require('colors')
var bcrypt = require('bcrypt')
var mongoose = require('mongoose')
var winston = require('winston')

winston.info('Bootstrapping MongoDB for Civic Seed first-run ...'.red)

// Read environment variables from an optional .env, if present
var envFile = rootDir + '/.env'
if (fs.existsSync(envFile)) {
  winston.info('.env found. Loading ...'.red)
  env(envFile, {
    verbose: false,
    overwrite: true
  })
}

var NODE_ENV = process.env.NODE_ENV || 'development'
var CONFIG_FILE = rootDir + '/config/' + NODE_ENV + '.json'

nconf.argv().env().file({
  file: CONFIG_FILE
})

if (NODE_ENV === 'heroku') {
  winston.info('Environment: '.blue + 'Heroku environment'.magenta)
  nconf.set('MONGO_URL', process.env.MONGOHQ_URL)
}

var _db
var _userModel
var _superAdminUser

_db = mongoose.createConnection(nconf.get('MONGO_URL'))
_db.on('error', function (err) {
  winston.error('MongoDB: '.blue + ' %s '.white.bgRed, err.toString())
})
_db.once('open', function () {
  winston.info('MongoDB connection opened ...'.blue)
  var model = require(rootDir + '/models/user')
  _userModel = _db.model(model.name, new mongoose.Schema(model.schema, { collection: model.collection }))
  _db.collections['users'].drop(function(err) {
    if (err && err.message != 'ns not found') {
      winston.error('Error dropping user collections: ' + error)
      return false
    }

    bcrypt.genSalt(10, function (err, salt) {
      if (err) {
        winston.error('Error generating salt: ' + err)
        return false
      }

      bcrypt.hash('temp', salt, function (err, hash) {
        if (err) {
          winston.error('Error hashing: ' + err)
          return false
        }

        _superAdminUser = new _userModel({
          firstName: 'Super',
          lastName: 'Admin',
          password: hash,
          email: 'temp',
          role: 'superadmin'
        })
        _superAdminUser.save(function (err) {
          if (err) {
            winston.error('MongoDB: '.blue + ' Error creating new super admin user. '.white.bgRed + ' %s', err.toString())
            process.exit()
          } else {
            winston.info('Super-admin user saved.'.green)
            mongoose.connection.close(function () {
              winston.info('MongoDB connection closed ...'.blue)
              winston.info('Exiting. Civic Seed database bootstrapping OK!'.yellow)
              process.exit()
            })
          }
        })
      })
    })
  })
})
