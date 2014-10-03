# Getting started


## Local dependencies

Civic Seed is a Node.js-based application which also requires REDIS and MongoDB as to run. If you do not already have these services on your local machine, install these.

  * [Node.js](http://nodejs.org/) _(requires Node version >= 0.10.x)_
  * [REDIS](http://redis.io/)
  * [MongoDB](http://www.mongodb.org/)

Optionally, the following tools may be used during the development process. You do not need to install them until you need them.

  * [S3 Tools](http://s3tools.org/s3cmd) - command line tools to assist with [deploying to an Amazon S3 instance](https://github.com/engagementgamelab/CivicSeed/blob/master/doc/amazon-s3-production-environment.md)
  * [Heroku Toolbelt](https://toolbelt.heroku.com/) - command line tools to assist with [deploying to a Heroku environment](https://github.com/engagementgamelab/CivicSeed/blob/master/doc/heroku-environment.md)
  * [Tiled](http://www.mapeditor.org/) - Map editor for generating [tilesheets](https://github.com/engagementgamelab/CivicSeed/blob/master/doc/tilesheets.md) for the game.
  * [Bower](http://bower.io/) - Front end package manager. Some libraries have been retrieved via Bower, but this is very optional.


## Local installation and startup

First, clone the repository (or fork it):

```
git clone https://github.com/engagementgamelab/CivicSeed.git
```

Then install the project:

```
cd CivicSeed
npm install
```

Set up your [environment variables](https://github.com/engagementgamelab/CivicSeed/blob/master/doc/environment-configuration.md).

Start the app. REDIS and MongoDB should be running in the background. If they have not started, you may do so all in one command from the `CivicSeed` directory (assuming `redis-server` and `mongod` paths are set).

```
redis-server & mongod & npm start
```

If REDIS and MongoDB are already running, you can just start the app with

```
npm start
```

[or]

```
nodemon
```

