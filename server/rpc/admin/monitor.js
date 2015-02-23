'use strict'

// Define actions which can be called from the client using ss.rpc('demo.ACTIONNAME', param1, param2...)
exports.actions = function (req, res, ss) {
  req.use('session')

  var gameModel = ss.service.db.model('Game')
  var npcModel = ss.service.db.model('Npc')
  var chatModel = ss.service.db.model('Chat')
  var userModel = ss.service.db.model('User')

  var monitorHelpers = {

    getInstances: function (instances, callback) {
      var numInstances = instances.length
      var cur = 0
      var allInstances = []
      var getNext = function() {
        monitorHelpers.getInstanceData(instances[cur], function (result) {
          allInstances.push(result)
          cur++
          if (cur < numInstances) {
            getNext()
          } else {
            callback(allInstances)
          }
        })
      }

      getNext()
    },

    getInstanceData: function (instance) {
      gameModel
        .where('instanceName').equals(instance)
        .find(function (err, result) {
          if (err) {
            // Placeholder for error handling
          } else {
            return result[0]
          }
        })
    }
  }

  return {

    init: function (id) {
      npcModel
        .where('isHolding').equals(true)
        .select('level resource')
        .find(function (err, npcs) {
          res(err, npcs)
        })
    },

    getInstanceNames: function (id) {
      userModel
        .findById(id, function (err, data) {
          if (err) {
            res('error with db search', false)
          } else if (data) {
            res(false, data.admin.instances)
          } else {
            res('you must logout / login to do more admin stuff')
          }
        })
    },

    getPlayers: function (instance) {
      userModel
        .where('game.instanceName').equals(instance)
        .where('role').equals('actor')
        .select('firstName lastName id profileUnlocked game.resourcesDiscovered game.resources game.playingTime activeSessionID')
        .find(function (err, data) {
          if (err) {
            res(err, false)
          } else {
            res(false, data)
          }
        })
    },

    getRecentChat: function (instance) {
      chatModel
        .where('instanceName').equals(instance)
        .limit(100)
        .sort('-when')
        .find(function (err, chat) {
          res(err, chat)
        })
    },

    getInstanceAnswers: function (instance) {
      gameModel
        .where('instanceName').equals(instance)
        .select('resourceResponses')
        .find(function (err, answers) {
          res(err, answers[0])
        })
    },

    deletePlayer: function (id) {
      userModel
        .findById(id, function (err, user) {
          if (err) {
            res(true)
          } else if (user) {
            user.remove()
            res(false)
          }
        })
    },

    toggleGame: function (instance, bool) {
      gameModel
        .where('instanceName').equals(instance)
        .findOne(function (err, game) {
          if (err) {
            res(err)
          } else if (game) {
            game.active = bool
            game.save(function (err, ok) {
              if (err) {
                res(err)
              } else {
                res()
              }
            })
          }
        })
    }
  }
}
