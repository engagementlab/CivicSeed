/*
 * ENVIRONMENT/GLOBAL VARIABLES for DEVELOPMENT/LOCAL CONFIGURATION
 *
 * to run a specific environment, set the NODE_ENV variable on run:
 * also, to run a specific database, set the ALT_DB variable on run:
 * example: 'NODE_ENV=development ALT_DB=testing nodemon app.js'
 * production is default/fallback where nothing is set
 *
 */

var nodeEnv = process.env.NODE_ENV || 'development';

var self = module.exports = {
	app: {
		name: 'Civic Seed',
		nodeEnv: nodeEnv,
		initialized: false,
		siteUrl: process.env.SITE_URL || 'http://localhost:3000/',
	},
	redis: {
		port: process.env.REDIS_PORT || 6379,
		host: process.env.REDIS_HOST || 'localhost',
	},
	database: {
		environment: process.env.ALT_ENV || nodeEnv,
		URL: process.env.DATABASE_URL || 'mongodb://localhost/civic_dev_db',
	},
	map: {
		mapTilesWidth: 142,
		mapTilesHeight: 132,
	}
};