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
    instanceName: String,
    resourceResponses: [{
      resourceId: Number,
      playerId: String,
      name: String,
      answer: String,
      madePublic: Boolean
    }]
  }

}
