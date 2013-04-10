var service, gameModel, npcModel, chatModel, userModel;

var monitorHelpers = null;

// Define actions which can be called from the client using ss.rpc('demo.ACTIONNAME', param1, param2...)
exports.actions = function(req, res, ss) {

	req.use('session');
	// req.use('debug');

	return {

		init: function(id) {
			service = ss.service;
			console.log('rpc.admin.initAdmin');
			gameModel = service.useModel('game', 'ss');
			npcModel = service.useModel('npc', 'ss');
			chatModel = service.useModel('chat', 'ss');
			userModel = service.useModel('user', 'ss');
			// userModel.findById(id, function(err, user) {
			// 	if(err) {
			// 		res('huh?');
			// 	} else if(user) {
			// 		if(user.admin.instances) {
			// 			monitorHelpers.getInstances(user.admin.instances, function(games) {
			// 				res(games);
			// 			});
			// 		} else {
			// 			res('what?');
			// 		}
			// 	}
			// });
			res(true);
		},
		getGameInstance: function(name) {
			gameModel
				.where('instanceName').equals(name)
				.find(function(err, game) {
					if(err) {

					} else if(game) {
						res(game[0]);
					}
				});
		}
	};

};

monitorHelpers = {

	getInstances: function(instances, callback) {
		console.log(instances);
		var numInstances = instances.length,
			cur = 0,
			allInstances = [];
		var getNext = function() {
			monitorHelpers.getInstanceData(instances[cur], function(result) {
				allInstances.push(result);
				cur++;
				if(cur < numInstances) {
					getNext();
				}
				else {
					callback(allInstances);
				}
			});
		};
		getNext();
	},
	getInstanceData: function(instance) {
		gameModel
			.where('instanceName').equals(instance)
			.find(function(err,result) {
				if(err) {

				} else {
					return result[0];
				}
			});
	}
};