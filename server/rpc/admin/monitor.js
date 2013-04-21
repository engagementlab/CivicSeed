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
			npcModel
				.where('isHolding').equals(true)
				.select('id resource.question level resource.questionType')
				.find(function(err, npcs) {
					res(err,npcs);
			});
		},

		getInstanceNames: function(id) {
			userModel
				.findById(id, function(err,data) {
					console.log(err,data);
					if(err) {
						res(err, false);
					} else {
						res(false, data.admin.instances);
					}
				});
		},

		getPlayers: function(instance) {
			userModel
				.where('game.instanceName').equals(instance)
				.select('firstName lastName id isPlaying profileUnlocked game.resourcesDiscovered game.resources game.playingTime')
				.find(function(err,data) {
					console.log(err,data);
					if(err) {
						res(err, false);
					} else {
						res(false, data);
					}
				});
		},

		getRecentChat: function(instance) {
			chatModel
				.where('instanceName').equals(instance)
				.limit(100)
				.sort('-when')
				.find(function(err,chat) {
					res(err,chat);
				});
		},

		getInstanceAnswers: function(instance) {
			gameModel
				.where('instanceName').equals(instance)
				.select('resourceResponses')
				.find(function(err,answers){
					res(err,answers[0]);
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