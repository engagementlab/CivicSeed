var _curFrame = 0,
	_numFrames = 4,
	_numSteps = 8,
	_currentStepIncX = 0,
	_currentStepIncY = 0,
	_direction = 0,
	_willTravel = null,
	_idleCounter = 0,
	_getMaster = true,

	_info = null,
	_renderInfo = null,

	_numRequired = [4,5,6,5],

	$seedHudCount = null,
	$regularHudCount = null,
	$drawHudCount = null,
	$specialHudCount = null,
	_previousSeedsDropped = null,

	$waiting = null,
	$gameboard = null,
	$inventoryBtn = null,
	$inventory = null,
	$graffiti = null,
	$graffitiNum = null,
	_startTime = null,

	_seeds = null,
	_totalSeeds = null,
	_resources = null,
	_position = null,
	_rgb = null,
	_rgbString = null,
	_playerColorNum = null,
	_inventory = null,
	_colorMap = null,
	_resume = null,
	_playingTime = null,
	_tilesColored = null,
	_pledges = null,
	_resourcesDiscovered = null,

	_drawSeeds = null;

$game.$player = {

	name: null,
	id: null,
	game: null,
	instanceName: null,
	currentLevel: null,
	botanistState: null,
	firstTime: null,
	seenRobot: null,
	seriesOfMoves: null,
	currentMove: 0,
	currentStep: 0,
	isMoving: false,
	inventoryShowing: false,
	seedventoryShowing: false,
	seedPlanting: false,
	npcOnDeck: false,
	ready: false,
	seedMode: false,
	awaitingBomb: false,
	pathfinding: false,

	init: function(callback) {
		//get the players info from the db, alerts other users of presence
		ss.rpc('game.player.init', function(playerInfo) {
			// time in seconds since 1970 or whatever
			// console.log(playerInfo);
			_startTime = new Date().getTime() / 1000;

			_info = {
				srcX: 0,
				srcY: 0,
				x: playerInfo.game.position.x,
				y: playerInfo.game.position.y,
				offX: 0,
				offY: 0,
				prevOffX: 0,
				prevOffY: 0
			};

			// keeping this around because we then save to it on exit
			$game.$player.game = playerInfo.game;
			_setPlayerInformation(playerInfo);

			//tell others you have joined
			var subsetInfo = {
				_id: playerInfo.id,
				firstName: playerInfo.firstName,
				game: {
					tilesColored: playerInfo.game.tilesColored,
					rank: playerInfo.game.rank,
					currentLevel: playerInfo.game.currentLevel,
					position: playerInfo.game.position,
					colorInfo: playerInfo.game.colorInfo
				}
			};
			ss.rpc('game.player.tellOthers', subsetInfo);

			// set the render info
			_renderInfo = {
				colorNum: _playerColorNum,
				srcX: 0,
				srcY: 0,
				curX: _info.x * $game.TILE_SIZE,
				curY: _info.y * $game.TILE_SIZE,
				prevX: _info.x * $game.TILE_SIZE,
				prevY: _info.y * $game.TILE_SIZE,
				kind: 'player',
				level: $game.$player.currentLevel
			};

			// setup DOM selectors
			_setDomSelectors();

			// set the color of the hud to personalize it
			var rgba = 'rgba(' + playerInfo.game.colorInfo.rgb.r + ',' + playerInfo.game.colorInfo.rgb.g + ',' + playerInfo.game.colorInfo.rgb.b + ', .6)';
			$('.hudCount').css('background', rgba);

			_updateTotalSeeds();
			_updateRenderInfo();

			// we are ready, let everyone know dat
			$game.$player.ready = true;
			callback();
		});
	},

	//calculate movements and what to render for every game tick
	update: function(){
		if($game.$player.isMoving) {
			_move();
			_getMaster = true;
		}
		else if(!$game.inTransit) {
			_idle();
		}
		else if($game.inTransit) {
			_getMaster = true;
		}
		//this keeps us from doing this query every frame
		if(_getMaster) {
			_updateRenderInfo();
		}
	},

	//clear the character canvas to ready for redraw
	clear: function() {
		$game.$renderer.clearCharacter(_renderInfo);
	},

	//start a movement -> pathfind, decide if we need to load new viewport, if we are going to visit an NPC
	beginMove: function(x, y) {
		var loc = $game.$map.masterToLocal(_info.x, _info.y);
		if(loc.x === x && loc.y === y) {
			return;
		}
		$game.$player.pathfinding = true;
		_info.offX = 0;
		_info.offY = 0;

		if($game.bossModeUnlocked && $game.$player.currentLevel > 3) {
			$game.$map.findPath({x: _info.x, y: _info.y}, {x: x, y: y}, function(result) {
				$game.$player.pathfinding = false;
				if(result.length > 0) {
					_sendMoveInfo(result);
				}
			});
		} else {
			//check if it is an edge of the world
			$game.$map.isMapEdge(x, y, function(anEdge) {
				_willTravel = false;
				//if a transition is necessary, load new data
				if(!anEdge) {
					if(x === 0 || x === $game.VIEWPORT_WIDTH - 1 || y === 0 || y === $game.VIEWPORT_HEIGHT - 1) {
						_willTravel = true;
						$game.$map.calculateNext(x, y);
					}
				}
				var loc = $game.$map.masterToLocal(_info.x, _info.y),
					master = {x: x, y: y};
				$game.$map.findPath(loc, master, function(result) {
					$game.$player.pathfinding = false;
					if(result.length > 0) {
						_sendMoveInfo(result);
						ss.rpc('game.player.movePlayer', result, $game.$player.id, function() {
							var masterEndX = $game.$map.currentTiles[master.x][master.y].x,
								masterEndY = $game.$map.currentTiles[master.x][master.y].y;
							$game.$audio.update(masterEndX, masterEndY);
						});
					} else {
						$game.$player.npcOnDeck = false;
					}
				});
			});
		}
	},

	//moves the player as the viewport transitions
	slide: function(slideX, slideY) {
		_info.prevOffX = slideX * _numSteps;
		_info.prevOffY = slideY * _numSteps;
	},

	//when the player finishes moving or we just need a hard reset for rendering
	resetRenderValues: function() {
		_info.prevOffX = 0,
		_info.prevOffY = 0;
	},

	//decide what type of seed drop mechanic to do and check if they have seeds
	dropSeed: function(options) {
		if(options.x) {
			options.mX = $game.$map.currentTiles[options.x][options.y].x,
			options.mY = $game.$map.currentTiles[options.x][options.y].y;	
		}
		var mode = options.mode;

		//regular seed mode
		if(mode === 'regular') {
			if(_seeds.regular < 1) {
				return false;
			}
			else {
				options.sz = 3;
				_calculateSeeds(options);
				return true;
			}
		}
		//draw seed mode
		else {
			var seedArray = $.map(_drawSeeds, function(k, v) {
				return [k];
			});

			if(seedArray.length > 0) {
				//figure out the size covered
				var xSize = _drawSeedArea.maxX - _drawSeedArea.minX,
					ySize = _drawSeedArea.maxY - _drawSeedArea.minY,
					sz = xSize > ySize ? xSize : ySize,
					topLeftTile = $game.$map.currentTiles[_drawSeedArea.minX][_drawSeedArea.minY],
					bottomRightTile = $game.$map.currentTiles[_drawSeedArea.maxX][_drawSeedArea.maxY],
					centerTileX = $game.$map.currentTiles[15][7].x,
					centerTileY = $game.$map.currentTiles[15][7].y;

				var data = {
					bombed: seedArray,
					options: {
						mX: centerTileX,
						mY: centerTileY
					},
					x1: topLeftTile.x,
					y1: topLeftTile.y,
					x2: bottomRightTile.x,
					y2: bottomRightTile.y,
					kind: 'draw'
				};
				_sendSeedBomb(data);
				return true;
			}
		}
	},

	// determine which returning to npc prompt to show based on if player answered it or not
	getPrompt: function(index) {
		if(_resources[index]) {
			if(_resources[index].result) {
				return 2;
			}
			else {
				return 1;
			}
		}
		return 0;
	},

	//saves the user's answer locally
	answerResource: function(info) {
		var newInfo = {
			answers: [info.answer],
			attempts: 1,
			result: info.correct,
			seeded: [],
			questionType: info.questionType,
			index: info.index
		};
		var realResource = null;

		//see if the resource is already in the list
		if(_resources[info.index]) {
			realResource = _resources[info.index];
		}

		//if not, then add it to the list
		if(!realResource) {
			_resources[info.index] = newInfo;
			realResource = _resources[info.index];
		}
		else {
			realResource.answers.push(newInfo.answers[0]);
			realResource.attempts += 1;
			realResource.result = newInfo.result;
		}
		//the answer was correct, add item to inventory
		if(info.correct) {
			_resourcesDiscovered += 1;
			var rawAttempts = 6 - realResource.attempts,
				numToAdd = rawAttempts < 0 ? 0 : rawAttempts;
			$game.$player.updateSeeds('regular', numToAdd);
			return numToAdd;
		}
	},

	//checks if we should save out a new image of player's color map
	saveMapImage: function() {
		//only do this if we have dropped 5 new seeds
		if(_seeds.dropped - _previousSeedsDropped > 4) {
			_colorMap = $game.$map.saveImage();
			var info = {
				id: $game.$player.id,
				colorMap: _colorMap
			};
			ss.rpc('game.player.updateGameInfo', info);
			_previousSeedsDropped = _seeds.dropped;
		}
	},

	//determines what the botanist state should be based on if the player has the right resources 
	checkBotanistState: function() {
		//put player to state 3 (solving) if they the RIGHT resources
		//AND they have already seen the first 2 staes
		if($game.$player.botanistState > 1) {
			//compare each player's resource to the correct answer
			var answers = $game.$botanist.tangram[$game.$player.currentLevel].answer,
				a = answers.length;
			//go through the answer sheet to see if the current tangram is there &&
			//in the right place
			while(--a > -1) {
				var curAnswer = answers[a].id,
					found = false;

				//look thru player's resources for this answer (it is the shape)
				$.each(_resources, function(index, resource) {
					if(resource) {
						var shape = $game.$resources.getShapeName(index);
						if(shape === curAnswer) {
							found = true;
						}
					}
				});
				if(!found) {
					return false;
				}
			}
			//if we made it here, that means you have all pieces
			$game.$player.botanistState = 3;
			$game.$botanist.setBotanistState(3);

			var info = {
				id: $game.$player.id,
				botanistState: $game.$player.botanistState
			};
			ss.rpc('game.player.updateGameInfo', info);
			//check if they have ALL pieces, of so, beam me up scotty
			// console.log(_inventory.length, $game.resourceCount[$game.$player.currentLevel]);
			if(_inventory.length === $game.resourceCount[$game.$player.currentLevel]) {
				var msg = 'You collected all the pieces, to the botanist!';
				$game.statusUpdate({message: msg, input:'status', screen: true , log:false});
				setTimeout(function() {
					$game.$player.beamMeUpScotty();
				},3000);
			}
		}
	},

	//gets player answer for specific resource
	getAnswer: function(id) {
		if( _resources[id]) {
			return _resources[id];
		}
	},

	//this happens on load to put all items from DB -> inventory
	fillInventory: function() {
		if($game.$player.currentLevel < 4) {
			var l = _inventory.length,
				cur = 0;
			$inventoryBtn.text(l);

			while(cur < l) {
				_addToInventory(_inventory[cur]);
				cur++;
			}
			//if the player has gotten the riddle, put the tangram in the inventory + bind actions
			if($game.$player.botanistState > 1) {
				$game.$player.tangramToInventory();
			}
		}
	},

	//clear all items from the inventory
	clearInventory: function() {
		$('.inventoryItem').remove();
	},

	//put the tangram image in the inventory
	tangramToInventory: function() {
		var gFile = 'puzzle' + $game.$player.currentLevel,
			imgPath2 = CivicSeed.CLOUD_PATH + '/img/game/tangram/'+gFile+'small.png';

		$inventory.append('<div class="inventoryItem inventoryPuzzle '+gFile+'"><img src="' + imgPath2 + '" draggable = "false"></div>');
		$('.'+ gFile).bind('click', $game.$botanist.inventoryShowRiddle);
	},

	//empty everything  from inventory
	emptyInventory: function() {
		_inventory = [];
		$('.inventoryItem').remove();
		$inventoryBtn.text('0');
	},

	//make the bounding box for each possible resource in inventory
	createInventoryOutlines: function() {
		if($game.$player.currentLevel < 4) {
			var io = $('.inventory > .outlines');
			io.empty();
			for(var i = 0; i < $game.resourceCount[$game.$player.currentLevel]; i +=1) {
				io.append('<div class="inventoryOutline"></div>');
			}
		}
	},

	//reset items and prepare other entities for fresh level
	nextLevel: function() {
		$game.$player.currentLevel += 1;
		$game.$player.botanistState = 0;
		$game.$player.seenRobot = false;
		_pledges = 5;
		$game.$renderer.loadTilesheet($game.$player.currentLevel, true);
		//save new information to DB
		var info = {
			id: $game.$player.id,
			botanistState: $game.$player.botanistState,
			seenRobot: $game.$player.seenRobot,
			pledges: _pledges,
			inventory: [],
			currentLevel: $game.$player.currentLevel
		};
		ss.rpc('game.player.updateGameInfo', info);
		var msg = 'Congrats! You have completed level ' + $game.$player.currentLevel + '!';
		if($game.$player.currentLevel < 4) {
			$game.statusUpdate({message: msg, input:'status', screen: false , log:true});
			$game.$robot.setPosition();
			_renderInfo.level = $game.$player.currentLevel;
			$game.$player.createInventoryOutlines();
			//send status to message board
			var newLevelMsg = $game.$player.currentLevel + 1;
			// var stat = $game.$player.firstName + 'is on level' + newLevelMsg + '!';
			ss.rpc('game.player.levelChange', $game.$player.id, $game.$player.currentLevel);
			$game.$renderer.playerToCanvas($game.$player.currentLevel, _renderInfo.colorNum, true);
		} else {
			$game.statusUpdate({message: msg, input:'status', screen: false , log:true});
			if($game.bossModeUnlocked) {
				$game.toBossLevel();
			}
		}
	},

	//return the calculation of how long they have been playing for (total)
	getPlayingTime: function() {
		var currentTime = new Date().getTime() / 1000,
			totalTime = Math.round((currentTime - _startTime) + _playingTime);
		return totalTime;
	},

	//reveals the seed menu to choose which seed they want to use
	openSeedventory: function() {
		//open up the inventory
		if(_seeds.draw > 0) {
			$('.seedventory').slideDown(function() {
				var col0 = _seeds.regular > 0 ? '#eee': '#333',
				col1 = _seeds.draw > 0 ? '#eee': '#333';

				$('.regularButton').css('color',col0);
				$('.drawButton').css('color',col1);

				$game.$player.seedventoryShowing = true;
				$game.statusUpdate({message:'choose a seed to plant',input:'status',screen: true,log:false});
				$('.seedButton').addClass('currentButton');
			});
		}
		//start seed mode on 0
		else {
			$('.seedButton').addClass('currentButton');
			if(_seeds.regular > 0) {
				$game.$player.seedPlanting = true;
				$game.$player.seedMode = 'regular';
				$game.statusUpdate({message:'click any tile to drop some color',input:'status',screen: true,log:false});
			}
			else {
				$('.seedButton').removeClass('currentButton');
				$game.statusUpdate({message:'you have no seeds',input:'status',screen: true,log:false});
			}
		}
	},

	//remove the menu once they have selected a seed flash player and disable other actions
	startSeeding: function(choice) {
		$game.$player.seedMode = choice;
		$('.seedventory').slideUp(function() {
			$game.$player.seedventoryShowing = false;
			$game.$player.seedPlanting = true;
		});
		var msg;
		if(choice === 'regular') {
			msg = 'click a tile to drop some color';
		} else {
			msg = 'paintbrush mode activated - click and drag to draw';
			$graffiti.show();
			$graffitiNum.text(_seeds.draw);
		}
		$game.statusUpdate({message: msg,input:'status',screen: true,log:false});
	},

	//make a response public to all other users
	makePublic: function(npcId) {
		if(_resources[npcId]) {
			//update this resource
			_resources[npcId].madePublic = true;
			//update resource db
			var info = {
				playerId: $game.$player.id,
				npcId: npcId,
				instanceName: $game.$player.instanceName
			};
			ss.rpc('game.npc.makeResponsePublic', info, function(res) {
				//take away the make public and replcae with eye?
				$('.publicButton').remove();
				$('.yourAnswer').append('<i class="icon-unlock privateButton icon-large" data-npc="'+ npcId +'"></i>');
				setTimeout(function() {
					$game.$player.displayNpcComments();
				}, 250);
			});
		}
	},

	//make a previously public response private to all other users
	makePrivate: function(npcId) {
		if(_resources[npcId]) {
			//update this resource
			_resources[npcId].madePublic = false;
			//update resource db
			var info = {
				playerId: $game.$player.id,
				npcId: npcId,
				instanceName: $game.$player.instanceName
			};
			ss.rpc('game.npc.makeResponsePrivate', info, function(res) {
				//take away the make public and replcae with eye?
				$('.yourAnswer').append('<button class="btn btn-info publicButton" data-npc="'+ npcId +'">Make Public</button>');
				$('.privateButton').remove();
				//hack to make sure it updates...
				setTimeout(function() {
					$game.$player.displayNpcComments();
				}, 250);
			});
		}
	},

	//get ALL answers for all open questions for this player
	compileAnswers: function() {
		var html = '';
			$.each(_resources, function(index, resource) {
				if(resource.questionType === 'open') {
					var answer = resource.answers[resource.answers.length - 1],
						question = $game.$resources.getQuestion(index),
						seededCount = resource.seeded.length;

					html += '<p class="theQuestion">Q: ' + question + '</p><div class="theAnswer"><p class="answerText">' + answer + '</p>';
					if(seededCount > 0) {
						html += '<p class="seededCount">' + seededCount + ' likes</p>';
					}
					html += '</div>';
				}
			});
		return html;
	},

	//see if the player has the specific resource already
	checkForResource: function(id) {
		// console.log(id);
		// console.log(_resources);
		if(_resources[id]) {
			return true;
		}
		return false;
	},

	//change seed count for specific seed
	updateSeeds: function(kind, quantity) {
		_seeds[kind] += quantity;
		//save to DB
		var info = {
			id: $game.$player.id,
			seeds: _seeds
		};
		ss.rpc('game.player.updateGameInfo', info);
		//update hud
		_updateTotalSeeds();
	},

	//put new answer into the resume
	resumeAnswer: function(answer) {
		_resume.push(answer);
		var info = {
			id: $game.$player.id,
			resume: _resume
		};
		ss.rpc('game.player.updateGameInfo', info);
	},

	//keep track of how many seedITs the player has done
	updatePledges: function(quantity) {
		_pledges += quantity;
		var info = {
			id: $game.$player.id,
			pledges: _pledges
		};
		ss.rpc('game.player.updateGameInfo', info);
	},

	//disable blinking seed planting mode
	resetRenderColor: function() {
		_renderInfo.colorNum = _playerColorNum;
	},

	//return the player's current position (x,y)
	getPosition: function() {
		return _info;
	},

	//get the players rgb colors
	getColor: function() {
		return _rgb;
	},

	//get the players image number (corresponds to 2.png for example)
	getColorNum: function() {
		return _renderInfo.colorNum;
	},

	//get all the render info to draw player
	getRenderInfo: function() {
		return _renderInfo;
	},

	//get the current color map
	getColorMap: function() {
		return _colorMap;
	},

	//get the number of tiles colored
	getTilesColored: function() {
		return _tilesColored;
	},

	//get the number of resources collected
	getResourcesDiscovered: function() {
		return _resourcesDiscovered;
	},

	//get the number of seeds dropped
	getSeedsDropped: function() {
		return _seeds.dropped;
	},

	//get the quantity of items in the player's inventory
	getInventoryLength: function() {
		return _inventory.length;
	},

	//get the quantity of seedITs made
	getPledges: function() {
		return _pledges;
	},

	//get the player's color as a string
	getRGBA: function() {
		return 'rgba('+_colorInfo.r+','+_colorInfo.g+','+_colorInfo.b+','+ 0.5 + ')';
	},

	getColorString: function() {
		return _rgbString;
	},

	//get the current viewport position
	getRenderPosition: function () {
		return {x: _renderInfo.curX, y: _renderInfo.curY};
	},

	//transport player back to botanist's garden, magically
	beamMeUpScotty: function(place) {
		//x any y are viewport coords
		$('.beamMeUp').show();
		_info.x = 70;
		_info.y = 74;
		_renderInfo.curX = _info.x * $game.TILE_SIZE;
		_renderInfo.curY = _info.y * $game.TILE_SIZE;
		_renderInfo.prevX = _info.x * $game.TILE_SIZE;
		_renderInfo.prevY = _info.y * $game.TILE_SIZE;
		//$game.running = false;
		var tx = (_info.x === 0) ? 0 : _info.x - 1,
			ty = (_info.y === 0) ? 0 : _info.y - 1,
			divX = Math.floor(tx / ($game.VIEWPORT_WIDTH - 2 )),
			divY = Math.floor(ty / ($game.VIEWPORT_HEIGHT - 2 )),
			startX  = divX * ($game.VIEWPORT_WIDTH - 2),
			startY = divY * ($game.VIEWPORT_HEIGHT - 2);

		$game.masterX = startX;
		$game.masterY = startY;

		//update npcs, other players?
		$game.inTransit = true;
		$game.$map.setBoundaries();
		$game.$map.firstStart(function() {
			$game.$renderer.renderAllTiles();
			$game.inTransit = false;
			setTimeout(function() {
				$('.beamMeUp').fadeOut();
				$game.$player.displayNpcComments();
			}, 1000);
			
			var info = {
				id: $game.$player.id,
				x: _info.x,
				y: _info.y
			};
			ss.rpc('game.player.beam', info);
			$game.$map.updatePlayer($game.$player.id, _info.x, _info.y);
		});
	},

	//when another player pledges a seed, make the update in your local resources
	updateResource: function(data) {
		if(resources[data.npc]) {
			resources[data.npc].seeded.push(data.pledger);
		}
	},

	//add the tagline to the resource, then save it to db
	setTagline: function(tagline) {
		var resource = $game.$resources.getCurResource(),
			realResource = null,
			npcLevel = $game.$npc.getNpcLevel(),
			shapeName = resource.shape;

		//find the resource and add tagline
		if(_resources[resource.index]) {
			realResource = _resources[resource.index];
			realResource.tagline = tagline;
		}
		//add piece to inventory
		if($game.$player.currentLevel === npcLevel) {
				_inventory.push({name: shapeName, npc: resource.index, tagline: tagline});
				_addToInventory({name: shapeName, npc: resource.indexpc, tagline: tagline});
		}
		//hack to not include demo users
		var newAnswer = {
			npc: resource.index,
			id: $game.$player.id,
			name: $game.$player.firstName,
			answer: realResource.answers[realResource.answers.length - 1],
			madePublic: false,
			instanceName: $game.$player.instanceName,
			questionType: realResource.questionType
		};

		if($game.$player.firstName !== 'Demo') {
			ss.rpc('game.npc.saveResponse', newAnswer);
		}

		_saveResourceToDB(realResource);
		//display npc bubble for comment num
		$game.$player.displayNpcComments();
	},

	//show a bubble over visited npcs of how many comments there are
	displayNpcComments: function() {
		$('.npcBubble').remove();
		var npcs = $game.$npc.getOnScreenNpcs();
		//go thru each npc and see if they are in player resources
		for (var n = 0; n < npcs.length; n++) {
			if(_resources[npcs[n]]) {
				var npcInfo = $game.$npc.getNpcCoords(npcs[n]),
					npcId = 'npcBubble' + npcs[n],
					num;
				if(_resources[npcs[n]].questionType === 'open') {
					num = $game.$resources.getNumResponses(npcs[n]);
				} else {
					num = '*';
				}
				bubble = $('<p class="npcBubble" data-npc="' + npcs[n] + '" id="' + npcId + '">' + num + '</p>');
				$gameboard.append(bubble);
				$('#' + npcId).css({
					top: npcInfo.y - 68,
					left: npcInfo.x
				});
				//only bind function to show answers for open ended
				if(_resources[npcs[n]].questionType === 'open') {
					$('#' + npcId).bind('click', function() {
						var npc = $(this).attr('data-npc');
						$game.$resources.beginResource(npc, true);
					});
				}
			}
		}
	},

	//save the player's current position to the DB
	saveTimeToDB: function() {
		var endTime = new Date().getTime() / 1000,
			totalTime = endTime - _startTime;
		_playingTime += totalTime;
		var info = {
			id: $game.$player.id,
			playingTime: _playingTime
		};
		ss.rpc('game.player.updateGameInfo', info);
	},

	//call the save seed function from outside player
	saveSeeds: function() {
		_saveSeedsToDB();
	},

	//update the running array for current tiles colored to push to DB on end of drawing
	drawSeed: function(pos) {
		if(_seeds.draw > 0) {
			$game.$player.updateSeeds('draw', -1);
			$graffitiNum.text(_seeds.draw);
			var drawLocal = false;
			if($game.$player.seedMode === 'draw') {
				var currentTile = $game.$map.currentTiles[pos.x][pos.y],
					index = currentTile.mapIndex,
					stringIndex = String(index),
					tempRGB = _rgbString + '0.3)';
				if(!_drawSeeds[index]) {
					drawLocal = true;
					_drawSeeds[index] = {
						x: currentTile.x,
						y: currentTile.y,
						mapIndex: index,
						color:
						{
							r: _colorInfo.r + 10,
							g: _colorInfo.g + 10,
							b: _colorInfo.b + 10,
							a: 0.3
						},
						instanceName: $game.$player.instanceName,
						curColor: tempRGB
					};
					//keep track area positions
					if(pos.x < _drawSeedArea.minX) {
						_drawSeedArea.minX = pos.x;
					}
					if(pos.y < _drawSeedArea.minY) {
						_drawSeedArea.minY = pos.y;
					}
					if(pos.x > _drawSeedArea.maxX) {
						_drawSeedArea.maxX = pos.x;
					}
					if(pos.y > _drawSeedArea.maxY) {
						_drawSeedArea.maxY = pos.y;
					}
				} else {
					if(_drawSeeds[index].color.a < 0.5) {
						drawLocal = true;
						_drawSeeds[index].color.a += 0.1;
						_drawSeeds[index].curColor = tempRGB = _rgbString + _drawSeeds[index].color.a + ')';
					}
				}
				if(drawLocal) {
					//blend the prev. color with new color
					var updateTile = false;
					if(currentTile.color) {
						if(currentTile.color.a < 0.5) {
							updateTile = true;
							var weightOld = 0.2,
								weightNew = 0.8;
							var newR = Math.floor(weightOld * currentTile.color.r + weightNew * _drawSeeds[index].color.r),
								newG = Math.floor(weightOld * currentTile.color.g + weightNew * _drawSeeds[index].color.g),
								newB = Math.floor(weightOld * currentTile.color.b + weightNew * _drawSeeds[index].color.b),
								newA = Math.round((currentTile.color.a + 0.1) * 100) / 100,
								rgbString = 'rgba(' + newR + ',' + newG + ',' + newB + ',' + newA + ')';
							$game.$map.currentTiles[pos.x][pos.y].color = _drawSeeds[index].color;
							$game.$map.currentTiles[pos.x][pos.y].color.a = newA;
							$game.$map.currentTiles[pos.x][pos.y].curColor = rgbString;
						}
					} else {
						$game.$map.currentTiles[pos.x][pos.y].color = _drawSeeds[index].color;
						$game.$map.currentTiles[pos.x][pos.y].curColor = tempRGB;
						updateTile = true;
					}
					if(updateTile) {
						//draw over the current tiles to show player they are drawing
						$game.$renderer.clearMapTile(pos.x * $game.TILE_SIZE, pos.y * $game.TILE_SIZE);
						$game.$renderer.renderTile(pos.x,pos.y);
					}
				}
			}
		} else {
			$game.$player.dropSeed({mode: 'draw'});
			$game.$mouse.drawMode = false;
			$game.$player.seedMode = false;
			$game.$player.seedPlanting = false;
			$game.statusUpdate({message:'you are out of seeds!',input:'status',screen: true,log:false});
			_saveSeedsToDB();
		}
	},

	//put initial seed drawn in running array
	drawFirstSeed: function() {
		var pos = $game.$mouse.getCurrentPosition();
		_drawSeeds = {};
		_drawSeedArea = {
			minX: 29,
			maxX: 0,
			minY: 14,
			maxY: 0
		};
		$game.$player.drawSeed(pos);
	},

	//if boss mode then must change up pos info
	setPositionInfo: function() {
		if($game.bossModeUnlocked && $game.$player.currentLevel > 3) {
			_info.x = 15;
			_info.y = 8;
		}
	},

	debug: function() {
		console.log(_resources);
	}
};

