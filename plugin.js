#!/usr/bin/env node

// Dependencies
const http = require('http');
const process = require('process');

// Config
const httpd_port = process.env.HTTPD_PORT || 3680;
const httpd_host = process.env.HTTPD_HOST || '127.0.0.1';

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

// Fetch the JSON-data from the accumulating server
http.get('http://' + httpd_host + ':' + httpd_port + '/', function(response) {
  var body = '';
  response.on('data', function(d) {
    body += d;
  });
  response.on('end', function() {
    var parsed = JSON.parse(body);

    if (process.argv[2] == "config") {
      let config = 'graph_title KNX data';
      if (type == "temperature") {
        config += ' (temperatures)\n';
        config += 'graph_category sensors\ngraph_vlabel temperature';
      } else if (type == "humidity") {
        config += ' (humidities)\n';
        config += 'graph_category sensors\ngraph_vlabel humidity';
      } else if (type == "switch") {
        config += ' (switches)\n';
        config += 'graph_category sensors';
      } else {
        config += '\n';
        config += 'graph_category sensors';
      }
      console.log(config);
    }

    Object.getOwnPropertyNames(parsed).forEach(key => {
      var group = parsed[key];
      let dateNow = new Date();
      let dateLastData = new Date(group.lastData);
      dateLastData.setMinutes(dateLastData.getMinutes() + 3);
      let dataInTheLastThreeMinutes = (dateLastData > dateNow);
      if (((type == 'all') ||
          ((type == 'temperature') && (group.DPTs == 'DPST-9-1')) ||
          ((type == 'humidity') && (group.DPTs == 'DPST-9-7')) ||
          ((type == 'switch') && (group.DPTs == 'DPST-1-1'))
         ) && (group.parsedValue) && dataInTheLastThreeMinutes)
      {
        const fieldName = key.replace('/', '_').replace('/', '_');
        if (process.argv[2] == "config") {
          console.log(fieldName + '.label ' + group.name);
        } else {
          console.log(fieldName + '.value ' + group.parsedValue);
        }
      }
    });

  });
});
