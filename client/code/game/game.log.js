'use strict'
/* global $, $game */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    log.js

    - Manages the game log

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

// Log counter
var Counter = function () {
  this.unread = 0
  this.numItems = 0
  this.maxItems = 50
}

Counter.prototype.increment = function () {
  this.unread++
  this.numItems++
}

Counter.prototype.isFull = function () {
  return this.numItems > this.maxItems
}

module.exports = (function () {
  var logCounter = new Counter()

  return {

    init: function (callback) {
      $game.log('Welcome to Civic Seed')
      this.clearUnread()
      callback()
    },

    resetInit: function () {
      logCounter = new Counter()
    },

    // Add message to game log
    addMessage: function (data) {
      var el = document.getElementById('game-log')
      var date = Date()
      var displayDate = date.substring(0, 10) + date.substring(15, 24)
      var html

      // Update unread messages icon number
      if ($(el).is(':visible')) {
        var hudText = logCounter.unread

        logCounter.increment()
        if (logCounter.unread > 10) {
          hudText = '10+'
          $game.alert('There are new messages in your game log')
        }

        $game.setBadgeCount('.hud-log', hudText)
      }

      // Create HTML snippets
      if (data.input === 'chat') {
        html = '<p class="log-entry chat"><span class="date">' + displayDate + '</span>'
        html += '<span class="player-name" style="color: ' + data.color + '">' + data.name + ': </span>' + data.message + '</p>'
      } else {
        html = '<p class="log-entry status"><span class="date">' + displayDate + '</span>'
        html += data.message + '</p>'
      }

      // Prune messages if we hit the limit
      if (logCounter.isFull()) {
        $('#game-log p').last().remove()
        $('#game-log-overlay p').first().remove()
      }

      // Add to game log (below the gameboard)
      $(el).prepend(html)

      // Add to game log overlay and scroll it
      var overlay = document.getElementById('game-log-overlay')
      overlay.innerHTML += html
      overlay.scrollTop = overlay.scrollHeight
    },

    clearUnread: function () {
      logCounter.unread = 0
      $game.setBadgeCount('.hud-log', 0)
    }
  }
}())
