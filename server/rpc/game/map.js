'use strict'

exports.actions = function (req, res, ss) {
  req.use('session')

  var tileModel = ss.service.db.model('Tile')
  var colorModel = ss.service.db.model('Color')

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
    }
  }
}
