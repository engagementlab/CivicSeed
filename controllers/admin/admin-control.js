var environment,
nodeEnv,
User,
Invitee;
// password stuff
// var mail = require('../../mail.js');

var self = module.exports = {

	users: null,
	emailUtil: null,

	init: function (app, service, hbs) {

		environment = service.environment;
		nodeEnv = environment.app.nodeEnv;
		User = service.useModel('user').UserModel;
		Invitee = service.useModel('user', 'preload').InviteeModel;

		app.get('/admin', function(req, res) {
			// Person.find({ occupation: /host/ })
			// User.find({ session: 0 }, 'session');

			Invitee.collection.distinct('sessionName', function(err, invitees) {
				if(err) {
					console.error('Could not find document: %s', err);
				}
				console.log(invitees);
				res.render('admin/admin.hbs', {
					title: 'Admin',
					bodyClass: 'admin',
					message: 'User admin panel.',
					invitees: invitees,
				});
			});
		});

		// create a set of codes
		app.get('/admin/action/create-invite-codes/:sessionName', function(req, res) {
			var i;
			var inviteeGroup = [];
			var inviteeObject;
			var sessionName = req.params.sessionName;
			var S4 = function() { return Math.floor(Math.random() * 0x10000).toString(16); };
			var GUID = function() {
				return (
					S4() + S4() + "-" +
					S4() + "-" +
					S4() + "-" +
					S4() + "-" +
					S4() + S4() + S4()
					);
			}

			// TODO: add in emails...???
			for(i = 0; i < 30; i++) {
				inviteeObject = {};
				inviteeObject.sessionName = sessionName;
				// inviteeObject.email = '???@???.???';
				inviteeObject.accepted = false;
				inviteeObject.code = GUID();
				inviteeGroup.push(inviteeObject);
			}

			// console.log(inviteeGroup);

			Invitee.create(inviteeGroup, function(err) {
				if(err) {
					console.error('  Could not create documents: %s  '.yellow.inverse, err);
					res.send('Error creating invite codes...');
				} else {

					Invitee.find({ sessionName: sessionName }, 'code', function (err, codes) {
						var length = codes.length;
						var i;
						var codesArray = [];
						for(i = 0; i < length; i++) {
							codesArray.push(codes[i].code);
						}
						console.log(codesArray);
						console.log('CS: '.blue + 'Invite codes created and saved to database: '.green);
						res.send(codesArray);
					});

				}
			});

		});

		// recreate/overwrite a set of existing session codes
		app.get('/admin/action/recreate-invite-codes/:session', function(req, res) {
			// res.render('admin/admin.hbs', {
			// 	title: 'Admin',
			// 	bodyClass: 'admin',
			// 	message: req.params.session,
			// });
		});



	}

};