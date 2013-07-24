var self = module.exports = {

	loadRoutes: function($app) {

		// // FIXME: why won't this work???
		// // ALSO: see the _error-control.js file
		// $app.bind('routeNotFound', function(req) {
		// 	$CONTAINER.append(JT['pages-404']());
		// });

		$app.get('/500', function(req) {
			$CONTAINER.append(JT['pages-500']());
		});

		$app.get('/404', function(req) {
			$CONTAINER.append(JT['pages-404']());
		});

		// bad temporary fix...
		// $app.get('/:anything', function(req) { Davis.location.replace('/404'); });
		$app.get('/:anything', function(req) { $CONTAINER.append(JT['pages-404']({ badURL: req.fullPath })); });
		$app.get('/:anything/:anything', function(req) { $CONTAINER.append(JT['pages-404']({ badURL: req.fullPath })); });
		$app.get('/:anything/:anything/:anything', function(req) { $CONTAINER.append(JT['pages-404']({ badURL: req.fullPath })); });
		$app.get('/:anything/:anything/:anything/:anything', function(req) { $CONTAINER.append(JT['pages-404']({ badURL: req.fullPath })); });
		$app.get('/:anything/:anything/:anything/:anything/:anything', function(req) { $CONTAINER.append(JT['pages-404']({ badURL: req.fullPath })); });

	}

};