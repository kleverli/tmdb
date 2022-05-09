/**
 * author: Martin
 * device & movie speed
 */
//grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Constant = require('../common/constant.js');

//define format of Collection
var DeviceMovieSpeedSchema = new Schema({
    device_id            :   {type: String, trim: true},
    movie_id        : {type: String},
    downloadSpeed       :   [{type: Number}]
}, { collection: 'device_movie_speed' });

//the schema is useless so far
//we need to create a model using it
var DeviceMovieSpeed = mongoose.model('DeviceMovieSpeed', DeviceMovieSpeedSchema);
//create new document
DeviceMovieSpeed.prototype.create = function(data, resp_func){
    var document = new DeviceMovieSpeed(data);
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
//
DeviceMovieSpeed.prototype.search_by_condition = function(condition, paging, fields, sort, resp_func){
    DeviceMovieSpeed.find(condition).limit(paging.limit).skip(paging.skip).select(fields).sort(sort).exec(function(err, res) {
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
DeviceMovieSpeed.prototype.getAllNoPaging = function(condition, resp_func){
    DeviceMovieSpeed.find(condition).sort({index:1}).exec(function(err, res) {
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
DeviceMovieSpeed.prototype.getAll = function(resp_func){
    DeviceMovieSpeed.find().exec(function(err, res) {
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
DeviceMovieSpeed.prototype.countDocuments = function(condition, resp_func){
    DeviceMovieSpeed.count(condition, function(err, res) {
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
DeviceMovieSpeed.prototype.findOne = function(condition, resp_func){
    DeviceMovieSpeed.findOne(condition).exec(function(err, res) {
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
DeviceMovieSpeed.prototype.update = function(existed_condition, update_data, resp_func){
    var options = { upsert: false };
    DeviceMovieSpeed.updateMany(existed_condition, update_data, options, function(err, numAffected){
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
module.exports = DeviceMovieSpeed;
