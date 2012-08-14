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

### List of Dependencies After Installation:

    npm list
    ├── colors@0.6.0-1 
    ├── connect-flash@0.1.0 
    ├── consolidate@0.3.1 
    ├─┬ express@3.0.0rc2 
    │ ├── commander@0.6.1 
    │ ├─┬ connect@2.4.2 
    │ │ ├── bytes@0.1.0 
    │ │ ├── formidable@1.0.11 
    │ │ ├── pause@0.0.1 
    │ │ └── qs@0.4.2 
    │ ├── cookie@0.0.4 
    │ ├── crc@0.2.0 
    │ ├── debug@0.7.0 
    │ ├── fresh@0.1.0 
    │ ├── methods@0.0.1 
    │ ├── mkdirp@0.3.3 
    │ ├── range-parser@0.0.4 
    │ └─┬ send@0.0.3 
    │   └── mime@1.2.6 
    ├── express-messages@0.0.2 
    ├─┬ hbs@1.0.5 
    │ └─┬ handlebars@1.0.5beta 
    │   ├─┬ optimist@0.3.4 
    │   │ └── wordwrap@0.0.2 
    │   └── uglify-js@1.2.6 
    ├─┬ mongoose@3.0.0 
    │ ├── hooks@0.2.1 
    │ ├─┬ mongodb@1.1.2 
    │ │ └── bson@0.1.1 
    │ └── ms@0.1.0 
    ├─┬ nodemailer@0.3.21 
    │ ├─┬ mailcomposer@0.1.15 
    │ │ └── mimelib-noiconv@0.1.9 
    │ └─┬ simplesmtp@0.1.18 
    │   └── rai@0.1.6 
    ├─┬ passport@0.1.12 
    │ └── pkginfo@0.2.3 
    ├─┬ passport-local@0.1.6 
    │ └── pkginfo@0.2.3 
    ├── password-hash@1.2.1 
    ├─┬ redis@0.7.2 
    │ └── hiredis@0.1.14 
    ├─┬ socketstream@0.3.0RC2 
    │ ├── apitree@1.0.0 
    │ ├─┬ clean-css@0.3.2 
    │ │ └── optimist@0.1.9 
    │ ├── colors@0.6.0-1 
    │ ├── commander@0.5.2 
    │ ├─┬ connect@2.0.3 
    │ │ ├── crc@0.1.0 
    │ │ ├── debug@0.7.0 
    │ │ ├── formidable@1.0.9 
    │ │ ├── mime@1.2.4 
    │ │ └── qs@0.4.2 
    │ ├─┬ connect-redis@1.3.0 
    │ │ ├── debug@0.7.0 
    │ │ └─┬ redis@0.7.2 
    │ │   └── hiredis@0.1.14 
    │ ├── eventemitter2@0.4.9 
    │ ├── redis@0.7.1 
    │ ├── semver@1.0.13 
    │ ├─┬ socket.io@0.9.6 
    │ │ ├── policyfile@0.0.4 
    │ │ ├── redis@0.6.7 
    │ │ └─┬ socket.io-client@0.9.6 
    │ │   ├─┬ active-x-obfuscator@0.0.1 
    │ │   │ └── zeparser@0.0.5 
    │ │   ├── uglify-js@1.2.5 
    │ │   ├─┬ ws@0.4.21 
    │ │   │ ├── commander@0.6.1 
    │ │   │ ├── options@0.0.3 
    │ │   │ └── tinycolor@0.0.1 
    │ │   └── xmlhttprequest@1.2.2 
    │ └── uglify-js@1.2.6 
    ├─┬ ss-hogan@0.1.3 
    │ └── hogan.js@2.0.0 
    ├─┬ ss-stylus@0.1.5 
    │ ├── nib@0.7.0 
    │ └─┬ stylus@0.28.2 
    │   ├── cssom@0.2.5 
    │   ├── debug@0.7.0 
    │   └── mkdirp@0.3.3 
    └── underscore@1.3.3 

Global dependencies should include nodemon:

    ├── nodemon@0.6.14 

Running "node --version" should return:

    v0.8.2

## Front End

### Front End Dependencies

### Compiling CSS

1. Download http://incident57.com/less/
2. Drag folder client/static/css to app
3. Uncheck everything EXCEPT style.less
4. Make changes to any less file in the /bootstrap folder
5. Save the style.less folder and it will auto re-compile style.css

## Questions and Answers

    Question: Will Node.js scale?
    Answer: http://stackoverflow.com/questions/4488614/node-js-vs-java-for-comet-application
        http://stackoverflow.com/questions/4710420/scaling-node-js
        http://amix.dk/blog/post/19613