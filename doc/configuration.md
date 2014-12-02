# Environment Configuration

Each environment will need to be configured. CivicSeed understands three environments:

* **Development** A local development instance of CivicSeed. This is assumed to be the case if the system doesn't specify the following two.
* **Production** The live production deployment. This is currently running in an Amazon S3 environment.
* **Heroku** A staging instance on Heroku.

Configuration that is safe to store publicly are located in the `config/` folder. Variables that need to remain private must be set on the server environment.

## Environment variables

#### Environment

`NODE_ENV` needs to be set on the environment so that the Civic Seed application can bootstrap itself and know which configuration file to load.

* For the Amazon S3 production server, set `NODE_ENV=production`
* For any staging or testing servers on Heroku, set `NODE_ENV=heroku`
* For a local development environment, set `NODE_ENV=development`. Note that if `NODE_ENV` is not set, Civic Seed will _assume_ a development environment.

`SS_ENV` is an optional environment for SocketStream. As of the most recent version of SocketStream, `NODE_ENV` automatically overwrites `SS_ENV` so this may be deprecated.

#### Authentication

Authentication credentials should not be stored in the configuration files because this poses a security risk.

* `REDIS_PW` - Password for the Redis database.
* `EMAIL_USER` - User account name for the mailing service used by Nodemailer.
* `EMAIL_PW` - Account password for the mailing service used by Nodemailer.
* `EMAIL_TO` - E-mail address that feedback from within Civic Seed should be sent to.
* `AWS_ACCESS_KEY` - AWS access key ID for the bucket to upload user profile mugshots to.
* `AWS_SECRET_KEY` - AWS secret access key for the bucket to upload user profile mugshots to.

#### Other

The Heroku or Amazon S3 instances may set other environment variables (e.g. `MONGOHQ_URL`, which comes from a Heroku add-on). These happen automatically assuming the servers have been provisioned correctly, so we won't cover those here.

#### Using an `.env` file

You can use an `.env` file in the Civic Seed project root directory to store environment variables. These will be loaded as if they were stored on the server environment itself, so it keeps you from having to pollute a `.bash_profile` or other similar file. The `.env` file is ignored by Git, but you can back it up in another secure location.

## Configuration files

CivicSeed uses `nconf` to create runtime configuration and environment variables. `nconf` looks for a json config file in the project root folder, based on the environment. The file is named such: `config/[environment].json`. For example, on a production server, the config file is `config/production.json`. An example config file looks like this:

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

Environment variables take precedence over whatever is in the configuration file, so to override any configuration file variable just declare it in the environment or in the `.env` file.

If you really need to, you can set `CONFIG_FILE` in the environment to specify a custom configuration filename that does not match the `NODE_ENV`.


## Other notes about configuration

####  Account Emails

Civic Seed requires an SMTP service that can send multiple emails to users. If email service or credentials are not provided, or are incorrect, Civic Seed will still run but any features that send e-mail will fail.

[Mailgun](http://www.mailgun.com/) is a recommended service that can send out thousands of emails for free. (Google limits to 200 msg/day by comparison.) Refer to [Nodemailer documentation](https://github.com/andris9/nodemailer-wellknown#supported-services) for a list of supported mail services. You can set it using the `EMAIL_SERVICE` variable in the configuration file. Use the email and password provided by this service for the above `EMAIL_USER`, `EMAIL_PW`, and `EMAIL_TO` configuration variables.
