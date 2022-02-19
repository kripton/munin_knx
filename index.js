#!/usr/bin/env node

// Dependencies
const knx = require('knx');

// Config
const knx_port = process.env.KNX_PORT || 3671;
const knx_host = process.env.KNX_HOST || '127.0.0.1';

// Datga storage mapping group addresses to last value + timestamp
const valueMap = {};

var type = 'all';
if (process.argv[1].indexOf('temperature') != -1) {
  type = 'temperature';
}
if (process.argv[1].indexOf('humidity') != -1) {
  type = 'humidity';
}
if (process.argv[1].indexOf('switch') != -1) {
  type = 'switch';
}

const connection = new knx.Connection( {
  // ip address and port of the KNX router or interface
  ipAddr: knx_host, ipPort: knx_port,
  // the KNX physical address we'd like to use
  physAddr: '15.15.15',
  // set the log level for messsages printed on the console. This can be 'error', 'warn', 'info' (default), 'debug', or 'trace'.
  loglevel: 'info',

  handlers: {
    // wait for connection establishment before sending anything!
    connected: function() {
      console.log('Hurray, I can talk KNX!');
//      // WRITE an arbitrary boolean request to a DPT1 group address
//      connection.write("1/0/0", 1);
//      // you also WRITE to an explicit datapoint type, eg. DPT9.001 is temperature Celcius
//      connection.write("2/1/0", 22.5, "DPT9.001");
//      // you can also issue a READ request and pass a callback to capture the response
//      connection.read("1/0/1", (src, responsevalue) => { ... });
    },
    // get notified for all KNX events:
    event: function(evt, src, dest, value) {
      console.log(
        "event: %s, src: %j, dest: %j, value: %j",
        evt, src, dest, value
      );
      valueMap[src] = {value: value, timestamp: new Date()};
    },
    // get notified on connection errors
    error: function(connstatus) {
      console.log("**** ERROR: %j", connstatus);
    }
  }
});

/*
// Fetch the JSON-data from the accumulating server
http.get('http://' + host + ':' + port + '/', function(response) {
  var body = '';
  response.on('data', function(d) {
    body += d;
  });
  response.on('end', function() {
    var parsed = JSON.parse(body);
    var sensorStates = JSON.parse(body);

    if (process.argv[2] == "config") {
      console.log('graph_title rtl_443 ' + type + '\ngraph_category sensors\ngraph_vlabel ' + type);
    }

    var sensorId;
    for (sensorId in sensorMap) {
      if (sensorMap.hasOwnProperty(sensorId)) {
        var sensorName = sensorMap[sensorId];
        var sensorObj = sensorStates[sensorId];
        var fieldName = btoa(sensorName).replace(/=/g, '');

        //console.log('sensorId: ' + sensorId + ' sensorName: ' + sensorName + ' sensorObj: ', sensorObj);

        if (sensorName && sensorObj && type === 'temperature' && sensorObj.temperature_C) {
          if (process.argv[2] == "config") {
            console.log(fieldName + '.label ' + sensorName);
          } else {
            console.log(fieldName + '.value ' + sensorObj.temperature_C);
          }
        }
        if (sensorName && sensorObj && type === 'temperature' && sensorObj.temperature_F) {
          if (process.argv[2] == "config") {
            console.log(fieldName + '.label ' + sensorName);
          } else {
            console.log(fieldName + '.value ' + sensorObj.temperature_F);
          }
        }
        if (sensorName && sensorObj && type === 'humidity' && sensorObj.humidity) {
          if (process.argv[2] == "config") {
            console.log(fieldName + '.label ' + sensorName);
          } else {
            console.log(fieldName + '.value ' + sensorObj.humidity);
          }
        }
      }
    }

  });
});
*/
