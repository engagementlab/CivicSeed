'use strict';

var rootDir = process.cwd(),
    winston = require('winston'),
    service = require(rootDir + '/app/service')

module.exports = {

  dropCollection: function (collection, callback) {
    var dbCollections = service.db.collections

    dbCollections[collection].drop(function (err) {

      if (err) {
        winston.warn('  Could not drop database collection: %s  '.yellow.inverse, err)
      } else {
        winston.info('CS: '.blue + 'Database collection dropped: '.magenta + collection.yellow.underline)
      }

      callback()
    })
  },

  saveDocuments: function (model, documents, count, callback) {
    var collectionName = model.collection.collection.collectionName

    winston.info('CS: '.blue + 'Saving documents for collection: '.magenta + collectionName.yellow.underline + ' ...'.magenta)

    if (typeof count === 'function') {
      callback = count
    }

    model.create(documents, function (err) {
      if (err) {
        winston.error('Could not create documents: %s  '.yellow.inverse, err)
      } else {
        // // do some finding and logging here to validate data was pushed???
        // userModel.find(function (err, users) {
        //  // handleError('Could not find document: %s', err);
        //  // if(err) { return handleError(err); }

        //  console.log(users);
        //  consoleOutput += users;

        //  // res.render('admin/startup.hbs', {
        //  //  title: 'STARTUP',
        //  //  consoleOutput: consoleOutput
        //  // });
        // });

        if (typeof count === 'number') {
          winston.info('CS: '.blue + String(count).magenta + ' ' + collectionName.yellow.underline + ' document(s) created and saved to database.'.magenta)
        } else if (typeof count === 'undefined') {
          winston.info('CS: '.blue + collectionName.yellow.underline + ' document(s) created and saved to database.'.magenta)
        }
      }
      if (typeof callback === 'function') {
        callback()
      }
    })
  },

  resetDefaultData: function (model, callback) {
    var collectionName = model.collection.collection.collectionName

    winston.info('CS: '.blue + 'Resetting default data for collection: '.magenta + collectionName.yellow.underline + ' ...'.magenta)

    if (collectionName === 'users') {
      model.remove({'game.instanceName': 'demo'}, function (err) {
        if (err) {
          callback(err)
        } else {
          model.remove({'game.instanceName': 'test'}, function (err) {
            if (err) {
              callback(err)
            } else {
              model.remove({'game.instanceName': 'boss'}, function (err) {
                if (err) {
                  callback(err)
                } else {
                  callback()
                }
              })
            }
          })
        }
      })
    } else if (collectionName === 'game' || collectionName === 'colors' || collectionName === 'chat') {
      model.remove({instanceName: 'demo'}, function (err) {
        if (err) {
          callback(err)
        } else {
          model.remove({instanceName: 'test'}, function (err) {
            if (err) {
              callback(err)
            } else {
              model.remove({instanceName: 'boss'}, function (err) {
                if (err) {
                  callback(err)
                } else {
                  callback()
                }
              })
            }
          })
        }
      })
    }
  },

  saveNpcTilestate: function (model, npcData, callback) {
    var tileModel = service.useModel('tile', 'ss'),
        i = 0

    function saveTile (index) {
      var npc = npcData[index]

      tileModel
        .where('mapIndex').equals(npc.index)
        .find(function (err, tiles) {
          if (err) {
            callback(err)
          }

          var tile = tiles[0]
          tile.tileState = npc.index
          tile.save(function (err, suc) {
            index++
            if (index < npcData.length) {
              saveTile(index)
            } else {
              callback()
            }
          })
        })
    }

    saveTile(i)
  }

}
