'use strict'
/* global ss, $, $game, $BODY */

// TODO: Refactor

var _ = require('underscore')

var STEPS_PER_MOVE = 8 // Frames per move between tiles

// Private vars for player
// TODO: Find where these variables are used and place them
// so that variables are confined to smaller scopes or attached
// to objects that can organize them.
var _curFrame = 0
var _currentStepIncX = 0
var _currentStepIncY = 0
var _direction = 0
var _idleCounter = 0
var _info = null
var _renderInfo = null
var _previousSeedsDropped = null
var _startTime = null
var _seeds = null
var _totalSeeds = null
var _resources = null
var _colorMap = null
var _resume = null
var _playingTime = null
var _tilesColored = null
var _pledges = null
var _resourcesDiscovered = null
var _skinSuit = null
var _drawSeeds = null
var _drawSeedArea = {}

var $player = module.exports = {

  firstName: null,
  id: null,
  game: null,
  instanceName: null,
  currentLevel: null,
  botanistState: null,
  seenRobot: null,
  seriesOfMoves: [],
  currentStep: 0,
  seedPlanting: false,
  npcOnDeck: false,
  ready: false,
  seedMode: false,

  init: function (callback) {
    // get the players info from the db, alerts other users of presence
    ss.rpc('game.player.init', function (playerInfo) {
      // time in seconds since 1970 or whatever
      _startTime = new Date().getTime() / 1000

      _info = {
        srcX: 0,
        srcY: 0,
        x: playerInfo.game.position.x,
        y: playerInfo.game.position.y,
        offX: 0,
        offY: 0,
        prevOffX: 0,
        prevOffY: 0
      }

      // keeping this around because we then save to it on exit
      $player.game = playerInfo.game
      _setPlayerInformation(playerInfo)

      // tell others you have joined
      var subsetInfo = {
        _id: playerInfo.id,
        firstName: playerInfo.firstName,
        game: {
          tilesColored: playerInfo.game.tilesColored,
          rank: playerInfo.game.rank,
          currentLevel: playerInfo.game.currentLevel,
          position: playerInfo.game.position,
          skinSuit: playerInfo.game.skinSuit,
          playerColor: playerInfo.game.playerColor
        }
      }
      ss.rpc('game.player.tellOthers', subsetInfo)

      // set the render info
      _renderInfo = {
        id: $player.id,
        kind: 'player',
        firstName: $player.firstName,
        level: $player.currentLevel,
        colorIndex: playerInfo.game.playerColor,
        color: $player.getCSSColor(),
        srcX: 0,
        srcY: 0,
        curX: _info.x * $game.TILE_SIZE,
        curY: _info.y * $game.TILE_SIZE,
        prevX: _info.x * $game.TILE_SIZE,
        prevY: _info.y * $game.TILE_SIZE
      }

      _player.updateTotalSeeds()
      _updateRenderInfo()

      // we are ready, let everyone know dat
      $player.ready = true
      callback()
    })
  },

  resetInit: function () {
    _curFrame = 0
    _currentStepIncX = 0
    _currentStepIncY = 0
    _direction = 0
    _idleCounter = 0

    _info = null
    _renderInfo = null

    _previousSeedsDropped = null

    _startTime = null

    _seeds = null
    _totalSeeds = null
    _resources = null
    _colorMap = null
    _resume = null
    _playingTime = null
    _tilesColored = null
    _pledges = null
    _resourcesDiscovered = null
    _skinSuit = null

    _drawSeeds = null

    $player.firstName = null
    $player.id = null
    $player.game = null
    $player.instanceName = null
    $player.currentLevel = null
    $player.seenRobot = null
    $player.seriesOfMoves = []
    $player.currentStep = 0
    $player.seedPlanting = false
    $player.npcOnDeck = false
    $player.ready = false
    $player.seedMode = false
  },

  // Calculate movements and what to render for every game tick
  update: function () {
    if ($game.flags.check('is-moving') === true) {
      _move()
      _updateRenderInfo()
    } else {
      if ($game.flags.check('screen-transition') === true) {
        _updateRenderInfo()
      } else {
        _idle()
      }
    }
  },

  // Clear the character canvas to ready for redraw
  clear: function () {
    $game.$render.clearCharacter(_renderInfo)
  },

  // Start a movement -> pathfind
  // Decide if we need to load new viewport, or if we are going to visit an NPC
  // targetPosition is an object containing {x: xLocalPosition, y: yLocalPosition }
  beginMove: function (targetPosition) {
    var localPosition = $player.getLocalPosition()
    var path

    // Clear HUD
    $game.$chat.hideChat()
    if ($game.flags.check('visible-inventory')) {
      $game.inventory.close()
    }

    $game.flags.set('pathfinding')
    _info.offX = 0
    _info.offY = 0

    if ($game.bossModeUnlocked && $player.currentLevel > 3) {
      path = $game.$pathfinder.findPath({x: _info.x, y: _info.y}, targetPosition)

      $game.flags.unset('pathfinding')
      if (path.length > 0) {
        _sendMoveInfo(path)
      }
    } else {
      // Find path
      // If player is already moving, the start point of the path is the point of next move in the series
      // Otherwise, use the player's current local position
      if ($player.seriesOfMoves[0]) {
        path = $game.$pathfinder.findPath($game.$map.masterToLocal($player.seriesOfMoves[0].masterX, $player.seriesOfMoves[0].masterY), targetPosition)
      } else {
        path = $game.$pathfinder.findPath(localPosition, targetPosition)
      }

      if (path.length > 0) {
        // Reset flags, in case they were set by a previous move
        // and now needs to be cancelled.
        $game.flags.unset('screen-will-transition')

        // If a transition is necessary, preload data for loading next screen
        // No transition occurs if this is the edge of the game map
        // We do this here instead of at _endMove() to cut down on load time
        if ((targetPosition.x === 0 ||
            targetPosition.x === $game.VIEWPORT_WIDTH - 1 ||
            targetPosition.y === 0 ||
            targetPosition.y === $game.VIEWPORT_HEIGHT - 1) &&
            $game.$map.isMapEdge(targetPosition) === false) {
          $game.flags.set('screen-will-transition')
          $game.$map.calculateNext(targetPosition.x, targetPosition.y)
        }

        _sendMoveInfo(path)

        // Send update to server so everyone else gets your path
        ss.rpc('game.player.movePlayer', path, $player.id)
      } else {
        _endMove()
      }

      $game.flags.unset('pathfinding')
    }
  },

  moveStraight: function (direction) {
    var location
    var targetPosition
    var x, y

    // Get current local position
    // If player is moving, start calculation from next move in series
    // Else, use current position
    if ($player.seriesOfMoves.length > 0) {
      location = $game.$map.masterToLocal($player.seriesOfMoves[0].masterX, $player.seriesOfMoves[0].masterY)
    } else {
      location = $player.getLocalPosition()
    }

    // Initialize x, y position
    x = location.x
    y = location.y

    // Using target direction,
    // analyze grid until we hit any tile with state above 0 (Go)
    // and that becomes our new target position
    switch (direction) {
      case 'up':
        while (y >= 0 && $game.$map.currentTiles[x][y].tileState === 0) {
          targetPosition = { x: x, y: y }
          y--
        }
        break
      case 'down':
        y = location.y
        while ((y <= $game.VIEWPORT_HEIGHT - 1) && $game.$map.currentTiles[x][y].tileState === 0) {
          targetPosition = { x: x, y: y }
          y++
        }
        break
      case 'left':
        x = location.x
        while (x >= 0 && $game.$map.currentTiles[x][y].tileState === 0) {
          targetPosition = { x: x, y: y }
          x--
        }
        break
      case 'right':
        x = location.x
        while ((x <= $game.VIEWPORT_WIDTH - 1) && $game.$map.currentTiles[x][y].tileState === 0) {
          targetPosition = { x: x, y: y }
          x++
        }
        break
      default:
        // No default case
        break
    }

    // Send move target position through beginMove()
    // beginMove() handles logic on what to do once the player
    // reaches that destination
    $player.beginMove(targetPosition)
  },

  moveStop: function () {
    $player.seriesOfMoves.splice(1, Number.MAX_VALUE)
  },

  // Moves the player as the viewport transitions
  slide: function (slideX, slideY) {
    _info.prevOffX = slideX * STEPS_PER_MOVE
    _info.prevOffY = slideY * STEPS_PER_MOVE
  },

  // When the player finishes moving or we just need a hard reset for rendering
  resetRenderValues: function () {
    _info.prevOffX = 0
    _info.prevOffY = 0
  },

  // decide what type of seed drop mechanic to do and check if they have seeds
  dropSeed: function (options) {
    if (options.x !== undefined && options.x >= 0) {
      options.mX = $game.$map.currentTiles[options.x][options.y].x
      options.mY = $game.$map.currentTiles[options.x][options.y].y
    }
    var mode = options.mode

    // regular seed mode
    if (mode === 'regular') {
      if (_seeds.regular < 1) {
        return false
      } else {
        // Default paint radius
        options.sz = 3
        options.radius = 1

        // If powered up, increase paint radius
        if ($game.flags.check('paint-up-1')) options.radius++
        if ($game.flags.check('paint-up-2')) options.radius++
        if ($game.flags.check('paint-up-3')) options.radius++
        if ($game.flags.check('paint-max')) options.radius = 4

        _player.calculateSeeds(options)
        return true
      }
    } else {
      // draw seed mode
      var seedArray = $.map(_drawSeeds, function (k, v) {
        return [k]
      })

      if (seedArray.length > 0) {
        // figure out the size covered
        var topLeftTile = $game.$map.currentTiles[_drawSeedArea.minX][_drawSeedArea.minY]
        var bottomRightTile = $game.$map.currentTiles[_drawSeedArea.maxX][_drawSeedArea.maxY]
        var centerTileX = $game.$map.currentTiles[15][7].x
        var centerTileY = $game.$map.currentTiles[15][7].y

        var data = {
          bombed: seedArray,
          options: {
            mX: centerTileX,
            mY: centerTileY
          },
          x1: topLeftTile.x,
          y1: topLeftTile.y,
          x2: bottomRightTile.x,
          y2: bottomRightTile.y,
          kind: 'draw'
        }
        _player.sendSeedBomb(data)
        return true
      }
    }
  },

  // determine which returning to npc prompt to show based on if player answered it or not
  getPrompt: function (id) {
    if (_resources[id]) {
      if (_resources[id].result) {
        return 2
      } else {
        return 1
      }
    }
    return 0
  },

  // Saves the user's answer locally
  saveResourceLocally: function (data) {
    var playerResource = _resources[data.id]

    // See if the resource is already in the player's game data
    // If so, retrieve it and update it
    // If not, set up a new object
    if (playerResource) {
      playerResource.answers.push(data.answer)
      if (Number.isInteger(data.attempts)) {
        playerResource.attempts = data.attempts
      } else {
        playerResource.attempts += 1
      }
      playerResource.result = data.correct
      playerResource.seedsRewarded = this.determineNumberOfSeedsToReward(playerResource)
      if (data.tagline) {
        playerResource.tagline = data.tagline
      }
    } else {
      // Create resource game data to save
      // This will be updated on the server later
      playerResource = {
        id: data.id,
        questionType: data.questionType,
        answers: [data.answer],
        attempts: Number.isInteger(data.attempts) ? data.attempts : 1,
        result: data.correct,
        seeded: [],
        skinSuit: data.skinSuit,
        rewarded: data.rewarded || false,
        tagline: null
      }

      // Determine seeds to reward
      playerResource.seedsRewarded = this.determineNumberOfSeedsToReward(playerResource)

      // Add it to game data
      _resources[data.id] = playerResource
    }

    // Return it so other things in the game know it exists
    return playerResource
  },

  // Determine how many seeds a player gets, based on their attempts
  determineNumberOfSeedsToReward: function (playerResource) {
    var rawAttempts = 6 - playerResource.attempts
    var seedsToAdd = (rawAttempts < 0) ? 0 : rawAttempts

    // If they took more than 1 try to get a binary, drop down more
    if (playerResource.questionType === 'truefalse' || playerResource.questionType === 'yesno') {
      if (seedsToAdd < 5 && seedsToAdd > 2) {
        seedsToAdd = 2
      }
    }

    return seedsToAdd
  },

  // checks if we should save out a new image of player's color map
  saveMapImage: function (force) {
    // only do this if we have dropped 5 new seeds
    if (_seeds.dropped - _previousSeedsDropped > 4 || force) {
      _colorMap = $game.$map.saveImage()
      var info = {
        id: $player.id,
        colorMap: _colorMap
      }
      ss.rpc('game.player.updateGameInfo', info)
      _previousSeedsDropped = _seeds.dropped
    }
  },

  // Gets player's answer for specific resource
  getAnswer: function (id) {
    return _resources[id]
  },

  // Simulates giving a map to the player
  giveMapToPlayer: function () {
    // Turn on minimap view on gameboard
    // NOTE: Currently always on by default.
    // $game.minimap.show()

    // Enable minimap view on progress window
    $('#progress-area .minimap').show()
  },

  // reset items and prepare other entities for fresh level
  nextLevel: function () {
    $player.currentLevel += 1
    $player.seenRobot = false
    $game.$botanist.setState(0)
    $game.flags.unset('botanist-teleported')
    _pledges = 5
    // $game.$render.loadTilesheet($player.currentLevel, true)

    // save new information to DB
    ss.rpc('game.player.updateGameInfo', {
      id: $player.id,
      botanistState: $game.$botanist.getState(),
      seenRobot: $player.seenRobot,
      pledges: _pledges,
      currentLevel: $player.currentLevel
    })

    $game.log('Congrats! You have completed level ' + $player.currentLevel + '!')

    if ($player.currentLevel < 4) {
      $game.$robot.setPosition()
      _renderInfo.level = $player.currentLevel

      // Clear inventory and redraw for next level
      $game.inventory.empty()
      $game.inventory.init()

      ss.rpc('game.player.levelChange', {
        id: $player.id,
        level: $player.currentLevel,
        name: $player.firstName
      })
    } else if ($game.bossModeUnlocked) {
      $game.toBossLevel()
    }
  },

  // return the calculation of how long they have been playing for (total)
  getPlayingTime: function () {
    var currentTime = new Date().getTime() / 1000
    var totalTime = Math.round((currentTime - _startTime) + _playingTime)
    return totalTime
  },

  // remove the menu once they have selected a seed flash player and disable other actions
  startSeeding: function (choice) {
    $player.seedMode = choice
    $('#seedventory').slideUp(function () {
      $game.flags.unset('visible-seedventory')
      $player.seedPlanting = true
    })
    var msg
    if (choice === 'regular') {
      msg = 'Click anywhere to plant a seed and watch color bloom there'
    } else {
      msg = 'Paintbrush mode activated - click and drag to draw'

      var graffitiEl = document.getElementById('graffiti')
      graffitiEl.style.display = 'block'
      graffitiEl.querySelector('.remaining').textContent = _seeds.draw
    }
    $game.alert(msg)
  },

  // Make a response public to all other users
  makePublic: function (id) {
    if (_resources[id]) {
      _resources[id].madePublic = true
      ss.rpc('game.npc.makeResponsePublic', {
        playerId: $player.id,
        resourceId: id,
        instanceName: $player.instanceName
      })
      // This emits an 'ss-addAnswer' event
    }
  },

  // Make a previously public response private to all other users
  makePrivate: function (id) {
    if (_resources[id]) {
      _resources[id].madePublic = false
      ss.rpc('game.npc.makeResponsePrivate', {
        playerId: $player.id,
        resourceId: id,
        instanceName: $player.instanceName
      })
      // This emits an 'ss-removeAnswer' event
    }
  },

  // Get ALL answers for all open questions for this player
  compileAnswers: function () {
    var html = ''

    $.each(_resources, function (index, resource) {
      if (resource.questionType === 'open') {
        var answer = resource.answers[resource.answers.length - 1]
        var question = $game.$resources.get(index).question
        var seededCount = resource.seeded.length

        html += '<p class="theQuestion"><strong>Q:</strong> ' + question + '</p><div class="theAnswer"><p class="answerText">' + answer + '</p>'
        if (seededCount > 0) {
          html += '<p class="seededCount">' + seededCount + ' likes</p>'
        }
        html += '</div>'
      }
    })

    return html
  },

  // See if the player has the specific resource already
  // Note that it must be correct and rewarded to count.
  checkForCompletedResource: function (id) {
    var resource = _resources[id]
    if (!resource) return false
    if (resource.result !== true) return false
    if (resource.rewarded !== true) return false
    return true
  },

  // See if the player has resource, complete or not
  checkForResource: function (id) {
    return (_resources[id]) ? true : false
  },

  // Set seeds to a specific amount
  setSeeds: function (kind, quantity) {
    _seeds[kind] = quantity

    // Save to DB
    ss.rpc('game.player.updateGameInfo', {
      id: $player.id,
      seeds: _seeds
    })

    // Update HUD
    _player.updateTotalSeeds()
  },

  // Add seeds to a specific type of seed
  addSeeds: function (kind, quantity) {
    // TODO: Use getSeeds() instead of a global.
    var total = _seeds[kind] + quantity
    $player.setSeeds(kind, total)
  },

  // put new answer into the resume
  resumeAnswer: function (answer) {
    _resume.push(answer)
    var info = {
      id: $player.id,
      resume: _resume
    }
    ss.rpc('game.player.updateGameInfo', info)
  },

  // keep track of how many seedITs the player has done
  updatePledges: function (quantity) {
    _pledges += quantity
    var info = {
      id: $player.id,
      pledges: _pledges
    }
    ss.rpc('game.player.updateGameInfo', info)
  },

  // Return the player's current position in the world
  getPosition: function () {
    return _info
  },

  // Return the player's current position on the screen
  getLocalPosition: function () {
    return $game.$map.masterToLocal(_info.x, _info.y)
  },

  // Get the player's color index number
  getColorIndex: function () {
    return $player.playerColor
  },

  // Get a color at a given index or use current player color index
  getColor: function (index) {
    if (!index) {
      index = $player.getColorIndex()
    }
    // Returns an object {r, g, b}, values from 0 - 255
    return COLORS[index]
  },

  // Get a color hex string at a given index or use current player color index
  getCSSColor: function (index) {
    var rgb = $player.getColor(index)
    // A quick way of converting to a hex string, e.g. #5599cc
    return '#' + ('0' + (rgb.r.toString(16))).slice(-2) + ('0' + (rgb.g.toString(16))).slice(-2) + ('0' + (rgb.b.toString(16))).slice(-2)
  },

  // get all the render info to draw player
  getRenderInfo: function () {
    return _renderInfo
  },

  // get the current color map
  getColorMap: function () {
    return _colorMap
  },

  // get the number of tiles colored
  getTilesColored: function () {
    return _tilesColored
  },

  // Get an object containing references to all collected resources
  // Plus information pertaining to the player's copy of the resource
  // e.g. answers, number of attempts, etc.
  getResources: function () {
    return _resources
  },

  // Get a particular resource that is in the player's collection
  // Note: this is not the original resource object
  getResource: function (id) {
    return _resources[id]
  },

  // Get the number of resources collected
  getResourcesDiscovered: function () {
    return _resourcesDiscovered
  },

  getSkinSuit: function () {
    var data = _skinSuit
    // We need to return this data as a
    // separate object to prevent other
    // scripts from writing directly to it
    return {
      head: data.head,
      torso: data.torso,
      legs: data.legs
    }
  },

  // When the player changes skin, update client model and save to db
  setSkinSuit: function (name, part) {
    // Update model
    if (part !== undefined) {
      _skinSuit[part] = name
    } else {
      // Assume entire suit
      _skinSuit.head = name
      _skinSuit.torso = name
      _skinSuit.legs = name
    }

    // Change skin on database
    ss.rpc('game.player.changeSkinSuit', {
      id: $player.id,
      skinSuit: _skinSuit
    })
  },

  // Returns a clone of the skinventory data
  getSkinventory: function () {
    var data = _skinSuit
    return data.unlocked
  },

  // Updates the skinventory on the database
  setSkinventory: function (skinventory) {
    _skinSuit.unlocked = skinventory
    ss.rpc('game.player.updateGameInfo', {
      id: $player.id,
      skinSuit: _skinSuit
    })
  },

  // Get seeds
  getSeeds: function () {
    return _seeds
  },

  // get the number of seeds dropped
  getSeedsDropped: function () {
    return _seeds.dropped
  },

  getMoveSpeed: function () {
    return _player.moveSpeed
  },

  getLevel: function () {
    return $player.currentLevel + 1
  },

  // get the quantity of seedITs made
  getPledges: function () {
    return _pledges
  },

  // get the current viewport position
  getRenderPosition: function () {
    return {x: _renderInfo.curX, y: _renderInfo.curY}
  },

  // Get region of the world that player is in
  getGameRegion: function () {
    // Compare player position to centers of the world
    var position = this.getPosition()
    var posX = position.x
    var posY = position.y
    var diffX = posX - ($game.TOTAL_WIDTH - 4) / 2
    var diffY = posY - ($game.TOTAL_HEIGHT + 8) / 2

    // Check for botanist's place first
    if (posX >= 57 && posX <= 84 && posY >= 66 && posY <= 78) {
      return 5
    }
    // 1 top left
    else if (diffX < 0 && diffY < 0) return 0
    // 2 top right
    else if (diffX > 0 && diffY < 0) return 1
    // 3 bottom right
    else if (diffX > 0 && diffY > 0) return 2
    // 4 bottom left
    else if (diffX < 0 && diffY > 0) return 3
    // no man's land
    else return -1
  },

  // Transport player magically (or scientifically) to any location in the game world
  beam: function (location) {
    $game.flags.set('is-beaming')
    $game.flags.set('screen-transition')
    $game.$input.resetUI()
    $game.$chat.clearAllChats()
    $('#beaming').show()

    _info.x = location.x
    _info.y = location.y
    _renderInfo.curX = location.x * $game.TILE_SIZE
    _renderInfo.curY = location.y * $game.TILE_SIZE
    _renderInfo.prevX = location.x * $game.TILE_SIZE
    _renderInfo.prevY = location.y * $game.TILE_SIZE

    var tx = (location.x === 0) ? 0 : location.x - 1
    var ty = (location.y === 0) ? 0 : location.y - 1
    var divX = Math.floor(tx / ($game.VIEWPORT_WIDTH - 2))
    var divY = Math.floor(ty / ($game.VIEWPORT_HEIGHT - 2))
    var startX = divX * ($game.VIEWPORT_WIDTH - 2)
    var startY = divY * ($game.VIEWPORT_HEIGHT - 2)

    $game.masterX = startX
    $game.masterY = startY

    // update npcs, other players?
    $game.$map.setBoundaries()
    $game.$map.firstStart(function () {
      $game.$render.renderAllTiles()
      setTimeout(function () {
        $game.flags.unset('is-beaming')
        $('#beaming').fadeOut()
        // Use default viewport transition end function
        $game.endTransition()
      }, 1000)

      // Publish beam status
      ss.rpc('game.player.beam', {
        id: $player.id,
        x: location.x,
        y: location.y
      })

      // Update player position on server and minimap
      _player.savePosition(location)
    })
  },

  // When another player pledges a seed, make the update in your local resources
  updateResource: function (data) {
    if (_resources[data.resourceId]) {
      _resources[data.resourceId].seeded.push(data.pledger)
    }
  },

  // Set the tagline to the resource locally
  setTagline: function (resource, tagline) {
    if (_resources[resource.id]) {
      _resources[resource.id].tagline = tagline
    }
  },

  // Save player's resource status to the database (whether completed, answered, etc)
  saveResource: function (resource) {
    var playerResource = _resources[resource.id]
    var npc = $game.$npc.findNpcByResourceId(resource.id)
    var npcLevel = npc.getLevel()
    var playerLevel = $player.getLevel()

    // Things to unlock / add if this is a correct answer
    // And also make sure it has not been awarded already
    if (playerResource.result === true && playerResource.rewarded === false) {
      // Add piece to inventory
      // Do not add if this is a resume type question
      if (playerLevel === npcLevel && resource.questionType !== 'resume') {
        $game.inventory.add({
          id: resource.id,
          name: resource.shape,
          tagline: playerResource.tagline
        })
      }

      // Add item to inventory count
      _resourcesDiscovered += 1

      // Add seeds
      $player.addSeeds('regular', playerResource.seedsRewarded)

      // Unlock skinsuit
      if (playerResource.skinSuit) {
        $game.$skins.unlockSkin(playerResource.skinSuit)
      }

      // Flip to true once rewarded
      playerResource.rewarded = true

      // If the resource saved is a community NPC resource, immediately
      // save all of the others! These ids are 4001, 4002 and 4003
      if (resource.id > 4000 && resource.id < 4004) {
        $player.saveOtherCommunityResources(resource.id)
      }
    }

    // Save resource to DB
    _player.saveResourceToDb(playerResource)

    // Hack to not include demo users
    if ($player.firstName !== 'Demo') {
      // Add this to the DB of resources for all player answers
      var newAnswer = {
        resourceId: resource.id,
        playerId: $player.id,
        name: $player.firstName,
        answer: playerResource.answers[playerResource.answers.length - 1],
        madePublic: false
      }
      ss.rpc('game.npc.saveResponse', $player.instanceName, newAnswer)
    }

    // Display NPC bubble with number of comments & update minimap radar
    $player.displayNpcComments()
    $game.minimap.radar.update()
  },

  // If one of the community resources is obtained, call this function to save
  // all of the other ones so that the NPCs who hold them are unlocked
  // answeredResourceId will be the one that is answered, either 4001, 4002 or 4003
  // TODO: This is hacky, is there a better way of doing this?
  saveOtherCommunityResources: function (answeredResourceId) {
    // Hack for community inventory items
    // Dummy data for other resources
    var ids = [4001, 4002, 4003]
    var bunchOfResources = []
    var masterNpcResource = _resources[4000]

    for (var i = 0; i < ids.length; i++) {
      if (ids[i] === answeredResourceId) continue

      var dummyData = {
        id: ids[i],
        answer: '',
        attempts: 0,
        npcLevel: null,
        questionType: null,
        skinSuit: null,
        correct: true,
        rewarded: true,
        tagline: null
      }

      var dummyResource = $player.saveResourceLocally(dummyData)
      bunchOfResources.push(dummyResource)
    }

    // Also: the Master NPC resource article will be directed
    // to a resource equal to the 400x range, which are the
    // videos about that community.
    masterNpcResource.url = answeredResourceId.toString()
    bunchOfResources.push(dummyResource)

    // Also update on resources
    $game.$resources.get(4000).url = answeredResourceId.toString()

    ss.rpc('game.player.saveMoreThanOneResource', {
      id: $player.id,
      resources: bunchOfResources
    })
  },

  // show a bubble over visited npcs of how many comments there are
  displayNpcComments: function () {
    // Clear any previous comment bubbles
    $player.clearNpcComments()

    // Get on-screen NPCs
    var npcs = $game.$npc.getOnScreenNpcs()

    // Go thru each on-screen NPC; figure out what to display inside the bubble and what to display when player hovers over it.
    for (var n = 0; n < npcs.length; n++) {
      var npc = $game.$npc.get(npcs[n])
      var resourceId = npc.resource.id
      var theResource = _resources[resourceId]
      var contents = null
      var message = null

      // If player has obtained the NPC's resource
      if (theResource && theResource.result === true) {
        // For open-ended questions
        if (theResource.questionType === 'open') {
          contents = $game.$resources.get(resourceId).getNumResponses()
          if (contents > 0) {
            message = 'Click to view ' + contents + ' public answers'
          } else {
            message = 'There are no public answers, click to make yours public'
          }
        } else {
          // For all other question types
          contents = '*'
          message = 'You answered this question correctly'
        }
        _addBubble(npc, contents, message)
      } else if (($game.flags.check('local-radar') || $game.flags.check('global-radar'))) {
        // If player is wearing a rader that can sense if NPCs have a resource to give
        // Display indicator if:
        // - NPC is holding a resource
        // - player doesn't have it yet
        // - and the player is at least the NPC's level
        // (since it is possible to obtain NPC rewards from a
        // lower-level NPC if the player skipped it earlier)
        if (npc.isHolding === true && (!theResource || theResource.result === false) && $player.getLevel() >= npc.getLevel()) {
          contents = '!'
          message = 'This character has something for you!'
          _addBubble(npc, contents, message)
        }
      }
    }

    // Create and append the bubble to the gameboard
    function _addBubble (npc, contents, hoverMessage) {
      var gameboardEl = document.getElementById('gameboard')
      var npcPosition = npc.getLocalPosition()
      var resourceId = npc.resource.id
      var theBubble = _createBubbleElement(npc.id, contents)

      // Append bubble to gameboard
      gameboardEl.appendChild(theBubble)

      // Positioning
      $(theBubble).css({
        top: npcPosition.y - 68,
        left: npcPosition.x
      })

      // Bind mouse actions to the comment bubble
      // Show a message on hover
      $(theBubble).on('mouseenter', function () {
        _showMessageOnHover(hoverMessage)
      })

      // For open ended questions, display player responses on click
      if (_resources[resourceId] && _resources[resourceId].questionType === 'open') {
        $(theBubble).on('click', function () {
          _examineResponsesOnClick(resourceId)
        })
      }
    }

    function _createBubbleElement (npcId, contents) {
      var el = document.createElement('div')
      el.classList.add('npc-bubble')
      // Hacky way to style the '!' differently
      if (contents === '!') {
        el.classList.add('npc-bubble-exclaim')
      }
      el.id = 'npcBubble' + npcId
      el.textContent = contents
      return el
    }

    function _examineResponsesOnClick (resourceIndex) {
      $game.$resources.examineResponses(resourceIndex)
    }

    function _showMessageOnHover (message) {
      if (_.isString(message)) $game.alert(message)
    }
  },

  clearNpcComments: function () {
    $('.npc-bubble').remove()
  },

  // save the player's current position to the DB
  saveTimeToDB: function () {
    var endTime = new Date().getTime() / 1000
    var totalTime = parseInt(endTime - _startTime, 10)
    _playingTime += totalTime
    var info = {
      id: $player.id,
      playingTime: _playingTime
    }
    _startTime = endTime
    ss.rpc('game.player.updateGameInfo', info)
  },

  // call the save seed function from outside player
  saveSeeds: function () {
    _saveSeedsToDB()
  },

  // update the running array for current tiles colored to push to DB on end of drawing
  drawSeed: function (pos) {
    if (_seeds.draw > 0) {
      var drawLocal = false
      if ($player.seedMode === 'draw') {
        var currentTile = $game.$map.currentTiles[pos.x][pos.y]
        var index = currentTile.mapIndex

        // add to array and color if we haven't done it
        if (!_drawSeeds[index]) {
          $player.addSeeds('draw', -1)
          document.getElementById('graffiti').querySelector('.remaining').textContent = _seeds.draw
          drawLocal = true
          _drawSeeds[index] = {
            x: currentTile.x,
            y: currentTile.y,
            mapIndex: index,
            instanceName: $player.instanceName
          }
          // keep track area positions
          if (pos.x < _drawSeedArea.minX) {
            _drawSeedArea.minX = pos.x
          }
          if (pos.y < _drawSeedArea.minY) {
            _drawSeedArea.minY = pos.y
          }
          if (pos.x > _drawSeedArea.maxX) {
            _drawSeedArea.maxX = pos.x
          }
          if (pos.y > _drawSeedArea.maxY) {
            _drawSeedArea.maxY = pos.y
          }
        }
        // empty so add it
        if (drawLocal) {
          // blend the prev. color with new color
          // show auto
          $game.$map.currentTiles[pos.x][pos.y].colored = true

          // draw over the current tiles to show player they are drawing
          $game.$render.clearMapTile(pos)
          $game.$render.renderTile(pos.x, pos.y)
        }
      }
    } else {
      $player.dropSeed({mode: 'draw'})
      $game.flags.unset('draw-mode')
      $player.seedMode = false
      $BODY.off('mousedown touchstart', '#gameboard')
      $player.seedPlanting = false
      $game.alert('You are out of seeds!')
      _saveSeedsToDB()
    }
  },

  // put initial seed drawn in running array
  drawFirstSeed: function () {
    var pos = $game.$mouse.getCurrentPosition()
    _drawSeeds = {}
    _drawSeedArea = {
      minX: 29,
      maxX: 0,
      minY: 14,
      maxY: 0
    }
    $player.drawSeed(pos)
  },

  // if boss mode then must change up pos info
  setPositionInfo: function () {
    if ($game.bossModeUnlocked && $player.currentLevel > 3) {
      _info.x = 15
      _info.y = 8
    }
  },

  // turns off draw mode if no seeds left
  checkSeedLevel: function () {
    if (_seeds.draw <= 0) {
      $game.flags.unset('draw-mode')
    }
  },

  setMoveSpeed: function (multiplier) {
    _player.moveSpeed = multiplier || 1
  }

}

