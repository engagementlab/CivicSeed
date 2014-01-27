/*
 * CONFIGURATION OF ENVIRONMENT VARIABLES
 *
 */

var rootDir        = process.cwd(),
    nconf          = require('nconf'),
    fs             = require('fs'),
    nodeEnv        = process.env.NODE_ENV || require(rootDir + '/bin/server').app.get('env'),
    configFilename = nodeEnv !== 'development' ? '/config_' + nodeEnv + '.json' : '/config.json',
    json           = JSON.parse(fs.readFileSync(rootDir + '/package.json', 'utf8'));

nconf.argv().env().file({
	file: process.env.configFile || rootDir + configFilename
});

nconf.set('VERSION', json.version);
nconf.set('ENVIRONMENT', nodeEnv);

// Get authentication credentials stored as environment variables.
nconf.set('ACCOUNT_PW', process.env.ACCOUNT_PW || '')
nconf.set('REDIS_PW', process.env.REDIS_PW || '')

if (nodeEnv === 'heroku') {
  console.log('   * * * * * * * * * * * *   Heroku Dev Environment   * * * * * * * * * * * *   ')
  nconf.set('MONGO_URL', process.env.MONGOHQ_URL)

  // Set up RedisToGo on Heroku environment
  // See: https://devcenter.heroku.com/articles/redistogo#using-with-node
  var rtg   = require('url').parse(process.env.REDISTOGO_URL)
  nconf.set('USE_REDIS', true)
  nconf.set('REDIS_HOST', rtg.hostname)
  nconf.set('REDIS_PORT', rtg.port)
  nconf.set('REDIS_PW', rtg.auth.split(':')[1])
}

module.exports = nconf;
