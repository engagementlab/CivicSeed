'use strict'

var colors = require('colors') // This alters String.prototype
var mongoose = require('mongoose')
var envConnectionString = process.env.MONGO_CON
var connectionString = envConnectionString ? envConnectionString : 'mongodb://ip-10-202-153-133.ec2.internal/civicseed_testing'
var db = mongoose.createConnection(connectionString)

console.log('Testing mongo startup...')

db.on('error', console.error.bind(console, ' CONNECTION ERROR: '.red))

db.once('open', function (one, two, three, four, five) {
  console.log('MongoDB connection opened...'.green)
  mongoose.connection.close(function () {
    console.log('MongoDB connection closed...'.green)
    process.exit()
  })
})
