var _currentSlide,
	_resumes,
	_charger = {},
	_grid,
	$BODY,
	$bossArea,
	$bossAreaContent,
	$buttons,
	$seedButton,
	$seedButtonCount,
	$clock,

	_numChargers = 4,
	_numDrawSeeds = 100,
	_numRegularSeeds = 100,
	_seedMode = 0,
	_rgbString,

	//clock stuff
	_start,
	_time,
	_elapsed,
	_target,
	_pause,
	_totalTime,
	_clockRate,
	_clockTimeout;

$game.$boss = {
	isShowing: false,
	//place player on map
	init: function(callback) {
		_setDomSelectors();
		_createGrid();
		$('.regularGameHud').fadeOut('fast');
		_setupHud();
		$bossArea.show();
		$game.$boss.isShowing = true;
		_rgbString = $game.$player.getColorString();
		//_currentSlide = 0;
		_currentSlide = 1;
		$game.$boss.nextSlide();
		_placeCharger();
		_addContent();
		callback();
	},

	//advance to the resumes
	nextSlide: function() {
		_currentSlide++;
		if(_currentSlide === 2) {
			_saveFeedback();
			$('.bossHud').show();
		} else if(_currentSlide > 2) {
			_numSeeds = 7;
			$bossArea.fadeOut('fast',function() {
				$game.$boss.isShowing = false;
				_beginGame();
			});
		}
		_addContent();
	},

	dropSeed: function(pos) {
		//update hud
		if(_seedMode === 1) {
			_numRegularSeeds--;
			$('.bossHud .regularSeedButton .hudCount').text(_numRegularSeeds);
			if(_numRegularSeeds <= 0) {
				//TODO: out of regular seeds display
				_seedMode = 0;
				$game.$player.seedMode = false;
				$game.$player.resetRenderColor();
			}
			_renderTiles(pos);
		} else if(_seedMode === 2) {
			_numDrawSeeds--;
			$('.bossHud .drawSeedButton .hudCount').text(_numDrawSeeds);
			if(_numDrawSeeds <= 0) {
				//TODO: out of regular seeds display
				_seedMode = 0;
				$game.$player.seedMode = false;
				$game.$player.resetRenderColor();
			}
		}

		//update score
	},

	endMove: function(x,y) {
		//check for charger first
		//charger = means it has a revealed charger
		if(_grid[x][y].charger === 1) {
			_placeCharger();
			$game.$renderer.clearBossLevel();
		} else if(_grid[x][y].item > -1) {
			//pick up good item
			_activateItem({x: x, y:y, item: _grid[x][y].item});
		}
	}
};

/****** PRIVATE FUNCTIONS ******/

