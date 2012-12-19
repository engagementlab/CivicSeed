/*
 * CONFIGURATION OF ENVIRONMENT VARIABLES
 *
 */

var rootDir = process.cwd(),
nconf = require('nconf'),
fs = require('fs'),
nodeEnv = require(rootDir + '/bin/server').get('env'),
json = JSON.parse(fs.readFileSync(rootDir + '/package.json', 'utf8'));

nconf.argv().env().file({
	file: process.env.configFile || rootDir + '/config.json'
});

nconf.set('VERSION', json.version);
nconf.set('ENVIRONMENT', nodeEnv);

module.exports = nconf;