/**
  *
  *  PRIVATE FUNCTIONS
  *
 **/

var _player = {

  moveSpeed: 1,

  // * * * * * * *   SEEDING   * * * * * * *

  // Fgure out which tiles to color when a seed is dropped
  calculateSeeds: function (options) {
    var tiles = []

    // Get the tiles that need to be bombed
    if (options.radius > 1) {
      // If radius is more than 1, send a circular bomb
      // A radius of 1 is equal to a 3x3 area
      tiles = _getTilesInCircle(options.mX, options.mY, options.radius)
    } else {
      // Send a square bomb
      tiles = _getTilesInSquare(options.mX, options.mY, options.sz)
    }

    // Add additional info
    for (var i in tiles) {
      tiles[i].mapIndex = tiles[i].y * $game.TOTAL_WIDTH + tiles[i].x
      tiles[i].instanceName = $player.instanceName
    }

    // Utility function for getting an array of all points a radius from a particular X,Y
    function _getTilesInCircle (x, y, r) {
      var tiles = []

      for (var j = x - r; j <= x + r; j++)
        for (var k = y - r; k <= y + r; k++)
          if ((_distance({ x: j, y: k }, { x: x, y: y }) <= r) &&
              (_isInMap(j, k))) tiles.push({ x: j, y: k })

      return tiles
    }

    // Utility function for getting an array of all points in a square around X,Y
    function _getTilesInSquare (x, y, sz) {
      var tiles = []
      var mid = Math.floor(sz / 2)
      var cornerX = x - mid
      var cornerY = y - mid

      for (var j = cornerX; j < cornerX + sz; j++)
        for (var k = cornerY; k < cornerY + sz; k++)
          if (_isInMap(j, k)) tiles.push({ x: j, y: k })

      return tiles
    }

    // Utility function for finding the distance from a point
    function _distance (p1, p2) {
      var dx = p2.x - p1.x
      var dy = p2.y - p1.y
      dx *= dx
      dy *= dy
      return Math.sqrt(dx + dy)
    }

    // Utility function for verifying if a point is on the map
    function _isInMap (x, y) {
      return (x > -1 && x < $game.TOTAL_WIDTH && y > -1 && y < $game.TOTAL_HEIGHT) ? true : false
    }

    if (tiles.length > 0) {
      // Set a correct size for the bounding box if radius mode
      if (options.radius > 1) options.sz = (options.radius - 1) * 2 + 3

      var origX = options.mX - Math.floor(options.sz / 2)
      var origY = options.mY - Math.floor(options.sz / 2)

      _player.sendSeedBomb({
        bombed: tiles,
        options: options,
        x1: origX,
        y1: origY,
        x2: origX + options.sz,
        y2: origY + options.sz,
        kind: 'regular'
      })
    }
  },

  // plant the seed on the server and wait for response and update hud and map
  sendSeedBomb: function (data) {
    var waitingEl = document.getElementById('waiting-for-seed')

    // set a waiting boolean so we don't plant more until receive data back from rpc
    $game.flags.set('awaiting-seed')

    // send the data to the rpc
    var info = {
      id: $player.id,
      name: $player.firstName,
      x1: data.x1,
      y1: data.y1,
      x2: data.x2,
      y2: data.y2,
      tilesColored: _tilesColored,
      instanceName: $player.instanceName,
      kind: data.kind
    }

    var loc = $game.$map.masterToLocal(data.options.mX, data.options.mY)

    $(waitingEl)
      .css({
        top: loc.y * 32,
        left: loc.x * 32
      })
      .show()

    ss.rpc('game.player.dropSeed', data.bombed, info, function (result) {
      $game.flags.unset('awaiting-seed')

      $(waitingEl).fadeOut()
      if (result > 0) {
        _seeds.dropped += 1   // increase the drop count for the player
        $game.$audio.playTriggerFx('seedDrop')  // play sound clip
        _tilesColored += result

        if (data.kind === 'regular') {
          $player.addSeeds('regular', -1)

          // If player is out of seeds, end it
          if (_seeds.regular === 0) {
            _player.endSeedMode()
          }
        } else {
          $player.addSeeds('draw', 0)

          if (_seeds.draw === 0) {
            _player.endSeedMode()

            // Other actions unique to draw mode
            $game.flags.unset('draw-mode')
            $BODY.off('mousedown touchstart', '#gameboard')
            document.getElementById('graffiti').style.display = 'none'
          }
        }
      }
    })
  },

  // Generic end seed mode
  endSeedMode: function() {
    $player.seedMode = false
    $player.seedPlanting = false
    $game.alert('You are out of seeds!')
    $('.hud-seed').removeClass('hud-button-active')
    $player.saveMapImage(true)
    // TODO: save seed values to DB
    _saveSeedsToDB()
  },

  // Update seed counts
  updateTotalSeeds: function () {
    _totalSeeds = _seeds.regular + _seeds.draw

    $game.setBadgeCount('.hud-seed', _totalSeeds)
    $game.setBadgeCount('.regular-button', _seeds.regular)
    $game.setBadgeCount('.draw-button', _seeds.draw)
  },

  // * * * * * * *   DATABASE   * * * * * * *

  // Save a new resource to the database
  saveResourceToDb: function (resource) {
    ss.rpc('game.player.saveResource', {
      id: $player.id,
      resource: resource,
      inventory: $game.inventory.get(),
      resourcesDiscovered: _resourcesDiscovered
    })
  },

  // Saves player location
  savePosition: function (position) {
    // Location is an object with x and y properties
    // Update on server
    ss.rpc('game.player.savePosition', {
      id: $player.id,
      position: {
        x: position.x,
        y: position.y
      }
    })

    // Update on minimap
    $game.minimap.updatePlayer($player.id, position)
  }
}

