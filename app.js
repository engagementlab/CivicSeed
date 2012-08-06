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

// Setup the environment
service.init(environment);

control = require('./controllers.js')(app, service, environment);
config = require('./configuration.js')(app, express, ss, environment);
//passportConfig = require('./passportconfig.js')(app, service);

// Start web server
server = app.listen(process.env['app_port'] || 3000, function() {
	var local = server.address();
	console.log("Express server listening @ http://%s:%d/ in %s mode", local.address, local.port, app.settings.env);
});

// Start SocketStream
ss.start(server);

// Append SocketStream middleware to the stack
app.stack = app.stack.concat(ss.http.middleware.stack);