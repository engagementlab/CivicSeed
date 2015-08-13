'use strict'

var rootDir = process.cwd()
var winston = require('winston')

var service = require(rootDir + '/app/service')
var dbActions = require(rootDir + '/server/utils/database-actions')
var accountHelpers = require(rootDir + '/server/utils/account-helpers')
var filename = 'rpc.admin.startup'

var userModel = service.useModel('user')
var tileModel = service.useModel('tile')
var colorModel = service.useModel('color')
var npcModel = service.useModel('npc')
var botanistModel = service.useModel('botanist')
var gameModel = service.useModel('game')
var chatModel = service.useModel('chat')
// var resourceModel = service.useModel('resource')

var _JSONClone = function (json) {
  return JSON.parse(JSON.stringify(json))
}

exports.actions = function (req, res, ss) {
  req.use('session')
  req.use('account.authenticated')

  return {

    loadData: function (dataType) {
      if (req.session.role && req.session.role === 'superadmin') {
        winston.info(filename + ' Loading data for collection: '.magenta + dataType.yellow.underline + ' ...'.magenta)

        switch (dataType) {
          case 'users':
            _startup.loadUsers(req, res, ss)
            break
          case 'tiles':
            _startup.loadTiles(req, res, ss)
            break
          case 'colors':
            _startup.loadColors(req, res, ss)
            break
          case 'botanist':
            _startup.loadBotanist(req, res, ss)
            break
          case 'npcs':
            _startup.loadNpcs(req, res, ss)
            break
          case 'game':
            _startup.loadGame(req, res, ss)
            break
          case 'chat':
            _startup.loadChat(req, res, ss)
            break
          default:
            winston.error(filename + ' A request was made to load a data type that does not exist.'.yellow)
            // Nothing.
            break
        }
      }
    }
  }
}

