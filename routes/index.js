var express = require('express');
var router = express.Router();
var Common = require('../common/common.js');
var Constant = require('../common/constant.js');
var Device = require('../models/Device.js');
var Movie = require('../models/Movie.js');
var Category = require('../models/Category.js');
var SeenMovie = require('../models/SeenMovie.js');
var DeviceMovieSpeed = require('../models/DeviceMovieSpeed.js');
var DeviceUser = require('../models/DeviceUser.js');
var SiteSetting = require('../models/SiteSetting.js');
var ObjectId = require('mongodb').ObjectID;
var Actress = require('../models/Actress.js');
var Keyword = require('../models/Keyword.js');
//var getfunc = require('../routes/UserController.js');
var axios = require('axios');


// let getlangfunc = async function(){
//     let obj  ="EN";
//     try
//     {
//         let langresponse = await axios.post(`${Constant.URL_SERVER_LINK}checklang`);
//         if (langresponse.data.issuccess == "success" || langresponse.data.issuccess == "오류") {
//               obj = langresponse.data.lang;
//         }
//     }
//     catch(error)
//     {
//         obj = "EN";
//     }
//     return obj;
// }
/* GET home page. */
router.get('/',async function(req, res) {
    try
    {
    //    let language = await getlangfunc();
        let tmdbRes = await axios.get(`${Constant.GET_POPULAR_MOVIE_API}${Constant.API_KEY}`);
        if(tmdbRes.data && tmdbRes.data.total_results > 0 ) {
            let backdrop_images = [];
            for(i=0;i<tmdbRes.data.results.length;i++)
            {
                if(tmdbRes.data.results[i].backdrop_path && tmdbRes.data.results[i].backdrop_path !== null && tmdbRes.data.results[i].backdrop_path !== "") {
                    backdrop_images.push( `${Constant.BACKDROP_IMAGE_URL}${tmdbRes.data.results[i].backdrop_path}`);
                }
            }
            res.render('hello',{backdrop_images:backdrop_images});
        }
    }
    catch(error)
    { 
        
        return res.render('error');
    }
});
/* GET home page. */
router.get('/api', function(req, res) {
    res.render('api');
});
//short video in homepage or iframe
router.get('/intro_video', function (req, res) {
    //get home torrent_link
    var siteSetting = new SiteSetting();
    siteSetting.findOne({key: "site_setting"}, function(resp){
        res.render('intro_video', {home_torrent_link: resp.data['home_torrent_link']});
    });
});
//get all language
router.get('/language-codes', function(req, res) {
    var lang_code = req.query['lang_code'];
    var common = new Common();
    if (common.isEmpty(lang_code)){
        lang_code = 'en';   //default english
    }
});
router.get('/solji_kim', function(req, res) {
    res.render('solji_kim');
});
//
router.get('/search-title-by-actress', function(req, res) {
    var common = new Common();
    var playlist_movie_ids = req.query['playlist_movie_ids']; //must include movies being in playlist
    if (common.isEmpty(playlist_movie_ids)) {
        playlist_movie_ids = [];
    } else {
        playlist_movie_ids = playlist_movie_ids.split(',');
    }
    var current_movie_id = req.query['current_movie_id'];
    if (common.isNotEmpty(current_movie_id)){
        playlist_movie_ids.push(current_movie_id);
    }
    var actress_id = req.query['actress_id'];   //required
    var page = parseInt(req.query['page']);     //start from 1
    var limit = parseInt(req.query['limit']);   //default 20
    var navigation = req.query['navigation'];    //next, previous
    var category_id = req.query['category_id'];
    var has_subtitle = req.query['has_subtitle'];   //0/1

    var actress = new Actress();
    //search jp actress name
    actress.search_by_condition({_id:actress_id}, {limit:1, skip:0}, '', {}, function(actress_detail){
        if (actress_detail.data != null && actress_detail.data.length > 0) {
            var jp_name = actress_detail.data[0]['names']['jp'];    //all actress must have JP name
            if (jp_name == null || jp_name == ''){
                res.rest.success([]);   //no name
            } else {
                var condition = {};
                condition['is_active'] = 1;
                condition['play_links'] = {$exists: true, $ne: []};
                if (category_id !== undefined && category_id != null && category_id != ''){
                    condition['category_id'] = category_id;
                } else {
                    condition['category_id'] = actress_detail.data[0]['category_id'];
                }
                condition['actress.jp'] = {"$regex" : ".*"+jp_name+".*", '$options': 'i'};
                condition['_id'] = {"$nin": playlist_movie_ids};
                if (has_subtitle !== undefined && has_subtitle != null && has_subtitle != 0){
                    condition['subtitle_link'] = {$exists: true, $ne: ''};
                }
                //get index of current movie id
                if (common.isNotEmpty(current_movie_id) && (navigation == 'next' || navigation == 'previous')){
                    var movie = new Movie();
                    movie.findOne({_id:current_movie_id}, function(resp_detail){
                        if (navigation == 'next'){  //older
                            condition['idx_in_day'] = {"$lt": resp_detail.data['idx_in_day']};
                            get_movies_by_condition(condition, {limit:limit, skip:0}, {idx_in_day: -1}, function (resp) {
                                res.rest.success(resp);
                            });
                        } else if (navigation == 'previous'){   //newer
                            condition['idx_in_day'] = {"$gt": resp_detail.data['idx_in_day']};
                            get_movies_by_condition(condition, {limit:limit, skip:0}, {idx_in_day: 1}, function (resp) {
                                res.rest.success(resp);
                            });
                        }
                    });
                } else {
                    //search many with pagination
                    var movie = new Movie();
                    movie.countDocuments(condition, function(total){
                        var total_val = total.data;
                        get_movies_by_condition(condition, {limit:limit, skip:(page-1) * Constant.DEFAULT_PAGE_LENGTH}, {idx_in_day: -1}, function (resp) {
                            var result = {
                                total: total_val,
                                list: resp
                            };
                            res.rest.success(result);
                        });
                    });
                }
            }
        } else {
            //actress not found
            res.rest.success([]);
        }
    });
});
//search title
router.post('/search-title', function(req, res) {
    var common = new Common();
    var playlist_movie_ids = req.body['playlist_movie_ids']; //must include movies being in playlist
    if (common.isEmpty(playlist_movie_ids)) {
        playlist_movie_ids = [];
    } else {
        playlist_movie_ids = playlist_movie_ids.split(',');
    }
    var current_movie_id = req.body['current_movie_id'];
    if (common.isNotEmpty(current_movie_id)){
        playlist_movie_ids.push(current_movie_id);
    }
    var category_id = req.body['category_id'];
    var keyword = req.body['keyword']; //not required
    var page = parseInt(req.body['page']);   //start from 1
    var limit = parseInt(req.body['limit']); //default 20
    var navigation = req.body['navigation'];   //next, previous
    var has_subtitle = req.body['has_subtitle'];   //0/1
    var condition = {};
    condition['is_active'] = 1;
    condition['play_links'] = {$exists: true, $ne: []};
    if (category_id !== undefined && category_id != null && category_id != ''){
        condition['category_id'] = category_id;
    }
    // condition['search_term'] = {"$regex" : ".*"+keyword+".*", '$options': 'i'};
    if (keyword != null && keyword !== undefined && keyword != ''){
        condition['title'] = {"$regex" : ".*"+keyword+".*", '$options': 'i'};
        // var keywordDoc = new Keyword();
        // keywordDoc.create({keyword_title: keyword, created_time: common.get_created_time()}, function (resp_k) {});
    }
    condition['_id'] = {"$nin": playlist_movie_ids};
    if (has_subtitle !== undefined && has_subtitle != null && has_subtitle != 0){
        condition['subtitle_link'] = {$exists: true, $ne: ''};
    }
    //get index of current movie id
    if (common.isNotEmpty(current_movie_id) && (navigation == 'next' || navigation == 'previous')){
        var movie = new Movie();
        movie.findOne({_id:current_movie_id}, function(resp_detail){
            if (navigation == 'next'){  //get older
                condition['idx_in_day'] = {"$lt": resp_detail.data['idx_in_day']};
                get_movies_by_condition(condition, {limit:limit, skip:0}, {idx_in_day: -1}, function (resp) {
                    res.rest.success(resp);
                });
            } else if (navigation == 'previous'){   //get newer
                condition['idx_in_day'] = {"$gt": resp_detail.data['idx_in_day']};
                get_movies_by_condition(condition, {limit:limit, skip:0}, {idx_in_day: 1}, function (resp) {
                    res.rest.success(resp);
                });
            }
        });
    } else {
        //search many with pagination
        //get total
        var movie = new Movie();
        movie.countDocuments(condition, function(total){
            var total_val = total.data;
            get_movies_by_condition(condition, {limit:limit, skip:(page-1) * Constant.DEFAULT_PAGE_LENGTH}, {idx_in_day: -1}, function (resp) {
                var result = {
                    total: total_val,
                    list: resp
                };
                res.rest.success(result);
            });
        });
    }
});
//get previous(newer) movie of device in current category
router.get('/app-previous-movie', function(req, res) {
    var common = new Common();
    var playlist_movie_ids = req.query['playlist_movie_ids']; //must include movies being in playlist
    if (common.isEmpty(playlist_movie_ids)) {
        playlist_movie_ids = [];
    } else {
        playlist_movie_ids = playlist_movie_ids.split(',');
    }
    var category_id = req.query['category_id'];
    var current_movie_id = req.query['current_movie_id'];   //required
    playlist_movie_ids.push(current_movie_id);
    var device_code = req.query['device_code'];
    var condition = {};
    condition['is_active'] = 1;
    condition['play_links'] = {$exists: true, $ne: []};
    condition['category_id'] = category_id;
    condition['_id'] = {"$nin": playlist_movie_ids};
    var has_subtitle = req.query['has_subtitle'];   //0/1
    if (has_subtitle !== undefined && has_subtitle != null && has_subtitle != 0){
        condition['subtitle_link'] = {$exists: true, $ne: ''};
    }
    var movie = new Movie();
    movie.findOne({_id:current_movie_id}, function(resp_detail){
        condition['idx_in_day'] = {"$gt": resp_detail.data['idx_in_day']};
        get_movies_by_condition(condition, {limit:1, skip:0}, {idx_in_day: 1}, function (resp) {
            //save latest viewing movie of this device
            save_latest_movie_device(category_id, device_code, current_movie_id, function(){});
            res.rest.success(resp);
        });
    });
});
//
function save_latest_movie_device(category_id, device_code, current_movie_id, callback){
    var common = new Common();
    var device = new Device();
    device.findOne({device_code: device_code}, function(resp_detail) {
        if (resp_detail.result == Constant.OK_CODE && common.isNotEmpty(resp_detail.data)) {
            var viewing_movie_ids = resp_detail.data['viewing_movie_ids'];
            if (viewing_movie_ids == null || viewing_movie_ids === undefined){
                viewing_movie_ids = {};
            }
            viewing_movie_ids[category_id] = current_movie_id;
            device.update({_id: resp_detail.data['_id']}, {viewing_movie_ids: viewing_movie_ids}, callback);
        } else {
            var viewing_movie_ids = {};
            viewing_movie_ids[category_id] = current_movie_id;
            //device not found
            device.create({device_code: device_code, viewing_movie_ids: viewing_movie_ids}, callback);
        }
    });
}
//get next movie for desktop app, called when user swipes left or opens app
/*
params: device_code / category_id / is_load_app / seen_movie_ids
 */
