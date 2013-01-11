/*
 * CONFIGURATION OF ENVIRONMENT VARIABLES
 *
 */

var rootDir = process.cwd(),
	nconf = require('nconf'),
	fs = require('fs'),
	nodeEnv = require(rootDir + '/bin/server').get('env'),
	configFilename = nodeEnv !== 'development' ? '/config_' + nodeEnv + '.json' : '/config.json',
	json = JSON.parse(fs.readFileSync(rootDir + '/package.json', 'utf8'));

nconf.argv().env().file({
	file: process.env.configFile || rootDir + configFilename
});

nconf.set('VERSION', json.version);
nconf.set('ENVIRONMENT', nodeEnv);

module.exports = nconf;