# Deploying to Amazon AWS

Civic Seed currently deploys to AWS instances for its production server. The following instructions are for setting up a new environment on AWS, redeploying new code and starting/restarting the server. A simplified set of instructions for just updating the AWS instance can be found [here](https://github.com/engagementgamelab/CivicSeed/blob/master/doc/amazon-s3-production-environment.md).

**NOTE** Amazon AWS is a pretty complex set up. They have also adjusted some of their processes and services over time, so portions of these instructions below may become obsolete in the future unexpectedly. When that happens be sure to verify steps with the [AWS Documentation](http://aws.amazon.com/documentation/), and searching the Internet (e.g. Stack Overflow) is your friend.

## Overview

As of November 2014, Civic Seed uses four EC2 server instances, connected in a Virtual Private Cloud (VPC), one S3 bucket for static assets, and a Route 53 hosted zone for the domain name. First, set up the VPC.

### Setting up the Virtual Private Cloud

We only need [a basic VPC](http://docs.aws.amazon.com/AmazonVPC/latest/GettingStartedGuide/GetStarted.html) so you can use the VPC wizard to set up a simple one. It should have a public subnet and a private subnet (the EC2 instances are split across these, as described below). Name it "Civic Seed". You also need to [set up an Internet gateway](http://docs.aws.amazon.com/AmazonVPC/latest/UserGuide/VPC_Internet_Gateway.html) and assign an elastic IP to the VPC.

### Launching EC2 instances

The EC2 instances are:

* A public web server which hosts the Civic Seed repository, runs Node.js, and serves files.
* A private server that runs Redis.
* A private server that runs MongoDB.
* A public NAT server which routes outbound Internet traffic from the private servers (for instance, to download software updates.)

These are the [general instructions for launching an Amazon EC2 instance](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-launch-instance_linux.html). Specific instructions for each instance are further down below.

### Creating a S3 bucket

Setting up an S3 bucket is fairly easy. Civic Seed expects the bucket to be named `civicseed`. You can change this in the `CLOUD_PATH` configuration variable. Buckets use a shared namespace across all of Amazon AWS, so deployments that want their own S3 bucket will need to create a new one and modify the code as needed.

There is a second S3 bucket used for user profile mugshot uploads, called `civicseeders`. You can change this in the `MUGSHOTS_S3_BUCKET` configuration variable. This is a separate bucket because we want to keep the uploader's destination bucket physically (or metaphorically) separate from the static assets, to prevent actions or scripts from accidentally interfering with either bucket.

Make sure to [double check CORS permissions](https://docs.aws.amazon.com/AmazonS3/latest/dev/cors.html#how-do-i-enable-cors) so that Civic Seed can access assets.

### Setting up Route 53

A Route 53 hosted zone allows the civiseed.org domain name to point at the Amazon EC2 web instance. Here are the basic steps for setting it up.

1. Go to the Route 53 console in AWS, and create a new Hosted Zone for "civicseed.org"
2. Once it is created, select it, and go to its record set. It should already have a name server (NS) record and a SOA record.
3. Add an A record. Set the value to the Civic Seed web EC2 instance’s public IP. Leave all other fields alone.
4. Set up TXT records [required by the Mailgun service](http://documentation.mailgun.com/user_manual.html#verifying-your-domain), which we use to send mail from civicseed.org. The first is a TXT record whose value is `"v=spf1 include:mailgun.org ~all"` ([SPF](http://www.openspf.org/Introduction)) (include quotes). The second is a TXT record for [DKIM](http://www.dkim.org/#introduction) and is a crypto string. Get that from the Mailgun account.
5. Finally, click on the hosted zone and take note of the "delegation set." These will be the name servers that you must provide to the domain registrar (for civicseed.org, the registrar is GoDaddy.)
6. Set (or change) the nameservers for `civicseed.org` on the platform host. Wait some time for the DNS changes to propagate through the Internet.


## Access credentials (SSH)

Working with AWS EC2 instances through a terminal requires SSH and [a private key file](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html) to log in. This file is created when the servers were set up for the first time, so you should continue to use the same one for all Civic Seed-related serevers. For Civic Seed this file is called `civicseed-prod.pem`. (There is also a `civicseed.pem` for an older server environment floating around.)

Never check this file into Git and never store it in a publicly accessible location.

Make sure the permissions are set correctly (Amazon will refuse to let you log in if permissions on this file are too loose):

```
chmod 400 civicseed-prod.pem
```

To login to an AWS instance:

```
ssh -i civicseed-prod.pem ec2-user@[aws-public-ip]
```

To ease the login process, you can add the private key file to a Mac OSX keychain. Then you can login like so:

```
ssh-add -K civicseed-prod.pem
ssh ec2-user@[aws-public-ip]
```

To login to a private instance, login to the public instance first with the `-A` parameter. This "forwards" your credentials through the servers so that you do not need to have a `.pem` file present on the public AWS instance itself.

```
ssh -A ec2-user@[aws-public-ip]
```


## Launching and configuring EC2 instances

Here is how to launch and configure each EC2 instance, as of November 2014.

### Public web (Node.js) instance

This is the instance that will host and run the Node.js repository.

1. From the EC2 console, click the “Launch Instance” button.
2. On the “Choose AMI” step, select the default Amazon Linux AMI (HVM) instance.
3. On “Choose Instance Type”, select the “t2.micro” micro instance.
4. Next step - set up VPC. Connect with the Civic Seed VPC set up above. Make sure it is using the public subnet.
4. Click “Review and Launch.”
5. On the “Review Instance Launch” step you will be told the security group is insecure. Click on “Edit” to configure the security group.
6. Name it “civicseed-1” (it can be anything really)
7. Add an HTTP rule for port 80
8. Continue to launch the instance.
9. Set up a key pair file if there is not already one. It should already be there, so if it's in the list, associate it with `civicseed-prod.pem`
10. Wait for the initialization to finish.
11. SSH into the instance (see access credentials, above).
12. Update the server software if needed.
    ```
    sudo yum update
    ```

13. Install Git.
    ```
    sudo yum install git
    ```

14. [Install Node.js and NPM](https://github.com/joyent/node/wiki/installing-node.js-via-package-manager#enterprise-linux-and-fedora)
    ```
    curl -sL https://rpm.nodesource.com/setup | sudo bash -
    sudo yum install -y nodejs
    curl -L https://npmjs.org/install.sh | sudo sh
    ```

15. Install additional dependencies that are needed for node packages (e.g. bcrypt seems to require a few of these)
    ```
    sudo yum install gcc-c++ make
    sudo yum install openssl-devel
    ```

16. Clone the CivicSeed repository from GitHub.
    ```
    git clone https://github.com/engagementgamelab/CivicSeed.git ~/CivicSeed
    ```

17. Install node dependencies. Civic Seed also relies on forever to keep the app running, so make sure to install this as a global dependency.
    ```
    npm install
    sudo npm install -g forever
    ```

18. Set `ulimit` (see below) and reboot the server. Wait for it to finish then SSH log in again.
19. Set the `iptables` configuration (see below) to forward port 80 web traffic to the Node server listening on port 8000.
20. Set up environment variables (see [environment configuration document](configuration.md)). This step will be complete after setting up the Redis and MongoDB configuration as well, in case you need to override private IPs you can do it here or update `config/production.json`

    ```
    touch .env
    vi .env
    ```

### Public NAT instance

You need to make sure that a [NAT instance is set up to handle external communications](http://docs.aws.amazon.com/AmazonVPC/latest/UserGuide/VPC_NAT_Instance.html). This instance will be on the VPC's public subnet. A route table, associated with the private subnet, is set to direct web traffic to the NAT instance. Follow Amazon’s instructions to make sure that servers in the private subnet, like Redis, can reach the Internet, so that you can actually install things.

If you set up the VPC with a wizard, there should already be an instance in the public subnet you can use as a NAT, but if you need to customize it for any reason it may be easier to launch a new one from scratch.


### Private Redis instance

CivicSeed uses Redis for "pubsub" real-time communication and RPC listeners for game interaction (and more). Launching a Redis instance will follow much of the instructions above, with some differences.

1. On the AWS EC2 console, launch a generic instance of Amazon Linux on type `t2.micro` (there does not seem to be any good Amazon Marketplace instances at this time, _that we know about_). Add it to the private subnet for Civic Seed VPC. Name it `civicseed-redis`. Create a security group that includes an inbound rule for TCP port 6379 (the port Redis listens on). Change the source IPs to the IP range of the public subnet on your VPC (probably `10.0.0.0/24`). You do not need to add a port 80 since Redis will not listen for any HTTP traffic.
2. Login to the Redis instance via SSH. [Ensure that the instance can reach the Internet](http://docs.aws.amazon.com/AmazonVPC/latest/UserGuide/VPC_NAT_Instance.html).
3. Run `sudo yum install update` if prompted by the instance.
4. Set `ulimit` as described below. Reboot the server for changes to take effect.
5. Install Redis, following this [this guide](http://www.codingsteps.com/install-redis-2-6-on-amazon-ec2-linux-ami-or-centos/). You may want to use the latest version of Redis instead of 2.6. So far version 2.8.17 works. **NOTE:** These instructions tell you to add `bind 127.0.0.1` to `redis.conf` -- ignore that instruction, since you want Redis to listen on incoming IPs. **Do not start the Redis server on this step yet.**
6. According to the [Redis Administration Setup Hints](http://redis.io/topics/admin) you want to run this command:

   ```
   sudo sysctl vm.overcommit_memory=1
   ```

   Or, `sudo vi /etc/sysctl.conf` and add `vm.overcommit_memory=1` to end. (This may be more permanent?)
7. Finally, run Redis as a daemon.

   ```
   sudo service redis-server start
   ```
8. Logout. Make sure you note the private IP address of the Redis server from the AWS console and update the configuration on the Node.js instance if needed.

If you ever need to restart the server (say, after making changes to configuration)

```
sudo service redis-server restart
```


### Private MongoDB instance

CivicSeed uses MongoDB for a data store. Please follow [this guide](http://docs.mongodb.org/ecosystem/platforms/amazon-ec2/) to install an AWS EC2 instance. Amazon Marketplace MongoDB instances are built to just work out of the box on startup.

1. When launching an instance, go to the AWS market place and select the most basic tier MongoDB official AMI "MongoDB with 1000 IOPS."  Put in the CivicSeed VPC and in the private subnet.
2. In the security group, allow inbound traffic on custom TCP port 27017. Set the source IP to anywhere in the public subnet IP range (likely `10.0.0.0/24`).
3. Once instance is up, SSH into the private instance. If the NAT gateway is set up correctly this instance should also have external web access.
4. Update the server if needed.
   ```
   sudo yum update
   ```
5. Not sure if the service is already started as part of the AMI, but this doesn't hurt:
   ```
   sudo service mongod start
   ```
6. Logout. Make sure you note the private IP address of the MongoDB server from the AWS console and update the configuration on the Node.js instance if needed.

You can test the mongo-to-node instance connection by running the following command:

```
MONGO_CON=mongodb://[private ip]/test node ~/CivicSeed/test/server/test-connect-mongo.js
```


### Running Civic Seed

Once all the instances are set up, hooked up, and running, you are ready to start the Civic Seed program!

#### Start Up

To start the app:

```
cd ~/CivicSeed/
forever -o out.log -e err.log start bin/server
```

If the app is already running, to avoid downtime, use the restart command instead (for example, if you've just updated using `git pull`):

```
forever -o out.log -e err.log restart bin/server
```

#### Updating the App

```
git pull origin
npm update
forever -o out.log -e err.log restart bin/server
```

#### Troubleshooting

You can list check the running instance:

```
forever list
```

Or check the logs:

```
cat err.log
cat out.log
```

To check the environment variables:

```
set
```

To actually stop the server:

```
forever stopall
```


## How-to's for various things

#### Adjust instances with `ulimit`

Because CivicSeed uses web sockets, we need to check the `ulimit` and make sure the number is sufficiently high. Amazon's default AMIs apparently leave it really low. Make sure you set the `ulimit` for the Node.js and Redis instances (if you are starting a MongoDB instance from the AWS Marketplace, it should [already be set](http://docs.mongodb.org/ecosystem/platforms/amazon-ec2/).) To check the current `ulimit` of an instance, SSH into the given instance, and run the following command:

```
ulimit -n
```

Setting the ulimit to the correct number (probably) depends on the instance type, however, following [this stackoverlow answer](http://stackoverflow.com/questions/11342167/how-to-increase-ulimit-on-amazon-ec2-instance/11345256#11345256) `20000` appears to be a good number. You will need to set hard and soft limits:
```
sudo nano /etc/security/limits.conf
```

```
#<domain>   <type>  <item>   <value>
*           soft    nofile   20000
*           hard    nofile   20000
```

Again, this number should be adjusted to fit the instance type and server setup.

After setting the `ulimit` for each instance, reboot the instances.

#### Port routing with `iptables`

SSH into the Node.js instance and set up an `iptables` entry to redirect EC2's port 80 listening to port 8000, which allows us to run a Node app without `sudo`. (More information on this is available at [this gist](https://gist.github.com/kentbrew/776580).)

```
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 8000
```

To list what routes exist in the `iptables`, run the following command. You should see the following `REDIRECT` line. If you do not see it, add it using the command above.

```
$ sudo iptables -t nat -L
Chain PREROUTING (policy ACCEPT)
target     prot opt source               destination
REDIRECT   tcp  --  anywhere             anywhere             tcp dpt:http redir ports 8000

[...]
```

Without this, the server will not be reachable.

__NOTE:__ You may have to redo this if the server is rebooted. That is why this should occur after the `ulimit` step, for instance.


#### Mongo DB admin tasks

You can view the MongoDB logs if needed:

```
sudo cat /var/log/mongo/mongod.log
```

In rare cases, you may need to kill running MongoDB instances and restart. Here's a quick run of commands:

```
ps auxwww | grep mongod
sudo kill [the number(s)] # (run this for each number)
sudo mongod --dbpath=/data --repair
sudo chkconfig mongod on
sudo /etc/init.d/mongod start
```

##### To backup MongoDB data:

On the MongoDB server:

```
mongodump
zip -rv civicseed_mongo_backup.zip dump/[databasename]/
```

On your local machine:

```
scp -i ~/.ssh/civicseed.pem ec2-user@[instanceaddress]:/home/ec2-user/dump/civicseed_mongo_backup.zip ~/Desktop
```

#### Data Initialization

Before initializing data, we need to make sure there's a super admin to create startup data. To create a temporary user, open a new terminal window and run the following command in the `/CivicSeed` project directory:

```
node bin/boot
```

This command will load a temporary super admin user with username `temp` and password `temp`. This will allow you to authenticate and initialize the rest of the database.

To initialize data in the databases, once the app is running, sign in using the temporary credentials and navigate to `Admin Console` -> `Startup` (located at `/admin/startup`). On this page is a series of load buttons. (*Data is found in .json files in the `/data` folder of the project, if you wish to modify data before loading.*)

**The loading buttons users, game, colors, and chat only delete and reset the default data (testing users, demo users).  To delete real game data, you must go into the mongo instance and remove them (this is to prevent accidently wiping critical info)

In order to "reset" npc and botanist, it is recommended to use the mongoimport command and use the data files in `data/backup`.  This is due to the fact that while there are original data files in data folder, they aren't up to date since you can always make changes in the admin interface to both the npc and tile data sets.  Therefore it is recommended to occasionally do a mongoexport of these two data sets from production in case a reset is needed.

### Export /Import Data

To export:

```
mongoexport --db civicseed_testing --collection collection_name --out file_name.json
```

To import:

```
mongoimport --db civic_testing --collection collection_name --file file_name.json --drop
```

To move file from server to local:

```
scp -i yourpemkey.pem ec2-user@ipaddress:file_name.json ~/Desktop
```

*Note, when the users are reloaded, this also deletes the `temp` super admin user.*

### Deployment

Before deploying the application, you'll want to pack the assets locally for production. (Technically this can be done in production, but it's not advised.)

```
SS_PACK=1 npm start
```

You'll need to use the `sudo` command if you're using a production client port lower than 1024:

```
sudo SS_PACK=1 npm start
```

Once the app is running and assets are packed, make sure to commit the compiled assets (`/client/assets/*`) to git and push them up to where you're hosting static assets.

#### Static Assets

CivicSeed uses Amazon S3 to store static files. Several 3rd party tools are available for managing these files (3Hub, CyberDuck), or you can use the website to upload. However because of header caching and automatic syncing concerns, it is better to use a command line tool called "s3cmd". This tool can be installed easily with homebrew:

```
brew install s3cmd
```

Once installed, run the following command (found at the [s3cmd website](http://s3tools.org/s3cmd)), and follow the simple config instructions:

```
s3cmd --configure
```

You will need your [S3 user access key and secret key handy for the configuration](http://blogs.aws.amazon.com/security/post/Tx1R9KDN9ISZ0HF/Where-s-my-secret-access-key). For all other configuration options (e.g. encryption) that is up to you, but you can press Enter to skip those.

Once the configuration is set up, make sure you are in the root of the Civic Seed game folder (`cd CivicSeed`). From the root folder run the following command to sync the static folder with S3.

```
s3cmd sync --acl-public --delete-removed --add-header 'Expires: Fri, 30 May 2015 00:00:00 GMT' --add-header='Cache-Control:no-transform,public,max-age=31536000,s-maxage=31536000' --rexclude "$(<client/static/.s3ignore)" client/static/ s3://civicseed/
```

#### Caching

Remember to set S3 cache headers `max-age` and/or `Expires` headers to files during upload. One year is `31536000`, but it's probably better in this case to set it to three years (`94608000`), since who knows how long things won't change. We can always cache bust it. Note from s3cmd above the following:

```
  ... --add-header='Cache-Control:public,max-age=94608000' ...
```

Other helps:

- http://html5boilerplate.com/html5boilerplate-site/built/en_US/docs/cachebusting/
- http://www.newvem.com/how-to-add-caching-headers-to-your-objects-using-amazon-s3/
- https://developers.google.com/speed/articles/caching
- https://github.com/s3tools/s3cmd/issues/37
- http://www.newvem.com/how-to-add-caching-headers-to-your-objects-using-amazon-s3/
- http://stackoverflow.com/questions/3142388/how-to-make-10-000-files-in-s3-public
- http://awspolicygen.s3.amazonaws.com/policygen.html

#### GZipping

  See: http://stackoverflow.com/questions/9988407/set-metadata-while-using-s3cmd-to-upload-static-website-to-amazon-s3
  And: https://github.com/s3tools/s3cmd/issues/37

```
  ... --add-header='Content-Encoding: gzip' ... ???
```
