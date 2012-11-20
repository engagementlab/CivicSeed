
//map formula:
//viewport width * numQuads in width - (numQuads in width-1 * 2)

$game.$map = {

	coloredTiles: [], //needs x, y, display
	growingSeed: false,
	seedsInProgress: [],

	miniMap: {},

	init: function() {
		$game.$map.paintMini();
	},
	paintMini: function() {

	},
	growSeeds: function() {

	},

	addPlayer: function(id, x, y, col) {
		$game.$map.miniMap[id] = {};
		$game.$map.miniMap[id].x = x,
		$game.$map.miniMap[id].y = y;
		$game.$map.miniMap[id].col = col;
		$game.$map.render();
	},

	updatePlayer: function(id, x, y) {
		$game.$renderer.clearMiniMap();
		$game.$map.miniMap[id].x = x;
		$game.$map.miniMap[id].y = y;
		$game.$map.render();
	},

	removePlayer: function(id) {
		delete miniMap[id];
	},

	render: function() {
		$.each($game.$map.miniMap, function(key, player) {
			$game.$renderer.renderMiniPlayer(player);
		});
	},

	newBomb: function(bombed) {

		//THIS WILL MOVE TO THE RPC on server, NOT local
		//this will simply send out the coords of the tiles to redraw 

		for(var b = 0; b < bombed.length; b += 1) {
			//only add it to render list if it is on current screen
			var loc = $game.masterToLocal(bombed[b].x, bombed[b].y),
				curTile = null;
			if(loc) {
				
				//if there IS a color
				curTile = $game.currentTiles[loc.x][loc.y];
				if(curTile.color) {
					//if the tile is an owner, don't do shit
					if(!curTile.color.owner) {
						//is color, no owner, add count (maybe modify color later)
						//but only if it isn't over-colored

						//if the new guy is now chief
						if(bombed[b].color.owner) {
							curTile.color = bombed[b].color;
						}
						
						//no owner and new one will not be owner but is colored:
						//increase alpha (until at .8)
						else if(curTile.color.a < 0.7 ) {
							
							var prevR = curTile.color.r,
								prevG = curTile.color.g,
								prevB = curTile.color.b,
								prevA = curTile.color.a;

							var weightA = prevA / 0.1,
								weightB = 1;


							var newR = Math.floor((weightA * prevR + weightB * bombed[b].color.r) / (weightA + weightB)),
								newG = Math.floor((weightA * prevG + weightB * bombed[b].color.g) / (weightA + weightB)),
								newB = Math.floor((weightA * prevB + weightB * bombed[b].color.b) / (weightA + weightB));

							curTile.color.a = Math.round((curTile.color.a + 0.1) * 10) / 10,
							curTile.color.r = newR,
							curTile.color.g = newG,
							curTile.color.b = newB;
						}
					}
				}
				//add new color data to tile if nothing there
				else {
					curTile.color = bombed[b].color;
				}
				//redraw whole tile, bg included
				
				$game.$renderer.clearMapTile(loc.x * $game.TILE_SIZE, loc.y * $game.TILE_SIZE);
				$game.$renderer.renderTile(loc.x,loc.y);
				$game.$renderer.renderMiniTile(loc.x,loc.y);
				
				//play sound clip
				//$game.$audio.playSound(0);
			}
		}
	}
}

