'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    rpc.profile.pic

    - Handles upload, processing, and retrieval of user profile images.

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

var rootDir   = process.cwd(),
    images    = require(rootDir + '/server/utils/images.js'),
    winston   = require('winston')

exports.actions = function (req, res, ss) {

  req.use('session')
  req.use('account.authenticated')

  var userModel = ss.service.db.model('User')

  return {

  }

}
