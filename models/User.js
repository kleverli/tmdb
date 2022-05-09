/**
 * author: Martin
 * save user info
 */
//grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Constant = require('../common/constant.js');

//define format of Collection
var UserSchema = new Schema({
    first_name    :   {type: String},
    last_name    :   {type: String},
    name: String,
    email: String,
    password: String,
    isverified: { type: Number, default: 0 },
    active: { type: Number, default: 1 },
    emailtoken: String,
    tokenexpiretime: Date,
    note    :   {type: String},
    created_time    :   {type: Number}
}, { timestamps: true, collection: 'user' });

//the schema is useless so far
//we need to create a model using it
var User = mongoose.model('User', UserSchema);
//
User.prototype.findOne = function(condition, resp_func){
    User.findOne(condition).exec(function(err, res) {
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
User.prototype.getAllNoPaging = function(condition, resp_func){
    User.find(condition).exec(function(err, res) {
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
User.prototype.create = function(data, resp_func){
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


module.exports = User;
