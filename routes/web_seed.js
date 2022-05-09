const express = require('express');
const router = express.Router();
const Temp = require('../models/Temp.js');
var Common = require('../common/common.js');
const Constant = require('../common/constant.js');
var utils = require('../common/web_utils.js');

var MovieN = require('../models/MovieNSeries.js');


router.get('/list-torrent_url_2', function(req, res, next) {
    var paging = utils.getPage(req,5);
    let common = new Common();

    var sort_by = {startyear: -1};
    var sort_start_year = req.query["sortStartYear"];
    if (common.isNotEmpty(sort_start_year)){
        if (sort_start_year.toLowerCase() == "asc"){
            sort_by["startyear"] = 1
        }
    }

    var movien = new MovieN();
    var condition = {$and:[{is_active: 1},{webseed_url_2: ""}, {torrent_url_2 :{$exists:true}}, {torrent_url_2 :{$ne:null}},  {"torrent_url_2.url": {"$ne": ""}}]};
    movien.search_by_condition(condition, paging, '_id title_display_name startyear torrent_url_2', sort_by, function(resp){
        if(resp.data){
            var arr = [], item, ret_item;
            for (var i=0; i<resp.data.length; i++){
                item = resp.data[i];
                ret_item = {
                    "startyear": item["startyear"],
                    "_id": item["_id"],
                    "torrent_url_2": item["torrent_url_2"]["url"]
                };
                var title = null, nameArr = item["title_display_name"];
                for (var k = 0; k < nameArr.length; k ++){
                    if (nameArr[k]["language"] == "en"){
                        title = nameArr[k]["title"];
                    }
                }
                if (title == null && nameArr.length > 0){
                    title = nameArr[0]["title"];
                }
                ret_item["title"] = title;

                arr.push(ret_item);
            }
            var ret = {
                data: arr
            };

            res.rest.success(ret);
        } else{
            res.rest.success(resp);
        }
    });
});

router.post('/update-webseed2', function(req, res, next) {
    var common = new Common();
    var title = req.body["title"];
    var id = req.body["id"];
    var webseed_url_2 = req.body["webseed_url_2"];
    if (common.isEmpty(webseed_url_2)) {
      return res.status(400).json({ message: "Missing webseed_url_2" });
    }
    if (common.isEmpty(title) && common.isEmpty(id)){
        return res.status(400).json({ message: "title and id cannot be empty at the same time" });
    }
    var movien = new MovieN();
    var condition = {};
    if (common.isNotEmpty(title) && common.isNotEmpty(id)){
        condition["$or"] = [{"_id":id }, { "title_display_name.title": title}];
    } else if (common.isNotEmpty(id)){
        condition["_id"] = id;
    } else if (common.isNotEmpty(title)){
        condition["title_display_name.title"] = title;
    }
    update_data = {
        "webseed_url_2": webseed_url_2
    };
    //search existing movie
    var fileds = '_id title_display_name torrent_url_1 torrent_url_2 webseed_url_1 webseed_url_2';
    movien.findOne(condition, fileds, function (res_detail) {
        if (res_detail.result == Constant.OK_CODE && res_detail.data) {
            movien.update(
                { _id: res_detail.data["_id"] },
                update_data,
                function (resp_create) {
                    res.rest.success({ data: resp_create });
                }
            );
        } else {
            res.rest.success(res_detail);
        }
    });

});

router.get('/subtitle_list', function(req, res, next) {
    let common = new Common();

    var size = req.query['size'];
    var paging = utils.getPage(req,10);
    var startDate = req.query['stardDate'];
    var endDate = req.query['endDate'];

    var size = utils.getInt(size,20,5);

    var condition = {};
    if (common.isNotEmpty(startDate)){
        condition["releaseDate"] = {$gte: startDate};
    }
    if (common.isNotEmpty(endDate)){
        condition["releaseDate"] = {$lte: endDate};
    }

    var movien = new MovieN();
    var sorts = {"releaseDate": -1};
    movien.search_by_condition(condition, paging,'_id title_display_name releaseDate', sorts, function(resp){
        if (resp.result == Constant.OK_CODE && resp.data) {
            res.rest.success({data:resp.data});
        } else {
            res.rest.success({data: []});   //success
        }
    });
});

router.get('/s3mv_list', function(req, res, next) {
    let common = new Common();

    var size = req.query['size'];
    var paging = utils.getPage(req,10);
    var endDate = req.query['endDate'];

    var size = utils.getInt(size,20,5);

    var condition = {};
    if (common.isNotEmpty(endDate)){
        condition["releaseDate"] = {$lte: endDate};
    }

    condition["webseed_url_2"] = {"$regex": "^.{1,}$"};

    var movien = new MovieN();
    var sorts = {"releaseDate": -1};
    movien.search_by_condition(condition, paging,'_id imdb_id releaseDate webseed_url_2', sorts, function(resp){
        if (resp.result == Constant.OK_CODE && resp.data) {
            res.rest.success({data:resp.data});
        } else {
            res.rest.success({data: []});   //success
        }
    });
});

module.exports = router;
