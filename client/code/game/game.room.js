'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    room.js

    - Creates a "room" that overlays the normal game world.

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var $room = $game.$room = (function () {

  var rooms = {
    'debug': {
      'id': 'debug',
      'name': 'Test room',
      'gridFile': ''
    },
    'lab': {
      'id': 'lab',
      'name': 'Boss level',
      'backgroundImage': 'lab.png',
      'gridFile': ''
    }
  }

  var _boss = {
    grid: []
  };


  function init (callback) {
    console.log('what')

    if (typeof callback === 'function') {
      callback()
    }
  }

  function resetInit () {
    // Do nothing
  }

/* NOTES

- Room info - image.
- Each tile has some basic info to it. - No-go tile, other interactivity?
- Remember color on/off (per session, or permanently?)
-



*/

  function create (room, callback) {
    var room = rooms[room] || {}

    // Set flag
    $game.setFlag('in-room')

    // Set background image.
    document.getElementById('background').classList.add('custom-background')
    if (room.backgroundImage) {
      document.getElementById('background').style.backgroundImage = 'url(' + CivicSeed.CLOUD_PATH + '/img/game/rooms/' + room.backgroundImage + ')'
    }

    // Set up the room grid
    createGrid(room)

    // Execute a callback function after room creation, if present
    if (typeof callback === 'function') {
      callback()
    }
  }


  // Ripped from boss.js

  // Create the basic grid
  function createGrid (room) {
    var gridX = $game.VIEWPORT_WIDTH,
        gridY = $game.VIEWPORT_HEIGHT

    for (var x = 0; x < gridX; x++) {
      _boss.grid[x] = []
      for (var y = 0; y < gridY; y++) {
        _boss.grid[x][y] = {
          x: x,
          y: y
        }
      }
    }
  }

  // Utility method for performing actions on each tile on the gameboard grid.
  // Pass in a function as an argument to this method to act on each
  // tile. The function will be passed a reference to the tile
  function forEachGridTile (func) {
    var gridX = $game.VIEWPORT_WIDTH,
        gridY = $game.VIEWPORT_HEIGHT

    for (var x = 0; x < gridX; x++) {
      for (var y = 0; y < gridY; y++) {
        if (typeof func === 'function') {
          func(_boss.grid[x][y])
        }
      }
    }
  }





  // Expose 'public' methods
  $room = {
    init: init,
    resetInit: resetInit,
    create: create
  }

  return $room

}())
