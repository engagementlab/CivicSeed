
//map formula:
//viewport width * numQuads in width - (numQuads in width-1 * 2)

$game.$map = {

	coloredTiles: [], //needs x, y, display
	growingSeed: false,
	seedsInProgress: [],

	init: function() {
		setInterval($game.$map.updateMiniMap, 5000);
	},

	growSeeds: function() {


	},

	newBomb: function(bombed) {

		//THIS WILL MOVE TO THE RPC on server, NOT local
		//this will simply send out the coords of the tiles to redraw 

		for(var b = 0; b < bombed.length; b += 1) {
			//only add it to render list if it is on current screen
			var loc = $game.masterToLocal(bombed[b].x, bombed[b].y);
			if(loc) {
				
				//if there IS a color
				if($game.currentTiles[loc.x][loc.y].color) {
					//if the tile is an owner, don't do shit
					if(!$game.currentTiles[loc.x][loc.y].color.owner) {
						//is color, no owner, add count (maybe modify color later)
						//but only if it isn't over-colored

						//if the new guy is now chief
						if(bombed[b].color.owner) {
							$game.currentTiles[loc.x][loc.y].color = bombed[b].color;
						}
						
						//no owner and new one will not be owner but is colored:
						//increase alpha (until at .8)
						else if($game.currentTiles[loc.x][loc.y].color.a < 0.7 ) {
							
							var prevR = $game.currentTiles[loc.x][loc.y].color.r,
								prevG = $game.currentTiles[loc.x][loc.y].color.g,
								prevB = $game.currentTiles[loc.x][loc.y].color.b,
								prevA = $game.currentTiles[loc.x][loc.y].color.a;

							var weightA = prevA / 0.1,
								weightB = 1;


							var newR = Math.floor((weightA * prevR + weightB * bombed[b].color.r) / (weightA + weightB)),
								newG = Math.floor((weightA * prevG + weightB * bombed[b].color.g) / (weightA + weightB)),
								newB = Math.floor((weightA * prevB + weightB * bombed[b].color.b) / (weightA + weightB));

							$game.currentTiles[loc.x][loc.y].color.a = Math.round(($game.currentTiles[loc.x][loc.y].color.a + 0.1) * 10) / 10,
							$game.currentTiles[loc.x][loc.y].color.r = newR,
							$game.currentTiles[loc.x][loc.y].color.g = newG,
							$game.currentTiles[loc.x][loc.y].color.b = newB;


						}
						else {
						}
					}
					else{
					}
				}
				//add new color data to tile if nothing there
				else {
					$game.currentTiles[loc.x][loc.y].color = bombed[b].color;
				}
				//redraw whole tile, bg included
				
				$game.$renderer.clearMapTile(loc.x * $game.TILE_SIZE, loc.y * $game.TILE_SIZE);
				$game.$renderer.renderTile(loc.x,loc.y);
				$game.$renderer.renderMiniTile(loc.x,loc.y);
				
				//play sound clip
				//$game.$audio.playSound(0);
			}
		}
	},

	updateMiniMap: function() {
		//show where the player is and the colored tiles 
		//possibly all players too
		//$game.$renderer.renderMiniPlayers();
	}
}

