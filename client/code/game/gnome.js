var _info = null,
	_renderInfo = null,
	_onScreen = false,
	_messages = null,
	_currentMessage = 0,
	_currentSlide = 0,
	_promptNum = 0,
	_transferData = {},
	_svg = null,
	_drag = null,
	_new = null,
	_counter = 0,
	_dragOffX = 0,
	_dragOffY = 0,
	_feedbackTimeout = null,
	_svgFills = {orange: 'rgb(236,113,41)', lightOrange: 'rgb(237,173,135)', blue: 'rgb(14,152,212)', lightBlue: 'rgb(109,195,233)', green: 'rgb(76,212,206)', lightGreen: 'rgb(164,238,235)' },
	_numMegaSeeds = 5;

$game.$gnome = {

	index: 0,
	numSteps: 64,
	counter: Math.floor(Math.random() * 64),
	curFrame: 0,
	numFrames: 4,
	dialog: null,
	tangram: null,
	name: null,
	isChat: false,
	isShowing: false,
	isSolving: false,
	ready: false,
	
	init: function() {
		ss.rpc('game.npc.loadGnome', function(gnome) {
			$game.$gnome.index = gnome.id,
			$game.$gnome.dialog = gnome.dialog,
			$game.$gnome.name = gnome.name,
			$game.$gnome.tangram = gnome.tangram;

			_info = {
				x: gnome.x,
				y: gnome.y
			};

			_renderInfo = {
				kind: 'gnome',
				srcX: 0,
				srcY: 0,
				curX: gnome.x,
				curY: gnome.y,
				prevX: gnome.x,
				prevY: gnome.y
			};

			$game.$gnome.setupTangram();
			$game.$gnome.getMaster();
			$game.$gnome.ready = true;
		});
	},

	clear: function() {
		$game.$renderer.clearGnome(_renderInfo);
	},
	
	getRenderInfo: function() {
		//since the gnome is stationary, we can hard code his location

		if(_onScreen) {
			return _renderInfo;
		}
		else {
			return false;
		}
	},

	update: function() {
		if(!$game.inTransit) {
			if(_onScreen) {
				$game.$gnome.idle();
			}
		}
		else if($game.inTransit) {
			$game.$gnome.getMaster();
		}

	},

	getMaster: function() {
		var loc = $game.masterToLocal(_info.x, _info.y);
		
		if(loc) {
			var prevX = loc.x * $game.TILE_SIZE,
				prevY = loc.y * $game.TILE_SIZE,
				curX = loc.x * $game.TILE_SIZE,
				curY = loc.y * $game.TILE_SIZE;
			
			_renderInfo.prevX = prevX,
			_renderInfo.prevY = prevY;

			_renderInfo.curX = curX,
			_renderInfo.curY = curY;
			_onScreen = true;
		}
		else {
			_onScreen = false;
		}
	},

	idle: function() {
		
		_counter += 1;
		
		if(_counter >= 24) {
			_counter = 0,
			_renderInfo.srcX = 0,
			_renderInfo.srcY = 0;
		}

		else if(_counter == 18) {
			_renderInfo.srcX = 32 * 6;
			_renderInfo.srcY = 0;
		}

		else if(_counter == 12) {
			_renderInfo.srcX = 32 * 12;
			_renderInfo.srcY = 0;
		}

		else if(_counter == 6) {
			_renderInfo.srcX = 32 * 18;
			_renderInfo.srcY = 0;
		}
	
	},

	show: function() {
		//decide what to show based on the player's current status
		//if they are in a level 0-4
		if($game.$player.game.currentLevel < 5) {
			//show instructions first
			if($game.$player.game.gnomeState === 0) {
				_messages = $game.$gnome.dialog[$game.$player.game.currentLevel].instructions;
				_currentMessage = 0;
				$game.$gnome.showChat();
			}
			//if they have gotten the instructions / intro dialog, show them the riddle
			//and put it in the inventory...? (prompt, resource (riddle first screen, outline next))
			else if($game.$player.game.gnomeState === 1) {
				if($game.$player.game.currentLevel === 0 && $game.$player.game.seeds.dropped < 1) {
					//make them plant first seed
					_speak =  'To plant a seed, click the leaf icon at the bottom of the screen, and then click the area where you wish to plant. Oh, look at that, you have a seed already! Try and plant it, then talk to me again.';

					$('.speechBubble .speakerName').text($game.$gnome.name+': ');
					$('.speechBubble .message').text(_speak);
					$('.speechBubble').fadeIn(function() {
						setTimeout(function() {
							$('.speechBubble').fadeOut();
						}, 3000);
					});
				}
				else {
					$game.$gnome.showPrompt(0);
				}
			}
			//if they have the riddle, then provide a random hint, refer them to inventory is one
			else if($game.$player.game.gnomeState === 2) {
				var curHint = 0;
				if($game.$player.game.inventory.length > 0) {
					curHint = 1;
				}
				//else hint 1
				_messages = [];
				_messages.push($game.$gnome.dialog[$game.$player.game.currentLevel].hint[curHint]);
				_currentMessage = 0;
				$game.$gnome.showChat();

			}
			//if they have gathered the right resources, prompt to answer 
			else if($game.$player.game.gnomeState === 3) {
				$game.$gnome.showPrompt(1);
			}
			//they have solved the tangram but not answered the portfolio question
			else if($game.$player.game.gnomeState === 4) {
				$game.$gnome.showRiddle(2);
			}
		}
		//they have beaten the INDIVIDUAL part of the game
		else {
			//if they have beat level 4
			//but comm. meter is <

			//and comm. meter is >

			//and final task is solved
		}
	},

	showTangram: function() {
		var file = CivicSeed.CLOUD_PATH + '/img/game/tangrams/puzzle' + $game.$player.game.currentLevel + '.png';	
	},

	showChat: function() {
		$('.speechBubble p').removeClass('fitBubble');
		$game.$audio.playTriggerFx('npcBubble');
		$game.$gnome.isChat = true;
		$game.$gnome.nextChatContent();
	},
	hideChat: function() {
		$('.speechBubble').fadeOut(function() {
			$('.speechBubble button').addClass('hideButton');
			$('.speechBubble .closeChatButton').unbind('click');
			$game.$gnome.isChat = false;

			//save that the player has looked at the instructions
			if($game.$player.game.gnomeState === 0) {
				$game.$player.game.gnomeState = 1;
				if($game.$player.game.currentLevel === 0) {
					$game.$player.game.seeds.normal += 1;
					$('.seedButton > .hudCount').text($game.$player.game.seeds.normal);
				}
			}
		});
	},
	addChatContent: function() {
		$('.speechBubble button').addClass('hideButton');
		$('.speechBubble .nextChatButton').removeClass('hideButton');
		$('.speechBubble .speakerName').text($game.$gnome.name+": ");
		$('.speechBubble .message').text(_messages[_currentMessage]);

		//first item, then drop
		if(_currentMessage === 0) {
			$('.speechBubble').fadeIn(function() {
				$(".speechBubble .nextChatButton").bind('click', (function () {
					$game.$gnome.nextChatContent();
				}));
			});
		}
		if(_currentMessage === _messages.length - 1) {
			$(".speechBubble .nextChatButton").unbind('click').addClass('hideButton');

			$(".speechBubble .closeChatButton").removeClass('hideButton').bind("click", (function () {
				$game.$gnome.hideChat();
			}));
		}
	},

	nextChatContent: function() {
		//show the next message if there are more in the bag
		if(_currentMessage < _messages.length) {
			$game.$gnome.addChatContent();
			_currentMessage += 1;
		}
	},

	showPrompt: function(p) {
		$('.speechBubble p').removeClass('fitBubble');
		$game.$audio.playTriggerFx('npcBubble');
		$game.$gnome.isChat = true;
		_speak =  $game.$gnome.dialog[$game.$player.game.currentLevel].riddle.prompts[p];

		$('.speechBubble .speakerName').text($game.$gnome.name+': ');
		$('.speechBubble .message').text(_speak);
		$('.speechBubble .yesButton, .speechBubble .noButton').removeClass('hideButton');
		$('.speechBubble').fadeIn(function() {
			$(".speechBubble .yesButton").bind("click", (function () {
				if(p === 1) {
					$game.$gnome.isSolving = true;
					$('.displayBoxText').text('drag a piece to the board to use it');
					$('.gnomeArea').css('height','380px');
				}

				$game.$gnome.showRiddle(p);
			}));
			$(".speechBubble .noButton").bind("click", (function () {
				$game.$gnome.hideChat();
			}));
		});
	},

	inventoryShowRiddle: function() {
		
		//hide the inventory if the resource is not already visible
		//when clicked on from inventory (this means it isn't in puzzle mode)
		if(!$game.$gnome.isShowing) {
			$('.inventory').slideUp();
			$game.$gnome.isChat = true;
			$game.$gnome.showRiddle(0);
		}
	},

	showRiddle: function(num) {
		//if they are solving, change functionality of inventory
		if(num === 2) {
			_promptNum = 1;
			_currentSlide = 2;
			$game.$gnome.isChat = true;
		}
		else {
			_promptNum = num;
			_currentSlide = 0;
		}
		$game.$gnome.addContent();
		$game.$gnome.addButtons();
		
		
		$('.speechBubble').fadeOut(function() {
			$('.speechBubble button').addClass('hideButton');
			$('.speechBubble .yesButton').unbind('click');
			$('.speechBubble .noButton').unbind('click');

			$('.gnomeArea')
				.addClass('patternBg3')
				.fadeIn(function() {
					$game.$gnome.isShowing = true;
					if(_currentSlide === 0 && !$game.$player.game.firstTime) {
						$('.tangramArea').show();
					}
			});
		});
		
	},

	addButtons: function() {
		$('.gnomeArea button').addClass('hideButton');

		if(_promptNum === 0) {
			if(_currentSlide === 0) {
				$('.gnomeArea .nextButton').removeClass('hideButton');
			}
			else if(_currentSlide === 1) {
				$('.gnomeArea .backButton').removeClass('hideButton');
				if($game.$player.game.firstTime) {
					$('.gnomeArea .nextButton').removeClass('hideButton');
				} else {
					$('.gnomeArea .closeButton').removeClass('hideButton');
				}
			}
			else {
				$('.gnomeArea .closeButton').removeClass('hideButton');
			}
		}
		else {
			if(_currentSlide === 0) {
				$('.gnomeArea .answerButton').removeClass('hideButton');
			}
			else if(_currentSlide === 1) {
				$('.gnomeArea .answerButton').addClass('hideButton');
				$('.gnomeArea .nextButton').removeClass('hideButton');
			}
			else {
				$('.gnomeArea .nextButton').addClass('hideButton');
				$('.gnomeArea .answerButton').removeClass('hideButton');
			}
		}
	},

	nextSlide: function() {
		_currentSlide += 1;
		$game.$gnome.addContent();
		$game.$gnome.addButtons();
	},

	previousSlide: function() {
		_currentSlide -= 1;
		$game.$gnome.addContent();
		$game.$gnome.addButtons();
	},

	addContent: function() {
		$('.gnomeArea .speakerName').text($game.$gnome.name+': ');
		//if _promptNum is 0, then it is the just showing the riddle and tangram first time
		if(_promptNum === 0) {
			if(_currentSlide === 0) {
				if($game.$player.game.firstTime) {
					$('.gnomeArea .message').text('Well -- first ' + $game.$player.name +', you must prove your worth by answering my riddle - the enigma civica. The more you understand, the more powerful your seeds will become. Behold!');
					$('.gnomeContent').html('<p class="megaRiddle">Why and how this garden grows<br>is something you may never know --<br>that is unless you first uncover<br>how we work with one another.<br>So I\'ll tell you how this starts:<br> with a riddle in four parts.<br><br>First, you must find a way<br>to tell me what you brought today<br>and how your future and your past<br>combine to form a mold you cast.<br>How does pity become solidarity?<br>One hint: Walk with humility<br><br>.Second, what do you gain the more you give, <br>and how can you give if you are to gain?<br>Who out there can explain <br>what communities need and what they contain?<br>Do you see assets or do you see need <br>when you look at partners in the community?<br>Expand your view<br>and tell me too, <br>who can see it better than you?<br><br>You know how you got hereand so do I --<br>can you forget it? Should you try?<br>How do peoplefrom here and there<br>build a dream that they both share<br>When is a goalobtainable? <br>Responsibility / maintainable? <br>Are your thoughts explainable? <br>Is what we teach retainable?<br><br>When the seed is fertile, who should sow it?<br>A challenge, a solution, who should own it?<br>Will you grow connections,<br>become a leader by reflection,<br> be inspired, plant roots, or discover direction?<br>The last question is the hardest of all,<br>so look into your crystal ball.<br>Will your mark be great or small?<br>Will we be glad you came at all?</p>');
				} else {
					$('.gnomeArea .message').text('Here is your next enigma ' + $game.$player.name + '.');
					$('.gnomeContent').html('<p class="firstRiddle">'+$game.$gnome.dialog[$game.$player.game.currentLevel].riddle.sonnet+'</p>');
				}
			}
			else if(_currentSlide === 1) {
				if($game.$player.game.gnomeState > 1) {
					$('.gnomeArea .message').text('Here is the enigma to view again.');
				}
				else {
					$('.gnomeArea .message').text('This puzzle represents the next piece of the enigma. You can view it at anytime in your inventory.');
					
					//add this tangram outline to the inventory
					$game.$player.tangramToInventory();
					
					//update gnomeState
					if($game.$player.game.currentLevel > 0) {
						$game.$player.game.gnomeState = 2;
						$game.$player.checkGnomeState();
					}
				}
				
				var imgPath = CivicSeed.CLOUD_PATH + '/img/game/tangram/puzzle' + $game.$player.game.currentLevel+ '.png';
				$('.gnomeContent').html('<img src="' + imgPath + '" class="tangramOutline">');
				
			}
			else {
				if($game.$player.game.currentLevel === 0) {
					$game.$player.game.firstTime = false;
					$game.$player.game.gnomeState = 2;
					$game.$player.checkGnomeState();
					$('.gnomeArea .message').text('The enigma has four parts, each with a verse and a puzzle. You can view the enigma and all the pieces you have collected by opening your inventory at any time. That’s the toolbox icon at the bottom of the display.');
					$('.gnomeContent').html('<p>To answer the enigma, you must go out into the world and talk to its citizens by clicking on them. They will ask you questions.</p><p>Answer the questions to gain more seeds and, more importantly, pieces that will enable to you solve the enigma civica.</p><p>When you think you have enough pieces to solve the enigma, come see me again.</p><p>The answers to the first part can be found in Graywood Forest, to the northwest of here. Good luck!</p>');
				}
			}
		}
		//they are solving it, so riddle interface and stuff
		else {
			// if(_currentSlide === 0) {
			// 	$('.gnomeArea .message').text('here is your next riddle ' + $game.$player.name + '.');
			// 	$('.gnomeContent').html('<p class="firstRiddle">'+$game.$gnome.dialog[$game.$player.game.currentLevel].riddle.sonnet+'</p>');
			if(_currentSlide === 0) {
				$('.inventory button').addClass('hideButton');
				$('.inventory').slideDown(function() {
					$game.$player.inventoryShowing = false;
					//set the inventory items to draggable in case they were off
					$('.inventoryItem').attr('draggable','true');
				});
				//$game.$gnome.dialog[$game.$player.game.currentLevel].riddle.sonnet
				$('.gnomeArea .message').text('OK. Take the pieces you have gathered and drop them into the outline to solve the enigma.');
				var imgPath1 = CivicSeed.CLOUD_PATH + 'img/game/tangram/puzzle'+$game.$player.game.currentLevel+'.png',
					imgPath2 = CivicSeed.CLOUD_PATH + '/img/game/trash.png';
				var newHTML = '<p class="riddleText">'+ $game.$gnome.dialog[$game.$player.game.currentLevel].riddle.sonnet +'</p><img src="' + imgPath1 + '" class="tangramOutline"><img class="trash" src="' + imgPath2 + '">';
				$('.gnomeContent').html(newHTML);
			}
			//right/wrong screen
			else if(_currentSlide === 1) {
				$('.gnomeArea').animate({
						'height':'450px'
				});
				$('.inventory').slideUp(function() {
					$game.$player.inventoryShowing = false;
					$('.inventory button').removeClass('hideButton');
					$('.inventoryItem').remove();
				});

				var postTangramTalk = $game.$gnome.dialog[$game.$player.game.currentLevel].riddle.response;
				console.log('posttangramtalk', postTangramTalk);
				$('.gnomeArea .message').text(postTangramTalk);
				var newHTML2 = '<p>You got some mega seeds! And earned a promotion: ' + $game.playerRanks[$game.$player.game.currentLevel + 1]+ '</p><p img src="megaseed.png"></p>';
				$('.gnomeContent').html(newHTML2);
			}
			else {
				var endQuestion = $game.levelQuestion[$game.$player.game.currentLevel];
				$('.gnomeArea .message').text(endQuestion);
				var inputBox = '<form><textarea placeholder="type your answer here..."></textarea></form>';
				$('.gnomeContent').html(inputBox);
				$game.changeStatus('this will go in your profile');
			}
		}
	},

	hideResource: function() {
		//slide up the gnome area that contains big content
		//re-enable clicking by setting bools to false
		$('.tangramArea').hide();
		$('.gnomeArea').fadeOut(function() {
			$game.$gnome.isShowing = false;
			$('.gnome button').addClass('hideButton');
			$(this)
				.removeClass('patternBg3')
				.css('height','450px');
			$game.$gnome.isChat = false;
			$game.$gnome.isSolving = false;
			$game.changeStatus();
			$('.puzzleSvg').empty();
			$('.inventoryItem').css('opacity',1);

			//if they just beat a level, then show progreess
			if($game.$player.game.gnomeState === 0) {
				$('.progressButton').toggleClass('currentButton');
				$game.showProgress();
				$game.changeStatus('game progress and leaderboard');
			}
		});

		//if we left inventory on, that means we want to show it again
		if($game.$player.inventoryShowing) {
			$('.inventory').slideDown(function() {
				$game.$player.inventoryShowing = true;
			});
		}
		//otherwise, make sure it is hidden
		else {
			$('.inventory').slideUp(function() {
				$game.$player.inventoryShowing = false;
				$('.inventory button').removeClass('hideButton');
			});
		}
	},

	submitAnswer: function() {
		//go through and check each piece on 'the board' and see it exists within the right answer
		//array and check the location. give feedback/next screen based on results
		if(_currentSlide === 0) {
			var allTangrams = $('.puzzleSvg > path'),
			correct = true,
			numRight = 0,
			aLength = $game.$gnome.tangram[$game.$player.game.currentLevel].answer.length,
			message = '',
			wrongOne = false,
			nudge = false;

			allTangrams.each(function(i, d) {
				//pull the coordinates for each tangram
				var tanIdD = $(this).attr('class'),
					tanId = parseInt(tanIdD.substring(2,tanIdD.length),10),
					trans = $(this).attr('transform'),
					transD = trans.substring(10,trans.length-1),
					transD2 = transD.split(','),
					transX = parseInt(transD2[0],10),
					transY = parseInt(transD2[1],10),
					t = aLength,
					found = false;
					//go through the answer sheet to see if the current tangram is there &&
					//in the right place

				while(--t > -1) {
					var answer = $game.$gnome.tangram[$game.$player.game.currentLevel].answer[t];
					if(answer.id === tanId) {
						found = true;
						//this is a hard check for snapping
						if(transX === answer.x && transY === answer.y) {
							numRight += 1;
						}
						else {
							correct = false;
						}
					}
				}

				if(!found) {
					wrongOne = true;
					correct = false;
				}
				else if(found && !correct) {
					nudge = true;
					correct = false;
				}
			});

			if(allTangrams.length === 0) {
				correct = false;
				_numMegaSeeds -= 1;
				message = 'at least TRY to solve it...';
			}
			else if(wrongOne) {
				correct= false;
				_numMegaSeeds -=1;
				message = 'at least one is incorrect';
			}
			else if(allTangrams.length < aLength) {
				correct= false;
				_numMegaSeeds -=1;
				message = 'you are missing some';
			}
			else if(nudge) {
				correct= false;
				_numMegaSeeds -=1;
				message = 'try giving them a nudge';
			}

			if(correct) {
				//it is correct if none were WRONG
				//make sure ALL were on the board
				if(numRight === aLength) {
					_currentSlide = 1;
					$game.$gnome.addContent();
					$game.$gnome.addButtons();
					//display item and congrats.
					//-> next slide is the prompt to answer question

					//remove all items from inventory on slide up
					//remove them from puzzle surface
					$('.puzzleSvg').empty();
					$('.tangramArea').hide();
					//remove them from player's inventory
					$game.$player.emptyInventory();
					_numMegaSeeds = _numMegaSeeds < 0 ? 1: _numMegaSeeds;
					$game.$player.game.seeds.riddle += _numMegaSeeds;
					$('.riddleButton .hudCount').text($game.$player.game.seeds.riddle);
					var numSeeds = $game.$player.game.seeds.normal + $game.$player.game.seeds.riddle + $game.$player.game.seeds.special;
					//update HUD
					$('.seedButton .hudCount').text(numSeeds);
					$game.$player.game.gnomeState = 4;

					$game.changeStatus('congrats!');
				}
			}
			else {
				//display modal on current screen with feedback
				$game.$gnome.feedback(message);
			}

		}
		else {
			_numMegaSeeds = 5;
			$game.$player.nextLevel();
			$game.$gnome.hideResource();
			//upload the user's answer to the DB
			var portAnswer = $('.gnomeContent textarea').val();
			$game.$player.game.resume.push(portAnswer);
			$game.changeStatus('talk to the gnome');
		}
		
	},

	setupTangram: function() {
		_svg = d3.select('.tangramArea').append('svg')
			.attr('class','puzzleSvg')
			.attr('width','930px')
			.attr('height','380px');

		_drag = d3.behavior.drag()
    		.origin(Object)
    		.on('drag', $game.$gnome.dragMove)
    		.on('dragstart', $game.$gnome.dragMoveStart)
    		.on('dragend', $game.$gnome.dropMove);
	},

	dragStart: function(e) {
		if($game.$gnome.isSolving) {
			var id = e.data.npc,
				dt = e.originalEvent.dataTransfer,
				select = '.r' + id;
			
			dt.setData('text/plain', id);
			//set drag over shit
			$('.tangramArea')
				.bind('dragover',$game.$gnome.dragOver)
				.bind('drop', $game.$gnome.drop);

			
		}
	},
	dragEnd: function(e) {
		e.preventDefault();
	},
	dragOver: function(e) {
		if (e.preventDefault) {
			e.preventDefault();
		}
		return false;
	},
	drop: function(e) {
		e.preventDefault();
		if (e.stopPropagation) {
			e.stopPropagation();
		}
		//set class name for new shape and fetch shape data
		var npc = e.originalEvent.dataTransfer.getData('text/plain'),
			selector = 'br' + npc,
			x = e.originalEvent.offsetX,
			y =  e.originalEvent.offsetY,
			shape = $game.$resources.getShape(npc),
			path = shape.path,
			fill = _svgFills[shape.fill];

			console.log(shape.fill, fill);
			

		$('.r' + npc)
			.css('opacity','.4')
			.attr('draggable', 'false');
		
		_new = _svg.append('path')
			.attr('class',selector)
			.data([{x:x , y: y, id: npc, color: fill}])
			.attr('d', shape.path)
			.attr('fill', fill)
			.attr('stroke', 'rgb(255,255,255)')
			.attr('stroke-width', 0)
			.attr('transform', 'translate('+x+','+y+')')
			.call(_drag);

		$('.tangramArea')
			.unbind('dragover')
			.unbind('drop');
	
		//clear data from drag bind
		e.originalEvent.dataTransfer.clearData();
		return false;

	},

	dragMoveStart: function(d) {
		clearTimeout(_feedbackTimeout);
		$('.feedback').fadeOut('fast');

		_dragOffX = d3.mouse(this)[0],
		_dragOffY = d3.mouse(this)[1],
	
		d3.select('.br' + d.id)
			.attr('stroke-width', 3);
	},

	dragMove: function(d) {
		var x = d3.event.sourceEvent.offsetX,
			y = d3.event.sourceEvent.offsetY,
			// mX = $game.$gnome.snapTo(x - _dragOffX),
			// mY = $game.$gnome.snapTo(y - _dragOffY);
			mX = x - _dragOffX,
			mY = y - _dragOffY,
			trashing = false;

		if(x > 825 && x < 890 && y > 170 && y < 300) {
			$('.trash').css('opacity',1);
			trashing = true;
		}
		else {
			$('.trash').css('opacity',0.5);
			trashing = false;
		}

		var trans = 'translate(' + mX  + ', ' + mY + ')';
		
		d3.select('.br' + d.id)
			.attr('transform',trans)
			.attr('opacity', function() {
				return trashing ? .5 : 1;
			});
	},
	dropMove: function(d) {
		var x = d3.event.sourceEvent.offsetX,
			y = d3.event.sourceEvent.offsetY,
			mX = $game.$gnome.snapTo(x - _dragOffX),
			mY = $game.$gnome.snapTo(y - _dragOffY),
			trans = 'translate(' + mX  + ', ' + mY + ')';
			//shape = $game.$resources.getShape(npc);

		if(x > 825 && x < 890 && y > 170 && y < 300) {
			$('.br' + d.id).remove();
			$('.r' + d.id)
				.css('opacity', 1)
				.attr('draggable', 'true');
			$('.trash').css('opacity',0.5);
		}
		else {
			d3.select('.br' + d.id)
			.attr('stroke-width',0)
			.attr('transform',trans);
		}
		
		console.log('drop: ',d.id,x,y,mX,mY);
	},

	snapTo: function(num) {

		var result = num,
			thresh = 10,
			half = thresh / 2,
			round = (num % thresh - half);

		if(round > -1) {
			result += half - round;
		}
		else {
			result += -half - round;
		}
		return result;
	},

	feedback: function(message) {
		$('.feedback')
			.text(message)
			.fadeIn();

		_feedbackTimeout = setTimeout(function() {
			$('.feedback').fadeOut();
		},3500);
	}
};
