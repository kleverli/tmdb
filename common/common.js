/**
 * author: Martin
 * common functions are served in controllers & models
 */
var Constant = require('./constant.js');
var trim = require('trim');

//begin class

function Common() {
}

//=========
Common.prototype.xlog = function (mess, data) {
    if (console.log) {
        console.log(mess, data);
    }
};

Common.prototype.dlog = function (mess) {
    if (console.log) {
        console.log(mess);
    }
};

Common.prototype.isNull = function (a_var) {
    return a_var == null || a_var === undefined;
};

Common.prototype.trim = function (a_var) {
    if (a_var === undefined || a_var == null){
        return a_var;
    }
    if (typeof a_var == "string"){
        return trim(a_var);
    }
    return a_var;
};

Common.prototype.dlogJSON = function (mess) {
    if (!common.isEmpty(mess))		//avoid IE
        console.log(JSON.stringify(mess));
};
//used for string only
Common.prototype.isEmpty = function (a_var) {
    if (a_var === undefined || a_var == null || common.trim(a_var) == '')
        return true;
    return false;
};

Common.prototype.isStrictEmpty = function (a_var) {
    if (a_var == 'undefined' || a_var == 'null' || a_var === undefined || a_var == null || common.trim(a_var) == '')
        return true;
    return false;
};
//used for String only
Common.prototype.isNotEmpty = function (a_var) {
    return !common.isEmpty(a_var);
};

Common.prototype.isArray = function (something) {
    return Object.prototype.toString.call(something) === '[object Array]';
};

Common.prototype.get_obj_len = function (obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

/**
 * check if user logined or not
 * @param req
 */
Common.prototype.isNotLogined = function (req) {
    // return false;        //for testing
    // common.dlog('sess db: '+req.session[db_id]);
    // common.dlog('sess id: ' + req.session[Constant.SESSION.KEY_USER_ID]);
    return common.isEmpty(req.session[Constant.SESSION.KEY_USER_ID]);
};
/**
 * get id of logined user
 * @param req
 * @returns {*}
 */
Common.prototype.getLoginedUserId = function (req) {
    return req.session[Constant.SESSION.KEY_USER_ID];
};
/**
 * check if a & b is XOR empty (one of both is empty)
 */
Common.prototype.isXorEmpty = function (a, b) {
    return (common.isEmpty(a) && common.isNotEmpty(b)) || (common.isEmpty(b) && common.isNotEmpty(a));
};
/**
 * catch system db is down
 */
Common.prototype.removeArrayItem = function (arr, item) {
    for (var i = arr.length; i--;) {
        if (arr[i] === item) {
            arr.splice(i, 1);
        }
    }
};
//
Common.prototype.convert_obj_to_array = function(obj) {
    var arr_results = new Array();
    if (obj != null){
        Object.keys(obj).forEach(function(key){
            arr_results.push(obj[key]);
        });
    }
    return arr_results;
};
//convert object to array & return back to client
Common.prototype.reform_notif_response_format = function(res, obj_results){
    var arr_results = common.convert_obj_to_array(obj_results);
    res.rest.success({
        data: {list: arr_results}
    });
};
//remove duplicated item in array
Common.prototype.remove_duplicate_array_item = function(arr) {
    var obj = {};
    var len = arr.length;
    for (var i=0; i<len; i++){
        if (common.isEmpty(obj[arr[i]])){
            obj[arr[i]] = arr[i];
        }
    }
    return common.convert_obj_to_array(obj);
};
//
Common.prototype.get_timestamp = function() {
    return Math.floor(Date.now());
};
//
Common.prototype.get_created_time = function() {
    return Math.floor(Math.floor(Date.now())/1000);
};
//convert timestamp to human date. ex: %y-%m-%d
Common.prototype.convert_to_readable_date = function() {
    var date = new Date();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    return date.getFullYear() + "-" + month + "-" + day;
};
//convert to UTC timestamp
Common.prototype.convert_to_utc_time = function(str_date) {
    return Math.round(new Date(str_date).getTime() / 1000);
};
//
Common.prototype.generateUniqueDeviceId = function() {
    return Constant.INVALID_DEVICE_PREFIX + common.get_timestamp() + '_' + Math.floor(Math.random()*1000000);
};
//
Common.prototype.isSukebeiLink = function(link) {
    if (link == null){
        return false;
    }
    return common.decrypt_magnet_link(link).indexOf('sukebei') > 0 || link.indexOf('sukebei') > 0;
};
//encrypt/decrypt magnet link from db
Common.prototype.decrypt_magnet_link = function(encrypted_magnet_link) {
    var MAGNET_ENCRYPT_LEN = 30;
    var len = encrypted_magnet_link.length;
    if (len < MAGNET_ENCRYPT_LEN){
        return encrypted_magnet_link;       //invalid link
    }
    //cut magnet link
    var encrypted_str = encrypted_magnet_link.substr(len - MAGNET_ENCRYPT_LEN, len);
    //revert
    var reverted_str = encrypted_str.split("").reverse().join("");
    //add back
    var part_org_str = encrypted_magnet_link.substr(0, len - MAGNET_ENCRYPT_LEN);
    return part_org_str + reverted_str;
};

Common.prototype.replace_s3_to_bcdn = function(url) {
    if(common.isNotEmpty(url)){
        return url.replace("s3.us-central-1.wasabisys.com/seeds", "seeds.b-cdn.net");
    }
    return url;
}
//
var common = new Common();
//
module.exports = Common;
