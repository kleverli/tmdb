var express = require('express');
var router = express.Router();
var Common = require('../../common/common.js');
var Constant = require('../../common/constant.js');

//show movie list with pagination
router.get('/list', function(req, res) {

    res.render('admin/user_list', {username: req.session[Constant.SESSION.KEY_USER_ID]});
});

//
module.exports = router;
