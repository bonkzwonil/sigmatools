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
    ping: new Buffer("02000111", 'hex'),
    pong: new Buffer("11000000", 'hex'),
    continue: new Buffer("02000181", 'hex'),
    getdata: new Buffer("0200058001000800", 'hex'),
    getdata2: new Buffer("0200058001000800", 'hex'),
    version: new Buffer("02000185", "hex")
};

//Computes the xor chksum used in the protocol (all bytes xored without first)
var chksum = function(buf){
  return _.reduce(buf.slice(1), function(memo, byte){
    return memo^byte;
  });
}

var send = function(buf, cb){
  var buffer = new Buffer(buf.length+1);
  buf.copy(buffer);
  buffer[buffer.length-1] = chksum(buf);
  console.log("sending: "+buffer.toString('hex'));
  serialPort.write(buffer, cb);
}


serialPort.open(function () {
  console.log('Entering sync modus');
  serialPort.on('data', function(data) {
    var buf = new Buffer(data, 'binary');
    console.log('data received: ' + buf.toString('hex'));
  });
  setInterval(function(){
    send(commands.ping, function(err, results) {
    });}, 1000);

  setTimeout(function(){
    send(commands.version, function(err,res){
      console.log(err);
    });
  },1500);

});