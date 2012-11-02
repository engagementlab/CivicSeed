_soundtrack = null;
_effect = null;

$game.$audio = {
	
	init: function() {
		_soundtrack = document.createElement('audio'),
		_effect = document.createElement('audio'),

		_soundtrack.addEventListener('canplaythrough', function (e) {
			this.removeEventListener('canplaythrough', arguments.callee, false);
			console.log("soundtrack is ready to play.");
			_soundtrack.play();

		},false);
		_soundtrack.addEventListener('error', function (e) {
			console.log("error sound");
		}, false);
		_effect.addEventListener('canplaythrough', function (e) {
			this.removeEventListener('canplaythrough', arguments.callee, false);
			console.log("effect is ready to play.");                
		},false);
		_effect.addEventListener('error', function (e) {
			console.log("error effect");
		}, false);

		_soundtrack.preload = "auto";
		_soundtrack.autobuffer = true;
		_soundtrack.loop = true;
		_soundtrack.src = 'http://russellgoldenberg.com/civicseed_audio/temp.mp3';
		_soundtrack.volume = .3;
		_soundtrack.load();

		_effect.preload = "auto";
		_effect.autobuffer = true;
		_effect.src = '/audio/tile.mp3';
		_effect.volume = .7;
		_effect.load();

	},

	playSound: function(i) {

		_effect.play();
	}
};