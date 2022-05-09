var express = require('express');
var router = express.Router();
var Common = require('../../common/common.js');
var Constant = require('../../common/constant.js');
var Language = require('../../models/Language.js');

//show movie list with pagination
router.get('/list', function(req, res) {
    var common = new Common();
    if (common.isEmpty(req.session[Constant.SESSION.KEY_USER_ID])){
        res.redirect('/admin-control/login');
        return;
    }
    var language = new Language();
    //get all categories
    language.getAllNoPaging({}, function(resp_list) {
        var lang_list = [];
        if (resp_list.result == Constant.OK_CODE && resp_list.data != null){
            lang_list = resp_list.data;
        }
        //
        res.render('admin/language_list', {lang_list: lang_list, username: req.session[Constant.SESSION.KEY_USER_ID]});
    });
});

//========== AJAX CALL
//save English category detail
router.post('/save-detail', function(req, res) {
    var _id = req.body['id'];
    var language = new Language();
    var data = {
        key: req.body['key'],
        en : req.body['en'],    //english name
        kr : req.body['kr'],
        cn : req.body['cn'],
        ru : req.body['ru'],
        is_active: req.body['is_active']
    };
    if (_id == null || _id == ''){
        //create new
        language.create(data, function(resp_create){
            if (resp_create.result == Constant.OK_CODE){
                res.rest.success({data: {result: Constant.OK_CODE, new_id: resp_create._id}});
            } else {
                res.rest.success({data: {message: Constant.SERVER_ERR}});
            }
        });
    } else {
        //update
        language.findOne({_id: _id}, function (resp_detail) {
            if (resp_detail.result == Constant.OK_CODE && resp_detail.data != null && resp_detail.data['key'] != '') {
                language.update({_id: _id}, data, function(resp_update){
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
    }
});
//
module.exports = router;