/***** PRIVATE FUNCTIONS ******/

//save a new resource to the database
function _saveResourceToDB(resource) {
	var info = {
		id: $game.$player.id,
		resource: resource,
		inventory: _inventory,
		resourcesDiscovered: _resourcesDiscovered,
		index: resource.index
	};
	ss.rpc('game.player.saveResource', info);
}

//setup all the dom elements for reuse
function _setDomSelectors() {
	//set variables for dom selectors
	$seedHudCount = $('.seedButton .hudCount');
	$regularHudCount = $('.regularButton .hudCount');
	$drawHudCount = $('.drawButton .hudCount');
	$waiting = $('.waitingForSeed');
	$gameboard = $('.gameboard');
	$inventoryBtn = $('.inventoryButton > .hudCount');
	$inventory = $('.inventory > .pieces');
	$graffiti = $('.graffiti');
	$graffitiNum = $('.graffiti p span');
}

// on init, set local and global variables for all player info
function _setPlayerInformation(info) {
	// private
	_seeds = info.game.seeds;
	_previousSeedsDropped = _seeds.dropped;
	_resources = _objectify(info.game.resources);
	_position = info.game.position;
	_colorInfo = info.game.colorInfo.rgb;
	_rgb = 'rgb(' + info.game.colorInfo.rgb.r + ',' + info.game.colorInfo.rgb.g + ',' + info.game.colorInfo.rgb.b + ')';
	_rgbString = 'rgba(' + (info.game.colorInfo.rgb.r + 10) + ',' + (info.game.colorInfo.rgb.g + 10) + ',' + (info.game.colorInfo.rgb.b + 10) + ',';
	_playerColorNum = info.game.colorInfo.tilesheet;
	_inventory = info.game.inventory;
	_colorMap = info.game.colorMap;
	_resume = info.game.resume;
	_playingTime = info.game.playingTime;
	_tilesColored = info.game.tilesColored;
	_pledges = info.game.pledges;
	_resourcesDiscovered = info.game.resourcesDiscovered;

	// hack
	// console.log(_resources);
	if(!_resources) {
		_resources = {};
	}
	// public
	$game.$player.id = info.id;
	$game.$player.firstName = info.firstName;
	$game.$player.currentLevel = info.game.currentLevel;
	$game.$player.botanistState = info.game.botanistState;
	$game.$player.firstTime = info.game.firstTime;
	$game.$player.instanceName = info.game.instanceName;
	$game.$player.seenRobot = info.game.seenRobot;
}