router.get('/app-next-movie', function(req, res) {
    var common = new Common();
    var app_version = req.query['app_version'];
    var category = new Category();
    if (app_version == null || app_version != "22.1"){
        category.search_by_condition({is_active: 1}, {limit:20, skip:0},
            '_id name language_key index is_paid', {index:1}, function (resp_cat_list) {
                get_movies_by_condition({_id:"60dab38f7a1d21cf5d06cdee"},{},{}, function(latest_list){    //annoucement movie
                    res.rest.success({list: latest_list, categories: resp_cat_list.data});
                });
            });
        return;
    }

    var seen_movie_ids = req.query['seen_movie_ids']; //must include movies being in playlist
    if (common.isEmpty(seen_movie_ids)){
        seen_movie_ids = [];
    } else {
        seen_movie_ids = seen_movie_ids.split(',');
    }
    var device_code = req.query['device_code'];
    var category_id = req.query['category_id'];
    var is_load_app = req.query['is_load_app']; //1: user opens app
    var has_subtitle = req.query['has_subtitle'];   //0/1
    is_load_app = parseInt(is_load_app);
    // console.log('seen_movie_ids', seen_movie_ids);
    var category = new Category();
    if (is_load_app > 0){   //open app at first time
        //get latest categories
        category.search_by_condition({is_active: 1}, {limit:20, skip:0},
            '_id name language_key index is_paid', {index:1}, function (resp_cat_list) {
                if (common.isEmpty(category_id)){
                    category_id = resp_cat_list.data[0]['_id'];     //get default
                }
                getOlderMovieOfDevice(device_code, category_id, seen_movie_ids, has_subtitle, function(response){
                    response['categories'] = resp_cat_list.data;
                    res.rest.success(response);
                });
            });
    } else {
        if (category_id == null || category_id == ''){
            //need to get default category
            category.findOne({index: 1}, function (default_cat) {
                if (default_cat.result == Constant.OK_CODE) {
                    if (default_cat.data != null && default_cat.data['_id'] != null) {
                        category_id = default_cat.data['_id'];
                    }
                }
                //just get next movie
                getOlderMovieOfDevice(device_code, category_id, seen_movie_ids, has_subtitle, function(response){
                    res.rest.success(response);
                });
            });
        } else {
            getOlderMovieOfDevice(device_code, category_id, seen_movie_ids, has_subtitle, function(response){
                res.rest.success(response);
            });
        }
    }
});
//clear seen movies of device (for testing)
router.delete('/clear-listing-order', function(req, res) {
    var device_code = req.query['device_code'];
    var device = new Device();
    var common = new Common();

    device.findOne({device_code: device_code}, function(resp_detail) {
        if (resp_detail.result == Constant.OK_CODE && common.isNotEmpty(resp_detail.data)) {
            var device_db_id = resp_detail.data['_id'];
            device.update({_id: device_db_id}, {current_movie_id: '', viewing_movie_ids: {}}, function(){});
            //clear watching movies in this device
            var deviceUser = new DeviceUser();
            deviceUser.update({device_id: device_db_id}, {watching_movies: []}, function(){});
            var seenMovie = new SeenMovie();
            seenMovie.getAllNoPaging({device_id: device_db_id}, function(resp_detail_seen) {
                if (resp_detail_seen.result == Constant.OK_CODE) {
                    if (resp_detail_seen.data != null && resp_detail_seen.data.length > 0) {
                        for (var i=0; i<resp_detail_seen.data.length; i++){
                            clear_seen_movie(resp_detail_seen.data[i]['_id'], [], function(){
                            });
                        }
                        res.rest.success();
                    } else {
                        //device not seen any movie, do nothing
                        res.rest.success();
                    }
                } else {
                    //device not seen any movie, do nothing
                    res.rest.success();
                }
            });
        } else {
            //device not found
            res.rest.success();
        }
    });
});
//save speed of device & movie
router.post('/device-movie-speed', function(req, res) {
    var device_code = req.body['device_code'];
    var movie_id = req.body['movie_id'];
    var list = req.body['list'];    //speed list
    var device = new Device();
    var common = new Common();

    device.findOne({device_code: device_code}, function(resp_detail_device) {
        if (resp_detail_device.result == Constant.OK_CODE && common.isNotEmpty(resp_detail_device.data)) {
            var device_db_id = resp_detail_device.data['_id'];
            var deviceMovieSpeed = new DeviceMovieSpeed();
            deviceMovieSpeed.findOne({device_id: device_db_id, movie_id: movie_id}, function(resp_detail){
                if (resp_detail.result == Constant.OK_CODE){
                    if (resp_detail.data != null && resp_detail.data['_id'] != null){
                        deviceMovieSpeed.update({_id: resp_detail.data['_id']}, {downloadSpeed: list}, function(resp_update){
                            reset_processed_speed(movie_id, function(){});
                            res.rest.success();
                        });
                    } else {
                        //not found
                        deviceMovieSpeed.create({device_id: device_db_id, movie_id: movie_id, downloadSpeed: list}, function(resp_update){
                            reset_processed_speed(movie_id, function(){});
                            res.rest.success();
                        });
                    }
                } else {
                    //something wrong
                    res.rest.success();
                }
            });
        } else {
            //device not found
            res.rest.success();
        }
    });
});
//==========
function getOlderMovieOfDevice(device_code, category_id, seen_movie_ids, has_subtitle, callback) {
    var current_movie_id;
    var common = new Common();
    var active_condition = {};     //active only
    if (common.isNotEmpty(category_id) && category_id != 'undefined'){
        active_condition['category_id'] = category_id;
    }
    if (has_subtitle !== undefined && has_subtitle != null && has_subtitle != 0){
        active_condition['subtitle_link'] = {$exists: true, $ne: ''};
    }
    var movie = new Movie();

    if (seen_movie_ids.length > 0){
        current_movie_id = seen_movie_ids[seen_movie_ids.length - 1];   //last item, but it may belongs to different category
        active_condition['_id'] = {$nin:seen_movie_ids};    //dismiss seen movies
        movie.findOne({_id:current_movie_id}, function(resp_detail){
            if (resp_detail.data != null && resp_detail.data['category_id'] == category_id) {
                active_condition['idx_in_day'] = {"$lt": resp_detail.data['idx_in_day']}; //next movie in current category
                get1LatestMovie(active_condition, function(latest_list){
                    if (common.isNotEmpty(latest_list[0])){
                        save_latest_movie_device(category_id, device_code, latest_list[0]['_id'].toString(), function(){});
                    }
                    callback({list: latest_list});
                });
            } else {
                //switching category, need to view old movie again
                getOlderMovieOfDevice(device_code, category_id, [], has_subtitle, callback);
            }
        });
    } else {
        //load app again
        //find latest viewing movie of this device, this category
        var device = new Device();
        device.findOne({device_code: device_code}, function(resp_detail) {
            if (resp_detail.result == Constant.OK_CODE && common.isNotEmpty(resp_detail.data)) {
                if (resp_detail.data['viewing_movie_ids'] != null && resp_detail.data['viewing_movie_ids'] !== undefined){
                    current_movie_id = resp_detail.data['viewing_movie_ids'][category_id];  //viewing this movie of this category
                }
                if (current_movie_id != null && current_movie_id != '' && current_movie_id !== undefined){
                    movie.findOne({_id:current_movie_id}, function(resp_detail2){
                        if (resp_detail2.data != null && resp_detail2.data['is_active'] > 0 && resp_detail2.data['idx_in_day'] > 1){
                            delete active_condition['subtitle_link'];   //because load this movie again
                            active_condition['idx_in_day'] = resp_detail2.data['idx_in_day'];  //show this movie again
                        }
                        get1LatestMovie(active_condition, function(latest_list){
                            if (common.isNotEmpty(latest_list[0])){
                                save_latest_movie_device(category_id, device_code, latest_list[0]['_id'].toString(), function(){});
                            }
                            callback({list: latest_list});
                        });
                    });
                } else {
                    get1LatestMovie(active_condition, function(latest_list){
                        if (common.isNotEmpty(latest_list[0])){
                            save_latest_movie_device(category_id, device_code, latest_list[0]['_id'].toString(), function(){});
                        }
                        callback({list: latest_list});
                    });
                }
            } else {
                //device not found
                get1LatestMovie(active_condition, function(latest_list){
                    if (common.isNotEmpty(latest_list[0])){
                        save_latest_movie_device(category_id, device_code, latest_list[0]['_id'].toString(), function(){});
                    }
                    callback({list: latest_list});
                });
            }
        });
    }
}
/*
function getLatestMovieOfDevice(device_code, category_id, seen_movie_ids, callback) {
    var common = new Common();
    if (common.isEmpty(device_code)){
        //generate random id
        device_code = common.generateUniqueDeviceId();
    }
    var active_condition = {};     //active only
    if (common.isNotEmpty(category_id) && category_id != 'undefined'){
        active_condition['category_id'] = category_id;
    }
//check if device was registered in system
    var device = new Device();
    device.findOne({device_code: device_code}, function(resp_detail){
        if (resp_detail.result == Constant.OK_CODE && common.isNotEmpty(resp_detail.data)){
            //existed, find latest active movie which never seen before
            var seenMovie = new SeenMovie();
            var device_db_id = resp_detail.data['_id'];
            seenMovie.findOne({device_id: device_db_id, category_id: category_id}, function(resp_detail_seen){
                var seen_movie_list = [];
                var document_id = '';
                if (resp_detail_seen.result == Constant.OK_CODE){
                    if (resp_detail_seen.data != null && resp_detail_seen.data['list'] != null){
                        seen_movie_list = resp_detail_seen.data['list'];
                        document_id = resp_detail_seen.data['_id'];
                    }
                    if (seen_movie_ids.length > 0){
                        seen_movie_list = seen_movie_list.concat(seen_movie_ids);
                        seen_movie_list = common.remove_duplicate_array_item(seen_movie_list);
                    }
                    if (seen_movie_list.length > 0){
                        active_condition['_id'] = {$nin:seen_movie_list};    //dismiss seen movies
                    }
                }
                get1LatestMovie(active_condition, function(latest_list){
                    //load again if no list
                    if (latest_list == null || latest_list.length == 0){
                        //clear seen movie
                        clear_seen_movie(document_id, seen_movie_ids, function(){
                            active_condition = {};
                            if (seen_movie_ids.length > 0){
                                active_condition['_id'] = {$nin:seen_movie_ids};    //dismiss seen movies
                            }
                            if (common.isNotEmpty(category_id) && category_id != 'undefined'){
                                active_condition['category_id'] = category_id;
                            }
                            // not sure why const not working here
                            get1LatestMovie(active_condition, function(new_list){
                                callback({list: new_list});
                            });
                        });
                    } else if (seen_movie_list.length > 0){
                        upsert_seen_movie(document_id, seen_movie_list, device_db_id, category_id, function(){
                            callback({list: latest_list});
                        });
                    } else {
                        callback({list: latest_list});
                    }
                });
            });
        } else {
            //not existed
            device.create({device_code: device_code, created_time: common.get_created_time()}, function (resp_create) {
                if (resp_create.result == Constant.OK_CODE && common.isNotEmpty(resp_create._id)){
                    get1LatestMovie(active_condition, function(latest_list){
                        //load again if no list
                        if (latest_list == null || latest_list.length == 0){
                            //clear seen movie
                            clear_seen_movie('', seen_movie_ids, function(){
                                if (common.isNotEmpty(category_id) && category_id != 'undefined'){
                                    active_condition['category_id'] = category_id;
                                }
                                get1LatestMovie(active_condition, function(new_list){
                                    callback({list: new_list});
                                });
                            });
                        } else {
                            callback({list: latest_list});
                        }
                    });
                } else {
                    //failed to log this device
                    callback({message: Constant.SERVER_ERR});
                }
            });
        }
    });
}
*/
//
function get1LatestMovie(condition, callback){
    condition['is_active'] = 1;
    condition['play_links'] = {$exists: true, $ne: []};
    get_movies_by_condition(condition, {limit:1, skip:0}, {idx_in_day: -1}, callback);
}
//
function get_movies_by_condition(condition, pagination, sort, callback){
    var movie = new Movie();
    // console.log('get_movies_by_condition', condition);
    // console.log(condition);
    movie.search_by_condition(condition, pagination,
        '_id title description thumbnail cover_url play_links category_id size thumb_pics subtitle_link org_url video_len trailer_url link_type', sort, function(resp_list){
            if (resp_list.result == Constant.OK_CODE){
                //replace subtitle_link
                var list = resp_list.data;
                if (resp_list.data != null && resp_list.data.length>0){
                    for (var i=0; i<list.length; i++){
                        if (list[i]['subtitle_link'] != null && list[i]['subtitle_link'] != ''){
                            list[i]['subtitle_link'] = 'https://'+process.env.S3_BUCKET+'.s3.amazonaws.com/'+
                                list[i]['_id']+'/'+list[i]['subtitle_link'];
                        }
                        //only return last magnet link
                        if (list[i]['play_links'].length > 1){
                            list[i]['play_links'] = [list[i]['play_links'][list[i]['play_links'].length -1]];   //get last one only
                        }
                        //remove org_url if sukebei censored (too much cost in Wasabi)
                        if (list[i]['category_id'] == '5f75927b5c425008d254a788' && list[i]['link_type'] == 'sukebei'){
                            list[i]['org_url'] = '';
                        }
                    }
                }
                //
                callback(list);
            } else {
                callback([]);
            }
        });
}
//upsert seen movie
function upsert_seen_movie(document_id, seen_movie_list, device_db_id, category_id, callback){
    var seenMovie = new SeenMovie();
    if (document_id == null || document_id == ''){
        //insert
        seenMovie.create({
            device_id: device_db_id,
            category_id: category_id,
            list: seen_movie_list
        }, callback);
    } else {
        //update
        seenMovie.update({_id: document_id}, {
            list: seen_movie_list
        }, callback);
    }
}
//
function clear_seen_movie(document_id, remain_seen_ids, callback){
    if (document_id == null || document_id == ''){
        callback();
        return;
    }
    var seenMovie = new SeenMovie();
    seenMovie.update({_id: document_id}, {
        list: remain_seen_ids
    }, callback);
}
//because speed of this movie is changed, need to put it back
function reset_processed_speed(movie_id, callback){
    var movie = new Movie();
    movie.update({_id: movie_id}, {is_processed_speed: 0}, callback);
}
//
router.get('/usecase',async function (req, res) {
    res.render('usecase');
});
//
router.get('/terms', function (req, res) {
    res.render('terms');
});
//
router.get('/privacy', function (req, res) {
    res.render('privacy');
});
//
router.get('/api', function (req, res) {
    res.render('api');
});
//
router.get('/signup', function (req, res) {
    res.render('signup');
});
//
router.get('/login', function (req, res) {
    res.render('login');
});
//
router.get('/forgot-password', function (req, res) {
    res.render('forgot-password');
});
//
router.get('/video', function (req, res) {
    res.render('video');
});
//
router.get('/signup-success', function (req, res) {
    res.render('signup-success');
});
//
router.get('/forgot-password', function (req, res) {
    res.render('forgot-password');
});
//
router.get('/verify-password', function (req, res) {
    res.render('verify-password');
});
//
router.get('/reset-password', function (req, res) {
    res.render('reset-password');
});
//
router.get('/verification', function (req, res) {
    res.render('verification');
});
//
router.get('/opensource', function (req, res) {
    res.render('opensource');
});
//
router.get('/api_guide', function (req, res) {
    res.render('api_guide');
});
//
module.exports = router;
