var express = require('express');
var router = express.Router();
var Common = require('../../common/common.js');
var Constant = require('../../common/constant.js');
var Movie = require('../../models/Movie.js');
var Category = require('../../models/Category.js');
var DeviceMovieSpeed = require('../../models/DeviceMovieSpeed.js');
const aws = require('aws-sdk');
var ObjectId = require('mongodb').ObjectID;

//show movie list with pagination
router.get('/list', function(req, res) {
    var common = new Common();
    if (common.isEmpty(req.session[Constant.SESSION.KEY_USER_ID])){
        res.redirect('/admin-control/login');
        return;
    }
    res.render('admin/movie_list', {username: req.session[Constant.SESSION.KEY_USER_ID]});
});

router.get('/detail', function(req, res) {
    var common = new Common();
    if (common.isEmpty(req.session[Constant.SESSION.KEY_USER_ID])){
        res.redirect('/admin-control/login');
        return;
    }
    res.render('admin/movie_detail', {username: req.session[Constant.SESSION.KEY_USER_ID]});
});
//display page
router.get('/upload_subtitle', function(req, res) {
    var common = new Common();
    if (common.isEmpty(req.session[Constant.SESSION.KEY_USER_ID])){
        res.redirect('/admin-control/login');
        return;
    }
    res.render('admin/upload_subtitle', {username: req.session[Constant.SESSION.KEY_USER_ID]});
});
//prepare to upload subttile
router.post('/sign-s3', (req, res) => {
    const movie_id = req.body['movie_id'];
    const fileName = req.body['file_name']; //same as title
    // const fileType = req.body['file_type'];
    // console.log('s3Params', s3Params);
    //verify movie
    var movie = new Movie();
    if (movie_id == null || movie_id === undefined){
        //search it
        movie.findOne({title: fileName.replace('.srt', '')}, function(resp_detail){
            if (resp_detail.result == Constant.OK_CODE && resp_detail.data != null) {
                //update to s3
                get_sign_request(resp_detail.data['_id'], fileName, function(resp){
                    res.rest.success(resp);
                });
            } else {
                //not found
                res.rest.success({data: {message: Constant.NOT_FOUND}});
            }
        });
    } else {
        movie.findOne({_id: movie_id}, function(resp_detail){
            if (resp_detail.result == Constant.OK_CODE && resp_detail.data != null) {
                //update to s3
                get_sign_request(movie_id, fileName, function(resp){
                    res.rest.success(resp);
                });
            } else {
                //not found
                res.rest.success({data: {message: Constant.NOT_FOUND}});
            }
        });
    }
});
//
function get_sign_request(movie_id, fileName, callback){
    const s3Params = {
        Bucket: process.env.S3_BUCKET,
        Key: movie_id + '/' + fileName,
        // ContentType: fileType,
        ACL: 'public-read'
    };
    aws.config.region = 'ap-northeast-1';
    const s3 = new aws.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
    s3.getSignedUrl('putObject', s3Params, (err, data) => {
        // console.log('111', err);
        if(err){
            callback({data: {message: Constant.SERVER_ERR}});
        }
        const returnData = {
            movie_id: movie_id,
            signedRequest: data,
            url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${movie_id}/${fileName}`
        };
        //
        callback({data: returnData});
    });
}
//========== AJAX CALL
//fetch to show in Admin UI
router.get('/paging-list', function(req, res) {
    //get page index
    var page_index = parseInt(req.query['page']);
    if (isNaN(page_index) || page_index <= 0){
        page_index = 1;
    }
    page_index = page_index - 1;     //query from 0
    var category_id = req.query['cat_id'];
    var keyword = req.query['keyword'];
    var status = req.query['status'];
    var min_speed = req.query['min_speed'];
    var max_speed = req.query['max_speed'];
    var source = req.query['source'];
    var has_subtitle = req.query['has_subtitle'];
    var org_url = req.query['wasabi_url'];     //all/1/0
    //search movies
    var movie = new Movie();
    var condition = {};
    var common = new Common();
    if (common.isNotEmpty(category_id)){
        condition['category_id'] = category_id;
    }
    if (has_subtitle !== undefined && has_subtitle != null){
        if (parseInt(has_subtitle) > 0){
            condition['subtitle_link'] = {$exists: true, $ne: ''};
        } else if (parseInt(has_subtitle) == 0){
            condition['subtitle_link'] = {$not:{$exists: true, $ne: ''}};
        }
    }
    if (common.isNotEmpty(keyword)){
        //search in code / title / description / note
        condition['$or'] = [{description: { $regex: keyword, $options: "i" }}, {title: { $regex: keyword, $options: "i" }},
            {code: { $regex: keyword, $options: "i" }},{note: { $regex: keyword, $options: "i" }}];
    }
    if (common.isNotEmpty(status)){
        if (parseInt(status) == 0){
            //inactive
            condition['is_active'] = 0;
        } else if (parseInt(status) == 1){
            //active
            condition['is_active'] = 1;
        }
    }
    if (min_speed != null && max_speed != null){
        condition['$and'] = [{speed:{$gt:min_speed*1000}},{speed:{$lt:max_speed*1000}}];
    }
    if (common.isNotEmpty(source)){
        switch (source) {
            case 'webseed':
                condition['link_type'] = 'webseed';
                break;
            case 'sukebei':
                condition['link_type'] = 'sukebei';
                break;
            case 'javdb':
                condition['source'] = 'javdb';
                condition['link_type'] = {$nin: ['webseed', 'sukebei']};
                break;
            case 'other':
                //except case above
                condition['link_type'] = {$not:{$exists: true, $ne: ''}};
                condition['source'] = {$ne: 'javdb'};
                break;
        }
    }
    if (common.isNotEmpty(org_url)){
        switch (org_url) {
            case '0':
            case 0:
                condition['org_url'] = {$not:{$exists: true, $ne: ''}};
                break;
            case '1':
            case 1:
                condition['org_url'] = {$exists: true, $ne: ''};
                break;
        }
    }
    //get total movies
    // console.log(condition);
    movie.countDocuments(condition, function (res_total) {
        var show_data = [];
        var total = 0;
        if (res_total.result == Constant.OK_CODE){
            total = res_total.data;
            //if page_index == 0, create natural order index so that can move next in detail popup
            // reset_natural_order(page_index);
            //get categories
            var category = new Category();
            category.getAllNoPaging({}, function(resp_category){
                var category_map = {};  //key: cat id, value: name
                if (resp_category.result == Constant.OK_CODE){
                    for (var i=0; i<resp_category.data.length; i++){
                        category_map[resp_category.data[i]['_id']] = resp_category.data[i]['name'];
                    }
                }
                //get movies by pagination
                movie.search_by_condition(condition, {limit:Constant.DEFAULT_PAGE_LENGTH, skip: page_index * Constant.DEFAULT_PAGE_LENGTH},
                    '_id title description thumbnail cover_url play_links category_id is_active note share_date created_time thumb_pics speed org_url link_type trailer_url subtitle_link',
                    {idx_in_day: -1}, function(list){
                        if (list.result == Constant.OK_CODE) {
                            for (var i = 0; i < list.data.length; i++) {
                                if (common.isNotEmpty(category_map[list.data[i]['category_id']])){
                                    list.data[i]['category_name'] = category_map[list.data[i]['category_id']];
                                }
                                show_data.push(list.data[i]);
                            }
                        }
                        res.rest.success({list: show_data, total: total, categories: resp_category.data});   //success
                    });
            });
        } else {
            res.rest.success({list: show_data, total: total});   //success
        }

    });
});
//fetch detail of movie when press Prev / Next button
router.get('/single-movie-navigation', function(req, res) {
    var category_id = req.query['cat_id'];
    var keyword = req.query['keyword'];
    var status = req.query['status'];
    var min_speed = req.query['min_speed'];
    var max_speed = req.query['max_speed'];
    var source = req.query['source'];
    var current_movie_id = req.query['current_movie_id'];
    var navigation = req.query['navigation'];   //previous / next

    //search movies
    var movie = new Movie();
    var condition = {};
    var common = new Common();
    if (common.isNotEmpty(category_id)){
        condition['category_id'] = category_id;
    }
    if (common.isNotEmpty(keyword)){
        //search in code / title / description / note
        condition['$or'] = [{description: { $regex: keyword, $options: "i" }}, {title: { $regex: keyword, $options: "i" }},
            {code: { $regex: keyword, $options: "i" }},{note: { $regex: keyword, $options: "i" }}];
    }
    if (common.isNotEmpty(status)){
        if (parseInt(status) == 0){
            //inactive
            condition['is_active'] = 0;
        } else if (parseInt(status) == 1){
            //active
            condition['is_active'] = 1;
        }
    }
    if (min_speed != null && max_speed != null){
        condition['$and'] = [{speed:{$gt:min_speed*1000}},{speed:{$lt:max_speed*1000}}];
    }
    if (common.isNotEmpty(source)){
        switch (source) {
            case 'org_url':
                condition['org_url'] = {$exists: true, $ne: ''};
                break;
            case 'webseed':
                condition['link_type'] = 'webseed';
                break;
            case 'sukebei':
                condition['link_type'] = 'sukebei';
                break;
            case 'javdb':
                condition['source'] = 'javdb';
                break;
            case 'other':
                //except case above
                condition['org_url'] = {$exists: false};
                condition['link_type'] = {$exists: false};
                condition['source'] = {$ne: 'javdb'};
                break;
        }
    }
    movie.findOne({_id:current_movie_id}, function(resp_detail){
        if (navigation == 'next'){  //get older
            condition['idx_in_day'] = {"$lt": resp_detail.data['idx_in_day']};
            movie.search_by_condition(condition, {limit:1, skip:0}, '',
                {idx_in_day: -1}, function(detail){
                    res.rest.success({data: detail.data[0]});   //success
                });
        } else if (navigation == 'previous'){   //get newer
            condition['idx_in_day'] = {"$gt": resp_detail.data['idx_in_day']};
            movie.search_by_condition(condition, {limit:1, skip:0}, '',
                {idx_in_day: 1}, function(detail){
                    res.rest.success({data: detail.data[0]});   //success
                });
        }
    });
});
//save basic detail in list row
router.post('/save-basic-detail', function(req, res) {
    var id = req.body['id'];
    var description = req.body['description'];
    var org_url = req.body['org_url'];
    var note = req.body['note'];
    var category_id = req.body['data_category'];
    var magnet_link = req.body['magnet_link'];
    //search movie by id
    var movie = new Movie();
    movie.findOne({_id: id}, function(resp_detail){
        if (resp_detail.result == Constant.OK_CODE){
            var detail = resp_detail.data;
            var play_links = detail['play_links'];
            var common = new Common();
            if (common.isEmpty(play_links)){
                play_links = [];
            }
            //do not add duplicated link
            if (play_links.length > 0){
                //remove the link
                play_links = play_links.filter(item => item != magnet_link);
            }
            play_links.push(magnet_link);    //to make sure latest link at the end
            var update_data = {play_links: play_links, description: description,
                org_url: org_url, category_id: category_id, note: note};
            if (common.isSukebeiLink(magnet_link)){
                update_data['link_type'] = 'sukebei';
            }
            //save back
            movie.update({_id: id}, update_data, function(resp_update){
                if (resp_update.result == Constant.OK_CODE){
                    res.rest.success({data: Constant.OK_CODE});
                } else {
                    res.rest.success({data: {message: Constant.SERVER_ERR}});
                }
            });
        } else {
            //not found
            res.rest.success({data: {message: Constant.NOT_FOUND}});
        }
    });
});
//save extra detail in popup
router.post('/save-extra-detail', function(req, res) {
    var id = req.body['id'];
    //search movie by id
    var movie = new Movie();
    movie.findOne({_id: id}, function(resp_detail){
        if (resp_detail.result == Constant.OK_CODE){
            var play_links = resp_detail['data']['play_links'];
            var common = new Common();
            if (common.isEmpty(play_links)){
                play_links = [];
            }
            //do not add duplicated link
            var new_link = req.body['new_link'];    //encrypted
            if (play_links.length > 0){
                //remove the link
                play_links = play_links.filter(item => item != new_link);
            }
            play_links.push(new_link);    //to make sure latest link at the end
            var new_data = {
                title: req.body['title'],
                thumbnail: req.body['thumbnail'],
                cover_url: req.body['cover_url'],
                size: req.body['size'],
                video_len: req.body['video_len'],
                category_id: req.body['category_id'],
                // description: req.body['description'],
                note: req.body['note'],
                subtitle_link: req.body['subtitle_link'],
                play_links: play_links
            };
            if (req.body['snapshots'] != null){
                new_data['thumb_pics'] = req.body['snapshots'].split(',');
            }
            if (resp_detail['data']['thumbnail'] != req.body['thumbnail'] || resp_detail['data']['cover_url'] != req.body['cover_url']){
                new_data['is_uploaded_s3'] = 0;     //reupload to S3
            }
            if (common.isSukebeiLink(new_link)){
                new_data['link_type'] = 'sukebei';
            }
            //save back
            movie.update({_id: id}, new_data, function(resp_update){
                if (resp_update.result == Constant.OK_CODE){
                    res.rest.success({data: Constant.OK_CODE});
                } else {
                    res.rest.success({data: {message: Constant.SERVER_ERR}});
                }
            });
        } else {
            //not found
            res.rest.success({data: {message: Constant.NOT_FOUND}});
        }
    });
});
//save
router.post('/save-subtitle', function(req, res) {
    var id = req.body['id'];
    //search movie by id
    var movie = new Movie();
    movie.findOne({_id: id}, function(resp_detail){
        if (resp_detail.result == Constant.OK_CODE && resp_detail['data'] != null){
            var new_data = {
                subtitle_link: req.body['subtitle_link'],
            };
            //save back
            movie.update({_id: id}, new_data, function(resp_update){
                if (resp_update.result == Constant.OK_CODE){
                    res.rest.success({data: Constant.OK_CODE});
                } else {
                    res.rest.success({data: {message: Constant.SERVER_ERR}});
                }
            });
        } else {
            //not found
            res.rest.success({data: {message: Constant.NOT_FOUND}});
        }
    });
});
//get movie detail
router.get('/movie-detail', function(req, res) {
    var movie_id = req.query['id'];
    if (movie_id.length == 0){
        //invalid movie id
        res.rest.success({data: {message: Constant.NOT_FOUND}});
    }
    //search movies
    var movie = new Movie();
    var condition = {_id:movie_id};
    movie.findOne(condition, function (resp_detail) {
        res.rest.success({data: resp_detail.data});
    });
});
//soft delete movie(s)
router.post('/delete-movies', function(req, res) {
    var ids = JSON.parse(req.body['ids']);
    var is_active = req.body['is_active'];
    // console.log(ids);
    if (ids == null || ids.length == 0){
        res.rest.success({data: Constant.OK_CODE});
        return;
    }
    var condition = {_id: {$in: ids}};
    var movie = new Movie();
    movie.update(condition, {is_active: parseInt(is_active)}, function(resp_update){
        // console.log(resp_update);
        if (resp_update.result == Constant.OK_CODE){
            res.rest.success({data: Constant.OK_CODE});
        } else {
            res.rest.success({data: {message: Constant.SERVER_ERR}});
        }
    });
});
//insert new movie, create from Admin UI
router.post('/insert-movie', function(req, res) {
    var data = {
        description : req.body['description'],
        title : req.body['title'],
        thumbnail : req.body['thumbnail'],
        cover_url : req.body['cover'],
        size : req.body['size'],
        note : req.body['note'],
        category_id: req.body['category_id']
    };
    if (req.body['video_len'] != null){
        data['video_len'] = req.body['video_len'];
    }
    var magnet_link = req.body['magnet_link'];
    var movie = new Movie();
    var common = new Common();
    data['code'] = 'swipex_' + common.get_timestamp();  //unique
    //create new
    //todo find duplicated magnet link
    movie.findOne({title: data['title']}, function(resp_detail){
        if (resp_detail.result == Constant.OK_CODE && resp_detail.data != null && resp_detail.data['code'] != ''){
            res.rest.success({data: {message: Constant.DUPLICATE_TITLE}});
        } else {
            //not found
            if (magnet_link != null && magnet_link != ''){
                data['play_links'] = [magnet_link];
                if (common.isSukebeiLink(magnet_link)){
                    data['link_type'] = 'sukebei';
                }
            }
            data['is_active'] = 0;  //default
            data['created_time'] = common.get_created_time();
            if (req.body['share_date'] != null && req.body['share_date'].length > 7){
                data['share_date'] = req.body['share_date'];
                data['share_date_utc'] = common.convert_to_utc_time(data['share_date']);
            } else {
                //default today
                data['share_date'] = common.convert_to_readable_date();
                data['share_date_utc'] = common.convert_to_utc_time(data['share_date']);
            }
            data['source'] = 'swipex';
            //get movies which same share date utc
            movie.countDocuments({share_date_utc:data['share_date_utc']}, function (res_total) {
                var total = data['share_date_utc'];
                if (res_total.result == Constant.OK_CODE) {
                    total += res_total.data;
                }
                data['idx_in_day'] = total + 1;
                movie.create(data, function(resp_create){
                    res.rest.success({data: resp_create});
                });
            });
        }
    });
});
//save multiple movies
router.post('/bulk-update', function(req, res) {
    var params = JSON.parse(req.body['params']);
    //search movie by id
    var movie = new Movie();
    var len = params.length;
    var common = new Common();
    for (var i=0; i<len; i++){
        movie.findOneWithOrgData({_id: params[i]['id']}, params[i], function(resp_detail){
            if (resp_detail.result == Constant.OK_CODE){
                var update_detail = resp_detail.org_data;
                var detail = resp_detail.data;
                var play_links = detail['play_links'];
                if (common.isEmpty(play_links)){
                    play_links = [];
                }
                //do not add duplicated link
                if (play_links.length > 0){
                    //remove the link
                    play_links = play_links.filter(item => item != update_detail['magnet_link']);
                }
                play_links.push(update_detail['magnet_link']);    //to make sure latest link at the end
                var update_data = {play_links: play_links, description: update_detail['description'],
                    org_url: update_detail['org_url'], category_id: update_detail['data_category']};
                if (common.isSukebeiLink(update_detail['magnet_link'])){
                    update_data['link_type'] = 'sukebei';
                }
                //save back
                movie.update({_id: update_detail['id']}, update_data, function(resp_update){
                    //do not return result
                });
            } else {
                //not found
                //skip it
            }
        });
    }
    res.rest.success({data: Constant.OK_CODE}); //nothing to update
});
//
router.post('/patch-title-description', function(req, res) {
    var movie = new Movie();
    var common = new Common();
    movie.getAll(function (resp) {
        if (resp.data){
            var list = resp.data;
            var len = list.length;
            for (var i=0; i<len; i++){
                if (common.isEmpty(list[i]['description'])){
                    list[i]['description'] = list[i]['title'];
                }
                list[i]['title'] = list[i]['code'];
                movie.update({_id:list[i]['_id']}, list[i], function ({}) {
                    //
                });
            }
        }
        res.rest.success();
    });
});
//
router.post('/inactive-jogae', function(req, res) {
    var movie = new Movie();
    var common = new Common();
    movie.getAll(function (resp) {
        if (resp.data){
            var list = resp.data;
            var len = list.length;
            for (var i=0; i<len; i++){
                if (list[i]['source'] == 'jogae') {
                    list[i]['is_active'] = 0;
                    movie.update({_id: list[i]['_id']}, list[i], function ({}) {

                    });
                }
            }
        }
        res.rest.success();
    });
});
//get speed data of all active movies
router.get('/speed-data', function(req, res) {
    var movie = new Movie();
    var common = new Common();
    movie.getAllNoPaging({is_active: 1, $or: [{is_processed_speed: 0}, {is_processed_speed: {$exists: false}}], play_links: {$exists: true, $ne: []}}, function (resp) {
        if (resp.data != null){
            var list = resp.data;
            var ids = [];
            for (var i=0; i<list.length; i++){
                ids.push(list[i]['_id']);
            }
            var deviceMovieSpeed = new DeviceMovieSpeed();
            deviceMovieSpeed.getAllNoPaging({movie_id:{$in:ids}, downloadSpeed: {$exists: true, $ne: []}}, function (resp_list) {
                if (resp_list.result == Constant.OK_CODE && resp_list.data != null){
                    res.rest.success({data: resp_list.data});
                } else {
                    res.rest.success({data: []});
                }
            });
        } else {
            res.rest.success({data: []});
        }
    });
});
//update speed data of movies
router.post('/update-speed', function(req, res) {
    var data = req.body['data'];
    if (data == null || data === undefined){
        res.rest.success({data: {message: Constant.OK_CODE}});
    }
    var list = JSON.parse(data);
    // console.log(list);
    var movie = new Movie();
    for (var i=0; i<list.length; i++){
        movie.update({_id: list[i]['movie_id']}, {speed: list[i]['speed'], is_processed_speed: 1}, function(){});
    }
    res.rest.success({data: {message: Constant.OK_CODE}});
});
//
module.exports = router;
