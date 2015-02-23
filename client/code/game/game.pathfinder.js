'use strict'
/* global $game, apprise */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    pathfinder.js

    - Depends on library astar.js - http://github.com/bgrins/javascript-astar
    - Creates the pathfinding grid

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var astar = require('astar')

$game.$pathfinder = module.exports = (function () {
  // Private - holder of graph tiles for current screen
  var _graph

  return {
    // Create the grid, and set walkable or no-go state for each tile.
    // If bypass === true, all tiles are walkable
    // 1 = Walkable tile
    // 0 = No-go tile
    createPathGrid: function (bypass) {
      var y = $game.VIEWPORT_HEIGHT
      var gridTiles = new Array(y)

      while (--y >= 0) {
        // Reset x
        var x = $game.VIEWPORT_WIDTH
        gridTiles[y] = new Array(x)

        while (--x >= 0) {
          if (bypass) {
            gridTiles[y][x] = 1
          } else {
            // Note that tilestates are 0 for "go" tiles
            // but here we mean "1" for "true, go here"
            var val = $game.$map.getTileState({ x: x, y: y })

            gridTiles[y][x] = (val === 0) ? 1 : 0
          }
        }
      }

      _graph = new astar.Graph(gridTiles)

      // Assign master grid coordinates to local grid
      for (var i = 0, nodeLength = _graph.nodes.length; i < nodeLength; i++) {
        var localX = _graph.nodes[i].x
        var localY = _graph.nodes[i].y

        // Get masterX and masterY and put them inside node
        _graph.nodes[i].masterX = $game.$map.currentTiles[localY][localX].x
        _graph.nodes[i].masterY = $game.$map.currentTiles[localY][localX].y
      }
    },

    // Calculate a path using pathfinding
    findPath: function (currentPosition, targetPosition) {
      // Catch errors where currentPosition or targetPosition are bad
      if (!currentPosition || !targetPosition) {
        console.error('Bad data passed to pathfinder module.', 'currentPosition: ', currentPosition, '; targetPosition: ', targetPosition)
        apprise('Something went wrong. Please refresh your browser window.')
        return
      }

      var start = _graph.grid[currentPosition.y][currentPosition.x]
      var end = _graph.grid[targetPosition.y][targetPosition.x]

      // Returns an array of tiles for character to move on
      return astar.astar.search(_graph, start, end)
    }

  }
}())
