/*
 * ENVIRONMENT/GLOBAL VARIABLES
 *
 * to run a specific environment, set the NODE_ENV variable on run:
 * also, to run a specific database, set the ALT_DB variable on run:
 * example: 'NODE_ENV=development ALT_DB=testing nodemon app.js'
 * production is default/fallback where nothing is set
 *
 */

var fs = require('fs');
var parameters = require('./parameters.js');

// UNIQUE PARAMETERS PULLED FROM parameters.js FILE
var nodeEnv = process.env.NODE_ENV || parameters.NODE_ENV || 'development';
var redisPass = process.env.REDIS_PASS || parameters.REDIS_PASS || '';
var mongoPass = process.env.MONGO_PASS || parameters.MONGO_PASS || '';

// REPEATED ENTRIES USED IN ALL ENVIRONMENTS
var map = {
	mapTilesWidth: 142,
	mapTilesHeight: 132,
};

// DEVELOPMENT ENVIRONMENT
var developmentEnvironment = {
	app: {
		name: 'Civic Seed',
		nodeEnv: nodeEnv,
		initialized: false,
		siteUrl: process.env.SITE_URL || 'http://localhost:3000/',
	},
	redis: {
		db: process.env.REDIS_DB || 'civic_dev_db',
		pass: redisPass,
		host: process.env.REDIS_HOST || 'localhost',
		port: process.env.REDIS_PORT || 6379,
	},
	database: {
		environment: process.env.ALT_ENV || nodeEnv,
		URL: process.env.DATABASE_URL || 'mongodb://localhost/civic_dev_db',
	},
	map: map
};

// TESTING ENVIRONMENT
var testingEnvironment = {
	app: {
		name: 'Civic Seed Testing',
		nodeEnv: nodeEnv,
		initialized: false,
		siteUrl: process.env.SITE_URL || 'http://civicseed-test.nodejitsu.com/',
	},
	redis: {
		db: process.env.REDIS_DB || 'civicseed-testing',
		pass: redisPass,
		host: process.env.REDIS_HOST || 'cowfish.redistogo.com',
		port: process.env.REDIS_PORT || 9098,
	},
	database: {
		environment: process.env.ALT_ENV || nodeEnv,
		URL: process.env.DATABASE_URL || 'mongodb://root:' + mongoPass + '@ds033767.mongolab.com:33767/civicseeddev',
	},
	map: map
};

// PRODUCTION ENVIRONMENT
var productionEnvironment = {
	// to come
};

// CHOOSING THE ENVIRONMENT
var chosenEnvironment;
if(nodeEnv === 'development') {
	chosenEnvironment = developmentEnvironment;
} else if(nodeEnv === 'testing') {
	chosenEnvironment = testingEnvironment;
} else {
	chosenEnvironment = productionEnvironment;
}
module.exports = chosenEnvironment;