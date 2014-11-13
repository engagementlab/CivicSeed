'use strict';

exports.actions = function (req, res, ss) {

  req.use('session')

  var Botanist = ss.service.db.model('Botanist')

  return {

    load: function () {
      Botanist.findOne(function (err, data) {
        res(data)
      })
    }

  }

}
