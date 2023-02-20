const express = require('express');
const router = express.Router();
const Temp = require('../models/Temp.js');
var Common = require('../common/common.js');
const Constant = require('../common/constant.js');
var utils = require('../common/web_utils.js');
var Category = require('../models/Category.js');

var mongoose = require('mongoose');

var MovieN = require('../models/MovieNSeries.js');
var MovieDetails = require('../models/MovieNSeriesDetails.js');
var Person = require('../models/PersonDetails.js');

function getItemByProperty(arr, propName, propValue){
    for(var i = 0; i < arr.length; i ++){
        if (arr[i][propName] == propValue){
            return arr[i];
        }
    }
    return null;
}

function getItemByStrProperty(arr, propName, propValue){
    for(var i = 0; i < arr.length; i ++){
        if (arr[i][propName].toString() == propValue.toString()){
            return arr[i];
        }
    }
    return null;
}

router.get('/cate/list', function(req, res, next) {
    var category = new Category();
    //get all categories
    category.getAllNoPaging({"is_active": 1}, function(resp_category) {
        var cat_list = [];
        if (resp_category.result == Constant.OK_CODE && resp_category.data != null){
            for (var i = 0; i < resp_category.data.length; i++){
                cat_list.push(resp_category.data[i]["name"]);
            }
        }
        return res.rest.success({data: cat_list});
    });
    
});

router.get("/subtitle-link/:movieId", function (req, res, next) {
    var movieId = req.params.movieId;
    let common = new Common();
    if (common.isEmpty(movieId)) {
      res.rest.success({ message: "Missing movie id" });
      return;
    }
    var movie = new MovieN();
    var fileds = "_id subtitle_link";
    movie.findOne({ _id: movieId }, fileds, function (resp) {
      if (resp.result == Constant.OK_CODE && resp.data) {
        var mv = resp.data;
        var links = mv["subtitle_link"];
        var mvId = mv["_id"];
        var newLinks = [];
        if (links && links.length > 0) {
          var linkItem;
          for (const subtitle of links) {
            if (subtitle["language"] && subtitle["file_link"]) {
              linkItem = {};
              var key = subtitle["language"].toUpperCase();
              var url = Constant.S3_BUCKET + mvId + "/" + subtitle["file_link"];
              linkItem[key] = url;
              newLinks.push(linkItem);
              // subtitle["file_link"] = ;
            }
          }
        }
        mv["_doc"]["subtitle_link"] = newLinks;
  
        res.rest.success({ data: mv });
      } else {
        res.rest.success(resp);
      }
    });
  });

