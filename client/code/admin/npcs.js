var $body,
	_sprites = null;

var self = module.exports = {

	init: function() {
		$body = $(document.body);
		self.setup();
		self.loadSprites();
	},

	setup: function() {
		$body.on('click', '.levelFilter p', function() {
			var level = parseInt($(this).text(),10);
			$(this).toggleClass('current');
			var show = $(this).hasClass('current'),
				npcSel = '.level' + (level - 1);
			if(show) {
				$(npcSel).show();
			} else {
				$(npcSel).hide();
			}
		});

		$body.on('click', '.saveChanges', function() {
			var id = parseInt($(this).attr('data-id'),10);
			self.saveChanges(id);
		});

		$body.on('click', '.deleteNpc', function() {
			var id = parseInt($(this).attr('data-id'),10);
			self.deleteNpc(id);
		});

		$body.on('click', '.spriteUp', function() {
			var parents = $(this).parentsUntil('.npcs'),
				npc = $(parents[parents.length-1]),
				sprite = npc.attr('data-sprite'),
				bg = $(parents[1]);
			if(sprite > 0) {
				sprite--;
				var locY = sprite * -64,
					pos = '0 ' + locY + 'px';
				bg.css({
					'background-position': pos
				});
				npc.attr('data-sprite', sprite);
			}
		});

		$body.on('click', '.spriteDown', function() {
			var parents = $(this).parentsUntil('.npcs'),
				npc = $(parents[parents.length-1]),
				sprite = npc.attr('data-sprite'),
				bg = $(parents[1]);
			if(sprite < 51) {
				sprite++;
				var locY = sprite * -64,
					pos = '0 ' + locY + 'px';
				bg.css({
					'background-position': pos
				});
				npc.attr('data-sprite', sprite);
			}
		});

		$body.on('click', '.viewResource', function() {
			//get the text from the url textarea
			var parent = $(this).parentsUntil('.npc'),
				urlArea = parent.find('.url'),
				url = '/articles/' + $(urlArea).val() + '.html';

			$('.article').empty().load(url,function() {
				$('.buffer').show();
				$(this).show();
			});
		});

		$body.on('click', '.addNpc', function() {
			//TODO: figure out id (inc +1 on prev highest)
			var clone = $('.npcTemplate .npc').clone();
			$(clone).insertBefore('.addDiv');
		});

		$body.on('click', '.article, .buffer', function() {
			$('.article, .buffer').hide();
		});

		$body.on('change', 'input[type="checkbox"]', function () {
			//toggle the display for the input boxes
			var holding = this.checked ? true : false;
				parents = $(this).parentsUntil('.npcs'),
				npcParent = $(parents[parents.length-1]);

			if(holding) {
				$(npcParent).find('.resource').show();
				$(npcParent).find('.prompts').show();
				$(npcParent).find('.smalltalk').hide();
			} else {
				$(npcParent).find('.resource').hide();
				$(npcParent).find('.prompts').hide();
				$(npcParent).find('.smalltalk').show();
			}
		});

		$body.on('change', 'input[type="radio"]', function () {
			var questionType = $(this).val(),
				parents = $(this).parentsUntil('.npcs'),
				npcParent = $(parents[parents.length-1]);
			$(npcParent).find('.questionOptions').hide();

			if(questionType === 'open') {
				$(npcParent).find('.requiredDiv').show();
			} else {
				if(questionType === 'multiple') {
					$(npcParent).find('.possibleDiv').show();
				}
				$(npcParent).find('.answerDiv').show();
			}
		});
	},

	loadSprites: function() {
		_sprites = new Image();
		_sprites.src = CivicSeed.CLOUD_PATH + '/img/game/npcs.png';
		_sprites.onload = function() {

			// _tilesheetCanvas = document.createElement('canvas');
			// _tilesheetCanvas.setAttribute('width', _currentTilesheet.width);
			// _tilesheetCanvas.setAttribute('height', _currentTilesheet.height);
			// _tilesheetContext = _tilesheetCanvas.getContext('2d');
		};
	},

	addSprites: function() {
		var npc = $('.npc');
			url = 'url(' + CivicSeed.CLOUD_PATH + '/img/admin/npcs.png' + ')';
		npc.each(function(i){
			var sprite = $(this).attr('data-sprite'),
				locY = sprite * -64,
				pos = '0 ' + locY + 'px',
				info = $(this).find('.bg');

				info.css({
				'background-image': url,
				'background-repeat': 'no-repeat',
				'background-position': pos
			});
		});
	},

	saveChanges: function(id) {
		var npc = $('.npcs').find('.npc' + id);
			informationAreas = npc.find('.information textarea'),
			resourceAreas = npc.find('.resource textarea'),
			promptAreas = npc.find('.prompts textarea'),
			smalltalkAreas = npc.find('.smalltalk textarea'),
			holding = npc.find('.information input')[0].checked,
			questionType = npc.find('.resource input:checked').val(),
			sprite = parseInt(npc.attr('data-sprite'),10),
			updates = {
				id: id,
				isHolding: holding,
				resource: {
					url: null,
					questionType: questionType,
					answer: null,
					question: null,
					possibleAnswers: [],
					tagline: null,
					feedbackRight: null,
					feedbackWrong: null,
					dependsOn: []
				},
				dialog: {
					prompts: [],
					smalltalk: []
				},
				level: null,
				sprite: sprite,
				index: null,
				name: null
			};

		//update information
		var x,y;
		informationAreas.each(function(i) {
			var area = $(this).attr('data-area'),
				val = this.value;

			if(area === 'name') {
				updates.name = val;
			} else if(area === 'level') {
				updates.level = parseInt(val, 10) - 1;
			} else if(area === 'x') {
				x = parseInt(val, 10);
			} else if(area === 'y') {
				y = parseInt(val, 10);
			}
		});

		updates.index = y * 142 + x;

		resourceAreas.each(function(i) {
			var area = $(this).attr('data-area'),
				val = this.value;

			if(area === 'url') {
				updates.resource.url = val;
			} else if(area === 'question') {
				updates.resource.question = val;
			} else if(area === 'possibleAnswers') {
				updates.resource.possibleAnswers.push(val);
			} else if(area === 'answer') {
				updates.resource.answer = val;
			} else if(area === 'requiredLength') {
				updates.resource.requiredlength = parseInt(val, 10);
			} else if(area === 'tagline') {
				updates.resource.tagline = val;
			} else if(area === 'dependsOn') {
				updates.resource.dependsOn.push(parseInt(val, 10));
			} else if(area === 'feedbackRight') {
				updates.resource.feedbackRight = val;
			} else if(area === 'feedbackWrong') {
				updates.resource.feedbackWrong = val;
			}
		});

		promptAreas.each(function(i) {
			var area = $(this).attr('data-area'),
				val = this.value;

			if(area === 'prompt') {
				updates.dialog.prompts.push(val);
			}
		});

		smalltalkAreas.each(function(i) {

			var area = $(this).attr('data-area'),
				val = this.value;

			if(area === 'smalltalk') {
				updates.dialog.smalltalk.push(val);
			}
		});

		//this means it is a new one, do not save, but add new in db
		if(id < 0) {
			//figure out id
			var max = 0;
			$('.saveChanges').each(function(i){
				var id = parseInt($(this).data('id'),10);
				if(id > max) {
					max = id;
				}
			}); 
			max++;
			updates.id = max;
			//TODO: update information on client
			//.npc: level, npc
			var levelClass = 'level' + updates.level,
				npcClass = 'npc' + updates.id;
			npc.removeClass().addClass('npc').addClass(levelClass).addClass(npcClass);
			//options buttons
			var saveButton = npc.find('.saveChanges'),
				deleteButton = npc.find('.deleteNpc');
			$(saveButton).attr('data-id', updates.id);
			$(deleteButton).attr('data-id', updates.id);
			ss.rpc('admin.npcs.addNpc', updates, function(err) {
				if(err) {
					console.log(err);
				} else {
					var saveButton = npc.find('.saveChanges');
					$(saveButton).addClass('justSaved');
					setTimeout(function(){
						$(saveButton).removeClass('justSaved');
					}, 1000);
				}
			});
		} else {
			ss.rpc('admin.npcs.updateInformation', updates, function(err) {
				if(err) {
					console.log(err);
				} else {
					var saveButton = npc.find('.saveChanges');
					var levelClass = 'level' + updates.level,
						npcClass = 'npc' + updates.id;
						npc.removeClass().addClass('npc').addClass(levelClass).addClass(npcClass);
					$(saveButton).addClass('justSaved');
					setTimeout(function(){
						$(saveButton).removeClass('justSaved');
					}, 1000);
				}
			});
		}
	},

	deleteNpc: function(id) {
		var confirm = prompt('please type "delete" to permanently remove the npc.');
		if(confirm === 'delete') {
			var npc = $('.npc' + id);

			//this means it has never been saved, delete it from client
			if(id < 0) {
				npc.fadeOut(function() {
					this.remove();
				});
			} else {
				ss.rpc('admin.npcs.deleteNpc',id, function(err,res) {
					if(err) {
						console.log(err);
					} else {
						npc.fadeOut(function() {
							this.remove();
						});
					}
				});
			}
		}
	}

};