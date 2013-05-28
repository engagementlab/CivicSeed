//events recevied by RPC
$(function() {
	var _w = $(window),
		$activePlayers = $('.activePlayers span'),
		$progressHudCount = $('.progressButton .hudCount');

	/******* RPC EVENTS *********/

	//new player joining to keep track of
	ss.event.on('ss-addPlayer', function(data, chan) {
		// console.log(data, chan);
		$game.numPlayers = data.num;
		$game.$others.add(data.info);
		$activePlayers.text(data.num);
		if(data.info.id !== $game.$player.id) {
			$game.temporaryStatus(data.info.name + ' has joined!');
		}
	});

	//player removing
	ss.event.on('ss-removePlayer', function(data, chan) {
		$game.numPlayers = data.num;
		if(data.id != $game.$player.id) {
			$game.$others.remove(data.id);
		}
		$activePlayers.text(data.num);
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
		if(data.id === $game.$player.id) {
			$game.$chat.message(data.message);
		}
		else {
			$game.$others.message(data.message, data.id);
		}
	});

	ss.event.on('ss-statusUpdate', function(data, chan) {
		$game.temporaryStatus(data);
	});

	ss.event.on('ss-progressChange', function(data, chan) {
		$game.seedsDropped = data.dropped;
		$game.tilesColored = data.colored;
		$game.updatePercent();
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
		if($game.$player.id === data) {
			$game.temporaryStatus('a peer liked your answer, +1 seed');
			$game.$player.updateSeeds('riddle', 1);
		}
	});
});