router.get('/movie/page-list', function (req, res, next) {
    var condition = { "is_active": 1 };
    var category = req.query["category"];
    var country = req.query["country"];
    var canStream  = req.query["can_stream"]
    var is_popular = req.query["most_popular"]
    var is_top_rated = req.query["top_rated"]
  
    let common = new Common();
  
    if (common.isNotEmpty(is_popular)) {
      if(is_popular == 'true') {
        condition["is_popular"] = 1
      } else if (is_popular == 'false') {
        condition["is_popular"] = 0
      }
    }
  
    if (common.isNotEmpty(is_top_rated)) {
      if(is_top_rated == 'true') {
        condition["is_top_rated"] = 1
      } else if (is_top_rated == 'false'){
        condition["is_top_rated"] = 0
      }
    }
  
    if (common.isNotEmpty(canStream)) {
      if(canStream == 'true') {
        condition["$or"] = [
          { "category": "series" },
          { "category": "movie", "wasabi_url_2" : {$exists : true} }
        ];
      }  else if(canStream == 'false') {
        condition["$and"] = 
          [{ "category": "movie"}, 
          {"wasabi_url_2" : {$exists : false} }]      
      }
    }
  
  
  
    if (common.isNotEmpty(category)) {
      condition["category"] = category;
    } else {
      //category = "movie";
      //condition["category"] = "movie";
    }
    if (common.isNotEmpty(country)) {
      condition["countries"] = { $regex: country, $options: "i" };
    }
    /*var sorts = req.query["sort"];
    if (common.isNotEmpty(sorts)){
        sort_arr = sorts.split(" ");
        var sort_fields = ["startyear", "imdb_score"];
  
    }*/
  
  
    var paging = utils.getPage(req, 80);
    var movie = new MovieN();
    movie.countDocuments(condition, function (res_total) {
      var show_data = [];
      var total = 0;
      if (res_total.result == Constant.OK_CODE) {
        total = res_total.data;
        var sorts = { "releaseDate": -1, "_id": 1 };
        let fields = '_id title_display_name imdb_id imdb_score category startyear releaseDate thumbnail_image countries tmdb_show_id is_popular is_top_rated backdrop_images'
        
        movie.search_by_condition(condition, paging, fields, sorts, function (resp) {
          //movie.search_by_condition(condition, paging,'_id title_display_name startyear',{startyear: -1}, function(resp){
          if (resp.result == Constant.OK_CODE && resp.data) {
            var mvs = resp.data;
            var ids = [];
            for (var i = 0; i < resp.data.length; i++) {
              ids.push(resp.data[i]["_id"]);
            }
            var movieDetails = new MovieDetails();
            movieDetails.getAllNoPaging({ "movie_id": { "$in": ids } }, {}, function (resp_detail) {
              if (resp_detail.data) {
                var arr = [], item;
                for (var i = 0; i < mvs.length; i++) {
                  item = getItemByStrProperty(resp_detail.data, "movie_id", mvs[i]["_id"]);
  
                  if (mvs[i].backdrop_images[0]) {
                    mvs[i]["_doc"]["wide_thumbnail"] = mvs[i].backdrop_images[0].replace("w1280", "w780");
                  }
  
                  if (item) {
                    mvs[i]["_doc"]["genre"] = item.genre;
                  }
  
                  if (mvs[i].category == "movie") {
                    if (mvs[i]["_doc"].wasabi_url_2) {
                      mvs[i]["_doc"]["can_stream"] = true
                    } else {
                      mvs[i]["_doc"]["can_stream"] = false
                    }
                  } else {
                    mvs[i]["_doc"]["can_stream"] = true
                  }
  
                  delete mvs[i]["_doc"].backdrop_images
  
                  if(mvs[i]["_doc"]?.is_popular ==0){
                    mvs[i]["_doc"].is_popular = false
                  }else if(mvs[i]["_doc"]?.is_popular ==1){
                    mvs[i]["_doc"].is_popular = true
                  }
  
                  if(mvs[i]["_doc"]?.is_top_rated ==0){
                    mvs[i]["_doc"].is_top_rated = false
                  }else if(mvs[i]["_doc"]?.is_top_rated ==1){
                    mvs[i]["_doc"].is_top_rated = true
                  }
                }
                //resp_detail.data = mvs;
                res.rest.success({ data: mvs, total: total });
              } else {
                res.rest.success({ data: mvs, total: total });
              }
            });
          } else {
            res.rest.success({ data: show_data, total: total });
          }
        });
      } else {
        res.rest.success({ data: show_data, total: total });   //success
      }
    });
  });
  
