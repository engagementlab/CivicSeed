'use strict'

var rootDir = process.cwd()
var winston = require('winston')
var xkcd = require('xkcd-pwgen')

var config = require(rootDir + '/app/config')
var NODE_ENV = config.get('NODE_ENV')

var emailUtil = require(rootDir + '/server/utils/email')
var accountHelpers = require(rootDir + '/server/utils/account-helpers')

var MAX_PLAYERS = 20

exports.actions = function (req, res, ss) {
  req.use('session')
  req.use('account.authenticated')

  var userModel = ss.service.db.model('User')
  var gameModel = ss.service.db.model('Game')
  var colorModel = ss.service.db.model('Color')

  var createUserAndSendInvite = function (email, instanceName, i) {
    // Note: All invites assume a NEW USER. This means if the user is
    // already in the system, this OVERWRITES their account.

    // TODO: Figure out how to work around this properly.

    userModel.findOne({ email: email }, function (err, user) {
      var nameParts
      if (err) {
        console.error('  Could not find \'actor\' user: %s'.red.inverse, err)
      } else {
        var password = xkcd.generatePassword()

        accountHelpers.hashPassword(password, function (hashedPassword) {
          nameParts = email.split('@')
          user = new userModel()

          user.firstName = nameParts[0]
          user.lastName = nameParts[1]
          user.school = 'university'
          user.password = hashedPassword.hash
          user.email = email
          user.role = 'actor'
          user.profilePublic = false
          user.profileLink = nameParts[0] + Math.random().toString(36).slice(2)
          user.profileSetup = false
          user.profileUnlocked = false
          user.gameStarted = false
          user.game = {
            instanceName: instanceName,
            currentLevel: 0,
            rank: 'nothing',
            position: {
              x: 64,
              y: 77
            },
            resources: [],
            resourcesDiscovered: 0,
            inventory: [],
            seeds: {
              regular: 0,
              draw: 0,
              dropped: 0
            },
            botanistState: 0,
            firstTime: true,
            resume: [],
            resumeFeedback: [],
            seenRobot: false,
            playingTime: 0,
            tilesColored: 0,
            pledges: 5,
            collaborativeChallenge: false,
            playerColor: generatePlayerColor(),
            skinSuit: {
              head: 'basic',
              torso: 'basic',
              legs: 'basic',
              unlocked: {
                head: ['basic'],
                torso: ['basic'],
                legs: ['basic']
              }
            }
          }
          console.log('Created user: ' + user.email)
          user.save(function (err) {
            if (err) {
              console.error('  Could not save \'actor\' user: '.red.inverse + user.firstName.red.inverse, err)
            } else {
              sendInviteEmail(user.firstName, password, user.email)
            }
          })
        })
      }
    })
  }

  var generatePlayerColor = function () {
    var numberOfColors = 24

    // TODO: Only return numbers that have not already been used per game session.
    return Math.floor(Math.random() * numberOfColors) + 1
  }

  var sendInviteEmail = function (firstName, password, email) {
    var content = ''
    var pregameSurveyLink = config.get('SURVEY_PREGAME_LINK')

    // Set up email template
    if (NODE_ENV !== 'production') {
      // Add a message to indicate a test invite (NOT from production server)
      content += '<p><strong style="color:red;">This is a test invite from the Civic Seed ' + NODE_ENV + ' server. Do not attempt to sign up for the game through this e-mail.</strong></p>'
    }

    content += '<h2>Why hello there, #{firstName}!</h2>'
    content += '<p style="color:green">WELCOME TO CIVIC SEED!</p>'
    if (pregameSurveyLink) {
      content += '<p>Please complete <a href="' + pregameSurveyLink + '">this survey</a> before playing the game.</p>'
    }
    content += '<p><a href="http://xkcd.com/936/">xkcd</a> generated you a fine password: '
    content += '<strong>#{password}</strong></p>'
    content += '<p>Your username is your email: <strong>#{email}</strong></p>'
    content += '<h3 style="color:green">You can get started by going <a href="http://civicseed.org/">here.</a></h3>'

    // Replace strings with custom content
    content = content.replace('#{firstName}', firstName)
    content = content.replace('#{password}', password)
    content = content.replace('#{email}', email)

    // Send e-mail
    emailUtil.sendEmail('Greetings from Civic Seed', content, email)
  }

  return {

    sendInvites: function (emailList, instanceName, i) {
      if (req.session.role && (req.session.role === 'superadmin' || req.session.role === 'admin')) {
        winston.info('\n\n   * * * * * * * * * * * *   Sending User Invites via Email   * * * * * * * * * * * *   \n\n'.yellow)
        winston.info(emailList.join(', ') + '\n\n')

        var emailListLength = emailList.length

        for (var j = 0; j < emailListLength; j++) {
          var email = emailList[j].toLowerCase()
          if (i) {
            // Not entirely sure what the difference is between i and iterator (j), but the #add-player-button from the Admin panel (see ./client/code/admin/admin.js) provides a digit for i.
            // It needs to return "true" for the admin panel to report an OK message on apprise.
            createUserAndSendInvite(email, instanceName, i)
          } else {
            createUserAndSendInvite(email, instanceName, j)
          }
        }

        res(true)
      } else {
        res(false)
      }
    },

    newGameInstance: function (info) {
      gameModel
      .where('instanceName').equals(info.instanceName)
      .select('instanceName')
      .find(function (err, results) {
        // if it doesn't exist, create new game instance
        if (err) {
          res(true, false)
        } else if (results.length > 0) {
          res(false, true)
        } else {
          var newGame = new gameModel()

          newGame.players = 0
          newGame.seedsDropped = 0
          newGame.seedsDroppedGoal = info.numPlayers * 130 // 130 is magic number (see calculation in trello)
          newGame.active = true
          newGame.bossModeUnlocked = false
          newGame.levelQuestion = ['What is your background?', 'Where do you like to work?', 'What time is it?', 'When are you done?']
          newGame.leaderboard = []
          newGame.levelNames = ['Level 1: Looking Inward', 'Level 2: Expanding Outward', 'Level 3: Working Together', 'Level 4: Looking Forward', 'Game Over: Profile Unlocked']
          newGame.instanceName = info.instanceName
          newGame.resourceResponses = {}

          newGame.save(function (err) {
            if (err) {
              console.log(err)
              // TODO: what??
              res(true, false)
            } else {
              console.log('game instance has been created')

              // put a single color in the world so we don't get an error when it searches
              // This is why there is a single colored tile at 0,0!!
              // TODO: Work around this
              var color = new colorModel()

              color.instanceName = info.instanceName
              color.x = 0
              color.y = 0
              color.mapIndex = 0
              color.color = {
                r: 255,
                g: 0,
                b: 0,
                a: 0.3
              }
              color.curColor = 'rgba(255,0,0,0.3)'
              color.save(function (err, okay) {
                if (err) {
                  console.log(err)
                } else if (okay) {
                  res(false, false)
                }
              })

              // add instance to creator / superadmin for monitor panels
              userModel
                .findById(info.id, function (err, user) {
                  if (err) {
                    console.log(err)
                  } else if (user) {
                    if (user.role !== 'superadmin') {
                      user.admin.instances.push(info.instanceName)
                      user.save()
                    }
                  }
                })

              userModel
                .where('role').equals('superadmin')
                .find(function (err, users) {
                  if (err) {
                    console.log(err)
                  } else if (users) {
                    for (var i = 0; i < users.length; i++) {
                      users[i].admin.instances.push(info.instanceName)
                      users[i].save()
                    }
                  }
                })
            }
          })
        }
      })
    },

    // Counts the number of players in a given game instance
    checkPlayerCount: function (instanceName) {
      // Returns false if game is full or there is an error...
      // Returns true if game still has room
      userModel.count({'game.instanceName': instanceName}, function (err, count) {
        if (err) {
          res(false)
          return
        }

        if (count >= MAX_PLAYERS) {
          res(false)
        } else {
          res(true)
        }
      })
    }
  }
}
