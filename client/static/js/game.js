var quadWidthInTiles = 28,
quadHeightInTiles = 13,
numTilesInQuad = quadHeightInTiles*quadWidthInTiles,
topLeftIndex = 0,
topRightIndex = quadWidthInTiles-1,
bottomLeftIndex = numTilesInQuad-quadWidthInTiles-1,
bottomRightIndex = numTilesInQuad-1,
leftIndex = 0,
rightIndex = quadWidthInTiles-1,
topIndex = 0,
bottomIndex = quadHeightInTiles-1;



var Game = {};

Game.fps = 30,
Game.x,
Game.y,
Game.quadrant = 0,
Game.tilesInView,
Game.currentQuad,
Game.neighborQuads=[];

Game.init = function() {
	Game.x = 0;
	Game.y = 0;
	$(".map").css({
		"background-position-x":Game.x+"px",
		"background-position-y":Game.y+"px"
	});
	ss.rpc('multiplayer.init',function(ready){
		Game.getNewQuads(0);
	});
};

Game.getNewQuads = function(index){
	ss.rpc('multiplayer.getMapData',false,index,function(err,data,i){
		Game.currentQuad = data[0];
		console.log(data[0]);
		var nabes = Game.currentQuad.neighbors;
		for(var i=0;i<nabes.length;i++){
			if(nabes[i]>-1){
				ss.rpc('multiplayer.getMapData',i,nabes[i],function(err,data,index){
					Game.neighborQuads[index]=data[0];
				});
			}
			else{
				Game.neighborQuads[i]=false;
			}
		}
	});
};
Game.draw = function() {
 
};

Game.update = function() {
  
};

Game.changeQuad = function(change){
	Game.quadrant += change;
	Game.getNewQuads(Game.quadrant);

};

Game.getNoGo = function(x,y){
	var isNoGo;
	var currentIndex = ((y-1)*quadWidthInTiles)+(x-1);

	//-----corners---------
	//top left (index 0)
	if(x==0 && y==0){
		//doesn't exist
		if(Game.neighborQuads[0]==false){
			isNoGo = true;
		}
		else{
			//bottom right tile
			isNoGo = Game.neighborQuads[0].tiles[bottomRightIndex].nogo;
		}
		console.log('topleft');
	}

	//top right (index 2)
	else if(x==29 && y==0){
		//doesn't exist
		if(Game.neighborQuads[2]==false){
			isNoGo = true;
		}
		else{
			//bottom left tile
			isNoGo = Game.neighborQuads[2].tiles[bottomLeftIndex].nogo;
		}
		console.log('topright');
	}

	//bottom left (index 5)
	else if(x==0 && y==14){
		//doesn't exist
		if(Game.neighborQuads[5]==false){
			isNoGo = true;
		}
		else{
			//top right tile
			isNoGo = Game.neighborQuads[5].tiles[topRightIndex].nogo;
		}
		console.log('bottomleft');
	}

	//bottom right (index 7)
	else if(x==29 && y==14){
		//doesn't exist
		if(Game.neighborQuads[7]==false){
			isNoGo = true;
		}
		else{
			//top left tile
			isNoGo = Game.neighborQuads[7].tiles[topLeftIndex].nogo;
		}
		console.log('bottomright');
	}

	//----edges--------------
	//left (index 3)
	else if(x==0){
		//doesn't exist
		if(Game.neighborQuads[3]==false){
			isNoGo = true;
		}
		else{
			//right edge 
			currentIndex = topRightIndex+((y-1)*quadWidthInTiles);
			isNoGo = Game.neighborQuads[3].tiles[currentIndex].nogo;
		}
		console.log('leftedge');
	}
	//right (index 4)
	else if(x==29){
		//doesn't exist
		if(Game.neighborQuads[4]==false){
			isNoGo = true;
		}
		else{
			//left edge 
			currentIndex = topLeftIndex+((y-1)*quadWidthInTiles);
			isNoGo = Game.neighborQuads[4].tiles[currentIndex].nogo;
		}
		console.log('rightedge');
	}
	//top (index 1)
	else if(y==0){
		//doesn't exist
		if(Game.neighborQuads[1]==false){
			isNoGo = true;
		}
		else{
			//bottom edge 
			currentIndex = bottomLeftIndex+x-1;
			isNoGo = Game.neighborQuads[1].tiles[currentIndex].nogo;
		}
		console.log('topedge');
	}
	//bottom (index 6)
	else if(y==14){
		//doesn't exist
		if(Game.neighborQuads[6]==false){
			isNoGo = true;
		}
		else{
			//bottom edge 
			currentIndex = topLeftIndex+x-1;
			isNoGo = Game.neighborQuads[6].tiles[currentIndex].nogo;
		}
		console.log('bottomedge');
	}
	
	//middle (current quad)
	else{
		isNoGo = Game.currentQuad.tiles[currentIndex].nogo;
		console.log('middle');
	}

	return isNoGo;
};

Game.info = function(){
	console.log(Game.neighborQuads);
}


