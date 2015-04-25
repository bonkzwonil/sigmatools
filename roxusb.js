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
  return _.reduce(buf.slice(1, buf.length-1), function(memo, byte){
           console.log("XOR: "+memo+" "+byte);
    return memo^byte;
  }, 0);
}

var readBytes = function(string){
  return new Buffer(string.replace(/\s/g, ''), 'hex');
}

var parseMsg = function(buf){
  var payload = buf; //slice(1, buf.length-1);
  console.log("parse: "+payload.toString('hex'));
  var sum = chksum(payload);
  console.log(sum);
  return {
    commandByte : buf[0],
    chksum: sum,
    lastByte: buf[buf.length-1],
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


var buf = readBytes("78 01 8C 0E 08 06 11 01 1A 01 00 36 18 00 00 36 18 00 00 E1 0E 00 00 00 00 00 00 EC 0D 00 00 FB 08 00 00 77 08 00 00 5E 5B 31 03 59 E8 98 00 9B 7D 31 03 2A 6B 99 00 05 00 00 00 F7 FF FF FF 00 05 1E 00 00 00 00 07 29 00 07 04 00 07 00 00 05 1D 00 05 1E 00 80 00 6D 81 93 A5 80 92 A4 B7 02 00 FE FF 03 00 FD FF 0A 00 47 00 62 00 6C 00 DC 00 24 00 68 00 88 02 1E 00 11 00 03 00 92 01 00 01 00 B7 00 00 00 20 0E 08 07 11 0D 25 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 77 08 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 80 00 6D 81 93 A5 80 92 A4 B7 00 00 00 00 00 00 00 00 02 00 00 00 00 00 00 00 00 00 24 00 68 00 02 00 02 00 07 00 00 00 92 01 00 01 00 B7 00 00 00 00 0E 08 07 11 0D 33 01 00 F3 89 00 00 F3 89 00 00 A9 4D 00 00 00 00 00 00 6C 0D 00 00 EB 07 00 00 77 08 00 00 00 00 00 00 00 00 00 00 3D 8C 31 03 1D CC 98 00 3A 00 00 00 D0 FF FF FF 00 27 27 00 00 00 00 2F 1B 00 20 34 00 21 0A 00 27 1D 00 36 2B 00 80 00 6D 81 93 A5 80 92 A4 B7 02 00 FF FF 05 00 FD FF 1A 00 40 00 63 00 50 00 04 01 24 00 68 00 18 0E 74 00 08 00 01 00 92 01 00 01 00 B7 00 00 00 00 AB");

var buf = readBytes("80 05 C4 0E 08 07 11 0D 33 01 00 F3 89 00 00 F3 89 00 00 A9 4D 00 00 00 00 00 00 6C 0D 00 00 EB 07 00 00 77 08 00 00 00 00 00 00 00 00 00 00 3D 8C 31 03 1D CC 98 00 3A 00 00 00 D0 FF FF FF 00 27 27 00 00 00 00 2F 1B 00 20 34 00 21 0A 00 27 1D 00 36 2B 00 80 00 6D 81 93 A5 80 92 A4 B7 02 00 FF FF 05 00 FD FF 1A 00 40 00 63 00 50 00 04 01 24 00 68 00 18 0E 74 00 7A 01 A3 01 92 01 00 01 00 B7 00 00 00 20 5C 24 31 03 83 BD 98 00 63 0A 00 00 8A 02 00 00 0A 00 00 00 5F 00 EA 00 10 00 00 4E 00 00 00 00 68 24 31 03 E8 BD 98 00 5D 0A 00 00 62 03 00 00 0A 00 00 00 5F 00 EA 00 10 00 00 4E 00 00 00 00 69 24 31 03 38 BE 98 00 EC 08 00 00 8A 02 00 00 0A 00 00 00 50 00 EA 00 10 00 00 4E 12 00 00 00 66 24 31 03 80 BE 98 00 3D 07 00 00 B1 01 00 00 0A 00 00 00 32 00 EA 00 0F 00 00 4E 00 00 00 B7 6E 24 31 03 C8 BE 98 00 05 07 00 00 B1 01 00 00 0A 00 00 00 0F 00 E9 00 0F 00 00 1E 00 00 00 00 72 24 31 03 1B BF 98 00 C2 07 00 00 8A 02 00 00 0A 00 00 00 0A 00 EA 00 0F 00 00 1E 00 00 00 FF 75 24 31 03 77 BF 98 00 65 08 00 00 8A 02 00 00 0A 00 00 00 23 00 E9 00 0F 00 00 3E 00 00 00 B7 7A 24 31 03 D7 BF 98 00 F9 08 00 00 8A 02 00 00 0A 00 00 00 41 00 E9 00 0F 00 00 44 0E 00 00 01 7F 24 31 03 3A C0 98 00 59 09 00 00 8A 02 00 00 0A 00 00 00 55 00 E9 00 0F 00 00 47 00 00 00 00 82 24 31 03 9E C0 98 00 CA 09 00 00 8A 02 00 00 0A 00 00 00 64 00 E9 00 0F 00 00 49 00 00 00 00 87 24 31 03 02 C1 98 00 CA 09 00 00 00 00 00 00 0A 00 00 00 64 00 E9 00 0F 00 00 4B 00 00 00 11 90 24 31 03 6B C1 98 00 CA 09 00 00 00 00 00 00 0A 00 00 00 5F 00 E9 00 0F 00 00 4D 00 00 00 00 96 24 31 03 D4 C1 98 00 3E 0A 00 00 77 08 00 00 0A 00 00 00 5F 00 E9 00 0F 00 00 4F 11 00 00 00 9F 24 31 03 3B C2 98 00 99 0A 00 00 8A 02 00 00 0A 00 00 00 64 00 E9 00 0F 00 00 50 00 00 00 11 AC 24 31 03 A2 C2 98 00 C0 0A 00 00 62 03 00 00 0A 00 00 00 73 00 E8 00 0F 00 00 51 00 00 00 00 B4 24 31 03 12 C3 98 00 06 0B 00 00 8A 02 00 00 0A 00 00 00 78 00 E8 00 0F 00 00 53 00 00 00 00 BB 24 31 03 87 C3 98 00 43 0B 00 00 62 03 00 00 0A 00 00 00 7D 00 E8 00 0F 00 00 55 00 00 00 11 C2 24 31 03 FB C3 98 00 56 0B 00 00 62 03 00 00 0A 00 00 00 82 00 E8 00 0F 00 00 54 13 00 00 00 CA 24 31 03 6E C4 98 00 4D 0B 00 00 8A 02 00 00 0A 00 00 00 82 00 E8 00 0F 00 00 50 00 00 00 00 D4 24 31 03 E0 C4 98 00 4B 0B 00 00 C5 06 00 00 0A 00 00 00 7D 00 E8 00 0F 00 00 50 00 00 00 2A DC 24 31 03 53 C5 98 00 49 0B 00 00 00 00 00 00 0A 00 00 00 7D 00 E8 00 0F 00 00 50 00 00 00 00 EA 24 31 03 BC C5 98 00 54 0B 00 00 8A 02 00 00 0A 00 00 00 7D 00 E8 00 0F 00 00 50 00 00 00 00 F9 24 31 03 2A C6 98 00 41 0B 00 00 C5 06 00 00 0A 00 00 00 7D 00 E8 00 0F 00 00 50 17 00 00 2C 04 25 31 03 99 C6 98 00 1F 0B 00 00 8A 02 00 00 0A 00 00 00 7D 00 E8 00 0F 00 00 4F 00 00 00 00 0D 25 31 03 0B C7 98 00 06 0B 00 00 62 03 00 00 0A 00 00 00 78 00 E8 00 0F 00 00 42 00 00 00 00 12 25 31 03 7A C7 98 00 DC 0A 00 00 8A 02 00 00 0A 00 00 00 73 00 E8 00 0F 00 00 4E 00 00 00 2C 17 25 31 03 E8 C7 98 00 CB 0A 00 00 62 03 00 00 0A 00 00 00 73 00 E8 00 0F 00 00 4C 00 00 00 00 1C 25 31 03 55 C8 98 00 C4 0A 00 00 8A 02 00 00 0A 00 00 00 6E 00 E8 00 0F");

console.log(parseMsg(buf));


var doStuff = function(){
serialPort.open(function () {
  console.log('Entering sync modus');
  serialPort.on('data', function(data) {
    var buf = new Buffer(data, 'binary');
    currentBuf = Buffer.concat([currentBuf, buf]);
    console.log('data received: ' + buf.toString('hex'));
    var msg = parseMsg(currentBuf);
    console.log(msg);
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

})
};