/**
 * author: Martin
 * admin detail
 */
//grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Constant = require('../common/constant.js');

//define format of Collection
var AdminSchema = new Schema({
    username            :   {type: String, trim: true},  //unique to login
    fullname            :   {type: String, trim: true},
    role           :   {type: String, trim: true},
    is_active          :   {type: Number, default: 1}, //0: inactive (cannot login), 1: action
    password        :   {type: String, trim: true}  //sha256 generated in front end
}, { collection: 'admin' });

//the schema is useless so far
//we need to create a model using it
var Admin = mongoose.model('Admin', AdminSchema);

//
Admin.prototype.search_by_condition = function(condition, paging, fields, sort, resp_func){
    Admin.find(condition).limit(paging.limit).skip(paging.skip).select(fields).sort(sort).exec(function(err, res) {
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
                data : res,
                skip : paging.skip
            };
            resp_func(resp);
        }
    });
};
//
Admin.prototype.getAll = function(resp_func){
    Admin.find().exec(function(err, res) {
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
Admin.prototype.update = function(existed_condition, update_data, resp_func){
    var options = { upsert: false };
    Admin.updateMany(existed_condition, update_data, options, function(err, numAffected){
        // numAffected is the number of updated documents
        if(err) {
            var resp = {
                result : Constant.FAILED_CODE,
                message: Constant.SERVER_ERR,
                err: err
            };
            resp_func(resp);
        }else{
            var resp = {
                result : Constant.OK_CODE
            };
            resp_func(resp);
        }
    });
};
module.exports = Admin;
