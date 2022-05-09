/**
 * author: Martin
 * movie detail
 */
//grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Constant = require('../common/constant.js');

//define format of Collection
var MovieSchema = new Schema({
    code            :   {type: String, trim: true},  //unique
    title           :   {type: String, trim: true},
    description           :   {type: String, trim: true},
    share_date      :   {type: String}, //yyyy-mm-dd
    share_date_utc  : {type: Number},   //timestamp UTC at 0:0
    idx_in_day: {type: Number, default: 1},   //index of movie to move next/prev (within 1 day)
    thumbnail       :   {type: String},
    cover_url       :   {type: String},
    size            :   {type: String},
    play_links       :  {type: Array}, //list of magnet links, latest at the end
    thumb_pics      :   {type: Array},
    note: {type: String},   //admin note here
    speed: {type: Number},  //latest download speed, in byte unit
    is_processed_speed: {type:Number, default: 0},  //indicate this movie is calculated average speed or not
    created_time    :   {type: Number},
    updated_time    :   {type: Number},
    category_id     :   {type: String},
    category_name     :   {type: String},   //used to pass data to front end
    source: {type: String}, //where to scrape data (javbus, ...)
    is_active       :   {type: Number, default: 1},
    original_links: {type: Array},   //original info of magnet links from javbus
    // is_uploaded_s3: {type:Number, default: 0},  //indicate this movie images were uploaded to s3 or not
    video_len: {type: String},
    actress: {type: Object},
    scanned_time: {type: Number},    //latest time scan javbus to update list magnet links
    subtitle_link: {type: String},   //filename only, link = s3 path / movie id / ...
    org_url: {type: String},   //url of main video file, like ...wasabisys.com/.../...mp4
    link_type: {type:String},  //sukebei/webseed or empty
    // search_term: {type:String},  //used in search, include title, description, actress name in lower case
    searched_sukebei: {type:Number, default: 0},  //search this movie in sukebei site or not
    trailer_url: {type:String},
    processed_auto_tool: {type:Number, default: 0}
}, { collection: 'movie' });

//the schema is useless so far
//we need to create a model using it
var Movie = mongoose.model('Movie', MovieSchema);

//create new document
Movie.prototype.create = function(data, resp_func){
    var movie = new Movie(data);
    movie.save(function(err, result){
        if(err) {
            var resp = {
                result : Constant.FAILED_CODE,
                message: Constant.SERVER_ERR,
                err: err
            };
            resp_func(resp);
        }else{
            var resp = { result : Constant.OK_CODE };
            resp_func(resp);
        }
    });
};
//
Movie.prototype.search_by_condition = function(condition, paging, fields, sort, resp_func){
    Movie.find(condition).limit(paging.limit).skip(paging.skip).select(fields).sort(sort).exec(function(err, res) {
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
Movie.prototype.findOne = function(condition, resp_func){
    Movie.findOne(condition).exec(function(err, res) {
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
//keep input data
Movie.prototype.findOneWithOrgData = function(condition, org_data, resp_func){
    Movie.findOne(condition).exec(function(err, res) {
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
                org_data: org_data
            };
            resp_func(resp);
        }
    });
};
//
Movie.prototype.getAll = function(resp_func){
    Movie.find().exec(function(err, res) {
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
Movie.prototype.countDocuments = function(condition, resp_func){
    Movie.countDocuments(condition, function(err, res) {
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
Movie.prototype.getAllNoPaging = function(condition, resp_func){
    Movie.find(condition).exec(function(err, res) {
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
Movie.prototype.update = function(existed_condition, update_data, resp_func){
    var options = { upsert: false };
    update_data['updated_time'] = Math.floor(Date.now() / 1000);
    Movie.updateMany(existed_condition, update_data, options, function(err, numAffected){
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
module.exports = Movie;
