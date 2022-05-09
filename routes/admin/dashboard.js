var express = require('express');
var router = express.Router();
var Common = require('../../common/common.js');
var Constant = require('../../common/constant.js');

//show login page
router.get('/', function(req, res) {
    var common = new Common();
    if (common.isEmpty(req.session[Constant.SESSION.KEY_USER_ID])){
        res.redirect('/admin-control/login');
        return;
    }
    res.render('admin/dashboard', {username: req.session[Constant.SESSION.KEY_USER_ID]});
});

module.exports = router;
