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
						//general
						npc.name = info.name;
						npc.sprite = info.sprite;
						npc.isHolding = info.isHolding;
						npc.level = info.level;
						npc.index = info.y * 142 + info.x;
						//resource
						if(info.isHolding) {
							npc.resource.url = info.resource.url;
							npc.resource.questionType = info.resource.questionType;
							npc.resource.question = info.resource.question;
							npc.resource.tagline = info.resource.tagline;
							npc.dialog.prompts = info.dialog.prompts;

							//not open
							if(info.questionType === 'open') {
								npc.resource.requiredLength = info.resource.requiredLength;
							} else {
								npc.resource.answer = info.resource.answer;
								if(info.questionType === 'multiple') {
									npc.resource.possibleAnswers = info.possibleAnswers;
								}
							}
						} else {
							//smalltalk
							npc.dialog.smalltalk = info.dialog.smalltalk;
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
		},

		addNpc: function(info) {
			npcModel
				.create(info, function(err,result) {
					res(err,result);
				});
		},

		deleteNpc: function(id) {
			npcModel
				.where('id').equals(id)
				.remove(function(err,result) {
					res(err,result);
				});
		}
	};
};