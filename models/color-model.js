'use strict';

module.exports = function (db, Schema) {

  var ColorSchema = new Schema({
    instanceName: String,
    x: Number,
    y: Number,
    mapIndex: Number
  })

  var ColorModel = db.model('Color', ColorSchema, 'colors')

  return ColorModel
}
