var container = $('#container');

var self = module.exports = {

	loadRoutes: function(ss, $app) {

		var $body = $(document.body);
		var tmplEngine = ss.tmpl;

		$app.get('/admin/startup', function(req) {

			container.empty().append(tmplEngine['partials-navigation'].render());
			container.append(tmplEngine['admin-startup'].render({
				title: 'Startup',
				bodyClass: 'admin startup',
				nodeEnv: 'nodeEnv',
				// consoleOutput: consoleOutput,
				message: 'Startup admin panel.'
			}));
			$('title').text('{ ::: Civic Seed - Admin Panel - Startup ::: }');
			$body.attr('class', 'adminPage startupPage');

			require('./admin').init();

		});

	}

};