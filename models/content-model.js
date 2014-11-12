'use strict';

module.exports = function (db, Schema) {

  var ContentSchema = new Schema({
    name: String,
    password: String,
    email: String,
    type: String
  })

  var ContentModel = db.model('Content', ContentSchema, 'content')

  return ContentModel
}
