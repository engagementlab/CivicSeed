
$game.$mouse = {
	
	prevX: 0,
	prevY: 0,
	curX: 0,
	curY: 0,
	changed: false,
	index: 0,

	//returns local x,y grid data based on mouse location
	updateMouse: function(mouseInfo, clicked) {

		var x = mouseInfo.x - mouseInfo.offX;
		var y = mouseInfo.y - mouseInfo.offY;

		$game.$mouse.prevX = $game.$mouse.curX;
		$game.$mouse.prevY = $game.$mouse.curY;

		$game.$mouse.curX = Math.floor(x/32);
		$game.$mouse.curY = Math.floor(y/32);

		
		if(mouseInfo.debug){
			console.log($game.currentTiles[$game.$mouse.curX][$game.$mouse.curY]);
		}
		
		//extremes(if at edge it will be just over)
		if($game.$mouse.curX > 29) {
			$game.$mouse.curX = 29;
		}
		else if($game.$mouse.curX < 0) {
			$game.$mouse.curX = 0;
		}
		
		if($game.$mouse.curY > 14) {
			$game.$mouse.curY = 14;
		}
		else if($game.$mouse.curY < 0) {
			$game.$mouse.curY = 0;
		}

		//if the grid is different update boolean
		if($game.$mouse.curX !== $game.$mouse.prevX || $game.$mouse.curY !== $game.$mouse.prevY){
			//render new
			var mouseStuff = {
				pX: $game.$mouse.prevX,
				pY: $game.$mouse.prevY,
				cX: $game.$mouse.curX,
				cY: $game.$mouse.curY
			};
			$game.$renderer.renderMouse(mouseStuff);
		}

		

		if(clicked) {
			
			//check if it is a nogo or npc
			//if the tile BELOW the tile clicked is npc,
			//then user clicked the head, so act like npc
			if($game.$player.seedMode > 0) {
				if(!$game.$player.awaitingBomb) {
					var m = {
							mouse: true,
							x: $game.$mouse.curX,
							y: $game.$mouse.curY,
							mode: $game.$player.seedMode
						};
					$game.$player.dropSeed(m);
				}
			}
			else {

				//if clicking on a player, show their info
				var mX = $game.currentTiles[$game.$mouse.curX][$game.$mouse.curY].x,
					mY = $game.currentTiles[$game.$mouse.curX][$game.$mouse.curY].y;

				$game.$others.playerCard(mX, mY, function(ret) {
					//if we clicked a player, show their info

					if(ret) {
						ss.rpc('game.player.getInfo', ret, function(user) {
							var msg = user.dropped + ' tiles colored || level ' + user.level;
							$game.$others.message(msg, ret);
						});
					}
					else {
						var state = $game.getTileState($game.$mouse.curX, $game.$mouse.curY);
						//go
						if(state === -1) {
							$game.$player.beginMove($game.$mouse.curX,$game.$mouse.curY);
							if($game.$npc.isChat) {
								$game.$npc.hideChat();
							}
							else if($game.$gnome.isChat) {
								$game.$gnome.hideChat();
							}
							
						}
						
						//npc
						else if(state >= 0 ) {
							//set index val so reousrce can show right one
			
							//if you click on a different square then the previously
							//selected npc, then hide the npc info if it is showing
							if(state !== $game.$gnome.index) {
								$game.$npc.selectNpc(state);
					
								//move them to the spot to the
								//BOTTOM LEFT corner of the npc
								//(consistent so we leave that open in tilemap)
								//also make sure it is not a transition tile
								$game.$player.npcOnDeck = true;
								$game.$player.beginMove($game.$mouse.curX-2,$game.$mouse.curY+1);
							}

							else {
								$('.speechBubble button').addClass('hideButton');
								$game.$gnome.show();
							}
						}
					}
				});
			}
		}
	},

	updateKey: function(keyInfo) {
		//w 119
		//a 97
		//s 115
		//d 100
		var currentSpot = $game.$player.getPosition(),
			local = $game.masterToLocal(currentSpot.x,currentSpot.y),
			targetX = 0,
			targetY = 0;

		//up
		if(keyInfo === 87) {
			targetY = -1;
		}
		//down
		else if(keyInfo === 83) {
			targetY = 1;
		}
		//left
		else if(keyInfo === 65) {
			targetX = -1;
		}
		//right
		else if(keyInfo === 68) {
			targetX = 1;
		}


		//go
		
		$game.$player.beginKeyWalk(targetX,targetY);
		if($game.$npc.isChat) {
			$game.$npc.hideChat();
		}
		else if($game.$gnome.isChat) {
			$game.$gnome.hideChat();
		}
	}

};
