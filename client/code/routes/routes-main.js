// var app = Davis(function() {
// 	this.get('/admin/:name', function(req) {
// 		alert('Hello ' + req.params['name'])
// 	});
// });

// app.start();




// exports.send = function(text, cb) {
// 	if (valid(text)) {
// 		return ss.rpc('demo.sendMessage', text, cb);
// 	} else {
// 		return cb(false);
// 	}
// };

// var content = $('#content');

var self = module.exports = {

	loadRoutes: function(ss, $app, $html, $body, $container) {
		// if (valid(text)) {
		// 	return ss.rpc('demo.sendMessage', text, cb);
		// } else {
		// 	return cb(false);
		// }

		$app.get('/', function(req) {
			$container.append(JT['main-home']());
		});

		$app.get('/about', function(req) {
			$container.append(JT['main-about']());
		});

		$app.get('/contact', function(req) {
			$container.append(JT['main-contactus']());
		});

	}

};