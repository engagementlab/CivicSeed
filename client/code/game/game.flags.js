'use strict';

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    flags.js

    - Get / set / maintain list of game state flags.
    - Basically, setting flags on this module is a better way of recording
      in-memory the temporary state of the game that other modules can check
      on. This is better than having a bunch of global boolean variables
      cluttering up individual modules.
    - For a running list (incomplete) of game state flags, see the docs.

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

$game.flags = (function () {

  // Private holder of flags
  var _FLAGS = {}

  // Expose 'public' methods
  return {

    // Checks to see if a game state flag is set
    check: function (flag) {
      // Returns true if a given flag is found, and false if not
      return (flag in _FLAGS)
    },

    // Sets a current game state flag
    set: function (flag) {
      if (flag) {
        _FLAGS[flag] = true
      }
    },

    // Remove one or all game state flags
    unset: function (flag) {
      // Always returns true, even if the flag did not exist
      return delete _FLAGS[flag]
    },

    // Clear all game state flags
    unsetAll: function () {
      _FLAGS = {}
    },

    // Returns an array of all currently set game flags
    get: function () {
      var list = []
      for (var i in _FLAGS) {
        list.push(i)
      }
      return list
    }

  }

}())