// on init, set local and global variables for all player info
function _setPlayerInformation (info) {
  // Ensure that flags start from a clean state
  $game.flags.unsetAll()

  // private
  _seeds = info.game.seeds
  _previousSeedsDropped = _seeds.dropped
  _resources = _objectify(info.game.resources)
  $game.inventory.set(info.game.inventory)
  _colorMap = info.game.colorMap
  _resume = info.game.resume
  _playingTime = info.game.playingTime
  _tilesColored = info.game.tilesColored
  _pledges = info.game.pledges
  _resourcesDiscovered = info.game.resourcesDiscovered
  _skinSuit = info.game.skinSuit

  // hack
  // console.log(_resources);
  if (!_resources) {
    _resources = {}
  }

  // public
  $player.id = info.id
  $player.firstName = info.firstName
  $player.currentLevel = info.game.currentLevel
  $player.instanceName = info.game.instanceName
  $player.seenRobot = info.game.seenRobot
  $player.isMuted = info.game.isMuted
  $player.playerColor = info.game.playerColor

  $game.$botanist.setState(info.game.botanistState)

  if (info.game.firstTime === true) {
    $game.flags.set('first-time')
  }
}

// calculate new render information based on the player's position
function _updateRenderInfo () {
  // get local render information. update if appropriate.
  var loc = $game.$map.masterToLocal(_info.x, _info.y)
  if (loc) {
    var prevX = loc.x * $game.TILE_SIZE + _info.prevOffX * $game.STEP_PIXELS
    var prevY = loc.y * $game.TILE_SIZE + _info.prevOffY * $game.STEP_PIXELS
    var curX = loc.x * $game.TILE_SIZE + _info.offX * $game.STEP_PIXELS
    var curY = loc.y * $game.TILE_SIZE + _info.offY * $game.STEP_PIXELS

    _renderInfo.prevX = prevX
    _renderInfo.prevY = prevY
    _renderInfo.srcX = _info.srcX
    _renderInfo.srcY = _info.srcY
    _renderInfo.curX = curX
    _renderInfo.curY = curY
  }
}

