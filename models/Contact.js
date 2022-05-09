/**
 * author: Martin
 * save dropdown options
 */
//grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Constant = require('../common/constant.js');

//define format of Collection
var ContactSchema = new Schema({
    email           :   {type: String, trim: true},
    message         :   {type: String, trim: true},
    options         :   {type: String},    //json
    device_info     :   {type: String},   //json
    is_read         :   {type: Boolean},
    is_deleted      :   {type: Boolean},
    update_count    :   {type: Number},   //count to detect DDoS attach
    create_time     :   {type: Date},
    update_time     :   {type: Date}
  }, { collection: 'Contact' });

//the schema is useless so far
//we need to create a model using it
var Contact = mongoose.model('Contact', ContactSchema);

//create new document
Contact.prototype.create = function(data, resp_func){
  var contact = new Contact(data);
    contact.save(function(err, result){
        if(err) {
            var resp = {
                result : Constant.FAILED_CODE,
                message: Constant.SERVER_ERR,
                err: err
            };
            resp_func(resp);
        }else{
            var resp = { result : Constant.OK_CODE };
            resp_func(resp);
        }
    });
};
//
Contact.prototype.getAll = function(resp_func){
    Contact.find('').exec(function(err, res) {
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
Contact.prototype.search_by_condition = function(condition, paging, fields, sort, resp_func){
    Contact.find(condition).limit(paging.limit).skip(paging.skip).select(fields).sort(sort).exec(function(err, res) {
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
                data : res,
                skip : paging.skip
            };
            resp_func(resp);
        }
    });
};
//
Contact.prototype.update = function(existed_condition, update_data, resp_func){
    var options = { upsert: false };
    Contact.update(existed_condition, update_data, options, function(err, numAffected){
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
//
Contact.prototype.search_no_paging = function(condition, fields, sort, resp_func){
    Contact.find(condition).select(fields).sort(sort).exec(function(err, res) {
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
                data : res,
            };
            resp_func(resp);
        }
    });
};


module.exports = Contact;
