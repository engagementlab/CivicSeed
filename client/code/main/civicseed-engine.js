var self = module.exports = {

	init: function() {


		if(!CivicSeed.initialized) {

			// self.registerModulesAndGlobals();
			window.$HTML = $('html');
			window.$BODY = $(document.body);
			window.$CONTAINER = $('#container');

			self.setupRouter();

			var $account = require('/account');
			$account.accountHandlers();

			CivicSeed.initialized = true;

		}

	},

	setupRouter: function() {

		var $app;

		Davis(function() {

			$app = this;

			require('/routes-middleware.js').loadMiddleware($app);
			require('/routes-main').loadRoutes($app);
			require('/routes-account').loadRoutes($app);
			require('/routes-admin').loadRoutes($app);
			require('/routes-profile').loadRoutes($app);
			// should always be last
			require('/routes-errors').loadRoutes($app);

			$app.configure(function(config) {
				// config.linkSelector = 'a.davis';
				// config.formSelector = 'form.davis';
				// config.throwErrors = true;
				// config.handleRouteNotFound = false;
				config.generateRequestOnPageLoad = true;
			});

			$app.start();

		});

		require('/routes-middleware.js').loadMiddleware($app);
		require('/routes-main').loadRoutes($app);
		require('/routes-account').loadRoutes($app);
		require('/routes-admin').loadRoutes($app);
		require('/routes-profile').loadRoutes($app);
		// should always be last
		require('/routes-errors').loadRoutes($app);

		// config.generateRequestOnPageLoad = true;

	}

};