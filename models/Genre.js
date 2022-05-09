/**
 * author: Feipiao
 * category detail
 */
//grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var Constant = require('../common/constant.js');

//define format of Collection
var GenreSchema = new Schema({
    name            :   {type: String, trim: true},  //unique, English name
    display_name    :   {type: Array},
    index           :   {type: Number, default: 100}
}, { collection: 'genre' });

//the schema is useless so far
//we need to create a model using it
var Genre = mongoose.model('Genre', GenreSchema);

//
Genre.prototype.getAll = function(condition, fields, sort,resp_func){
    Genre.find(condition).select(fields).sort(sort).exec(function(err, res) {
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

module.exports = Genre;
