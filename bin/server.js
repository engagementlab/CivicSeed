#!/usr/bin/env node

// AppDynamics APM config
/*require("appdynamics").profile({
  controllerHostName: 'engagementlab.saas.appdynamics.com',
  controllerPort: 443,
  accountName: 'EngagementLab',
  accountAccessKey: 'rxfibl2fbqga',
  applicationName: 'Civic Seed',
  tierName: 'Production',
  nodeName: 'process' // The controller will automatically append the node name with a unique number
});*/

var rootDir = require('app-root-path')

var http = require('http')
var express = require('express')
var ss = require('socketstream')
var ssJade = require('ss-jade')
var ssStylus = require('ss-stylus')
var winston = require('winston')

var app = exports.app = express()

var config = require(rootDir + '/app/config')

var PORT = config.get('PORT')
var NODE_ENV = config.get('NODE_ENV')
var CLOUD_PATH = config.get('CLOUD_PATH')
var CLOUD_PATH_PATH = config.get('CLOUD_PATH_PATH')
var USE_REDIS = config.get('USE_REDIS')

var service = require(rootDir + '/app/service')
var controllers = require(rootDir + '/app/controllers')
var CivicSeed = require(rootDir + '/app/CivicSeed')

var server
var redisConfig

console.log('\n\n     ___      _               _                       ___                       _   '.red)
console.log('    / __|    (_)    __ __    (_)     __       '.red + 'o O O'.white + '  / __|    ___     ___    __| |  '.red)
console.log('   | (__     | |    \\ V /    | |    / _|     '.red + 'o'.white + '       \\__ \\   / -_)   / -_)  / _` |  '.red)
console.log('    \\___|   _|_|_   _\\_/_   _|_|_   \\__|_   '.red + 'TS__['.green + 'O'.white + ']'.green + '  |___/   \\___|   \\___|  \\__,_|  '.red)
console.log('  _'.white + '|"""""|'.green + '_'.white + '|"""""|'.green + '_'.white + '|"""""|'.green + '_'.white + '|"""""|'.green + '_'.white + '|"""""| {======|'.green + '_'.white + '|"""""|'.green + '_'.white + '|"""""|'.green + '_'.white + '|"""""|'.green + '_'.white + '|"""""| '.green)
console.log('  '.green + '"'.white + '`-'.green + '0'.white + '-'.green + '0'.white + '-\''.green + '"'.white + '`-'.green + '0'.white + '-'.green + '0'.white + '-\''.green + '"'.white + '`-'.green + '0'.white + '-'.green + '0'.white + '-\''.green + '"'.white + '`-'.green + '0'.white + '-'.green + '0'.white + '-\''.green + '"'.white + '`-'.green + '0'.white + '-'.green + '0'.white + '-\'./'.green + 'o--000'.white + '\''.green + '"'.white + '`-'.green + '0'.white + '-'.green + '0'.white + '-\''.green + '"'.white + '`-'.green + '0'.white + '-'.green + '0'.white + '-\''.green + '"'.white + '`-'.green + '0'.white + '-'.green + '0'.white + '-\''.green + '"'.white + '`-'.green + '0'.white + '-'.green + '0'.white + '-\' '.green)
console.log('\n\n')

// Setup database services, based on the config
service.connectMongoose(app, function (databases) {
  // ~ - ~ - ~ --- >>>
  // ~ - ~ - ~ --- >>> EXPRESS
  // ~ - ~ - ~ --- >>>

  winston.info('Configuring Express ...'.yellow)

  app.set('views', rootDir + '/client/views')
  app.set('view engine', 'jade')

  // Logger
  if (NODE_ENV === 'development') {
    app.use(express.logger('dev'))
  } else {
    app.use(express.logger('default'))
  }

  // app.use(app.router)
  // app.use(express.cookieParser());
  // app.use(express.session({secret: 'secret'}));
  // app.use(express.compiler({src: __dirname + '/wwwroot', enable: ['stylus']}));

  // ~ - ~ - ~ --- >>>
  // ~ - ~ - ~ --- >>> SOCKET STREAM
  // ~ - ~ - ~ --- >>>

  winston.info('Configuring SocketStream ... '.yellow)

  // Attach Winston logger to SS logger
  ss.api.log.info = winston.info
  ss.api.log.debug = winston.debug
  ss.api.log.error = winston.error
  ss.api.log.warn = winston.warn

  // Code formatters
  ss.client.formatters.add(ssJade, {
    locals: {
      CivicSeed: JSON.stringify(CivicSeed.getGlobals())
    }
  })
  ssStylus.prependStylus(
    '$cloudPath = \'' + CLOUD_PATH + '/\'\n' +
    '$cache = \'' + CivicSeed.get('CACHE') + '\''
  )
  ss.client.formatters.add(ssStylus)

  // Server-side compiled templates for client
  ss.client.templateEngine.use(require('ss-clientjade'), null, { globals: ['CivicSeed', 'sessionStorage'] })

  if (NODE_ENV === 'development') {
    service.getAndSetNetworkIp()
    app.locals.pretty = true
  }

  // Use Redis
  if (USE_REDIS) {
    winston.info('Configuring Redis service ...'.yellow)

    redisConfig = {
      host: config.get('REDIS_HOST'),
      port: config.get('REDIS_PORT'),
      pass: config.get('REDIS_PW')
    }

    ss.session.store.use('redis', redisConfig)
    ss.publish.transport.use('redis', redisConfig)
    // ss.session.options.maxAge = 1261440000000; // forty years --> default is 30 days
  } else {
    winston.warn('Redis service not connected.'.red)
  }

  // make the models accessible to Socket Stream
  ss.api.add('service', service)

  // connect mongoose to ss internal API
  ss.api.add('db', databases.mongooseDb)

  controllers.loadAll(app, service, function () {
    if (NODE_ENV === 'development') {
      app.use(express.errorHandler({ dumpExceptions: true, showStack: true }))

      // See: https://github.com/socketstream/ss-jade/pull/4
      // ss.client.formatters.add(ssJade, { prettyHTML: true });
      ssJade.addCompileOptions({ pretty: true })
    }

    if (NODE_ENV === 'testing' || NODE_ENV === 'production') {
      ss.client.packAssets({
        cdn: {
          js: function (file) { return CLOUD_PATH_PACK + file.path },
          css: function (file) { return CLOUD_PATH_PACK + file.path },
          html: function (file) { return CLOUD_PATH_PACK + file.path }
        }
      })
    }

    // ~ - ~ - ~ --- >>>
    // ~ - ~ - ~ --- >>> START THE APP
    // ~ - ~ - ~ --- >>>
    server = app.listen(PORT, '0.0.0.0', function () {
      var local = server.address()
      winston.info('Express server listening @ http://%s:%d/ in '.magenta + '%s'.yellow.inverse + ' mode'.magenta, local.address, local.port, app.settings.env)

      // Start SocketStream
      ss.start(server)

      // Append SocketStream middleware to the stack
      app.stack = ss.http.middleware.stack.concat(app.stack)

    })

  })
})
