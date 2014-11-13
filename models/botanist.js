'use strict';

module.exports = {

  name: 'Botanist',
  collection: 'botanist',
  schema: {
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
  }

}
