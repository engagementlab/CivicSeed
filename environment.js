// to run a specific environment, set the NODE_ENV variable on run:
// also, to run a specific database, set the ALT_DB variable on run:
// example: 'NODE_ENV=development ALT_DB=testing nodemon app.js'
// production is default/fallback where nothing is set
var nodeEnv = process.env.NODE_ENV || 'development',
databaseEnv = process.env.ALT_DB || nodeEnv,
databaseURL;

// configure database according to environment
// the order of configuration here is important
if(databaseEnv === 'production') {
} else if(databaseEnv === 'staging') {
} else if(databaseEnv === 'testing') {
	databaseURL = 'mongodb://root:root@ds033767.mongolab.com:33767/civicseeddev';
} else if(databaseEnv === 'development') {
	databaseURL = 'mongodb://localhost/civic_dev_db';
} else {
	console.log('  DATABASE CONNECTION INFORMATION MISSING  '.red.inverse);
}

// environment/global variables
var globals = module.exports = {
	app: {
		name: 'Civic Seed',
		nodeEnv: nodeEnv,
		initialized: false,
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