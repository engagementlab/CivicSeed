'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    minimap.js

    - Initiaize and draw to the minimap, currently a semi-transparent
      box on the upper right hand side of the gameboard.
    - TODO: Better integration or decoupling with game $render engine
    - TODO: Queue rendering of minimap objects so that it is not dependent
      on load order

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var self = $game.minimap = (function () {

  // Private
  var _minimap = {},
      _minimapPlayerContext = null,
      _minimapRadarContext  = null,
      _utils,
      _images = {}

  // Render quadrant lines on the minimap
  function renderQuadrantLines () {
    _minimapPlayerContext.fillStyle = $game.$render.colors.gray
    _minimapPlayerContext.fillRect(
      0,
      72,
      142,
      1
    )
    _minimapPlayerContext.fillRect(
      71,
      0,
      1,
      132
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
  function renderPlayer (player) {
    _minimapPlayerContext.fillStyle = player.color || this.colors.white
    _minimapPlayerContext.fillRect(
      player.x,
      player.y,
      4,
      4
    )
  }

  return {

    init: function (callback) {
      _utils = $game.$render.utils
      _minimapPlayerContext = _utils.initCanvas('minimap-player')
      _minimapRadarContext  = _utils.initCanvas('minimap-radar')
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
      self.render()
    },

    // Update a player on the minimap
    updatePlayer: function (id, position) {
      self.clear()
      _minimap[id].x = position.x
      _minimap[id].y = position.y
      self.render()
    },

    // Remove a player from the minimap
    removePlayer: function (id) {
      self.clear()
      delete _minimap[id]
      self.render()
    },

    // Render all the players on the minimap
    render: function () {
      renderQuadrantLines()
      renderTinyBotanist()

      $.each(_minimap, function (key, player) {
        renderPlayer(player)
      })

      // Render radar
      self.radar.update()
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
      context.fillStyle = 'red' //this.colors.red
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

        var local     = $game.flags.check('local-radar'),
            global    = $game.flags.check('global-radar'),
            npcs      = {},
            resources = $game.$player.getResources()

        // If player doesn't have radar on, exit
        if (!local && !global) return false

        // Depending on radar, get NPCs
        if (global === true) {
          npcs = $game.$npc.getNpcData()
        } else if (local === true) {
          var onscreen = $game.$npc.getOnScreenNpcs()
          for (var n = 0; n < onscreen.length; n++) {
            var npc = $game.$npc.getNpc(onscreen[n])
            npcs[npc.index] = npc
          }
        }

        // Render the dot for each NPC
        $.each(npcs, function (key, npc) {
          // Check
          // - If NPC is holding a resource
          // - If player does not already have that resource
          // - If NPC level is less than or equal to Player's current level
          var theResource = resources[npc.index]
          if (npc.isHolding === true && (!theResource || theResource.result === false) && $game.$player.getLevel() >= $game.$npc.getLevel(npc.index)) {
            self.radar.drawDot(npc.info)
          }
        })
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
