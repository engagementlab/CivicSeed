# CivicSeed

## Setup/Installation

### Clone the repository

    git clone git@github.com:americanyak/CivicSeed.git

### Install the project

    cd CivicSeed
    npm install

### Startup

To start the app:

    node app.js

For development purposes, you may wish to use nodemon or another file monitor instead of node alone:

    [sudo] npm install -g nodemon
    nodemon app.js

#### Environmental Configuration

CivicSeed uses nconf to access environment variables, which include:

 * NAME
 * DOMAIN
 * PORT
 * USE_REDIS
 * REDIS_HOST
 * REDIS_PORT
 * REDIS_PW
 * REDIS_DB
 * MONGO_URL
 * MAP_TILES_WIDTH
 * MAP_TILES_HEIGHT

#### Development

For ease of development, nconf looks for a hidden config file (see ```.gitignore```) called ```config.json```, instead of environment variables in development mode. Create this file by duplicating and renaming the ```config-sample.json``` file.

#### Production/Staging

Development of CivicSeed was done with Nodejitsu, so these are Nodejitsu specific instructions, but generally apply if you're using your own server instances or some other situation.

Make sure to create all the environment variables listed above. These variables imply a running instance of REDIS and MongoDB.

Before deploying the application, you'll want to pack the assets for production. You'll need to use the ```sudo``` command if you're using a production client port lower than 1024:

    [sudo] NODE_ENV=production SS_ENV=production SS_PACK=1 npm start

If you're having issues with sockets hanging up based on launch time, you can up the deployment timeout:

    jitsu config set timeout 860000



Once the app is running you may visit `/startup` to initialize data in the app. (Data is found in .json files in the `/data` folder.) Please note, **you may only initialize data once in production or staging modes**. This is for protection of data. However, you may run it in testing or development as many times as needed, but it should be noted that **this will wipe the database of all previous existing data**.

### Dependencies

Global dependencies should include nodemon:

    ├── nodemon@0.6.14 

Running "node --version" should return:

    v0.8.2

You must install Cairo for server side canvas. Simple instructions available here:
https://github.com/LearnBoost/node-canvas/wiki/_pages

## Deployment

Currently, we're deploying to NodeJitsu, based on support for MongoDB, Redis, and Sockets. (Note the ```.npmignore``` file is different than the ```.gitignore``` file, as it needs to include ```parameters.js``` and ```package.json```.)

To deploy to NodeJitsu, from the root of the app just type:

    jitsu deploy

## Front End

### Map Information

### Front End Dependencies

### Compiling CSS

1. Download http://incident57.com/less/
2. Drag folder client/static/css to app
3. Uncheck everything EXCEPT style.less
4. Make changes to any less file in the /bootstrap folder
5. Save the style.less folder and it will auto re-compile style.css

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

## Questions and Answers

    Question: Will Node.js scale?
    Answer: http://stackoverflow.com/questions/4488614/node-js-vs-java-for-comet-application
        http://stackoverflow.com/questions/4710420/scaling-node-js
        http://amix.dk/blog/post/19613
        http://stackoverflow.com/questions/2387724/node-js-on-multi-core-machines/8685968#8685968
        http://blog.nodejitsu.com/scaling-isomorphic-javascript-code