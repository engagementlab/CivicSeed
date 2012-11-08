
	_onScreenPlayers = {};

$game.$others = {

	init: function() {
		ss.rpc('game.player.getOthers', function(response) {
			_onScreenPlayers = {};
			$.each(response, function(key, player) { 
  				$game.$others.add(player);
			});
		});
	},

	add: function(player) {
		//check if player is on our screen (or near it....)
		//don't add it if its yourself
		//console.log(player.id);
		if(player.id != $game.$player.id) {
			//set inview if nearby
			var newbie = $game.$others.createOther(player);
			_onScreenPlayers[player.id] = newbie;
			//console.log("added: " + player.id);
		}
	},

	update: function() {
		//if is moving, move
		$.each(_onScreenPlayers, function(key, player) { 
  			player.update(); 
		});
	},
	clear: function() {
		//if is moving, move
		$.each(_onScreenPlayers, function(key, player) { 
  			player.clear(); 
		});
	},

	slide: function(slideX, slideY) {

		$.each(_onScreenPlayers, function(key, player) { 
  			player.slide(slideX, slideY); 
		});

	},

	resetRenderValues: function () {
		$.each(_onScreenPlayers, function(key, player) { 
  			player.resetRenderValues(); 
		});
	},
	hideAllChats: function() {
		$.each(_onScreenPlayers, function(key, player) { 
  			player.hideChat(); 
		});		
	},

	message: function(message, id) {
		$.each(_onScreenPlayers, function(key, player) { 
  			if(player.id === id) {
  				player.message(message);
  			}
		});
	},

	remove: function(id) {
		//clear from screen...
		delete _onScreenPlayers[id];
		//console.log(_onScreenPlayers);
	},

	createOther: function(player) {
		var otherPlayer = {

			name: player.name,
			id: player.id,
			isMoving: false,
			currentStep: 0,
			numSteps: 0,
			currentMove: 0,
			currentStepIncX: 0,
			currentStepIncY: 0,
			curFrame: 0,
			numFrames: 4,
			numSteps: 8,
			direction: 0,
			idleCounter: 0,
			getMaster: true,
			chatId: 'player' + player.id,
			chatIdSelector: '#player' + player.id,
			hideTimer: null,
			isChatting: false,

			info: {
				x: player.x,
				y: player.y,
				srcX: 0,
				srcY: 0,
				offX: 0,
				offY: 0,
				prevOffX: 0,
				prevOffY: 0
			},

			renderInfo: {
				srcX: 0,
				srcY: 0,
				x: 0,
				y: 0
			},

			update: function() {
				if(otherPlayer.isMoving) {
					otherPlayer.move();
					otherPlayer.getMaster = true;
				}
				else if(!$game.inTransit) {
					otherPlayer.idle();
				}
				else if($game.inTransit) {
					otherPlayer.getMaster = true;
				}

				if(otherPlayer.getMaster) {
					$game.masterToLocal(otherPlayer.info.x, otherPlayer.info.y, function(loc) {			
						var prevX = loc.x * $game.TILE_SIZE + otherPlayer.info.prevOffX * $game.STEP_PIXELS;
							prevY = loc.y * $game.TILE_SIZE + otherPlayer.info.prevOffY * $game.STEP_PIXELS;
							curX = loc.x * $game.TILE_SIZE + otherPlayer.info.offX * $game.STEP_PIXELS;
							curY = loc.y * $game.TILE_SIZE + otherPlayer.info.offY * $game.STEP_PIXELS;
						
						otherPlayer.renderInfo.prevX = prevX,
						otherPlayer.renderInfo.prevY = prevY,
						otherPlayer.renderInfo.srcX = otherPlayer.info.srcX,
						otherPlayer.renderInfo.srcY = otherPlayer.info.srcY,
						otherPlayer.renderInfo.curX = curX,
						otherPlayer.renderInfo.curY = curY;
					});		

				}	

			},
			
			idle: function() {

				otherPlayer.idleCounter += 1;
				if(otherPlayer.idleCounter >= 64) {
					otherPlayer.idleCounter = 0;
					otherPlayer.info.srcX = 0;
					otherPlayer.info.srcY = 0;
					otherPlayer.getMaster = true;
				}

				else if(otherPlayer.idleCounter == 48) {
					otherPlayer.info.srcX = 32;
					otherPlayer.info.srcY = 0;
					otherPlayer.getMaster = true;
				}

				else {
					otherPlayer.getMaster = false;
				}
			},
			
			clear: function() {

				$game.$renderer.clearCharacter(otherPlayer.renderInfo);	
			},

			slide: function(sX, sY) {
				otherPlayer.info.prevOffX = sX * otherPlayer.numSteps,
				otherPlayer.info.prevOffY = sY * otherPlayer.numSteps;
			},

			resetRenderValues: function() {
				otherPlayer.info.prevOffX = 0,
				otherPlayer.info.prevOffY = 0;
			},

			render: function() {			
					$game.$renderer.renderPlayer(otherPlayer.renderInfo, false);
			},

			beginMove: function(moves) {
				otherPlayer.seriesOfMoves = new Array(moves.length);
				otherPlayer.seriesOfMoves = moves;
				otherPlayer.currentMove = 1;
				otherPlayer.currentStep = 0;
				otherPlayer.isMoving = true;
				otherPlayer.hideChat();
				//console.log(otherPlayer.seriesOfMoves);
			},

			endMove: function() {
				otherPlayer.isMoving = false;

				otherPlayer.info.srcX = 0;
				otherPlayer.info.srcY = 0;
				otherPlayer.info.offX = 0;
				otherPlayer.info.offY = 0;
				otherPlayer.info.prevOffX = 0;
				otherPlayer.info.prevOffY = 0;
			},

			move: function() {
				//if the steps between the tiles has finished,
				//update the master location, and reset steps to go on to next move 
				if(otherPlayer.currentStep >= otherPlayer.numSteps) {
					otherPlayer.currentStep = 0;
					otherPlayer.info.x = otherPlayer.seriesOfMoves[otherPlayer.currentMove].masterX;
					otherPlayer.info.y = otherPlayer.seriesOfMoves[otherPlayer.currentMove].masterY;
					otherPlayer.currentMove += 1;

					//render mini map here *****

				}

				//check to see if done
				if(otherPlayer.currentMove >= otherPlayer.seriesOfMoves.length) {
					otherPlayer.endMove();
				}

				//if not, step through it
				else {
					
					//increment the current step 
					otherPlayer.currentStep += 1;

					//if it the first one, then figure out the direction to face
					if(otherPlayer.currentStep === 1) {
						otherPlayer.currentStepIncX = otherPlayer.seriesOfMoves[otherPlayer.currentMove].masterX - otherPlayer.info.x;
						otherPlayer.currentStepIncY = otherPlayer.seriesOfMoves[otherPlayer.currentMove].masterY - otherPlayer.info.y;
						
						//set the previous offsets to 0 because the last visit
						//was the actual rounded master 
						otherPlayer.info.prevOffX = 0;
						otherPlayer.info.prevOffY = 0;

						//set direction for sprite sheets
						//direction refers to the y location on the sprite sheet
						//since the character will be in different rows
						//will be 0,1,2,3
						if(otherPlayer.currentStepIncX === 1) {
							otherPlayer.direction = 2;
						}
						else if(otherPlayer.currentStepIncX === -1) {
							otherPlayer.direction = 1;
						}
						else if(otherPlayer.currentStepIncY === -1) {
							otherPlayer.direction = 4;
						}
						else {
							otherPlayer.direction = 3;
						}
					}

					else {
						otherPlayer.info.prevOffX = otherPlayer.info.offX;
						otherPlayer.info.prevOffY = otherPlayer.info.offY;
					}
					
					otherPlayer.info.offX = otherPlayer.currentStep * otherPlayer.currentStepIncX;
					otherPlayer.info.offY = otherPlayer.currentStep * otherPlayer.currentStepIncY;

					//try only changing the src (frame) every X frames
					if((otherPlayer.currentStep-1)%8 == 0) {
						otherPlayer.curFrame += 1;
						if(otherPlayer.curFrame >= otherPlayer.numFrames) {
							otherPlayer.curFrame = 0;
						}
					}

					otherPlayer.info.srcX = otherPlayer.curFrame * $game.TILE_SIZE,
					otherPlayer.info.srcY =  otherPlayer.direction * $game.TILE_SIZE*2;
				}
			},

			message: function(message) {
			
				var len = message.length + otherPlayer.name.length + 2;
				var sz = Math.floor(len * 9.1);
				if(otherPlayer.isChatting) {
					clearTimeout(otherPlayer.hideTimer);
					$(otherPlayer.chatIdSelector).text(otherPlayer.name+': '+message);
				}
				else {
					$('.gameboard').append('<p class=\'playerChat\' id=' + otherPlayer.chatId + '>' + otherPlayer.name +': '+ message + '</p>');
				}
				
				$(otherPlayer.chatIdSelector).css({
					'top': otherPlayer.renderInfo.curY - 72,
					'left': otherPlayer.renderInfo.curX - sz / 2,
					'width': sz
				});
				
				otherPlayer.isChatting = true;
				//make it remove after 5 seconds...
				otherPlayer.hideTimer = setTimeout(otherPlayer.hideChat,5000);
			},

			hideChat: function() {
				//remove chat from screen	
				clearTimeout(otherPlayer.hideTimer);
				$(otherPlayer.chatIdSelector).fadeOut('fast',function() {
					$(this).remove();
					otherPlayer.isChatting = false;
				});

			}	
		};
		return otherPlayer;
	},

	render: function() {
		$.each(_onScreenPlayers, function(key, player) { 
  			player.render(); 
		});

	},
	
	sendMoveInfo: function(moves, id) {
		if(_onScreenPlayers[id]) {
			_onScreenPlayers[id].beginMove(moves);
		}
	}
	
};

	// resetRenderValues: function() {
	// 	otherPlayer.prevOffX = 0,
	// 	otherPlayer.prevOffY = 0,
	// 	otherPlayer.info.prevOffX = otherPlayer.prevOffX,
	// 	otherPlayer.info.prevOffY = otherPlayer.prevOffY;

	// },
	
	
			// move: function () {
	
	// },
	// endMove: function () {
	// 	otherPlayer.offX = 0,
	// 	otherPlayer.offY = 0;

	// 	//put the character back to normal position
	// 	otherPlayer.srcX = 0,
	// 	otherPlayer.srcY =  0;

	// 	otherPlayer.prevOffX= 0;
	// 	otherPlayer.prevOffY= 0;

	// 	otherPlayer.info.srcX = otherPlayer.srcX;
	// 	otherPlayer.info.srcY = otherPlayer.srcY;
	// 	otherPlayer.info.x = $game.$others.x;
	// 	otherPlayer.info.y = $game.$others.y;
	// 	otherPlayer.info.offX = otherPlayer.offX;
	// 	otherPlayer.info.offY = otherPlayer.offY;
	// 	otherPlayer.info.prevOffX = otherPlayer.prevOffX;
	// 	otherPlayer.info.prevOffY = otherPlayer.prevOffY;

	// 	$game.$others.isMoving = false;
	// 	$game.$others.render();
	// 	if(_willTravel) {
	// 		var beginTravel = function(){
	// 			if($game.dataLoaded){
	// 				$game.dataLoaded = false;
	// 				$game.beginTransition();
	// 			}	
	// 			else{
	// 				//keep tryin!
	// 				setTimeout(beginTravel,50);
	// 			}
	// 		};
	// 		beginTravel();
	// 	}
	// 	else {
	// 		if($game.$others.npcOnDeck) {
	// 			$game.$others.npcOnDeck = false;
	// 				$game.$npc.show();					
	// 			//trigger npc to popup info and stuff
	// 		}
	// 	}
		
	// };