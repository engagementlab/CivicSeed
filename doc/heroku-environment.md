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

7. To run the first boot of the server, we need to run `node bin/boot` through Foreman, like so:
  ```
  heroku run node bin/boot
  ```
You should receive log messages from heroku stating that the superuser admin has been saved to MongoDB.

8. Now you should be able to go to `http://civicseed-dev.herokuapp.com/` (or whatever the app name is), log in as superuser, and complete the rest of the data initialization.

### Environment variables

You can set all [environment variables](configuration.md) through the command line. (Alternatively you can use Heroku's dashboard interface if you desire.)

```
heroku config:set NODE_ENV='heroku'
heroku config:set CLOUD_PATH=''
heroku config:set EMAIL_USER='postmaster@sandbox###.mailgun.org'
heroku config:set EMAIL_PW='password'
heroku config:set EMAIL_TO='email@domain.com'
```
You will need to obtain actual values for `EMAIL_USER`, `EMAIL_PW` and `EMAIL_TO`.

It is not necessary to set other environment variables that are not included in the list above. For instance, the `REDIS_PW` environment variable does not need to be set on the Heroku environment since Civic Seed will parse those from the variables created by the Redis To Go add-on.


### Resetting everything

To reset everything, push a fresh copy of the Civic Seed repository in step 6 if necessary, then re-do the boot process in steps 7 and 8.
