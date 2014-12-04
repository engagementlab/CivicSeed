'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    class.flagger.js

    - Get / set / maintain list of game state flags.
    - Basically, setting flags on this module is a better way of recording
      in-memory the temporary state of the game that other modules can check
      on. This is better than having a bunch of global boolean variables
      cluttering up individual modules.
    - Note that this is not currently intended to record long-term state of
      game data, nor is it intended to store arbitrary data types. That should
      be done in accordance with each individual object's (game, player, NPC,
      resource, etc) data model. The goal for the flag class is to record a
      temporary value for game state so that game elements can read from it
      easily, removing the need to store game state by hard-coding variables
      into game code.
    - For a running list (incomplete) of game state flags, see the docs.

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// Define Flagger class constructor function
var Flagger = function () {
  // Private holder of flags
  this.container = {}
}

// Checks to see if a game state flag is set
Flagger.prototype.check = function (flag) {
  // Returns true if a given flag is found, and false if not
  return (flag in this.container)
}

// Sets a current game state flag
Flagger.prototype.set = function (flag) {
  if (flag) {
    this.container[flag] = true
  }
}

// Remove one or all game state flags
Flagger.prototype.unset = function (flag) {
  delete this.container[flag]
}

// Clear all game state flags
Flagger.prototype.unsetAll = function () {
  this.container = {}
}

// Returns an array of all currently set game flags
Flagger.prototype.get = function () {
  var list = []
  for (var i in this.container) {
    list.push(i)
  }
  return list
}

module.exports = Flagger