function _setDomSelectors() {
	$BODY = $('body');
	$bossArea = $('.bossArea');
	$bossAreaContent = $('.bossArea .content');
	$buttons = $('.bossArea .buttons');
	$seedButton = $('.bossHud .seedButton');
	$seedButtonCount = $('.bossHud .seedButton .hudCount');
	$clock = $('.bossHud .clock');
}
function _addContent() {
	$bossAreaContent.empty();
	var html = '';
	if(_currentSlide === 0) {
		//show intro videp
		html = '<div class="videoFrame"><iframe src="http://player.vimeo.com/video/64315985" width="620" height="350" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe></div>';
		$bossAreaContent.append(html);
	} else if(_currentSlide === 1) {
		//show resumes and responses
		ss.rpc('game.player.getRandomResumes',{instanceName: $game.$player.instanceName}, function(result) {
			if(result.length > 0) {
				_resumes = _chooseResumes(result);
				html = '<p class="dialog"><span>Botanist:</span> In order to defeat the robot you must have some special seeds.  To get them, provide feedback on a few of your peers\' resume responses.</p>';
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
		html = '<p class="dialog"><span>Botanist:</span> Great work.  You earned yourself 7 seeds. But remember, these are special seeds. Dropping one of these is like a color compass that will point you in the direction of the robot\'s charger. More instructions here...</p>';
		$('.bossArea .bossButton').text('begin');
		$bossAreaContent.append(html);
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

function _placeCharger() {
	var x = Math.floor(Math.random() * $game.VIEWPORT_WIDTH),
		y = Math.floor(Math.random() * $game.VIEWPORT_HEIGHT);
	_charger.x = x;
	_charger.y = y;
	_calculateGrid();
	//set the grid item with the charger, take items off it if has em
	_grid[x][y].charger = 0;
	_grid[x][y].item = -1;
}

function _createGrid() {
	_grid = [$game.VIEWPORT_WIDTH];
	var i = $game.VIEWPORT_WIDTH;
	while(--i >= 0) {
		_grid[i] = [$game.VIEWPORT_HEIGHT];
		var j = $game.VIEWPORT_HEIGHT;
		while(--j >= 0) {
			//place random object
			var item = _makeRandomItem();
			_grid[i][j] = {
				item: item,
				itemRevealed: false
			};
		}
	}
}
function _calculateGrid() {
	var i = $game.VIEWPORT_WIDTH;
	while(--i >= 0) {
		var j = $game.VIEWPORT_HEIGHT;
		while(--j >= 0) {
			var dist = _distFromCharger({x:i,y:j});
			_grid[i][j].distance = dist;
			_grid[i][j].charger = -1;
		}
	}
}

function _distFromCharger(pos) {
	var delta = Math.abs(pos.x - _charger.x)  + Math.abs(pos.y - _charger.y);
	return delta;
}

function _beginGame() {
	_start = new Date().getTime(),
    _time = 0,
    _elapsed = '0.0',
    _pause = false,
    _totalTime = 0,
    _target = 90;
    _clockRate = 1;
    setTimeout(_updateTime, 100);
    //trigger boss music!
}

function _updateTime()
{
    _time += 100;
    _totalTime += 100 * _clockRate;
    _elapsed = _target - Math.floor(_totalTime / 1000);

    var diff = (new Date().getTime() - _start) - _time;

    $clock.text(_elapsed);

    if(_elapsed <= 0) {
		_fail();
    } else if(!_pause) {
        setTimeout(_updateTime, (100 - diff));
    }
}

function _fail() {
	alert('fail');
}

function _setupHud() {
	$BODY.on('click','.bossHud .regularSeedButton', function() {
		if(_seedMode === 0 && _numRegularSeeds > 0) {
			$(this).addClass('currentButton');
			_seedMode = 1;
			$game.$player.seedMode = true;
		} else if(_seedMode === 1) {
			$(this).removeClass('currentButton');
			_seedMode = 0;
			$game.$player.seedMode = false;
			$game.$player.resetRenderColor();
		} else if(_seedMode === 2) {
			if(_numRegularSeeds > 0) {
				$(this).addClass('currentButton');
				$('.bossHud .drawSeedButton').removeClass('currentButton');
				_seedMode = 1;
			} else {
				$game.statusUpdate({message:'you have no more seeds!',input:'status',screen: true,log:false});
			}
		} else {
			$game.statusUpdate({message:'you have no more seeds!',input:'status',screen: true,log:false});
		}
	});

	$BODY.on('click','.bossHud .drawSeedButton', function() {
		if(_seedMode === 0) {
			$(this).addClass('currentButton');
			_seedMode = 2;
			$game.$player.seedMode = true;
		} else if(_seedMode === 1) {
			$(this).addClass('currentButton');
			$('.bossHud .regularSeedButton').removeClass('currentButton');
			_seedMode = 2;
			$game.$player.seedMode = false;
			$game.$player.resetRenderColor();
		} else {
			$(this).removeClass('currentButton');
			_seedMode = 0;
		}
	});
}

function _renderTiles(pos) {
	var topLeftX = pos.x - 1,
		topLeftY = pos.y - 1,
		squares = [],
		min = 100;
	for(var x = 0; x < 3; x++) {
		for(var y = 0; y < 3; y++) {
			var curX = topLeftX + x,
				curY = topLeftY + y;
			//only add it if in the bounds of the game area
			if(curX >= 0 && curX < $game.VIEWPORT_WIDTH && curY >= 0 && curY < $game.VIEWPORT_HEIGHT) {
				var val = _grid[curX][curY].distance,
					item = _grid[curX][curY].item,
					charger = _grid[curX][curY].charger;
				if(val < min) {
					min = val;
				}
				squares.push({
					val: val,
					x: curX,
					y: curY,
					item: item,
					charger: charger
				});
				//if they found the charger, set it to found, send alert
				if(charger === 0) {
					_foundCharger(curX, curY);
				}
				if(item > -1) {
					//make sure it is revealed
					_grid[curX][curY].itemRevealed = true;
					//if they revealed a bad item, activate it now
					if(item < 2) {
						_activateItem({x: curX, y:curY, item:item});
					}
				}
			}
		}
	}
	//figure out the color
	for(var s = 0; s < squares.length; s++) {
		var alpha = 0.8 - (squares[s].val - min) * 0.2 + 0.1;
		squares[s].color = _rgbString + alpha + ')';
		//console.log(squares[s]);
	}
	$game.$renderer.renderBossTiles(squares);
}

function _makeRandomItem() {
	var ran = Math.floor(Math.random() * 200);
	if(ran < 4) {
		return ran;
	} else {
		return -1;
	}
}

function _foundCharger(x,y) {
	_grid[x][y].charger = 1;
	//TODO: prompt
}

function _activateItem(data) {
	if(_grid[data.x][data.y].itemRevealed) {
		//disable item in future
		_grid[data.x][data.y].item = -1;
		if(data.item === 0) {
			//speed up time (bad)
			$game.statusUpdate({message:'uh oh...time warp!',input:'status',screen: true,log:false});
			_clockRate = 4;
			_clockTimeout = setTimeout(function() {
				_clockRate = 1;
			},5000);
			setTimeout(function() {
				$game.$renderer.clearMapTile(data.x * $game.TILE_SIZE, data.y * $game.TILE_SIZE);
			},2000);
		} else if(data.item === 1) {
			//wipeout
			$game.statusUpdate({message:'wipeout!',input:'status',screen: true,log:false});
			setTimeout(function() {
				$game.$renderer.clearBossLevel();
			}, 1000);
			_grid[_charger.x][_charger.y].charger = 0;
		} else if(data.item === 2) {
			//time freeze
			$game.statusUpdate({message:'time freeze, nice!',input:'status',screen: true,log:false});
			_clockRate = 0;
			clearTimeout(_clockTimeout);
			_clockTimeout = setTimeout(function() {
				_clockRate = 1;
			},5000);
			$game.$renderer.clearMapTile(data.x * $game.TILE_SIZE, data.y * $game.TILE_SIZE);
		} else if(data.item === 3) {
			//extra seeds
			$game.statusUpdate({message:'bonus seeds!',input:'status',screen: true,log:false});
			_numRegularSeeds += 3;
			$('.bossHud .regularSeedButton .hudCount').text(_numRegularSeeds);
			$game.$renderer.clearMapTile(data.x * $game.TILE_SIZE, data.y * $game.TILE_SIZE);
		}
	}
}