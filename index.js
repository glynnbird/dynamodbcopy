
var async = require('async');
var AWS = require('aws-sdk');

// export a table to JSON
var tableExport = function(region, sourceTable, destinationTable, callback) {

  AWS.config.update({region: region})

  // if we don't have environment variables
  var dynamoDB = new AWS.DynamoDB();

  // scan the whole table in chunks
  var scan = function(sourceTable, destinationTable, callback) {
    var lastReply = null;
    var iterations = 0;
    var records = 0;
    var query = {
      TableName: sourceTable,
      Limit: 25,
    };
    var start = new Date().getTime();

    // keep going until we're finished
    async.doUntil(function(cb) {

      // do table scan
      dynamoDB.scan(query, function(err, data) {
        if (err) {
          return callback(err, null);
        }


        // extract the data bit
        var items = data.Items;
        lastReply = data;

        // keep tally of how many DynamoDB requests we make
        iterations++;

        if (data.Items.length > 0) {
          var writeObj = {
            RequestItems: {
  
            }
          }
          writeObj.RequestItems[destinationTable] = []
          for(var i in data.Items) {
            var item = data.Items[i]
            var obj = {
              PutRequest: {
                Item: item
              }
            }
            writeObj.RequestItems[destinationTable].push(obj)
          }
          records += data.Items.length
  
          dynamoDB.batchWriteItem(writeObj, function(err, data) {
            if (err) {
              console.error(err)
            }
            process.stdout.write('.')
            cb(null)
          })
        } else {
          cb(null)
        }
      });
    }, function() {
      // check to see if we've more work to do
      if (lastReply.LastEvaluatedKey) { // Result is incomplete; there is more to come.
        query.ExclusiveStartKey = lastReply.LastEvaluatedKey;
        return false;
      }
      // if we're done, return true
      return true;
    }, function(e, r) {

      // calculate execution time and return summary object
      var end = new Date().getTime();
      callback(e, { iterations: iterations, records: records, time: (end - start)/1000 });
    });
  };
  
  // perform the scan
  scan(sourceTable, destinationTable, callback);
};

module.exports = {
  tableExport: tableExport
}