# Getting started

## Local dependencies

#### Required

Civic Seed is a Node.js-based application which also requires REDIS and MongoDB to run. If you do not already have these services on your local machine, install these.

  * _(Mac OSX only)_ XCode and Command Line Tools
  * [Node.js](http://nodejs.org/) _(requires Node version >= 0.10.x)_
  * [REDIS](http://redis.io/)
  * [MongoDB](http://www.mongodb.org/) (It is easiest to install this via [Homebrew](http://brew.sh/), so get that too if you need it)

#### Optional tools

Optionally, the following tools may be used during the development process. You do not need to install them until you need them.
  * [S3 Tools](http://s3tools.org/s3cmd) - command line tools to assist with [deploying to an Amazon S3 instance](https://github.com/engagementgamelab/CivicSeed/blob/master/doc/amazon-s3-production-environment.md)
  * [Heroku Toolbelt](https://toolbelt.heroku.com/) - command line tools to assist with [deploying to a Heroku environment](https://github.com/engagementgamelab/CivicSeed/blob/master/doc/heroku-environment.md)
  * [Tiled](http://www.mapeditor.org/) - Map editor for generating [tilesheets](https://github.com/engagementgamelab/CivicSeed/blob/master/doc/tilesheets.md) for the game.
  * [Bower](http://bower.io/) - Front end package manager. Some libraries have been retrieved via Bower, but this is very optional.


## Local installation and startup

**1.** Clone the repository:

```
git clone https://github.com/engagementgamelab/CivicSeed.git
```

**2.** Install the project:

```
cd CivicSeed
npm install
```

**3.** Set up your [environment variables](https://github.com/engagementgamelab/CivicSeed/blob/master/doc/environment-configuration.md).

**4.** Run MongoDB and REDIS in the background.

```
redis-server & mongod &
```

**5.** On first startup, you must initialize a database super user in Mongo.

```
node test/boot
```

You can verify that this database exists by running `mongo` and then running `show dbs`. A Civic Seed database with the name given by the `MONGO_URL` configuration variable should be present.

**6.** Start the app. If REDIS and MongoDB are already running, you can just start the app with

```
npm start
```
or

```
nodemon
```

You may do so all in one command from the `CivicSeed` directory (assuming `redis-server` and `mongod` paths are set).

```
redis-server & mongod & npm start
```
