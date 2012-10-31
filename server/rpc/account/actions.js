exports.actions = function(req, res, ss) {

	req.use('session');

	return {

		authenticate: function(username, password) {

			console.log('authentication happening...'.blue.inverse);

			// // lookup user in DB, LDAP, etc

			// if (user) {
			// 	req.session.setUserId(user.id);
			// 	res(true);
			// } else {
			// 	res('Access denied!');
			// }

		},

		logout: function() {


			// req.session.setUserId(null);

		}

	};

}