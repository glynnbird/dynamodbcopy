#!/usr/bin/env node

var commander = require('commander');
var package = require('../package.json');
var dynamodbexport = require('..');

// parse command-line parameters
commander
  .version(package.version)
  .option('-s, --source [tablename]', 'Add the table you want to copy')
  .option('-d, --destination [tablename]', 'Add the table you want to write to')
  .option('-r, --region [regionname]', 'The AWS region where your DynamoDB instance is hosted')
  .parse(process.argv);

// table is mandatory
if (!commander.source || !commander.destination) {
  console.log('You must specify source/destination tables');
  commander.outputHelp();
  process.exit(1);
}

// do the export
dynamodbexport.tableExport(commander.region, commander.source, commander.destination, function(err, data) {
  if (err) {
    console.error('ERROR', err)
  } else {
    console.error('Export complete', data)
  }
}, commander.pause * 1000);

