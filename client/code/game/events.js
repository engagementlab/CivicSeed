var $activePlayers,
	$progressHudCount;

var $events = module.exports = {

	registerVariables: function() {
		$activePlayers = $('.activePlayers span');
		$progressHudCount = $('.progressButton .hudCount');
	},

	init: function() {

		/******* RPC EVENTS *********/

		// new player joining to keep track of
		ss.event.on('ss-addPlayer', function(data, chan) {
			$game.numPlayers = data.num;
			$game.$others.add(data.info);
			$activePlayers.text(data.num);
			if(data.info._id !== $game.$player.id) {
				$game.statusUpdate({
					message: data.info.firstName + ' has joined!',
					input:'status',
					screen: true,
					log: true
				});
			}
		});

		//player removing
		ss.event.on('ss-removePlayer', function(data, chan) {
			$game.numPlayers = data.num;
			if(data.id != $game.$player.id) {
				$game.$others.remove(data.id);
			}
			$('.activePlayers span').text(data.num);
		});

		//player moves
		ss.event.on('ss-playerMoved', function(data, chan) {
			if(data.id != $game.$player.id) {
				$game.$others.sendMoveInfo(data.moves, data.id);
			}
		});

		//new tile color bomb
		ss.event.on('ss-seedDropped', function(data, chan) {
			$game.$map.newBomb(data.bombed, data.id);
			if($game.$player.id !== data.id) {
				$game.$others.updateTilesColored(data.id, data.tilesColored);
			}
		});

		//new message from chat
		ss.event.on('ss-newMessage', function(data, chan) {
			//put in log for everyone
			data.input = 'chat';
			$game.$log.addMessage(data);
		});

		ss.event.on('ss-statusUpdate', function(data, chan) {
			// $game.temporaryStatus(data);
			console.log('TODO lol');
		});

		ss.event.on('ss-progressChange', function(data, chan) {
			$game.updatePercent(data.dropped);
		});

		ss.event.on('ss-leaderChange', function(data, chan) {
			$game.updateLeaderboard(data);
		});

		ss.event.on('ss-addAnswer', function(data, chan) {
			$game.$resources.addAnswer(data);
		});

		ss.event.on('ss-removeAnswer', function(data, chan) {
			$game.$resources.removeAnswer(data);
		});

		//level change for a player
		ss.event.on('ss-levelChange', function(data, chan) {
			$game.$others.levelChange(data.id, data.level);
		});

		//some one pledged a seed to someone's answer
		ss.event.on('ss-seedPledged', function(data, chan) {
			if($game.$player.id === data.id) {
				$game.statusUpdate({message: data.pledger  + ' liked a response of yours. Here, have some seeds.',input:'status',screen: true,log:true});
				$game.$player.updateSeeds('regular', 3);
				$game.$player.updateResource(data);
			}
		});

		//the game meter has hit the end, boss mode is unlocked
		ss.event.on('ss-bossModeUnlocked', function() {
			$game.bossModeUnlocked = true;
			if($game.$player.currentLevel > 3) {
				$game.toBossLevel();
			}
		});

		//another player has beamed
		ss.event.on('ss-beam', function(info) {
			//TODO: set others position to new info
			if(info.id !== $game.$player.id) {
				$game.$others.beam(info);
			}
		});

	}

};