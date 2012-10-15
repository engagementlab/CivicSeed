var ss = require('socketstream'),
express = require('express'),
app = module.exports = express(),
config = require('./config'),
passport = require('passport'),
flash = require('connect-flash'),
// hbs = require('hbs'),
// fs = require('fs'),
server,
service,
passportConfig;

console.log('\n\n < < < = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = > > > '.green);
console.log(' < < < = = = = = = = = = = = =   Starting the Civic Seed Game Engine   = = = = = = = = = = = = > > > '.green.inverse);
console.log(' < < < = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = > > > '.green);

// Configuration and environmental files, etc.
service = require('./service.js');

// Setup database services, based on the config
service.init(function(databases) {

	var control = require('./controllers.js')(app, service);
	var hbsHelpers = service.useModule('middleware/hbs-helpers');

	app.configure(function() {

		var redisConfig;

		console.log('\n\n   * * * * * * * * * * * *   Configuring Civic Seed   * * * * * * * * * * * *   \n\n'.yellow)

		// SOCKET STREAM

		// Code Formatters
		ss.client.formatters.add(require('ss-stylus'));

		// use redis
		if(config.get('useRedis')) {
			redisConfig = {
				host: config.get('redisHost'),
				port: config.get('redisPort'),
				pass: config.get('redisPw'),
				db: config.get('redisDb')
			};
			ss.session.store.use('redis', redisConfig);
			ss.publish.transport.use('redis', redisConfig);
		}

		// connect mongoose to ss internal API
		ss.api.add('db', databases.mongooseDb);

		// make the models accessible to Socket Stream
		ss.api.add('service', service);

		// Define a single-page client
		ss.client.define('main', {
			view: 'game.html',
			css: 'game.stylus',
			code: [
				'libs/jquery-1.7.2.min.js',
				'libs/bootstrap.min.js',
				'game/entry.js',
				'game/controllers.js',
				'game/map-control.js',
				'game/npc-control.js',
				'game/chat-control.js',
			],
			tmpl: '*'
		});

		// //Partials working?
		// headerTemplate = fs.readFileSync(__dirname + '/client/views/header.hbs', 'utf8');
		// hbs.registerPartial('headPartial', headerTemplate); 

		// EXPRESS

		app.set('views', __dirname + '/client/views');
		app.set('view engine', 'hbs');
		hbsHelpers.init();
		// app.set('view engine', 'html');
		// app.engine('html', require('hbs').__express);
		app.use(express.logger(':method :url :status'));
		app.use(express.bodyParser());
		app.use(express.methodOverride());
		// app.use(express.cookieParser());
		// app.use(express.session({secret: 'secret'}));
		// app.use(express.compiler({src: __dirname + '/wwwroot', enable: ['stylus']}));
		app.use(flash());
		app.use(passport.initialize());
    	app.use(passport.session());

		console.log('CS: Config: Default configurations set up.'.blue)
	});

	// development config
	// runner: 'NODE_ENV=development nodemon app.js' or just 'nodemon app.js'
	app.configure('development', function() {
		// FOR SOME REASON, PACKING ASSETS BREAKS...NEED TO FIGURE THIS OUT...or...just use resource loading tools?
		// ss.client.packAssets();
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
		console.log('CS: Config: Running in '.blue + config.get('nodeEnv') + ' mode.'.blue);
	});

	// testing config
	// runner: 'NODE_ENV=testing nodemon app.js'
	app.configure('testing', function() {
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
		console.log('CS: Config: Running in '.blue + config.get('nodeEnv') + ' mode.'.blue);
	});

	// staging config ???DO WE EVEN NEED A STAGING ENVIRONMENT???
	// runner: 'NODE_ENV=staging node app.js'
	app.configure('staging', function() {
		ss.client.packAssets();
		console.log('CS: Config: Running in '.blue + config.get('nodeEnv') + ' mode.'.blue);
	});

	// live config
	// runner: 'NODE_ENV=production node app.js'
	app.configure('production', function() {
		ss.client.packAssets();
		// var oneYear = 31557600000;
		// app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
		// app.use(express.errorHandler()); 
		console.log('CS: Config: Running in '.blue + config.get('nodeEnv') + ' mode.'.blue);
	});

	//passportConfig = require('./passportconfig.js')(app, service);

	// Start web server
	server = app.listen(process.env['app_port'] || 3000, function() {
		var local = server.address();
		console.log("Express server listening @ http://%s:%d/ in %s mode", local.address, local.port, app.settings.env);
	});

	// Start SocketStream
	ss.start(server);

	// Append SocketStream middleware to the stack
	app.stack = app.stack.concat(ss.http.middleware.stack);

});