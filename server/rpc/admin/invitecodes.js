var rootDir = process.cwd(),
    emailUtil = require(rootDir + '/server/utils/email'),
    accountHelpers = require(rootDir + '/server/utils/account-helpers'),
    xkcd = require('xkcd-pwgen'),
    service = require(rootDir + '/service'),
    userModel = service.useModel('user', 'preload'),
    gameModel = service.useModel('game', 'preload'),
    colorModel = service.useModel('color', 'preload'),
    emailListLength,
    emailIterator,
    singleHtml;

var html  = '<h2>Why hello there, #{firstName}!</h2>';
    html += '<p style="color:green;">WELCOME TO CIVIC SEED!</p>';
    html += '<p>Please complete <a href="http://bit.ly/CivicSeed">this survey</a> before playing the game.</p>';
    html += '<p><a href="http://xkcd.com/936/">xkcd</a> generated you a fine password: ';
    html += '<strong>#{password}</strong></p>';
    html += '<p>Your username is your email: <strong>#{email}</strong></p>';
    html += '<h3 style="color:green;">You can get started by going <a href="http://civicseed.org/">here.</a></h3>';

exports.actions = function (req, res, ss) {

  req.use('session');
  // req.use('debug');
  req.use('account.authenticated');

  var colorData = require(rootDir + '/data/colors');

  var createUserAndSendInvite = function(email, instanceName, i) {
    userModel.findOne({ email: email }, function(err, user) {
      var nameParts;
      if(err) {
        console.error('  Could not find \'actor\' user: %s'.red.inverse, err);
      } else {
        if(!user) {
          var newColor = colorData.global[i],
            tilesheetNum = i + 1;

          var password = xkcd.generatePassword();
          accountHelpers.hashPassword(password, function(hashedPassword) {
            nameParts = email.split('@');
            user = new userModel();
            user.firstName = nameParts[0];
            user.lastName = nameParts[1];
            user.school = 'university';
            user.password = hashedPassword.hash;
            user.email = email;
            user.role = 'actor';
            user.profilePublic = false;
            user.profileLink = nameParts[0] + Math.random().toString(36).slice(2);
            user.profileSetup = false;
            user.profileUnlocked = false;
            user.gameStarted = false;
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
            };
            console.log('Created user: ' + user.email);
            user.save(function(err) {
              if(err) {
                console.error('  Could not save \'actor\' user: '.red.inverse + user.firstName.red.inverse, err);
              } else {
                singleHtml = html.replace('#{firstName}', user.firstName);
                singleHtml = singleHtml.replace('#{password}', password);
                singleHtml = singleHtml.replace('#{email}', user.email);
                emailUtil.sendEmail('Greetings from Civic Seed', singleHtml, user.email);
                if(i === emailListLength - 1) {
                  emailUtil.closeEmailConnection();
                  console.log('All emails have been sent...');
                  res(true);
                }
              }
            });
          });
        } else {
          if(i === emailListLength - 1) {
            emailUtil.closeEmailConnection();
            console.log('All emails have been sent...');
            res(true);
          }
        }
      }
    });
  };

  return {

    sendInvites: function(emailList, instanceName, i) {

      if(req.session.role && (req.session.role === 'superadmin' || req.session.role === 'admin')) {
        // emailList = ['russell@engagementgamelab.org', 'russell@russellgoldenberg.com', 'russell_goldenberg@emerson.edu', 'samuel.a.liberty@gmail.com', 'thebookofrobert@gmail.com', 'langbert@gmail.com', 'arxpoetica@gmail.com'];

        console.log('\n\n   * * * * * * * * * * * *   Sending User Invites via Email   * * * * * * * * * * * *   \n\n'.yellow);
        console.log(emailList.join(', ') + '\n\n');
        emailUtil.openEmailConnection();

        //emailList = emailList.slice(0, 20); --> doing this on front now
        emailListLength = emailList.length;
        for(emailIterator = 0; emailIterator < emailListLength; emailIterator++) {
          var email = emailList[emailIterator].toLowerCase();
          if(i) {
            createUserAndSendInvite(email, instanceName, i);
          } else {
            createUserAndSendInvite(email, instanceName, emailIterator);
          }
        }
      } else {
        res(false);
      }
    },

    newGameInstance: function(info) {
      gameModel
      .where('instanceName').equals(info.instanceName)
      .select('instanceName')
      .find(function(err, results) {
        //if it doesn't exist, create new game instance
        if(err) {
          res(true, false);
        } else if(results.length > 0) {
          res(false, true);
        } else {
          newGame = new gameModel();
          newGame.players = 0;
          newGame.seedsDropped = 0;
          newGame.seedsDroppedGoal = info.numPlayers * 130; //130 is magic number (see calculation in trello)
          newGame.active = true;
          newGame.bossModeUnlocked = false;
          newGame.levelQuestion = ['What is your background?', 'Where do you like to work?', 'What time is it?', 'When are you done?'];
          newGame.leaderboard = [];
          newGame.levelNames= ['Level 1: Looking Inward', 'Level 2: Expanding Outward', 'Level 3: Working Together', 'Level 4: Looking Forward', 'Game Over: Profile Unlocked'];
          newGame.resourceCount = [10, 12, 9, 10];
          newGame.instanceName = info.instanceName;
          newGame.resourceResponses = {};

          newGame.save(function(err) {
            if(err) {
              console.log(error);
              res(true, false);
            }
            else {
              console.log('game instance has been created');
              //put a single color in the world so we don't get an error when it searches
              color = new colorModel();
              color.instanceName = info.instanceName;
              color.x = 0;
              color.y = 0;
              color.mapIndex = 0;
              color.color = {
                r: 255,
                g: 0,
                b: 0,
                a: 0.3
              };
              color.curColor = 'rgba(255,0,0,0.3)';
              color.save(function(err, okay) {
                if(err) {
                  console.log(err);
                } else if(okay) {
                  res(false, false);
                }
              });

              //add instance to creator / superadmin for monitor panels
              userModel
              .findById(info.id, function (err, user) {
                if(err) {
                  console.log(err);
                } else if(user) {
                  if(user.role !== 'superadmin') {
                    user.admin.instances.push(info.instanceName);
                    user.save();
                  }
                }
              });
              userModel
              .where('role').equals('superadmin')
              .find(function (err, users) {
                if(err) {
                  console.log(err);
                } else if(users) {
                  for(var i = 0; i < users.length; i++) {
                    users[i].admin.instances.push(info.instanceName);
                    users[i].save();
                  }
                }
              });
            }
          });
        }
      });
    },

    getCount: function(instanceName) {
      //get count of players in current instance, if < 20 add new one
      userModel
      .count({'game.instanceName': instanceName}, function(err, count) {
        if(err) {
          res(false);
        } else {
          if(count >= 20) {
            res(false);
          } else {
            res(count);
          }
        }
      });
    }
  };

};
