var $body;

var self = module.exports = {

  gameInstances: null,
  allQuestions: null,
  allAnswers: null,
  players: null,

  init: function () {

    $body = $(document.body);

    // NEED TO DO SOME SORT OF RPC CALL HERE TO MAKE SURE THIS NEVER CAN JUST HAPPEN UNLESS YOU HAVE THE RIGHT ROLE
    self.setupLoaders();
    self.setupInviteCodes();
    self.setupMonitor();
  },

  setupLoaders: function () {
    $body.on('click', '#admin-startup button', function (event) {
      var button   = $(this),
          dataType = button.data().type;

      button.removeClass('btn-success')
      button.find('.spinner').show()
      ss.rpc('admin.startup.loadData', dataType, function (res) {
        console.log(res)
        button.addClass('btn-success');
        button.find('.spinner').fadeOut()
      })
    })
  },

  setupInviteCodes: function () {
    // $('#sessionSelect').on('change', function (event) {
    //  // var select = $(this);
    //  // var val = select.val();
    //  $('#inviteCodesBtn').removeClass('btn-success');
    // });


    $body.on('click', '#inviteCodesBtn', function (event) {
      var button = $(this);
      button.removeClass('btn-success');
      // test emails:
      // russell@engagementgamelab.org, russell@russellgoldenberg.com, russell_goldenberg@emerson.edu, samuel.a.liberty@gmail.com, thebookofrobert@gmail.com, langbert@gmail.com, arxpoetica@gmail.com
      var emailList = $('#emailList').val().match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b/gi);
      // console.log(emailList);

      var instanceName = $('#instanceName').val().trim();

      if (instanceName && emailList) {
        emailList = emailList.slice(0, 20);
        emailListLength = emailList.length;
        var id = sessionStorage.getItem('userId');
        ss.rpc('admin.invitecodes.newGameInstance', {instanceName: instanceName, numPlayers: emailListLength, id: id}, function (err, res) {
          if (err) {
            console.log('error with db', err);
          } else if (res) {
            apprise('Cannot create this game: game name already exists.');
          } else {
            ss.rpc('admin.invitecodes.sendInvites', emailList, instanceName, function (res) {
              // console.log(res);
              button.addClass('btn-success');
            });
          }
        });
      }

      // var sessionName = document.getElementById('sessionName').value;
      // var date;
      // sessionName = sessionName.replace(/ /g, '.');
      // if (sessionName === '') {
      //  date = new Date();
      //  sessionName = 'session.' + date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
      //  sessionName += '.' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
      // }
      // // button.removeClass('btn-success');
      // $.ajax({
      //  url: '/admin/action/create-invite-codes/' + sessionName,
      //  success: function (data) {
      //    var select = $('#sessionSelect');
      //    select.append('<option value="' + sessionName + '">' + sessionName + '</option>');
      //    select.val(sessionName);
      //    $('#inviteCodes').text(data.join(',\n')).removeClass('hidden');
      //    button.addClass('btn-success');
      //  }
      // });
    });
  },

  setupMonitor: function () {
    self.getQuestions();
    $body.on('click', '#players', function () {
      var instance = $(this).attr('data-instance');
      ss.rpc('admin.monitor.getPlayers', instance, function (err, res) {
        if (res) {
          //console.log(res);
          self.players = res;
          self.showPlayersInfo(instance);
        }
      });
    });

    $body.on('click', '#questions', function () {
      var instance = $(this).attr('data-instance');
      self.showQuestions(instance);
    });

    $body.on('click', '#chat', function () {
      var instance = $(this).attr('data-instance');
      ss.rpc('admin.monitor.getRecentChat', instance, function (err, res) {
        if (res) {
          self.showChat(instance, res);
        }
      });
    });

    $body.on('click', '#addPlayer', function () {
      var instance = $(this).attr('data-instance');
      self.showAddPlayerForm(instance);
    });

    $body.on('click', '#startStop', function () {
      var instance = $(this).attr('data-instance');
      self.addStartStopButton(instance);
    });

    $body.on('click', '.viewAnswers', function () {
      var index = $(this).attr('data-index');
      self.showPlayerAnswers(index);
    });

    $body.on('click', '.stopGameButton', function () {
      var instance = $(this).attr('data-instance');
      self.toggleGame(instance, false);
    });

    $body.on('click', '.startGameButton', function () {
      var instance = $(this).attr('data-instance');
      self.toggleGame(instance, true);
    });

    $body.on('click', '.deletePlayer', function () {
      var id = $(this).attr('data-id'),
        word = $('.input' + id).val();
      if (word.indexOf('delete') > -1) {
        self.deletePlayer(id, this);
      } else {
        apprise('You must type “delete” to delete this user!');
      }
    });

    $body.on('click', '.allQuestion', function () {
      var npc = $(this).attr('data-npc'),
        instance = $(this).attr('data-instance');
      self.showQuestionAnswers(npc, instance,this);
    });

    $body.on('click', '.add-player-button', function (e) {
      e.preventDefault();

      var email        = $('#add-player-email').val().match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b/gi),
          instanceName = $(this).attr('data-instance');

      if (email) {
        ss.rpc('admin.invitecodes.getCount', instanceName, function (space) {
          if (space) {
            ss.rpc('admin.invitecodes.sendInvites', email, instanceName, space, function (okay) {
              if (okay) {
                apprise('New player(s) added successfully.');
                $('#add-player-email').val('');
              } else {
                apprise('Error adding new player.');
              }
            });
          } else {
            apprise('Cannot add player. The game is full.');
          }
        });
      } else {
        apprise('Invalid e-mail address.');
      }
      return false;
    });
  },

  showPlayersInfo: function (instance) {
    var html  = '<h2>All players</h2>' +
                '<p><strong>Game name: <span class="color-darkblue">' + instance + '</span></strong></p>';

    for(var i = 0; i < self.players.length; i++) {
      var playingTime = self.players[i].game.playingTime,
        hours = Math.floor(playingTime / 3600),
        hoursRemainder = playingTime % 3600,
        minutes = Math.floor(hoursRemainder / 60),
        seconds = playingTime % 60,
        time = hours + 'h ' + minutes + 'm ' + seconds + 's',
        isPlaying = self.players[i].activeSessionID ? true : false;

      html += '<div class="player' + self.players[i]._id + '"><h3>' + self.players[i].firstName + ' ' + self.players[i].lastName + '</h3>';
      html += '<p>Profile unlocked: ' + self.players[i].profileUnlocked + '</p>';
      html += '<p>Logged in: ' + isPlaying + '</p>';
      html += '<p>Time played: ' + time + '</p>';
      html += '<p>Resources collected: ' + self.players[i].game.resourcesDiscovered + ' / 42  <button data-index=' + i + ' class="viewAnswers btn btn-success" type="button">View Answers</button></p>';
      html += '<p>Enter "delete" to remove user permanently: <input class="input' + self.players[i]._id + '"></input><button data-id=' + self.players[i]._id + ' class="btn btn-danger deletePlayer" type="button">Delete User</button></p></div>';
    }
    $('.output').empty().append(html);
  },

  showChat: function (instance, chat) {
    var html  = '<h2>Recent Chat History</h2>' +
                '<p><strong>Game name: <span class="color-darkblue">' + instance + '</span></strong></p>' +
                '<div class="allChat">';
    if (chat.length === 0) {
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

  showAddPlayerForm: function (instance) {
    var html  = '<div class="row"><div class="col-sm-12">' +
                '<h2>Add Player</h2>' +
                '<p><strong>Game name: <span class="color-darkblue">' + instance + '</span></strong></p>' +
                '<p>You can add multiple new players providing a comma-separated list of e-mail addresses. Note that you cannot add more players than allowed inside each game session.</p>' +
                '</div></div>' +
                '<form id="addPlayerForm">' +
                '<div class="row control-group"><div class="col-sm-6 controls">' +
                '<input placeholder="email address(es)" id="add-player-email"></input>' +
                '</div><div class="col-sm-6">' +
                '<button data-instance="' + instance + '"class="btn btn-success add-player-button" type="submit">Add Player(s)</button>' +
                '</div></div>' +
                '</form>';
    $('.output').empty().append(html);
  },

  addStartStopButton: function (instance) {
    var html  = '<h2>Make the game active or inactive</h2>' +
                '<p><strong>Game name: <span class="color-darkblue">' + instance + '</span></strong></p>' +
                '<p><button data-instance="' + instance + '"class="btn btn-success startGameButton" type="button">Start Game</button></p><p><button data-instance="' + instance + '"class="btn btn-warning stopGameButton" type="button">Stop Game</button></p>';
    $('.output').empty().append(html);
  },

  getQuestions: function () {
    ss.rpc('admin.monitor.init', function (err,res) {
      if (res) {
        self.allQuestions = res.sort(self.sortByLevel);
      }
    });
  },

  showPlayerAnswers: function (index) {
    var resources = self.players[index].game.resources;
    var numNPC = self.allQuestions.length;
    var html = '<h2>' + self.players[index].firstName + ' '+ self.players[index].lastName+'</h2>';
    for (var i = 0; i < resources.length; i++) {
      var npc = resources[i],
        npcInt = npc.index;
      var n = 0,
        found = false,
        open = false;
      while(!found) {
        if (self.allQuestions[n].index === npcInt) {
          found = true;
          if (self.allQuestions[n].resource.questionType === 'open') {
            open = true;
            html += '<p class="question level' + self.allQuestions[n].level + '">Q: ' + self.allQuestions[n].resource.question + '</p>';
          }
        }
        n++;
        if (n >= numNPC) {
          found = true;
        }
      }
      //answer only if open ended
      if (open) {
        html += '<div class="answer"><p>A: ' + npc.answers[0] + '</p><div class="extras">';
        if (npc.madePublic) {
          //put unlocked icon
          html += '<i class="fa fa-unlock-alt fa-lg"></i>';
        }
        if (npc.seeded) {
          //thumbs up icon with number
          html += '<i class="fa fa-thumbs-up fa-lg"></i> ' + npc.seeded.length;
        }
        html += '</div></div>';
      }
    }
    $('.output').empty().append(html);
  },

  deletePlayer: function (id) {
    ss.rpc('admin.monitor.deletePlayer', id, function (err) {
      if (err) {
        console.log(err);
      } else {
        var sel = '.player' + id;
        $(sel).remove();
        apprise('Player deleted.');
      }
    });
  },

  toggleGame: function (instance, bool) {
    ss.rpc('admin.monitor.toggleGame', instance, bool, function (err) {
      if (err) {
        apprise('error switching game');
      } else {
        if (bool) {
          apprise('The game is now active.');
        } else {
          apprise('The game is now inactive.');
        }
      }
    });
  },

  showQuestions: function (instance) {
    var html  = '<h2>Open-ended questions</h2>' +
                '<p><strong>Game name: <span class="color-darkblue">' + instance + '</span></strong></p>';

    for(var q = 0; q < self.allQuestions.length; q++) {
      if (self.allQuestions[q].resource.questionType === 'open') {
        html += '<div class="allQuestion" data-instance="' + instance + '" data-npc="' + self.allQuestions[q].index +'">';
        html += '<p data-npc="' + self.allQuestions[q].index +'" class="mainQ level' + self.allQuestions[q].level + '">' + self.allQuestions[q].resource.question + '</p></div>';
      }
    }
    self.getAllAnswers(instance);
    $('.output').empty().append(html);
  },

  getAllAnswers: function (instance) {
    ss.rpc('admin.monitor.getInstanceAnswers', instance, function (err, res) {
      if (err) {
        self.allAnswers = [];
      } else if (res) {
        self.allAnswers = res.resourceResponses;
      }
    });
  },

  showQuestionAnswers: function (npc, instance, selector) {
    $('.allQuestion .allPlayerAnswers').remove();
    var html   = '',
        found  = false,
        npcInt = parseInt(npc,10);

    for (var i = 0; i < self.allAnswers.length; i++) {
      if (self.allAnswers[i].npc === npcInt) {
        found = true;
        html += '<p class="allPlayerAnswers"><span class="subWho">' + self.allAnswers[i].name + ': </span>';
        html += '<span class="subAnswer">' + self.allAnswers[i].answer + '</span></p>';
      }
    }
    if (!found) {
      html += '<p class="allPlayerAnswers">There are no answers for this question yet.</p>';
    }

    $(selector).append(html);
  },

  sortByLevel: function (a, b) {
    if (a.level < b.level) {
      return -1;
    }
    if (a.level > b.level) {
      return 1;
    }
    return 0;
  }
};
