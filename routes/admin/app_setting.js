var express = require('express');
var router = express.Router();
var Common = require('../../common/common.js');
var Constant = require('../../common/constant.js');
var AppSetting = require('../../models/AppSetting.js');

//show login page
router.get('/detail', function(req, res) {
    var common = new Common();
    if (common.isEmpty(req.session[Constant.SESSION.KEY_USER_ID])){
        res.redirect('/admin-control/login');
        return;
    }
    var appSetting = new AppSetting();
    appSetting.findOne({"key":"desktop_app"}, function(resp_detail){
        var detail = {};
        if (resp_detail.result == Constant.OK_CODE && resp_detail.data != null && resp_detail.data['key'] != '') {
            detail = resp_detail.data;
        }
        res.render('admin/app_detail', {detail: detail, username: req.session[Constant.SESSION.KEY_USER_ID]});
    });
});
//AJAX
router.post('/save-detail', function(req, res) {
    var appSetting = new AppSetting();
    var data = {
        active_domains: JSON.parse(req.body['active_domains']),
        contact_email: req.body['contact_email'],
        latest_version : req.body['latest_version'],
        upgrade_version_note : req.body['upgrade_version_note']
    };
    //update
    appSetting.update({"key":"desktop_app"}, data, function(resp_update){
        if (resp_update.result == Constant.OK_CODE){
            res.rest.success({data: Constant.OK_CODE});
        } else {
            res.rest.success({data: {message: Constant.SERVER_ERR}});
        }
    });
});
module.exports = router;
