'use strict';

module.exports = function (db, Schema) {

  var botanistSchema = new Schema({
    id: Number,
    x: Number,
    y: Number,
    name: String,
    spriteMap: [{
      x: Number,
      y: Number
    }],
    dialog: [
      {
        instructions: [String],
        instructions2: [String],
        riddle: {
          prompts: [String],
          response: String
        },
        hint: [String]
      }
    ],
    tangram: [
      {
        answer: [
          {
            id: String,
            x: Number,
            y: Number
          }
        ]
      }
    ]
  })

  var BotanistModel = db.model('Botanist', botanistSchema, 'botanist')

  return BotanistModel
}
