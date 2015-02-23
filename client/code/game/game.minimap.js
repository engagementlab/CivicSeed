'use strict'
/* global CivicSeed, $, $game */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    minimap.js

    - Initiaize and draw to the minimap, currently a semi-transparent
      box on the upper right hand side of the gameboard.
    - TODO: Better integration or decoupling with game $render engine
    - TODO: Queue rendering of minimap objects so that it is not dependent
      on load order

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

$game.minimap = module.exports = (function () {
  var _minimap = {}
  var _minimapPlayerContext = null
  var _minimapRadarContext = null
  var _utils
  var _images = {}

  // Render quadrant lines on the minimap
  function renderQuadrantLines () {
    _minimapPlayerContext.fillStyle = $game.$render.colors.gray
    _minimapPlayerContext.fillRect(
      0,   // x
      72,  // y
      142, // width
      1    // height
    )
    _minimapPlayerContext.fillRect(
      71,
      0,
      1,
      132
    )
  }

  // Render outlines of the current viewport so player
  // can identify where on the map they are.
  function renderViewportBoundaries () {
    _minimapPlayerContext.lineWidth = 1
    _minimapPlayerContext.strokeStyle = 'rgba(192,192,192,0.35)'
    _minimapPlayerContext.strokeRect(
      $game.masterX + 1, // Offset for stroke
      $game.masterY + 1,
      $game.VIEWPORT_WIDTH,
      $game.VIEWPORT_HEIGHT
    )
  }

  // Render tiny botanist image on the minimap
  function renderTinyBotanist () {
    _minimapPlayerContext.drawImage(
      _images['tiny_botanist'],
      0,
      0,
      20,
      16,
      60,
      64,
      20,
      16
    )
  }

  // Render a player to the minimap
  function renderPlayer (id, player) {
    _minimapPlayerContext.fillStyle = player.color || 'white'
    _minimapPlayerContext.fillRect(
      player.x,
      player.y,
      4,
      4
    )
    if (id === $game.$player.id) {
      _minimapPlayerContext.strokeStyle = 'white'
      _minimapPlayerContext.lineWidth = 1
      _minimapPlayerContext.strokeRect(
        player.x,
        player.y,
        4,
        4
      )
    }
  }

  return {

    init: function (callback) {
      _utils = $game.$render.utils
      _minimapPlayerContext = _utils.initCanvas('minimap-player')
      _minimapRadarContext = _utils.initCanvas('minimap-radar')
      _images['tiny_botanist'] = new Image()
      _images['tiny_botanist'].src = CivicSeed.CLOUD_PATH + '/img/game/tiny_botanist.png'
      _images['tiny_botanist'].onload = function () {
        if (typeof callback === 'function') callback()
      }
    },

    show: function () {
      $('.minimap').show()
    },

    // Add a player to the minimap
    addPlayer: function (id, position, color) {
      _minimap[id] = {}
      _minimap[id].x = position.x
      _minimap[id].y = position.y
      _minimap[id].color = color
      this.render()
    },

    // Update a player on the minimap
    updatePlayer: function (id, position) {
      _minimap[id].x = position.x
      _minimap[id].y = position.y
      this.render()
    },

    // Remove a player from the minimap
    removePlayer: function (id) {
      delete _minimap[id]
      this.render()
    },

    // Render all the players on the minimap
    render: function () {
      this.clear()
      renderQuadrantLines()
      renderTinyBotanist()
      renderViewportBoundaries()

      $.each(_minimap, function (key, player) {
        renderPlayer(key, player)
      })

      // Render radar
      this.radar.update()
    },

    // Clear the minimap
    clear: function () {
      _utils.clearContext(_minimapPlayerContext)
    },

    // Create a ping effect on the minimap to attract the player's attention to a specific location
    // TODO ! This was never completed.
    ping: function (location) {
      var context = $game.$render.utils.createCanvas('minimap-ping', 142, 132, true, {
        right: '0',
        zIndex: '6'
      })
      context.fillStyle = 'red'
      // TODO: Incomplete
      context.fillRect(
        location.x,
        location.y,
        20,
        20
      )
      $('#minimap-ping').remove()
    },

    // Show radar for NPCs still holding resources
    radar: {
      /*
      // Not used.
      // Canvas for radar is hardcoded into game template.
      context: null,

      create: function () {
        $render.minimapRadar.context = _render.createCanvas('minimap-radar', 142, 132, true, {
                          right: '0',
                          zIndex: '6'
                        })
        var context = $render.minimapRadar.context

        context.fillStyle = $render.colors.yellow
      },

      destroy: function () {
        $('#minimap-radar').remove()
      },
      */

      update: function () {
        this.clear()

        var local = $game.flags.check('local-radar')
        var global = $game.flags.check('global-radar')
        var npcs = {}
        var resources = $game.$player.getResources()

        // If player doesn't have radar on, exit
        if (!local && !global) return false

        // Depending on radar, get NPCs
        if (global === true) {
          npcs = $game.$npc.getNpcData()
        } else if (local === true) {
          var onscreen = $game.$npc.getOnScreenNpcs()
          for (var n = 0; n < onscreen.length; n++) {
            var npc = $game.$npc.get(onscreen[n])
            npcs[npc.id] = npc
          }
        }

        // Render the dot for each NPC
        $.each(npcs, function (key, npc) {
          // Check
          // - If NPC is holding a resource
          // - If player does not already have that resource
          // - If NPC level is less than or equal to Player's current level
          var theResource = resources[npc.resource.id]
          if (npc.isHolding === true && (!theResource || theResource.result === false) && $game.$player.getLevel() >= npc.getLevel()) {
            this.drawDot(npc.position)
          }
        }.bind(this)) // this = radar
      },

      clear: function () {
        _utils.clearContext(_minimapRadarContext)
      },

      drawDot: function (location) {
        var context = _minimapRadarContext
        context.fillStyle = $game.$render.colors.yellow
        context.fillRect(
          location.x,
          location.y,
          2,
          2
        )
      }
    }

  }
}())
