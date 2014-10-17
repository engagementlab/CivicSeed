#!/usr/bin/env node

var rootDir     = process.cwd() || '.'

var ss          = require('socketstream'),
    express     = require('express'),
    ssJade      = require('ss-jade'),
    ssStylus    = require('ss-stylus')

var app         = exports.app = express()

var config      = require(rootDir + '/config')

var PORT        = config.get('PORT'),
    NODE_ENV    = config.get('NODE_ENV'),
    CLOUD_PATH  = config.get('CLOUD_PATH'),
    USE_REDIS   = config.get('USE_REDIS')

var service     = require(rootDir + '/service'),
    controllers = require(rootDir + '/controllers'),
    CivicSeed   = require(rootDir + '/CivicSeed')

var server,
    redisConfig

console.log('\n\n     ___      _               _                       ___                       _   '.red);
console.log('    / __|    (_)    __ __    (_)     __       '.red + 'o O O'.white + '  / __|    ___     ___    __| |  '.red);
console.log('   | (__     | |    \\ V /    | |    / _|     '.red + 'o'.white + '       \\__ \\   / -_)   / -_)  / _` |  '.red);
console.log('    \\___|   _|_|_   _\\_/_   _|_|_   \\__|_   '.red + 'TS__['.green + 'O'.white + ']'.green + '  |___/   \\___|   \\___|  \\__,_|  '.red);
console.log('  _'.white + '|"""""|'.green + '_'.white + '|"""""|'.green + '_'.white + '|"""""|'.green + '_'.white + '|"""""|'.green + '_'.white + '|"""""| {======|'.green + '_'.white + '|"""""|'.green + '_'.white + '|"""""|'.green + '_'.white + '|"""""|'.green + '_'.white + '|"""""| '.green);
console.log('  '.green + '"'.white + '`-'.green + '0'.white + '-'.green + '0'.white + '-\''.green + '"'.white + '`-'.green + '0'.white + '-'.green + '0'.white + '-\''.green + '"'.white + '`-'.green + '0'.white + '-'.green + '0'.white + '-\''.green + '"'.white + '`-'.green + '0'.white + '-'.green + '0'.white + '-\''.green + '"'.white + '`-'.green + '0'.white + '-'.green + '0'.white + '-\'./'.green + 'o--000'.white + '\''.green + '"'.white + '`-'.green + '0'.white + '-'.green + '0'.white + '-\''.green + '"'.white + '`-'.green + '0'.white + '-'.green + '0'.white + '-\''.green + '"'.white + '`-'.green + '0'.white + '-'.green + '0'.white + '-\''.green + '"'.white + '`-'.green + '0'.white + '-'.green + '0'.white + '-\' '.green);

// Setup database services, based on the config
service.connectMongoose(app, function(databases) {

	// ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ --- >>>
	// ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ --- >>> EXPRESS
	// ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ --- >>>

	console.log('   * * * * * * * * * * * *   Configuring Express   * * * * * * * * * * * *   '.yellow);

	app.set('views', rootDir + '/client/views');
	app.set('view engine', 'jade');

  // Logger
  if (NODE_ENV === 'development') {
    app.use(express.logger('dev'))
  } else {
    app.use(express.logger('default'))
  }

	// app.use(express.bodyParser());
	// app.use(express.methodOverride());
	app.use(app.router);
	// app.use(express.cookieParser());
	// app.use(express.session({secret: 'secret'}));
	// app.use(express.compiler({src: __dirname + '/wwwroot', enable: ['stylus']}));

	// ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ --- >>>
	// ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ --- >>> SOCKET STREAM
	// ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ --- >>>

	console.log('   * * * * * * * * * * * *   Configuring SocketStream   * * * * * * * * * * * *   '.yellow);

	// Code Formatters
	ss.client.formatters.add(ssJade, {
		locals: {
			CivicSeed: JSON.stringify(CivicSeed.getGlobals())
		}
	});
	ssStylus.prependStylus(
		'$cloudPath = \'' + CLOUD_PATH + '/\'\n' +
		'$cache = \'' + CivicSeed.get('CACHE') + '\''
	);
	ss.client.formatters.add(ssStylus);

	// Server-side compiled templates for client
	ss.client.templateEngine.use(require('ss-clientjade'),null,{ globals: ['CivicSeed', 'sessionStorage'] });

	if (NODE_ENV === 'development') {
		service.getAndSetNetworkIp();
		app.locals.pretty = true;
	}

	// use redis
	if (USE_REDIS) {
		console.log('   * * * * * * * * * * * *   Configuring REDIS DB Service   * * * * * * * * * * * *   '.yellow);
		redisConfig = {
			host: config.get('REDIS_HOST'),
			port: config.get('REDIS_PORT'),
			pass: config.get('REDIS_PW')
		};
		ss.session.store.use('redis', redisConfig);
		ss.publish.transport.use('redis', redisConfig);
		// ss.session.options.maxAge = 1261440000000; // forty years --> default is 30 days
	} else {
		console.log('   * * * * * * * * * * * *   REDIS Service Not Connected   * * * * * * * * * * * *   '.red);
	}

	// make the models accessible to Socket Stream
	ss.api.add('service', service);

	// connect mongoose to ss internal API
	ss.api.add('db', databases.mongooseDb);

	controllers.loadAll(app, service, function() {

		if (NODE_ENV === 'development') {
			app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
			// See: https://github.com/socketstream/ss-jade/pull/4
			// ss.client.formatters.add(ssJade, { prettyHTML: true });
			ssJade.addCompileOptions({ pretty: true });
		}

		if (NODE_ENV === 'testing' || NODE_ENV === 'production') {
			ss.client.packAssets({
				cdn: {
					js: function(file) { return CLOUD_PATH + file.path; },
					css: function(file) { return CLOUD_PATH + file.path; },
					html: function(file) { return CLOUD_PATH + file.path; }
				}
			});
		}

		// ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ --- >>>
		// ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ --- >>> START THE APP
		// ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ - ~ --- >>>

		server = app.listen(PORT, function() {

			var local = server.address();
			console.log('   * * * * * * * * * * * *   Express server listening @ http://%s:%d/ in ' + '%s'.yellow.inverse + ' mode\n\n', local.address, local.port, app.settings.env);

			// Start SocketStream
			ss.start(server);

			// Append SocketStream middleware to the stack
			app.stack = ss.http.middleware.stack.concat(app.stack);

		});

	});

});