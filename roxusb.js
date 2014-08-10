/*
 * ROX 10.0 USB serial protocol
 * Copyright 2014 Mathias Menzel-Nielsen <matze@matzsoft.de>
 *
 */
var _ = require('underscore');
var SerialPort = require("serialport").SerialPort
var argv = require('minimist')(process.argv.slice(2));
var moment = require('moment');



var serialPort = new SerialPort(argv._[0] || "/dev/ttyACM0", {
  baudrate: 57600,
  buffersize: 9924
}, false);

var blockLengths = {
    listEntry: 132
}

var commands = {
  ping: new Buffer("02000111", 'hex'),
  pong: new Buffer("11000000", 'hex'),
  continue: new Buffer("02000181", 'hex'),
  getdata: new Buffer("0200058001000800", 'hex'),
  getdata2: new Buffer("0200058001000800", 'hex'),
  version: new Buffer("02000185", "hex"),
  getNumberOfRecords: new Buffer("02000174", "hex"),
  listRecords: new Buffer("02000178", "hex")
};


var commandBytes = { //in hex
    "85": { name: "version", handler: parseVersion},
    "11": "pong",
    "80": "data",
    "74": "numberOfRecords",
    "78": "listOfRecords"
};


//Computes the xor chksum used in the protocol (all bytes xored without first)
var chksum = function(buf){
  return _.reduce(buf.slice(1), function(memo, byte){
    return memo^byte;
  }, 0);
}

var parseMsg = function(buf){
  var payload = buf.slice(1, buf.length-1);
  console.log("parse: "+payload.toString('hex'));
  var sum = chksum(payload);
  console.log(sum);
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

var parseNumberOfRecords = function(msg){
  return msg.arguments[msg.arguments.length-1];
};

var parseDateTime = function(buf){
  //6 bytes timestamp
  return moment({
    year: buf[0]+2000,
    month: buf[1]-1,
    day: buf[2],
    hour: buf[3],
    minute: buf[4],
    seconds: buf[5]
  });

}
var parseListRecord = function(buf){
  return {
    startDate: parseDateTime(buf)
  };
}


var currentBuf = new Buffer(0);

serialPort.open(function () {
  console.log('Entering sync modus');
  serialPort.on('data', function(data) {
    var buf = new Buffer(data, 'binary');
    currentBuf = Buffer.concat([currentBuf, buf]);
    console.log('data received: ' + buf.toString('hex'));
    var msg = parseMsg(currentBuf);
    if(!msg.isValid){
      console.log("datablock not valid. Waiting for next chunk");
    }else{
      console.log("block is valid");
      console.log(parseMsg(currentBuf));
      currentBuf = new Buffer(0);
      if(msg.meaning == "listOfRecords"){
        console.log(parseListRecord(msg.arguments.slice(2)));
      }
    }
  });
  setTimeout(function(){
    send(commands.ping, function(err, results) {
    });}, 1000);

  setTimeout(function(){
    send(commands.listRecords, function(err,res){
      console.log(err);
    });
  },1500);

});