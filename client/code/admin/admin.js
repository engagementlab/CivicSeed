var $body;

var self = module.exports = {

	init: function() {

		$body = $(document.body);

		// NEED TO DO SOME SORT OF RPC CALL HERE TO MAKE SURE THIS NEVER CAN JUST HAPPEN UNLESS YOU HAVE THE RIGHT ROLE
		self.setupLoaders();
		self.setupInviteCodes();

	},

	setupLoaders: function() {
		$body.on('click', '#dataLoaders .btn', function(event) {
			var button = $(this),
			dataType = button.data().type;
			button.removeClass('btn-success');
			ss.rpc('admin.startup.loadData', dataType, function(res) {
				console.log(res);
				button.addClass('btn-success');
			});
		});
	},

	setupInviteCodes: function() {
		// $('#sessionSelect').on('change', function(event) {
		// 	// var select = $(this);
		// 	// var val = select.val();
		// 	$('#inviteCodesBtn').removeClass('btn-success');
		// });


		$body.on('click', '#inviteCodesBtn', function(event) {
			var button = $(this);
			button.removeClass('btn-success');
			// test emails:
			// russell@engagementgamelab.org, russell@russellgoldenberg.com, russell_goldenberg@emerson.edu, samuel.a.liberty@gmail.com, thebookofrobert@gmail.com, langbert@gmail.com, arxpoetica@gmail.com
			var emailList = $('#emailList').val().match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b/gi);
			// console.log(emailList);

			if(emailList) {
				ss.rpc('admin.invitecodes.sendInvites', emailList, function(res) {
					console.log(res);
					button.addClass('btn-success');
				});
			}


			// var sessionName = document.getElementById('sessionName').value;
			// var date;
			// sessionName = sessionName.replace(/ /g, '.');
			// if(sessionName === '') {
			// 	date = new Date();
			// 	sessionName = 'session.' + date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
			// 	sessionName += '.' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
			// }
			// // button.removeClass('btn-success');
			// $.ajax({
			// 	url: '/admin/action/create-invite-codes/' + sessionName,
			// 	success: function(data) {
			// 		var select = $('#sessionSelect');
			// 		select.append('<option value="' + sessionName + '">' + sessionName + '</option>');
			// 		select.val(sessionName);
			// 		$('#inviteCodes').text(data.join(',\n')).removeClass('hidden');
			// 		button.addClass('btn-success');
			// 	}
			// });
		});
	}



};