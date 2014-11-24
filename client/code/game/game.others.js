'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    others.js

    - Manages other (on-screen) players
    - TODO: Create a generalized player object that could be extended for
      current player
    - TODO: Extend player object for superadmin / DM roles.

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var self = $game.$others = (function () {

  var _onScreenPlayers = {}

  function Player (player) {
    this.name             = player.firstName
    this.id               = player._id
    this.isMoving         = false
    this.currentStep      = 0
    this.currentMove      = 0
    this.currentStepIncX  = 0
    this.currentStepIncY  = 0
    this.curFrame         = 0
    this.numFrames        = 4
    this.numSteps         = 8
    this.direction        = 0
    this.idleCounter      = 0
    this.chatId           = 'player' + player._id
    this.chatIdSelector   = '#player' + player._id
    this.hideTimer        = null
    this.isChatting       = false
    this.offScreen        = true
    this.tilesColored     = player.game.tilesColored
    this.rank             = player.game.rank
    this.level            = player.game.currentLevel
    this.skinSuit         = player.game.skinSuit
    this.playerColor      = player.game.playerColor
    this.info = {
      x: player.game.position.x,
      y: player.game.position.y,
      srcX: 0,
      srcY: 0,
      offX: 0,
      offY: 0,
      prevOffX: 0,
      prevOffY: 0
    }
    this.renderInfo = {
      kind: 'player',
      id: player._id,
      firstName: player.firstName,
      srcX: 0,
      srcY: 0,
      curX: player.x,
      curY: player.y,
      prevX: player.x,
      prevY: player.y,
      color: null
    }
  }

  Player.prototype.update = function () {
    if (this.isMoving) {
      this.move()
      this.updateRenderInfo()
    } else {
      if ($game.flags.check('screen-transition') === true) {
        this.updateRenderInfo()
      } else {
        this.idle()
      }
    }
  }

  Player.prototype.updateRenderInfo = function () {
    var loc = $game.$map.masterToLocal(this.info.x, this.info.y)
    if (loc) {
      var prevX = loc.x * $game.TILE_SIZE + this.info.prevOffX * $game.STEP_PIXELS,
          prevY = loc.y * $game.TILE_SIZE + this.info.prevOffY * $game.STEP_PIXELS,
          curX  = loc.x * $game.TILE_SIZE + this.info.offX * $game.STEP_PIXELS,
          curY  = loc.y * $game.TILE_SIZE + this.info.offY * $game.STEP_PIXELS

      this.renderInfo.prevX = prevX
      this.renderInfo.prevY = prevY

      this.renderInfo.srcX = this.info.srcX
      this.renderInfo.srcY = this.info.srcY
      this.renderInfo.curX = curX
      this.renderInfo.curY = curY

      this.offScreen = false
    } else {
      this.offScreen = true
    }
  }

  Player.prototype.idle = function () {
    this.idleCounter += 1

    if (this.idleCounter >= 64) {
      this.idleCounter = 0
      this.info.srcX = 0
      this.info.srcY = 0
      this.updateRenderInfo()
      return true
    } else if (this.idleCounter === 48) {
      this.info.srcX = 32
      this.info.srcY = 0
      this.updateRenderInfo()
    }
  }

  Player.prototype.clear = function () {
    $game.$render.clearCharacter(this.renderInfo)
  }

  Player.prototype.slide = function (sX, sY) {
    this.info.prevOffX = sX * this.numSteps
    this.info.prevOffY = sY * this.numSteps
  }

  Player.prototype.resetRenderValues = function () {
    this.info.prevOffX = 0
    this.info.prevOffY = 0
  }

  Player.prototype.getRenderInfo = function () {
    if (!this.offScreen) {
      this.renderInfo.color = this.getCSSColor()
      return this.renderInfo
    } else {
      return false
    }
  }

  Player.prototype.beginMove = function (moves) {
    this.seriesOfMoves = new Array(moves.length)
    this.seriesOfMoves = moves
    this.currentMove = 1
    this.currentStep = 0
    this.isMoving = true
    this.hideChat()
    //console.log(this.seriesOfMoves);
  }

  Player.prototype.endMove = function () {
    this.isMoving = false

    this.info.srcX = 0
    this.info.srcY = 0
    this.info.offX = 0
    this.info.offY = 0
    this.info.prevOffX = 0
    this.info.prevOffY = 0

    $game.minimap.updatePlayer(this.id, this.info)
  }

  Player.prototype.move = function () {
    //if the steps between the tiles has finished,
    //update the master location, and reset steps to go on to next move
    if (this.currentStep >= this.numSteps) {
      this.currentStep = 0
      this.info.x = this.seriesOfMoves[this.currentMove].masterX
      this.info.y = this.seriesOfMoves[this.currentMove].masterY
      this.currentMove += 1

      // Update player position on minimap
      $game.minimap.updatePlayer(this.id, this.info)
    }

    //check to see if done
    if (this.currentMove >= this.seriesOfMoves.length) {
      this.endMove()
    }

    //if not, step through it
    else {
      //increment the current step
      this.currentStep += 1

      //if it the first one, then figure out the direction to face
      if (this.currentStep === 1) {
        this.currentStepIncX = this.seriesOfMoves[this.currentMove].masterX - this.info.x
        this.currentStepIncY = this.seriesOfMoves[this.currentMove].masterY - this.info.y

        //set the previous offsets to 0 because the last visit
        //was the actual rounded master
        this.info.prevOffX = 0
        this.info.prevOffY = 0

        //set direction for sprite sheets
        //direction refers to the y location on the sprite sheet
        //since the character will be in different rows
        //will be 0,1,2,3
        if (this.currentStepIncX === 1) {
          this.direction = 2
        } else if (this.currentStepIncX === -1) {
          this.direction = 1
        } else if (this.currentStepIncY === -1) {
          this.direction = 4
        } else {
          this.direction = 3
        }
      } else {
        this.info.prevOffX = this.info.offX
        this.info.prevOffY = this.info.offY
      }

      this.info.offX = this.currentStep * this.currentStepIncX
      this.info.offY = this.currentStep * this.currentStepIncY

      //try only changing the src (frame) every X frames
      if ((this.currentStep-1)%8 === 0) {
        this.curFrame += 1
        if (this.curFrame >= this.numFrames) {
          this.curFrame = 0
        }
      }

      this.info.srcX = this.curFrame * $game.TILE_SIZE
      this.info.srcY =  this.direction * $game.TILE_SIZE*2
    }
  }

  Player.prototype.message = function (data) {
    // Display over other player's head if onscreen
    if (!this.offScreen) {
      data.isChatting = this.isChatting
      data.chatId = this.chatId
      data.chatIdSelector = this.chatIdSelector
      data.playerCSSColor = this.getCSSColor()
      data.position = {
        x: this.renderInfo.curX,
        y: this.renderInfo.curY
      }

      clearTimeout(this.hideTimer)
      this.isChatting = true
      var fadeTime = $game.$chat.message(data)
      this.hideTimer = setTimeout(this.hideChat, fadeTime)
    }
  }

  Player.prototype.hideChat = function () {
    //remove chat from screen
    clearTimeout(this.hideTimer)
    $(this.chatIdSelector).fadeOut('fast', function () {
      $(this).remove()
      this.isChatting = false
    })
  }

  Player.prototype.setTilesColored = function (num) {
    this.tilesColored = num
  }

  Player.prototype.showPlayerCard = function () {
    if (!this.offScreen) {
      $game.alert(this.name + ' is a ' + $game.playerRanks[this.level] + ' who has colored ' + this.tilesColored + ' tiles')
    }
  }

  Player.prototype.changeLevel = function (level) {
    this.level = level
  }

  Player.prototype.beam = function (position) {
    this.info.x = position.x
    this.info.y = position.y
    this.updateRenderInfo()
    $game.minimap.updatePlayer(this.id, this.info)
  }

  Player.prototype.skinSuitChange = function (info) {
    this.skinSuit = info.skinSuit
    $game.$render.createCanvasForPlayer(this.id, this.skinSuit, this.playerColor)
  }

  // Get the player's color index number
  Player.prototype.getColorIndex = function () {
    return this.playerColor
  }

  // Get a color at a given index or use current player color index
  Player.prototype.getColor = function () {
    // Returns an object {r, g, b}, values from 0 - 255
    // TODO: something different besides aliasing to $player
    return $game.$player.getColor(this.playerColor)
  }

  // Get a color hex string at a given index or use current player color index
  Player.prototype.getCSSColor = function () {
    var rgb = this.getColor()
    // A quick way of converting to a hex string, e.g. #5599cc
    return '#' + ('0'+(rgb.r.toString(16))).slice(-2) + ('0'+(rgb.g.toString(16))).slice(-2) + ('0'+(rgb.b.toString(16))).slice(-2)
  }

  return {
    ready: false,

    //load in other players
    init: function (callback) {
      ss.rpc('game.player.getOthers', function (response) {
        _onScreenPlayers = {}
        for(var p = 0; p < response.length; p++) {
          self.add(response[p])
        }
        self.ready = true
        callback()
      })
    },

    resetInit: function () {
      _onScreenPlayers = {}
      self.ready = false
    },

    add: function (player) {
      //check if player is on our screen (or near it....)
      //don't add it if its yourself
      if (player._id != $game.$player.id) {
        //set inview if nearby
        var newbie = new Player(player)
        _onScreenPlayers[newbie.id] = newbie
        newbie.updateRenderInfo()
        $game.$render.createCanvasForPlayer(newbie.id, newbie.skinSuit, newbie.playerColor)
        $game.minimap.addPlayer(newbie.id, player.game.position, newbie.getCSSColor())
      }
    },

    get: function () {
      return _onScreenPlayers
    },

    update: function () {
      for (var i in _onScreenPlayers) {
        _onScreenPlayers[i].update()
      }
    },

    clear: function () {
      for (var i in _onScreenPlayers) {
        _onScreenPlayers[i].clear()
      }
    },

    slide: function (slideX, slideY) {
      for (var i in _onScreenPlayers) {
        _onScreenPlayers[i].slide(slideX, slideY)
      }
    },

    getRenderInfo: function () {
      var all = []
      for (var i in _onScreenPlayers) {
        var info = _onScreenPlayers[i].getRenderInfo()
        if (info) {
          all.push(info)
        }
      }
      return all
    },

    resetRenderValues: function () {
      for (var i in _onScreenPlayers) {
        _onScreenPlayers[i].resetRenderValues()
      }
    },

    hideAllChats: function () {
      for (var i in _onScreenPlayers) {
        _onScreenPlayers[i].hideChat()
      }
    },

    message: function (id, data) {
      var player = _onScreenPlayers[id]
      if (player) {
        player.message(data)
      }
    },

    // Remove a player from the screen
    remove: function (id) {
      // Clear it off screen first, then delete!
      var player = _onScreenPlayers[id]
      if (player) {
        player.clear()
        $game.minimap.removePlayer(id)
        delete _onScreenPlayers[id]
      }
    },

    playerCard: function (x, y) {
      for (var i in _onScreenPlayers) {
        var player = _onScreenPlayers[i]
        if (player.info.x === x && player.info.y === y) {
          player.showPlayerCard()
          return true
        }
      }
      return false
    },

    updateTilesColored: function (id, count) {
      var player = _onScreenPlayers[id]
      if (player) {
        player.setTilesColored(count)
      }
    },

    levelChange: function (id, level) {
      var player = _onScreenPlayers[id]
      if (player) {
        player.changeLevel(level)
      }
    },

    sendMoveInfo: function (id, moves) {
      var player = _onScreenPlayers[id]
      if (player) {
        player.beginMove(moves)
      }
    },

    beam: function (id, position) {
      var player = _onScreenPlayers[id]
      if (player) {
        player.beam(position)
      }
    },

    skinSuitChange: function (id, info) {
      var player = _onScreenPlayers[id]
      if (player) {
        player.skinSuitChange(info)
      }
    },

    disable: function () {
      for (var i in _onScreenPlayers) {
        _onScreenPlayers[i].offScreen = true
      }
    }

  }

}())
