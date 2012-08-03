var ss = require('socketstream'),
express = require('express'),
app = module.exports = express(),
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
config = require('./configuration.js')(app, express, ss, environment);
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