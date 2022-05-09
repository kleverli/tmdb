/**
 * author: Martin
 * language detail
 */
//grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Constant = require('../common/constant.js');

//define format of Collection
var AppSettingSchema = new Schema({
    active_domains            :   {type: Array},   //alternative domain of swipe-x.com
    contact_email        : {type: String, trim: true},
    latest_version       :   {type: String, trim: true},
    upgrade_version_note       :   {type: String, trim: true},  //key to language
    paypal_settings     : {type: Object},
    google_settings: {type: Object}
}, { collection: 'app_setting' });

//the schema is useless so far
//we need to create a model using it
var AppSetting = mongoose.model('AppSetting', AppSettingSchema);

//
AppSetting.prototype.findOne = function(condition, resp_func){
    AppSetting.findOne(condition).exec(function(err, res) {
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
AppSetting.prototype.update = function(existed_condition, update_data, resp_func){
    var options = { upsert: false };
    AppSetting.updateMany(existed_condition, update_data, options, function(err, numAffected){
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
module.exports = AppSetting;
