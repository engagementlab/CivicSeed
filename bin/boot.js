var rootDir     = process.cwd()

var fs          = require('fs'),
    nconf       = require('nconf'),
    env         = require('node-env-file'),
    colors      = require('colors'),
    bcrypt      = require('bcrypt'),
    mongoose    = require('mongoose'),
    winston     = require('winston')

winston.info('Bootstrapping MongoDB for Civic Seed first-run ...'.red)

// Read environment variables from an optional .env, if present
var envFile = rootDir + '/.env'
if (fs.existsSync(envFile)) {
  winston.info('.env found. Loading ...'.red)
  env(envFile, {verbose: false, overwrite: true})
}

var NODE_ENV    = process.env.NODE_ENV || 'development',
    CONFIG_FILE = rootDir + '/config/' + NODE_ENV + '.json'

nconf.argv().env().file({
  file: CONFIG_FILE
})

if (NODE_ENV === 'heroku') {
  winston.info('Environment: '.blue + 'Heroku environment'.magenta)
  nconf.set('MONGO_URL', process.env.MONGOHQ_URL)
}

var accountHelpers = require(rootDir + '/server/utils/account-helpers')

var _db,
    _userModel,
    _superAdminUser

_db = mongoose.createConnection(nconf.get('MONGO_URL'))
_db.on('error', function (err) {
  winston.error('MongoDB: '.blue + ' %s '.white.bgRed, err.toString())
})
_db.once('open', function () {
  winston.info('MongoDB connection opened ...'.blue)
  _userModel = require(rootDir + '/models/user-model')(_db, mongoose.Schema)
  _db.collections['users'].drop(function (error) {
    bcrypt.genSalt(10, function (err, salt) {
      bcrypt.hash('temp', salt, function (err, hash) {
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
