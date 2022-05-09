var express = require('express');
var router = express.Router();
var Common = require('../../common/common.js');
var Constant = require('../../common/constant.js');
var Actress = require('../../models/Actress.js');
var Category = require('../../models/Category.js');

//show movie list with pagination
router.get('/list', function(req, res) {
    res.render('admin/actress_list', {username: req.session[Constant.SESSION.KEY_USER_ID]});
});
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

    //search
    var actress = new Actress();
    var condition = {};
    var common = new Common();
    if (common.isNotEmpty(category_id)){
        condition['category_id'] = category_id;
    }
    if (common.isNotEmpty(keyword)){
        //search in code / title / description / note
        condition['$or'] = [{'names.jp': { $regex: keyword, $options: "i" }},{'names.en': { $regex: keyword, $options: "i" }},
            {'names.kr': { $regex: keyword, $options: "i" }},{'names.tw': { $regex: keyword, $options: "i" }}];
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
    //get total movies
    // console.log(condition);
    actress.countDocuments(condition, function (res_total) {
        var show_data = [];
        var total = 0;
        if (res_total.result == Constant.OK_CODE){
            total = res_total.data;
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
                actress.search_by_condition(condition, {limit:Constant.DEFAULT_PAGE_LENGTH, skip: page_index * Constant.DEFAULT_PAGE_LENGTH},
                    'url avatar category_id is_active names', {order: 1}, function(list){
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
//soft delete actress(es)
router.post('/toggle-active-movie', function(req, res) {
    var ids = JSON.parse(req.body['ids']);
    var is_active = req.body['is_active'];
    // console.log(ids);
    if (ids == null || ids.length == 0){
        res.rest.success({data: Constant.OK_CODE});
        return;
    }
    var condition = {_id: {$in: ids}};
    var actress = new Actress();
    actress.update(condition, {is_active: parseInt(is_active)}, function(resp_update){
        // console.log(resp_update);
        if (resp_update.result == Constant.OK_CODE){
            res.rest.success({data: Constant.OK_CODE});
        } else {
            res.rest.success({data: {message: Constant.SERVER_ERR}});
        }
    });
});
//save basic detail
//save extra detail in popup
router.post('/save-detail', function(req, res) {
    var id = req.body['id'];
    var actress = new Actress();
    actress.findOne({_id: id}, function(resp_detail){
        if (resp_detail.result == Constant.OK_CODE){
            //save back
            resp_detail['names'] = {
                jp: req.body['name_jp'],
                tw: req.body['name_tw'],
                kr: req.body['name_kr'],
                en: req.body['name_en']
            };

            actress.update({_id: id}, resp_detail, function(resp_update){
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
//
module.exports = router;
