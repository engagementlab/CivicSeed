'use strict';

module.exports = function (db, Schema) {

  var LevelSchema = new Schema({
    // Nothing here
  })

  var LevelModel = db.model('Level', LevelSchema, 'levels')

  return LevelModel
}
