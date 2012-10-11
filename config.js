/*
 * CONFIGURATION OF ENVIRONMENT VARIABLES
 *
 */

var nconf = require('nconf'),
fs = require('fs');

nconf.argv().env().file({
	file: process.env.configFile || 'config.json'
});

module.exports = nconf;