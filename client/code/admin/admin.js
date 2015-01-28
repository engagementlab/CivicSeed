'use strict';

var $body

var self = module.exports = {

  gameInstances: null,
  allQuestions: null,
  allAnswers: null,
  players: null,

  init: function () {

    $body = $(document.body)

    // NEED TO DO SOME SORT OF RPC CALL HERE TO MAKE SURE THIS NEVER CAN JUST HAPPEN UNLESS YOU HAVE THE RIGHT ROLE
    self.setupLoaders()
    self.setupMonitor()
  },

  setupLoaders: function () {
    $body.on('click', '#admin-startup button', function (event) {
      var button   = $(this),
          dataType = button.data().type

      if (button.prop('disabled')) {
        return
      }

      button.removeClass('btn-success btn-error')
      button.find('.spinner').show()

      // Disable all buttons while one is processing
      $('#admin-startup button').prop('disabled', true)

      ss.rpc('admin.startup.loadData', dataType, function (res) {
        if (res) {
          button.addClass('btn-success')
        } else {
          // Is this adequate for error, or should rpc return an error message?
          button.addClass('btn-error')
        }
        button.find('.spinner').fadeOut(function () {
          $('#admin-startup button').prop('disabled', false)
        })
      })
    })
  },

  setupMonitor: function () {
    self.getQuestions()
    $body.on('click', '#players', function () {
      var instance = $(this).attr('data-instance')
      ss.rpc('admin.monitor.getPlayers', instance, function (err, res) {
        if (res) {
          self.players = res
          self.showPlayersInfo(instance)
        }
      })
    })

    $body.on('click', '#questions', function () {
      var instance = $(this).attr('data-instance')
      self.showQuestions(instance)
    })

    $body.on('click', '#chat', function () {
      var instance = $(this).attr('data-instance')
      ss.rpc('admin.monitor.getRecentChat', instance, function (err, res) {
        if (res) {
          self.showChat(instance, res)
        }
      })
    })

    $body.on('click', '#addPlayer', function () {
      var instance = $(this).attr('data-instance')
      self.showAddPlayerForm(instance)
    })

    $body.on('click', '#startStop', function () {
      var instance = $(this).attr('data-instance')
      self.addStartStopButton(instance)
    })

    $body.on('click', '.viewAnswers', function () {
      var index = $(this).attr('data-index')
      self.showPlayerAnswers(index)
    })

    $body.on('click', '.stopGameButton', function () {
      var instance = $(this).attr('data-instance')
      self.toggleGame(instance, false)
    })

    $body.on('click', '.startGameButton', function () {
      var instance = $(this).attr('data-instance')
      self.toggleGame(instance, true)
    })

    $body.on('click', '.deletePlayer', function () {
      var id   = $(this).attr('data-id'),
          word = $('.input' + id).val()
      if (word.indexOf('delete') > -1) {
        self.deletePlayer(id, this)
      } else {
        apprise('You must type “delete” to delete this user!')
      }
    })

    $body.on('click', '.question.answer-toggle', function () {
      var npc      = $(this).attr('data-resource')
      var instance = $(this).attr('data-instance')

      self.showQuestionAnswers(npc, instance, this)
    })

    $body.on('click', '.add-player-button', function (event) {
      event.preventDefault()

      var email = $('#add-player-email').val().match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b/gi)
      var instanceName = $(this).attr('data-instance')

      if (email) {
        ss.rpc('admin.invitecodes.checkPlayerCount', instanceName, function (space) {
          if (space === true) {
            ss.rpc('admin.invitecodes.sendInvites', email, instanceName, space, function (okay) {
              if (okay) {
                apprise('New player(s) added successfully.')
                $('#add-player-email').val('')
              } else {
                apprise('Error adding new player.')
              }
            })
          } else {
            apprise('Cannot add player. The game is full.')
          }
        })
      } else {
        apprise('Invalid e-mail address.')
      }
      return false
    })
  },

  showPlayersInfo: function (instance) {
    var html  = '<h2>All players</h2>' +
                '<p><strong>Game name: <span class="color-darkblue">' + instance + '</span></strong></p>'

    for (var i = 0; i < self.players.length; i++) {
      var playingTime = self.players[i].game.playingTime,
          hours = Math.floor(playingTime / 3600),
          hoursRemainder = playingTime % 3600,
          minutes = Math.floor(hoursRemainder / 60),
          seconds = playingTime % 60,
          time = hours + 'h ' + minutes + 'm ' + seconds + 's',
          isPlaying = self.players[i].activeSessionID ? true : false

      html += '<div class="player' + self.players[i]._id + '"><h3>' + self.players[i].firstName + ' ' + self.players[i].lastName + '</h3>'
      html += '<p>Profile unlocked: ' + self.players[i].profileUnlocked + '</p>'
      html += '<p>Logged in: ' + isPlaying + '</p>'
      html += '<p>Time played: ' + time + '</p>'
      html += '<p>Resources collected: ' + self.players[i].game.resourcesDiscovered + ' / 42  <button data-index=' + i + ' class="viewAnswers btn btn-success" type="button">View Answers</button></p>'
      html += '<p>Enter "delete" to remove user permanently: <input class="input' + self.players[i]._id + '"></input><button data-id=' + self.players[i]._id + ' class="btn btn-danger deletePlayer" type="button">Delete User</button></p></div>'
    }
    $('.output').empty().append(html)
  },

  showChat: function (instance, chat) {
    var html = '<h2>Recent Chat History</h2>' +
               '<p><strong>Game name: <span class="color-darkblue">' + instance + '</span></strong></p>' +
               '<div class="allChat">'

    if (chat.length === 0) {
      html += '<p>No one has spoken yet.</p>'
    } else {
      for (var i = 0; i < chat.length; i++) {
        var date = chat[i].when.substring(0, 10),
            time = chat[i].when.substring(11, 20)
        html += '<p><span class="time">[' + date + ' || ' + time + ']</span><span class="who"> ' + chat[i].who + ' </span><span class="what">' + chat[i].what + '</span></p>'
      }
    }

    html += '</div>'
    $('.output').empty().append(html)
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
                '</form>'
    $('.output').empty().append(html)
  },

  addStartStopButton: function (instance) {
    var html  = '<h2>Make the game active or inactive</h2>' +
                '<p><strong>Game name: <span class="color-darkblue">' + instance + '</span></strong></p>' +
                '<p><button data-instance="' + instance + '"class="btn btn-success startGameButton" type="button">Start Game</button></p><p><button data-instance="' + instance + '"class="btn btn-warning stopGameButton" type="button">Stop Game</button></p>'
    $('.output').empty().append(html)
  },

  getQuestions: function () {
    ss.rpc('admin.monitor.init', function (err, res) {
      if (res) {
        self.allQuestions = res.sort(self.sortByLevel)
      }
    })
  },

  showPlayerAnswers: function (index) {
    var resources = self.players[index].game.resources
    var numNPC = self.allQuestions.length
    var html = '<h2>' + self.players[index].firstName + ' ' + self.players[index].lastName + '</h2>'

    for (var i = 0; i < resources.length; i++) {
      var resource = resources[i]
      var n = 0
      var found = false
      var open = false

      while (!found) {
        var question = self.allQuestions[n]
        if (question.resource.id === resource.id) {
          found = true
          console.log(question)
          if (question.resource.questionType === 'open') {
            open = true
            html += '<div class="question"><p class="level' + question.level + '">Q: ' + question.resource.question + '</p></div>'
          }
        }
        n++
        if (n >= numNPC) {
          found = true
        }
      }

      //answer only if open ended
      if (open) {
        html += '<div class="answer"><p>A: ' + resource.answers[0] + '</p><div class="extras">'
        if (resource.madePublic) {
          //put unlocked icon
          html += '<i class="fa fa-unlock-alt fa-lg"></i>'
        }
        if (resource.seeded) {
          //thumbs up icon with number
          html += '<i class="fa fa-thumbs-up fa-lg"></i> ' + resource.seeded.length
        }
        html += '</div></div>'
      }
    }
    $('.output').empty().append(html)
  },

  deletePlayer: function (id) {
    ss.rpc('admin.monitor.deletePlayer', id, function (err) {
      if (err) {
        console.log(err)
      } else {
        var sel = '.player' + id
        $(sel).remove()
        apprise('Player deleted.')
      }
    })
  },

  toggleGame: function (instance, bool) {
    ss.rpc('admin.monitor.toggleGame', instance, bool, function (err) {
      if (err) {
        apprise('error switching game')
      } else {
        if (bool) {
          apprise('The game is now active.')
        } else {
          apprise('The game is now inactive.')
        }
      }
    })
  },

  showQuestions: function (instance) {
    var html = '<h2>Open-ended questions</h2>' +
               '<p><strong>Game name: <span class="color-darkblue">' + instance + '</span></strong></p>'

    for (var q = 0; q < self.allQuestions.length; q++) {
      var question = self.allQuestions[q]

      if (question.resource.questionType === 'open') {
        html += '<div class="question answer-toggle" data-instance="' + instance + '" data-resource="' + question.resource.id +'">'
        html += '<p data-resource="' + question.resource.id +'" class="mainQ level' + question.level + '">' + question.resource.question + '</p></div>'
      }
    }

    self.getAllAnswers(instance)
    $('.output').empty().append(html)
  },

  getAllAnswers: function (instance) {
    ss.rpc('admin.monitor.getInstanceAnswers', instance, function (err, res) {
      if (err) {
        self.allAnswers = []
      } else if (res) {
        self.allAnswers = res.resourceResponses
      }
    })
  },

  showQuestionAnswers: function (npc, instance, selector) {
    var html = ''
    var found = false
    var npcInt = parseInt(npc, 10)

    $('.question .answers').remove()

    for (var i = 0; i < self.allAnswers.length; i++) {
      if (self.allAnswers[i].resourceId === npcInt) {
        found = true
        html += '<p class="answers"><span class="player-name">' + self.allAnswers[i].name + ': </span>'
        html += '<span class="player-answer">' + self.allAnswers[i].answer + '</span></p>'
      }
    }
    if (!found) {
      html += '<p class="answers">There are no answers for this question yet.</p>'
    }

    $(selector).append(html)
  },

  sortByLevel: function (a, b) {
    if (a.level < b.level) {
      return -1
    } else if (a.level > b.level) {
      return 1
    } else {
      return 0
    }
  }
}
