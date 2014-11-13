var colors              = require('colors'),
    mongoose            = require('mongoose'),
    envConnectionString = process.env.MONGO_CON,
    connectionString    = envConnectionString ? envConnectionString : 'mongodb://ip-10-202-153-133.ec2.internal/civicseed_testing',
    db                  = mongoose.createConnection(connectionString)

console.log('Testing mongo startup...')

db.on('error', console.error.bind(console, ' CONNECTION ERROR: '.red))

db.once('open', function (one, two, three, four, five) {
  console.log('MongoDB connection opened...'.green)
  mongoose.connection.close(function () {
    console.log('MongoDB connection closed...'.green)
    process.exit()
  })
})
