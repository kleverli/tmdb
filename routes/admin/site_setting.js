var express = require('express');
var router = express.Router();
var Common = require('../../common/common.js');
var Constant = require('../../common/constant.js');
var SiteSetting = require('../../models/SiteSetting.js');

//show page
router.get('/detail', function(req, res) {
    var common = new Common();
    if (common.isEmpty(req.session[Constant.SESSION.KEY_USER_ID])){
        res.redirect('/admin-control/login');
        return;
    }
    var siteSetting = new SiteSetting();
    siteSetting.findOne({"key":"site_setting"}, function(resp_detail){
        var detail = {};
        if (resp_detail.result == Constant.OK_CODE && resp_detail.data != null && resp_detail.data['key'] != '') {
            detail = resp_detail.data;
        }
        res.render('admin/site_detail', {detail: detail, username: req.session[Constant.SESSION.KEY_USER_ID]});
    });
});
//AJAX
router.post('/save-detail', function(req, res) {
    var siteSetting = new SiteSetting();
    var data = {
        home_torrent_link: req.body['home_torrent_link']
    };
    //update
    siteSetting.update({"key":"site_setting"}, data, function(resp_update){
        if (resp_update.result == Constant.OK_CODE){
            res.rest.success({data: Constant.OK_CODE});
        } else {
            res.rest.success({data: {message: Constant.SERVER_ERR}});
        }
    });
});
//
module.exports = router;
