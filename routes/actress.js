var express = require('express');
var router = express.Router();
var Common = require('../common/common.js');
var Constant = require('../common/constant.js');
var Actress = require('../models/Actress.js');
var ObjectId = require('mongodb').ObjectID;
var Keyword = require('../models/Keyword.js');

/* GET home page. */
router.post('/pagination-list', function(req, res) {
    var keyword = req.body['keyword'];
    var page = parseInt(req.body['page']);   //start from 1
    var limit = parseInt(req.body['limit']); //default 20
    var category_id = req.body['category_id'];
    // var language_code = req.query['language_code'];
    var common = new Common();

    var actress = new Actress();
    var condition = {};
    condition['is_active'] = 1;
    if (category_id !== undefined && category_id != null && category_id != ''){
        condition['category_id'] = category_id;
    }
    if (keyword !== undefined && keyword != null && keyword != ''){
        condition['$or'] = [{'names.jp': { $regex: keyword, $options: "i" }},{'names.en': { $regex: keyword, $options: "i" }},
            {'names.kr': { $regex: keyword, $options: "i" }},{'names.tw': { $regex: keyword, $options: "i" }}];

        // switch (language_code) {
        //     case 'jp':
        //     case 'ja':
        //         condition['names.jp'] = {"$regex" : ".*"+keyword+".*", '$options': 'i'};
        //         break;
        //     case 'cn':
        //     case 'tw':
        //     case 'zh':
        //         condition['names.tw'] = {"$regex" : ".*"+keyword+".*", '$options': 'i'};
        //         break;
        //     case 'ko':
        //     case 'kr':///^SomeStringToFind$/i
        //         condition['names.kr'] = {"$regex" : ".*"+keyword+".*", '$options': 'i'};
        //         break;
        //     default:
        //         condition['names.en'] = {"$regex" : ".*"+keyword+".*", '$options': 'i'};
        //         break;
        // }
        // var keywordDoc = new Keyword();
        // keywordDoc.create({keyword_actress: keyword, created_time: common.get_created_time()}, function (resp_k) {});
    }
    // console.log(condition);
    actress.countDocuments(condition, function (total) {
        var total_val = total.data;
        actress.search_by_condition(condition, {limit:limit, skip: (page-1)*Constant.DEFAULT_PAGE_LENGTH},
            'names avatar', {order:1}, function (resp) {
                var result = {
                    total: total_val,
                    list: resp.data
                };
                res.rest.success(result);
            });
    });
});
//
module.exports = router;
