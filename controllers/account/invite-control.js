// password stuff
// var mail = require('../../mail.js');

module.exports = function (app, service) {

	var emailUtil = service.useModule('utils/email');


	// getUserByEmail
	var checkEmail = function(email, callback) {
		var users = service.useModel('user-model');
		users.findOne({name:email},function(err,user){
			console.log(err+" :: "+user);
			if(err){
				return("looks like we messed up...",null);
			}
			else{
				if(!user){
					//no user, good to go TRUE
					return callback(null,true);
				}
				else{
					//user exists
					return callback(null,false);
				}
			}
		});
	};

	// genericize to match that actual code
	var checkCode = function(code, callback){
		if(code==="goat"){
			return callback(true);
		}
		else{
			return callback(false);
		}
	};

	app.get('/invite',  function(req, res) {
		res.render('invite.hbs', {
			title: ' {:: Civic Seed - Invite ::} ',message:"come, join us."}
			);
	});

	app.post('/invite',  function(req, res){

		var email = req.body.email;
		var code = req.body.secret;
		console.log(email);

		checkEmail(email, function(err, emptySpot) {
			if(err){
				console.log("the error: "+err);       
			}
			else {
				if(emptySpot) {
					checkCode(code, function(result) {
						if(result) {
							emailUtil.sendInvite(email, 'cheese', function(err) {
								if(err){
									res.render('invite.hbs', { message: 'issue sending mail. We tried, really.' });
								}
								else{
									res.render('invite.hbs', { message: 'check your email.' });
								}
							});
						}
						else {
							res.render('invite.hbs', {message: 'NO SOUP FOR YOU.'});
						}
					});

				}
				else{
					res.render('invite.hbs', {message: 'are you a clone?'});
				}
			}
		});
	});

};




