/**
 * author: Martin
 * custom site setting
 */
//grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Constant = require('../common/constant.js');

//define format of Collection
var SiteSettingSchema = new Schema({
    key            :   {type: String},  //fixed: site_setting
    home_torrent_link        : {type: String, trim: true},
}, { collection: 'site_setting' });

//the schema is useless so far
//we need to create a model using it
var SiteSetting = mongoose.model('SiteSetting', SiteSettingSchema);

//
SiteSetting.prototype.findOne = function(condition, resp_func){
    SiteSetting.findOne(condition).exec(function(err, res) {
        if (err) {
            var resp = {
                result : Constant.FAILED_CODE,
                message : Constant.SERVER_ERR,
                name: err.name,
                kind: err.kind
            };
            resp_func(resp);
        } else {
            var resp = {
                result : Constant.OK_CODE,
                data : res
            };
            resp_func(resp);
        }
    });
};
//
SiteSetting.prototype.update = function(existed_condition, update_data, resp_func){
    var options = { upsert: false };
    SiteSetting.updateMany(existed_condition, update_data, options, function(err, numAffected){
        // numAffected is the number of updated documents
        if(err) {
            var resp = {
                result : Constant.FAILED_CODE,
                message: Constant.SERVER_ERR,
                err: err
            };
            resp_func(resp);
        }else{
            var resp = {
                result : Constant.OK_CODE
            };
            resp_func(resp);
        }
    });
};
module.exports = SiteSetting;
