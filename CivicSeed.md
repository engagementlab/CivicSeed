* Log into EC2 instance. info@engagmentgamelab.org   engagement-game-gnomes
* download civicseed-prod.pem
* Open terminal
* Cd in civicseed-prod.pem folder
* chmod 400 civicseed-prod.pem
* ssh-add -K civicseed-prod.pem
* Connect to your NAT instance
* ssh -A ec2-user@AMAZON_PUBLIC_IP
* Check to make sure that your NAT instance can communicate with the internet
* ping ietf.org
* control c to quit
* From NAT instance connect to your Redic instance
* ssh ec2-user@AMAZON_PRIVATE_IP
* Run Redis as a Daemon
* sudo service redis-server start
* Check to make sure that your Redis instance can communicate with the internet
* ping ietf.org
* control c to quit
* go back to your NAT instance or open new terminal instance and connect to NAT server
* From NAT instance connect to your MongoDB instance
* ssh ec2-user@AMAZON_PRIVATE_IP
* Start MongoDB
* sudo service mongod start
* Check to make sure that your MongoDB instance can communicate with the internet
* ping ietf.org
* control c to quit
* You can test the mongo-to-node instance connection by running the following command:
* MONGO_CON=mongodb://[private ip]/test node ~/CivicSeed/test/server/test-connect-mongo.js
* Open a new terminal window
* log into the civicseed-web-prod instance
* ssh -i civicseed-prod.pem ec2-user@[aws-public-ip]
* Start App
* cd ~/CivicSeed/
* forever -o out.log -e err.log start bin/server.js
*
* Next Step on the Node.js instance update the configuration with the private IP for both Redis and Mongodb 
