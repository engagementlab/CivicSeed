var rootDir = process.cwd();

var fs = require('fs');
var nconf = require('nconf');
var colors = require('colors');
var bcrypt = require('bcrypt');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;


var nodeEnv = require('express')().get('env');
var configFilename = nodeEnv !== 'development' ? '/config_' + nodeEnv + '.json' : '/config.json';

var accountHelpers = require(rootDir + '/server/utils/account-helpers');

nconf.argv().env().file({
	file: process.env.configFile || rootDir + configFilename
});

var _db;
var _userModel;
var _superAdminUser;

console.log(nconf.get('MONGO_URL'));
_db = mongoose.createConnection(nconf.get('MONGO_URL'));
_db.on('error', console.error.bind(console, ' CONNECTION ERROR: '.red.inverse));
_db.once('open', function() {
	console.log('MongoDB connection opened...'.green);
	_userModel = require(rootDir + '/models/user-model')(mongoose, _db, Schema, ObjectId);
	_db.collections['users'].drop(function(error) {
		bcrypt.genSalt(10, function(err, salt) {
			bcrypt.hash('temp', salt, function(err, hash) {
				_superAdminUser = new _userModel({
					firstName: 'Super',
					lastName: 'Admin',
					password: hash,
					email: 'temp',
					role: 'superadmin'
				});
				_superAdminUser.save(function(err) {
					if(err) {
						console.error('Error creating new super admin user.'.red);
						process.exit();
					} else {
						console.log('\n   * * * * * * * * * * * *   Super Admin Saved   * * * * * * * * * * * *\n'.green);
						mongoose.connection.close(function() {
							console.log('MongoDB connection closed...'.green);
							process.exit();
						});
					}
				});
			});
		});
	});
});