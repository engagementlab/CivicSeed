module.exports = function (mongoose, db, Schema, ObjectId) {

  var ColorSchema = new Schema({
    instanceName: String,
    x: Number,
    y: Number,
    mapIndex: Number
  })

  //the third param specifies an exact collection to look for in the DB
  var ColorModel = db.model('Color', ColorSchema, 'colors')

  return ColorModel

}
