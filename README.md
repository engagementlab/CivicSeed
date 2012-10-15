# CivicSeed

## Setup/Installation

### Install SocketStream as a global dependency

    [sudo] npm install -g socketstream

### Clone the repository

    git clone git@github.com:americanyak/CivicSeed.git

### Install the project and nodemon

    cd CivicSeed
    [sudo] npm install -g nodemon
    npm install

### Environmental Configuration

...to come...[using nconf package JSON]...

### Startup

To start the app:

    node app.js

To start the app in dev mode, use nodemon for node file monitoring and autobuild:

    nodemon app.js

To change the node or database environment settings, use command line variables like such:

    NODE_ENV=development ALT_DB=testing nodemon app.js

Please be very careful about using alternate databases (especially on production or staging) as data protections are not yet in place when using databases and node environments that do not match. **PLEASE TAKE EXTRA PRECAUTION WHEN STARTING THE APP THIS WAY!!!**

Or to specificy both node and database environments in one go, just launch with the correct NODE_ENV variable: 

    NODE_ENV=production node app.js

Once the app is running you may visit `/startup` to initialize data in the app. (Data is found in .json files in the `/data` folder.) Please note, **you may only initialize data once in production or staging modes**. This is for protection of data. However, you may run it in testing or development as many times as needed, but it should be noted that **this will wipe the database of all previous existing data**.

### Dependencies

Global dependencies should include nodemon:

    ├── nodemon@0.6.14 

Running "node --version" should return:

    v0.8.2

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