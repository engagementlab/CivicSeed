'use strict';

var rootDir   = process.cwd(),
    fs        = require('fs'),
    path      = require('path'),
    winston   = require('winston'),
    filename  = path.relative(rootDir, module.filename)

var dbActions = require(rootDir + '/server/utils/database-actions')

exports.actions = function (req, res, ss) {

  req.use('session')
  req.use('account.authenticated')

  return {

    export: function (name) {
      var collection = ss.service.useModel(name, filename)
      collection.find(function (err, data) {
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
