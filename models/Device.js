/**
 * author: Martin
 * save device info
 */
//grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Constant = require('../common/constant.js');

//define format of Collection
var DeviceSchema = new Schema({
    device_code            :   {type: String, trim: true},
    current_movie_id:   {type: String, trim: true},   //viewing this movie in current device (deprecated)
    viewing_movie_ids: {type: Object},   //key: category id, value: current movie id
    created_time    :   {type: Number}
}, { collection: 'device' });

//the schema is useless so far
//we need to create a model using it
var Device = mongoose.model('Device', DeviceSchema);
//
Device.prototype.findOne = function(condition, resp_func){
    Device.findOne(condition).exec(function(err, res) {
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
Device.prototype.getAllNoPaging = function(condition, resp_func){
    Device.find(condition).exec(function(err, res) {
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
Device.prototype.create = function(data, resp_func){
    var document = new Device(data);
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
Device.prototype.update = function(existed_condition, update_data, resp_func){
    var options = { upsert: false };
    Device.updateMany(existed_condition, update_data, options, function(err, numAffected){
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

module.exports = Device;
