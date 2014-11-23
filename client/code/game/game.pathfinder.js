'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    pathfinder.js

    - Depends on library astar.js - http://github.com/bgrins/javascript-astar
    - Creates the pathfinding grid

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var astar = require('astar')

var self = $game.$pathfinder = (function () {

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
        var x = _graph.nodes[i].x,
            y = _graph.nodes[i].y

        // Get masterX and masterY and put them inside node
        _graph.nodes[i].masterX = $game.$map.currentTiles[y][x].x
        _graph.nodes[i].masterY = $game.$map.currentTiles[y][x].y
      }
    },

    // Calculate a path using pathfinding
    findPath: function (local, master) {
      var start = _graph.grid[local.y][local.x],
          end   = _graph.grid[master.y][master.x]

      // Returns an array of tiles for character to move on
      return astar.astar.search(_graph, start, end)
    }

  }

}())
