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

	loadRoutes: function(ss, $app) {
		// if (valid(text)) {
		// 	return ss.rpc('demo.sendMessage', text, cb);
		// } else {
		// 	return cb(false);
		// }

		var $body = $(document.body);
		var tmplEngine = ss.tmpl;

		$app.get('/', function(req) {

			$('#container').empty().append(tmplEngine['partials-navigation'].render());
			$('#container').append(tmplEngine['main-home'].render());

		});

		$app.bind('routeNotFound', function (req) {
			console.log('404');
		});

	}

};