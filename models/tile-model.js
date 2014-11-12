'use strict';

module.exports = function (db, Schema) {

  var TileSchema = new Schema({
    x: Number,
    y: Number,
    tileState: Number,
    isMapEdge: Boolean,
    background: Number,
    background2: Number,
    background3: Number,
    foreground: Number,
    foreground2: Number,
    mapIndex: Number
  })

  var TileModel = db.model('Tile', TileSchema, 'tiles')

  return TileModel
}
