'use strict';

//private botanist vars
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
	_levelQuestion = ['What motivates you to civically engage? Your answer will become a permanent part of your Civic Resume, so think carefully!','Please describe your past experience and skills in civic engagement. Your answer will become a permanent part of your Civic Resume, so think carefully!','What aspect of civic engagement interests you the most? What type of projects do you want to work on? Your answer will become a permanent part of your Civic Resume, so think carefully!', 'What outcomes do you hope to achieve for yourself through civic engagement? What are you hoping to learn, and where do you want your civic engagement to lead? Your answer will become a permanent part of your Civic Resume, so think carefully!'],
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

//export botanist functions
var $botanist = $game.$botanist = {

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
			$game.$botanist.index = botanist.id;
			$game.$botanist.dialog = botanist.dialog;
			$game.$botanist.name = botanist.name;
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

	resetInit: function() {
		_info = null;
		_renderInfo = null;
		_onScreen = false;
		_messages = null;
		_currentMessage = 0;
		_currentSlide = 0;
		_promptNum = 0;
		_transferData = {};
		_svg = null;
		_drag = null;
		_new = null;
		_counter = 0;
		_dragOffX = 0;
		_dragOffY = 0;
		_feedbackTimeout = null;
		_firstTime = false;

		$speakerName = null;
		$message = null;
		$speechBubble = null;
		$speechBubbleP = null;
		$speechBubbleBtn = null;
		$speechBubbleNextBtn = null;
		$speechBubbleCloseBtn = null;
		$puzzleSvg = null;
		$botanistArea = null;
		$feedback = null;
		$inventoryItem = null;
		$tangramArea = null;
		$botanistTextArea = null;
		$inventory = null;
		$inventoryBtn = null;
		$inventoryPuzzle = null;
		$botanistContent = null;
		$botanistAreaMessage = null;

		$game.$botanist.index= 0;
		$game.$botanist.counter= Math.floor(Math.random() * 64);
		$game.$botanist.curFrame= 0;
		$game.$botanist.dialog= null;
		$game.$botanist.tangram= null;
		$game.$botanist.name= null;
		$game.$botanist.isChat= false;
		$game.$botanist.isShowing= false;
		$game.$botanist.isSolving= false;
		$game.$botanist.ready= false;
	},

	//clear botanist from canvas
	clear: function() {
		$game.$renderer.clearBotanist(_renderInfo);
	},

	//get botanist current render data
	getRenderInfo: function() {
		//since the botanist is stationary, we can hard code his location

		if(_onScreen) {
			return _renderInfo;
		}
		else {
			return false;
		}
	},

	//decide how to render botanist
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

	//change the botanist state which determines what he shows
	setBotanistState: function(state) {
		if(state === 2) {
			_renderInfo.srcY = 160;
		} else {
			_renderInfo.srcY = 0;
		}
	},

	//determine if botanist is on screen
	getMaster: function() {
		var loc = $game.$map.masterToLocal(_info.x, _info.y);

		if(loc) {
			var prevX = loc.x * $game.TILE_SIZE,
				prevY = loc.y * $game.TILE_SIZE,
				curX = loc.x * $game.TILE_SIZE,
				curY = loc.y * $game.TILE_SIZE;

			_renderInfo.prevX = prevX;
			_renderInfo.prevY = prevY;

			_renderInfo.curX = curX;
			_renderInfo.curY = curY;
			_onScreen = true;
		}
		else {
			_onScreen = false;
		}
	},

	//update data for idle cycle animation
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

	//determine what to show the player when they click on the botanist
	show: function() {

    // Walk to botanist
    // Hacky. Player moves during game speech.
    var location = $game.$map.masterToLocal(71, 74)   // An arbitrary location by the Botanist
    $game.$player.beginMove(location.x, location.y)

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
					var _speak =  'To plant a seed, click the leaf icon at the bottom of the screen, and then click the area where you wish to plant. Oh, look at that, you have a seed already! Try and plant it, then talk to me again.';

          $game.$npc.showSpeechBubble($game.$botanist.name, _speak)
				}
				else {
					//ugly hack so we see Second set of instructions in level 0
					if(!_firstTime && $game.$player.currentLevel === 0) {
            // Player has completed seed tutorial
						_messages = $game.$botanist.dialog[$game.$player.currentLevel].instructions2;
						_currentMessage = 0;
						_firstTime = true;
            // Player now does progress window tutorial.
						$game.highlightUI('.progressButton')
						$game.$botanist.showChat();
						$game.$player.saveMapImage(true);
					} else {
						// This happens when player has finished progress tutorial.
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

	//i think this is unused
	showTangram: function() {
		var file = CivicSeed.CLOUD_PATH + '/img/game/tangram/puzzle' + $game.$player.currentLevel + '.png';
	},

	//determine which "chat" dialog to show
	showChat: function() {
    // $game.$npc.showSpeechBubble()
		//$speechBubbleP.removeClass('fitBubble');
		//$game.$audio.playTriggerFx('npcBubble');
		$game.$botanist.isChat = true;
		$game.$botanist.nextChatContent();
	},

	//remove chat from screen
	hideChat: function() {
		$speechBubble.fadeOut(function() {
			$speechBubbleBtn.hide();
			$speechBubbleCloseBtn.unbind('click');

			$game.$botanist.isChat = false;
			//save that the player has looked at the instructions
			if($game.$player.botanistState === 0 && $game.$player.currentLevel < 4) {
				$game.$player.botanistState = 1;
				_saveBotanistState();

				if($game.$player.currentLevel === 0) {
					//highlight the seed button
          $game.highlightUI('.seedButton')
					$game.$player.updateSeeds('regular', 1);
				}
			}
		});
	},

	//actually add the chat content to the dom and bind some actions
	addChatContent: function() {
		$speechBubbleBtn.hide();
		$speechBubbleNextBtn.show();
		$speakerName.text($game.$botanist.name);
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
			//jn all levels except 1 we want to show prompt instead of closing
			if($game.$player.currentLevel > 0) {
				$speechBubbleNextBtn.unbind('click');
				$speechBubbleNextBtn.bind('click', (function () {
					$game.$player.botanistState = 1;
					_saveBotanistState();
					$speechBubbleNextBtn.hide().unbind('click');
					$game.$botanist.showPrompt(0);
				}));
			} else {
				$speechBubbleNextBtn.unbind('click').hide();
				$speechBubbleCloseBtn.show().bind('click', (function () {
					$game.$botanist.hideChat();
				}));
			}
		}
	},

	//toggle thru the next chat data for botanist
	nextChatContent: function() {
		//show the next message if there are more in the bag
		if(_currentMessage < _messages.length) {
			$game.$botanist.addChatContent();
			_currentMessage += 1;
		}
	},

	//show the viewing tangram prompt
	showPrompt: function (prompt) {
		$game.$botanist.isChat = true;

		var dialogue = $game.$botanist.dialog[$game.$player.currentLevel].riddle.prompts[prompt];

    $game.$npc.showSpeechBubble($game.$botanist.name, dialogue, function () {
      if(prompt === 1) {
        $game.$botanist.isSolving = true;
        $('.displayBoxText').text('drag a piece to the board to use it');
        $botanistArea.addClass('puzzle-mode');
      }
      $game.$botanist.showRiddle(prompt);
    }, $botanist.hideChat)
	},

	//show the riddle if the inventory is open and it was clicked
	inventoryShowRiddle: function() {

		//hide the inventory if the resource is not already visible
		//when clicked on from inventory (this means it isn't in puzzle mode)
		if(!$game.$botanist.isShowing) {
			$inventory.slideUp();
			$game.$botanist.isChat = true;
			$game.$botanist.showRiddle(0);
		}
	},

	//show the riddle, its basically an image
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
			$speechBubbleBtn.hide();
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

	//determine which buttons to show based on what is being shown
	addButtons: function() {
		$('.botanistArea button').hide();

		//no buttons except close
		if(_promptNum === 0) {
			if(_currentSlide === 0) {
				if($game.$player.firstTime) {
					$('.botanistArea .nextButton').show();
				} else {
					$('.botanistArea .closeButton').show();
				}
			}
			else {
				$('.botanistArea .closeButton').show();
			}
		}
		else {
			if(_currentSlide === 0) {
				$('.botanistArea .answerButton').show();
				$('.botanistArea .clearBoardButton').show();
			}
			else if(_currentSlide === 1) {
				$('.botanistArea .nextButton').show();
			}
			else {
				$('.botanistArea .answerButton').show();
				//$('.botanistArea .clearBoardButton').show();
			}
		}
	},

	//advance to next slide content
	nextSlide: function() {
		_currentSlide += 1;
		$game.$botanist.addContent();
		$game.$botanist.addButtons();
	},

	//go to previous slide content
	previousSlide: function() {
		_currentSlide -= 1;
		$game.$botanist.addContent();
		$game.$botanist.addButtons();
	},

	//determine which content to add and add it
	addContent: function() {
		$('.botanistArea .speakerName').text($game.$botanist.name);
		//if _promptNum is 0, then it is the just showing the riddle no interaction
		if(_promptNum === 0) {
			if(_currentSlide === 0) {
				$botanistContent.empty()
				if($game.$player.botanistState > 1) {
					$botanistAreaMessage.text('Here is the notebook page to view again.');
				}
				else {
					$botanistAreaMessage.text('Here is the page. You will be able to view it at any time in your inventory.');

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
				$('.tangramOutline').html('<img src="' + imgPath + '">');
				$('.tangramArea').show()
			}
			else {
				if($game.$player.currentLevel === 0) {
					$game.$player.firstTime = false;
					var info = {
						id: $game.$player.id,
						firstTime: $game.$player.firstTime
					};
					ss.rpc('game.player.updateGameInfo', info);
					//add this tangram outline to the inventory
					$game.$player.tangramToInventory();
					$game.$player.botanistState = 2;

					_saveBotanistState();
					$game.$player.checkBotanistState();
					$game.$botanist.setBotanistState(2);
					$botanistAreaMessage.text('The pieces you need to complete this puzzle lie in Brightwood Forest, located in the northwest.');
					// $botanistContent.html('<p>To collect the pieces for the recipe, you must go out into the world and talk to its citizens by clicking on them. They will ask you questions.  Answer the questions to gain more <b>seeds</b> and, more importantly, <b>research</b> that will enable to you create paintbrush seeds..  When you think you have enough pieces to complete the recipe come see me again.</p><img class="miniExample" src="/img/game/minimap.png"><p>The pieces of the first recipe can be found in Brightwood Forest to the northwest of here.  Pictured to the right is the mini map display you can see in the top right corner of the game screen.  You can toggle this on/off by clicking the globe icon below.  The highlighted quadrant represents the Brightwood Forest, and I am the square in the center.</p><p>Level 1, <b>Looking Inward</b>, is about understanding one\'s own motivations, goals, social identities, ethics and values in the context of a larger society.  Before beginning work in the community, it is important to look within, and reflect on where you are coming from in order to move forward. The more you understand yourself, the better equipped you will be to becoming an aware and effective active citizen.</p><p>Click the help icon (<i class="fa fa-question-sign fa-lg"></i>) for more details on how to play.');
					$botanistContent.html('<p class="miniExample" ><img src="/img/game/minimap.png"></p><p>Go out and talk to the people you see. When you think you have all the pieces, come back to the center of the map and talk to me. Good luck!</p>');
				}
			}
		}
		//they are solving it, so riddle interface and stuff
		else {
			if(_currentSlide === 0) {
				$inventoryBtn.hide();
				$inventory.slideDown(function() {
					$game.$player.inventoryShowing = false;
					//set the inventory items to draggable in case they were off
					$inventoryItem.attr('draggable','true');
				});
				//$game.$botanist.dialog[$game.$player.currentLevel].riddle.sonnet
				$botanistAreaMessage.text('OK. Take the pieces you have gathered and drop them into the outline to create your seeds.');
				var imgPath1 = CivicSeed.CLOUD_PATH + '/img/game/tangram/puzzle'+$game.$player.currentLevel+'.png',
            imgPath2 = CivicSeed.CLOUD_PATH + '/img/game/trash.png';
				var newHTML = '<img src="' + imgPath1 + '"><img src="' + imgPath2 + '" class="trash">';
				$('.tangramOutline').html(newHTML);

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
					$inventoryBtn.show();
					$inventoryItem.remove();
				});

				var postTangramTalk = $game.$botanist.dialog[$game.$player.currentLevel].riddle.response;
				//console.log('posttangramtalk', postTangramTalk);
				$botanistAreaMessage.text(postTangramTalk);
				var newHTML2 = '<p>You earned a promotion to ' + $game.playerRanks[$game.$player.currentLevel + 1] + '!</p>',
					imgPath3 = CivicSeed.CLOUD_PATH + '/img/game/seed_chips.png';

				newHTML2 += '<div class="seedChips"><img src="' + imgPath3 +'"></div>';
				$botanistContent.html(newHTML2);
			}
			else {
				var endQuestion = _levelQuestion[$game.$player.currentLevel];
				$botanistAreaMessage.text(endQuestion);
				var inputBox = '<textarea placeholder="Type your answer here..." autofocus></textarea>';
				$botanistContent.html(inputBox);
			}
		}
	},

	//hide botanist window return game functionality
	hideResource: function() {
		//slide up the botanist area that contains big content
		//re-enable clicking by setting bools to false
		if($game.$player.firstTime && $game.$player.botanistState === 2) {
			$game.statusUpdate({message:'Level 1: Looking Inward.  See the log below for more details.',input:'status',screen: true,log:false});
			$game.statusUpdate({message:'Level 1 is about understanding one\'s own motivations, goals, social identities, ethics and values in the context of a larger society.  Before beginning work in the community, it is important to look within, and reflect on where you are coming from in order to move forward. The more you understand yourself, the better equipped you will be to becoming an aware and effective active citizen.',input:'status',screen: false, log: true});
		}
		$tangramArea.hide();
		$botanistArea.fadeOut(function() {
			$game.$botanist.isShowing = false;
			$('.botanist button').hide();
			$(this).removeClass('patternBg3').removeClass('puzzle-mode')
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
				$inventoryBtn.show();
				$('.inventoryPuzzle').show();
				$('.inventoryHelp').hide();
			});
		}
	},

	//when player submits answer must verify all pieces and respond accordingly
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
				message = 'At least TRY to solve it!';
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
				message = 'So close! You had the right pieces, just fix the placement.';
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
						totalSeeds = (30 + level * 4 ) + level * 4 * numSeeds;

					$game.$player.updateSeeds('draw', totalSeeds);
					$game.$player.botanistState = 4;
					_saveBotanistState();
				}
			}
			else {
				//display modal on current screen with feedback
				$game.$botanist.clearBoard();
				$game.$botanist.feedback(message);
			}

		}
		else {
			_paintbrushSeedFactor = 5;
			var portAnswer = $('.botanistContent textarea').val();
			$game.$player.resumeAnswer(portAnswer);
			$game.$player.nextLevel();
			$game.$botanist.hideResource();
			//upload the user's answer to the DB
		}
	},

	//preps the area for drag and drop puzzle mode
	setupTangram: function() {
		_svg = d3.select('.tangramArea').append('svg')
			.attr('class','puzzleSvg')

		_drag = d3.behavior.drag()
			.origin(Object)
			.on('drag', $game.$botanist.dragMove)
			.on('dragstart', $game.$botanist.dragMoveStart)
			.on('dragend', $game.$botanist.dropMove);
	},

	//when dragging starts from inventory must bind drop on puzzle area
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

	//when drop add it to puzzle area
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

	//this is dragging a puzzle piece on area and moving it around
	dragMoveStart: function(d) {
  		clearTimeout(_feedbackTimeout);
		$feedback.fadeOut('fast');

		_dragOffX = d3.mouse(this)[0],
		_dragOffY = d3.mouse(this)[1],

		d3.select('.br' + d.id)
			.attr('stroke-width', 3);
	},

	//make different color if over trash can
	dragMove: function(d) {
		var x = d3.event.sourceEvent.layerX,
			y = d3.event.sourceEvent.layerY,
			mX = x - _dragOffX,
			mY = y - _dragOffY,
			trashing = false;

		// If over trash area
		// TODO: Dynamically retrieve this area, don't hardcode the pixels
		if(x > 825 && x < 890 && y > 170 && y < 300) {
			$('.trash').addClass('active')
			trashing = true;
		}
		else {
			$('.trash').removeClass('active')
			trashing = false;
		}
		var trans = 'translate(' + mX  + ', ' + mY + ')';

		d3.select('.br' + d.id)
			.attr('transform',trans)
			.attr('opacity', function() {
				return trashing ? 0.5 : 1;
			});
	},

	//move puzzle piece or trash it (return to inventory) on drop
	dropMove: function(d) {
		var x = d3.event.sourceEvent.layerX,
			y = d3.event.sourceEvent.layerY,
			mX = $game.$botanist.snapTo(x - _dragOffX),
			mY = $game.$botanist.snapTo(y - _dragOffY),
			trans = 'translate(' + mX  + ', ' + mY + ')';

		d3.select('.br' + d.id)
			.attr('stroke-width',0)
			.attr('transform',trans);

		// If over trash area
		if(x > 825 && x < 890 && y > 170 && y < 300) {
			$('.br' + d.id).remove();
			$('.r' + d.id)
				.css('opacity', 1)
				.attr('draggable', 'true');
			$('.trash').removeClass('active')
		}
		else {
			d3.select('.br' + d.id)
			.attr('stroke-width',0)
			.attr('transform',trans);
		}
	},

	//remove all pieces from puzzle board return to inventory
	clearBoard: function() {
		$('.puzzleSvg').empty();
		$('.inventoryItem').css('opacity', 1).attr('draggable', 'true');
	},

	//when piece is moved snap to 10x10 grid
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

	//give user feedback on puzzle answer
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