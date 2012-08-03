var passport = require('passport'),
// consolidate = require('consolidate'),
// hulk = require('hulk-hogan'),
hbs = require('hbs'),
flash = require('connect-flash'),
blocks = {};
// _ = require('underscore')._; // this odd little ditty is the "underscore" library


//configuration module 
//All express and connect configuration must there
module.exports = function(app, express, ss) {

	app.configure(function() {
		console.log('\n\n   * * * * * * * * * * * *   Configuring Civic Seed   * * * * * * * * * * * *   \n\n'.yellow)
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

	// local config
	// runner: 'NODE_ENV=local nodemon app.js'
	app.configure('local', function() {
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
		console.log('CS: Config: Running in '.blue + process.env.NODE_ENV + ' mode.'.blue);
	});

	// testing config
	// runner: 'NODE_ENV=testing nodemon app.js'
	app.configure('testing', function() {
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
		console.log('CS: Config: Running in '.blue + process.env.NODE_ENV + ' mode.'.blue);
	});

	// staging config ???DO WE EVEN NEED A STAGING ENVIRONMENT???
	// runner: 'NODE_ENV=staging node app.js'
	app.configure('staging', function() {
		console.log('CS: Config: Running in '.blue + process.env.NODE_ENV + ' mode.'.blue);
	});

	// live config
	// runner: 'NODE_ENV=production node app.js'
	app.configure('production', function() {
		// var oneYear = 31557600000;
		// app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
		// app.use(express.errorHandler()); 
		console.log('CS: Config: Running in '.blue + process.env.NODE_ENV + ' mode.'.blue);
	});


};