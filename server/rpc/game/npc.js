var self = exports.actions = function(req, res, ss) {

	// req.use('session');
	// req.use('account.user.authenticated');

	console.log('CS:'.blue + ' npc RPC request ---->'.magenta);
	console.log(JSON.stringify(req).slice(0, 100).magenta + '...'.magenta);
	// console.log(ss.db);

	var service = ss.service;
	var UserModel = service.useModel('user', 'ss').UserModel;
	var NpcModel = service.useModel('npc', 'ss').NpcModel;
	var GnomeModel = service.useModel('npc', 'ss').GnomeModel;

	return {
		init: function() {
			res(true); // successful
		},
		// This is a working example:
		// ss.rpc('npc.init', function(response) {
		// 	console.log(response);
		// });
		// ss.rpc('npc.getNpcByName', 'Gnome', function(response) {
		// 	console.log(response);
		// });
		
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

		// exampleResponse: function() {
		// 	ss.publish.all('systemAlert', 'The server is about to be shut down');
		// 	res('The server is about to be shut down');
		// },
	};
}