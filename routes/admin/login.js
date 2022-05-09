var express = require('express');
var router = express.Router();
var Common = require('../../common/common.js');
var Constant = require('../../common/constant.js');
var Admin = require('../../models/Admin.js');

//show login page
router.get('/login', function(req, res) {
    res.render('admin/login');
});
//show Admin list page
router.get('/list', function(req, res) {
    var common = new Common();
    if (common.isEmpty(req.session[Constant.SESSION.KEY_USER_ID])){
        res.redirect('/admin-control/login');
        return;
    }
    var admin = new Admin();
    //get all categories
    admin.getAll(function(resp_admin) {
        var admin_list = [];
        if (resp_admin.result == Constant.OK_CODE && resp_admin.data != null){
            admin_list = resp_admin.data;
        }
        //
        res.render('admin/admin_list', {admin_list: admin_list, username: req.session[Constant.SESSION.KEY_USER_ID]});
    });
});
//
router.get('/logout', function(req, res) {
    req.session[Constant.SESSION.KEY_USER_ID] = '';
    res.render('admin/login');
});
//todo add captcha
router.post('/check_login', function(req, res) {
    var username = req.body['username'];
    var encrypted_password = req.body['password'];
    var common = new Common();
    if (common.isEmpty(username) || common.isEmpty(encrypted_password)){
        res.rest.success({data: {message: Constant.NOT_FOUND}});   //failed
    }
    //find in db
    var admin = new Admin();
    var cond = {
        username: username,
        password: encrypted_password
    }
    admin.search_by_condition(cond, {limit:1, skip:0}, 'username', '', function(result){
        if (result.data === undefined || result.data == null || result.data.length == 0){
            res.rest.success({data: {message: Constant.NOT_FOUND}});   //failed
        } else {
            //login success
            req.session[Constant.SESSION.KEY_USER_ID] = username;
            res.rest.success({data: Constant.OK_CODE});   //success
        }
    });
    //
});

module.exports = router;
