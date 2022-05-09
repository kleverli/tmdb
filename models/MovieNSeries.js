/**
 * author: Feipiao
 * movie detail
 */
//grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Constant = require('../common/constant.js');

//define format of Collection
var MovieSchema = new Schema({
    title_display_name :   {type: Array},
    backdrop_images :   {type: Array},
    trailer_urls    :   {type: Array},
    imdb_id         :   {type: String, trim: true},
    //category_id     :   {type: String},
    category        :   {type: String},   //used to pass data to front end
    subtitle_link   :   {type: Array},
    torrent_url_1   :   {type: Object},
    file_size_1     :   {type: String},
    torrent_url_2   :   {type: Object},
    file_size_2     :   {type: String},
    video_duration  :   {type: Number},
    imdb_score      :   {type: Number},
    rating          :   {type: String, trim: true},
    startyear       :   {type: Number},
    cover_image     :   {type: String},
    thumbnail_image :   {type: String},
    webseed_url_1   :   {type: String},
    webseed_url_2   :   {type: String},
    webseed_url_3   :   {type: String},
    //createdAt       :   {type: Date},
    updatedAt       :   {type: Date},
    is_active       :   {type: Number, default: 1},
    note            :   {type: String},   //admin note here
    releaseDate     :   {type: String}

   
}, { collection: 'movie_n_series' });

//the schema is useless so far
//we need to create a model using it
var MovieN =  mongoose.model('MovieN', MovieSchema);

MovieN.prototype.search_by_condition = function(condition, paging, fields, sort, resp_func){
    MovieN.find(condition).limit(paging.limit).skip(paging.skip).select(fields).sort(sort).exec(function(err, res) {
        if (err) {
            var resp = {
                result : Constant.FAILED_CODE,
                message : Contstant.SERVER_ERR,
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

MovieN.prototype.findOne = function(condition,fields, resp_func){
    MovieN.findOne(condition).select(fields).exec(function(err, res) {
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

MovieN.prototype.countDocuments = function(condition, resp_func){
    MovieN.countDocuments(condition, function(err, res) {
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

MovieN.prototype.update = function(existed_condition, update_data, resp_func){
    var options = { upsert: false };
    update_data['updatedAt'] = Math.floor(Date.now());
    MovieN.updateMany(existed_condition, update_data, options, function(err, numAffected){
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

//
module.exports = MovieN;