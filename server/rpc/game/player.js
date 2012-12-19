// COMPARE SHARED.ACCOUNT JS FILE
// var rootDir = process.cwd();
// var service = require(rootDir + '/service');
// var UserModel = service.useModel('user');

var intervalId = {};
var numActivePlayers = 0;
// var numPlayers = 0;
var players = {};

var service, db, userModel, tileModel;

exports.actions = function(req, res, ss) {

	req.use('session');
	// req.use('debug');
	// req.use('account.authenticated');

	// console.log('CS:'.blue + ' player RPC request ---->'.magenta);
	// console.log(JSON.stringify(req).slice(0, 100).magenta + '...'.magenta);
	// Russ, it's all hooked up. Access the db via ss.db
	//console.log(ss.db);
	return {

		//MUST MAKE IT SO YOU CAN ONLY INIT ONCE PER SESSION
		init: function() {

			// load models and database service only once
			service = ss.service;
			userModel = service.useModel('user', 'ss');
			tileModel = service.useModel('tile', 'ss');
			
			//should we pull the game info from the db instead of it being passed in a session?
			var playerInfo = {
					id: req.session.userId,
					name: req.session.name,
					game: req.session.game
				};

			//send the number of active players and the new player info
			res(playerInfo);

		},

		addPlayer: function(info) {
			players[info.id] = info;
			numActivePlayers += 1;
			ss.publish.all('ss-addPlayer',numActivePlayers, info);
		},
		exitPlayer: function(info, id) {
			
			//update redis
			req.session.game = info;
			req.session.save();
			
			//update mongo
			userModel.findById(id, function (err, user) {
				user.game = info;

				user.save(function (y) {
					numActivePlayers -= 1;
					ss.publish.all('ss-removePlayer', numActivePlayers, id);
					delete players[id];
				});
			});
		},

		getOthers: function() {
			res(players);
		},

		// ------> this should be moved into our map rpc handler???
		getMapData: function(x1,y1,x2,y2) {
			// tileModel.findOne(function(err,query){
			// 	res(query);
			// });				
			//tileModel.find().gte('x', x1).gte('y',y1).lt('x',x2).lt('y',y2);
			tileModel
			.where('x').gte(x1).lt(x2)
			.where('y').gte(y1).lt(y2)
			.sort('mapIndex')
			.find(function (err, allTiles) {
			 		if (err){
			 			res(false);
			 		}
				if (allTiles) {
					res(allTiles);
				}
			});
			// quadrants.find({ quadrantNumber: quadNumber }, function(err, quad) {
			// 	res(err, quad, index);
			// });
			//return set of tiles based no bounds
		},
		
		movePlayer: function(pos, id) {

			//send out the moves to everybody
			ss.publish.all('ss-playerMoved', pos, id);
			res(true);
		},

		savePosition: function(info) {
			// players[info.id].game.position.x = info.x;
			// players[info.id].game.position.y = info.y;
			//console.log(info);
			req.session.game = info;
		},
		dropSeed: function(bombed) {

			//welcome to the color server
			//here, we will run through the array of tiles passed to us, call them from the db,
			//and update them if necessary (better way? is to do this on client, but client needs
			//to have the other viewports loaded as well)
			var num = bombed.length,
				cur = 0,
				index = 0;
			//add the color to the database for official business
			var saveColors = function(i) {
				index = bombed[i].y * 142 + bombed[i].x;

				tileModel.findOne({ 'mapIndex': index }, function (err, oldTile) {
					
					//do the magic here of blending
					//if there is a color, then we will need to modify it
					if(oldTile.color.owner !== undefined) {

						//if the old one is a nobody -
						if(oldTile.color.owner === 'nobody') {
							
							//if the NEW one should be owner
							if(bombed[i].color.owner !== 'nobody') {
								oldTile.set('color', bombed[i].color);
							}

							//new one should be modified
							else {
								//if there is still room
								if(oldTile.color.a < 0.7 ) {

									var prevR = oldTile.color.r,
										prevG = oldTile.color.g,
										prevB = oldTile.color.b,
										prevA = oldTile.color.a;

									var weightA = prevA / 0.1,
										weightB = 1;

									var newR = Math.floor((weightA * prevR + weightB * bombed[i].color.r) / (weightA + weightB)),
										newG = Math.floor((weightA * prevG + weightB * bombed[i].color.g) / (weightA + weightB)),
										newB = Math.floor((weightA * prevB + weightB * bombed[i].color.b) / (weightA + weightB));

									bombed[i].color.a = Math.round((oldTile.color.a + 0.1) * 10) / 10,
									bombed[i].color.r = newR,
									bombed[i].color.g = newG,
									bombed[i].color.b = newB;
									
									oldTile.set('color', bombed[i].color);
								}
							}
						}
						else {
							bombed[i].color = oldTile.color;
						}
					}
					//if there is no color, then full on use the new values
					else {
						oldTile.set('color', bombed[i].color);
					}

					oldTile.save(function(y) {
						cur += 1;
						if(cur < num) {
							saveColors(cur);
						}
						else {
							//we are done,send out the color information to each client to render
							ss.publish.all('ss-seedDropped', bombed);
						}
					});
				});
			};
			saveColors(0);
		}
	};
}