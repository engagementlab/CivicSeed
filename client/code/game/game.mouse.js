'use strict';

var _prevX = 0,
    _prevY = 0,
    _curX = 0,
    _curY = 0,
    _changed = false,
    _index = 0;

var $mouse = $game.$mouse = {
  drawMode: false,

  resetInit: function () {
    _prevX = 0;
    _prevY = 0;
    _curX = 0;
    _curY = 0;
    _changed = false;
    _index = 0;

    $game.$mouse.drawMode = false;
  },

  onMove: function (mouseInfo) {
    var x = mouseInfo.x - mouseInfo.offX,
        y = mouseInfo.y - mouseInfo.offY,
        tileSize = $game.TILE_SIZE

    _prevX = _curX;
    _prevY = _curY;

    var tempX = Math.floor(x / tileSize),
        tempY = Math.floor(y / tileSize);

    //extremes(if at edge it will be just over)
    if (tempX > $game.VIEWPORT_WIDTH-1) {
      _curX = $game.VIEWPORT_WIDTH-1;
    } else if (tempX < 0) {
      _curX = 0;
    } else {
      _curX = tempX;
    }

    if (tempY > $game.VIEWPORT_HEIGHT - 1) {
      _curY = $game.VIEWPORT_HEIGHT - 1;
    }
    else if (tempY < 0) {
      _curY = 0;
    } else {
      _curY = tempY;
    }

    //if the grid is different update render
    if (_curX !== _prevX || _curY !== _prevY) {
      $mouse.updateCursor()

      // Draw seed mode (does stuff on drag)
      if ($game.$mouse.drawMode) {
        $game.$player.drawSeed({x:_curX, y:_curY});
      }

    }
  },

  // Delegates to $render to show new mouse cursor
  updateCursor: function () {
    $game.$render.renderMouse({
      pX: _prevX,
      pY: _prevY,
      cX: _curX,
      cY: _curY
    })
  },

  // On mouse click, perform actions
  onClick: function (mouseInfo) {
    if (mouseInfo.event.which === 3) {
      console.log('Right mouse button clicked')
    }

    if ($game.bossModeUnlocked && $game.$player.currentLevel > 3) {
      if ($game.$player.seedMode) {
        $game.$boss.dropSeed({x:_curX, y:_curY});
      } else {
        $game.$player.beginMove(_curX, _curY);
      }
    } else {
      //if the player is in seed mode, determine if drop seed or exit mode
      if ($game.$player.seedMode) {
        if (!$game.$player.awaitingBomb) {
          var m = {
              mouse: true,
              x: _curX,
              y: _curY,
              mode: $game.$player.seedMode
            };
          var r = $game.$player.dropSeed(m);
          if (!r) {
            $('.hud-seed').removeClass('hud-button-active');
          }
        }
      }
      else {
        //if clicking on other player, show their info
        var mX = $game.$map.currentTiles[_curX][_curY].x,
            mY = $game.$map.currentTiles[_curX][_curY].y;
        var user = $game.$others.playerCard(mX, mY, true);

        if (!user) {
          //determine if the player can go to new tile
          var state = $game.$map.getTileState(_curX, _curY);
          //if the player isn't "searching" for a path it is a green tile, move
          if (state === -1 && !$game.$player.pathfinding) {
            $game.$player.beginMove(_curX,_curY);
            if ($game.checkFlag('npc-chatting')) {
              $game.$npc.hideSpeechBubble();
            }
          }
          //they clicked on an NPC
          else if (state >= 0 ) {
            if (state !== $game.$botanist.index && !$game.$player.pathfinding) {
              if ($game.checkFlag('npc-chatting')) {
                $game.$npc.hideSpeechBubble();
              }
              $game.$npc.selectNpc(state);
              //move top bottom left of NPC
              $game.$player.beginMove(_curX-2,_curY+1);
            }
            else {
              //show botanist stuff cuz you clicked him!
              $('#speech-bubble button').hide();
              $game.$botanist.show();
            }
          }
        }
      }
    }

    $mouse.debug()
  },

  // Output clicked tile to the console
  debug: function () {
    console.log($game.$map.currentTiles[_curX][_curY]);
  },

  //returns local x,y grid data based on mouse location
  getCurrentPosition: function () {
    return {x: _curX, y: _curY};
  }

};
