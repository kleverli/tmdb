/**
 * author: Martin
 * actress detail
 */
//grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Constant = require('../common/constant.js');

//define format of Collection
var ActressSchema = new Schema({
    names            :   {type: Object},  //multi languages
    avatar            :   {type: String, trim: true},
    id           :   {type: String, trim: true},
    order          :   {type: Number, default: 1},
    url        :   {type: String, trim: true},  //original url
    category_id        :   {type: String, trim: true},
    category_name     :   {type: String},   //used to pass data to front end
    is_active       :   {type: Number, default: 1}
}, { collection: 'actress' });

//the schema is useless so far
//we need to create a model using it
var Actress = mongoose.model('Actress', ActressSchema);

//
Actress.prototype.search_by_condition = function(condition, paging, fields, sort, resp_func){
    Actress.find(condition).limit(paging.limit).skip(paging.skip).select(fields).sort(sort).exec(function(err, res) {
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
Actress.prototype.getAll = function(resp_func){
    Actress.find().exec(function(err, res) {
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
Actress.prototype.countDocuments = function(condition, resp_func){
    Actress.countDocuments(condition, function(err, res) {
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
Actress.prototype.findOne = function(condition, resp_func){
    Actress.findOne(condition).exec(function(err, res) {
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
Actress.prototype.update = function(existed_condition, update_data, resp_func){
    var options = { upsert: false };
    Actress.updateMany(existed_condition, update_data, options, function(err, numAffected){
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
module.exports = Actress;
