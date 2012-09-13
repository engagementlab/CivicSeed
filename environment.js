/*
 * ENVIRONMENT/GLOBAL VARIABLES for TESTING/LOCAL CONFIGURATION
 *
 * to run a specific environment, set the NODE_ENV variable on run:
 * also, to run a specific database, set the ALT_DB variable on run:
 * example: 'NODE_ENV=development ALT_DB=testing nodemon app.js'
 * production is default/fallback where nothing is set
 *
 */

var nodeEnv = process.env.NODE_ENV || 'testing';

var self = module.exports = {
	app: {
		name: 'Civic Seed',
		nodeEnv: nodeEnv,
		initialized: false,
		siteUrl: process.env.SITE_URL || 'http://civicseed-test.nodejitsu.com/',
	},
	redis: {
		db: process.env.REDIS_DB || 'civicseed-testing',
		pass: process.env.REDIS_PASS || 'a0e6935acbdd1e6f84e760d5d2c5720b',
		host: process.env.REDIS_HOST || 'cowfish.redistogo.com',
		port: process.env.REDIS_PORT || 9098,
	},
	database: {
		environment: process.env.ALT_ENV || nodeEnv,
		URL: process.env.DATABASE_URL || 'mongodb://root:root@ds033767.mongolab.com:33767/civicseeddev',
	},
	map: {
		mapTilesWidth: 142,
		mapTilesHeight: 132,
	}
};