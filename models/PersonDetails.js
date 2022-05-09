/**
 * movie detail
 */

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var Constant = require('../common/constant.js');

//define format of Collection
var PersonDetailsSchema = new Schema({
    person_id       :   {type: Number},
    name            :   {type: String},
    profile_path    :   {type: String},
    also_known_as   :   [{ type: String }],
    is_active       :   {type: Number, default: 1}
}, { collection: 'person_details', timestamps: true });

//the schema is useless so far
//we need to create a model using it
var Person =  mongoose.model('Person', PersonDetailsSchema);

Person.prototype.search_by_condition = function(condition, paging, fields, sort, resp_func){
    Person.find(condition).limit(paging.limit).skip(paging.skip).select(fields).sort(sort).exec(function(err, res) {
        if (err) {
            var resp = {
                result : Constant.FAILED_CODE,
                message : Contstant.SERVER_ERR,
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

Person.prototype.getAllNoPaging = function(condition, resp_func){
    Person.find(condition).exec(function(err, res) {
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
module.exports = Person;