// figure out how much to move the player during a walk and wait frame to show
function _move () {
  /** IMPORTANT note: x and y are really flipped!!! **/ // is this true?

  // First, check what step of animation we are on.
  // After one animation cycle, reset steps and moves
  if ($player.currentStep >= STEPS_PER_MOVE) {
    $player.currentStep = 0

    // The next move becomes the current player's current position
    _info.x = $player.seriesOfMoves[0].masterX
    _info.y = $player.seriesOfMoves[0].masterY

    // Once set, remove the move from queue immediately
    $player.seriesOfMoves.shift()

    // Update player's location on the minimap
    $game.minimap.updatePlayer($player.id, _info)
  }

  // If there are no more moves, finish
  if ($player.seriesOfMoves.length <= 0) {
    if ($game.bossModeUnlocked && $player.currentLevel > 3) {
      _info.offX = 0
      _info.offY = 0
      _info.srcX = 0
      _info.srcY = 0
      _info.prevOffX = 0
      _info.prevOffY = 0

      $game.$boss.endMove(_info)
    } else {
      _endMove()
    }
  } else {
    // There are more moves, keep setting each frame of animation
    var currentSpeed = $player.getMoveSpeed()

    // If it is the first step, then figure out which direction to face
    if ($player.currentStep === 0) {
      _currentStepIncX = $player.seriesOfMoves[0].masterX - _info.x
      _currentStepIncY = $player.seriesOfMoves[0].masterY - _info.y

      // set the previous offsets to 0 because the last visit
      // was the actual rounded master
      _info.prevOffX = 0
      _info.prevOffY = 0

      // set direction for sprite sheets
      // direction refers to the y location on the sprite sheet
      // since the character will be in different rows
      // will be 0,1,2,3
      if (_currentStepIncX === 1) {
        _direction = 2
      } else if (_currentStepIncX === -1) {
        _direction = 1
      } else if (_currentStepIncY === -1) {
        _direction = 4
      } else {
        _direction = 3
      }
    } else {
      _info.prevOffX = _info.offX
      _info.prevOffY = _info.offY
    }

    _info.offX = $player.currentStep * _currentStepIncX
    _info.offY = $player.currentStep * _currentStepIncY

    // Change the source frame every X frames
    // We need to get a number between 0 and whatever that is guanteed to be modulo'able by 8
    // and hit zero, so that the frame can increment
    if ((Math.floor($player.currentStep / currentSpeed) - 1) % 8 === 0) {
      _curFrame += 1
      // Reset when we have hit the number of frames
      if (_curFrame >= 4) {
        _curFrame = 0
      }
    }
    _info.srcX = _curFrame * $game.TILE_SIZE
    _info.srcY = _direction * $game.TILE_SIZE * 2

    // Increment the current step
    $player.currentStep += 1 * currentSpeed
  }
}

