'use strict';

module.exports = function (db, Schema) {

  var gameSchema = new Schema({
    players: Number,
    seedsDropped: Number,
    seedsDroppedGoal: Number,
    active: Boolean,
    bossModeUnlocked: Boolean,
    leaderboard: [{
      name: String,
      count: Number
    }],
    resourceCount: [Number],
    instanceName: String,
    resourceResponses: [{
      npc: Number,
      id: String,
      name: String,
      answer: String,
      madePublic: Boolean
    }]
  })

  var GameModel = db.model('Game', gameSchema, 'game')

  return GameModel
}
