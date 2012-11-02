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
			$game.masterToLocal(bombed[b].x, bombed[b].y, function(loc){
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
							//reassign color based on previous alpha (increase)
							else if($game.currentTiles[loc.x][loc.y].color.a < .8 ) {
								$game.currentTiles[loc.x][loc.y].color.a += .15;
								
								if($game.currentTiles[loc.x][loc.y].color.a == .35) {
									$game.currentTiles[loc.x][loc.y].color.h = 0;
								}
								else if($game.currentTiles[loc.x][loc.y].color.a == .5) {
									$game.currentTiles[loc.x][loc.y].color.h = 50;
								}
								else if($game.currentTiles[loc.x][loc.y].color.a == .65) {
									$game.currentTiles[loc.x][loc.y].color.h = 100;
								}
								else {
									$game.currentTiles[loc.x][loc.y].color.h = 150;
								}
							}
						}
				
					}
					//add new color data to tile if nothing there
					else {
						$game.currentTiles[loc.x][loc.y].color = bombed[b].color;
  					}
					
					//redraw whole tile, bg included
					$game.$renderer.renderTile(loc.x,loc.y);
					
					//play sound clip
					//$game.$audio.playSound(0);
				}
					
			});
		}
	},

	updateMiniMap: function() {
		//show where the player is and the colored tiles 
		//possibly all players too
		$game.$renderer.renderMiniMap();
	}
}