// once the move is sent out to all players, update the players next moves
function _sendMoveInfo (moves) {
  $game.flags.set('is-moving')

  // If there is already a move queue, let the current one finish and\
  // then replace the rest with the new moves.
  if ($player.seriesOfMoves.length > 0) {
    $player.seriesOfMoves.splice(1, Number.MAX_VALUE)
    $player.seriesOfMoves = $player.seriesOfMoves.concat(moves)
  } else {
    $player.seriesOfMoves = moves
  }
}

// When a move is done, decide what to do next (if it is a transition)
function _endMove () {
  // Save position to database
  _player.savePosition({
    x: _info.x,
    y: _info.y
  })

  // Put the character back to normal position
  _info.offX = 0
  _info.offY = 0
  _info.srcX = 0
  _info.srcY = 0
  _info.prevOffX = 0
  _info.prevOffY = 0

  // Are we at the edge of the world?
  if ($game.$map.isMapEdge($player.getLocalPosition()) === true) {
    $game.alert('Edge of the world!')
  }

  // Transition screen if the player can move to the next screen
  if ($game.flags.check('screen-will-transition') === true) {
    $game.beginTransition()
  }

  // Update music
  $game.$audio.update()

  // Activate NPC
  // npcOnDeck can equal zero so be sure to check against boolean, rather than falsy
  if ($player.npcOnDeck !== false) {
    $game.$npc.activate($player.npcOnDeck)
  }

  $game.flags.unset('is-moving')
}

