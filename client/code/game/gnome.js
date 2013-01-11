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
	_feedbackTimeout = null;

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
				$game.$gnome.showPrompt(0);
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
		var file = '/img/game/tangrams/puzzle' + $game.$player.game.currentLevel + '.png';
		
	},

	showChat: function() {
		$game.$gnome.isChat = true;
		$game.$gnome.nextChatContent();
	},
	hideChat: function() {
		$('.speechBubble').slideUp(function() {
			$('.speechBubble button').addClass('hideButton');
			$('.speechBubble .closeChatButton').unbind('click');
			$game.$gnome.isChat = false;

			//save that the player has looked at the instructions
			if($game.$player.game.gnomeState === 0) {
				$game.$player.game.gnomeState = 1;
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
			$('.speechBubble').slideDown(function() {
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
		$game.$gnome.isChat = true;
		_speak =  $game.$gnome.dialog[$game.$player.game.currentLevel].riddle.prompts[p];

		$('.speechBubble .speakerName').text($game.$gnome.name+': ');
		$('.speechBubble .message').text(_speak);
		$('.speechBubble .yesButton, .speechBubble .noButton').removeClass('hideButton');
		$('.speechBubble').slideDown(function() {
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
		
		
		$('.speechBubble').slideUp(function() {
			$('.speechBubble button').addClass('hideButton');
			$('.speechBubble .yesButton').unbind('click');
			$('.speechBubble .noButton').unbind('click');

			$('.gnomeArea').slideDown(function() {
				$game.$gnome.isShowing = true;
				if(_currentSlide !== 2) {
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
				$('.gnomeArea .closeButton').removeClass('hideButton');
				$('.gnomeArea .backButton').removeClass('hideButton');
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
		
		//if _promptNum is 0, then it is the just showing the riddle and tangram
		if(_promptNum === 0) {
			if(_currentSlide === 0) {
				$('.gnomeArea .message').text('here is your next riddle whale thing.');
				$('.gnomeContent').html('<p>'+$game.$gnome.dialog[$game.$player.game.currentLevel].riddle.sonnet+'</p>');
			}
			else {
				//show them a different version if they already posses it
				
				if($game.$player.game.gnomeState > 1) {
					$('.gnomeArea .message').text('Here is the outline to view again.');
				}
				else {
					$('.gnomeArea .message').text('take this tangram outline, you can view it in the inventory.');
					
					//add this tangram outline to the inventory
					$game.$player.tangramToInventory();
					
					//update gnomeState
					$game.$player.game.gnomeState = 2;
					$game.$player.checkGnomeState();
				}
				
				$('.gnomeContent').html('<img src="img/game/tangram/puzzle'+$game.$player.game.currentLevel+'.png" class="tangramOutline">');
				
			}
		}
		//they are solving it, so riddle interface and stuff
		else {
			

			//combo riddle and puzzle interface
			if(_currentSlide === 0) {
				$('.inventory button').addClass('hideButton');
				$('.inventory').slideDown(function() {
					$game.$player.inventoryShowing = false;
					//set the inventory items to draggable in case they were off
					$('.inventoryItem').attr('draggable','true');
				});
				//$game.$gnome.dialog[$game.$player.game.currentLevel].riddle.sonnet
				$('.gnomeArea .message').text('Drag the pieces from the inventory to solve the puzzle.');
				var newHTML = '<p class="riddleText">'+ $game.$gnome.dialog[$game.$player.game.currentLevel].riddle.sonnet +'</p><img src="img/game/tangram/puzzle'+$game.$player.game.currentLevel+'.png" class="tangramOutline"><img class="trash" src="/img/game/trash.png">';
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

				$('.gnomeArea .message').text('Well done fella!  Here is a mega seed.');
				var newHTML2 = '<p class="riddleText">Mega seed:</p>';
				$('.gnomeContent').html(newHTML2);
			}
			else {
				var endQuestion = $game.levelQuestion[$game.$player.game.currentLevel];
				$('.gnomeArea .message').text(endQuestion);
				var inputBox = '<form><input></input></form>';
				$('.gnomeContent').html(inputBox);
			}
			
		}
	},

	hideResource: function() {
		//slide up the gnome area that contains big content
		//re-enable clicking by setting bools to false
		$('.tangramArea').hide();
		$('.gnomeArea').slideUp(function() {
			$game.$gnome.isShowing = false;
			$('.gnome button').addClass('hideButton');
			$('.gnomeArea').css('height','450px');
			$game.$gnome.isChat = false;
			$game.$gnome.isSolving = false;
			$game.changeStatus();
			$('.puzzleSvg').empty();
			$('.inventoryItem').css('opacity',1);

			//if they just beat a level, then show progreess
			if($game.$player.game.gnomeState === 0) {
				$game.showProgress();
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
						//this is a distance check if we don't do snapping
						
						// var dist = Math.abs(transX - answer.x) + Math.abs(transY - answer.y);
						// console.log('dist: ' + dist);
						// if(dist < 10) {
						// 	//console.log('winna');
						// }
						// else {
						// 	//console.log('close');
						// 	correct = false;
						// 	message = 'at least one piece is misplaced';
						// 	continue;
						// }

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
				message = 'at least TRY to solve it...';
			}
			else if(allTangrams.length < aLength) {
				correct= false;
				message = 'you are missing some';
			}
			else if(wrongOne) {
				message = 'at least one is incorrect';
			}
			else if(nudge) {
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
					$game.$player.game.seeds.riddle += 3;
					//update HUD 
					$('.seedButton2 .hudCount').text($game.$player.game.seeds.riddle);
					$game.$player.game.gnomeState = 4;
				}
			}
			else {
				//display modal on current screen with feedback
				$game.$gnome.feedback(message);
			}

		}
		else {
			$game.$player.nextLevel();
			$game.$gnome.hideResource();
			//upload the user's answer to the DB
			var portAnswer = $('.gnomeContent input').val();
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
			shape = $game.$resources.getShape(npc);

			//access with shape.path

		$('.r' + npc)
			.css('opacity','.4')
			.attr('draggable', 'false');
		
		_new = _svg.append('path')
			.attr('class',selector)
			.data([{x:x , y: y, id: npc, color: shape.fill}])
			.attr('d', shape.path)
			.attr('fill', shape.fill)
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
		
	},

	snapTo: function(num) {

		var result = num,
			thresh = 10,
			half = thresh / 2
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
