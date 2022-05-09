const express = require('express');
const router = express.Router();
const Temp = require('../models/Temp.js');
var Common = require('../common/common.js');
const Constant = require('../common/constant.js');

var Genre = require('../models/Genre.js');
var MovieDetails = require('../models/MovieNSeriesDetails.js');

router.get('/list-genre', function(req, res, next) {
    var genre = new Genre();
    genre.getAll({},'name', {index: 1}, function(resp){
        if (resp.data){
            let list = [];
            for (const item of resp.data) {
                list.push(item.name);
            }
            resp.data = list;
        }
        return res.rest.success(resp);
    });
});

router.get('/genre/update', function(req, res, next) {
    var movieDetails = new MovieDetails();
    movieDetails.search_by_condition({}, {limit:10,skip:0}, 'genre', {}, function(resp){
        if (resp.result == Constant.OK_CODE && resp.data) {
            let list = [];
            for(let i = 0; i < resp.data.length; i ++){
                list.push(resp.data.genre);
            }
            var common = new Common();
            common.remove_duplicate_array_item(list);
            console.log(list);
        }
    });
});

module.exports = router;