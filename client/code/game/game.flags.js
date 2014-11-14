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

  function clearAll () {
    _FLAGS = {}
  }

  // Expose 'public' methods
  return {

    // Checks to see if a game state flag is set
    check: function (flag) {
      // Returns true if a given flag is found, and false if not
      return (_FLAGS[flag]) ? true : false
    },

    // Sets a current game state flag
    set: function (flag) {
      // Returns true if able to be set
      if (!this.check(flag)) {
        _FLAGS[flag] = true
        return true
      } else {
        // Returns false if flag was not set (e.g. it was already set)
        return false
      }
    },

    // Remove one or all game state flags
    unset: function (flag) {
      if (flag) {
        delete _FLAGS[flag]
      } else {
        // If no flag is given, clear all flags
        clearAll()
      }
    },

    get: function () {
      var list = []
      for (var i in _FLAGS) {
        list.push(i)
      }
      return list
    }

  }

}())
