window.ss = require('socketstream');
var appInitialized = false;

// TODO: only do this in dev mode
ss.server.on('disconnect', function() { console.log('Lost connection to server...'); });
ss.server.on('reconnect', function() { console.log('Connection to server...'); });

ss.server.on('ready', function() {

	jQuery(function() {

		if(!appInitialized) {

			Davis(function() {

				var $app = this;

				require('/routes-middleware.js').loadMiddleware(ss, $app);
				require('/main-routes').loadRoutes(ss, $app);
				require('/admin-routes').loadRoutes(ss, $app);
				require('/profile-routes').loadRoutes(ss, $app);
				// require('/game-routes').loadRoutes(ss, $app);

				$app.configure(function(config) {
					// config.linkSelector = 'a.davis';
					// config.formSelector = 'form.davis';
					// config.throwErrors = true;
					// config.handleRouteNotFound = false;
					config.generateRequestOnPageLoad = true;
				});

				$app.start();

			});

			var $account = require('/account');
			$account.accountHandlers();

			appInitialized = true;

		}

	});

});