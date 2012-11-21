var self = module.exports = {

	init: function(app, service, hbs) {

		// // error handling middleware, needs to come LAST
		// // https://github.com/visionmedia/express/wiki/Migrating-from-2.x-to-3.x
		// // http://expressjs.com/guide.html#error-handling
		// app.use(function(req, res, next) {
		// 	res.status(404);

		// 	// respond with html page
		// 	if(req.accepts('html')) {
		// 		res.render('404.hbs', {
		// 			title: '404',
		// 			bodyClass: '404',
		// 			url: req.url,
		// 		});
		// 		return;
		// 	}

		// 	// respond with json
		// 	if(req.accepts('json')) {
		// 		res.send({ error: '!json' });
		// 		return;
		// 	}

		// 	// default to plain-text. send()
		// 	res.type('txt').send('404\'d!');

		// });
	}

};



// var sys = require('sys');

// function NotFound(msg) {
// 	this.name = 'NotFound';
// 	Error.call(this, msg);
// 	Error.captureStackTrace(this, arguments.callee);
// }

// sys.inherits(NotFound, Error);

// module.exports.NotFound = NotFound;