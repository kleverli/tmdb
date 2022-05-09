var express = require('express');
var router = express.Router();
var Temp = require('../models/Temp.js');
var common = require('../common/common.js');
var Constant = require('../common/constant.js');

router.get('/test', function(req, res, next) {
  var temp = new Temp();
  temp.find_all(function(resp){
      res.rest.success({result: resp});   //success
  });
});

module.exports = router;
