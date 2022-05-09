/**
 * author: Feipiao
 * movie detail
 */
//grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Constant = require('../common/constant.js');

//define format of Collection
var MovieDetailSchema = new Schema({
    genre           :   {type: Array},
    discription     :   {type: Array},
    director        :   {type: Array},
    cast            :   {type: Array},
    movie_id        :   {type: Schema.Types.ObjectId, ref: 'MovieN'}, 
    createdAt       :   {type: Date},
    updatedAt       :   {type: Date}  
}, { collection: 'movie_n_series_details' });

//the schema is useless so far
//we need to create a model using it
var MovieDetail =  mongoose.model('MovieDetail', MovieDetailSchema);

MovieDetail.prototype.search_by_condition = function(condition, paging, fields, sort, resp_func){
    MovieDetail.find(condition).limit(paging.limit).skip(paging.skip).select(fields).sort(sort).exec(function(err, res) {
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

MovieDetail.prototype.findOne = function(condition, resp_func){
    MovieDetail.findOne(condition).exec(function(err, res) {
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

MovieDetail.prototype.getAllNoPaging = function(condition, fields, resp_func){
    MovieDetail.find(condition).select(fields).exec(function(err, res) {
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

MovieDetail.prototype.search_by_keywords = function(condition, paging, fields, sort, resp_func){
    MovieDetail.aggregate([
        {
            $lookup: {
              from: 'movie_n_series',
              localField: 'movie_id',
              foreignField: '_id',
              as: 'movie',
            }
        },
        {
            $match: condition
        },
        {
            $sort: sort
        },
        {
          $project: fields
        },
        {
            $skip: paging.skip
        },
        {
            $limit: paging.limit
        }
    ],function(err, res) {
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

MovieDetail.prototype.count_keywords = function(condition, paging, fields, count_field, sort, resp_func){
    MovieDetail.aggregate([
        {
            $lookup: {
              from: 'movie_n_series',
              localField: 'movie_id',
              foreignField: '_id',
              as: 'movie',
            }
        },
        {
            $match: condition
        },
        /*{
            $project: fields
        },
        {
            $skip: paging.skip
        },*/
        {
            $count: count_field
        }
    ],function(err, res) {
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
module.exports = MovieDetail;