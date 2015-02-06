'use strict';

module.exports = {

  name: 'User',
  collection: 'users',
  schema: {
    activeSessionID: String,
    gameChannel: String, // not sure what type this should be...
    firstName: String,
    lastName: String,
    school: String,
    password: String,
    email: String,
    role: String,
    profilePublic: Boolean,
    profileLink: String,
    profileSetup: Boolean,
    profileUnlocked: Boolean,
    gameStarted: Boolean,
    avatar: String,
    game: {
      instanceName: String,
      currentLevel: Number,
      position: {
        x: Number,
        y: Number
      },
      resources: [{
        id: Number,
        questionType: String,
        attempts: Number,
        answers: [String],
        result: Boolean,
        tagline: String,
        seeded: [String],
        seedsRewarded: Number,
        rewarded: Boolean
      }],
      resourcesDiscovered: Number,
      inventory: [{
        name: String,
        tagline: String,
        id: Number
      }],
      seeds: {
        regular: Number,
        draw: Number,
        dropped: Number
      },
      botanistState: Number,
      firstTime: Boolean,
      colorMap: String,
      resume: [String],
      resumeFeedback: [{
        comment: String,
        resumeIndex: Number
      }],
      seenRobot: Boolean,
      playingTime: Number,
      isMuted: Boolean,
      tilesColored: Number,
      pledges: Number,
      collaborativeChallenge: Boolean,
      playerColor: Number,
      skinSuit: {
        head: String,
        torso: String,
        legs: String,
        unlocked: {
          head: [String],
          torso: [String],
          legs: [String]
        }
      }
    },
    profile: {
      tagline: String,
      mugshotURL: String,
      address1: String,
      address2: String,
      city: String,
      state: String,
      zip: String,
      phone: String,
      email: String,
      vision: String,
      background: String,
      education: [{
        school: String,
        major: String,
        year: String
      }],
      experience: [{
        role: String,
        organization: String,
        summary: String
      }],
      skills: [String]
    },
    admin: {
      instances: [String]
    }
  }

}
