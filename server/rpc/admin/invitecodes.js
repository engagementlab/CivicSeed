// "xkcd-pwgen": "https://github.com/americanyak/xkcd-pwgen/tarball/master"

var rootDir = process.cwd(),
	nodemailer = require('nodemailer'),
	xkcd = require('xkcd-pwgen'),
	service = require(rootDir + '/service'),
	config = require(rootDir + '/config'),
	accountName = config.get('NAME'),
	accountEmail = config.get('ACCOUNT_EMAIL'),
	accountPassword = config.get('ACCOUNT_PW'),
	userModel = service.useModel('user', 'preload'),
	emailListLength,
	smtpTransport,
	mailOptions = {
		from: accountName + ' ✔ <' + accountEmail + '>',
		replyTo: accountEmail,
		to: null,
		subject: 'Hello from Civic Seed (Working Test 1) ✔',
		// text: 'Hello world ✔',
		html: null,
		generateTextFromHTML: true
	},
	emailListLength,
	emailIterator;

var html = '<p><a href="http://xkcd.com/936/">xkcd</a> generatoed yo password, yo: ';
html += '&ldquo;<strong>#{password}</strong>&rdquo; ✔</p>';
html += '<p>Yo us\'oname is yo email: <strong>#{email}</strong> ✔</p>';


// **** PRIVATE MEMBERS & FUNCTIONS ****
// **** PRIVATE MEMBERS & FUNCTIONS ****
// **** PRIVATE MEMBERS & FUNCTIONS ****

// http://www.youtube.com/watch?v=nCCxpgVvQXo

var _private = {

	createUser: function(email, callback) {
		userModel.findOne({ email: email }, function(err, user) {
			if(err) { console.error('  Could not find \'actor\' user: %s'.red.inverse, err); } 
			else {
				if(!user) {
					user = new userModel();
					user.name = email.split('@')[0];
					user.password = xkcd.generatePassword();
					user.email = email;
					user.role = 'actor';
					console.log('Created user: ' + user.email);
					user.save(function(err) {
						if(err) {
							console.error('  Could not save \'actor\' user: '.red.inverse + user.name.red.inverse, err);
						} else {
							_private.sendEmail(user.email, user.password);
						}
					});
				}
				// user.name = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
				// user.password = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
				// user.email = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
				// user.role = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
				// user.save(function(err) {
				// 	if(err) { console.error('  Could not save \'actor\' user: '.red.inverse + user.name.red.inverse, err); }
				// 	console.log(user.name, String(email).red);
				// });
				// console.log(user);
			}
		});
	},

	openEmailConnection: function() {
		smtpTransport = nodemailer.createTransport('SMTP', {
			service: 'Gmail',
			auth: {
				user: accountEmail,
				pass: accountPassword
			}
		});
	},

	sendEmail: function(email, password) {
		singleHtml = html.replace('#{password}', password);
		singleHtml = singleHtml.replace('#{email}', email);
		mailOptions.to = email;
		mailOptions.html = singleHtml;
		smtpTransport.sendMail(mailOptions, function(err, response) {
			if(err) {
				console.log('ERROR sending email to ' + email + '!', err);
			} else {
				console.log('Message sent to : ' + response.message);
			}
		});
	},

	closeEmailConnection: function() {
		smtpTransport.close();
	}

};


// **** RPC ACTIONS ****
// **** RPC ACTIONS ****
// **** RPC ACTIONS ****

exports.actions = function(req, res, ss) {

	req.use('session');
	// req.use('debug');
	req.use('account.authenticated');

	return {

		sendInvites: function(emailList) {

			if(req.session.role && (req.session.role === 'superadmin' || req.session.role === 'admin')) {
				// emailList = ['russell@engagementgamelab.org', 'russell@russellgoldenberg.com', 'russell_goldenberg@emerson.edu', 'samuel.a.liberty@gmail.com', 'thebookofrobert@gmail.com', 'langbert@gmail.com', 'arxpoetica@gmail.com'];

				console.log('\n\n   * * * * * * * * * * * *   Sending User Invites via Email   * * * * * * * * * * * *   \n\n'.yellow);
				console.log(emailList.join(', ') + '\n\n');
				_private.openEmailConnection();

				emailList = emailList.slice(0, 20);
				emailListLength = emailList.length;
				for(emailIterator = 0; emailIterator < emailListLength; emailIterator++) {
					_private.createUser(emailList[emailIterator], _private.closeEmailConnection);
				}

				// HOW DO I SEND UP THE RESPONSE AFTER IT'S ALL DONE???
				// res('ERROR sending email to ' + email + '!');

			} else {
				res(false);
			}
		}

	};

};

