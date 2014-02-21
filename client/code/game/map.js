'use strict';

var _nextTiles = null,
    _gridTiles = null,
    _graph = null,
    _nextX = 0,
    _nextY = 0,
    _stepX = 0,
    _stepY = 0,
    _nextTiles = [],
    _shiftArray = 0,
    _stepNumber = 0,
    _leftEdge = 0,
    _rightEdge = 0,
    _topEdge = 0,
    _bottomEdge = 0;

var $map = $game.$map = {

  coloredTiles: [],
  growingSeed: false,
  seedsInProgress: [],
  collectiveImage: null,
  ready: false,
  miniMap: {},
  currentTiles: null,
  dataLoaded: false,
  numberOfSteps: 0,
  stepDirection: null,

  // Place player on map
  init: function (callback) {
    var id       = $game.$player.id,
        position = $game.$player.getPosition(),
        color    = $game.$player.getColor()

    $game.$map.addPlayer(id, position.x, position.y, color)

    ss.rpc('game.map.init', function () {
      $game.$map.ready = true
      callback()
    })
  },

  resetInit: function () {
    _nextTiles = null;
    _gridTiles = null;
    _graph = null;
    _nextX = 0;
    _nextY = 0;
    _stepX = 0;
    _stepY = 0;
    _nextTiles = [];
    _shiftArray = 0;
    _stepNumber = 0;
    _leftEdge = 0;
    _rightEdge = 0;
    _topEdge = 0;
    _bottomEdge = 0;

    $game.$map.coloredTiles = [];
    $game.$map.growingSeed = false;
    $game.$map.seedsInProgress = [];
    $game.$map.collectiveImage = null;
    $game.$map.ready = false;
    $game.$map.miniMap = {};
    $game.$map.currentTiles = null;
    $game.$map.dataLoaded = false;
    $game.$map.numberOfSteps = 0;
    $game.$map.stepDirection = null;
  },

  //pull down current viewport tiles, create the pathfinding grid
  firstStart: function (callback) {
    if ($game.bossModeUnlocked && $game.$player.currentLevel > 3) {
      $('#minimap-player').hide()
      _setupBossMap();
      $game.$map.createPathGrid(function () {
        callback();
      }, true);
    }
    else {
      var info = {
            x:    $game.masterX,
            y:    $game.masterY,
            numX: $game.VIEWPORT_WIDTH,
            numY: $game.VIEWPORT_HEIGHT
          };
      _getTiles(info, function () {
        _copyTileArray(function () {
          $game.$map.createPathGrid(function () {
            callback();
          });
        });
      });
    }
  },

  //create the go/nogo tiles based on tile data, if bypass then all are go tiles
  createPathGrid: function (callback, bypass) {
    _gridTiles = null;
    _graph = null;
    _gridTiles = new Array($game.VIEWPORT_HEIGHT);

    var y = $game.VIEWPORT_HEIGHT;

    while(--y >= 0) {
      _gridTiles[y] = new Array($game.VIEWPORT_WIDTH);

      var x = $game.VIEWPORT_WIDTH;
      while(--x >= 0) {
        if (bypass) {
          _gridTiles[y][x] = 1;
        } else {
          //the pathfinding takes 1 means its clear 0 not
          var val = $game.$map.getTileState(x, y),
            tempNoGo;
          if (val === -1) {
            tempNoGo = 1;
          }
          else {
            tempNoGo = 0;
          }
          _gridTiles[y][x] = tempNoGo;
        }
      }
    }

    _graph = new Graph(_gridTiles);
    callback();
  },

  //return if a tile is go or nogo (with special exception for NPCs)
  getTileState: function (x, y) {
    //must first do a check to see if the tile BOTTOM is the npc
    //if so, then return npc val (THIS IS A HACK SORT OF)
    var tileStateVal = $game.$map.currentTiles[x][y].tileState;
    if ( y < $game.VIEWPORT_HEIGHT - 1) {
      var belowState = $game.$map.currentTiles[x][y+1].tileState;

      if (belowState >= 0 ) {
        tileStateVal = belowState;
      }
    }
    return tileStateVal;
  },

  // Return true if player is on the edge of the world
  isMapEdge: function (x, y) {
    return $game.$map.currentTiles[x][y].isMapEdge
  },

  //add a player to the minimap
  addPlayer: function (id, x, y, col) {
    $game.$map.miniMap[id] = {};
    $game.$map.miniMap[id].x = x;
    $game.$map.miniMap[id].y = y;
    $game.$map.miniMap[id].col = col;
    $game.$map.render();
  },

  //update a player on the minimap
  updatePlayer: function (id, x, y) {
    $game.$render.clearMiniMap();
    $game.$map.miniMap[id].x = x;
    $game.$map.miniMap[id].y = y;
    $game.$map.render();
  },

  //remove a player from the minimap
  removePlayer: function (id) {
    $game.$render.clearMiniMap();
    delete $game.$map.miniMap[id];
    $game.$map.render();
  },

  //render all the players on the minimap
  render: function () {
    $game.$render.renderMiniMapConstants();
    $.each($game.$map.miniMap, function (key, player) {
      $game.$render.renderMiniPlayer(player);
    });
  },

  //put new color on the map
  newBomb: function (bombed, id) {
    for(var b = 0; b < bombed.length; b += 1) {
      //only add it to render list if it is on current screen
      var loc = $game.$map.masterToLocal(bombed[b].x, bombed[b].y),
        curTile = null;
      if (loc) {
        //if there IS a color
        curTile = $game.$map.currentTiles[loc.x][loc.y];
        curTile.colored = true;
        $game.$render.clearMapTile(loc.x * $game.TILE_SIZE, loc.y * $game.TILE_SIZE);
        $game.$render.renderTile(loc.x,loc.y);

        if (id === $game.$player.id) {
          $game.$render.renderMiniTile(bombed[b].x, bombed[b].y);
        }
      }
    }
  },

  //save an image from the color minimap for the player
  saveImage: function () {
    var myDrawing = document.getElementById('minimap-tile');
    var drawingURL = myDrawing.toDataURL('img/png');
    return drawingURL;
  },

  //get all the images from all players and make composite
  createCollectiveImage: function () {
    $('.colorMapEveryone').empty();
    ss.rpc('game.player.getAllImages', $game.$player.id, function (data) {
      var myImage = $game.$map.saveImage();
      var index = data.length;
      //go thru each image create a new image using canvas?
      while(--index > -1) {
        $('.colorMapEveryone').append('<img src="'+ data[index] + '">');
      }
      $('.colorMapEveryone').append('<img src="'+ myImage + '">');
    });
  },

  //calculate a path using pathfinding
  findPath: function (local, master, callback) {
    //calc local for start point for pathfinding
    var start = _graph.nodes[local.y][local.x],
      end = _graph.nodes[master.y][master.x];

    $game.$astar.search(_graph.nodes, start, end, function (result) {
      callback(result);
    });
  },

  //figure out how to shift the viewport during a transition
  calculateNext: function (x, y) {
    var getThisManyX,
        getThisManyY,
        getThisX,
        getThisY;

    //left
    if (x === 0) {
      _nextX = $game.masterX - ($game.VIEWPORT_WIDTH - 2);
      _stepX = -1;
      _shiftArray = -1;
      $game.$map.numberOfSteps = $game.VIEWPORT_WIDTH - 2;
      $game.$map.stepDirection = 'left';
      getThisManyX = $game.VIEWPORT_WIDTH - 2;
      getThisManyY = $game.VIEWPORT_HEIGHT;
      getThisX = _nextX;
      getThisY = $game.masterY;
    }
    //right
    else if (x === $game.VIEWPORT_WIDTH - 1) {
      _nextX = $game.masterX + $game.VIEWPORT_WIDTH - 2;
      _stepX = 1;
      _shiftArray = 1;
      $game.$map.numberOfSteps = $game.VIEWPORT_WIDTH - 2;
      $game.$map.stepDirection = 'right';
      getThisManyX = $game.VIEWPORT_WIDTH - 2;
      getThisManyY = $game.VIEWPORT_HEIGHT;
      getThisX = _nextX + 2;
      getThisY = $game.masterY;
    }
    //up
    else if (y === 0) {
      _nextY = $game.masterY - ($game.VIEWPORT_HEIGHT - 2);
      _stepY = -1;
      _shiftArray = -$game.totalVIEWPORT_HEIGHT;
      $game.$map.numberOfSteps = $game.VIEWPORT_HEIGHT - 2;
      $game.$map.stepDirection = 'up';
      getThisManyX = $game.VIEWPORT_WIDTH;
      getThisManyY = $game.VIEWPORT_HEIGHT - 2;
      getThisX = $game.masterX;
      getThisY = _nextY;
    }
    //down
    else if (y === $game.VIEWPORT_HEIGHT - 1) {
      _nextY = $game.masterY+$game.VIEWPORT_HEIGHT - 2;
      _stepY = 1;
      _shiftArray = $game.totalVIEWPORT_HEIGHT;
      $game.$map.numberOfSteps = $game.VIEWPORT_HEIGHT - 2;
      $game.$map.stepDirection = 'down';
      getThisManyX = $game.VIEWPORT_WIDTH;
      getThisManyY = $game.VIEWPORT_HEIGHT - 2;
      getThisX = $game.masterX;
      getThisY = _nextY + 2;
    }

    _getTiles({x:getThisX, y: getThisY, numX: getThisManyX, numY: getThisManyY}, function () {
      return;
    });
  },

  //go thru and copy new tiles to current tiles to shift the map over
  transitionMap: function (stepNumber) {

    //--------RIGHT------------
    //go thru current array and shift everthing
    if ($game.$map.stepDirection === 'right') {
      //shift all except last column
      for (var i = 0; i < $game.VIEWPORT_WIDTH - 1; i++) {
        for (var j = 0; j  < $game.VIEWPORT_HEIGHT; j++) {
          $game.$map.currentTiles[i][j] = $game.$map.currentTiles[ i + 1 ][j];
        }
      }

      //shift a new column from the next array to the last spot
      var j = $game.VIEWPORT_HEIGHT;
      while(--j >= 0) {
        $game.$map.currentTiles[$game.VIEWPORT_WIDTH - 1][j] = _nextTiles[stepNumber - 1][j];
      }
      $game.masterX += 1;
      $game.$player.slide(1,0);
      $game.$others.slide(1,0);
    }
    //--------LEFT------------
    //go thru current array and shift everthing
    if ($game.$map.stepDirection === 'left') {
      //shift all except last column
      for (var i = $game.VIEWPORT_WIDTH - 1; i > 0; i--) {
        for (var j = 0; j < $game.VIEWPORT_HEIGHT; j++) {
          $game.$map.currentTiles[i][j] = $game.$map.currentTiles[ i - 1 ][j];
        }
      }

      //shift a new column from the next array to the last spot
      var j = $game.VIEWPORT_HEIGHT;
      while(--j >= 0) {
        $game.$map.currentTiles[0][j] = _nextTiles[_nextTiles.length - stepNumber ][j];
      }

      $game.masterX -= 1;
      $game.$player.slide(-1,0);
      $game.$others.slide(-1,0);
    }
    //--------UP------------
    //go thru current array and shift everthing
    if ($game.$map.stepDirection === 'up') {
      //shift all except last column
      for (var j = $game.VIEWPORT_HEIGHT - 1; j > 0; j--) {
        for (var i = 0; i < $game.VIEWPORT_WIDTH; i++) {
          $game.$map.currentTiles[i][j] = $game.$map.currentTiles[i][j - 1];
        }
      }

      //shift a new column from the next array to the last spot
      var i = $game.VIEWPORT_WIDTH;
      while(--i >= 0) {
        $game.$map.currentTiles[i][0] = _nextTiles[i][_nextTiles[0].length - stepNumber];
      }
      $game.masterY -= 1;
      $game.$player.slide(0,-1);
      $game.$others.slide(0,-1);
    }
    //--------DOWN------------
    //go thru current array and shift everthing
    if ($game.$map.stepDirection === 'down') {

      //shift all except last column
      for (var j = 0; j < $game.VIEWPORT_HEIGHT - 1; j++) {
        for (var i = 0; i < $game.VIEWPORT_WIDTH; i++) {
          $game.$map.currentTiles[i][j] = $game.$map.currentTiles[i][j + 1];
        }
      }

      //shift a new column from the next array to the last spot
      var k = $game.VIEWPORT_WIDTH;
      while(--k >= 0) {
        $game.$map.currentTiles[k][$game.VIEWPORT_HEIGHT - 1] = _nextTiles[k][stepNumber - 1];
      }
      $game.masterY += 1;
      $game.$player.slide(0,1);
      $game.$others.slide(0,1);
    }
    //update the edges since we shift em son
    _leftEdge   = $game.masterX
    _rightEdge  = $game.masterX + $game.VIEWPORT_WIDTH
    _topEdge    = $game.masterY
    _bottomEdge = $game.masterY + $game.VIEWPORT_HEIGHT + 1

    window.requestAnimationFrame($game.stepTransition)
  },

  //convert master map coords to local coords
  masterToLocal: function (x, y, offscreen) {
    //if this works I am a dolt for not doing it earlier (I am a dolt)
    var local = {
      x: x - _leftEdge,
      y: y - _topEdge
    };

    if (local.y <= $game.VIEWPORT_HEIGHT-1 && local.y >= 0 && local.x <= $game.VIEWPORT_WIDTH -1 && local.x >= 0) {
      return local;
    } else {
      if (offscreen) {
        return local;
      } else {
        return false;
      }
    }
  },

  //set the boundaries of current viewport
  setBoundaries: function () {
    _leftEdge   = $game.masterX
    _rightEdge  = $game.masterX + $game.VIEWPORT_WIDTH
    _topEdge    = $game.masterY
    _bottomEdge = $game.masterY + $game.VIEWPORT_HEIGHT + 1
  }
};

