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
passportConfig,
nodeEnv = app.get('env');

console.log('\n\n < < < = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = > > > '.green);
console.log(' < < < = = = = = = = = = = = =   Starting the Civic Seed Game Engine   = = = = = = = = = = = = > > > '.green.inverse);
console.log(' < < < = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = > > > '.green);

// Configuration and environmental files, etc.
service = require('./service.js');

// Setup database services, based on the config
service.connectMongoose(app, function(databases) {

	var hbsHelpers = service.useModule('middleware/hbs-helpers');

	app.configure(function() {

		var redisConfig, controllers;

		console.log('\n\n   * * * * * * * * * * * *   Configuring Civic Seed   * * * * * * * * * * * *   \n\n'.yellow)

		// SOCKET STREAM

		// Code Formatters
		ss.client.formatters.add(require('ss-stylus'));

		// Server-side compiled templates for client
		ss.client.templateEngine.use(require('ss-hogan'));

		// use redis
		if(config.get('USE_REDIS')) {
			redisConfig = {
				host: config.get('REDIS_HOST'),
				port: config.get('REDIS_PORT'),
				pass: config.get('REDIS_PW'),
				db: config.get('REDIS_DB')
			};
			ss.session.store.use('redis', redisConfig);
			ss.publish.transport.use('redis', redisConfig);
		}

		// connect mongoose to ss internal API
		ss.api.add('db', databases.mongooseDb);

		// make the models accessible to Socket Stream
		ss.api.add('service', service);

		controllers = require('./controllers.js')(app, service);

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

// 		// ...LOAD MIDDLEWARE...
// 		var rootDir = process.cwd();
// 		var middleware = {
// 			user: require(rootDir + '/server/middleware/account/user'),
// 		};
// 		// var temply1 = middleware.user.authenticated;
// 		// var temply2 = middleware.user.authenticated();
// 		// console.log(temply1, temply2);
// 		app.use(middleware.user.authenticated('express'));

// // app.use(function(req, res, next){
// //   console.log('%s %s', req.method, req.url);
// //   next();
// // });


		console.log('CS: Config: Default configurations set up.'.blue)
	});

	if(nodeEnv === 'development') {
		// FOR SOME REASON, PACKING ASSETS BREAKS...NEED TO FIGURE THIS OUT...or...just use resource loading tools?
		// ss.client.packAssets();
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
		console.log('CS: Config: Running in '.blue + nodeEnv + ' mode.'.blue);
	}

	if(nodeEnv === 'testing' || nodeEnv === 'production') {
		ss.client.packAssets();
		// var oneYear = 31557600000;
		// app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
		// app.use(express.errorHandler()); 
		console.log('CS: Config: Running in '.blue + nodeEnv + ' mode.'.blue);
	}

	//passportConfig = require('./passportconfig.js')(app, service);

	// Start web server
	server = app.listen(process.env['app_port'] || 3000, function() {
		var local = server.address();
		console.log('Express server listening @ http://%s:%d/ in %s mode', local.address, local.port, app.settings.env);
	});

	// Start SocketStream
	ss.start(server);

	// Append SocketStream middleware to the stack
	app.stack = app.stack.concat(ss.http.middleware.stack);

});