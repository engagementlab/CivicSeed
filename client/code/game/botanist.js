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
	_paintbrushSeedFactor = 5,
	_levelQuestion = ['What motivates you to civically engage with the community? Your answer will become a permanent part of your Civic Resume, so think carefully!','Please describe your past experience and skills in civic engagement. Your answer will become a permanent part of your Civic Resume, so think carefully!','What aspect of civic engagement interests you the most? What type of projects do you want to work on? Your answer will become a permanent part of your Civic Resume, so think carefully!','What outcomes do you hope to achieve for yourself through civic engagement? What are you hoping to learn, and where do you want your community service to lead? Your answer will become a permanent part of your Civic Resume, so think carefully!'],
	_firstTime = false,

	$speakerName = null,
	$message = null,
	$speechBubble = null,
	$speechBubbleP = null,
	$speechBubbleBtn = null,
	$speechBubbleNextBtn = null,
	$speechBubbleCloseBtn = null,
	$puzzleSvg = null,
	$botanistArea = null,
	$feedback = null,
	$inventoryItem = null,
	$tangramArea = null,
	$botanistTextArea = null,
	$inventory = null,
	$inventoryBtn = null,
	$inventoryPuzzle = null,
	$botanistContent = null,
	$botanistAreaMessage = null;

$game.$botanist = {

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

	init: function(callback) {
		ss.rpc('game.npc.loadBotanist', function(botanist) {
			$game.$botanist.index = botanist.id,
			$game.$botanist.dialog = botanist.dialog,
			$game.$botanist.name = botanist.name,
			$game.$botanist.tangram = botanist.tangram;

			_info = {
				x: botanist.x,
				y: botanist.y
			};

			_renderInfo = {
				kind: 'botanist',
				srcX: 0,
				srcY: 0,
				curX: botanist.x,
				curY: botanist.y,
				prevX: botanist.x,
				prevY: botanist.y
			};

			_setDomSelectors();
			$game.$botanist.setupTangram();
			$game.$botanist.getMaster();
			$game.$botanist.setBotanistState($game.$player.botanistState);
			$game.$botanist.ready = true;
			callback();
		});
	},

	clear: function() {
		$game.$renderer.clearBotanist(_renderInfo);
	},

	getRenderInfo: function() {
		//since the botanist is stationary, we can hard code his location

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
				$game.$botanist.idle();
			}
		}
		else if($game.inTransit) {
			$game.$botanist.getMaster();
		}
	},

	setBotanistState: function(state) {
		if(state === 2) {
			_renderInfo.srcY = 160;
		} else {
			_renderInfo.srcY = 0;
		}
	},

	getMaster: function() {
		var loc = $game.$map.masterToLocal(_info.x, _info.y);

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

		if(_renderInfo.srcY === 0) {
			if(_counter >= 24) {
				_counter = 0;
				_renderInfo.srcX = 0;
			}

			else if(_counter == 18) {
				_renderInfo.srcX = 32 * 6;
			}

			else if(_counter == 12) {
				_renderInfo.srcX = 32 * 12;
			}

			else if(_counter == 6) {
				_renderInfo.srcX = 32 * 18;
			}
		} else {
			_renderInfo.srcX = 0;
		}
	},

	show: function() {
		//decide what to show based on the player's current status
		//if they are in a level 0-4
		if($game.$player.currentLevel < 5) {
			//show instructions first
			if($game.$player.botanistState === 0) {
				_messages = $game.$botanist.dialog[$game.$player.currentLevel].instructions;
				_currentMessage = 0;
				$game.$botanist.showChat();
			}
			//if they have gotten the instructions / intro dialog, show them the riddle
			//and put it in the inventory...? (prompt, resource (riddle first screen, outline next))
			else if($game.$player.botanistState === 1) {
				var dropped = $game.$player.getSeedsDropped();
				//make sure they have planted a seed in level 1
				if($game.$player.currentLevel === 0 && dropped < 1) {
					//make them plant first seed
					_speak =  'To plant a seed, click the leaf icon at the bottom of the screen, and then click the area where you wish to plant. Oh, look at that, you have a seed already! Try and plant it, then talk to me again.';

					$speakerName.text($game.$botanist.name+': ');
					$message.text(_speak);
					$speechBubble.fadeIn(function() {
						setTimeout(function() {
							$game.$botanist.hideChat();
						}, 3000);
					});
				}
				else {
					//ugly hack so we see Second set of instructions in level 0
					if(!_firstTime && $game.$player.currentLevel === 0) {
						_messages = $game.$botanist.dialog[$game.$player.currentLevel].instructions2;
						_currentMessage = 0;
						_firstTime = true;
						$game.$botanist.showChat();
					} else {
						$game.$botanist.showPrompt(0);	
					}
					
				}
			}
			//if they have the riddle, then provide a random hint, refer them to inventory is one
			else if($game.$player.botanistState === 2) {
				var curHint = 0,
					numItems = $game.$player.getInventoryLength();
				if(numItems > 0) {
					curHint = 1;
				}
				//else hint 1
				_messages = [];
				_messages.push($game.$botanist.dialog[$game.$player.currentLevel].hint[curHint]);
				_currentMessage = 0;
				$game.$botanist.showChat();

			}
			//if they have gathered the right resources, prompt to answer 
			else if($game.$player.botanistState === 3) {
				$game.$botanist.showPrompt(1);
			}
			//they have solved the tangram but not answered the portfolio question
			else if($game.$player.botanistState === 4) {
				$game.$botanist.showRiddle(2);
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
		var file = CivicSeed.CLOUD_PATH + '/img/game/tangram/puzzle' + $game.$player.currentLevel + '.png';
	},

	showChat: function() {
		$speechBubbleP.removeClass('fitBubble');
		$game.$audio.playTriggerFx('npcBubble');
		$game.$botanist.isChat = true;
		$game.$botanist.nextChatContent();
	},

	hideChat: function() {
		$speechBubble.fadeOut(function() {
			$speechBubbleBtn.addClass('hideButton');
			$speechBubbleCloseBtn.unbind('click');
			$game.$botanist.isChat = false;
			//save that the player has looked at the instructions
			if($game.$player.botanistState === 0 && $game.$player.currentLevel < 4) {
				$game.$player.botanistState = 1;
				_saveBotanistState();
				if($game.$player.currentLevel === 0) {
					$game.$player.updateSeeds('regular', 1);
				}
			}
		});
	},

	addChatContent: function() {
		$speechBubbleBtn.addClass('hideButton');
		$speechBubbleNextBtn.removeClass('hideButton');
		$speakerName.text($game.$botanist.name+': ');
		$message.text(_messages[_currentMessage]);

		//first item, then drop
		if(_currentMessage === 0) {
			$speechBubble.fadeIn(function() {
				$speechBubbleNextBtn.bind('click', (function () {
					$game.$botanist.nextChatContent();
				}));
			});
		}
		if(_currentMessage === _messages.length - 1) {
			$speechBubbleNextBtn.unbind('click').addClass('hideButton');

			$speechBubbleCloseBtn.removeClass('hideButton').bind('click', (function () {
				$game.$botanist.hideChat();
			}));
		}
	},

	nextChatContent: function() {
		//show the next message if there are more in the bag
		if(_currentMessage < _messages.length) {
			$game.$botanist.addChatContent();
			_currentMessage += 1;
		}
	},

	showPrompt: function(p) {
		$speechBubbleP.removeClass('fitBubble');
		$game.$audio.playTriggerFx('npcBubble');
		$game.$botanist.isChat = true;
		_speak =  $game.$botanist.dialog[$game.$player.currentLevel].riddle.prompts[p];

		$speakerName.text($game.$botanist.name+': ');
		$message.text(_speak);
		$('.speechBubble .buttonCorner .yesButton').removeClass('hideButton');
		$('.speechBubble .buttonCorner .noButton').removeClass('hideButton');
		$speechBubble.fadeIn(function() {
			$('.speechBubble .yesButton').bind('click', (function () {
				if(p === 1) {
					$game.$botanist.isSolving = true;
					$('.displayBoxText').text('drag a piece to the board to use it');
					$botanistArea.css('height','380px');
				}

				$game.$botanist.showRiddle(p);
			}));
			$('.speechBubble .noButton').bind('click', (function () {
				$game.$botanist.hideChat();
			}));
		});
	},

	inventoryShowRiddle: function() {
		
		//hide the inventory if the resource is not already visible
		//when clicked on from inventory (this means it isn't in puzzle mode)
		if(!$game.$botanist.isShowing) {
			$inventory.slideUp();
			$game.$botanist.isChat = true;
			$game.$botanist.showRiddle(0);
		}
	},

	showRiddle: function(num) {
		_promptNum = num;
		_currentSlide = 0;
		//if they are solving, change functionality of inventory
		if(num === 1) {
			$game.$botanist.isChat = true;
		} else if(num === 2) {
			_currentSlide = 2;	
		}
		$game.$botanist.addContent();
		$game.$botanist.addButtons();

		$speechBubble.fadeOut(function() {
			$speechBubbleBtn.addClass('hideButton');
			$('.speechBubble .yesButton').unbind('click');
			$('.speechBubble .noButton').unbind('click');

			$botanistArea
				.addClass('patternBg3')
				.fadeIn(function() {
					$game.$botanist.isShowing = true;
					if(_currentSlide === 0 && !$game.$player.firstTime) {
						$tangramArea.show();
					}
			});
		});
	},

	addButtons: function() {
		$('.botanistArea button').addClass('hideButton');

		//no buttons except close
		if(_promptNum === 0) {
			if(_currentSlide === 0) {
				if($game.$player.firstTime) {
					$('.botanistArea .nextButton').removeClass('hideButton');
				} else {
					$('.botanistArea .closeButton').removeClass('hideButton');
				}
			}
			else {
				$('.botanistArea .closeButton').removeClass('hideButton');
			}
		}
		else {
			if(_currentSlide === 0) {
				$('.botanistArea .answerButton').removeClass('hideButton');
				$('.botanistArea .clearBoardButton').removeClass('hideButton');
			}
			else if(_currentSlide === 1) {
				$('.botanistArea .nextButton').removeClass('hideButton');
			}
			else {
				$('.botanistArea .answerButton').removeClass('hideButton');
				//$('.botanistArea .clearBoardButton').removeClass('hideButton');
			}
		}
	},

	nextSlide: function() {
		_currentSlide += 1;
		$game.$botanist.addContent();
		$game.$botanist.addButtons();
	},

	previousSlide: function() {
		_currentSlide -= 1;
		$game.$botanist.addContent();
		$game.$botanist.addButtons();
	},

	addContent: function() {
		$('.botanistArea .speakerName').text($game.$botanist.name+': ');
		//if _promptNum is 0, then it is the just showing the riddle no interaction
		if(_promptNum === 0) {
			if(_currentSlide === 0) {
				if($game.$player.botanistState > 1) {
					$botanistAreaMessage.text('Here is the notebook page to view again.');
				}
				else {
					$botanistAreaMessage.text('Here is the page. You will be able to view it at anytime in your inventory.');

					if($game.$player.currentLevel > 0) {
						//add this tangram outline to the inventory
						$game.$player.tangramToInventory();
						$game.$player.botanistState = 2;
						_saveBotanistState();
						$game.$player.checkBotanistState();
						$game.$botanist.setBotanistState(2);
					}
				}
				var imgPath = CivicSeed.CLOUD_PATH + '/img/game/tangram/puzzle' + $game.$player.currentLevel+ '.png';
				$botanistContent.html('<img src="' + imgPath + '" class="tangramOutline">');
			}
			else {
				if($game.$player.currentLevel === 0) {
					//add this tangram outline to the inventory
					$game.$player.tangramToInventory();
					$game.$player.firstTime = false;
					$game.$player.botanistState = 2;
					var info = {
						id: $game.$player.id,
						firstTime: $game.$player.firstTime
					};
					ss.rpc('game.player.updateGameInfo', info);
					_saveBotanistState();
					$game.$player.checkBotanistState();
					$game.$botanist.setBotanistState(2);
					$botanistAreaMessage.text('There are four seed recipes in my notebook. You can view the current recipe and all the research pieces you have collected by opening your inventory. That\'s the toolbox icon at the bottom of the display.');
					$botanistContent.html('<p>To collect the pieces for the recipe, you must go out into the world and talk to its citizens by clicking on them. They will ask you questions.  Answer the questions to gain more <b>seeds</b>, plus important <b>puzzle pieces</b> that will enable you to create paintbrush seeds.  When you think you have enough pieces to complete the recipe come see me again.</p><img class="miniExample" src="/img/game/minimap.png"><p>The pieces of the first recipe can be found in Brightwood Forest to the northwest of here.  Pictured to the right is the mini map display you can see in the top right corner of the game screen.  You can toggle this on/off by clicking the globe icon below.  The highlighted quadrant represents the Brightwood Forest, and I am the square in the center.</p><p>Level 1, <b>Looking Inward</b>, is about understanding one\'s own motivations, goals, social identities, ethics and values in the context of a larger society.  Before beginning work in the community, it is important to look within, and reflect on where you are coming from in order to move forward. The more you understand yourself, the better equipped you will be to becoming an aware and effective active citizen.</p><p>Click the help icon (<i class="icon-question-sign icon-large"></i>) for more details on how to play.');
				}
			}
		}
		//they are solving it, so riddle interface and stuff
		else {
			if(_currentSlide === 0) {
				$inventoryBtn.addClass('hideButton');
				$inventory.slideDown(function() {
					$game.$player.inventoryShowing = false;
					//set the inventory items to draggable in case they were off
					$inventoryItem.attr('draggable','true');
				});
				//$game.$botanist.dialog[$game.$player.currentLevel].riddle.sonnet
				$botanistAreaMessage.text('OK. Take the pieces you have gathered and drop them into the outline to create your seeds.');
				var imgPath1 = CivicSeed.CLOUD_PATH + '/img/game/tangram/puzzle'+$game.$player.currentLevel+'.png',
					imgPath2 = CivicSeed.CLOUD_PATH + '/img/game/trash.png';
				var newHTML = '<img src="' + imgPath1 + '" class="tangramOutline"><img src="' + imgPath2 + '" class="trash">';
				$botanistContent.html(newHTML);

				//replace the tangram image in the inventory with tip
				$('.inventoryPuzzle').hide();
				$('.inventoryHelp').show();
			}
			//right/wrong screen
			else if(_currentSlide === 1) {
				$botanistArea.animate({
						'height':'450px'
				});
				$inventory.slideUp(function() {
					$game.$player.inventoryShowing = false;
					$inventoryBtn.removeClass('hideButton');
					$inventoryItem.remove();
				});

				var postTangramTalk = $game.$botanist.dialog[$game.$player.currentLevel].riddle.response;
				//console.log('posttangramtalk', postTangramTalk);
				$botanistAreaMessage.text(postTangramTalk);
				var newHTML2 = '<p>You earned a promotion to ' + $game.playerRanks[$game.$player.currentLevel + 1] + '</p>',
					imgPath3 = CivicSeed.CLOUD_PATH + '/img/game/seed_chips.png';
				
				newHTML2 += '<p class="seedChips"><img src="' + imgPath3 +'"></p>';
				$botanistContent.html(newHTML2);
			}
			else {
				var endQuestion = _levelQuestion[$game.$player.currentLevel];
				$botanistAreaMessage.text(endQuestion);
				var inputBox = '<textarea placeholder="type your answer here..."></textarea>';
				$botanistContent.html(inputBox);
			}
		}
	},

	hideResource: function() {
		//slide up the botanist area that contains big content
		//re-enable clicking by setting bools to false
		$tangramArea.hide();
		$botanistArea.fadeOut(function() {
			$game.$botanist.isShowing = false;
			$('.botanist button').addClass('hideButton');
			$(this)
				.removeClass('patternBg3')
				.css('height','450px');
			$game.$botanist.isChat = false;
			$game.$botanist.isSolving = false;
			$game.$botanist.clearBoard();
			$('.inventoryItem').css('opacity',1);

			//if they just beat a level, then show progreess
			if($game.$player.botanistState === 0 && $game.$player.currentLevel < 4) {
				$('.progressButton').toggleClass('currentButton');
				$game.showProgress();
			}
		});

		//if we left inventory on, that means we want to show it again
		if($game.$player.inventoryShowing) {
			$inventory.slideDown(function() {
				$game.$player.inventoryShowing = true;
			});
		}
		//otherwise, make sure it is hidden
		else {
			$inventory.slideUp(function() {
				$game.$player.inventoryShowing = false;
				$inventoryBtn.removeClass('hideButton');
				$('.inventoryPuzzle').show();
				$('.inventoryHelp').hide();
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
			aLength = $game.$botanist.tangram[$game.$player.currentLevel].answer.length,
			message = '',
			wrongOne = false,
			nudge = false;

			allTangrams.each(function(i, d) {
				//pull the coordinates for each tangram
				var tanIdD = $(this).attr('class'),
					tanId = tanIdD.substring(2,tanIdD.length),
					trans = $(this).attr('transform'),
					transD = trans.substring(10,trans.length-1),
					transD2 = transD.split(','),
					transX = parseInt(transD2[0],10),
					transY = parseInt(transD2[1],10),
					t = aLength,
					found = false,
					correctPiece = false;
					//go through the answer sheet to see if the current tangram is there &&
					//in the right place

				while(--t > -1) {
					var answer = $game.$botanist.tangram[$game.$player.currentLevel].answer[t];
					if(answer.id === tanId) {
						found = true;
						//this is a hard check for snapping
						if(transX === answer.x && transY === answer.y) {
							numRight += 1;
							correctPiece = true;
						}
						else {
							correctPiece = false;
						}
					}
				}

				if(!found) {
					wrongOne = true;
					correct = false;
					//remove it from the board
					$('.br' + tanId).remove();
					$('.r' + tanId)
						.css('opacity', 1)
						.attr('draggable', 'true');
				}
				else if(found && !correctPiece) {
					nudge = true;
					correct = false;
					//remove it from the board
					$('.br' + tanId).remove();
					$('.r' + tanId)
						.css('opacity', 1)
						.attr('draggable', 'true');
				}
			});

			if(allTangrams.length === 0) {
				correct = false;
				_paintbrushSeedFactor -= 1;
				message = 'at least TRY to solve it...';
			}
			else if(wrongOne) {
				correct= false;
				_paintbrushSeedFactor -=1;
				message = 'Oh! That’s not quite right. Think more about how the pieces relate to one another, and try again.';
			}
			else if(allTangrams.length < aLength) {
				correct= false;
				_paintbrushSeedFactor -=1;
				message = 'You are missing some pieces. Be sure to read the notebook clues carefully to help pick out the right pieces.';
			}
			else if(nudge) {
				correct= false;
				_paintbrushSeedFactor -=1;
				message = 'So close! You have the right pieces, just fix the placement.';
			}

			if(correct) {
				//it is correct if none were WRONG
				//make sure ALL were on the board
				if(numRight === aLength) {
					_currentSlide = 1;
					$game.$botanist.addContent();
					$game.$botanist.addButtons();
					//display item and congrats.
					//-> next slide is the prompt to answer question

					//remove all items from inventory on slide up
					//remove them from puzzle surface
					$puzzleSvg.empty();
					$tangramArea.hide();
					//remove them from player's inventory
					$game.$player.emptyInventory();
					var numSeeds = _paintbrushSeedFactor < 0 ? 0: _paintbrushSeedFactor,
						level = $game.$player.currentLevel + 1;
						totalSeeds = (20 + level * 4 ) + level * 2 * numSeeds;
					
					$game.$player.updateSeeds('draw', totalSeeds);
					$game.$player.botanistState = 4;
					_saveBotanistState();
				}
			}
			else {
				//display modal on current screen with feedback
				$game.$botanist.feedback(message);
			}

		}
		else {
			_paintbrushSeedFactor = 5;
			var portAnswer = $botanistTextArea.val();
			$game.$player.resumeAnswer(portAnswer);
			$game.statusUpdate({message:'talk to the botanist',input:'status',screen: true,log:false});
			$game.$player.nextLevel();
			$game.$botanist.hideResource();
			//upload the user's answer to the DB
		}
	},

	setupTangram: function() {
		_svg = d3.select('.tangramArea').append('svg')
			.attr('class','puzzleSvg')
			.attr('width','930px')
			.attr('height','380px');

		_drag = d3.behavior.drag()
			.origin(Object)
			.on('drag', $game.$botanist.dragMove)
			.on('dragstart', $game.$botanist.dragMoveStart)
			.on('dragend', $game.$botanist.dropMove);
	},

	dragStart: function(e) {
		if($game.$botanist.isSolving) {

			$tangramArea
				.unbind('dragover')
				.unbind('drop');

			var npcData = e.data,
				dt = e.originalEvent.dataTransfer;

			dt.setData('text/plain', npcData.npc);

			//set drag over and drop to receive
			$('.tangramArea')
				.bind('dragover',$game.$botanist.dragOver)
				.bind('drop', $game.$botanist.drop);
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
		//e.originalEvent.offsetX
		var npcData = e.originalEvent.dataTransfer.getData('text/plain'),
			splits = npcData.split(','),
			npc = splits[0],
			name = splits[1],
			selector = 'br' + name,
			x = e.originalEvent.layerX,
			y =  e.originalEvent.layerY;

		var	shape = $game.$resources.getShape(npc),
			path = shape.path,
			fill = _svgFills[shape.fill];


		//console.log(npcData, selector, x);
		$('.r' + name)
			.css('opacity','.4')
			.attr('draggable', 'false');

		_new = _svg.append('path')
			.attr('class',selector)
			.data([{x:x , y: y, id: name, color: fill}])
			.attr('d', shape.path)
			.attr('fill', fill)
			.attr('stroke', 'rgb(255,255,255)')
			.attr('stroke-width', 0)
			.attr('transform', 'translate('+x+','+y+')')
			.call(_drag);

		$tangramArea
			.unbind('dragover')
			.unbind('drop');

		//clear data from drag bind
		e.originalEvent.dataTransfer.clearData();
		return false;
	},

	dragMoveStart: function(d) {
		clearTimeout(_feedbackTimeout);
		$feedback.fadeOut('fast');

		_dragOffX = d3.mouse(this)[0],
		_dragOffY = d3.mouse(this)[1],

		d3.select('.br' + d.id)
			.attr('stroke-width', 3);
	},

	dragMove: function(d) {
		var x = d3.event.sourceEvent.layerX,
			y = d3.event.sourceEvent.layerY,
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
				return trashing ? 0.5 : 1;
			});
	},

	dropMove: function(d) {
		var x = d3.event.sourceEvent.layerX,
			y = d3.event.sourceEvent.layerY,
			mX = $game.$botanist.snapTo(x - _dragOffX),
			mY = $game.$botanist.snapTo(y - _dragOffY),
			trans = 'translate(' + mX  + ', ' + mY + ')';

		d3.select('.br' + d.id)
			.attr('stroke-width',0)
			.attr('transform',trans);

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
	},

	clearBoard: function() {
		$('.puzzleSvg').empty();
		$('.inventoryItem').css('opacity', 1).attr('draggable', 'true');
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
		$feedback
			.text(message)
			.fadeIn();

		_feedbackTimeout = setTimeout(function() {
			$feedback.fadeOut();
		},4500);
	},

	//return level question for resume
	getLevelQuestion: function(level) {
		return _levelQuestion[level];
	},

	disable: function() {
		_onScreen = false;
	}
};

function _setDomSelectors() {
	$speakerName = $('.speechBubble .speakerName');
	$message = $('.speechBubble .message');
	$speechBubble = $('.speechBubble');
	$speechBubbleP = $('.speechBubble p');
	$speechBubbleBtn = $('.speechBubble button');
	$speechBubbleNextBtn = $('.buttonCorner .nextChatButton');
	$speechBubbleCloseBtn = $('.buttonCorner .closeChatButton');
	$puzzleSvg = $('.puzzleSvg');
	$botanistArea = $('.botanistArea');
	$feedback = $('.feedback');
	$inventoryItem = $('.inventoryItem');
	$tangramArea = $('.tangramArea');
	$botanistTextArea = $('.botanistContent textarea');
	$inventory = $('.inventory');
	$inventoryBtn = $('.inventory button');
	$inventoryPuzzle = $('.inventoryPuzzle');
	$botanistContent = $('.botanistContent');
	$botanistAreaMessage = $('.botanistArea .message');
}

function _saveBotanistState() {
	var info = {
		id: $game.$player.id,
		botanistState: $game.$player.botanistState
	};
	ss.rpc('game.player.updateGameInfo', info);
}