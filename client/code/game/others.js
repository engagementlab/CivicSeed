
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
		console.log(player.id);
		if(player.id != $game.$player.id) {
			//set inview if nearby
			var newbie = $game.$others.createOther(player);
			_onScreenPlayers[player.id] = newbie;
			console.log("added: " + player.id);
		}
	},

	update: function() {
		//if is moving, move
		$.each(_onScreenPlayers, function(key, player) { 
  			player.update(); 
		});
	},

	slide: function(slideX, slideY) {

		$.each(_onScreenPlayers, function(key, player) { 
  			player.slide(slideX, slideY); 
		});

	},

	remove: function(id) {
		//clear from screen...
		delete _onScreenPlayers[id];
		console.log(_onScreenPlayers);
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

			
			renderInfo: {
				x: player.x,
				y: player.y,
				srcX: 0,
				srcY: 0,
				offX: 0,
				offY: 0,
				prevOffX: 0,
				prevOffY: 0
			},
			update: function() {
				
				if(otherPlayer.isMoving) {
					otherPlayer.move();
				}
			},

			slide: function(sX, sY) {
				otherPlayer.renderInfo.prevOffX = sX * otherPlayer.numSteps,
				otherPlayer.renderInfo.prevOffY = sY * otherPlayer.numSteps;
			},

			render: function() {			
					$game.$renderer.renderOther(otherPlayer.renderInfo);
			},

			beginMove: function(moves) {
				otherPlayer.seriesOfMoves = new Array(moves.length);
				otherPlayer.seriesOfMoves = moves;
				otherPlayer.currentMove = 1;
				otherPlayer.currentStep = 0;
				otherPlayer.isMoving = true;
				//console.log(otherPlayer.seriesOfMoves);
			},

			endMove: function() {
				otherPlayer.isMoving = false;

				otherPlayer.renderInfo.srcX = 0;
				otherPlayer.renderInfo.srcY = 0;
				otherPlayer.renderInfo.offX = 0;
				otherPlayer.renderInfo.offY = 0;
				otherPlayer.renderInfo.prevOffX = 0;
				otherPlayer.renderInfo.prevOffY = 0;
			},

			move: function() {
				//if the steps between the tiles has finished,
				//update the master location, and reset steps to go on to next move 
				if(otherPlayer.currentStep >= otherPlayer.numSteps) {
					otherPlayer.currentStep = 0;
					otherPlayer.renderInfo.x = otherPlayer.seriesOfMoves[otherPlayer.currentMove].masterX;
					otherPlayer.renderInfo.y = otherPlayer.seriesOfMoves[otherPlayer.currentMove].masterY;
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
						otherPlayer.currentStepIncX = otherPlayer.seriesOfMoves[otherPlayer.currentMove].masterX - otherPlayer.renderInfo.x;
						otherPlayer.currentStepIncY = otherPlayer.seriesOfMoves[otherPlayer.currentMove].masterY - otherPlayer.renderInfo.y;
						
						//set the previous offsets to 0 because the last visit
						//was the actual rounded master 
						otherPlayer.renderInfo.prevOffX = 0;
						otherPlayer.renderInfo.prevOffY = 0;

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
						otherPlayer.renderInfo.prevOffX = otherPlayer.renderInfo.offX;
						otherPlayer.renderInfo.prevOffY = otherPlayer.renderInfo.offY;
					}
					
					otherPlayer.renderInfo.offX = otherPlayer.currentStep * otherPlayer.currentStepIncX;
					otherPlayer.renderInfo.offY = otherPlayer.currentStep * otherPlayer.currentStepIncY;

					//try only changing the src (frame) every X frames
					if((otherPlayer.currentStep-1)%8 == 0) {
						otherPlayer.curFrame += 1;
						if(otherPlayer.curFrame >= otherPlayer.numFrames) {
							otherPlayer.curFrame = 0;
						}
					}

					otherPlayer.renderInfo.srcX = otherPlayer.curFrame * $game.TILE_SIZE,
					otherPlayer.renderInfo.srcY =  otherPlayer.direction * $game.TILE_SIZE*2;
				}
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
	// 	otherPlayer.renderInfo.prevOffX = otherPlayer.prevOffX,
	// 	otherPlayer.renderInfo.prevOffY = otherPlayer.prevOffY;

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

	// 	otherPlayer.renderInfo.srcX = otherPlayer.srcX;
	// 	otherPlayer.renderInfo.srcY = otherPlayer.srcY;
	// 	otherPlayer.renderInfo.x = $game.$others.x;
	// 	otherPlayer.renderInfo.y = $game.$others.y;
	// 	otherPlayer.renderInfo.offX = otherPlayer.offX;
	// 	otherPlayer.renderInfo.offY = otherPlayer.offY;
	// 	otherPlayer.renderInfo.prevOffX = otherPlayer.prevOffX;
	// 	otherPlayer.renderInfo.prevOffY = otherPlayer.prevOffY;

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