'use strict';

var rootDir   = process.cwd(),
    fs        = require('fs'),
    winston   = require('winston')

var dbActions = require(rootDir + '/server/utils/database-actions')

exports.actions = function (req, res, ss) {

  req.use('session')
  req.use('account.authenticated')

  return {

    export: function (name) {
      var collection = ss.service.db.model(name)

      collection
        .find()
        .select('-__v -_id')
        .exec(function (err, data) {
          if (err) {
            res(err)
          } else {
            winston.info('CS: '.blue + 'Exporting '.magenta + name.yellow.underline + ' to client ...'.magenta)
            res(data)
          }
        })
    },

    nuke: function (collection) {
      winston.warn('CS: '.blue + 'Dropping '.red + collection.yellow.underline + ' !!!'.red)
      dbActions.dropCollection(collection, function () {
        res('Database collection ' + collection + ' completely deleted.')
      })
    }

  }

}
