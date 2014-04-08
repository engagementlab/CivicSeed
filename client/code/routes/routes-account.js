var self = module.exports = {

	loadRoutes: function($app) {

		$app.get('/remind-me', function (req) {
			$CONTAINER.append(JT['pages-remindme']());
		});
		$app.get('/change-info', function (req) {
			$CONTAINER.append(JT['pages-changeinfo']());
		});

    /*
    // This route is specified in the navigation dropdown of the user
    // But is handled by shared/account.js
    $app.get('/signout', function (req) {
      //
    });
    */
	}

};
