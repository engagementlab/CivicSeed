'use strict'
/* global $, $game */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    mouse.js

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var _prevX = 0
var _prevY = 0
var _curX = 0
var _curY = 0

function onMove (mouseInfo) {
  // Where is the mouse pointing at right now?
  var TILE_SIZE = $game.TILE_SIZE
  var x = mouseInfo.x - mouseInfo.offX
  var y = mouseInfo.y - mouseInfo.offY
  var tempX = Math.floor(x / TILE_SIZE)
  var tempY = Math.floor(y / TILE_SIZE)

  // Set where the mouse was at previously
  _prevX = _curX
  _prevY = _curY

  // Limit extreme values to gameboard width and height
  // Verified speed checking: http://jsperf.com/constraining
  _curX = Math.max(Math.min($game.VIEWPORT_WIDTH - 1, tempX), 0)
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
      $game.$player.beginMove({ x: _curX, y: _curY })
    }
  } else {
    // If the player is in seed mode, determine if drop seed or exit seed mode
    if ($game.$player.seedMode) {
      if ($game.flags.check('awaiting-seed') === false) {
        var m = {
          mouse: true,
          x: _curX,
          y: _curY,
          mode: $game.$player.seedMode
        }
        var r = $game.$player.dropSeed(m)
        if (!r) {
          $game.$input.inactiveHUDButton('.hud-seed')
        }
      }
    } else {
      // Determine what to do
      var mX = $game.$map.currentTiles[_curX][_curY].x
      var mY = $game.$map.currentTiles[_curX][_curY].y

      // If clicking on other player, show their info, then exit
      if ($game.$others.playerCard(mX, mY)) {
        return
      }

      // Determine what to do with a clicked tile
      // TODO: Move this logic outside of mouse interaction?

      // Cancel out of an existing NPC chat bubble if it exists
      // TODO: this is here?
      if ($game.flags.check('npc-chatting')) {
        $game.$npc.hideSpeechBubble()
      }

      // Reset queued NPCs
      $game.$player.npcOnDeck = false

      // The only reason why this happens instead of reading $map.currentTiles directly
      // is because it's calculating if the tile space above it is the upper half of an NPC
      var state = $game.$map.getTileState({ x: _curX, y: _curY })
      switch (state) {
        // Go (occupyable) tile
        case 0:
          $game.$player.beginMove({ x: _curX, y: _curY })
          break
        // No-go tile, do nothing.
        case 1:
          break
        // NPC
        case 2:
          // Get the npcId sitting at this tile
          var npcId = $game.$map.currentTiles[_curX][_curY].npcId
          $game.$npc.select(npcId)

          // Move player character to bottom left of NPC
          // TODO: Better positioning logic - sometimes this space is not occupyable,
          // and this interrupts the process.
          $game.$player.beginMove({ x: _curX - 2, y: _curY + 1 })
          break
        // Botanist
        case 3:
          $('#speech-bubble button').hide() // ?
          $game.$botanist.show()
          break
        // Unknown ID, do nothing; reserve other options for future use.
        default:
          break
      }
    }
  }

  // Debug output on each click
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
module.exports = {
  onMove: onMove,
  onClick: onClick,
  updateCursor: updateCursor,
  getCurrentPosition: getCurrentPosition
}
