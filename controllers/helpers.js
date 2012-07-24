module.exports = function (app, service) {
	var dynamicHelpers = {  
		userPanel: function(req, res) {
			if(req.session.user){
				return req.session.user.email + ' <a href="/sessions/destroy"> Logout </a>';
			}
			return '';
		},

		messages: require('express-messages')
	};

	var staticHelpers = {
		dateFormat: service.useModule('utils/dateFormat.js')
	};


	app.dynamicHelpers(dynamicHelpers);
	app.helpers(staticHelpers);
};

