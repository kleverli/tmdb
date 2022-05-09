const express = require('express');
const router = express.Router();
const Temp = require('../models/Temp.js');
var Common = require('../common/common.js');
const Constant = require('../common/constant.js');
var utils = require('../common/web_utils.js');
var Category = require('../models/Category.js');

var mongoose = require('mongoose');

var MovieN = require('../models/MovieNSeries.js');
var MovieDetails = require('../models/MovieNSeriesDetails.js');
var Person = require('../models/PersonDetails.js');

function getItemByProperty(arr, propName, propValue){
    for(var i = 0; i < arr.length; i ++){
        if (arr[i][propName] == propValue){
            return arr[i];
        }
    }
    return null;
}

function getItemByStrProperty(arr, propName, propValue){
    for(var i = 0; i < arr.length; i ++){
        if (arr[i][propName].toString() == propValue.toString()){
            return arr[i];
        }
    }
    return null;
}

router.get('/cate/list', function(req, res, next) {
    var category = new Category();
    //get all categories
    category.getAllNoPaging({"is_active": 1}, function(resp_category) {
        var cat_list = [];
        if (resp_category.result == Constant.OK_CODE && resp_category.data != null){
            for (var i = 0; i < resp_category.data.length; i++){
                cat_list.push(resp_category.data[i]["name"]);
            }
        }
        return res.rest.success({data: cat_list});
    });
    
});

router.get('/subtitle-link/:movieId', function(req, res, next) {
    var movieId = req.params.movieId;
    let common = new Common();
    if (common.isEmpty(movieId)){
        res.rest.success({message: "Missing movie id"});
        return;
    }
    var movie = new MovieN();
    var fileds = '_id subtitle_link';
    movie.findOne({"_id":movieId}, fileds, function(resp){
        if (resp.result == Constant.OK_CODE && resp.data) {
            var mv = resp.data;
            var links = mv["subtitle_link"];
            var mvId = mv["_id"];
            if (links && links.length > 0){
                for (const subtitle of links) {
                    for(var key in subtitle){
                        subtitle[key] = Constant.S3_BUCKET + mvId + "/" + subtitle[key];
                    }
                }
            } else {
                mv["subtitle_link"] = []
            }
            res.rest.success({data: mv});
        }else {
            res.rest.success(resp);
        }
    });
});

router.get('/movie/page-list', function(req, res, next) {
    var condition = {"is_active": 1};
    var category = req.query["category"];
    var country = req.query["country"];
    let common = new Common();
    if (common.isNotEmpty(category)){
        condition["category"] = category;
    } else {
        //category = "movie";
        //condition["category"] = "movie";
    }
    if (common.isNotEmpty(country)){
        condition["countries"] = {$regex: country, $options: "i" };
    }
    /*var sorts = req.query["sort"];
    if (common.isNotEmpty(sorts)){
        sort_arr = sorts.split(" ");
        var sort_fields = ["startyear", "imdb_score"];

    }*/
 
    
    var paging = utils.getPage(req,80);
    var movie = new MovieN();
    movie.countDocuments(condition, function (res_total) {
        var show_data = [];
        var total = 0;
        if (res_total.result == Constant.OK_CODE){
            total = res_total.data;
            var sorts = {"releaseDate": -1, "_id": 1};
            movie.search_by_condition(condition, paging,'_id title_display_name imdb_id imdb_score category startyear releaseDate thumbnail_image countries', sorts, function(resp){
            //movie.search_by_condition(condition, paging,'_id title_display_name startyear',{startyear: -1}, function(resp){
                if (resp.result == Constant.OK_CODE && resp.data) {
                    var mvs = resp.data;
                    var ids = [];
                    for (var i = 0; i < resp.data.length; i++){
                        ids.push(resp.data[i]["_id"]);
                    }
                    var movieDetails = new MovieDetails();
                    movieDetails.getAllNoPaging({"movie_id": {"$in":ids}},{}, function(resp_detail){
                        if(resp_detail.data){
                            var arr = [], item;
                            for (var i = 0; i < mvs.length; i++){
                                item = getItemByStrProperty(resp_detail.data, "movie_id", mvs[i]["_id"]);
                                if (item){
                                    mvs[i]["_doc"]["genre"] = item.genre;
                                }
                            }
                            //resp_detail.data = mvs;
                            res.rest.success({data:mvs, total: total});
                        } else {
                            res.rest.success({data:mvs, total: total});
                        }
                    });
                } else {
                    res.rest.success({data: show_data, total: total});
                }
            });
        } else {
            res.rest.success({data: show_data, total: total});   //success
        }
    });
});

