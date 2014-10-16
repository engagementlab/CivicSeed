# Setting up a production deployment on Amazon S3

These instructions assume that the production server is already up and running according to `README.md`.

## Updating the production server with new assets

### You need:

* A local repository of CivicSeed.
* The `.pem` file that's required to log in to the S3 instance over SSH. **Never push this file to GitHub or a remote repository otherwise you risk compromising access to your S3 instance to third parties.**
* The `s3cmd` tool installed on your local machine. (TODO: There may be configuration needed for this; include these instructions.)

### Step by step instructions

#### Pack your assets locally.

1. Make sure you in the root folder of the `CivicSeed` repository.
2. Start `mongod` and `redis-server`, as if running a local server.
3. Start the server with `SS_ENV=production SS_PACK=1 npm start`. You’ll know it’s done when 3 files (HTML, CSS and JS) are created and the server has started.
4. You can now exit out of the server (Ctrl-C).

#### Push assets to remotes.

1. Push new assets to GitHub. `git push origin master`
2. **(optional)** If you have new static assets, push them to S3. Static assets include images, vendor stylesheets, and anything else in the `static/` directory.

Copy and paste this command:

	s3cmd sync --acl-public --delete-removed --add-header 'Expires: Fri, 30 May 2014 00:00:00 GMT' --add-header='Cache-Control:no-transform,public,max-age=31536000,s-maxage=31536000' --rexclude "$(<client/static/.s3ignore)" client/static/ s3://civicseed/

#### Login to the S3 instance.

1. SSH into the S3 instance. `ssh -i civicseed.pem ec2-user@54.225.145.189` You are now in the S3 terminal.

#### On the S3 instance

1. Pull the latest repository from GitHub. Change the folder `cd CivicSeed` and then `git pull origin`.
2. Restart the server. `forever -o out.log -e err.log restart bin/server` Note that for some server-side changes you may need to completely stop the server and then start it again from scratch. `forever stopall` then `forever -o out.log -e err.log start bin/server`
