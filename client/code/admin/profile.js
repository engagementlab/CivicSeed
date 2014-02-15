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
				if (res) {
					apprise('changes saved');
				}
			});
		});

		$body.on('click', '.profileToggle', function() {
			var profilePublic = $(this).attr('data-public'),
				changeTo,
				newText,
				newClass;
			if (profilePublic === 'false' || !profilePublic) {
				profilePublic = 'true';
				changeTo = true;
				newText = 'your profile is public';
				newClass = 'fa fa-unlock-alt fa-4x';
			} else {
				profilePublic = 'false';
				changeTo = false;
				newText = 'your profile is private';
				newClass = 'fa fa-lock fa-4x';
			}
			//save the change to the user info

			//update dom
			$(this).attr('data-public',profilePublic);
			var p = $(this).find('p');
			$(p).text(newText);

			var i = $(this).find('i');
			$(i).removeClass().addClass(newClass);

			var updateInfo = {
				id: sessionStorage.getItem('userId'),
				changeTo: changeTo
			};
			ss.rpc('shared.profiles.setPublic', updateInfo, function(res) {
				//nothing to see here...
			});
		});

		$body.on('click', '.feedback', function() {
			var row = $(this).find('.row');
			$(row).toggleClass('hideth');
		});
	}
};