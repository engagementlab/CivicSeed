var $body,
	_sprites = null;

var self = module.exports = {

	init: function() {
		$body = $(document.body);
		self.setup();
		self.loadSprites();
	},

	setup: function() {
		$body.on('click', '.saveChanges', function() {
			var id = parseInt($(this).attr('data-id'),10),
				npc = $('.npc' + id + ' textarea');
				holding = $(this).attr('data-holding'),
				questionType = $(this).attr('data-questionType'),
				saveButton = $(this),
				updates = {
					id: id
				};
			updates.dialog = [];
			updates.isHolding = holding;
			if(questionType !== 'open') {
				updates.possibleAnswers = [];
			}
			npc.each(function(i) {
				var area = $(this).attr('data-area'),
					val = this.value;
				if(area === 'question') {
					updates.question = val;
				} else if(area === 'prompt' || area === 'smalltalk') {
					updates.dialog.push(val);
				} else if(area === 'possibleAnswers') {
					updates.possibleAnswers.push(val);
				} else if(area === 'answer') {
					updates.answer = val;
				} else if(area === 'requiredlength') {
					updates.requiredlength = parseInt(val, 10);
				} else if(area === 'tagline') {
					updates.tagline = val;
				}
			});

			var parents = saveButton.parentsUntil('.npcs'),
				npcParent = $(parents[parents.length-1]),
				brother = saveButton.siblings('textarea');

			updates.sprite = parseInt(npcParent.attr('data-sprite'),10);
			updates.name = $(brother).val();
			console.log(updates);
			ss.rpc('admin.npcs.updateInformation', updates, function(err) {
				if(err) {
					console.log(err);
				} else {
					saveButton.addClass('justSaved');
					saveButton.text('Saved!');
					setTimeout(function(){
						saveButton.removeClass('justSaved');
						saveButton.text('Save Changes');
					}, 1000);
				}
			});
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
			var url = $(this).attr('data-url');
			$('.article').empty().load(url,function() {
				$('.buffer').show();
				$(this).show();
			});
		});

		$body.on('click', '.article, .buffer', function() {
			$('.article, .buffer').hide();
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
	}
};