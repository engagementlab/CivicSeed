// password stuff
var passport = require('passport'),
LocalStrategy = require('passport-local').Strategy;

var self = module.exports = {

    init: function (app, service, hbs) {

        //  var accountMiddleware = service.useModule('middleware/account');
        var users = service.useModel('user').UserModel;

		// see home-control for app.get('/' ...
		app.post('/',
			passport.authenticate('local', { failureRedirect: '/', failureFlash: true }),
			function(req, res) {
				console.log('CS: user has logged in successfully.');
				res.redirect('/game');
			}
		);

		passport.use(new LocalStrategy(
			function(username, password, done) {
				checkLoginInfo(username,password,function(err,user){
					if(err) {
						console.log('the error: ' + err);
						return done(null, false, {message: 'incorrect informacion'});
					}
					else{
						return done(null,user);
					}
				});
			}
		));

		passport.serializeUser(function(user, done) {
			
			done(null, user.id);
		});

		passport.deserializeUser(function(user, done) {
			done(err, user.id);
		});

		checkLoginInfo = function(email, pass, callback) {
			console.log(email.magenta.inverse);
			users.findOne({email: email} , function(err, user) {
				if(!user) {
					return callback('you don\'t belong here.',null);
				}
				else{
					// var hashedPassword = user.password;
					// if(hash.verify(pass, hashedPassword)){
					//     return callback(null,user);
					// }
                    if(user.password == pass) {
                    	return callback(null,user);
                    }
                    else{
                    	return callback('wrong! try again.',null);
                    }   
                }
            });
		};



		app.get('/login',  function(req, res) {
			res.render('login.hbs', {
				title: 'Login',
				bodyClass: 'login',
				message: req.flash('error')
			});
                // if(req.user==undefined){
                //  res.redirect('/login');
                // }
                // else{
                //  res.redirect('/profile');
                // }
            });

	}

};