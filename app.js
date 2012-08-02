var ss = require('socketstream'),
express = require('express'),
app = module.exports = express(),
// app = express.createServer(),
passport = require('passport'),
routes = require('./routes.js'),
server,
environment,
service,
config,
control,
passportConfig;

console.log('\n\n   * * * * * * * * * * * *   Starting the Civic Seed Game Engine   * * * * * * * * * * * *   \n\n'.yellow)

// Configuration and environmental files, etc.
environment = require('./environment.js');
service = require('./service.js');
config = require('./configuration.js')(app, express, ss, passport);
control = require('./controllers.js')(app, service, environment);
//passportConfig = require('./passportconfig.js')(app, service);

// Setup the environment
service.init(environment);

// // use redis
// ss.session.store.use('redis');
// ss.publish.transport.use('redis');

// Code Formatters
ss.client.formatters.add(require('ss-less'));

// // Use server-side compiled Hogan (Mustache) templates. Others engines available
// ss.client.templateEngine.use(require('ss-hogan'));

// Define a single-page client
ss.client.define('main', {
	view: 'game.html',
	css: 'app.less',
	code: [
		'libs/jquery-1.7.2.min.js',
		'libs/angular-1.0.1.min.js',
		'libs/ssAngular.js',
		'app/controllers.js',
		'app/entry.js',
		'app/app.js'
	],
	tmpl: '*'
});

// Use Express to route requests
// app.get('/', function (req, res) {
// 	res.serve('main');
// });
// app.get('/', function(req, res) {
// 	res.serveClient('main');
// });
// Routing Example
// app.get('/', function(req,res) {
// 	// if(user_signed_in(req) !== true) {
// 	// 	res.serve('login');
// 	// } else {
// 	// 	res.serve('top');
// 	// }
// 	//res.serve('login');

// });

// socketstream routes go like this
app.get('/game', function(req, res) {
	res.serveClient('main');
});












// password stuff

var LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
    function(username, password, done){
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

app.get('/', routes.index);

app.get('/login', routes.login);
// app.post('/login', 
//   passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
//   function(req, res) {
//     res.redirect('/profile');
//   });
// app.get('/signup/:email/:random',routes.signup);
// app.post('/signup',routes.newUser);

// app.get('/forgot',routes.forgot);
// app.post('/forgot',routes.forgotSend);













// Minimize and pack assets if you type: SS_ENV=production node app.js
if(ss.env == 'production') {
	ss.client.packAssets();
}

// Start web server
server = app.listen(3000, function() {
	var local = server.address();
	console.log("Express server listening @ http://%s:%d/ in %s mode", local.address, local.port, app.settings.env);
});

// Start SocketStream
ss.start(server);

// Append SocketStream middleware to the stack
app.stack = app.stack.concat(ss.http.middleware.stack);