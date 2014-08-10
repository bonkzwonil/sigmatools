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
  version: new Buffer("02000185", "hex"),
  getNumberOfRecords: new Buffer("02000174", "hex")
};


var commandBytes = { //in hex
    "85": { name: "version", handler: parseVersion},
    "11": "pong",
    "80": "data",
    "74": "numberOfRecords"
};


//Computes the xor chksum used in the protocol (all bytes xored without first)
var chksum = function(buf){
  return _.reduce(buf.slice(1), function(memo, byte){
    return memo^byte;
  });
}

var parseMsg = function(buf){
  var payload = buf.slice(1, buf.length-1);
  console.log("parse: "+payload.toString('hex'));
  var sum = chksum(payload);
  return {
    commandByte : buf[0],
    chksum: sum,
    isValid: sum == buf[buf.length-1],
    arguments: payload,
    meaning: commandBytes[buf.slice(0,1).toString("hex")]
  }
}

var send = function(buf, cb){
  var buffer = new Buffer(buf.length+1);
  buf.copy(buffer);
  buffer[buffer.length-1] = chksum(buf);
  console.log("sending: "+buffer.toString('hex'));
  serialPort.write(buffer, cb);
}

var parseVersion = function(buf){
  return {
    serial: buf.slice(29, 40).toString('ascii')
  }
}

serialPort.open(function () {
  console.log('Entering sync modus');
  serialPort.on('data', function(data) {
    var buf = new Buffer(data, 'binary');
    console.log('data received: ' + buf.toString('hex'));
    console.log(parseMsg(buf));
  });
  setInterval(function(){
    send(commands.ping, function(err, results) {
    });}, 1000);

  setTimeout(function(){
    send(commands.getNumberOfRecords, function(err,res){
      console.log(err);
    });
  },1500);

});