'use strict';

var $events = $game.$events = module.exports = {

  init: function () {

    /******* RPC EVENTS *********/

    // new player joining to keep track of
    ss.event.on('ss-addPlayer', function (data, chan) {
      $game.$others.add(data.info)
      if (data.info._id !== $game.$player.id) {
        $game.broadcast(data.info.firstName + ' has joined!')
      }
    })

    //player removing
    ss.event.on('ss-removePlayer', function (data, chan) {
      if (data.id !== $game.$player.id) {
        $game.log(data.name + ' has left the game.')
        $game.$others.remove(data.id)
      }
    })

    //player moves
    ss.event.on('ss-playerMoved', function (data, chan) {
      if (data.id !== $game.$player.id) {
        $game.$others.sendMoveInfo(data.id, data.moves)
      }
    })

    //new tile color bomb
    ss.event.on('ss-seedDropped', function (data, chan) {
      $game.$map.newBomb(data.bombed, data.id)
      if (data.id !== $game.$player.id) {
        $game.$others.updateTilesColored(data.id, data.tilesColored)
      }
    })

    // New message from chat
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

   // Remove an answer (this means they made it private and it was previously public)
    ss.event.on('ss-removeAnswer', function (data, chan) {
      if (data) {
        $game.$resources.get(data.resourceId).removePlayerResponse(data)
        $game.$player.displayNpcComments()
      }
    })

    //level change for a player
    ss.event.on('ss-levelChange', function (data, chan) {
      $game.broadcast(data.name + ' has reached level ' + (data.level + 1) +'!')
      $game.$others.levelChange(data.id, data.level);
    });

    // Event fired when someone pledged a seed to another player's answer
    ss.event.on('ss-seedPledged', function (data, chan) {
      if ($game.$player.id === data.id) {
        $game.broadcast(data.pledger  + ' liked a response of yours. Here, have some seeds!')
        $game.$player.addSeeds('regular', 3)
        $game.$player.updateResource(data)
      }
    })

    //the game meter has hit the end, boss mode is unlocked
    ss.event.on('ss-bossModeUnlocked', function () {
      $game.flags.set('boss-mode-unlocked')
      $game.bossModeUnlocked = true;
      if ($game.$player.currentLevel > 3) {
        $game.flags.set('boss-mode-ready')
        $game.toBossLevel();
      }
    });

    //another player has beamed
    ss.event.on('ss-beam', function (info) {
      if (info.id !== $game.$player.id) {
        $game.$others.beam(info.id, info)
      }
    })

    ss.event.on('ss-collaborativeChallenge', function (info) {
      for(var i = 0; i < info.players.length; i++) {
        if (info.players[i] === $game.$player.id) {
          //TODO add seeds
          $game.statusUpdate({message: 'Nice work you did a collaborative challenge! Have ' + info.seeds + ' paintbrush seeds.',input:'status', screen:true, log:true});
          $game.$player.addSeeds('draw', info.seeds);
          break;
        }
      }
    });

    ss.event.on('ss-skinSuitChange', function (info) {
      if (info.id !== $game.$player.id) {
        $game.$others.skinSuitChange(info.id, info)
      }
    })
  }

};