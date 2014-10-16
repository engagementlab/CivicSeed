/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    config.js

    - Configuration for Civic Seed using nconf, depending on environment
    - This script looks at the NODE_ENV environment variable to know
      what environment CivicSeed is running in.

      - 'development'     local development instance
      - 'production'      production environment, generally Amazon S3
      - 'heroku'          remote testing environment, specifically Heroku

    - Configuration variables for each environment is stored in the
      assciated `config_environment.json` file
    - Authentication credentials should NEVER be stored in these files
      because they could be made available through a public repository,
      like GitHub. Instead, they should ALWAYS be stored on the environment
      itself using environment variables.
    - See also README.md and documentation for more information.

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var rootDir        = process.cwd(),
    nconf          = require('nconf'),
    fs             = require('fs'),
    NODE_ENV       = process.env.NODE_ENV || require(rootDir + '/bin/server').app.get('env'),
    configFilename = NODE_ENV !== 'development' ? '/config/' + NODE_ENV + '.json' : '/config/default.json',
    json           = JSON.parse(fs.readFileSync(rootDir + '/package.json', 'utf8'));

nconf.argv().env().file({
	file: process.env.configFile || rootDir + configFilename
});

nconf.set('VERSION', json.version);
nconf.set('ENVIRONMENT', NODE_ENV);

// Get authentication credentials stored as environment variables.
nconf.set('EMAIL_USER', process.env.EMAIL_USER || '')
nconf.set('EMAIL_PW',   process.env.EMAIL_PW   || '')
nconf.set('EMAIL_TO',   process.env.EMAIL_TO   || '')
nconf.set('REDIS_PW',   process.env.REDIS_PW   || '')

// HEROKU ENVIRONMENT
// Environment variables for Redis and Mongo are pre-set by Heroku add-ons.
// These use slightly different names we parse them here and add them via nconf.
// Heroku still relies on the existence of the config_heroku.json file but unused settings are removed in it.
if (NODE_ENV === 'heroku') {
  console.log('   * * * * * * * * * * * *   Heroku Dev Environment   * * * * * * * * * * * *   ')
  nconf.set('MONGO_URL', process.env.MONGOHQ_URL)

  // Set up RedisToGo on Heroku environment
  // See: https://devcenter.heroku.com/articles/redistogo#using-with-node
  var rtg   = require('url').parse(process.env.REDISTOGO_URL)
  nconf.set('REDIS_HOST', rtg.hostname)
  nconf.set('REDIS_PORT', rtg.port)
  nconf.set('REDIS_PW', rtg.auth.split(':')[1])
}

module.exports = nconf;
