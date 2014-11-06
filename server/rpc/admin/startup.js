'use strict';

var rootDir = process.cwd(),
    fs      = require('fs'),

    config         = require(rootDir + '/app/config'),
    service        = require(rootDir + '/app/service'),
    dbActions      = require(rootDir + '/server/utils/database-actions'),
    accountHelpers = require(rootDir + '/server/utils/account-helpers'),

    userModel      = service.useModel('user', 'preload'),
    tileModel      = service.useModel('tile', 'preload'),
    colorModel     = service.useModel('color', 'preload'),
    npcModel       = service.useModel('npc', 'preload'),
    botanistModel  = service.useModel('botanist', 'preload'),
    gameModel      = service.useModel('game', 'preload'),
    chatModel      = service.useModel('chat', 'preload');

var _JSONClone = function (json) {
  return JSON.parse(JSON.stringify(json))
}

exports.actions = function (req, res, ss) {

  req.use('session');
  // req.use('debug');
  req.use('account.authenticated');

  return {
    loadData: function (dataType) {
      if (req.session.role && req.session.role === 'superadmin') {
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
            // Nothing.
            break
        }
      }
    }
  };
};

var _startup = {
  loadUsers: function (req, res, ss) {
    var userData       = require(rootDir + '/data/users.json'),
        colorData      = require(rootDir + '/data/colors.json'),
        userDataCopy   = _JSONClone(userData),
        numDemoUsers   = 16,
        demoUsers      = [];

    console.log('\n\n   * * * * * * * * * * * *   Pre-Loading Users   * * * * * * * * * * * *   \n\n'.yellow);

    hashUserData(0);

    function hashUserData (i) {
      if (i < userData.length) {
        accountHelpers.hashPassword(userData[i].password, function (hashedPassword) {
          console.log('CS: '.blue + 'Hashing password for user '.green + i + ' ('.yellow + userData[i].firstName.yellow + ')'.yellow + ' ...'.green)
          userDataCopy[i].password = hashedPassword.hash;
          hashUserData(++i);
        });
      }
      else {
        // dbActions.dropCollection('users', function() {
        //  dbActions.saveDocuments(userModel, userDataCopy, function() {
        //    hashDemoData(0);
        //  });
        // });
        dbActions.resetDefaultData(userModel, function (err) {
          if (err) {
            apprise(err);
          }
          else {
            dbActions.saveDocuments(userModel, userDataCopy, function () {
              hashDemoData(0);
            });
          }
        });
      }
    };

    function hashDemoData (i) {
      if( i < numDemoUsers) {
        accountHelpers.hashPassword('demo', function(hashedPassword) {
          //create demo users
          var newColor = colorData[i-1];
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
              // resume: ['My mother is an emergency room doctor in Worcester, MA. When I was younger, I sometimes spent a day with her at work when I was home sick from school, or on half days when her schedule didn\'t allow her to watch me at home. I saw people from all different walks of life. They had immediate problems (why else would they be in the ER?) but I also saw many who did not have insurance because they could not afford it. In comparison, I have been very fortunate, and I want to give something back to the community.','I\'ve done work at the Jewish Community Center, putting together care packages and delivering them, but I haven\'t had much "field experience" yet. That\'s something that I\'d like to improve on.','My main interest is in health and wellness, so I\'d like to work with people in that capacity. Signing up for insurance and learning about health care is difficult and time consuming, especially when communication barriers and education are a factor. I think I would be a great asset to under-served communities with poor access to health services.','I have been thinking about a career in medicine. I think engaging with people one-on-one will help give me important skills that I\'ll use later on.'],
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
          };
          demoUsers.push(d);
          hashDemoData(++i);
        });
      } else {
        dbActions.saveDocuments(userModel, demoUsers, function() {
          res('Data loaded: users');
        });
      }
    };
  },

  loadTiles: function (req, res, ss) {
    var tileData = require(rootDir + '/data/tiles.json')

    console.log('\n\n   * * * * * * * * * * * *   Pre-Loading Tiles   * * * * * * * * * * * *   \n\n'.yellow);

    // Set up tile data object
    var data = tileData.layers // This is an array of unnamed objects, we want to name them
    var tileObject = {}
    for (var i = 0; i < tileData.layers.length; i ++) {
      tileObject[tileData.layers[i].name] = tileData.layers[i]
    }

    // Construct database
    dbActions.dropCollection('tiles', function () {
      var i,
          backgroundArray  = tileObject.texture.data,       // layer name 'texture'
          background2Array = tileObject.background1.data,   // layer name 'background1'
          background3Array = tileObject.background2.data,   // layer name 'background2'
          foregroundArray  = tileObject.foreground1.data,   // layer name 'foreground1'
          foreground2Array = tileObject.foreground2.data,   // layer name 'foreground2'
          tileStateArray   = tileObject.tilestate.data,     // layer name 'tilestate'
          numberOfTiles    = backgroundArray.length,
          mapTilesWidth    = 142,
          mapTilesHeight   = 132,
          mapX,
          mapY,
          tileStateVal,
          tiles = [];

      // dbActions.saveDocuments(tileModel, tileData.global);

      // (re)constructing tile data based on data dump from third party tool
      for(i = 0; i < numberOfTiles; i++) {
        mapX = i % mapTilesWidth;
        mapY = Math.floor(i / mapTilesWidth);

        //add the tile to the array
        //tileState: -1 if nothing (go!), -2 if something (nogo!), the index if it's an NPC
        //checking values are arbitrary right now,
        //based on the image used in tiled map editor

        // 0: this means there was nothing place in tilestate layer, aka GO
        if(tileStateArray[i] === 0) {
          tileStateVal = -1;
        }
        //THIS WILL NOW BE DONE AUTOMAGICALLY by the NPC load
        // //2: this refers to the BLUE tile, means there is an NPC
        // else if(tileStateArray[i] === 2  ) {
        //  tileStateVal = i;
        // }
        //3: this is the pink? tile, it is the botanist
        else if(tileStateArray[i] === 3) {
          tileStateVal = 99999;
        }
        //3: this means there was something OTHER than the blue tile place, NOGO
        else {
          tileStateVal = -2;
        }
        tiles.push({
          x: mapX,
          y: mapY,
          tileState: tileStateVal,
          isMapEdge: (mapX === 0 || mapY === 0 || mapX === mapTilesWidth - 1 || mapY === mapTilesHeight - 1) ? true : false,
          background:  backgroundArray[i],
          background2: background2Array[i],
          background3: background3Array[i],
          foreground:  foregroundArray[i],
          foreground2: foreground2Array[i],
          mapIndex: i
        });
      }

      dbActions.saveDocuments(tileModel, tiles, numberOfTiles, function() {
        res('Data loaded: tiles');
      });
    });
  },

  loadColors: function (req, res, ss) {
    console.log('\n\n   * * * * * * * * * * * *   Pre-Loading Colors   * * * * * * * * * * * *   \n\n'.yellow);
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
    }];

    dbActions.resetDefaultData(colorModel, function(err) {
      if(err) {
        apprise(err);
      } else {
        dbActions.saveDocuments(colorModel, colors, function() {
          res('Data loaded: colors');
        });
      }
    });
  },

  loadBotanist: function (req, res, ss) {
    var botanistData = require(rootDir + '/data/botanist.json');
    console.log('\n\n   * * * * * * * * * * * *   Pre-Loading Botanist   * * * * * * * * * * * *   \n\n'.yellow);

    dbActions.dropCollection('botanists', function() {
      dbActions.saveDocuments(botanistModel, botanistData, function() {
        res('Data loaded: botanist');
      });
    });
  },

  loadNpcs: function (req, res, ss) {
    var npcData = require(rootDir + '/data/npcs.json');
    console.log('\n\n   * * * * * * * * * * * *   Pre-Loading NPCS   * * * * * * * * * * * *   \n\n'.yellow);

    dbActions.dropCollection('npcs', function() {
      dbActions.saveDocuments(npcModel, npcData, function() {
        //go thru npc data, save tilestate at that tile
        dbActions.saveNpcTilestate(tileModel, npcData, function(err) {
          if(err) {
            console.log('error saving tilestate');
          } else {
            res('Data loaded: npcs');
          }
        });
      });
    });
  },

  loadGame: function (req, res, ss) {
    var gameData = require(rootDir + '/data/game.json');

    console.log('\n\n   * * * * * * * * * * * *   Pre-Loading Game   * * * * * * * * * * * *   \n\n'.yellow);

    // dbActions.dropCollection('game', function() {
    //  dbActions.saveDocuments(gameModel, gameData.global, function() {
    //    res('Data loaded: game');
    //  });
    // });
    dbActions.resetDefaultData(gameModel, function (err) {
      if (err) {
        apprise(err);
      }
      else {
        dbActions.saveDocuments(gameModel, gameData, function () {
          res('Data loaded: game');
        });
      }
    });
  },

  loadResources: function (req, res, ss) {
  // Note: this function was deprecated / removed / or never implemented?  --LH
  /*
    var resourceData = require(rootDir + '/data/resources')
    console.log('\n\n   * * * * * * * * * * * *   Pre-Loading Resources   * * * * * * * * * * * *   \n\n'.yellow);
    dbActions.dropCollection('resources', function() {
      dbActions.saveDocuments(resourceModel, resourceData.global, function() {
        res('Data loaded: resources');
      });
    });
  */
  },

  loadChat: function (req, res, ss) {
    console.log('\n\n   * * * * * * * * * * * *   Deleting Chat Logs   * * * * * * * * * * * *   \n\n'.yellow);
    dbActions.resetDefaultData(chatModel, function(err) {
      if(err) {
        apprise(err);
      } else {
        res('Chat logs deleted');
      }
    });
    // dbActions.dropCollection('chat', function() {
    //  res('Chat logs deleted');
    // });
  }
}

