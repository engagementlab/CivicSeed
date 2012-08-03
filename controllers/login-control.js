// password stuff
var passport = require('passport'),
LocalStrategy = require('passport-local').Strategy;


passport.use(new LocalStrategy(
    function(username, password, done) {
        console.log(username+": "+password);
        //check DB for user
        db.login(username,password,function(err,user){
            if(err){
                console.log(err);
                return done(null,false,{message:err});
            }
            else{
                return done(null,user);
            }
        });
        // db.findByEmail(username, function(err, user){
        //     if (err){ return done(err); }
        //     if (!user){ 
        //         console.log("unknown user");
        //         return done(null, false, { message: username+", you totally don't exist brah!"}); 
        //     }
        //     if (user.password != password){ 
        //         console.log("wrong password");  
        //         return done(null, false, { message: 'gnarly password, dude.' }); 
        //     }
        //     console.log("correct!");
        //     return done(null, user);
        // });
    }
));

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
    console.log("ser, "+user.email);
    done(null, user.email);
});

passport.deserializeUser(function(email,done) {
    console.log("derr, "+email);
    db.findByEmail(email, function (err, user) {
        done(err, user);
    });
});






module.exports = function (app, service) {

	// 	var accountMiddleware = service.useModule('middleware/account');

	// 	// app.get('/', accountMiddleware.requireRole('user'), function(req, res){
	// 	// 	res.render('index', { title: "Index" });
	// 	// });





	app.get('/login',  function(req, res) {
		res.render('login.html', {
			title: ' {:: Civic Seed - Login ::} '
		});
			// if(req.user==undefined){
			// 	res.redirect('/login');
			// }
			// else{
			// 	res.redirect('/profile');
			// }
	});
	// app.post('/login', 
	//   passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
	//   function(req, res) {
	//     res.redirect('/profile');
	//   });
	// app.get('/signup/:email/:random',routes.signup);
	// app.post('/signup',routes.newUser);

	// app.get('/forgot',routes.forgot);
	// app.post('/forgot',routes.forgotSend);



};