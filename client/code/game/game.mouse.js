'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    mouse.js

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

$game.$mouse = (function () {

  var _prevX = 0,
      _prevY = 0,
      _curX  = 0,
      _curY  = 0

  function onMove (mouseInfo) {
    // Where is the mouse pointing at right now?
    var x = mouseInfo.x - mouseInfo.offX,
        y = mouseInfo.y - mouseInfo.offY,
        TILE_SIZE = $game.TILE_SIZE,
        tempX     = Math.floor(x / TILE_SIZE),
        tempY     = Math.floor(y / TILE_SIZE)

    // Set where the mouse was at previously
    _prevX = _curX
    _prevY = _curY

    // Limit extreme values to gameboard width and height
    // Verified speed checking: http://jsperf.com/constraining
    _curX = Math.max(Math.min($game.VIEWPORT_WIDTH  - 1, tempX), 0)
    _curY = Math.max(Math.min($game.VIEWPORT_HEIGHT - 1, tempY), 0)

    // If the mouse cursor is pointing on a different tile,
    // re-render the cursor
    if (_curX !== _prevX || _curY !== _prevY) {
      updateCursor()

      // If we are in draw seed mode (e.g. the player is dragging the mouse)
      // then perform draw seed action here.
      if ($game.flags.check('draw-mode')) {
        $game.$player.drawSeed({
          x: _curX,
          y: _curY
        })
      }

    }
  }

  // On mouse click, perform actions
  function onClick (mouseInfo) {
    if (mouseInfo.event.which === 3) {
      console.log('Right mouse button clicked')
    }

    // Boss mode (?)
    if ($game.bossModeUnlocked && $game.$player.currentLevel > 3) {
      if ($game.$player.seedMode) {
        $game.$boss.dropSeed({ x: _curX, y: _curY })
      } else {
        $game.$player.beginMove(_curX, _curY)
      }
    } else {

      // If the player is in seed mode, determine if drop seed or exit seed mode
      if ($game.$player.seedMode) {
        if ($game.flags.check('awaiting-seed') === false) {
          var m = {
            mouse:  true,
            x:      _curX,
            y:      _curY,
            mode:   $game.$player.seedMode
          }
          var r = $game.$player.dropSeed(m)
          if (!r) {
            $game.$input.inactiveHUDButton('.hud-seed')
          }
        }
      }
      else {
        // If clicking on other player, show their info
        var mX    = $game.$map.currentTiles[_curX][_curY].x,
            mY    = $game.$map.currentTiles[_curX][_curY].y,
            user  = $game.$others.playerCard(mX, mY, true)

        if (!user) {
          //determine if the player can go to new tile
          var state = $game.$map.getTileState(_curX, _curY)
          //if the player isn't "searching" for a path it is a green tile, move
          if (state === -1 && !$game.flags.check('pathfinding')) {
            $game.$player.beginMove(_curX,_curY)
            if ($game.flags.check('npc-chatting')) {
              $game.$npc.hideSpeechBubble()
            }
          }
          //they clicked on an NPC
          else if (state >= 0 ) {
            if (state !== $game.$botanist.index && !$game.flags.check('pathfinding')) {
              if ($game.flags.check('npc-chatting')) {
                $game.$npc.hideSpeechBubble()
              }
              $game.$npc.selectNpc(state)
              //move top bottom left of NPC
              $game.$player.beginMove(_curX - 2, _curY + 1)
            }
            else {
              //show botanist stuff cuz you clicked him!
              $('#speech-bubble button').hide()
              $game.$botanist.show()
            }
          }
        }
      }
    }

    debug()
  }

  // Returns local x,y grid data based on mouse location
  function getCurrentPosition () {
    return {
      x: _curX,
      y: _curY
    }
  }

  // Call this whenever you need to update the mouse cursor. Delegates to $render
  function updateCursor () {
    $game.$render.renderMouse({
      pX: _prevX,
      pY: _prevY,
      cX: _curX,
      cY: _curY
    })
  }

  // Output clicked tile to the console
  // Private
  function debug () {
    console.log($game.$map.currentTiles[_curX][_curY])
  }

  // Expose 'public' methods
  return {
    onMove: onMove,
    onClick: onClick,
    updateCursor: updateCursor,
    getCurrentPosition: getCurrentPosition
  }

}())