router.get("/movie/search", function (req, res, next) {
var category = req.query["category"];
var genre = req.query["genre"];
var keyword = req.query["keyword"];
var actor = req.query["actor"];
var country = req.query["country"];
var personId = req.query["person_id"];
var canStream  = req.query["can_stream"]
var is_popular = req.query["most_popular"]
var is_top_rated = req.query["top_rated"]

var condition = { "movie.is_active": 1 };
let common = new Common();

if (common.isNotEmpty(canStream)) {
    if(canStream == 'true') {
    condition["$or"] = [
        { "movie.category": "series" },
        { "movie.category": "movie", "movie.wasabi_url_2" : {$exists : true} }
    ];
    } else if(canStream == 'false') {
    condition["$and"] = 
        [{ "movie.category": "movie"}, 
        {"movie.wasabi_url_2" : {$exists : false} }]      
    }
}

if (common.isNotEmpty(is_popular)) {
    if(is_popular == 'true') {
    condition["movie.is_popular"] = 1
    } else if (is_popular == 'false') {
    condition["movie.is_popular"] = 0
    }
}

if (common.isNotEmpty(is_top_rated)) {
    if(is_top_rated == 'true') {
    condition["movie.is_top_rated"] = 1
    } else if (is_top_rated == 'false') {
    condition["movie.is_top_rated"] = 0
    }
}

if (common.isEmpty(category)) {
    condition["movie.category"] = "movie";
} else {
    condition["movie.category"] = category;
}

if (common.isNotEmpty(genre)) {
    condition["genre"] = genre;
}

if (common.isNotEmpty(country)) {
    condition["movie.countries"] = { $regex: country, $options: "i" };
}

if (common.isNotEmpty(actor)) {
    //condition["cast.name"] = actor; // /^xiao$/
    condition["search_slug"] = { $regex: actor, $options: "i" }; // "^" + actor + "$"
}
if (common.isNotEmpty(personId)) {
    //condition["cast.name"] = actor; // /^xiao$/
    const personIdNum = parseInt(personId);
    condition["cast.person_id"] = personIdNum; // "^" + actor + "$"
}

if (common.isNotEmpty(keyword)) {
    condition["movie.search_slug"] = { $regex: keyword, $options: "i" };
}

var paging = utils.getPage(req, 80);

var fields = {
_id: 1,
genre: 1,
//'discription': 1,
//'cast': 1,
movie: {
    _id: 1,
    title_display_name: 1,
    imdb_id: 1,
    category: 1,
    imdb_score: 1,
    startyear: 1,
    releaseDate: 1,
    countries: 1,
    thumbnail_image: 1,
    backdrop_images: 1,
    is_popular: 1,
    is_top_rated: 1
},
};

var movieDetails = new MovieDetails();
var count_key = "genre";
var count_fields = {
    _id: 1,
    genre: 1,
    //'discription': 1,
    //'cast': 1,
    movie: {
    imdb_id: 1,
    },
};
movieDetails.count_keywords(
    condition,
    paging,
    count_fields,
    count_key,
    { updatedAt: 1 },
    function (resp_t) {
    var show_data = [];
    var total = 0;
    if (resp_t.result == Constant.OK_CODE && resp_t.data) {
        if (resp_t.data.length > 0 && resp_t.data[0][count_key] > 0) {
        total = resp_t.data[0][count_key];
        var sorts = { "movie.releaseDate": -1, _id: 1 };
        movieDetails.search_by_keywords(
            condition,
            paging,
            fields,
            sorts,
            function (resp) {
            if (resp.result == Constant.OK_CODE && resp.data) {
                var list = [],
                item;
                for (var i = 0; i < resp.data.length; i++) {
                item = resp.data[i].movie[0];
                item["genre"] = resp.data[i].genre;

                if (item.backdrop_images[0]) {
                    item["wide_thumbnail"] = item.backdrop_images[0].replace("w1280", "w780");
                }
                delete item.backdrop_images

                if(item?.is_popular ==0){
                    item.is_popular = false
                }else if(item?.is_popular ==1){
                    item.is_popular = true
                }

                if(item?.is_top_rated ==0){
                    item.is_top_rated = false
                }else if(item?.is_top_rated ==1){
                    item.is_top_rated = true
                }

                if (item.category == "movie") {
                    if (item.wasabi_url_2) {
                    item["can_stream"] = true
                    } else {
                    item["can_stream"] = false
                    }
                } else {
                    item["can_stream"] = true
                }

                list.push(item);
                }

                res.rest.success({ data: list, total: total });
            } else {
                res.rest.success({ data: show_data, total: 0 });
            }
            }
        );
        } else {
        res.rest.success({ data: show_data, total: 0 });
        }
    } else {
        res.rest.success({ data: show_data, total: total }); //success
    }
    }
);
});
  
router.get("/movie/detail/:movieId", function (req, res, next) {
var movieId = req.params.movieId;
let common = new Common();
if (common.isEmpty(movieId)) {
    res.rest.success({ message: "Missing movie id" });
    return;
}
var movie = new MovieN();
var fileds =
    "_id title_display_name startyear video_duration rating cover_image backdrop_images trailer_urls";
movie.findOne({ _id: movieId }, fileds, function (resp) {
    if (resp.result == Constant.OK_CODE && resp.data) {
    var mv = resp.data;
    var movieDetails = new MovieDetails();
    movieDetails.findOne({ movie_id: mv["_id"] }, function (resp_detail) {
        mv["_doc"].discription = [];
        if (resp_detail.result == Constant.OK_CODE && resp_detail.data) {
        mv["_doc"].discription = resp_detail.data.discription;
        }
        //resp_detail.data = mv;
        // mv["_doc"].webseed_url_2 = common.replace_s3_to_bcdn(mv["webseed_url_2"]);
        if (mv["torrent_url_1"] && mv["torrent_url_1"]["url"]) {
        mv["torrent_url_1"]["url"] = common.decrypt_magnet_link(
            mv["torrent_url_1"]["url"]
        );
        }

        if(process.env.SEEDS_CACHE == 1 &&  mv?._doc?.wasabi_url_2){
        mv["_doc"]['wasabi_url_2'] = mv["_doc"]['wasabi_url_2'].replace('s3.us-central-1.wasabisys.com/seeds','seeds.b-cdn.net')
        }

        res.rest.success({ data: mv });
    });
    } else {
    res.rest.success(resp);
    }
});
});

