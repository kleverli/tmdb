var express = require('express');
var router = express.Router();
var Common = require('../../common/common.js');
var Constant = require('../../common/constant.js');
var Category = require('../../models/Category.js');
var Movie = require('../../models/Movie.js');

//show movie list with pagination
router.get('/list', function(req, res) {
    var common = new Common();
    if (common.isEmpty(req.session[Constant.SESSION.KEY_USER_ID])){
        res.redirect('/admin-control/login');
        return;
    }
    var category = new Category();
    //get all categories
    category.getAllNoPaging({}, function(resp_category) {
        var cat_list = [];
        if (resp_category.result == Constant.OK_CODE && resp_category.data != null){
            cat_list = resp_category.data;
        }
        //
        res.render('admin/category_list', {categories: cat_list, username: req.session[Constant.SESSION.KEY_USER_ID]});
    });
});

//========== AJAX CALL
//get active categories only
router.get('/data-list', function(req, res) {
    //get categories
    var category = new Category();
    category.getAllNoPaging({}, function(resp_category) {
        res.rest.success({categories: resp_category.data});
    });
});
//
//save English category detail
router.post('/save-detail', function(req, res) {
    var id = req.body['id'],
        name = req.body['name'],    //english name
        is_active = req.body['is_active'];
    var category = new Category();
    category.findOne({_id: id}, function (resp_detail) {
        if (resp_detail.result == Constant.OK_CODE && resp_detail.data != null && resp_detail.data['name'] != '') {
            //todo: update language collection
            category.update({_id: id}, {is_active: parseInt(is_active), name: name}, function(resp_update){
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
