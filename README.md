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

### Start the app

    node app.js

### Start the app in dev mode

    nodemon app.js

### List of Dependencies After Installation:

    npm list
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
    │ │ └── debug@0.7.0 
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
    │ │   ├─┬ ws@0.4.16 
    │ │   │ └── options@0.0.3 
    │ │   └── xmlhttprequest@1.2.2 
    │ └── uglify-js@1.2.6 
    ├─┬ ss-hogan@0.1.3 
    │ └── hogan.js@2.0.0 
    └─┬ ss-stylus@0.1.3 
      ├── nib@0.4.1 
      └─┬ stylus@0.25.0 
        ├── cssom@0.2.3 
        ├── debug@0.7.0 
        └── mkdirp@0.3.3 

Global dependencies should include nodemon:

    ├── nodemon@0.6.14 

Running "node --version" should return:

    v0.6.15

## Running the app

    nodemon server.js

## File Structure

    /lib 
      /app 
        index.js 
      /server 
        index.js 
    /public 
      /css 
      /img 
      /js 
      /gen 
    /styles 
      /app 
        index.styl 
      404.styl 
      base.styl 
      reset.styl 
    /views 
      /app 
        index.html 
      404.html 
    .gitignore 
    package.json 
    README.md 
    server.js

## Questions and Answers

    Question: Will Node.js scale?
    Answer: http://stackoverflow.com/questions/4488614/node-js-vs-java-for-comet-application
        http://stackoverflow.com/questions/4710420/scaling-node-js
        http://amix.dk/blog/post/19613