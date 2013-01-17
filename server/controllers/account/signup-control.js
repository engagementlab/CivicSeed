var self = module.exports = {

	init: function (app, service, hbs) {

		var users = service.useModel('user');

		app.get('/signup/:email/:random',  function(req, res) {
			res.render('signup.hbs', {
				title: 'Sign Up',
				bodyClass: 'signup',
				message: 'One last step...',
				eMail: req.params.email
			});
		});

		app.post('/signup/:email/:random',  function(req, res){

			var newUser = {
				email: req.body.email,
				firstName: req.body.firstName,
				lastName: req.body.lastName,
				password: req.body.password,
				confirmPassword: req.body.confirmPassword,
				joined: new Date()
			}

			addUser(newUser, function(err,result){
				if(err){
					res.render('signup',{message:err});
				}
				else{
					res.redirect('profile/'+result.uniqueUrl+"/welcome");
				}
			});
            // addUser(email,firstName,lastName,password,confirmPassword,function(err,result){
            //  //render something
            // });

		});

		//insert into DB
		addUser = function(user, callback) {
			//find ONE
			//if that email is in the DB (from invite) and it is pending,
			//query DB for profile url (first+last)
			//update information in DB, change pending to false, 
			//else, return error
		};

	}

};