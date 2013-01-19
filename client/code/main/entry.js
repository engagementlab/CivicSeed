var appInitialized,
	$html,
	$body,
	$container;

window.ss = require('socketstream');

// TODO: only do this in dev mode
ss.server.on('disconnect', function() { console.log('Lost connection to server...'); });
ss.server.on('reconnect', function() { console.log('Connection to server...'); });

ss.server.on('ready', function() {

	jQuery(function() {

		if(!appInitialized) {

			$html = $('html');
			$body = $(document.body);
			$container = $('#container');

			Davis(function() {

				var $app = this;

				require('/routes-middleware.js').loadMiddleware(ss, $app, $html, $body, $container);
				require('/routes-main').loadRoutes(ss, $app, $html, $body, $container);
				require('/routes-account').loadRoutes(ss, $app, $html, $body, $container);
				require('/routes-admin').loadRoutes(ss, $app, $html, $body, $container);
				require('/routes-profile').loadRoutes(ss, $app, $html, $body, $container);
				// should always be last
				require('/routes-errors').loadRoutes(ss, $app, $html, $body, $container);

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