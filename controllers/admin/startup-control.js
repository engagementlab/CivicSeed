var rootDir = process.cwd();
var fs = require('fs');
var dbActions = require(rootDir + '/modules/utils/databaseActions');
var environment;
var nodeEnv;
var User;
var Invitee;

var handleError = function(message, err) {
	if(err) {
		if(message.length < 1) {
			message = 'Error: %s'
		}
		console.error(message, err);
		// process.exit(1);
		throw err;
	}
};

var self = module.exports = {

	service: null,
	// users: null,
	// emailUtil: null,

	init: function (app, service, hbs) {

		environment = service.environment;
		nodeEnv = environment.app.nodeEnv;
		User = service.useModel('user').UserModel;
		Invitee = service.useModel('user', 'preload').InviteeModel;

		self.service = service;

		app.get('/admin/startup', function(req, res) {

			var consoleOutput;
			Invitee.collection.distinct('sessionName', function(err, invitees) {
				if(err) {
					console.error('Could not find document: %s', err);
				}
				// console.log(invitees);
				res.render('admin/startup.hbs', {
					title: 'Startup',
					bodyClass: 'admin startup',
					nodeEnv: nodeEnv,
					consoleOutput: consoleOutput,
					message: 'Startup admin panel.',
					invitees: invitees,
				});
			});

		});

		// adding users to database
		app.get('/admin/startup/users', function(req, res) {
			if(nodeEnv) {
				var userData = require(rootDir + '/data/users');
				var userModel = service.useModel('user', 'preload').UserModel;
				console.log('\n\n   * * * * * * * * * * * *   Pre-Loading Users   * * * * * * * * * * * *   \n\n'.yellow);
				dbActions.dropCollection('users', function() {
					dbActions.saveDocuments(userModel, userData.global, function() {
						res.send('Users loaded...');
					});
				});
			} else {
				res.send('There was an error retrieiving any data...');
			}
		});

		// adding tiles to database
		app.get('/admin/startup/tiles', function(req, res) {
			if(nodeEnv) {
				var tileData = require(rootDir + '/data/tiles');
				var tileModel = service.useModel('tile', 'preload');
				console.log('\n\n   * * * * * * * * * * * *   Pre-Loading Tiles   * * * * * * * * * * * *   \n\n'.yellow);
				dbActions.dropCollection('tiles', function() {
					var i,
					tileObject = tileData.global,
					backgroundArray = tileObject.backgroundArray,
					background2Array = tileObject.background2Array,
					foregroundArray = tileObject.foregroundArray,
					tileStateArray = tileObject.tileStateArray,
					numberOfTiles = backgroundArray.length,
					mapTilesWidth = service.environment.map.mapTilesWidth,
					mapTilesHeight = service.environment.map.mapTilesHeight,
					mapX,
					mapY,
					tileStateVal,
					tiles = [];

					// dbActions.saveDocuments(tileModel, tileData.global);

					// (re)constructing tile data based on data dump from third party tool
					for(i = 0; i < numberOfTiles; i++) {
						mapX = i % mapTilesWidth;
						mapY = Math.floor(i / mapTilesWidth);

						//add the tile to the array
						//tileState: -1 if nothing (go!), -2 if something (nogo!), the index if it's an NPC
						//checking values are arbitrary right now,
						//based on the image used in tiled map editor
						if(tileStateArray[i] === 0) {
							tileStateVal = -1;
						}
						else if(tileStateArray[i] === 4) {
							tileStateVal = i;
						}  
						else {
							tileStateVal = -2;
						}
						tiles.push({
							x: mapX,
							y: mapY,
							tileState: tileStateVal,
							isMapEdge: (mapX === 0 || mapY === 0 || mapX === mapTilesWidth - 1 || mapY === mapTilesHeight - 1) ? true : false,
							background: backgroundArray[i],
							background2: background2Array[i],
							foreground: foregroundArray[i],
							mapIndex: i
						});

					}
					dbActions.saveDocuments(tileModel, tiles, numberOfTiles, function() {
						res.send(numberOfTiles + ' tiles loaded...');
					});
				});
			} else {
				res.send('There was an error retrieiving any data...');
			}
		});

		// adding gnome and npcs to database
		app.get('/admin/startup/npcs', function(req, res) {
			if(nodeEnv) {
				var npcData = require(rootDir + '/data/npcs');
				var npcModel = service.useModel('npc', 'preload').NpcModel;
				var gnomeData = require(rootDir + '/data/gnome');
				var gnomeModel = service.useModel('npc', 'preload').GnomeModel;
				console.log('\n\n   * * * * * * * * * * * *   Pre-Loading NPCs and Gnome   * * * * * * * * * * * *   \n\n'.yellow);
				// drop and save npcs
				dbActions.dropCollection('npcs', function() {
					dbActions.saveDocuments(npcModel, npcData.global, function() {
						// drop and save gnome(s)
						dbActions.dropCollection('gnomes', function() {
							dbActions.saveDocuments(gnomeModel, gnomeData.global, function() {
								res.send('NPCs and Gnome loaded...');
							});
						});
					});
				});
			} else {
				res.send('There was an error retrieiving any data...');
			}
		});

		// app.get('/sessions/destroy', function(req, res) {
		// 	if(req.session) {
		// 		req.session.destroy(function() {});
		// 	}
		// 	res.redirect('/login');
		// });

		// create a set of codes
		app.get('/admin/action/create-invite-codes/:sessionName', function(req, res) {
			var i;
			var inviteeGroup = [];
			var inviteeObject;
			var sessionName = req.params.sessionName;
			function createCode() {
				var codeArray = [];
				var charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.:;{}[]|-=_+()&^%$#@!?~`ç√∫¥';
				for(var i=0; i < 50; i++) {
					codeArray[i] = charSet.charAt(Math.floor(Math.random() * charSet.length));
				}
				return codeArray.join('');
			};

			// TODO: add in emails...???
			for(i = 0; i < 30; i++) {
				inviteeObject = {};
				inviteeObject.sessionName = sessionName;
				// inviteeObject.email = '???@???.???';
				inviteeObject.accepted = false;
				inviteeObject.code = createCode();
				inviteeGroup.push(inviteeObject);
			}

			// console.log(inviteeGroup);

			Invitee.create(inviteeGroup, function(err) {
				if(err) {
					console.error('  Could not create documents: %s  '.yellow.inverse, err);
					res.send('Error creating invite codes...');
				} else {

					Invitee.find({ sessionName: sessionName }, 'code', function (err, codes) {
						var length = codes.length;
						var i;
						var codesArray = [];
						for(i = 0; i < length; i++) {
							codesArray.push(codes[i].code);
						}
						// console.log(codesArray);
						console.log('CS: '.blue + 'Invite codes created and saved to database: '.green);
						res.send(codesArray);
					});

				}
			});

		});

		// recreate/overwrite a set of existing session codes
		app.get('/admin/action/recreate-invite-codes/:session', function(req, res) {
			// res.render('admin/admin.hbs', {
			// 	title: 'Admin',
			// 	bodyClass: 'admin',
			// 	message: req.params.session,
			// });
		});

	}

};