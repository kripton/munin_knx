#!/usr/bin/env node

// Dependencies
const fs = require('fs');
const xml = require('xml-js');
const knx = require('knx');
const http = require('http');

// Config
const httpd_port = process.env.HTTPD_PORT || 3680;
const httpd_host = process.env.HTTPD_HOST || '127.0.0.1';
const knx_port = process.env.KNX_PORT || 3671;
const knx_host = process.env.KNX_HOST || '127.0.0.1';

// Data storage mapping group addresses to last value + timestamp
const valueMap = {};

// Read the group addresses so we can request the latest value of each one
const groups = {};
if (!fs.existsSync('groupaddresses.xml')) {
  console.error('File "groupaddresses.xml" does not exist. Caching everything we see ...');
} else {
  console.error('Reading group addresses from "groupaddresses.xml" ...');
  let raw = JSON.parse(xml.xml2json(fs.readFileSync('groupaddresses.xml'), {compact: true}));
  // We don't care about GroupAddress-Export's attributes BUT
  // GroupAddress-Export contains "Main Groups" as "GroupRange" subKeys
  Object.entries(raw['GroupAddress-Export']).forEach(key => {
    if (key[0] == 'GroupRange') {
      console.log('Found main group named "' + key[1]['_attributes'].Name + '"');
      // We don't care much about GroupRange's attributes BUT
      // "Main Groups" contain "Middle Groups" as "GroupRange" subKeys
      Object.entries(key[1]).forEach(key1 => {
        if (key1[0] == 'GroupRange') {
          console.log('Found middle group named "' + key1[1]['_attributes'].Name + '"');
          // We don't care much about GroupRange's attributes BUT
          // "Middle Groups" contain "Group Addresses" as "GroupAddress" subKeys
          Object.entries(key1[1].GroupAddress).forEach(groupNode => {
            let group = groupNode[1]['_attributes'];
            groups[group.Address] = {
              'Name': group.Name,
              'Description': group.Description,
              'DPTs': group.DPTs
            };
          });
        }
      });
    }
  });
}

console.log('Imported ' + Object.getOwnPropertyNames(groups).length + ' group addresses');

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
      console.log('Connected to KNX IP interface');

      // Request the value of all imported group addresses
      Object.getOwnPropertyNames(groups).forEach(key => {
        let value = groups[key];
        let mainDPT = value.DPTs.split('-')[1];
        let subDPT = value.DPTs.split('-')[2];
        let DPTstr = 'DPT' + mainDPT + '.' + ('0000'+subDPT).slice(-3);
        console.log('KEY: ', key, ' VALUE: ', value, 'DPT: ', DPTstr, typeof(key));
        value.datapoint = new knx.Datapoint({ga: value.Address, dpt: DPTstr, autoread: true}, connection);
      });
    },
    // get notified for all KNX events:
    event: function(evt, src, dest, value) {
      console.log(
        "event: %s, src: %j, dest: %j, value: %j",
        evt, src, dest, value
      );
      valueMap[dest] = {value: value, timestamp: new Date()};
    },
    // get notified on connection errors
    error: function(connstatus) {
      console.log("**** ERROR: %j", connstatus);
    }
  }
});

const requestHandler = function (req, res) {
  res.setHeader("Content-Type", "application/json");
  res.writeHead(200);
  res.end(JSON.stringify(valueMap));
};

const server = http.createServer(requestHandler);
server.listen(httpd_port, httpd_host, () => {
    console.log(`Local http server is running on http://${httpd_host}:${httpd_port}`);
});
