(function($) {


	var _init = function() {

		_setupLoaders();
		_setupInviteCodes();

	};

	var _setupLoaders = function() {
		$('#dataLoaders').on('click', '.btn', function(event) {
			var button = $(this),
			dataType = button.data().type;
			button.removeClass('btn-success');
			$.ajax({
				url: '/admin/startup/' + dataType,
				success: function(data) {
					console.log(data);
					button.addClass('btn-success');
				}
			});
		});
	};

	var _setupInviteCodes = function() {
		$('#sessionSelect').on('change', function(event) {
			var select = $(this);
			var val = select.val();
			$('#inviteCodesBtn').removeClass('btn-success');
			if(val === 'new') {
				$('#newSessionText').removeClass('hidden');
				$('#alterSessionText').addClass('hidden');
			} else {
				$('#alterSessionText').removeClass('hidden');
				$('#newSessionText').addClass('hidden');
			}
		});
		$('#inviteCodesBtn').on('click', function(event) {
			var button = $(this);
			var val = $('#sessionSelect').val();
			var sessionName;
			var url;
			var date;
			if(val === 'new') {
				sessionName = document.getElementById('sessionName').value;
				sessionName = sessionName.replace(/ /g, '.')
				if(sessionName === '') {
					date = new Date();
					sessionName = 'session.' + date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
					sessionName += '.' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
				}
				url = '/admin/action/create-invite-codes/' + sessionName;
			} else {
				url = '/admin/action/recreate-invite-codes/' + val;
			}
			// console.log(sessionName);
			// button.removeClass('btn-success');
			$.ajax({
				url: url,
				success: function(data) {
					$('#inviteCodes').text(data.join(',\n')).removeClass('hidden');
					button.addClass('btn-success');
				}
			});
		});
	};

	$(function() { _init(); })



})(jQuery);