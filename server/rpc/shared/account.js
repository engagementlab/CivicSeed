'use strict'

var rootDir = process.cwd()
var bcrypt = require('bcrypt')
var xkcd = require('xkcd-pwgen')
var winston = require('winston')
var config = require(rootDir + '/app/config')
var accountHelpers = require(rootDir + '/server/utils/account-helpers')
var emailUtil = require(rootDir + '/server/utils/email')
var EMAIL_TO = config.get('EMAIL_TO')
var _countdown = 10
var singleHtml

var html = ''

html += '<h2>Password reminder for #{firstName}</h2>'
html += '<p style="color:red;">Someone is requesting access to your account.'
html += 'If you did not request this information, you can ignore and delete this email.</p>'
html += '<p>Your username is: &ldquo;<strong>#{email}</strong>&rdquo; ✔</p>'
html += '<p>Your password is: &ldquo;<strong>#{password}</strong>&rdquo; ✔</p>'

exports.actions = function (req, res, ss) {
  req.use('session')

  var UserModel = ss.service.db.model('User')
  var GameModel = ss.service.db.model('Game')

  var _setUserSession = function (user) {
    req.session.setUserId(user.id)
    req.session.firstName = user.firstName
    req.session.lastName = user.lastName
    req.session.email = user.email
    req.session.role = user.role
    req.session.game = user.game
    req.session.gameStarted = user.gameStarted
    req.session.profileSetup = user.profileSetup
    req.session.profileLink = user.profileLink
    req.session.channel.subscribe(user.game.instanceName)
    req.session.save()
    return {
      id: req.session.userId,
      firstName: req.session.firstName,
      lastName: req.session.lastName,
      email: req.session.email,
      role: req.session.role,
      game: req.session.game,
      gameStarted: req.session.gameStarted,
      profileSetup: req.session.profileSetup,
      profileLink: req.session.profileLink
    }
  }

  var dbHelpers = {
    checkGameActive: function (instance, callback) {
      GameModel
        .where('instanceName').equals(instance)
        .findOne(function (err, game) {
          if (err) {
            callback(false)
          } else {
            callback(game.active)
          }
        })
    }
  }

  return {

    authenticate: function (email, password) {
      winston.info('Checking authentication for ', email)
      UserModel.findOne({ email: email }, function (err, user) {
        if (err) {
          // Placeholder for error handling
        } else if (user) {
          bcrypt.compare(password, user.password, function (err, authenticated) {
            if (err) {
              // Placeholder for error handling
            } else if (authenticated) {
              res({ status: true, session: _setUserSession(user) })
            } else {
              res({ status: false, reason: 'Incorrect password.' })
            }
          })
        } else {
          res({ status: false, reason: 'No user exists with that email.' })
        }
      })
    },

    deAuthenticate: function () {
      winston.info('Deauthenticating...')
      // console.log(req.session.firstName, req.session.email, req.session.role, req.session.gameChannel, req.session.userId);

      var sessionId = req.sessionId
      var sessionEmail = req.session.email

      // MONGO
      UserModel.findOne({ email: sessionEmail }, function (err, user) {
        if (err) {
          // Placeholder for error handling
        } else if (user && user.activeSessionID && user.activeSessionID === sessionId) {
          // req.session.activeSessionID = null;
          // req.session.save();
          user.set({ activeSessionID: null })
          user.save(function (error) {
            if (error) {
              console.log('Error making active session ID null in mongodb'.red)
            } else {
              console.log('Active session ID made null in mongodb'.green)
            }
          })
        }
      })

      // REDIS
      // NOTE: these cannot depend on each other: REDIS and MONGO deletions have to be independent
      req.session.setUserId(null)
      req.session.save(function(error) {
        if (error) {
          console.error('User session destroy failed!'.red)
          res({ status: false, reason: error })
        } else {
          // console.error('User session destroyed!'.red)
          // console.log(req.session.firstName, req.session.email, req.session.role, req.session.gameChannel, req.session.userId);
          req.session.channel.reset()
          res({ status: true, reason: 'Session destroyed.' })
        }
      })
    },

    getUserSession: function () {
      if (req.session.userId) {
        res({
          id: req.session.userId,
          firstName: req.session.firstName,
          lastName: req.session.lastName,
          email: req.session.email,
          role: req.session.role,
          game: req.session.game,
          gameStarted: req.session.gameStarted,
          profileSetup: req.session.profileSetup,
          profileLink: req.session.profileLink
        })
      } else {
        res('NOT_AUTHENTICATED')
      }
    },

    checkGameSession: function () {
      dbHelpers.checkGameActive(req.session.game.instanceName, function (active) {
        if (active) {
          UserModel.findById(req.session.userId, function (error, user) {
            if (error || !user) {
              console.error('Error finding user (game) session in Mongo.'.red)
              res({
                status: false,
                reason: error
              })
            } else {
              if (user.activeSessionID) {
                console.log(user.activeSessionID, req.sessionId)

                if (user.activeSessionID === req.sessionId) {
                  // NOTE: this is sort of a weird scenario -- not sure it's even needed to check it!
                  console.log('Active session matches session ID -- good to go!'.green)
                  res({ status: true })
                } else {
                  console.error('Active session ID does not match session ID.'.red)
                  res({ status: false })
                  ss.publish.user(user.id, 'verifyGameStatus', {
                    countdown: _countdown,
                    userId: user.id,
                    profileLink: user.profileLink
                  })
                }
              } else {
                console.log('No active session ID.')
                // req.session.activeSessionID = req.sessionId;
                // req.session.save();
                // make sure to save the active session to mongodb, so we can look it up again
                user.set({ activeSessionID: req.sessionId })
                user.save(function (error) {
                  if (error) {
                    console.error('Error saving active session ID to mongodb'.red)
                    res({
                      status: false,
                      reason: error,
                      profileLink: user.profileLink
                    })
                  } else {
                    console.log('Active session ID saved to mongodb'.green)
                    res({ status: true })
                  }
                })
              }
            }
          })
        } else {
          console.log('Game inactive')
          res({ status: false })
          ss.publish.user(req.session.userId, 'inactiveGameRedirect', {
            profileLink: req.session.profileLink
          })
        }
      })
    },

    denyNewSession: function (req) {
      ss.publish.user(req.userId, 'denyNewSession', req)
    },

    approveNewSession: function (userId) {
      ss.publish.user(userId, 'approveNewSession', userId)
    },

    setActiveSessionId: function (userId) {
      UserModel.findById(userId, function (error, user) {
        if (error) {
          console.error('Error finding user in Mongo.'.red)
        } else {
          // req.session.activeSessionID = req.sessionId;
          // req.session.save();
          user.set({ activeSessionID: req.sessionId })
          user.save(function (error) {
            if (error) {
              console.error('Error saving active session ID to mongodb'.red)
            } else {
              console.log('Saved a new activeSessionID'.green)
            }
          })
        }
      })
    },

    remindMeMyPassword: function (email) {
      UserModel.findOne({ email: email }, function (err, user) {
        if (!err && user) {
          // TODO THIS AUTO RESETS without creds!!
          var password = xkcd.generatePassword()
          accountHelpers.hashPassword(password, function (hashedPassword) {
            user.password = hashedPassword.hash

            singleHtml = html.replace('#{firstName}', user.firstName)
            singleHtml = singleHtml.replace('#{email}', user.email)
            singleHtml = singleHtml.replace('#{password}', password)

            user.save(function (err) {
              if (err) {
                res(false)
              } else {
                emailUtil.sendEmail('Password reset from Civic Seed', singleHtml, user.email, function (err, response) {
                  if (err) {
                    res(false)
                  } else {
                    res(true)
                  }
                })
              }
            })
          })
        } else {
          res(false)
        }
      })
    },

    sendMessage: function (email, message) {
      var messageHTML = ''

      messageHTML += '<h2>Civic Seed contact form submission</h2>'
      messageHTML += '<p><strong>E-mail:</strong> ' + email + '</p>'
      messageHTML += '<p><strong>Message:</strong> ' + message + '</p>'

      emailUtil.sendEmail('Civic Seed contact form submission', messageHTML, EMAIL_TO, function (err, response) {
        if (err) {
          res(false)
        } else {
          res(true)
        }
      })
    },

    changeInfo: function (info) {
      UserModel.findOne({ email: req.session.email }, function (err, user) {
        if (!err && user) {
          user.set({
            firstName: info.first,
            lastName: info.last,
            school: info.school,
            profileSetup: true
          })
          user.save(function (err, suc) {
            if (!err && suc) {
              req.session.firstName = info.first
              req.session.lastName = info.last
              req.session.save()
              res({firstName: info.first, lastName: info.last})
            } else {
              res(false)
            }
          })
        } else {
          res(false)
        }
      })
    },

    startGame: function () {
      UserModel.findOne({ email: req.session.email }, function (err, user) {
        if (err) {
          // Placeholder for error handling
        } else if (user) {
          user.set({
            gameStarted: true
          })
          user.save(function (err, suc) {
            if (err) {
              // Placeholder for error handling
            } else {
              res(true)
            }
          })
        }
      })
    }

  }
}
