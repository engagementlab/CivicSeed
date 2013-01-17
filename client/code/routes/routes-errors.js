var self = module.exports = {

	loadRoutes: function(ss, $app, $html, $body, $container) {

		// // FIXME: why won't this work???
		// // ALSO: see the _error-control.js file
		// $app.bind('routeNotFound', function(req) {
		// 	$container.append(JT['pages-404']());
		// });

		$app.get('/500', function(req) {
			$container.append(JT['pages-500']());
		});

		$app.get('/404', function(req) {
			$container.append(JT['pages-404']());
		});

		// bad temporary fix...
		// $app.get('/:anything', function(req) { Davis.location.replace('/404'); });
		$app.get('/:anything', function(req) { $container.append(JT['pages-404']({ badURL: req.fullPath })); });
		$app.get('/:anything/:anything', function(req) { $container.append(JT['pages-404']({ badURL: req.fullPath })); });
		$app.get('/:anything/:anything/:anything', function(req) { $container.append(JT['pages-404']({ badURL: req.fullPath })); });
		$app.get('/:anything/:anything/:anything/:anything', function(req) { $container.append(JT['pages-404']({ badURL: req.fullPath })); });
		$app.get('/:anything/:anything/:anything/:anything/:anything', function(req) { $container.append(JT['pages-404']({ badURL: req.fullPath })); });

	}

};