// password stuff
var passport = require('passport'),
LocalStrategy = require('passport-local').Strategy;

module.exports = function (app, service) {

	// 	var accountMiddleware = service.useModule('middleware/account');
    var users = service.useModel('user');

	// 	// app.get('/', accountMiddleware.requireRole('user'), function(req, res){
	// 	// 	res.render('index', { title: "Index" });
	// 	// });

    passport.use(new LocalStrategy(
        function(username, password, done) {
            console.log(username+": "+password);
            //check DB for user
            checkLoginInfo(username,password,function(err,user){
                if(err){
                    console.log("the error: "+err);
                    return done(null,false,{message:"incorrect informacion"});
                }
                else{
                    return done(null,user);
                }
            });
        }    
        
        // //hard test to see if passport is working
        //     if(username=="gnome"){
        //         if(password=="chomsky"){
        //             return done(null,true);
        //         }
        //         else{
        //             return done(null,false,{message:'wrong password'});
        //         }
        //     }
        //     else{
        //         return done(null,false,{message: 'wrong user'});
        //     }
        // }
    ));

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.


//THIS STUFF is automatically called when passport authenticates
    passport.serializeUser(function(user, done) {
    //what is this anyway??
    // console.log("ser, "+user.email);
    // done(null, user.email);
       done(null,user);
    });

    passport.deserializeUser(function(user,done) {
    //what is this anyway?
    // console.log("derr, "+email);
    // db.findByEmail(email, function (err, user) {
    //     done(err, user);
    // });
        done(err,user);
    });

    checkLoginInfo = function(name,pass,callback){
        users.findOne({name:name},function(err,user){
            if(!user){
                return callback("you don't belong here.",null);
            }
            else{
                // var hashedPassword = user.password;
                // if(hash.verify(pass, hashedPassword)){
                //     return callback(null,user);
                // }
                if(user.password==pass){
                    return callback(null,user);
                }
                else{
                    return callback("wrong! try again.",null);
                }   
            }
        });
    };



	app.get('/login',  function(req, res) {
		res.render('login.hbs', {
			title: ' {:: Civic Seed - Login ::} ',message:req.flash('error')
		});
			// if(req.user==undefined){
			// 	res.redirect('/login');
			// }
			// else{
			// 	res.redirect('/profile');
			// }
	});
	app.post('/', 
	  passport.authenticate('local', { failureRedirect: '/', failureFlash: true }),
	  function(req, res) {
        console.log("yaaay");
	    res.redirect('/game');
	  });
	// app.get('/signup/:email/:random',routes.signup);
	// app.post('/signup',routes.newUser);

	// app.get('/forgot',routes.forgot);
	// app.post('/forgot',routes.forgotSend);



};