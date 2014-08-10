/*
 * ROX 10.0 USB serial protocol
 * Copyright 2014 Mathias Menzel-Nielsen <matze@matzsoft.de>
 *
 */
var _ = require('underscore');
var SerialPort = require("serialport").SerialPort
var argv = require('minimist')(process.argv.slice(2));



var serialPort = new SerialPort(argv._[0] || "/dev/ttyACM0", {
  baudrate: 57600
}, false);



var commands = {
    ping: new Buffer("0200011110", 'hex'),
    pong: new Buffer("11000000", 'hex'),
    continue: new Buffer("0200018180", 'hex'),
    getdata: new Buffer("02000580010008008c", 'hex')
};


serialPort.open(function () {
  console.log('Entering sync modus');
  serialPort.on('data', function(data) {
    var buf = new Buffer(data, 'binary');
    console.log('data received: ' + buf.toString('hex'));
  });
  setInterval(function(){
    serialPort.write(commands.ping, function(err, results) {
    });}, 1000);

});