//figure out what color to make which tiles when a seed is dropped
function _calculateSeeds(options) {
	var mid = Math.floor(options.sz / 2),
		origX = options.mX - mid,
		origY = options.mY - mid,
		sX = options.x - mid,
		sY = options.y - mid,
		bombed = [],
		mode = options.mode,
		square = null,
		tempRGB = null,
		tempIndex = null,
		b = 0;

	//start at the top left corner and loop through (vertical first)
	while(b < options.sz) {
		var a = 0;
		while(a < options.sz) {
			//only add if it is in the map!
			if(origX + a > -1 && origX + a < $game.TOTAL_WIDTH && origY + b > -1 && origY + b < $game.TOTAL_HEIGHT) {
				var tempA = Math.round((0.5 - ((Math.abs(a - mid) + Math.abs(b - mid)) / options.sz) * 0.3) * 100) / 100;
				//set x,y and color info for each square
				tempRGB = _rgbString + tempA + ')';
				tempIndex = (origY+b) * $game.TOTAL_WIDTH + (origX + a);
				square = {
					x: origX + a,
					y: origY + b,
					mapIndex: tempIndex,
					color:
					{
						r: _colorInfo.r + 10,
						g: _colorInfo.g + 10,
						b: _colorInfo.b + 10,
						a: tempA
					},
					curColor: tempRGB,
					instanceName: $game.$player.instanceName
				};
				bombed.push(square);	
			}
			a += 1;
		}
		b += 1;
	}

	if(bombed.length > 0) {
		var sendData = {bombed: bombed, options: options, x1: origX, y1: origY, x2: origX + options.sz, y2: origY + options.sz, kind: 'regular'};
		_sendSeedBomb(sendData);
	}
}

