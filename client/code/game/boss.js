var _currentSlide,
	_resumes,
	$bossArea,
	$bossAreaContent,
	$buttons;

$game.$boss = {
	isShowing: false,
	//place player on map
	init: function(callback) {
		_setDomSelectors();
		$('.regularGameHud').fadeOut('fast', function() {
			$('.bossHud').show();
		});
		$bossArea.show();
		$game.$boss.isShowing = true;
		_currentSlide = 0;
		_addContent();
		callback();
	},

	//advance to the resumes
	nextSlide: function() {
		_currentSlide++;
		if(_currentSlide === 2) {
			_saveFeedback();
		}
		_addContent();
	}
};

/****** PRIVATE FUNCTIONS ******/

function _setDomSelectors() {
	$bossArea = $('.bossArea');
	$bossAreaContent = $('.bossArea .content');
	$buttons = $('.bossArea .buttons');
}
function _addContent() {
	$bossAreaContent.empty();
	if(_currentSlide === 0) {
		//show intro videp
		var html = '<div class="videoFrame"><iframe src="http://player.vimeo.com/video/64315985" width="620" height="350" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe></div>';
		$bossAreaContent.append(html);
	} else if(_currentSlide === 1) {
		//show resumes and responses
		ss.rpc('game.player.getRandomResumes',{instanceName: $game.$player.instanceName}, function(result) {
			var html = '';
			if(result.length > 0) {
				_resumes = _chooseResumes(result);
				html += '<p class="dialog"><span>Botanist:</span> In order to defeat the robot you must have some special seeds.  To get them, provide feedback on a few of your peers\' resume responses.</p>';
				for(var i = 0; i < _resumes.length; i++) {
					var levelQuestion = $game.$botanist.getLevelQuestion(i);
					html += '<p class="resumeQuestion">Q: ' + levelQuestion + '</p>';
					html += '<p class="resumeAnswer"><span>A random peer said: </span> ' + _resumes[i].answer + '</p>';
					html += '<p>Do you have any feedback for his or her response? Enter it below.</p><textarea></textarea>';
				}
				$bossAreaContent.append(html);
			} else {
				//TODO: what do we do here?
				console.log('error');
			}
		});
	} else {
		//show instructions and begin
	}
}

function _chooseResumes(people) {
	var numToGet = 4,
		cur = 0,
		numPeople = people.length,
		responses = [];

	var pickPerson = function(question) {
		var foundPerson = false,
			person;
		while(!foundPerson) {
			var ran1 = Math.floor(Math.random() * numPeople);
			person = people[ran1];
			if(person._id !== $game.$player.id) {
				foundPerson = true;
				if(!person.game.resume[question]) {
					foundPerson = false;
				}
			}
		}
		return person;
	};

	while(cur < numToGet) {
		var person = pickPerson(cur),
			info = {
				id: person._id,
				answer: person.game.resume[cur]
			};
		responses.push(info);
		cur++;
	}
	return responses;
}

function _saveFeedback() {
	var info = [];
	$('.bossArea textarea').each(function(i) {
		var val = this.value;
		info.push({
			comment: val,
			id: _resumes[i].id
		});
	});
	ss.rpc('game.player.resumeFeedback', info);
}