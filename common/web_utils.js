
const Constant = require('./constant.js');
var Common = require("./common.js");
var common = new Common();

function Utils() {
}

Utils.prototype.getInt = function(str, defaultValue, minValue){
    var n = parseInt(str);
    if (isNaN(n)){
        n = defaultValue;
    }
    if (minValue && n < minValue){
        return minValue;
    }
    return n;
};


Utils.prototype.getPage = function (req, defaultPageSize) {
    var page_index = this.getInt(req.query['page'], 1, 1);
    var page_size = this.getInt(req.query['size'], defaultPageSize, 1);
    var paging = {limit:page_size, skip: (page_index - 1)* page_size};
    return paging;
};


var utils = new Utils();
//
module.exports = utils;
