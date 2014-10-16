# Deploying to Heroku

A Heroku development environment is handy because they're free and easy to set up, and we can have multiple servers to test different multiplayer instances if we wish. Civic Seed currently uses Heroku to host staging and testing environments.

Here is how you set it up. (We'll assume you already have a Heroku account with any SSH keys uploaded and command line tools installed, including the [Heroku Toolbelt](https://toolbelt.heroku.com/).)

1. Create an app, either through the site or command line. The app name can be something of your choosing.

```
heroku apps:create civicseed-dev
```

2. Make sure Heroku is properly set as a Git remote for the Civic Seed repository so that we can push to it later, including any SSH keys you need to add.

3. Install add-ons. We'll use [MongoHQ](https://addons.heroku.com/mongohq) and [Redis To Go](https://addons.heroku.com/redistogo). Both have free tiers which will be enough for testing purposes.

```
heroku addons:add mongohq
heroku addons:add redistogo
```

4. Verify that the add-ons are installed.

```
heroku config
```
You should see two environment variables set, `MONGOHQ_URL` and `REDISTOGO_URL`.

5. Set other environment variables needed for Civic Seed. See below in the section called _Environment variables_.

6. Push the repository to Heroku.

```
git push heroku master
```

7. To run the first boot of the server, we need to run `node test/boot` through Foreman, like so:

```
heroku run node test/boot
```

You should receive log messages from heroku stating that the superuser admin has been saved to MongoDB.

8. Now you should be able to go to `http://civicseed-dev.herokuapp.com/` (or whatever the app name is), log in as superuser, and complete the rest of the data initialization.

### Environment variables
* `heroku config:set NODE_ENV=heroku` (The server script will check this to see if we are in a Heroku environment.)
* `heroku config:set CLOUD_PATH=''` (That's a blank entry)
* `heroku config:set EMAIL_USER='postmaster@sandbox###.mailgun.org'` (This is the auth user for the email service used, default is Mailgun.)
* `heroku config:set EMAIL_PW='password'` (Password for to auth email service)
* `heroku config:set EMAIL_TO='email@domain.com'` (E-mail address to send feedback and forms to)
You should not need to set the `REDIS_PW` environment variable on Heroku since it will be parsed from Redis To Go's `REDISTOGO_URL` environment variable.

### Resetting everything

To reset everything, you should install a fresh copy of the Civic Seed repository in step 7, if necessary, then re-do the boot process in steps 8 and 9.