var _startup = {

  loadUsers: function (req, res, ss) {
    var userData = require(rootDir + '/data/users.json')
    var userDataCopy = _JSONClone(userData)
    var numDemoUsers = 16
    var demoUsers = []

    hashUserData(0)

    function hashUserData (i) {
      if (i < userData.length) {
        accountHelpers.hashPassword(userData[i].password, function (hashedPassword) {
          winston.info('CS: '.blue + 'Hashing password for user '.green + i + ' ('.yellow + userData[i].firstName.yellow + ')'.yellow + ' ...'.green)
          userDataCopy[i].password = hashedPassword.hash
          hashUserData(++i)
        })
      } else {
        dbActions.resetDefaultData(userModel, function (err) {
          if (err) {
            // TODO: Better error handling
            winston.error(err)
          } else {
            dbActions.saveDocuments(userModel, userDataCopy, function () {
              hashDemoData(0)
            })
          }
        })
      }
    }

    function hashDemoData (i) {
      if (i < numDemoUsers) {
        accountHelpers.hashPassword('demo', function (hashedPassword) {
          // create demo users
          var d = {
            activeSessionID: null,
            firstName: 'Demo',
            lastName: ('User' + i),
            school: 'Demo University',
            password: hashedPassword.hash,
            email: ('demo' + i),
            role: 'actor',
            gameStarted: true,
            profilePublic: false,
            profileLink: Math.random().toString(36).slice(2),
            profileSetup: true,
            profileUnlocked: false,
            game: {
              instanceName: 'demo',
              currentLevel: 0,
              position: {
                x: 64,
                y: 77,
                inTransit: false
              },
              resources: [],
              resourcesDiscovered: 0,
              inventory: [],
              seeds: {
                regular: 0,
                draw: 0,
                dropped: 0
              },
              botanistState: 0,
              firstTime: true,
              resume: [],
              seenRobot: false,
              playingTime: 0,
              tilesColored: 0,
              pledges: 5,
              collaborativeChallenge: false,
              playerColor: Math.floor(Math.random() * 24) + 1,
              skinSuit: {
                head: 'basic',
                torso: 'basic',
                legs: 'basic',
                unlocked: {
                  head: ['basic'],
                  torso: ['basic'],
                  legs: ['basic']
                }
              }
            }
          }
          demoUsers.push(d)
          hashDemoData(++i)
        })
      } else {
        dbActions.saveDocuments(userModel, demoUsers, function () {
          res('Data loaded: users')
        })
      }
    }
  },

  loadTiles: function (req, res, ss) {
    var tileData = require(rootDir + '/data/tiles.json')

    // Set up tile data object
    var data = tileData.layers // This is an array of unnamed objects, we want to name them
    var tileObject = {}
    for (var i = 0; i < data.length; i++) {
      tileObject[data[i].name] = data[i]
    }

    // Construct database
    dbActions.dropCollection('tiles', function () {
      var i
      var backgroundArray = tileObject.texture.data       // layer name 'texture'
      var background2Array = tileObject.background1.data  // layer name 'background1'
      var background3Array = tileObject.background2.data  // layer name 'background2'
      var foregroundArray = tileObject.foreground1.data   // layer name 'foreground1'
      var foreground2Array = tileObject.foreground2.data  // layer name 'foreground2'
      var tileStateArray = tileObject.tilestate.data      // layer name 'tilestate'
      var numberOfTiles = backgroundArray.length
      var mapTilesWidth = 142
      var mapTilesHeight = 132
      var mapX
      var mapY
      var tileStateVal
      var tiles = []

      // dbActions.saveDocuments(tileModel, tileData.global);

      // (re)constructing tile data based on data dump from third party tool
      for (i = 0; i < numberOfTiles; i++) {
        mapX = i % mapTilesWidth
        mapY = Math.floor(i / mapTilesWidth)

        // add the tile to the array
        // tileState: 0 if nothing (go!), 1 if something (nogo!), 2 if it's an NPC
        // checking values are arbitrary right now,
        // based on the image used in tiled map editor
        // tileStateVal of 2 will be aded by the NPC load procedure.
        // 0: this means there was nothing place in tilestate layer, aka GO
        if (tileStateArray[i] === 0) {
          tileStateVal = 0
        } else if (tileStateArray[i] === 3) {
          // 3: this is the pink? tile, it is the botanist
          tileStateVal = 3
        } else {
          // X: this means there was something OTHER than the blue tile place, NOGO
          tileStateVal = 1
        }

        tiles.push({
          x: mapX,
          y: mapY,
          tileState: tileStateVal,
          isMapEdge: (mapX === 0 || mapY === 0 || mapX === mapTilesWidth - 1 || mapY === mapTilesHeight - 1) ? true : false,
          background: backgroundArray[i],
          background2: background2Array[i],
          background3: background3Array[i],
          foreground: foregroundArray[i],
          foreground2: foreground2Array[i],
          mapIndex: i,
          npcId: 0
        })
      }

      dbActions.saveDocuments(tileModel, tiles, numberOfTiles, function () {
        res('Data loaded: tiles')
      })
    })
  },

  loadColors: function (req, res, ss) {
    var colors = [{
      instanceName: 'test',
      x: 0,
      y: 0,
      mapIndex: 0
    }, {
      instanceName: 'demo',
      x: 0,
      y: 0,
      mapIndex: 0
    }]

    dbActions.resetDefaultData(colorModel, function (err) {
      if (err) {
        // Placeholder for error handling
      } else {
        dbActions.saveDocuments(colorModel, colors, function () {
          res('Data loaded: colors')
        })
      }
    })
  },

  loadBotanist: function (req, res, ss) {
    var botanistData = require(rootDir + '/data/botanist.json')

    dbActions.dropCollection('botanist', function () {
      dbActions.saveDocuments(botanistModel, botanistData, function (err) {
        if (err) {
          winston.error('Error saving botanist data.')
          res(err)
        } else {
          res('Data loaded: botanist')
        }
      })
    })
  },

  loadNpcs: function (req, res, ss) {
    var npcData = require(rootDir + '/data/npcs.json')

    dbActions.dropCollection('npcs', function () {
      dbActions.saveDocuments(npcModel, npcData, function () {
        // go thru npc data, save tilestate at that tile
        dbActions.saveNpcTilestate(tileModel, npcData, function (err) {
          if (err) {
            console.log('error saving tilestate')
          } else {
            res('Data loaded: npcs')
          }
        })
      })
    })
  },

  loadGame: function (req, res, ss) {
    var gameData = require(rootDir + '/data/game.json')

    dbActions.resetDefaultData(gameModel, function (err) {
      if (err) {
        // Placeholder for error handling
      } else {
        dbActions.saveDocuments(gameModel, gameData, function () {
          res('Data loaded: game')
        })
      }
    })
  },

  loadResources: function (req, res, ss) {
    // Re-implemented. TODO: Find out where this should be called from
    /*var resourceData = require(rootDir + '/data/resources.json')

    dbActions.dropCollection('resources', function () {
      dbActions.saveDocuments(resourceModel, resourceData, function (err) {
        if (err) {
          winston.error('Error saving resources data.')
          res(err)
        } else {
          res('Data loaded: resources')
        }
      })
    })*/
  },

  loadChat: function (req, res, ss) {
    dbActions.resetDefaultData(chatModel, function (err) {
      if (err) {
        // Placeholder for error handling
      } else {
        res('Chat logs deleted')
      }
    })
  }
}
