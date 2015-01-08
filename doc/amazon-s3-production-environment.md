# Setting up a production deployment on Amazon S3

These instructions assume that the production server environment is already up and running.

## Updating the production server with new assets

### You need:

* A local repository of CivicSeed.
* The `.pem` file that's required to log in to the S3 instance over SSH. (This can also be added to your Mac OSX keychain so you don't actually need to refer to the file.)
* The `s3cmd` tool installed on your local machine. (An S3 access key and secret key needs to be configured with this beforehand.)

### Step by step instructions

#### Pack your assets locally.

1. Make sure you're in the root folder of the `CivicSeed` repository.
2. Start `mongod` and `redis-server`, as if running a local server.
3. Start the server.

   ```
   SS_PACK=1 npm start
   ```
   You’ll know it’s done when 3 files (HTML, CSS and JS) are created and the server has started.

4. You can now exit out of the server (Ctrl-C).

#### Push assets to remotes.

1. Push new assets to GitHub.

   ```
   git add --all
   git commit -m 'Update static assets for production server'
   git push origin master
   ```

2. If you have new static assets, push them to S3. Static assets include images, vendor stylesheets, and anything else in the `static/` directory.

   ```
   s3cmd sync --acl-public --delete-removed --add-header 'Expires: Fri, 30 May 2015 00:00:00 GMT' --add-header='Cache-Control:no-transform,public,max-age=31536000,s-maxage=31536000' --rexclude "$(<client/static/.s3ignore)" client/static/ s3://civicseed/
   ```

#### Login to the S3 instance.

1. SSH into the S3 instance. (Assuming your `.pem` key is already in your keychain, otherwise use `-i path/to/key.pem`)

   ```
   ssh ec2-user@54.88.15.173
   ```

   You are now in the S3 terminal.

#### On the S3 instance

1. Pull the latest repository from GitHub.

   ```
   cd CivicSeed
   git pull origin
   ```
2. Restart the application.

   ```
   forever -o out.log -e err.log restart bin/server.js
   ```

   Note that for some server-side changes you may need to completely stop the application and then start it again from scratch. For instance, to update node modules or run Civic Seed's bootstrap process.

   ```
   forever stopall
   npm update
   node bin/boot
   forever -o out.log -e err.log start bin/server.js
   ```