//plant the seed on the server and wait for response and update hud and map
function _sendSeedBomb(data) {
	//set a waiting boolean so we don't plant more until receive data back from rpc
	$game.$player.awaitingBomb = true;

	//send the data to the rpc
	var info = {
		id: $game.$player.id,
		name: $game.$player.firstName,
		x1: data.x1,
		y1: data.y1,
		x2: data.x2,
		y2: data.y2,
		tilesColored: _tilesColored,
		instanceName: $game.$player.instanceName,
		kind: data.kind
	};

	var loc = $game.$map.masterToLocal(data.options.mX,data.options.mY);

	$waiting
		.css({
			top: loc.y * 32,
			left: loc.x * 32
		})
		.show();

	ss.rpc('game.player.dropSeed', data.bombed, info, function(result, bonus) {
		_seeds.dropped += 1;
		//increase the drop count for the player
		$game.$player.awaitingBomb = false;
		$waiting.fadeOut();
		if(result > 0) {
			if(bonus) {
				$game.statusUpdate({message:'collaborative blending bonus!',input:'status',screen: true,log:false});
			}
			//play sound clip
			$game.$audio.playTriggerFx('seedDrop');
			_tilesColored += result;
						//update seed count in HUD
			if(data.options.mode === 'regular') {
				$game.$player.updateSeeds('regular', -1);
				//bounce outta seed options.mode
				if(_seeds.regular === 0) {
					$game.$player.seedMode = false;
					_renderInfo.colorNum = _playerColorNum;
					$game.$player.seedPlanting = false;
					$game.statusUpdate({message:'you are out of seeds!',input:'status',screen: true,log:false});
					$('.seedButton').removeClass('currentButton');
					$game.$player.saveMapImage();
					//TODO: save seed values to DB
					_saveSeedsToDB();
				}
			}
			else {
				if(_seeds.draw === 0) {
					$game.$mouse.drawMode = false;
					$game.$player.seedMode = false;
					_renderInfo.colorNum = _playerColorNum;
					$game.$player.seedPlanting = false;
					$graffiti.hide();
					$game.statusUpdate({message:'you are out of seeds!',input:'status',screen: true,log:false});
					$('.seedButton').removeClass('currentButton');
					$game.$player.saveMapImage();
					//TODO: save seed values to DB
					_saveSeedsToDB();
				}
			}
		}
		else {
			$game.statusUpdate({message:'sorry, someone beat you to that tile',input:'status',screen: true,log:false});
		}
	});
}

