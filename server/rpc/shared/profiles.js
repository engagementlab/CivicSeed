'use strict';

var rootDir   = process.cwd(),
    service   = require(rootDir + '/app/service'),
    UserModel = service.useModel('user', 'rpc.shared.profiles'),
    GameModel = service.useModel('game', 'rpc.shared.profiles')

exports.actions = function (req, res, ss) {

  req.use('session')

  return {

    getProfileInformation: function (playerId) {
      UserModel.findOne({ profileLink: playerId }, function (err, user) {
        if (err) {
          console.log(err);
          res({firstName: false});
        } else if (user) {

          var profileInfo = {
            firstName: user.firstName,
            lastName: user.lastName,
            school: user.school,
            resume: user.game.resume,
            resumeFeedback: user.game.resumeFeedback,
            gameStarted: user.gameStarted,
            profilePublic: user.profilePublic,
            profileUnlocked: user.profileUnlocked,
            profileSetup: user.profileSetup,
            colorMap: user.game.colorMap,
            email: user.email
          }

          if (!profileInfo.colorMap) {
            profileInfo.colorMap = false
          }

          GameModel
            .where('instanceName').equals(user.game.instanceName)
            .findOne(function (err, game) {
              if (err) {
                res(false)
              } else if (game) {
                profileInfo.active = game.active
                res(profileInfo)
              }
            })
        } else {
          res({ firstName: false })
        }
      })
    },

    getAllProfiles: function () {
      UserModel.find({ role: 'actor', profilePublic: true }, function (err, users) {
        if (err) {
          console.log(err)
          res(false)
        } else if (users) {
          var all = []
          users.forEach(function (u, i) {
            var profile = {
              firstName: u.firstName,
              lastName: u.lastName,
              profileLink: u.profileLink
            }
            all.push(profile)
          })
          res(all)
        }
      })
    },

    updateResume: function (info) {
      UserModel.findById(info.id, function (err, user) {
        if (err) {
          console.log(err)
          res(false)
        } else if (user) {
          user.game.resume = info.resume
          user.save(function (err, okay) {
            if (err) {
              console.log('error saving')
              res(false)
            } else {
              res(true)
            }
          })
        }
      })
    },

    setPublic: function (info) {
      UserModel.findById(info.id, function (err, user) {
        if (err) {
          console.log(err)
          res(false)
        } else if (user) {
          user.profilePublic = info.changeTo
          user.save(function (err, okay) {
            if (err) {
              console.log('error saving')
              res(false)
            } else {
              res(true)
            }
          })
        }
      })
    }

  }

}
