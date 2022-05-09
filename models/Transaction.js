/**
 * author: Martin
 * save detail of 1 times paid (paddle, ...)
 */
//grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Constant = require('../common/constant.js');

//define format of Collection
var TransactionSchema = new Schema({
    transaction_id: {type: String},
    is_active: { type: Number, default: 0 },
    money: {type: Number},
    type: {type: String},   //1_MONTH, 3_MONTH, 6_MONTH, 1_YEAR
    created_time    :   {type: Number}  //the time user paid successfully
}, { collection: 'user' });

//the schema is useless so far
//we need to create a model using it
var Transaction = mongoose.model('Transaction', TransactionSchema);

//
Transaction.prototype.findOne = function(condition, resp_func){
    Transaction.findOne(condition).exec(function(err, res) {
        if (err) {
            var resp = {
                result : Constant.FAILED_CODE,
                message : Constant.SERVER_ERR,
                name: err.name,
                kind: err.kind
            };
            resp_func(resp);
        } else {
            var resp = {
                result : Constant.OK_CODE,
                data : res
            };
            resp_func(resp);
        }
    });
};
//
Transaction.prototype.getAllNoPaging = function(condition, resp_func){
    Transaction.find(condition).exec(function(err, res) {
        if (err) {
            var resp = {
                result : Constant.FAILED_CODE,
                message : Constant.SERVER_ERR,
                name: err.name,
                kind: err.kind
            };
            resp_func(resp);
        } else {
            var resp = {
                result : Constant.OK_CODE,
                data : res
            };
            resp_func(resp);
        }
    });
};
//create new document
Transaction.prototype.create = function(data, resp_func){
    var document = new User(data);
    document.save(function(err, result){
        if(err) {
            var resp = {
                result : Constant.FAILED_CODE,
                message: Constant.SERVER_ERR,
                err: err
            };
            resp_func(resp);
        }else{
            var resp = { result : Constant.OK_CODE, _id: result['_id'] };
            resp_func(resp);
        }
    });
};

module.exports = Transaction;
