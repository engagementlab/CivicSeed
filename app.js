var ss = require('socketstream'),
express = require('express'),
app = module.exports = express(),
server,
environment,
service,
config,
control;

console.log('\n\n   * * * * * * * * * * * *   Starting the Civic Seed Game Engine   * * * * * * * * * * * *   \n\n'.yellow)

// Append SocketStream middleware to the stack
app.stack = app.stack.concat(ss.http.middleware.stack);

// Configuration and environmental files, etc.
environment = require('./environment.js');
service = require('./service.js');
config = require('./configuration.js')(app, express, ss);
control = require('./controllers.js')(app, service, environment);

// Setup the environment
service.init(environment);

// // use redis
// ss.session.store.use('redis');
// ss.publish.transport.use('redis');

// Define a single-page client
ss.client.define('main', {
	view: 'game.html',
	css:  ['app.less'],
	code: [
		'libs/jquery-1.7.2.min.js',
		'libs/angular-1.0.1.min.js',
		'libs/ssAngular.js',
		'app/controllers.js',
		'app/entry.js',
		'app/app.js',
	],
	tmpl: '*'
});

// THESE ROUTES EVENTUALLY NEED TO GO INTO CONTROLLERS
// BUT PLACING THEM HERE FOR NOW
function routes(app) {

	// express routes go like this
	app.get('/', function (req, res) {
		res.serve('main')
	});

	// socketstream routes go like this
	ss.http.route('/game', function(req, res) {
		res.serveClient('main');
	});
}

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