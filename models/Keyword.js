/**
 * author: Martin
 * save keyword of movie or actress
 */
//grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Constant = require('../common/constant.js');

//define format of Collection
var KeywordSchema = new Schema({
    keyword_title           :   {type: String, trim: true},
    keyword_actress           :   {type: String, trim: true},
    created_time     :   {type: Number}
}, { collection: 'keyword' });

//the schema is useless so far
//we need to create a model using it
var Keyword = mongoose.model('Keyword', KeywordSchema);

//create new document
Keyword.prototype.create = function(data, resp_func){
    var contact = new Keyword(data);
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


module.exports = Keyword;
