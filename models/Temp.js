/**
 * author: Martin
 * save dropdown options
 */
//grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Constant = require('../common/constant.js');

//define format of Collection
var TempSchema = new Schema({
    options            :   [{name: {type: String, trim: true}}]
}, { collection: 'Temp' });

//the schema is useless so far
//we need to create a model using it
var Temp = mongoose.model('Temp', TempSchema);

//
Temp.prototype.find_all = function(resp_func){
  var query = Temp.find();
  var promise = query.exec();
  // assert.ok(promise instanceof Promise);
  promise.then(function(doc){
      resp_func(doc);
    });
};
//


module.exports = Temp;