router.get('/movie/search', function(req, res, next) {
    
    var category = req.query["category"];
    var genre = req.query["genre"]
    var keyword = req.query["keyword"];
    var actor = req.query["actor"];
    var country = req.query["country"];

    var condition = {};
    let common = new Common();
    if (common.isEmpty(category)){
        condition["movie.category"] = "movie";
    } else {
        condition["movie.category"] = category;
    }

    if (common.isNotEmpty(genre)){
        condition["genre"] = genre;
    }

    if (common.isNotEmpty(country)){
        condition["movie.countries"] = {$regex: country, $options: "i" };
    }

    if (common.isNotEmpty(actor)){
        //condition["cast.name"] = actor; // /^xiao$/
        condition["cast.name"] = {$regex: actor, $options: "i" } // "^" + actor + "$"
    }
    
    if (common.isNotEmpty(keyword)){
        condition["$or"] =[ {"director": { $regex: keyword, $options: "i" }},
                            {"movie.title_display_name.title": { $regex: keyword, $options: "i" }},
                            {"cast.name": { $regex: keyword, $options: "i" }}
        ];
    }

    var paging = utils.getPage(req,80);

    var fields = {
        '_id': 1,
        'genre': 1,
        //'discription': 1,
        //'cast': 1,
        'movie' : { 
            '_id' : 1,
            'title_display_name' : 1,
            'imdb_id' : 1,
            'category' : 1,
            'imdb_score' : 1,
            'startyear': 1,
            'releaseDate': 1,
            'countries' : 1,
            'thumbnail_image': 1
        }
      };

    var movieDetails = new MovieDetails();
    var count_key = "genre";
    var count_fields = {
        '_id': 1,
        'genre': 1,
        //'discription': 1,
        //'cast': 1,
        'movie' : { 
            'imdb_id' : 1
        }
    };
    movieDetails.count_keywords(condition, paging, count_fields, count_key, {updatedAt:1}, function(resp_t){
        var show_data = [];
        var total = 0;
        if (resp_t.result == Constant.OK_CODE && resp_t.data) {
            if (resp_t.data.length > 0 && resp_t.data[0][count_key] > 0){ 
                total = resp_t.data[0][count_key];
                var sorts = {"movie.releaseDate": -1, "_id": 1};
                movieDetails.search_by_keywords(condition, paging, fields, sorts, function(resp){
                    if (resp.result == Constant.OK_CODE && resp.data) {
                        var list = [], item;
                        for (var i = 0; i < resp.data.length; i++){
                            item = resp.data[i].movie[0];
                            item["genre"] = resp.data[i].genre;
                            list.push(item);
                        }
                        
                        res.rest.success({data: list, total: total});
                    } else {
                        res.rest.success({data: show_data, total:0});
                    }
                });
            } else {
                res.rest.success({data: show_data, total:0});
            }
        } else {
            res.rest.success({data: show_data, total: total});   //success
        }
    });
});

