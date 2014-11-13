'use strict';

module.exports = {

  name: 'Game',
  collection: 'game',
  schema: {
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
  }

}
