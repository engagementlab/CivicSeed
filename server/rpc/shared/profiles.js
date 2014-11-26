'use strict';

var rootDir = process.cwd() || '.',
    config  = require(rootDir + '/app/config'),
    aws     = require('aws-sdk')

exports.actions = function (req, res, ss) {

  req.use('session')

  var UserModel = ss.service.db.model('User'),
      GameModel = ss.service.db.model('Game')

  return {

    getProfileInformation: function (playerId) {
      // playerId could be what's in either profileLink (just the profile Id random char string)
      // or a custom one that's set by the user.

      UserModel.findOne({ profileLink: playerId }, function (err, user) {
        if (err) {
          console.log(err)
          res({ firstName: false })
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
            email: user.email,
            profile: user.profile
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
    },

    signS3Request: function (playerId, file) {
      console.log(file)

      var NODE_ENV     = config.get('NODE_ENV'),
          S3_BUCKET    = config.get('MUGSHOTS_S3_BUCKET'),
          S3_PATH_NAME = '/mugshots/'

      if (config.get('NODE_ENV') !== 'production') {
        S3_PATH_NAME += NODE_ENV + '/'
      }

      aws.config.update({
        accessKeyId:     config.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY')
      })

      var s3 = new aws.S3()
      var s3_params = {
        Bucket:      S3_BUCKET,
        Key:         req.query.s3_object_name,
        Expires:     60,
        ContentType: req.query.s3_object_type,
        ACL:         'public-read'
      }

      s3.getSignedUrl('putObject', s3_params, function (err, data) {
        if (err){
          console.log(err)
        } else{
          var return_data = {
            signed_request: data,
            url: 'https://.s3.amazonaws.com/' + S3_BUCKET + S3_PATH_NAME + req.query.s3_object_name
          }
          res.write(JSON.stringify(return_data))
          res.end()
        }
      })

      // If !production env, append env- to beginning of file (facilitates cleaning)
      res(return_data.url)
    }

  }

}
