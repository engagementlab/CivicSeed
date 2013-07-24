var self = module.exports = {

	loadRoutes: function($app) {

		require('/admin').init();
		var npcs = require('/npcs');
		npcs.init();

		$app.get('/admin', function(req) {
			$CONTAINER.append(JT['admin-panel']({
				message: 'User admin panel.'
			}));
			$('title').text('{ ::: Civic Seed - Admin Panel ::: }');
			$BODY.attr('class', 'adminPage');
		});

		$app.get('/admin/startup', function(req) {
			$CONTAINER.append(JT['admin-startup']({
				title: 'Startup',
				bodyClass: 'admin startup',
				nodeEnv: 'nodeEnv',
				// consoleOutput: consoleOutput,
				message: 'Startup admin panel.'
			}));
			$('title').text('{ ::: Civic Seed - Admin Panel - Startup ::: }');
			$BODY.attr('class', 'adminPage startupPage');
		});

		$app.get('/admin/monitor', function(req) {
			ss.rpc('admin.monitor.getInstanceNames', sessionStorage.userId, function(err, info) {
				$CONTAINER.append(JT['admin-monitor']({instances: info}));
				$('title').text('{ ::: Civic Seed - Admin Panel - Monitor ::: }');
				$BODY.attr('class', 'adminPage');
			});
		});

		$app.get('/admin/npcs', function(req) {
			ss.rpc('admin.npcs.init', sessionStorage.userId, function(result) {
				if(result) {
					//modify results for data output
					for(var r = 0; r < result.length; r++) {
						var x = result[r].index % 142;
						var y = Math.floor(result[r].index / 142);
						result[r].x = x;
						result[r].y = y;
					}
					console.log(result);
					$CONTAINER.append(JT['admin-npcs']({npcs: result}));
					$('title').text('{ ::: Civic Seed - NPC Panel - Monitor ::: }');
					$BODY.attr('class', 'npcsPage');
					npcs.addSprites();
				} else {
					console.log('error');
				}
			});
		});

		$app.get('/admin/invitecodes', function(req) {
			$CONTAINER.append(JT['admin-invitecodes']({
				title: 'Startup',
				bodyClass: 'admin startup',
				nodeEnv: 'nodeEnv',
				// consoleOutput: consoleOutput,
				message: 'Startup admin panel.'
			}));
		});

	}

};