# CivicSeed

## Development

### Installation and Startup

First, clone the repository (or fork it):

	$ git clone https://github.com/engagementgamelab/CivicSeed.git

Then install the project:

	$ cd CivicSeed
	$ npm install

To start the app:

	$ node app.js

### Environmental Configuration

CivicSeed uses `nconf` to create runtime configuration and environment variables. `Nconf` looks for a json config file in the project root folder, based on the environment. The file is named such: `config_[environment].json`. For example, in `PRODUCTION` the config file looked for by `nconf` is `config_production.json`. The exception to this is the local/development file which is called simply `config.json`. An example config file includes the following variables:

	{
		"NAME": "Civic Seed",
		"PORT": 80,
		"USE_REDIS": true,
		"REDIS_HOST": "sample.redis.host.com",
		"REDIS_PORT": 6379,
		"REDIS_PW": "password.goes.here",
		"REDIS_DB": "civicseed",
		"MONGO_URL": "mongodb://sample-user@sample.mongodb.host.com:10099/civicseed",
		"ACCOUNT_EMAIL": "accounts@civicseed.org",
		"ACCOUNT_PW": "password.goes.here",
		"CLOUD_PATH": "http://sample.cloud.path.com"
	}

### Deployment

Before deploying the application, you'll want to pack the assets for production. You'll need to use the `sudo` command if you're using a production client port lower than 1024:

	[sudo] NODE_ENV=production SS_ENV=production SS_PACK=1 npm start

Once the app is running you may visit `/startup` to initialize data in the app. (Data is found in .json files in the `/data` folder.) Please note, **you may only initialize data once in production or staging modes**. This is for protection of data. However, you may run it in testing or development as many times as needed, but it should be noted that **this will wipe the database of all previous existing data**.

### Dependencies

Global dependencies should include nodemon:

	├── nodemon@0.6.14

Running "node --version" should return:

	v0.8.2

## Front End

### Calculating Map Size

1. The viewport displays a 30 x 15 tile grid.  A "quadrant" is really 28 x 13 because there is overlap.

2. Formula for exact dimensions where:
    - vX = width of viewport in tiles
    - vY = height of viewport in tiles
    - qX = number horizontal quadrants
    - qY = number of vertical quadrants

    #### total X tiles = vX * qX - (qX-1 * 2)
    #### total Y tiles =  vY * qY - (qY-1 * 2)

    ### DON'T QUESTION THE FORMULA...
