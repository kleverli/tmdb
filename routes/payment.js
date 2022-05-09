const express = require('express');
const router = express.Router();
var Common = require('../common/common.js');
const Constant = require('../common/constant.js');

//show paypal button
router.get('/paypal_button', function(req, res, next) {
  res.render('paypal_button', { });
});


module.exports = router;
