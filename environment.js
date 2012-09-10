// to run a specific environment, set the NODE_ENV variable on run:
// also, to run a specific database, set the ALT_DB variable on run:
// example: 'NODE_ENV=development ALT_DB=testing nodemon app.js'
// production is default/fallback where nothing is set
var nodeEnv = process.env.NODE_ENV || 'development',
databaseEnv = process.env.ALT_DB || nodeEnv,
redisPort,
redisHost,
databaseURL,
siteUrl;

// configure database according to environment
// the order of configuration here is important
if(databaseEnv === 'production') {
} else if(databaseEnv === 'staging') {
	siteUrl = 'http://civicseed-test.nodejitsu.com/';
	databaseURL = 'mongodb://root:root@ds033767.mongolab.com:33767/civicseeddev';
	redisPort = 6379;
	redisHost = 'localhost'; // ??????
} else if(databaseEnv === 'testing') {
	siteUrl = 'http://civicseed-test.nodejitsu.com/';
	databaseURL = 'mongodb://root:root@ds033767.mongolab.com:33767/civicseeddev';
	redisPort = 6379;
	redisHost = 'localhost'; // ??????
} else if(databaseEnv === 'development') {
	siteUrl = 'http://localhost:3000/';
	databaseURL = 'mongodb://localhost/civic_dev_db';
	redisPort = 6379;
	redisHost = 'localhost';
} else {
	console.log('  MONGODB AND/OR REDIS CONNECTION INFORMATION MISSING OR INACCURATE  '.red.inverse);
}

// environment/global variables
var globals = module.exports = {
	app: {
		name: 'Civic Seed',
		nodeEnv: nodeEnv,
		initialized: false,
		siteUrl: siteUrl,
	},
	redis: {
		port: redisPort,
		host: redisHost,
	},
	database: {
		environment: databaseEnv,
		URL: databaseURL,
	},
	map: {
		mapTilesWidth: 146,
		mapTilesHeight: 141,
	}
};