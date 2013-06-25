var $body;

var self = module.exports = {

	gameInstances: null,
	allQuestions: null,
	allAnswers: null,
	players: null,

	init: function() {

		$body = $(document.body);

		// NEED TO DO SOME SORT OF RPC CALL HERE TO MAKE SURE THIS NEVER CAN JUST HAPPEN UNLESS YOU HAVE THE RIGHT ROLE
		self.setupLoaders();
		self.setupInviteCodes();
		self.setupMonitor();
	},

	setupLoaders: function() {
		$body.on('click', '#dataLoaders .btn', function(event) {
			var button = $(this),
			dataType = button.data().type;
			button.removeClass('btn-success');
			ss.rpc('admin.startup.loadData', dataType, function(res) {
				//console.log(res);
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

			var instanceName = $('#instanceName').val().trim();

			if(instanceName && emailList) {
				emailList = emailList.slice(0, 20);
				emailListLength = emailList.length;
				ss.rpc('admin.invitecodes.newGameInstance', instanceName, emailListLength, function(err, res) {
					if(err) {
						console.log('error with db', err);
					} else if(res) {
						alert('game name already exists');
					} else {
						ss.rpc('admin.invitecodes.sendInvites', emailList, instanceName, function(res) {
							console.log(res);
							button.addClass('btn-success');
						});
					}
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
	},

	setupMonitor: function() {
		self.getQuestions();
		$body.on('click', '#players', function() {
			var instance = $(this).attr('data-instance');
			ss.rpc('admin.monitor.getPlayers', instance, function(err, res) {
				if(res) {
					//console.log(res);
					self.players = res;
					self.showPlayersInfo();
				}
			});
		});
		$body.on('click', '#questions', function() {
			var instance = $(this).attr('data-instance');
			self.showQuestions(instance);
		});
		$body.on('click', '#chat', function() {
			var instance = $(this).attr('data-instance');
			ss.rpc('admin.monitor.getRecentChat', instance, function(err, res) {
				if(res) {
					self.showChat(res);
				}
			});
		});
		$body.on('click', '.viewAnswers', function() {
			var index = $(this).attr('data-index');
			self.showPlayerAnswers(index);
		});

		$body.on('click', '.allQuestion', function() {
			var npc = $(this).attr('data-npc'),
				instance = $(this).attr('data-instance');
			self.showQuestionAnswers(npc, instance,this);
		});
	},

	showPlayersInfo: function() {
		var html = '';
		for(var i = 0; i < self.players.length; i++) {
			html += '<h2>' + self.players[i].firstName + ' ' + self.players[i].lastName + '</h2>';
			html += '<p>Profile unlocked: ' + self.players[i].profileUnlocked + '</p>';
			html += '<p>Is playing now: ' + self.players[i].isPlaying + '</p>';
			html += '<p>Time played: ' + Math.floor(self.players[i].game.playingTime/60) + ' min.</p>';
			html += '<p>Resources collected: ' + self.players[i].game.resources.length + ' / 42  <button data-index=' + i + ' class="viewAnswers btn btn-success" type="button">View Answers</button></p>';
			html += '<p>Enter "delete" to remove user permanently: <input></input><button data-id=' + self.players[i]._id + ' class="btn btn-danger" type="button">Delete User</button></p>';
		}
		$('.output').empty().append(html);
	},

	showChat: function(chat) {
		var html = '<h2>Recent Chat History</h2><div class="allChat">';
		if(chat.length === 0) {
			html += '<p>No one has spoken yet.</p>';
		} else {
			for(var i = 0; i < chat.length; i++) {
				var date = chat[i].when.substring(0,10),
					time = chat[i].when.substring(11,20);
				html += '<p><span class="time">[' + date + ' || ' + time + ']</span><span class="who"> ' + chat[i].who + ' </span><span class="what">' + chat[i].what + '</span></p>';
			}
		}

		html += '</div>';
		$('.output').empty().append(html);
	},

	getQuestions: function() {
		ss.rpc('admin.monitor.init', function(err,res) {
			if(res) {
				self.allQuestions = res;
				// console.log(res);
			}
		});
	},

	showPlayerAnswers: function(index) {
		var resources = self.players[index].game.resources;
		var numNPC = self.allQuestions.length;
		var html = '<h2>' + self.players[index].firstName + ' '+ self.players[index].lastName+'</h2>';
		for(var i = 0; i < resources.length; i++) {
			var npc = resources[i].npc;
			var n = 0,
				found = false,
				open = false;
			while(!found) {
				if(self.allQuestions[n].id === npc) {
					found = true;
					if(self.allQuestions[n].resource.questionType === 'open') {
						open = true;
						html += '<p class="question level' + self.allQuestions[n].level + '">Q: ' + self.allQuestions[n].resource.question + '</p>';
					}
				}
				n++;
				if(n >= numNPC) {
					found = true;
				}
			}
			//answer only if open ended
			if(open) {
				html += '<div class="answer"><p>A: ' + resources[i].answers[0] + '</p><div class="extras">';
				if(resources[i].madePublic) {
					//put unlocked icon
					html += '<i class="icon-unlock icon-large"></i>';
				}
				if(resources[i].seeded) {
					//thumbs up icon with number
					html += '<i class="icon-thumbs-up icon-large"></i> ' + resources[i].seeded.length;
				}
				html += '</div></div>';
			}
		}
		$('.output').empty().append(html);
	},

	showQuestions: function(instance) {
		var html = '<h2>All Open-Ended Questions</h2>';
		for(var q = 0; q < self.allQuestions.length; q++) {
			if(self.allQuestions[q].resource.questionType === 'open') {
				html += '<div class="allQuestion" data-instance="' + instance + '" data-npc="' + self.allQuestions[q].id +'">';
				html += '<p data-npc="' + self.allQuestions[q].id +'" class="mainQ level' + self.allQuestions[q].level + '">' + self.allQuestions[q].resource.question + '</p></div>';
			}
		}
		self.getAllAnswers(instance);
		$('.output').empty().append(html);
	},

	getAllAnswers: function(instance) {
		ss.rpc('admin.monitor.getInstanceAnswers', instance, function(err, res){
			if(res) {
				self.allAnswers = res.resourceResponses;
			} else {
				self.allAnswers = [];
			}
			
		});
	},

	showQuestionAnswers: function(npc, instance, selector) {
		$('.allQuestion .allPlayerAnswers').remove();
		var html = '',
			found = false,
			npcInt = parseInt(npc,10);
		for(var i = 0; i < self.allAnswers.length; i++) {
			if(self.allAnswers[i].npc === npcInt) {
				found = true;
				html += '<p class="allPlayerAnswers"><span class="subWho">' + self.allAnswers[i].name + ': </span>';
				html += '<span class="subAnswer">' + self.allAnswers[i].answer + '</span></p>';
			}
		}
		if(!found) {
			html += '<p class="allPlayerAnswers">There are no answers for this question yet.</p>';
		}

		$(selector).append(html);
	}
};