/**
  *
  *  PRIVATE FUNCTIONS
  *
 **/

var _map = {

}

//get new tiles from DB for new viewport
function _getTiles (data, callback) {
  $game.$map.dataLoaded = false;
  var x1 = data.x,
      y1 = data.y,
      x2 = data.x + data.numX,
      y2 = data.y + data.numY;

  ss.rpc('game.map.getMapData',x1, y1, x2, y2, function (map, colors) {
    //breakdown single array into 2d array
    var index = null;

    _nextTiles = new Array(data.numX);
    var i = data.numX;

    while(--i >= 0) {
      _nextTiles[i] = new Array(data.numY);
      var j = data.numY;

      while(--j >= 0) {
        index = j * data.numX + (i % data.numX);
        _nextTiles[i][j] = map[index];
      }
    }
    //now go thru colors and attach to proper tile
    //should be going left to right, top to bottom
    var cLength = colors.length,
      a = 0,
      b = 0,
      c = 0,
      aMax = _nextTiles.length,
      bMax = _nextTiles[0].length;

    while(c < cLength) {
      var found = false;
      while(!found) {
        if (_nextTiles[a][b].mapIndex === colors[c].mapIndex) {
          _nextTiles[a][b].colored = true;
          found = true;
        }
        a++;
        if (a >= aMax) {
          a = 0;
          b++;
          if (b >= bMax) {
            console.log('errrr');
            found = true;
          }
        }
      }
      c++;
    }
    $game.$map.dataLoaded = true;
    callback();
  });
}

