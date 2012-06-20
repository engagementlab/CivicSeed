//russell was here

var server,
http = require('http'),
ss = require('socketstream'),
express = require('express'),
app = module.exports = express(),
environment = require('./environment.js'),
service = require('./service.js');

// Mongoose db hookup
service.init(environment);

// require('./configuration.js')(app, express);
// require('./controllers.js')(app, service, environment);

// // use redis
// ss.session.store.use('redis');
// ss.publish.transport.use('redis');

// Code Formatters
ss.client.formatters.add(require('ss-stylus'));

// ss.client.templateEngine.use('angular');
ss.client.templateEngine.use(require('ss-hogan'));

// ss.tmpl['app'].render({name:'matthias'}, ss.tmpl);
console.log(ss.client.define);

// Define a single-page client
ss.client.define('main', {
	view: 'app.html',
	css:  ['libs', 'app.styl'],
	code: ['libs', 'app'],
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