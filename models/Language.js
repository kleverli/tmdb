/**
 * author: Martin
 * language detail
 */
//grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Constant = require('../common/constant.js');

//define format of Collection
var LanguageSchema = new Schema({
    key            :   {type: String, trim: true},  //unique, English name
    en        : {type: String, trim: true}, //English
    cn       :   {type: String, trim: true},    //Chinese
    kr        : {type: String, trim: true}, //Korean
    ru       :   {type: String, trim: true},    //Russian
    is_active:  {type: Number, default: 1}
}, { collection: 'language' });

//the schema is useless so far
//we need to create a model using it
var Language = mongoose.model('Language', LanguageSchema);

//create new document
Language.prototype.create = function(data, resp_func){
    var language = new Language(data);
    language.save(function(err, result){
        if(err) {
            var resp = {
                result : Constant.FAILED_CODE,
                message: Constant.SERVER_ERR,
                err: err
            };
            resp_func(resp);
        } else {
            var resp = { result : Constant.OK_CODE, _id: result._id };
            resp_func(resp);
        }
    });
};
//
Language.prototype.search_by_condition = function(condition, paging, fields, sort, resp_func){
    Language.find(condition).limit(paging.limit).skip(paging.skip).select(fields).sort(sort).exec(function(err, res) {
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
Language.prototype.getAllNoPaging = function(condition, resp_func){
    Language.find(condition).exec(function(err, res) {
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
Language.prototype.getAll = function(resp_func){
    Language.find().exec(function(err, res) {
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
Language.prototype.countDocuments = function(condition, resp_func){
    Language.count(condition, function(err, res) {
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
Language.prototype.findOne = function(condition, resp_func){
    Language.findOne(condition).exec(function(err, res) {
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
Language.prototype.update = function(existed_condition, update_data, resp_func){
    var options = { upsert: false };
    Language.updateMany(existed_condition, update_data, options, function(err, numAffected){
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
module.exports = Language;
