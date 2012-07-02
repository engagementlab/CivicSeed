

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
	ss.client.formatters.add(require('ss-stylus'));

	// ss.client.templateEngine.use('angular');
	ss.client.templateEngine.use(require('ss-hogan'));



// 	app.configure(function() {
// 		app.set('views', __dirname + '/views');
// 		// app.set('view options', {layout: false});
// 		// app.set('view engine', 'handlebars');
// 		app.engine('.html', consolidate.handlebars);
// 		app.use(express.logger(':method :url :status'));
// 		app.use(express.bodyParser());
// 		app.use(express.methodOverride());
// 		app.use(express.cookieParser());
// 		// app.use(express.session({secret: 'secret'}));
// 		// app.use(express.compiler({src: __dirname + '/wwwroot', enable: ['stylus']}));
// 		app.use(app.router);
// 		app.use(express.static(__dirname + '/wwwroot'));
// 	});

// 	// dev config
// 	app.configure('development', function() {
// 		app.use(express.errorHandler({dumpExceptions: true, showStack: true})); 
// 		// // app.use(express.static(__dirname + '/public'));
// 		// app.use(express.logger({ format: ':method :url' }));
// 		// app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
// 	});

// 	// staging config (do we even want this?)
// 	app.configure('staging', function() {
// 	});

// 	// live config
// 	app.configure('production', function() {
// 		app.use(express.errorHandler()); 
// 		// // var oneYear = 31557600000;
// 		// // app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
// 		// app.use(express.errorHandler());
// 	});

};