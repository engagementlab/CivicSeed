# CivicSeed

## Development

### Installation and Startup

First, clone the repository (or fork it):

	$ git clone https://github.com/engagementgamelab/CivicSeed.git

Then install the project:

	$ cd CivicSeed
	$ npm install

Civic Seed utilizes both REDIS and MongoDB. Make sure these are both installed and running before starting the Civic Seed app. Once these databases are running (see configuration below), start the app:

	$ npm start
	[or]
	$ nodemon

*Note that Civic Seed runs on node version >= 0.10.x. Civic Seed also utilizes the SocketStream framework to run on web sockets. Civic Seed is currently only built to run in the Chrome browser.**

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

### Data Initialization

Before initializing data, we need to make sure there's a super admin to create startup data. To create a temporary user, open a new terminal window and run the following command in the `/CivicSeed` project directory:

	$ node boot

This command will load a temporary super admin user with username `temp` and password `temp`. This will allow you to authenticate and initialize the rest of the database.

To initialize data in the databases, once the app is running, sign in using the temporary credentials and navigate to `Admin Console` -> `Startup` (located at `/admin/startup`). On this page is a series of load buttons. (*Data is found in .json files in the `/data` folder of the project, if you wish to modify data before loading.*)

**IMPORTANT: please note, you may only initialize data ONCE in production or staging modes. If you initialize again, this will wipe the database of all previous existing data. So be careful in `/admin/startup`.** However, you may wipe data in testing or development as many times as needed.

*Note, when the users are reloaded, this also deletes the `temp` super admin user.*

### Deployment

Before deploying the application, you'll want to pack the assets for production. You'll need to use the `sudo` command if you're using a production client port lower than 1024:

	$ [sudo] NODE_ENV=production SS_ENV=production SS_PACK=1 npm start

Once assets are packed, you may commit the packaged assets (`/client/static/assets`) to git and deploy the app to the server.









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
