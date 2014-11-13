'use strict';

var winston = require('winston')

exports.actions = function (req, res, ss) {

  req.use('session')

  var UserModel = ss.service.useModel('user', 'ss'),
      NpcModel  = ss.service.useModel('npc', 'ss'),
      GameModel = ss.service.useModel('game', 'ss')

  return {

    getNpcById: function (npcId) {
      NpcModel.find({ id: npcId }, function (err, npc) {
        if (err) {
          winston.error('  Could not find NPC: %s  '.red.inverse, err)
        } else {
          res(npc)
        }
      })
    },

    getNpcs: function () {
      NpcModel.find(function (err, npcs) {
        if (err) {
          winston.error('  Could not find NPCs: %s  '.red.inverse, err)
        } else {
          res(npcs)
        }
      })
    },

    saveResponse: function (data) {
      GameModel.where('instanceName').equals(data.instanceName)
        .find(function (err, game) {
        if (err) {
          winston.error('  Could not find resource', err)
        } else if (game) {
          var answer = {
            npc: data.npc,
            id: data.id,
            name: data.name,
            answer: data.answer,
            madePublic: data.madePublic
          }

          game[0].resourceResponses.push(answer)
          game[0].save(function (err, worked) {
            if (err) {
              winston.error(err)
            }
          })
        }
      })
    },

    getResponses: function (instance) {
      GameModel.where('instanceName').equals(instance)
        .select('resourceResponses')
        .find(function (err, responses) {
          if (err) {
            winston.error('  Could not find game', err)
          } else if (responses) {
            res(responses)
          }
        })
    },

    makeResponsePublic: function (data) {
      GameModel.where('instanceName').equals(data.instanceName)
        .find(function (err, game) {
          if (err) {
            winston.error('Could not find game', err)
          } else if (game) {
            var all = game[0].resourceResponses,
                a = 0,
                found = false,
                addThis = null

            // This is to prevent the server from crashing when
            // responses stored in user data is out of sync
            // with responses stored in game data.
            try {
              while (!found) {
                if (all[a].npc == data.npcId && all[a].id == data.playerId) {
                  all[a].madePublic = true
                  found = true
                  addThis = all[a]
                }
                a++
              }
            } catch (e) {
              winston.error('rpc.game.npc.makeResponsePublic'.yellow, 'Unable to find player’s answer in the game data.', e)
              res(false)
            }

            game[0].save(function (err, good) {
              if (err) {

              } else {
                ss.publish.channel(req.session.game.instanceName, 'ss-addAnswer', addThis)
                res(true)
              }
            })
          }
      })
    },

    makeResponsePrivate: function (data) {
      GameModel.where('instanceName').equals(data.instanceName)
        .find(function (err, game) {
          if (err) {
            winston.error('Could not find game', err)
          } else if (game) {
            var all = game[0].resourceResponses,
                a = 0,
                found = false,
                removeThis = null

            // This is to prevent the server from crashing when
            // responses stored in user data is out of sync
            // with responses stored in game data.
            try {
              while (!found) {
                if (all[a].npc == data.npcId && all[a].id == data.playerId) {
                  all[a].madePublic = false
                  found = true
                  removeThis = all[a]
                }
                a++
              }
            } catch (e) {
              winston.error('rpc.game.npc.makeResponsePrivate'.yellow, 'Unable to find player’s answer in the game data.', e)
              res(false)
            }

            game[0].save(function (err, good) {
              if (err) {

              } else {
                ss.publish.channel(req.session.game.instanceName, 'ss-removeAnswer', removeThis)
                res(true)
              }
            })
          }
      })
    }

  }
}