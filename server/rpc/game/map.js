'use strict';

var winston = require('winston')

exports.actions = function (req, res, ss) {

  req.use('session')

  var tileModel  = ss.service.db.model('Tile'),
      colorModel = ss.service.db.model('Color')

  var colorHelpers = {

    modifyTiles: function (oldTiles, bombed) {
      //console.log('old: ',oldTiles, 'new: ', bombed);
      //curIndex ALWAYS increases, but bomb only does if we found
      //the matching tile, tricky
      var bIndex = bombed.length,
          updateTiles = [],
          insertTiles = []

      //go thru each new tile (bombed)
      while (--bIndex > -1) {
        //unoptimized version:
        var oIndex = oldTiles.length,
            found = false
        //stop when we find it
        while (--oIndex > -1) {
          if (oldTiles[oIndex].mapIndex === bombed[bIndex].mapIndex) {
            var modifiedTile = colorHelpers.modifyOneTile(oldTiles[oIndex], bombed[bIndex])
            updateTiles.push(modifiedTile)
            found = true
            oIndex = -1
          }
        }
        if (!found) {
          insertTiles.push(bombed[bIndex])
        }
      }
      return {
        insert: insertTiles,
        update: updateTiles
      }
        // //if we haven't hit the beginning (-1) of the old index, look thru it
        // //console.log(bIndex, oIndex);
        // if(oIndex > -1) {
        //  console.log(bombed[bIndex].mapIndex, oldTiles[oIndex].mapIndex);
        //  //make sure they are the same tile before we modify any colors
        //  if(oldTiles[oIndex].mapIndex === bombed[bIndex].mapIndex) {
        //    console.log('modify');
        //    //modify tile
        //    var modifiedTile = colorHelpers.modifyOneTile(oldTiles[oIndex], bombed[bIndex]);
        //    updateTiles.push(modifiedTile);
        //    //console.log('modded');
        //    oIndex--;
        //  } else {
        //    //if we made it here, we are out of olds, must add it
        //    insertTiles.push(bombed[bIndex]);
        //    // console.log('new');
        //  }
        //  //check if new old tile index is <= the next one
        //  var lower = false;
        //  while(!lower) {
        //    if(oIndex < 0) {
        //      //exit out so we can continue
        //      lower = true;
        //    } else {
        //      //make sure there is a next bomb
        //      if(bIndex > 0) {
        //        if(oldTiles[oIndex].mapIndex <= bombed[bIndex-1].mapIndex) {
        //          lower = true;
        //        } else{
        //          oIndex--;
        //        }
        //      }
        //    }
        //  }
        // } else {
        //  insertTiles.push(bombed[bIndex]);
        //  //console.log('newb');
        // }
      //}
    },

    modifyOneTile: function (tile, bomb)  {
      //AHHHH SO MANY POSSIBILITIES, stripping this down
      //there IS a pre-existing color
      //if the old one is a nobody (not owned)
      if (tile.color.owner === 'nobody') {
        //if the NEW one should be owner, then update tile and bomb curColor
        if (bomb.color.owner !== 'nobody') {
          tile.color = bomb.color
          tile.curColor = bomb.curColor
          return tile;
        }
        //new one should be modified -- if the opacity hasn't maxed out 
        else if (tile.color.a < 0.5 ) {
          var prevR = tile.color.r,
              prevG = tile.color.g,
              prevB = tile.color.b,
              prevA = tile.color.a
          var weightA = prevA / 0.1,
              weightB = 1;
          var newR = Math.floor((weightA * prevR + weightB * bomb.color.r) / (weightA + weightB)),
              newG = Math.floor((weightA * prevG + weightB * bomb.color.g) / (weightA + weightB)),
              newB = Math.floor((weightA * prevB + weightB * bomb.color.b) / (weightA + weightB)),
              newA = Math.round((tile.color.a + 0.1) * 100) / 100,
              rgbString = 'rgba(' + newR + ',' + newG + ',' + newB + ',' + newA + ')'
          tile.color.r = newR
          tile.color.g = newG
          tile.color.b = newB
          tile.color.a = newA
          tile.curColor = rgbString
          return tile
        }
        //don't modify. change tile for sending out since maxed
        else {
          return tile
        }
      }
      //old one is the OWNER, so just modify tile for user
      else {
        return tile
      }
    },

    saveTiles: function (tiles, callback) {
      var num = tiles.update.length,
          cur = 0
      var save = function () {
        console.log(tiles.update[cur]);
        tiles.update[cur].save(function (err, suc) {
          cur++
          if (cur >= num) {
            insertNew()
          } else {
            save()
          }
        })
      }

      var insertNew = function () {
        colorModel.create(tiles.insert, function (err, suc) {
          callback(true)
        })
      }
      if (num > 0) {
        save()
      } else {
        insertNew()
      }
    },

    gameColorUpdate: function (newInfo, instanceName, callback) {
      //access our global game model for status updates
      gameModel
        .where('instanceName').equals(instanceName)
        .find(function (err, results) {
        if (err) {

        } else {
          //add tile count to our progress
          var result = results[0],
              oldCount = result.seedsDropped,
              newCount = oldCount + 1,
              oldColored = result.tilesColored,
              newColored = oldColored + newInfo.numBombs,
              oldPercent = Math.floor((oldCount / result.seedsDroppedGoal) * 100),
              newPercent = Math.floor((newCount / result.seedsDroppedGoal) * 100)
          //update leadeboard
          var oldBoard = result.leaderboard,
              gState = result.state,
              ob = oldBoard.length,
              found = false,
              updateBoard = false,
              newGuy = {
                name: newInfo.name,
                count: (newInfo.count + newInfo.numBombs)
              }

          //if this is the first player on the leadeboard, push em and update status
          if (ob === 0) {
            oldBoard.push(newGuy)
            updateBoard = true
          } else {
            //if new guy exists, update him
            while (--ob > -1) {
              if (oldBoard[ob].name === newGuy.name) {
                oldBoard[ob].count = newGuy.count
                found = true
                updateBoard = true
                continue
              }
            }
            //add new guy
            if (!found) {
              //onlly add him if he deserves to be on there!
              if (oldBoard.length < 10 || newGuy.count > oldBoard[oldBoard.length-1]) {
                oldBoard.push(newGuy)
                updateBoard = true
              }
            }
            //sort them
            oldBoard.sort(function (a, b) {
              return b.count-a.count
            })
            //get rid of the last one if too many
            if (oldBoard.length > 10) {
              oldBoard.pop()
            }
          }

          //check if the world is fully colored
          if (newPercent > 99) {
            //change the game state
            //send out emails
            result.set('bossModeUnlocked', true)
            //colorHelpers.endGameEmails();
            newPercent = 100
          }
          //save all changes
          result.set('seedsDropped', newCount)
          result.set('leaderboard', oldBoard)
          result.set('tilesColored', newColored)
          result.save()

          var returnInfo = {
            updateBoard: updateBoard,
            board: oldBoard,
            dropped: newCount,
            colored: newColored
          }
          callback(returnInfo)
        }
      })
    }
  }

  return {

    getMapData: function(x1, y1, x2, y2) {
      tileModel
        .where('x').gte(x1).lt(x2)
        .where('y').gte(y1).lt(y2)
        .sort('mapIndex')
        .find(function (err, allTiles) {
          if (err) {
            res(false)
          } else if (allTiles) {
            colorModel
              .where('instanceName').equals(req.session.game.instanceName)
              .where('x').gte(x1).lt(x2)
              .where('y').gte(y1).lt(y2)
              .sort('mapIndex')
              .find(function (err, colorTiles) {
                if (err) {
                  res(false)
                } else if (colorTiles) {
                  res(allTiles, colorTiles)
                }
              })
          }
        })
    },

    dropSeed: function (bombed, info) {
      //welcome to the color server!
      var num = bombed.length,
          curOld = 0,
          index = 0,
          minX = info.x,
          maxX = info.x + info.sz,
          minY = info.y,
          maxY = info.y + info.sz,
          allTiles = null,
          updateTiles = [],
          insertTiles = []

      //get a chunk of the bounding tiles from the DB (instead of querying each individually)
      colorModel
        .where('instanceName').equals(req.session.game.instanceName)
        .where('x').gte(minX).lt(maxX)
        .where('y').gte(minY).lt(maxY)
        .sort('mapIndex')
        .find(function (err, oldTiles) {
          if (err) {
            res(false)
          } else if (oldTiles) {
            //console.log('oldTiles: ', oldTiles);
            var modifiedTiles = null
            if (oldTiles.length > 0) {
              modifiedTiles = colorHelpers.modifyTiles(oldTiles, bombed)
              console.log(modifiedTiles.insert.length)
              console.log(modifiedTiles.update.length)
            } else {
              modifiedTiles = {
                insert: bombed,
                update: []
              }
            }
            //saveEach tile
            colorHelpers.saveTiles(modifiedTiles, function (done) {
              allTiles = modifiedTiles.insert.concat(modifiedTiles.update)
                //send out new bombs AND player info to update score
                var newTileCount = info.tilesColored + allTiles.length,
                    sendData = {
                      bombed: allTiles,
                      id: info.id,
                      tilesColored: newTileCount
                    }
                // we are done,send out the color information to each client to render
                ss.publish.channel(req.session.game.instanceName, 'ss-seedDropped', sendData)

                var newInfo = {
                  name: info.name,
                  numBombs: allTiles.length,
                  count: info.tilesColored
                }

                colorHelpers.gameColorUpdate(newInfo, req.session.game.instanceName, function (updates) {
                  if (updates.updateBoard) {
                    ss.publish.channel(req.session.game.instanceName,'ss-leaderChange', {board: updates.board, name: newInfo.name})
                  }
                  ss.publish.channel(req.session.game.instanceName,'ss-progressChange', {dropped: updates.dropped, colored: updates.colored})
                  //FINNNALLY done updating and stuff, respond to the player
                  //telling them if it was sucesful
                  res(allTiles.length)
                })
              })
          }
        })
    }
  }
}
