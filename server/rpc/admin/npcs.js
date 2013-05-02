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
			npcModel.find(function(err,result) {
				if(err) {
					res(err);
				} else if(result) {
					res(result);
				}
			});
		}
	};
};