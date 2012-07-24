module.exports = function (app, service) {
	var NotFound = service.useModule('utils/errors').NotFound;

	app.error(function(err, req, res, next) {
		if (err instanceof NotFound) {
			res.render('404.jade', { status: 404 });
		} else {
			next(err);
		}
	});

	app.error(function(err, req, res) {
		res.render('500.jade', { status: 500, error: err });
	});
};