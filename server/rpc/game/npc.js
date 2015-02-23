'use strict'

var winston = require('winston')

exports.actions = function (req, res, ss) {
  req.use('session')

  var Npc = ss.service.db.model('Npc')
  var Game = ss.service.db.model('Game')

  return {

    getNpcById: function (npcId) {
      Npc.find({ id: npcId }, function (err, npc) {
        if (err) {
          winston.error('Could not find NPC: %s  '.red.inverse, err)
        } else {
          res(npc)
        }
      })
    },

    getNpcs: function () {
      Npc.find(function (err, npcs) {
        if (err) {
          winston.error('Could not find NPCs: %s  '.red.inverse, err)
        } else {
          res(npcs)
        }
      })
    },

    saveResponse: function (instance, data) {
      Game.where('instanceName').equals(instance)
        .find(function (err, game) {
        if (err) {
          winston.error('Could not find resource', err)
        } else if (game) {
          game[0].resourceResponses.push(data)
          game[0].save(function (err, worked) {
            if (err) {
              winston.error(err)
            }
          })
        }
      })
    },

    getResponses: function (instance) {
      Game.where('instanceName').equals(instance)
        .select('resourceResponses')
        .find(function (err, responses) {
          if (err) {
            winston.error('Could not find game', err)
          } else if (responses) {
            res(responses)
          }
        })
    },

    makeResponsePublic: function (data) {
      Game.where('instanceName').equals(data.instanceName)
        .find(function (err, game) {
          if (err) {
            winston.error('Could not find game', err)
          } else if (game) {
            var responses = game[0].resourceResponses
            var addThis = null

            for (var i = 0; i < responses.length; i++) {
              if (responses[i].resourceId === data.resourceId && responses[i].playerId === data.playerId) {
                responses[i].madePublic = true
                addThis = responses[i]
                break
              }
            }

            if (!addThis) {
              winston.error('rpc.game.npc.makeResponsePublic'.yellow, 'Unable to find player’s answer in the game data.')
              res(false)
            }

            game[0].save(function (err, good) {
              if (err) {
                winston.error('rpc.game.npc.makeResponsePublic'.yellow, 'Error adding answer to public responses')
                res(false)
              } else {
                ss.publish.channel(req.session.game.instanceName, 'ss-addAnswer', addThis)
                res(true)
              }
            })
          }
        })
    },

    makeResponsePrivate: function (data) {
      Game.where('instanceName').equals(data.instanceName)
        .find(function (err, game) {
          if (err) {
            winston.error('Could not find game', err)
          } else if (game) {
            var responses = game[0].resourceResponses
            var removeThis = null

            for (var i = 0; i < responses.length; i++) {
              if (responses[i].resourceId === data.resourceId && responses[i].playerId === data.playerId) {
                responses[i].madePublic = false
                removeThis = responses[i]
                break
              }
            }

            if (!removeThis) {
              winston.error('rpc.game.npc.makeResponsePrivate'.yellow, 'Unable to find player’s answer in the game data.')
              res(false)
            }

            game[0].save(function (err, good) {
              if (err) {
                winston.error('rpc.game.npc.makeResponsePrivate'.yellow, 'Error removing answer from public responses')
                res(false)
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
