var service, npcModel;

var monitorHelpers = null;

// Define actions which can be called from the client using ss.rpc('demo.ACTIONNAME', param1, param2...)
exports.actions = function(req, res, ss) {

	req.use('session');
	// req.use('debug');

	return {
		init: function(id) {
			service = ss.service;
			console.log('rpc.admin.initNPC');
			npcModel = service.useModel('npc', 'ss');
			npcModel
				.find()
				.sort('level')
				.exec(function(err,result) {
					if(err) {
						res(err);
					} else if(result) {
						res(result);
					}
				});
		},

		updateInformation: function(info) {
			npcModel
				.where('id').equals(info.id)
				.find(function(err,result) {
					if(err) {
						res('error');
					} else if(result) {
						var npc = result[0];
						if(npc.isHolding) {
							npc.dialog.prompts = info.dialog;
							npc.resource.question = info.question;
						} else {
							npc.dialog.smalltalk = info.dialog;
						}
						npc.save(function(err,okay) {
							if(err) {
								res('error');
							} else {
								res(false);
							}
						});
					}
			});
		}
	};
};