//update seed counts
function _updateTotalSeeds() {
	_totalSeeds = _seeds.regular + _seeds.draw;
	$seedHudCount.text(_totalSeeds);
	$regularHudCount.text(_seeds.regular);
	$drawHudCount.text(_seeds.draw);
}

// calculate new render information based on the player's position
function _updateRenderInfo() {
	// get local render information. update if appropriate.
	var loc = $game.$map.masterToLocal(_info.x, _info.y);
	if(loc) {
		var prevX = loc.x * $game.TILE_SIZE + _info.prevOffX * $game.STEP_PIXELS;
		prevY = loc.y * $game.TILE_SIZE + _info.prevOffY * $game.STEP_PIXELS;
		curX = loc.x * $game.TILE_SIZE + _info.offX * $game.STEP_PIXELS;
		curY = loc.y * $game.TILE_SIZE + _info.offY * $game.STEP_PIXELS;

		_renderInfo.prevX = prevX,
		_renderInfo.prevY = prevY,

		_renderInfo.srcX = _info.srcX,
		_renderInfo.srcY = _info.srcY,
		_renderInfo.curX = curX,
		_renderInfo.curY = curY;
	}
}

//figure out how much to move the player during a walk and wait frame to show
function _move() {
	/** IMPORTANT note: x and y are really flipped!!! **/
	//update the step
	$game.$player.isMoving = true;

	//if the steps between the tiles has finished,
	//update the master location, and reset steps to go on to next move
	if($game.$player.currentStep >= _numSteps) {
		$game.$player.currentStep = 0;
		_info.x = $game.$player.seriesOfMoves[$game.$player.currentMove].masterX;
		_info.y = $game.$player.seriesOfMoves[$game.$player.currentMove].masterY;

		$game.$player.currentMove += 1;
		//render mini map every spot player moves
		$game.$map.updatePlayer($game.$player.id, _info.x, _info.y);
	}

	//if we done, finish
	if($game.$player.currentMove >= $game.$player.seriesOfMoves.length) {
		if($game.bossModeUnlocked && $game.$player.currentLevel > 3) {
			_info.offX = 0,
			_info.offY = 0;
			_info.srcX = 0,
			_info.srcY =  0;
			_info.prevOffX= 0;
			_info.prevOffY= 0;

			$game.$player.isMoving = false;
			$game.$boss.endMove(_info.x, _info.y);
		} else {
			_endMove();
		}
	}
	//if we no done, then step through it yo.
	else {

		//increment the current step
		$game.$player.currentStep += 1;

		//if it the first one, then figure out the direction to face
		if($game.$player.currentStep === 1) {
			_currentStepIncX = $game.$player.seriesOfMoves[$game.$player.currentMove].masterX - _info.x;
			_currentStepIncY = $game.$player.seriesOfMoves[$game.$player.currentMove].masterY - _info.y;
			//set the previous offsets to 0 because the last visit
			//was the actual rounded master
			_info.prevOffX = 0;
			_info.prevOffY = 0;

			//set direction for sprite sheets
			//direction refers to the y location on the sprite sheet
			//since the character will be in different rows
			//will be 0,1,2,3
			if(_currentStepIncX === 1) {
				_direction = 2;
			}
			else if(_currentStepIncX === -1) {
				_direction = 1;
			}
			else if(_currentStepIncY === -1) {
				_direction = 4;
			}
			else {
				_direction = 3;
			}
		}

		else {
			_info.prevOffX = _info.offX;
			_info.prevOffY = _info.offY;
		}

		_info.offX = $game.$player.currentStep * _currentStepIncX;
		_info.offY = $game.$player.currentStep * _currentStepIncY;

		//try only changing the src (frame) every X frames
		if(($game.$player.currentStep-1) % 8 === 0) {
			_curFrame += 1;
			if(_curFrame >= _numFrames) {
				_curFrame = 0;
			}
		}
		_info.srcX = _curFrame * $game.TILE_SIZE,
		_info.srcY = _direction * $game.TILE_SIZE*2;
	}
}