// determine what frame to render while standing
function _idle () {
  _idleCounter += 1

  if (_idleCounter >= 64) {
    _idleCounter = 0
    _info.srcX = 0
    _info.srcY = 0
    _renderInfo.squat = false

    _updateRenderInfo()
  } else if (_idleCounter === 48) {
    _info.srcX = 32
    _info.srcY = 0
    _renderInfo.squat = true

    _updateRenderInfo()
  }
}

// save current seed data to db
function _saveSeedsToDB () {
  var info = {
    id: $player.id,
    seeds: _seeds,
    tilesColored: _tilesColored
  }
  ss.rpc('game.player.updateGameInfo', info)
}

// turn array into object
function _objectify (input) {
  var result = {}
  for (var i = 0; i < input.length; i++) {
    result[input[i].id] = input[i]
    result[input[i].id].arrayLookup = i
  }
  return result
}

// Temporary global for player colors.
// TODO: Use the backend for this?
var COLORS = [
  {
    'r': 255,
    'g': 255,
    'b': 255
  },
  {
    'r': 205,
    'g': 95,
    'b': 243
  },
  {
    'r': 106,
    'g': 220,
    'b': 230
  },
  {
    'r': 242,
    'g': 202,
    'b': 93
  },
  {
    'r': 184,
    'g': 239,
    'b': 98
  },
  {
    'r': 236,
    'g': 109,
    'b': 168
  },
  {
    'r': 109,
    'g': 227,
    'b': 209
  },
  {
    'r': 242,
    'g': 243,
    'b': 95
  },
  {
    'r': 146,
    'g': 235,
    'b': 103
  },
  {
    'r': 245,
    'g': 97,
    'b': 93
  },
  {
    'r': 108,
    'g': 230,
    'b': 179
  },
  {
    'r': 241,
    'g': 166,
    'b': 92
  },
  {
    'r': 242,
    'g': 95,
    'b': 218
  },
  {
    'r': 242,
    'g': 223,
    'b': 95
  },
  {
    'r': 243,
    'g': 231,
    'b': 99
  },
  {
    'r': 241,
    'g': 93,
    'b': 103
  },
  {
    'r': 233,
    'g': 239,
    'b': 98
  },
  {
    'r': 243,
    'g': 101,
    'b': 121
  },
  {
    'r': 203,
    'g': 245,
    'b': 93
  },
  {
    'r': 227,
    'g': 93,
    'b': 183
  },
  {
    'r': 245,
    'g': 113,
    'b': 91
  },
  {
    'r': 122,
    'g': 235,
    'b': 158
  },
  {
    'r': 242,
    'g': 150,
    'b': 95
  },
  {
    'r': 220,
    'g': 245,
    'b': 94
  },
  {
    'r': 214,
    'g': 95,
    'b': 243
  }
]
