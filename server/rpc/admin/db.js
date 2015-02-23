'use strict'

var rootDir = process.cwd()
var winston = require('winston')

var dbActions = require(rootDir + '/server/utils/database-actions')

exports.actions = function (req, res, ss) {
  req.use('session')
  req.use('account.authenticated')

  return {

    export: function (name) {
      // Ensure that the passed name has an uppercase first letter
      var model = name.charAt(0).toUpperCase() + name.slice(1)

      // Check to see if the model exists
      try {
        var collection = ss.service.db.model(model)
      } catch (e) {
        res({ error: e })
        return false
      }

      // Return database collection with meta fields stripped
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
