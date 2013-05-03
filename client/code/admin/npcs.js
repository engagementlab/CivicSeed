var $body;

var self = module.exports = {

	init: function() {

		$body = $(document.body);

		// NEED TO DO SOME SORT OF RPC CALL HERE TO MAKE SURE THIS NEVER CAN JUST HAPPEN UNLESS YOU HAVE THE RIGHT ROLE
		self.setup();
	},

	setup: function() {
		$body.on('click', '.saveChanges', function() {
			var id = $(this).attr('data-id'),
				npc = $('.npc' + id + ' textarea');
				holding = $(this).attr('data-holding'),
				saveButton = $(this),
				updates = {
					id: id
				},
				updates.dialog = [];
			if(holding) {
				updates.question = null;
				npc.each(function(i){
					var val = this.value;
					if(i === 0) {
						updates.question = val;
					} else {
						updates.dialog.push(val);
					}
				});
			} else {
				npc.each(function(i){
					var val = this.value;
					updates.dialog.push(val);
				});
			}
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
	}
};