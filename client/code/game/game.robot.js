'use strict'
/* global ss, $game */

$game.$robot = module.exports = (function () {
  var _positions = [
    {x: 7, y: 20, d: -1, target: -3},
    {x: 137, y: 33, d: 1, target: 145},
    {x: 137, y: 124, d: 1, target: 145},
    {x: 7, y: 84, d: -1, target: -3},
    {x: 0, y: 0, d: 0, target: 0},
    {x: 0, y: 0, d: 0, target: 0}
  ]
  var _info = null
  var _renderInfo = null
  var _onScreen = false
  var _triggered = false

  var active = false
  var currentStep = 0
  var numSteps = 16
  var curFrame = 0
  var numFrames = 4
  var isMoving = false

  function init (callback) {
    if (!$game.bossModeUnlocked) {
      // create things position and render info based on players state
      _info = {
        x: 0,
        y: 0
      }
      _renderInfo = {
        kind: 'robot',
        prevX: 0,
        prevY: 0,
        curX: 0,
        curY: 0,
        srcX: 0,
        srcY: 0
      }
      if (!$game.$player.seenRobot) {
        setPosition()
      }
    }

    if (typeof callback === 'function') {
      callback()
    }
  }

  function resetInit () {
    _info = null
    _renderInfo = null
    _onScreen = false
    _triggered = false

    active = false
    currentStep = 0
    curFrame = 0
    isMoving = false
  }

  function setPosition () {
    _info = _positions[$game.$player.currentLevel]
    _info.offX = 0
    _info.offY = 0
    _info.prevOffX = 0
    _info.prevOffY = 0
    _renderInfo.dir = _positions[$game.$player.currentLevel].d

    isMoving = false
    active = true
    curFrame = 0
    currentStep = 0

    if (_renderInfo.dir === -1) {
      _renderInfo.srcY = 0
    } else {
      _renderInfo.srcY = 64
    }
  }

  function update () {
    if (active) {
      // if it is live, then update movement
      if (_onScreen) {
        if (_triggered) {
          move()
        } else {
          idleCheckTrigger()
        }
      } else {
        // if not, check if we need to turn it live
        var loc = $game.$map.masterToLocal(_info.x, _info.y)
        if (loc) {
          _onScreen = true
        }
      }
    }
  }

  function updateRenderInfo () {
    // must pass true so we get the coords EVEN tho it doesn't exist for off screen stuff
    var loc = $game.$map.masterToLocal(_info.x, _info.y, true)
    if (loc) {
      var prevX = loc.x * $game.TILE_SIZE + _info.prevOffX * $game.STEP_PIXELS / 2
      var prevY = loc.y * $game.TILE_SIZE + _info.prevOffY * $game.STEP_PIXELS / 2
      var curX = loc.x * $game.TILE_SIZE + _info.offX * $game.STEP_PIXELS / 2
      var curY = loc.y * $game.TILE_SIZE + _info.offY * $game.STEP_PIXELS / 2

      _renderInfo.prevX = prevX
      _renderInfo.prevY = prevY
      _renderInfo.curX = curX
      _renderInfo.curY = curY

      if (isMoving) {
        // left
        if (_renderInfo.dir === -1) {
          _renderInfo.srcY = 0
        } else {
          _renderInfo.srcY = 64
        }
      } else {
        if (_renderInfo.dir === -1) {
          _renderInfo.srcY = 128
        } else {
          _renderInfo.srcY = 192
        }
      }
    }
  }

  function idleCheckTrigger () {
    currentStep++
    if (currentStep % 8 === 0) {
      if (currentStep > numSteps) {
        currentStep = 0
      }
      curFrame++
      if (curFrame === numFrames) {
        curFrame = 0
      }
      _renderInfo.srcX = $game.TILE_SIZE * curFrame * 2
    }
    updateRenderInfo()

    // check distance between player and robot
    var playerPos = $game.$player.getPosition()
    var dX = Math.abs(playerPos.x - (_info.x + 1))
    var dY = Math.abs(playerPos.y - _info.y)

    // if close enough, trigger robot to run!
    if (dX + dY < 6) {
      _triggered = true
      $game.$audio.playTriggerFx('robot')
      $game.broadcast('You just saw a strange robot!')
      $game.$player.seenRobot = true
      isMoving = true
      currentStep = 0
      curFrame = 0
      var info = {
        id: $game.$player.id,
        seenRobot: $game.$player.seenRobot
      }
      ss.rpc('game.player.updateGameInfo', info)
    }
  }

  function move () {
    var currentStepIncX = _info.d
    var currentStepIncY = 0

    if (_onScreen) {
      // if the steps between the tiles has finished,
      // update the master location, and reset steps to go on to next move
      if (currentStep >= numSteps) {
        currentStep = 0
        _info.x += _info.d
      }

      // check to see if done
      if (_info.x === _info.target) {
        _onScreen = false
        active = false
      } else {
        // if not, step through it
        // increment the current step
        currentStep += 1

        // if it the first one, then figure out the direction to face
        if (currentStep === 1) {
          // set the previous offsets to 0 because the last visit
          // was the actual rounded master
          _info.prevOffX = 0
          _info.prevOffY = 0
        } else {
          // if it is not the first step:
          _info.prevOffX = _info.offX
          _info.prevOffY = _info.offY
          // set direction for sprite sheets
          if (currentStep % 4 === 0) {
            _renderInfo.srcX = $game.TILE_SIZE * (currentStep / 4) * 2 - 64
          }
        }

        _info.offX = currentStep * currentStepIncX
        _info.offY = currentStep * currentStepIncY

        updateRenderInfo()
      }
    }
  }

  function clear () {
    $game.$render.clearRobot(_renderInfo)
  }

  function getRenderInfo () {
    if (_onScreen) {
      return _renderInfo
    } else {
      return false
    }
  }

  function disable () {
    _onScreen = false
  }

  // Expose 'public' methods
  return {
    init: init,
    resetInit: resetInit,
    update: update,
    disable: disable,
    clear: clear,
    setPosition: setPosition,
    getRenderInfo: getRenderInfo
  }
}())
