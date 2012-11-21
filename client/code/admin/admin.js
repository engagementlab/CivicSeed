exports.init = function() {

	// NEED TO DO SOME SORT OF RPC CALL HERE TO MAKE SURE THIS NEVER CAN JUST HAPPEN UNLESS YOU HAVE THE RIGHT ROLE
	_setupLoaders();
	_setupInviteCodes();

};


// var _init = function() {

// 	_setupLoaders();
// 	_setupInviteCodes();

// };

// loaders on startup page
var _setupLoaders = function() {
	$('#dataLoaders').on('click', '.btn', function(event) {
		var button = $(this),
		dataType = button.data().type;
		button.removeClass('btn-success');
		// INSTEAD MAKE AN RPC CALL
		ss.rpc('admin.startup.loadData', dataType, function(res) {
			console.log(res);
			// console.log(data);
			button.addClass('btn-success');
		});
		// $.ajax({
		// 	url: '/admin/startup/' + dataType,
		// 	success: function(data) {
		// 		console.log(data);
		// 		button.addClass('btn-success');
		// 	}
		// });
	});
};

// invite codes page
var _setupInviteCodes = function() {
	$('#sessionSelect').on('change', function(event) {
		// var select = $(this);
		// var val = select.val();
		$('#inviteCodesBtn').removeClass('btn-success');
	});
	$('#inviteCodesBtn').on('click', function(event) {
		var button = $(this);
		var sessionName = document.getElementById('sessionName').value;
		var date;
		sessionName = sessionName.replace(/ /g, '.');
		if(sessionName === '') {
			date = new Date();
			sessionName = 'session.' + date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
			sessionName += '.' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
		}
		// button.removeClass('btn-success');
		$.ajax({
			url: '/admin/action/create-invite-codes/' + sessionName,
			success: function(data) {
				var select = $('#sessionSelect');
				select.append('<option value="' + sessionName + '">' + sessionName + '</option>');
				select.val(sessionName);
				$('#inviteCodes').text(data.join(',\n')).removeClass('hidden');
				button.addClass('btn-success');
			}
		});
	});
};

// $(function() { _init(); })