//once the move is sent out to all players, update the players next moves
function _sendMoveInfo(moves) {
	$game.$player.seriesOfMoves = new Array(moves.length);
	$game.$player.seriesOfMoves = moves;
	$game.$player.currentMove = 1;
	$game.$player.currentStep = 0;
	$game.$player.isMoving = true;
	$game.$chat.hideChat();
}

//when a move is done, decide waht to do next (if it is a transition) and save position to DB
function _endMove() {
	var posInfo = {
		id: $game.$player.id,
		position: {
			x: _info.x,
			y: _info.y	
		}
	};
	ss.rpc('game.player.savePosition', posInfo);
	$game.$map.updatePlayer($game.$player.id, _info.x, _info.y);

	//put the character back to normal position
	_info.offX = 0,
	_info.offY = 0;
	_info.srcX = 0,
	_info.srcY =  0;
	_info.prevOffX= 0;
	_info.prevOffY= 0;

	$game.$player.isMoving = false;
	if(_willTravel) {
		var beginTravel = function(){
			if($game.$map.dataLoaded){
				$game.beginTransition();
			}
			else{
				//keep tryin!
				setTimeout(beginTravel,50);
			}
		};
		beginTravel();
	}
	else {
		//trigger npc to popup _info and stuff
		if($game.$player.npcOnDeck) {
			$game.$player.npcOnDeck = false;
			$game.$npc.show();
		}
	}
}

