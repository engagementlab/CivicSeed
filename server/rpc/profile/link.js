'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    rpc.profile.link

    - Handles customizing user profile links.

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var rootDir   = process.cwd() || '.',
    config    = require(rootDir + '/app/config'),
    winston   = require('winston')

exports.actions = function (req, res, ss) {

  req.use('session')
  req.use('account.authenticated')

  var UserModel = ss.service.db.model('User')

  return {

    // This is different from the generic update-user functionality
    // because it must find out if the desiredURL is unique.
    // However, once that's known, the update process can use
    // the generic functionality (a TODO item.)
    save: function (playerId, desiredURL) {
      UserModel.findById(playerId, function (err, user) {
        if (err) {
          console.log(err)
          res(false)
        } else if (user) {
          user.profileLink = desiredURL
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
