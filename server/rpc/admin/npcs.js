'use strict';

// Define actions which can be called from the client using ss.rpc('demo.ACTIONNAME', param1, param2...)
exports.actions = function (req, res, ss) {

  req.use('session')

  var npcModel  = ss.service.db.model('Npc'),
      tileModel = ss.service.db.model('Tile')

  var npcHelpers = {
    addNpcTile: function (position, callback) {
      tileModel
        .where('x').equals(position.x)
        .where('y').equals(position.y)
        .find(function (err, tiles) {
          if (err) {
            callback('could not find tile')
          } else if (tiles) {
            if (tiles[0].tileState === 0) {
              tiles[0].tileState = 2
              tiles[0].save(function (err, saved) {
                if (err) {
                  callback('could not save tile')
                } else if (saved) {
                  callback()
                }
              })
            }
          }
        })
    },

    removeNpcTile: function (position, callback) {
      tileModel
        .where('x').equals(position.x)
        .where('y').equals(position.y)
        .find(function (err, tiles) {
          if (err) {
            callback('could not find tile')
          } else if (tiles) {
            // Restore tilestate to zero
            // Note: NPCs are only allowed to occupy go-tiles (state = 0)
            tiles[0].tileState = 0
            tiles[0].save(function (err, saved) {
              if (err) {
                callback('could not save tile')
              } else if (saved) {
                callback()
              }
            })
          }
        })
    },

    updateTiles: function (oldPosition, newPosition, callback) {
      //update new tile, make sure we can change it
      if ((oldPosition.x === newPosition.x) && (oldPosition.y === newPosition.y)) {
        callback()
      } else {
        tileModel
          .where('x').equals(newPosition.x)
          .where('y').equals(newPosition.y)
          .find(function (err, newTiles) {
            if (err) {
              callback('could not find new tile')
            } else if (newTiles) {
              if (newTiles[0].tileState === 0) {
                newTiles[0].tileState = 2
                newTiles[0].save(function (err, saved) {
                  if (err) {
                    callback('could not save new tiles')
                  } else if (saved) {
                    //update the old tile so it doesnt have an npc
                    tileModel
                      .where('x').equals(oldPosition.x)
                      .where('y').equals(oldPosition.y)
                      .find(function (err, oldTiles) {
                        if (err) {
                          callback('could not find old tile')
                        } else if (oldTiles) {
                          oldTiles[0].tileState = 0;
                          oldTiles[0].save(function (err, saved) {
                            if (err) {
                              callback('could not save old tiles')
                            } else if (saved) {
                              callback()
                            }
                          })
                        }
                    })
                  }
                })
              } else {
                callback('cant place npc there')
              }
            }
        })
      }

    }
  }

  return {
    init: function (id) {
      npcModel
        .find()
        .sort('level')
        .exec(function (err, result) {
          if (err) {
            res(err)
          } else if (result) {
            res(result)
          }
        })
    },

    updateInformation: function (info) {
      npcModel
        .where('id').equals(info.id)
        .find(function (err, result) {
          if (err) {
            res('error:' + err)
          } else if (result) {
            var npc = result[0]
            //update the tiles for the npc
            npcHelpers.updateTiles(npc.position, info.position, function (error) {
              if (error) {
                res(error)
              } else {
                //general
                npc.name = info.name
                npc.sprite = info.sprite
                npc.isHolding = info.isHolding
                npc.level = info.level
                npc.skinSuit = info.skinSuit

                npc.position = info.position

                //resource
                if (info.isHolding) {
                  npc.resource.id = info.index // TODO: Change
                  npc.resource.url = info.resource.url
                  npc.resource.questionType = info.resource.questionType
                  npc.resource.question = info.resource.question
                  npc.resource.shape = info.resource.shape
                  npc.resource.feedbackRight = info.resource.feedbackRight
                  npc.resource.feedbackWrong = info.resource.feedbackWrong
                  npc.dialog.prompts = info.dialog.prompts
                  npc.dependsOn = info.dependsOn

                  //not open
                  if (info.questionType === 'open') {
                    npc.resource.requiredLength = info.resource.requiredLength
                  } else {
                    npc.resource.answer = info.resource.answer
                    if (info.resource.questionType === 'multiple') {
                      npc.resource.possibleAnswers = info.resource.possibleAnswers
                    }
                  }
                } else {
                  //smalltalk
                  npc.dialog.smalltalk = info.dialog.smalltalk
                }

                npc.save(function (err, okay) {
                  if (err) {
                    res('error')
                  } else {
                    res(false)
                  }
                })
              }
            })
          }
      })
    },

    addNpc: function (info) {
      npcModel
        .create(info, function (err,result) {
          if (err) {
            res(err)
          } else if (result) {
            npcHelpers.addNpcTile(info.position, function (err) {
              res(err)
            })
          }
        })
    },

    deleteNpc: function (id) {
      npcModel
        .where('id').equals(id)
        .find(function (err, npc) {
          if (err) {
            res(err)
          } else if (npc) {
            var position = npc[0].position
            npcModel
              .where('id').equals(id)
              .remove(function (err, result) {
                if (err) {
                  res(err)
                } else {
                  npcHelpers.removeNpcTile(position, function (err) {
                    res(err)
                  })
                }
              })
          }
        })
    }
  }
}
