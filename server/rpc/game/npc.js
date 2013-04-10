var self = exports.actions = function(req, res, ss) {

	req.use('session');
	// req.use('debug');
	// req.use('account.user.authenticated');

	var service = ss.service;
	var UserModel = service.useModel('user', 'ss');
	var NpcModel = service.useModel('npc', 'ss');
	var GnomeModel = service.useModel('gnome', 'ss');
	//var ResourceModel = service.useModel('resource', 'ss');
	var GameModel = service.useModel('game', 'ss');

	return {

		init: function() {
			res(true); // successful
		},

		getNpcById: function(npcId) {
			NpcModel.find({ id: npcId }, function (err, npc) {
				if(err) {
					console.error('  Could not find NPC: %s  '.red.inverse, err);
				} else {
					res(npc);
				}
			});
		},

		getNpcs: function() {
			NpcModel.find(function (err, npcs) {
				if(err) {
					console.error('  Could not find NPCs: %s  '.red.inverse, err);
				} else {
					res(npcs);
				}
			});
		},

		movePlayer: function() {
			res('I\'ve moved around a bit...');
		},

		getDialog: function() {
			res(['I\'m saying one thing', 'Here\'s another thing I say.', 'Boy, I\'m just full of things to say!']);
		},

		getResources: function() {
			// ResourceModel.find(function (err, resources) {
			// 	if(err) {
			// 		console.error('  Could not find resources: %s  '.red.inverse, err);
			// 	} else {
			// 		res(resources);
			// 	}
			// });
		},

		saveResponse: function(data) {
			GameModel.where('instanceName').equals(data.instanceName)
				.find(function (err, game) {
				if(err) {
					console.error('  Could not find resource', err);
				} else if(game) {
					var answer = {
						npc: data.npc,
						id: data.id,
						name: data.name,
						answer: data.answer,
						madePublic: data.madePublic
					};
					game[0].resourceResponses.push(answer);
					game[0].save(function(err, worked) {
						if(err) {
							console.log(err);
						}
					});
				}
			});
		},

		getResponses: function(instance) {
			GameModel.where('instanceName').equals(instance)
				.select('resourceResponses')
				.find(function (err, responses) {
					console.log(responses);
				if(err) {
					console.error('  Could not find game', err);
				} else if(responses) {
					res(responses);
				}
			});
		},

		makeResponsePublic: function(data) {
			GameModel.where('instanceName').equals(data.instanceName)
				.find(function (err, game) {
					if(err) {
						console.error('Could not find game', err);
					} else if(game) {
						var all = game[0].resourceResponses,
							a = 0,
							found = false,
							addThis = null;
						while(!found) {
							console.log(all[a]);
							if(all[a].npc == data.npcId && all[a].id == data.playerId) {
								all[a].madePublic = true;
								found = true;
								addThis = all[a];
							}
							a++;
						}
						game[0].save(function(err, good) {
							if(err) {

							} else {
								ss.publish.all('ss-addAnswer', addThis);
								res(true);
							}
						});
					}
			});
		},

		loadGnome: function() {
			GnomeModel.findOne(function(err, gnome) {
				res(gnome);
			});
		}

	};
}