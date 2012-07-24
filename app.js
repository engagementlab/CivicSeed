var server,
http = require('http'),
ss = require('socketstream'),
express = require('express'),
app = module.exports = express(),
environment = require('./environment.js'),
service = require('./service.js'),
config = require('./configuration.js')(app, express, ss),
control = require('./controllers.js')(app, service, environment);

// Setup the environment
service.init(environment);

// // use redis
// ss.session.store.use('redis');
// ss.publish.transport.use('redis');


// ss.tmpl['app'].render({name:'matthias'}, ss.tmpl);
// console.log(ss.client.define);
// console.log('asdf');

// Define a single-page client
ss.client.define('main', {
	view: 'app.html',
	css:  ['app.less'],
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

// Serve this client on the root URL
ss.http.route('/', function(req, res) {
	res.serveClient('main');
})

// Minimize and pack assets if you type: SS_ENV=production node app.js
if(ss.env == 'production') {
	ss.client.packAssets();
}

// Start web server
server = http.Server(ss.http.middleware);
server.listen(3000, function() {
	var local = server.address();
	console.log("Express server listening @ http://%s:%d/ in %s mode", local.address, local.port, app.settings.env);
});

// Start SocketStream
ss.start(server);

// server = app.listen(3000, function() {
// 	var local = server.address();
// 	console.log("Express server listening @ http://%s:%d/ in %s mode", local.address, local.port, app.settings.env);
// });