//determine what frame to render while standing
function _idle() {
	_idleCounter += 1;
	if($game.$player.seedMode) {
		if(_idleCounter % 32 < 16) {
			_renderInfo.colorNum = 0;
		}
		else {
			_renderInfo.colorNum = _playerColorNum;
		}
	}

	if(_idleCounter >= 64) {
		_idleCounter = 0;
		_info.srcX = 0;
		_info.srcY = 0;
		_getMaster = true;
		_renderInfo.squat = false;
	}

	else if(_idleCounter === 48) {
		_info.srcX = 32;
		_info.srcY = 0;
		_getMaster = true;
		_renderInfo.squat = true;
	}

	else {
		_getMaster = false;
	}
}

//add an item to the inventory in the hud and bind actions to it
function _addToInventory(data) {
	//create the class / ref to the image
	var className = 'r' + data.name,
		levelFolder = 'level' + ($game.$player.currentLevel + 1),
		imgPath = CivicSeed.CLOUD_PATH + '/img/game/resources/' + levelFolder + '/small/' +  data.name +'.png';
		//tagline = $game.$resources.getTagline(index);
	//put image on page in inventory
	$inventory.prepend('<img class="inventoryItem '+ className + '"src="' + imgPath + '" data-placement="top" data-original-title="' + data.tagline + '">');

	$('.' + className).bind('mouseenter',function() {
		//var info = $(this).attr('title');
		$(this).tooltip('show');
	});
	$inventoryBtn.text(_inventory.length);

	//bind click and drag functions, pass npc #
	$('img.inventoryItem.'+ className)
		.bind('click', function() {
			//false means don't go straight to answers
			$game.$resources.beginResource(data.npc, false);
		})
		.bind('dragstart',{npc: data.npc + ',' + data.name}, $game.$botanist.dragStart);
}

//game over (deprecated)
function _gameOver() {
	//if demo mode just send to boss level
	if($game.$player.firstName === 'Demo') {
		$game.$boss.init(function() {
		});
	} else {
		ss.rpc('game.player.gameOver', $game.$player.id, function(res){
			if(res) {
				if($game.bossModeUnlocked && $game.$player.currentLevel > 3) {
					//TODO: test this
					$game.$boss.init(function() {

					});
				} else {
					var hooray = '<div class="hooray"><h2>You beat the game, hooray!</h2><p>But the color has not yet returned to the world... If you have more seeds go and color the world. I will contact you when it has returned.</div>';
					$('.gameboard').append(hooray);
				}
			}
		});
	}
}

function _saveSeedsToDB() {
	var info = {
		id: $game.$player.id,
		seeds: _seeds,
		tilesColored: _tilesColored
	};
	ss.rpc('game.player.updateGameInfo', info);
}

function _objectify(input) {
	var result = {};
	for(var i = 0; i < input.length; i++) {
		result[input[i].index] = input[i];
		result[input[i].index].arrayLookup = i;
	}
	// console.log('resources', result);
	return result;
}