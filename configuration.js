var passport = require('passport'),
// consolidate = require('consolidate'),
// hulk = require('hulk-hogan'),
hbs = require('hbs'),
flash = require('connect-flash'),
fs = require('fs'),
blocks = {};
// _ = require('underscore')._; // this odd little ditty is the "underscore" library


//configuration module 
//All express and connect configuration must there
module.exports = function(app, express, ss, env) {

	console.log(env);

	app.configure(function() {
		console.log('\n\n   * * * * * * * * * * * *   Configuring Civic Seed   * * * * * * * * * * * *   \n\n'.yellow)

		// SOCKET STREAM
		// Code Formatters
		ss.client.formatters.add(require('ss-less'));

		// // use redis
		// ss.session.store.use('redis');
		// ss.publish.transport.use('redis');

		// // Use server-side compiled Hogan (Mustache) templates. Others engines available
		// ss.client.templateEngine.use(require('ss-hogan'));

		// Define a single-page client
		ss.client.define('main', {
			view: 'game.html',
			css: 'game.less',
			code: [
				'libs/jquery-1.7.2.min.js',
				'libs/angular-1.0.1.min.js',
				'libs/ssAngular.js',
				'game/controllers.js',
				'game/entry.js',
				'game/app.js'
			],
			tmpl: '*'
		});


		//Partials working?
  		headerTemplate = fs.readFileSync(__dirname + '/client/views/header.hbs', 'utf8');
  		hbs.registerPartial('headPartial', headerTemplate); 

		// EXPRESS
		app.set('views', __dirname + '/client/views');
		app.set('view engine', 'hbs');
		hbs.registerHelper('extend', function(name, context) {
			var block = blocks[name];
			if(!block) {
				block = blocks[name] = [];
			}
			block.push(context(this));
		});
		hbs.registerHelper('block', function(name) {
			var val = (blocks[name] || []).join('\n');
			blocks[name] = [];
			return val;
		});
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
		console.log('CS: Config: Running in '.blue + env.app.nodeEnv + ' mode.'.blue);
	});

	// testing config
	// runner: 'NODE_ENV=testing nodemon app.js'
	app.configure('testing', function() {
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
		console.log('CS: Config: Running in '.blue + env.app.nodeEnv + ' mode.'.blue);
	});

	// staging config ???DO WE EVEN NEED A STAGING ENVIRONMENT???
	// runner: 'NODE_ENV=staging node app.js'
	app.configure('staging', function() {
		ss.client.packAssets();
		console.log('CS: Config: Running in '.blue + env.app.nodeEnv + ' mode.'.blue);
	});

	// live config
	// runner: 'NODE_ENV=production node app.js'
	app.configure('production', function() {
		ss.client.packAssets();
		// var oneYear = 31557600000;
		// app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
		// app.use(express.errorHandler()); 
		console.log('CS: Config: Running in '.blue + env.app.nodeEnv + ' mode.'.blue);
	});


};