router.get('/movie/detail/:movieId', function(req, res, next) {
    var movieId = req.params.movieId;
    let common = new Common();
    if (common.isEmpty(movieId)){
        res.rest.success({message: "Missing movie id"});
        return;
    }
    var movie = new MovieN();
    var fileds = '_id title_display_name torrent_url_1 torrent_url_2 webseed_url_1 webseed_url_2 file_size_1 file_size_2 video_duration rating cover_image backdrop_images trailer_urls';
    movie.findOne({"_id":movieId}, fileds, function(resp){
        if (resp.result == Constant.OK_CODE && resp.data) {
            var mv = resp.data;
            var movieDetails = new MovieDetails();
            movieDetails.findOne({movie_id:mv["_id"]}, function(resp_detail){
                mv["_doc"].discription = [];
                if (resp_detail.result == Constant.OK_CODE && resp_detail.data) {
                    mv["_doc"].discription = resp_detail.data.discription;
                }
                //resp_detail.data = mv;
                // mv["_doc"].webseed_url_2 = common.replace_s3_to_bcdn(mv["webseed_url_2"]);
                if (mv["torrent_url_1"] && mv["torrent_url_1"]["url"]){
                    mv["torrent_url_1"]["url"] = common.decrypt_magnet_link(mv["torrent_url_1"]["url"])
                }
                

                res.rest.success({data:mv});
            });
        }else {
            res.rest.success(resp);
        }
    });
});

router.get('/movie/actor/:movieId', function(req, res, next) {
    var movieId = req.params.movieId;
    let common = new Common();
    if (common.isEmpty(movieId)){
        res.rest.success({message: "Missing movie id"});
        return;
    }

    var movieDetails = new MovieDetails();
    movieDetails.findOne({movie_id:mongoose.Types.ObjectId(movieId)}, function(resp){
        if (resp.result == Constant.OK_CODE && resp.data) {
            if (resp.data.cast && resp.data.cast.length > 0){
                var arrCast = resp.data.cast;
                var ids = [];
                for (var i = 0; i < arrCast.length; i++){
                    ids.push(arrCast[i].person_id);
                }
                var person = new Person();
                person.getAllNoPaging({"person_id": {"$in":ids}}, function(resp_p){
                    if(resp_p.data){
                        var arr = [], item;
                        for (var i = 0; i < arrCast.length; i++){
                            item = getItemByProperty(resp_p.data, "person_id", arrCast[i].person_id)
                            if (item){
                                arrCast[i]["profile_path"] = item.profile_path;
                                arrCast[i]["also_known_as"] = item.also_known_as;
                            }
                        }
                        //resp_p.data = arrCast
                        res.rest.success({data:arrCast});
                    } else {
                        res.rest.success( {data:[]});
                    }
                });
            } else {
                res.rest.success( {data:[]});
            }
        } else{
            res.rest.success({message: Constant.NOT_FOUND});
        }
    });
});

router.get('/country-list', function(req, res, next) {
    var countries = [
        'Afghanistan', 'Algeria', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Belgium', 
        'Bosnia and Herzegovina', 'Brazil', 'Bulgaria', 'Cambodia', 'Cameroon', 'Canada',
        'Chad', 'Chile', 'China', 'Colombia', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
        'Czechoslovakia', 'Denmark', 'Dominican Republic', 'Ecuador', 'Egypt', 'Estonia', 
        'Federal Republic of Yugoslavia', 'Finland', 'France', 'Georgia', 'Germany', 'Ghana',
        'Greece', 'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 
        'Ireland', 'Isle of Man', 'Israel', 'Italy', 'Japan', 'Jordan', 'Kazakhstan', 
        'Kenya', 'Korea', 'Kosovo', 'Laos', 'Latvia', 'Lebanon', 'Lithuania', 'Luxembourg',
        'Macao', 'Malaysia', 'Malta', 'Mauritania', 'Mexico', 'Monaco', 'Morocco', 'Netherlands',
        'New Zealand', 'Nigeria', 'North Korea', 'Norway', 'Occupied Palestinian Territory', 
        'Pakistan', 'Panama', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Puerto Rico',
        'Qatar', 'Republic of Macedonia', 'Romania', 'Russia', 'Saudi Arabia', 'Senegal', 
        'Serbia', 'Singapore', 'Slovakia', 'Slovenia', 'South Africa', 'South Korea',
        'Soviet Union', 'Spain', 'Sweden', 'Switzerland', 'Taiwan', 'Tanzania', 
        'Thailand', 'Tunisia', 'Turkey', 'UK', 'USA', 'Uganda', 'Ukraine','United Arab Emirates', 
        'Uruguay', 'Venezuela', 'Vietnam', 'West Germany', 'Yugoslavia'
    ]
    res.rest.success({data: countries});
});

module.exports = router;
