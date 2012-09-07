var service;
var Users;
var Npc;
var db;

var self = exports.actions = function(req, res, ss) {

	console.log('CS:'.blue + ' npc RPC request ---->'.magenta);
	console.log(req);
	// console.log(ss.db);

	return {
		init: function() {
			service = ss.service;
			User = service.useModel('user', 'ss').UserModel;
			Npc = service.useModel('npc', 'ss').NpcModel;
			Gnome = service.useModel('npc', 'ss').GnomeModel;

			res(true); // successful
		},
		// This is a working example:
		// ss.rpc('npc.init', function(response) {
		// 	console.log(response);
		// });
		// ss.rpc('npc.getNpcByName', 'Gnome', function(response) {
		// 	console.log(response);
		// });
		getNpcByName: function(npcName) {
			Npc.find({ name: npcName }, function (err, npc) {
				res(npc);
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