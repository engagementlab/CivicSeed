var self = exports.actions = function(req, res, ss) {

	req.use('session');
	req.use('debug');
	// req.use('account.user.authenticated');

	var service = ss.service;
	var UserModel = service.useModel('user', 'ss');
	var NpcModel = service.useModel('npc', 'ss');
	var GnomeModel = service.useModel('gnome', 'ss');
	var ResourceModel = service.useModel('resource', 'ss');

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
			ResourceModel.find(function (err, resources) {
				if(err) {
					console.error('  Could not find resources: %s  '.red.inverse, err);
				} else {
					res(resources);
				}
			});
		},

		answerToResource: function(data, id) {
			ResourceModel.findOne({id: id}, function (err, resource) {
				if(err) {
					console.error('  Could not find resource', err);
				}
				else {
					resource.playerAnswers.push(data);
					resource.save(function() {
						//blast players with new player answers
						ss.publish.all('ss-addPlayerAnswer', data, id);
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