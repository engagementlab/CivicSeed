var rootDir = process.cwd(),
	emailUtil = require(rootDir + '/server/utils/email'),
	xkcd = require('xkcd-pwgen'),
	service = require(rootDir + '/service'),
	userModel = service.useModel('user', 'preload'),
	emailListLength,
	emailIterator,
	singleHtml;

var html = '<h2>Why hello there, #{firstName}!</h2>';
html += '<p style="color:green;">WELCOME TO CIVIC SEED!</p>';
html += '<p><a href="http://xkcd.com/936/">xkcd</a> generatoed yo password, yo: ';
html += '&ldquo;<strong>#{password}</strong>&rdquo; ✔</p>';
html += '<p>Yo us\'oname is yo email: <strong>#{email}</strong> ✔</p>';

// http://www.youtube.com/watch?v=nCCxpgVvQXo

exports.actions = function(req, res, ss) {

	req.use('session');
	// req.use('debug');
	req.use('account.authenticated');

	var createUserAndSendInvite = function(email, i) {
		userModel.findOne({ email: email }, function(err, user) {
			var nameParts;
			if(err) {
				console.error('  Could not find \'actor\' user: %s'.red.inverse, err);
			} else {
				if(!user) {
					nameParts = email.split('@');
					user = new userModel();
					user.firstName = nameParts[0];
					user.lastName = nameParts[1];
					user.password = xkcd.generatePassword();
					user.email = email;
					user.role = 'actor';
					console.log('Created user: ' + user.email);
					user.save(function(err) {
						if(err) {
							console.error('  Could not save \'actor\' user: '.red.inverse + user.firstName.red.inverse, err);
						} else {
							singleHtml = html.replace('#{firstName}', user.firstName);
							singleHtml = singleHtml.replace('#{password}', user.password);
							singleHtml = singleHtml.replace('#{email}', user.email);
							emailUtil.sendEmail('Hello from Civic Seed (Working Test 5) ✔', singleHtml, user.email);
							if(i === emailListLength - 1) {
								emailUtil.closeEmailConnection();
								console.log('All emails have been sent...');
								res(true);
							}
						}
					});
				}
			}
		});
	};

	return {

		sendInvites: function(emailList) {

			if(req.session.role && (req.session.role === 'superadmin' || req.session.role === 'admin')) {
				// emailList = ['russell@engagementgamelab.org', 'russell@russellgoldenberg.com', 'russell_goldenberg@emerson.edu', 'samuel.a.liberty@gmail.com', 'thebookofrobert@gmail.com', 'langbert@gmail.com', 'arxpoetica@gmail.com'];

				console.log('\n\n   * * * * * * * * * * * *   Sending User Invites via Email   * * * * * * * * * * * *   \n\n'.yellow);
				console.log(emailList.join(', ') + '\n\n');
				emailUtil.openEmailConnection();

				emailList = emailList.slice(0, 20);
				emailListLength = emailList.length;
				for(emailIterator = 0; emailIterator < emailListLength; emailIterator++) {
					createUserAndSendInvite(emailList[emailIterator], emailIterator);
				}
			} else {
				res(false);
			}
		}

	};

};