router.get("/movie/actors/:movieId", function (req, res, next) {
    var movieId = req.params.movieId;
    let common = new Common();
    if (common.isEmpty(movieId)) {
      res.rest.success({ message: "Missing movie id" });
      return;
    }
  
    var movieDetails = new MovieDetails();
    //search in movie category instead
    movieDetails.findOne(
      { movie_id: mongoose.Types.ObjectId(movieId) },
      function (resp) {
        if (resp.result == Constant.OK_CODE && resp.data) {
          if (resp.data.cast && resp.data.cast.length > 0) {
            var arrCast = resp.data.cast;
            getMoviesActorsDetails(arrCast, res);
          } else {
            res.rest.success({ data: [] });
          }
        } else {
          res.rest.success({ message: Constant.NOT_FOUND });
        }
      }
    );
  });

router.get('/country-list', function(req, res, next) {
    var countries = [
        'Afghanistan', 'Algeria', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Belgium', 
        'Bosnia and Herzegovina', 'Brazil', 'Bulgaria', 'Cambodia', 'Cameroon', 'Canada',
        'Chad', 'Chile', 'China', 'Colombia', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
        'Czechoslovakia', 'Denmark', 'Dominican Republic', 'Ecuador', 'Egypt', 'Estonia', 
        'Federal Republic of Yugoslavia', 'Finland', 'France', 'Georgia', 'Germany', 'Ghana',
        'Greece', 'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 
        'Ireland', 'Isle of Man', 'Israel', 'Italy', 'Japan', 'Jordan', 'Kazakhstan', 
        'Kenya', 'Korea', 'Kosovo', 'Laos', 'Latvia', 'Lebanon', 'Lithuania', 'Luxembourg',
        'Macao', 'Malaysia', 'Malta', 'Mauritania', 'Mexico', 'Monaco', 'Morocco', 'Netherlands',
        'New Zealand', 'Nigeria', 'North Korea', 'Norway', 'Occupied Palestinian Territory', 
        'Pakistan', 'Panama', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Puerto Rico',
        'Qatar', 'Republic of Macedonia', 'Romania', 'Russia', 'Saudi Arabia', 'Senegal', 
        'Serbia', 'Singapore', 'Slovakia', 'Slovenia', 'South Africa', 'South Korea',
        'Soviet Union', 'Spain', 'Sweden', 'Switzerland', 'Taiwan', 'Tanzania', 
        'Thailand', 'Tunisia', 'Turkey', 'UK', 'USA', 'Uganda', 'Ukraine','United Arab Emirates', 
        'Uruguay', 'Venezuela', 'Vietnam', 'West Germany', 'Yugoslavia'
    ]
    res.rest.success({data: countries});
});

function getMoviesActorsDetails(arrCast, res) {
    var ids = [];
    for (var i = 0; i < arrCast.length; i++) {
      ids.push(arrCast[i].person_id);
    }
    var person = new Person();
    person.getAllNoPaging({ person_id: { $in: ids } }, function (resp_p) {
      if (resp_p.data) {
        var arr = [],
          item;
        for (var i = 0; i < arrCast.length; i++) {
          item = getItemByProperty(
            resp_p.data,
            "person_id",
            arrCast[i].person_id
          );
          if (item) {
            arrCast[i]["profile_path"] = item.profile_path;
            arrCast[i]["also_known_as"] = null
            arrCast[i]["popularity"] = item.popularity || null
          }
        }
        //resp_p.data = arrCast
        arrCast.sort((a, b) => b.popularity - a.popularity);
        res.rest.success({ data: arrCast });
      } else {
        res.rest.success({ data: [] });
      }
    });
  }

module.exports = router;