//copy over new tiles to current tiles
function _copyTileArray(callback) {
  // $game.$map.currentTiles = new Array($game.VIEWPORT_WIDTH);
  $game.$map.currentTiles = [$game.VIEWPORT_WIDTH];

  var i = $game.VIEWPORT_WIDTH;
  while(--i >= 0) {
    $game.$map.currentTiles[i] = [$game.VIEWPORT_HEIGHT];
    var j = $game.VIEWPORT_HEIGHT;
    while(--j >= 0) {
      $game.$map.currentTiles[i][j] = _nextTiles[i][j];
    }
  }
  //reset array
  _nextTiles = [];
  callback();
}

//create the data for the boss map
function _setupBossMap() {
  console.log('Setting up Boss Map')
  $game.$map.currentTiles = [$game.VIEWPORT_WIDTH];
  var i = $game.VIEWPORT_WIDTH;
  while (--i >= 0) {
    $game.$map.currentTiles[i] = [$game.VIEWPORT_HEIGHT];
    var j = $game.VIEWPORT_HEIGHT;
    while (--j >= 0) {
      $game.$map.currentTiles[i][j] = {
        x: i,
        y: j,
        tileState: -1,
        isMapEdge: true,
        background: 0,
        background2: 0,
        background3: 0,
        foreground: 0,
        foreground2: 0,
        mapIndex: j * $game.VIEWPORT_WIDTH + i
      }
    }
  }
  console.log($game.$map.currentTiles)
}