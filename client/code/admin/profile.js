var $body;

var self = module.exports = {

	init: function() {

		$body = $(document.body);

		$body.on('click', '.saveProfileChanges', function() {
			var updates = [];
			var info = $('.resumeText');
			$.each(info, function(i, text) {
				var val = $(text).text();
				updates.push(val);
			});
			var updateInfo = {
				id: sessionStorage.getItem('userId'),
				resume: updates
			};
			ss.rpc('shared.profiles.updateResume', updateInfo, function(res) {
				if(res) {
					alert('changes saved');
				}
			});
		});
	}
};