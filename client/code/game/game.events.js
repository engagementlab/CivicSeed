'use strict'
/* global ss, $game */

/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

    events.js

    - Handles events from SocketStream RPC

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

module.exports = {

  init: function () {
    // When a new player has joined
    ss.event.on('ss-addPlayer', function (data, chan) {
      $game.$others.add(data.info)
      if (data.info._id !== $game.$player.id) {
        $game.broadcast(data.info.firstName + ' has joined!')
      }
    })

    // When a player has left the game
    ss.event.on('ss-removePlayer', function (data, chan) {
      if (data.id !== $game.$player.id) {
        $game.log(data.name + ' has left the game.')
        $game.$others.remove(data.id)
      }
    })

    // When a player oves
    ss.event.on('ss-playerMoved', function (data, chan) {
      if (data.id !== $game.$player.id) {
        $game.$others.sendMoveInfo(data.id, data.moves)
      }
    })

    // When a seed "bomb" is dropped
    ss.event.on('ss-seedDropped', function (data, chan) {
      $game.$map.newBomb(data.bombed, data.id)
      if (data.id !== $game.$player.id) {
        $game.$others.updateTilesColored(data.id, data.tilesColored)
      }
    })

    // When a new chat message is received
    ss.event.on('ss-newMessage', function (data, chan) {
      data.input = 'chat'

      // Route to $chat or $others to figure out how to
      // render chat bubble
      if (data.id === $game.$player.id) {
        $game.$chat.message(data)
      } else {
        $game.$others.message(data.id, data)
      }

      // Add the message to the log for everyone
      $game.$log.addMessage(data)
    })

    ss.event.on('ss-statusUpdate', function (data, chan) {
      // $game.temporaryStatus(data);
      // console.log('TODO lol');
    })

    ss.event.on('ss-progressChange', function (data, chan) {
      $game.updatePercent(data.dropped)
    })

    ss.event.on('ss-leaderChange', function (data, chan) {
      $game.updateLeaderboard(data)
    })

    // Add an answer to the player answers for the specific resource
    ss.event.on('ss-addAnswer', function (data, chan) {
      if (data) {
        $game.$resources.get(data.resourceId).addPlayerResponse(data)

        // Update the npc bubbles on screen
        $game.$player.displayNpcComments()
        $game.minimap.radar.update()
      }
    })

    // When a player has turned a public answer into a private one
    ss.event.on('ss-removeAnswer', function (data, chan) {
      if (data) {
        $game.$resources.get(data.resourceId).removePlayerResponse(data)
        $game.$player.displayNpcComments()
      }
    })

    // When a player has leveled up
    ss.event.on('ss-levelChange', function (data, chan) {
      $game.broadcast(data.name + ' has reached level ' + (data.level + 1) + '!')
      $game.$others.levelChange(data.id, data.level)
    })

    // Event fired when someone pledged a seed to another player's answer
    ss.event.on('ss-seedPledged', function (data, chan) {
      if ($game.$player.id === data.id) {
        $game.broadcast(data.pledger + ' liked a response of yours. Here, have some seeds!')
        $game.$player.addSeeds('regular', 3)
        $game.$player.updateResource(data)
      }
    })

    // When the game meter has hit the end, and boss mode is unlocked
    ss.event.on('ss-bossModeUnlocked', function () {
      $game.flags.set('boss-mode-unlocked')
      $game.bossModeUnlocked = true
      if ($game.$player.currentLevel > 3) {
        $game.flags.set('boss-mode-ready')
        $game.toBossLevel()
      }
    })

    // When another player has beamed to another location
    ss.event.on('ss-beam', function (info) {
      if (info.id !== $game.$player.id) {
        $game.$others.beam(info.id, info)
      }
    })

    // When a collaborative challenge has initiated
    // TODO: Not implemented.
    ss.event.on('ss-collaborativeChallenge', function (info) {
      for (var i = 0; i < info.players.length; i++) {
        if (info.players[i] === $game.$player.id) {
          // TODO add seeds
          $game.broadcast('Nice work you did a collaborative challenge! Have ' + info.seeds + ' paintbrush seeds.')
          $game.$player.addSeeds('draw', info.seeds)
          break
        }
      }
    })

    // When a player has changed his or her skinsuit
    ss.event.on('ss-skinSuitChange', function (info) {
      if (info.id !== $game.$player.id) {
        $game.$others.skinSuitChange(info.id, info)
      }
    })
  }

}
