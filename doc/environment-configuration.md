# Environment Configuration

Each environment will need to be configured. CivicSeed understands three environments:

* **Development** A local development instance of CivicSeed. This is assumed to be the case if the system doesn't specify the following two.
* **Production** The live production deployment. This is currently running in an Amazon S3 environment.
* **Heroku** A staging instance on Heroku.

Configuration that is safe to store publicly are located in the `config/` folder. Variables that need to remain private must be set on each environment and are not stored here.

## Configuration files

CivicSeed uses `nconf` to create runtime configuration and environment variables. `nconf` looks for a json config file in the project root folder, based on the environment. The file is named such: `config_[environment].json`. For example, in `PRODUCTION` the config file looked for by `nconf` is `config_production.json`. The exception to this is the local/development file which is called simply `config.json`. An example config file looks like this:

```json
{
  "NAME": "Civic Seed",
  "PORT": 80,
  "USE_REDIS": true,
  "REDIS_HOST": "sample.redis.host.com",
  "REDIS_PORT": 6379,
  "MONGO_URL": "mongodb://sample-user@sample.mongodb.host.com:10099/civicseed",
  "EMAIL_SERVICE": "Mailgun",
  "CLOUD_PATH": "http://sample.cloud.path.com"
}
```

## Environment variables

Certain variables, like authentication credentials, should not be stored in configuration files because this poses a security risk. The following environment variables are required to run Civic Seed and should be not be set in the configuration files:

* `REDIS_PW` - Password for the Redis database.
* `EMAIL_USER` - User account name for the mailing service used by Nodemailer.
* `EMAIL_PW` - Account password for the mailing service used by Nodemailer.
* `EMAIL_TO` - E-mail address that feedback from within Civic Seed should be sent to.
* `NODE_ENV` - Set to `production` on Amazon S3 and `heroku` on Heroku.
* `SS_ENV` - Set to `production` on Amazon S3.

Your actual environment (e.g. Heroku or Amazon S3) may set other environment variables (e.g. `MONGOHQ_URL`).

To pass environment variables directly to Civic Seed without storing it, type any number of them consecutively before running `npm start`, for instance: `EMAIL_USER=user@domain.com EMAIL_PW=password EMAIL_TO=otheruser@otherdomain.com npm start`


#### Account Emails

Civic Seed requires an SMTP service that can send multiple emails to users. [Mailgun](http://www.mailgun.com/) is a recommended service that can send out 1000s of emails for free. (Google limits to 200 msg/day by comparison.) Refer to [Nodemailer documentation](http://www.nodemailer.com/docs/smtp) for a list of supported mail services. You can set it using the `EMAIL_SERVICE` variable in the configuration file.

Use the email and password provided by this service for the above `EMAIL_USER`, `EMAIL_PW`, and `EMAIL_TO` configuration variables.

(TODO: What happens if no SMTP service is provided? Civic Seed should still run if the settings are not provided.)
