/**
 * author: Martin
 * save device & seen movies of this device
 */
//grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Constant = require('../common/constant.js');

//define format of Collection
var SeenMovieSchema = new Schema({
    device_id            :   {type: String},
    category_id: {type: String},
    list    :   [{type: String}],
    user_id: {type: String},    //todo add here of seen movies
}, { collection: 'seen_movie' });

//the schema is useless so far
//we need to create a model using it
var SeenMovie = mongoose.model('SeenMovie', SeenMovieSchema);
//
SeenMovie.prototype.findOne = function(condition, resp_func){
    SeenMovie.findOne(condition).exec(function(err, res) {
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
SeenMovie.prototype.getAllNoPaging = function(condition, resp_func){
    SeenMovie.find(condition).exec(function(err, res) {
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
SeenMovie.prototype.create = function(data, resp_func){
    var document = new SeenMovie(data);
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
SeenMovie.prototype.update = function(existed_condition, update_data, resp_func){
    var options = { upsert: false };
    update_data['updated_time'] = Math.floor(Date.now() / 1000);
    SeenMovie.updateMany(existed_condition, update_data, options, function(err, numAffected){
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

module.exports = SeenMovie;
