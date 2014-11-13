'use strict';

module.exports = {

  name: 'Npc',
  collection: 'npcs',
  schema: {
    id: Number,
    index: Number,
    position: {
      x: Number,
      y: Number
    },
    name: String,
    level: Number,
    sprite: Number,
    isHolding: Boolean,
    dialog: {
      smalltalk: [String],
      prompts: [String]
    },
    dependsOn: Number,
    resource: {
      url: String,
      question: String,
      questionType: String,
      requiredLength: Number,
      possibleAnswers: [String],
      answer: String,
      feedbackWrong: String,
      feedbackRight: String,
      shape: String
    },
    skinSuit: String
  }

}
