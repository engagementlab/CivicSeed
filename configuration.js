

// var consolidate = require('consolidate'),
// // hulk = require('hulk-hogan'),
// handlebars = require('handlebars'),
// // routes = require('./routes'),
// // app = module.exports = express(),
// _ = require('underscore')._; // this odd little ditty is the "underscore" library


//configuration module 
//All express and connect configuration must there
module.exports = function(app, express, ss) {

	// Code Formatters
	ss.client.formatters.add(require('ss-less'));

	// // ss.client.templateEngine.use('angular');
	// ss.client.templateEngine.use(require('ss-hogan'));

	app.configure(function() {
		// app.set('views', __dirname + '/views');
		// // app.set('view options', {layout: false});
		// // app.set('view engine', 'handlebars');
		// app.engine('.html', consolidate.handlebars);
		// app.use(express.logger(':method :url :status'));
		// app.use(express.bodyParser());
		// app.use(express.methodOverride());
		// app.use(express.cookieParser());
		// // app.use(express.session({secret: 'secret'}));
		// // app.use(express.compiler({src: __dirname + '/wwwroot', enable: ['stylus']}));
		// app.use(app.router);
		// app.use(express.static(__dirname + '/wwwroot'));
		console.log('\n\n   * * * * * * * * * * * *   Configuring Civic Seed   * * * * * * * * * * * *   \n\n'.yellow)
		console.log('CS: Config: Default configurations set up.'.blue)
	});

	// local config
	// runner: 'NODE_ENV=local nodemon app.js'
	app.configure('local', function() {
		// app.use(express.errorHandler({dumpExceptions: true, showStack: true})); 
		// // // app.use(express.static(__dirname + '/public'));
		// // app.use(express.logger({ format: ':method :url' }));
		// // app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
		console.log('CS: Config: Running in '.blue + process.env.NODE_ENV + ' mode.'.blue);
	});

	// testing config
	// runner: 'NODE_ENV=testing nodemon app.js'
	app.configure('testing', function() {

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
		// app.use(express.errorHandler()); 
		// // // var oneYear = 31557600000;
		// // // app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
		// // app.use(express.errorHandler());
		console.log('CS: Config: Running in '.blue + process.env.NODE_ENV + ' mode.'.blue);
	});


};