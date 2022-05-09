var express = require("express");
var router = express.Router();
var Common = require("../common/common.js");
var Constant = require("../common/constant.js");
var Movie = require("../models/Movie.js");
var movie_n_series = require("../models/MovieAndSeries.js");
var movie_n_series_details = require("../models/MovieAndSeriesDetails.js");
var fs = require("fs");
let logger = require("../libraries/logger").Logger;
var csv = require("csv-parser");
var axios = require("axios");
var person_details = require("../models/PersonDetails.js");
const RarbgApi = require('rarbg');
const rarbgApi = require('rarbg-api')
// Create a new instance of the module
const rarbg = new RarbgApi();
var CronJob = require("cron").CronJob;
const { resolve } = require("path");





/*get magnet url object from rarbg-api
  create function for get magnet url from rarbgapi.
  create object for magnet url
  get movie from rarbg
  sort movie by seeders
  set object of magnet url
  return object
*/
let getTorrentFunc = async (imdb_id) => {
  let obj = { quality: "1080p", url: "", hash: "", seed: "", peers: "", size: "", size_bytes: "" };
  let mv = await rarbgApi.search(imdb_id, null, "imdb");
  if (mv && !mv.error) {
    let sorted_mv = mv.sort(function (a, b) { return b.seeders - a.seeders });
    let filt = sorted_mv.filter(ele => ele.category = "Movies/x264/1080");
    let type = filt[0].title.includes("BluRay");
    if (filt[0].title) {
      let title = filt[0].title.toLowerCase();
      if (title.includes("bluray")) {
        obj.type = "bluray";
      }
      else if (title.includes("web")) {
        obj.type = "web";
      }
      else if (title.includes("dvdrip")) {
        obj.type = "dvdrip";
      }
    }
    if (filt[0].download) {
      obj.url = filt[0].download
    }
    if (filt[0].seeders == 0 || filt[0].seeders) {
      obj.seed = filt[0].seeders;
    }
    if (filt[0].leechers == 0 || filt[0].leechers) {
      obj.peers = filt[0].leechers;
    }
    if (filt[0].size) {
      obj.size = niceBytes(filt[0].size);
      obj.size_bytes = filt[0].size;
    }
    let upadated = await movie_n_series.findOneAndUpdate({ imdb_id: imdb_id }, { torrent_url_2: obj });
    console.log(upadated.imdb_id, 'updated');
    // return obj;
  }
  else {
    console.log(imdb_id);
    if (mv && mv.error_code == 10) {
      await movie_n_series.findOneAndUpdate({ imdb_id: imdb_id }, { $set: { try_to_check_megnet_url: 6 } })
    }
    else {
      await movie_n_series.findOneAndUpdate({ imdb_id: imdb_id }, { $inc: { try_to_check_megnet_url: 1 } })
    }
  }
}
// var cronjob = new CronJob("0 */2 * * *", async (req, res) => {
//   try
//   {
//     let data = await movie_n_series.aggregate([
//       {
//         $match: {
//           $and: [
//             {
//               $or: [
//                 { try_to_check_megnet_url: { $exists: false } },
//                 { try_to_check_megnet_url: { $lte: 5 } },
//               ]
//             },
//             {
//               $or: [
//                 { torrent_url_2: { $exists: false } },
//                 { "torrent_url_2.url": { $not: { $regex: /magnet/ } } }
//               ]
//             }
//           ]
//         }
//       },
//       // {
//       //   $limit: 30
//       // }
//     ])
//     console.log(data.length);
//     for(i=0;i<data.length;i++)
//     {

//       getTorrentFunc(data[i].imdb_id);
//       await sleep(3);
//     } 
//   }
//   catch(error)
//   {
//     console.log(error)
//   }

// });
// cronjob.start();
//convert file size into bites
function niceBytes(x) {
  const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let l = 0, n = parseInt(x, 10) || 0;
  while (n >= 1024 && ++l) {
    n = n / 1024;
  }
  return (n.toFixed(n < 10 && l > 0 ? 1 : 0) + units[l]);
}

//if magnet url is not exist in rarbg then call the function try to fetch from rarbg-api
let newfunc = async (imdb_id) => {
  let getdetails = await getTorrentFunc(imdb_id);
  console.log(getdetails);
  if (getdetails) {
    // let updated = await movie_n_series.findOneAndUpdate({ imdb_id: imdb_id }, { torrent_url_2: getdetails });
  }
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, (ms * 1000)));
}

router.get('/getmovie', async (req, res) => {
  res.end();
  let get_subtitle = await Movie.find({ link: { $exists: true, $eq: "" } }, { link: 1 });
  console.log(get_subtitle.length)

  for (i = 0; i < get_subtitle.length; i++) {
    //console.log(obj);
    // let updated = await Movie.findOneAndUpdate({_id:get_subtitle[i]._id},{$set:{subtitle_link:[obj]}});
    let updated = await Movie.findOneAndUpdate({ _id: get_subtitle[i]._id }, { $unset: { link: "" } });
    console.log(updated._id);
  }

});
//get totalRatingVotes and countries from imdb-api.com
let get_countries_totalRatingVotes = async (imdb_id) => {
  try
  {
    let obj = {};
    let rate = await axios.get(`https://imdb-api.com/en/API/UserRatings/${Constant.IMDB_API_KEY}/${imdb_id}`);
    if (rate && rate.status == 200 && rate.data && rate.data.totalRatingVotes) {
      obj.totalRatingVotes = rate.data.totalRatingVotes;
    }
    let title = await axios.get(`https://imdb-api.com/en/API/Title/${Constant.IMDB_API_KEY}/${imdb_id}`);
    if (title.status == 200 && title.data) {
      obj.imdbData = title.data;
    }
    return obj;
  }
 catch(error)
 {
   console.log(error);
 }
 
}
router.get('/add_totalrating_countries', async (req, res) => {
  res.end();
  // let movies = await movie_n_series.find({ totalRatingVotes: { $exists: false },countries:{$exists:false} }, { imdb_id: 1 });

  let movies = await movie_n_series.find({ $or: [{ totalRatingVotes: { $exists: false } }, { countries: { $exists: false } }] }, { imdb_id: 1, is_active: 1, totalRatingVotes: 1, countries: 1 })

  console.log(movies.length);
  for (i = 0; i < movies.length; i++) {
    if (!movies[i].totalRatingVotes) {
      let rate = await axios.get(`https://imdb-api.com/en/API/UserRatings/${Constant.IMDB_API_KEY}/${movies[i].imdb_id}`);
      if (rate && rate.status == 200 && rate.data && rate.data.totalRatingVotes) {
        if (Number(rate.data.totalRatingVotes) < 1000) {
          movies[i].is_active = 0;
          console.log('deactive');
        }
        movies[i].totalRatingVotes = rate.data.totalRatingVotes;
      }
    }
    if (!movies[i].countries) {
      let title = await axios.get(`https://imdb-api.com/en/API/Title/${Constant.IMDB_API_KEY}/${movies[i].imdb_id}`);
      if (title.status == 200 && title.data && title.data.countries) {
        movies[i].countries = title.data.countries;
      }
    }
    await movies[i].save();
    console.log(movies[i].countries, movies[i].totalRatingVotes, i);
  }
})
router.get("/list/page", function (req, res, next) {
  var movie = new Movie();
  // movie.search_by_condition('', {limit:3, skip: 0}, '', 'code', function(resp){
  //     res.rest.success({result: resp});   //success
  // });
  movie.getAll(function (resp) {
    res.rest.success(resp); //success
  });
});
//update magnet link of auto tool
router.post("/update-uri", function (req, res) {
  var code = req.body["code"];
  var key = req.body["key"];
  var link = req.body["link"];
  var org_url = req.body["org_url"]; //path to mp4 file
  var size = req.body["size"]; //size in GB or MB
  var video_len = req.body["video_len"]; //duration of video
  if (key != "AUTO-77498432568") {
    //from automation tool
    res.rest.success({ data: { message: "Invalid key" } });
    return;
  }
  var common = new Common();
  if (common.isEmpty(code)) {
    res.rest.success({ data: { message: "Invalid code" } });
    return;
  } else if (common.isEmpty(link) && common.isEmpty(org_url)) {
    res.rest.success({
      data: { message: "Magnet link or file url is required" },
    });
    return;
  } else if (
    !common.isEmpty(link) &&
    link.indexOf("magnet:?xt=urn:btih:") < 0
  ) {
    res.rest.success({ data: { message: "Invalid magnet link" } });
    return;
  }
  //search movie by title
  var movie = new Movie();
  movie.findOne({ title: code }, function (resp_detail) {
    if (resp_detail.result == Constant.OK_CODE && resp_detail["data"] != null) {
      var common = new Common();
      var new_data = {};
      new_data["processed_auto_tool"] = 1;
      if (!common.isEmpty(link)) {
        link = common.decrypt_magnet_link(link);
        var play_links = resp_detail["data"]["play_links"];
        if (common.isEmpty(play_links)) {
          play_links = [];
        }
        //do not add duplicated link
        if (play_links.length > 0) {
          //remove the link
          play_links = play_links.filter((item) => item != link);
        }
        play_links.push(link); //to make sure latest link at the end
        new_data["play_links"] = play_links;
        new_data["link_type"] = "webseed";
      }

      if (common.isNotEmpty(org_url)) {
        new_data["org_url"] = org_url;
      }
      if (common.isNotEmpty(size)) {
        new_data["size"] = size;
      }
      if (common.isNotEmpty(video_len)) {
        new_data["video_len"] = video_len;
      }
      //save back
      movie.update(
        { _id: resp_detail["data"]["_id"] },
        new_data,
        function (resp_update) {
          if (resp_update.result == Constant.OK_CODE) {
            res.rest.success({ data: Constant.OK_CODE });
          } else {
            res.rest.success({ data: { message: Constant.SERVER_ERR } });
          }
        }
      );
    } else {
      //not found
      res.rest.success({ data: { message: Constant.NOT_FOUND } });
    }
  });
});
//get detail by code
router.get("/detail/by-code", function (req, res, next) {
  var code = req.query["code"];
  var movie = new Movie();
  movie.search_by_condition(
    { code: code },
    { limit: 1, skip: 0 },
    "play_links",
    { created_time: -1 },
    function (resp) {
      res.rest.success(resp);
    }
  );
});
//get videos in 14 days old
router.get("/list/14-days-old", function (req, res, next) {
  var oldest_scan_time = req.query["oldest_scan_time"];
  var movie = new Movie();
  movie.search_by_condition(
    {
      source: "javdb",
      $or: [
        { scanned_time: null },
        { scanned_time: { $lt: oldest_scan_time } },
      ],
    },
    { limit: 30, skip: 0 },
    "",
    { created_time: -1 },
    function (resp) {
      res.rest.success(resp);
    }
  );
});
//get list of movies have no sukebei link
router.get("/list/non-sukebei", function (req, res, next) {
  var condition = {};
  condition["link_type"] = { $nin: ["webseed", "sukebei"] };
  condition["searched_sukebei"] = { $ne: 1 };
  condition["is_active"] = 1;
  condition["source"] = "javdb";
  condition["category_id"] = req.query["category_id"];
  if (condition["category_id"] == "5f7592975c425008d254a789") {
    //#uncensored
    var one_day_sec = 2 * 24 * 3600; //2 days
    var common = new Common();
    var current_time = common.get_created_time();
    condition["created_time"] = { $lt: current_time - one_day_sec };
  }
  var limit = Math.round(req.query["limit"]);
  var movie = new Movie();

  movie.search_by_condition(
    condition,
    { limit: limit, skip: 0 },
    "title",
    { idx_in_day: -1 },
    function (resp) {
      res.rest.success(resp);
    }
  );
});
//update video with new links & type
router.post("/batch-update", function (req, res) {
  var common = new Common();
  if (common.isEmpty(req.body["items"])) {
    res.rest.success({ message: "Missing params!" });
  } else {
    var items = req.body["items"]; //list of new movie detail: _id, link, link_type, searched_sukebei, trailer_url, size
    var movie = new Movie();
    for (var i = 0; i < items.length; i++) {
      if (common.isEmpty(items[i]["_id"])) {
        continue;
      }
      var new_data = {
        scanned_time: common.get_created_time(),
      };
      if (
        common.isNotEmpty(items[i]["link"]) &&
        items[i]["link"].indexOf("magnet:?xt=urn:btih:") == 0
      ) {
        new_data["play_links"] = [items[i]["link"]]; //link must be encrypted
        if (common.isSukebeiLink(items[i]["link"])) {
          new_data["link_type"] = "sukebei";
        }
      }
      if (common.isNotEmpty(items[i]["link_type"])) {
        new_data["link_type"] = items[i]["link_type"];
      }
      if (common.isNotEmpty(items[i]["searched_sukebei"])) {
        new_data["searched_sukebei"] = items[i]["searched_sukebei"];
      }
      if (common.isNotEmpty(items[i]["trailer_url"])) {
        new_data["trailer_url"] = items[i]["trailer_url"];
      }
      if (common.isNotEmpty(items[i]["size"])) {
        new_data["size"] = items[i]["size"];
      }
      //assume front end must send of of update field
      movie.update(
        { _id: items[i]["_id"] },
        new_data,
        function (resp_update) { }
      );
    }
    res.rest.success({});
  }
});
//upsert new video from python script
router.post("/upsert_python", function (req, res) {
  var common = new Common();

  var data = {
    code: req.body["code"],
    title: req.body["title"],
    description: req.body["description"],
    share_date: req.body["share_date"],
    share_date_utc: req.body["share_date_utc"],
    thumbnail: req.body["thumbnail"],
    cover_url: req.body["cover_url"],
    size: req.body["size"],
    play_links: req.body["play_links"],
    created_time: req.body["created_time"],
    category_id: req.body["category_id"],
    source: req.body["source"],
    is_active: req.body["is_active"],
    video_len: req.body["video_len"],
    searched_sukebei: req.body["searched_sukebei"],
  };

  if (common.isNotEmpty(req.body["thumb_pics"])) {
    data["thumb_pics"] = req.body["thumb_pics"];
  }
  if (common.isNotEmpty(req.body["actress"])) {
    data["actress"] = req.body["actress"];
  }
  if (common.isNotEmpty(req.body["link_type"])) {
    data["link_type"] = req.body["link_type"];
  }
  if (common.isNotEmpty(req.body["trailer_url"])) {
    data["trailer_url"] = req.body["trailer_url"];
  }

  if (common.isEmpty(data["code"]) && common.isEmpty(data["title"])) {
    res.rest.success({ data: { message: Constant.EMPTY_DATA } });
  } else {
    var movie = new Movie();
    //search existing movie
    movie.findOne({ title: data["title"] }, function (res_detail) {
      if (res_detail.result == Constant.OK_CODE) {
        if (res_detail.data != null) {
          //existed, update magnet link
          var update_data = {
            searched_sukebei: data["searched_sukebei"],
          };
          if (common.isNotEmpty(data["size"])) {
            update_data["size"] = data["size"];
          }
          if (common.isNotEmpty(data["video_len"])) {
            update_data["video_len"] = data["video_len"];
          }
          if (common.isNotEmpty(data["trailer_url"])) {
            update_data["trailer_url"] = data["trailer_url"];
          }
          //do not overwrite magnet link
          if (
            common.isEmpty(res_detail.data["play_links"]) ||
            res_detail.data["play_links"].length == 0
          ) {
            update_data["play_links"] = data["play_links"];
          }
          movie.update(
            { _id: res_detail.data["_id"] },
            update_data,
            function (resp_create) {
              res.rest.success({ data: resp_create });
            }
          );
        } else {
          //create new
          //get movies which same share date utc
          movie.countDocuments(
            { share_date_utc: data["share_date_utc"] },
            function (res_total) {
              var total = data["share_date_utc"];
              if (res_total.result == Constant.OK_CODE) {
                total += res_total.data;
              }
              data["idx_in_day"] = total + 1;
              movie.create(data, function () {
                res.rest.success();
              });
            }
          );
        }
      } else {
        //error
        res.rest.success({
          data: { message: "Insert failed due to server error" },
        });
      }
    });
  }
});
//=========
//get list of movies to do with auto tool (older than 7 days)
router.get("/list/auto-tool", function (req, res, next) {
  var category_id = req.query["category_id"];
  if (category_id == null || category_id == "") {
    res.rest.success({ message: "Missing category id" });
    return;
  }
  var common = new Common();
  var current_time = common.get_created_time();
  var older_7_day = current_time - 7 * 24 * 3600;
  var condition = {};
  condition["category_id"] = category_id;
  condition["created_time"] = { $lt: older_7_day };
  condition["is_active"] = 1;
  condition["processed_auto_tool"] = { $ne: 1 };
  condition["link_type"] = { $ne: "webseed" };
  condition["org_url"] = { $not: { $exists: true, $ne: "" } };
  condition["play_links"] = { $exists: true, $ne: [] };
  var current_movie_id = req.query["current_movie_id"];

  if (current_movie_id != null && current_movie_id != "") {
    var movie = new Movie();
    //search next of this movie id
    movie.findOne({ _id: current_movie_id }, function (resp_detail) {
      condition["idx_in_day"] = { $lt: resp_detail.data["idx_in_day"] };
      search_1_movie_auto(condition, function (data) {
        res.rest.success(data);
      });
    });
  } else {
    search_1_movie_auto(condition, function (data) {
      res.rest.success(data);
    });
  }
});
//
function search_1_movie_auto(condition, callback) {
  var movie = new Movie();
  movie.findOne(condition, function (resp) {
    var common = new Common();
    var result = {
      _id: resp.data["_id"],
      title: resp.data["title"],
      size: resp.data["size"],
      link: common.decrypt_magnet_link(
        resp.data["play_links"][resp.data["play_links"].length - 1]
      ),
      share_date_utc: resp.data["share_date_utc"],
      idx_in_day: resp.data["idx_in_day"],
    };
    callback(result);
  });
}
//update auto tool
router.post("/update-movie-by-auto-tool", function (req, res) {
  var _id = req.body["movie_id"];
  var link = req.body["link"]; //webseed link
  var org_url = req.body["org_url"]; //path to mp4 file
  var is_active = req.body["is_active"];
  var common = new Common();
  if (common.isEmpty(_id)) {
    res.rest.success({ message: "Invalid id" });
    return;
  } else if (
    common.isEmpty(link) &&
    common.isEmpty(org_url) &&
    common.isEmpty(is_active)
  ) {
    res.rest.success({ message: "Missing parameter" });
    return;
  }
  //search movie by title
  var movie = new Movie();
  movie.findOne({ _id: _id }, function (resp_detail) {
    if (resp_detail.result == Constant.OK_CODE && resp_detail["data"] != null) {
      var common = new Common();
      var new_data = {};
      new_data["processed_auto_tool"] = 1;
      if (!common.isEmpty(link)) {
        link = common.decrypt_magnet_link(link);
        var play_links = resp_detail["data"]["play_links"];
        if (common.isEmpty(play_links)) {
          play_links = [];
        }
        //do not add duplicated link
        if (play_links.length > 0) {
          //remove the link
          play_links = play_links.filter((item) => item != link);
        }
        play_links.push(link); //to make sure latest link at the end
        new_data["play_links"] = play_links;
        new_data["link_type"] = "webseed";
      }

      if (common.isNotEmpty(org_url)) {
        new_data["org_url"] = org_url;
      }
      if (is_active != null) {
        new_data["is_active"] = parseInt(is_active) > 0 ? 1 : 0;
      }
      //save back
      movie.update({ _id: _id }, new_data, function (resp_update) {
        if (resp_update.result == Constant.OK_CODE) {
          res.rest.success({ message: Constant.OK_CODE });
        } else {
          res.rest.success({ message: Constant.SERVER_ERR });
        }
      });
    } else {
      //not found
      res.rest.success({ message: Constant.NOT_FOUND });
    }
  });
});

//import imdb and yts data for csv imdb_ids
router.get("/import_movie_details", async (req, res) => {
  try {
    let csvData = ["tt1613040", "tt2368635", "tt3486542"];
    fs.createReadStream("public/movie_merge.csv")
      .pipe(csv({ delimiter: "," }))
      .on("data", async function (csvrow) {
        // csvData.push(csvrow.IMDBID);
      })
      .on("end", async () => {
        res.end();

        for (let index = 0; index < csvData.length; index++) {
          const element = csvData[index];
          //check movie already exist or not
          let exist_movie = await movie_n_series.findOne({ imdb_id: element })
          if (exist_movie == null) {
            let create_movie = new movie_n_series({
              imdb_id: element,
              category: Constant.MOVIE,
            });
            let create_movie_details = new movie_n_series_details({
              movie_id: create_movie._id,
            });

            try {
              //get yts api response
              let ytsResponse = await axios.get(
                `${Constant.YTS_API}${element}`
              );
              if (
                ytsResponse &&
                ytsResponse.status == 200 &&
                ytsResponse.data &&
                ytsResponse.data.data &&
                ytsResponse.data.data.movie_count &&
                ytsResponse.data.data.movie_count == 1
              ) {
                if (
                  ytsResponse.data.data.movies[0].torrents &&
                  ytsResponse.data.data.movies[0].torrents.length
                ) {
                  //  if (ytsResponse.data.data.movies[0].year >= Constant.YEAR) {
                  if (
                    getTorrent(
                      ytsResponse.data.data.movies[0].torrents &&
                      ytsResponse.data.data.movies[0].torrents.length
                    )
                  ) {
                    if (
                      getTorrent(ytsResponse.data.data.movies[0].torrents)
                        .torrent1
                    ) {
                      create_movie.torrent_url_1 = getTorrent(
                        ytsResponse.data.data.movies[0].torrents
                      ).torrent1;
                      create_movie.file_size_1 = getTorrent(
                        ytsResponse.data.data.movies[0].torrents
                      ).torrent1.size;
                    }
                    if (
                      getTorrent(ytsResponse.data.data.movies[0].torrents)
                        .torrent2
                    ) {
                      create_movie.torrent_url_2 = getTorrent(
                        ytsResponse.data.data.movies[0].torrents
                      ).torrent2;
                      create_movie.file_size_2 = getTorrent(
                        ytsResponse.data.data.movies[0].torrents
                      ).torrent2.size;
                    }
                    if (
                      getTorrent(ytsResponse.data.data.movies[0].torrents)
                        .torrent3
                    ) {
                      create_movie.torrent_url_3 = getTorrent(
                        ytsResponse.data.data.movies[0].torrents
                      ).torrent3;
                      create_movie.file_size_3 = getTorrent(
                        ytsResponse.data.data.movies[0].torrents
                      ).torrent3.size;
                    }
                  }

                  create_movie.video_duration =
                    ytsResponse.data.data.movies[0].runtime;
                  create_movie.imdb_score =
                    ytsResponse.data.data.movies[0].rating;
                  create_movie_details.genre =
                    ytsResponse.data.data.movies[0].genres;

                  try {
                    let getMovie = await commonDataStore(
                      ytsResponse.data.data.movies[0].imdb_code,
                      create_movie,
                      create_movie_details
                    );
                  } catch (error) {
                    loggerData(
                      ytsResponse.data.data.movies[0].imdb_code,
                      error
                    );
                  }
                }
              }
            } catch (error) {
              loggerData("", error);
            }
          }
        }

      });
  } catch (error) {
    loggerData("", error);
  }
});

//change torrentbay to torrent.mx
router.get('/changeTorrentUrl', async (req, res) => {
  try {

    let getTorrent = await movie_n_series.find({ "torrent_url_1.url": /torrentbay.to/, "torrent_url_2.url": /torrentbay.to/, "torrent_url_3.url": /torrentbay.to/ }, { torrent_url_1: 1, torrent_url_2: 2, torrent_url_3: 3 })
    console.log(getTorrent)
    for (i = 0; i < getTorrent.length; i++) {
      let newurl1 = getTorrent[i].torrent_url_1.url.replace("torrentbay.to", "mx");
      let newurl2 = getTorrent[i].torrent_url_2.url.replace("torrentbay.to", "mx");
      let newurl3 = getTorrent[i].torrent_url_3.url.replace("torrentbay.to", "mx");
      let updated = await movie_n_series.findOneAndUpdate(
        { _id: getTorrent[i]._id },
        { $set: { "torrent_url_1.url": newurl1, "torrent_url_2.url": newurl2, "torrent_url_3.url": newurl3 } })
      console.log(i);
    }
    res.send('updated');
  }
  catch (error) {
    console.log(error)
    return res.status(400).json({ status: 400, success: false, message: "Data not found!" });
  }

})

//get tmdb and yts data for 2021 movies
router.get("/latest_movie_data", async function (req, res) {

  let YtsRes = await axios.get(
    `https://yts.mx/api/v2/list_movies.json?minimum_rating=6.0`
  );

  let pages = Math.floor(YtsRes.data.data.movie_count / YtsRes.data.data.limit);

  for (j = 1; j <= pages; j++) {
    try {
      let ytsResponse = await axios.get(
        `https://yts.mx/api/v2/list_movies.json?page=${j}&minimum_rating=6.0`
      );

      if (
        ytsResponse &&
        ytsResponse.status == 200 &&
        ytsResponse.data &&
        ytsResponse.data.data &&
        ytsResponse.data.data.movie_count &&
        ytsResponse.data.data.movie_count > 0
      ) {
        for (i = 0; i < 20; i++) {
          let exist_movie = await movie_n_series.findOne({
            imdb_id: ytsResponse.data.data.movies[i].imdb_code,
          });
          let create_movie = new movie_n_series({
            imdb_id: ytsResponse.data.data.movies[i].imdb_code,
            category: Constant.MOVIE,
          });
          let create_movie_details = new movie_n_series_details({
            movie_id: create_movie._id,
          });
          if (exist_movie == null) {
            if (ytsResponse.data.data.movies[i].year >= Constant.YEAR) {
              if (
                getTorrent(
                  ytsResponse.data.data.movies[i].torrents &&
                  ytsResponse.data.data.movies[i].torrents.length
                )
              ) {
                if (
                  getTorrent(ytsResponse.data.data.movies[i].torrents).torrent1
                ) {
                  create_movie.torrent_url_1 = getTorrent(
                    ytsResponse.data.data.movies[i].torrents
                  ).torrent1;
                  create_movie.file_size_1 = getTorrent(
                    ytsResponse.data.data.movies[i].torrents
                  ).torrent1.size;
                }
                if (
                  getTorrent(ytsResponse.data.data.movies[i].torrents).torrent2
                ) {
                  create_movie.torrent_url_2 = getTorrent(
                    ytsResponse.data.data.movies[i].torrents
                  ).torrent2;
                  create_movie.file_size_2 = getTorrent(
                    ytsResponse.data.data.movies[i].torrents
                  ).torrent2.size;
                }
                if (
                  getTorrent(ytsResponse.data.data.movies[i].torrents).torrent3
                ) {
                  create_movie.torrent_url_3 = getTorrent(
                    ytsResponse.data.data.movies[i].torrents
                  ).torrent3;
                  create_movie.file_size_3 = getTorrent(
                    ytsResponse.data.data.movies[i].torrents
                  ).torrent3.size;
                }
              }

              create_movie.video_duration =
                ytsResponse.data.data.movies[i].runtime;
              create_movie.imdb_score = ytsResponse.data.data.movies[i].rating;
              create_movie_details.genre =
                ytsResponse.data.data.movies[i].genres;
              try {
                let getMovie = await commonDataStore(
                  ytsResponse.data.data.movies[i].imdb_code,
                  create_movie,
                  create_movie_details
                );
              } catch (error) {
                loggerData(ytsResponse.data.data.movies[i].imdb_code, error);
              }
            }
          }
        }
      }
    } catch (error) {
      loggerData("", error);
    }
  }
});

//get torrent from movie_n_series
router.post("/get_torrent_url", async function (req, res) {
  var getTorrentUrl = new movie_n_series();
  let common = new Common();
  if (common.isEmpty(req.body["imdb_id"])) {
    return res.rest.success({ message: "Missing imdb_id" });
  } else {
    let imdbCode = req.body.imdb_id;
    getTorrentUrl.getAll(imdbCode, function (resp) {
      return res.json(resp); //success
    });
  }
});

//get daily cron data from YTS api
router.get('/testAPI', async (req, res) => {
  try {
    let ytsResponse = await axios.get(
      `https://yts.mx/api/v2/list_movies.json?minimum_rating=6.0&page=1&sort_by=date_added&order_by=desc&limit=50`
    );
    return res.status(200).json({ status: 200, success: true, message: 'Yts_Response', data: ytsResponse.data });
  }
  catch (error) {
    return res.status(400).json({ status: 400, success: false, message: error.message });
  }
})

/*
    create cron for get daily updated movies
    get movies from YTS api which has 6 minimum_ratings
    store YTS fields -video-duration,rating,genre
    call commonDataStore function for store tmdp api
*/
var job = new CronJob("0 0 * * *", async (req, res) => {
  //let yesterday = new Date();
  // yesterday.setDate(yesterday.getDate() - 1);

  // let date = yesterday.getDate();
  // let year = yesterday.getFullYear();
  // let month = yesterday.getMonth() + 1;

  // let yesterdayDate = `${year}-${month}-${date} 23:59:00`;
  // let timeStamp = new Date(yesterdayDate).getTime() / 1000;
  try {
    let ytsResponse = await axios.get(
      `https://yts.mx/api/v2/list_movies.json?minimum_rating=6.0&page=1&sort_by=date_added&order_by=desc&limit=50`
    );
    if (
      ytsResponse &&
      ytsResponse.status == 200 &&
      ytsResponse.data &&
      ytsResponse.data.data &&
      ytsResponse.data.data.movie_count &&
      ytsResponse.data.data.movie_count > 0 &&
      ytsResponse.data.data.movies
    ) {
      for (i = 0; i < ytsResponse.data.data.movies.length; i++) {
        //  if (ytsResponse.data.data.movies[i].date_uploaded_unix > timeStamp) {
        let exist_movie = await movie_n_series.findOne({
          imdb_id: ytsResponse.data.data.movies[i].imdb_code,
        });
        if (!exist_movie) {
          let create_movie = await new movie_n_series({
            imdb_id: ytsResponse.data.data.movies[i].imdb_code,
            category: Constant.MOVIE,
          });
          let create_movie_details = await new movie_n_series_details({
            movie_id: create_movie._id,
          });
          if (
            ytsResponse.data.data.movies[i].torrents &&
            ytsResponse.data.data.movies[i].torrents.length
          ) {
            let getData = getTorrent(ytsResponse.data.data.movies[i].torrents);
            if (
              getData.torrent1
            ) {
              create_movie.torrent_url_1 = getData.torrent1;
              create_movie.file_size_1 = getData.torrent1.size;
            }
            if (
              getData.torrent2
            ) {
              create_movie.torrent_url_2 = getData.torrent2;
              create_movie.file_size_2 = getData.torrent2.size;
            }
            if (
              getData.torrent3
            ) {
              create_movie.torrent_url_3 = getData.torrent3;
              create_movie.file_size_3 = getData.torrent3.size
            }
          }
          create_movie.video_duration =
            ytsResponse.data.data.movies[i].runtime;
          create_movie.imdb_score = ytsResponse.data.data.movies[i].rating;
          create_movie_details.genre =
            ytsResponse.data.data.movies[i].genres;

          try {
            let getMovie = await commonDataStore(
              ytsResponse.data.data.movies[i].imdb_code,
              create_movie,
              create_movie_details
            );
          } catch (error) {
            loggerData(ytsResponse.data.data.movies[i].imdb_code, error);
          }
        }
      }
    }
  } catch (error) {
    loggerData("", error);
  }
});
job.start();

//get torrent from YTS
let getTorrent = (torrentArray) => {
  let obj = {};
  if (torrentArray.length > 0) {
    let torrent_url_1 = torrentArray.find((ele) => {
      if (ele.quality == Constant.QUALITY_720P) {
        return ele;
      }
    });
    if (torrent_url_1) {
      obj.torrent1 = torrent_url_1;
    }

    let torrent_url_2 = torrentArray.find((ele) => {
      if (ele.quality == Constant.QUALITY_1080P) {
        return ele;
      }
    });
    if (torrent_url_2) {
      obj.torrent2 = torrent_url_2;
    }
    let torrent_url_3 = torrentArray.find((ele) => {
      if (ele.quality == Constant.QUALITY_2160P) {
        return ele;
      }
    });
    if (torrent_url_3) {
      obj.torrent3 = torrent_url_3;
    }
    return obj;

  }
};

//craete loggerfile to print error
let loggerData = async (code, error) => {
  let separatore =
    "=================================================================================================================================== \n";
  let data = JSON.stringify(error) + code + separatore;
  fs.appendFileSync("logger.log", data);
  console.log("error", error, code);
};

//create function for store title and overview in different languages
let title_overview = async (code) => {
  let obj = {};
  let original_title = [];
  let original_ovierview = [];
  for (index = 0; index < Constant.MULTIPLE_LANGUAGES.length; index++) {
    let tmdbTitleOverView = await axios.get(
      `https://api.themoviedb.org/3/movie/${code}?api_key=${Constant.API_KEY}&language=${Constant.MULTIPLE_LANGUAGES[index]}`
    );
    original_title.push({
      language: Constant.MULTIPLE_LANGUAGES[index],
      title: tmdbTitleOverView.data.title,
    });
    original_ovierview.push({
      language: Constant.MULTIPLE_LANGUAGES[index],
      overview: tmdbTitleOverView.data.overview,
    });
  }
  obj.title = original_title;
  obj.overview = original_ovierview;
  return obj;
};

//return rating date wise
let rating = async (ratingArray) => {
  let sorted_rating = "";
  if (ratingArray.length) {
    let US_rating = await ratingArray.filter((ele) => {
      if (ele.iso_3166_1 == "US") {
        return ele;
      }
    });
    if (US_rating.length) {
      sorted_rating = await US_rating[0].release_dates.sort((a, b) => {
        return new Date(b.release_date) - new Date(a.release_date);
      });
      if (sorted_rating.length) {
        sorted_rating = sorted_rating[0].certification;
      }
    }
  }
  return sorted_rating;
};

/*
  function for store tmdb data
  store title_display_name and discription
  call function get_countries_totalRatingVotes for store totalRatingVotes and countries
  store images -backdrops images,thumbnail and cover image
  store directors and cast
  call getRbgTorrent function to update torrent to magnet url
  save the data
*/
const commonDataStore = async (code, create_movie, create_movie_details) => {
  let tmdbTitleOverView = await title_overview(code);
  if (
    tmdbTitleOverView &&
    tmdbTitleOverView.title &&
    tmdbTitleOverView.overview
  ) {
    create_movie.title_display_name = tmdbTitleOverView.title;
    create_movie_details.discription = tmdbTitleOverView.overview;
  }
  let countries_n_votes = await get_countries_totalRatingVotes(code);
  if(countries_n_votes) {
    if (Number(countries_n_votes.totalRatingVotes) < 1000) {
      create_movie.is_active = 0;
    }
    create_movie.totalRatingVotes = countries_n_votes.totalRatingVotes  ? countries_n_votes.totalRatingVotes : "";
    create_movie.countries = countries_n_votes.imdbData &&  countries_n_votes.imdbData.countries ? countries_n_votes.imdbData.countries : "";
    
  }
  let tmdbResponse = await axios.get(
    `https://api.themoviedb.org/3/movie/${code}?api_key=${Constant.API_KEY}&language=en-US&include_image_language=null,en&append_to_response=videos,images,credits,release_dates`
  );

  if (tmdbResponse && tmdbResponse.status == 200 && tmdbResponse.data) {
    let rate = await rating(tmdbResponse.data.release_dates.results);
    create_movie.rating = rate;
    if (tmdbResponse.data.release_date) {
      let release_date = new Date(tmdbResponse.data.release_date);
      //get start year from release date
      create_movie.startyear = release_date.getFullYear();
      create_movie.releaseDate = tmdbResponse.data.release_date;
      if (release_date.getFullYear() < 1990) {
        create_movie.is_active = 0;
      }
    }
    else {
      create_movie.releaseDate = countries_n_votes.imdbData &&  countries_n_votes.imdbData.releaseDate ? countries_n_votes.imdbData.releaseDate : "";
    }
    if (tmdbResponse.data.images.posters.length > 0) {
      if (tmdbResponse.data.images.backdrops.length) {
        let bd = tmdbResponse.data.images.backdrops.splice(0, 12);
        let backdrops = bd.map((ele) => {
          return `${Constant.BACKDROP_IMAGE_URL}${ele.file_path}`;
        });

        create_movie.backdrop_images = backdrops;
      }
      let cover_image = tmdbResponse.data.images.posters[0].file_path;

      //create url for cover image
      create_movie.cover_image = `${Constant.COVER_IMAGE_URL}${cover_image}`;

      //create url for thumbnail image
      create_movie.thumbnail_image = `${Constant.THUMBNAIL_IMAGE_URL}${cover_image}`;
    }
    if (!create_movie.cover_image && !create_movie.thumbnail_image) {
      create_movie.is_active = 0;
    }
    let trailer_key = tmdbResponse.data.videos.results.filter((ele) => {
      if (ele.type == Constant.VIDEO_TYPE) {
        return ele;
      }
    });
    //create trailer urls from trailer key
    let trailer_url = trailer_key.map((ele) => {
      return `${Constant.TRAILER_URL}${ele.key}`;
    });
    create_movie.trailer_urls = trailer_url;

    if (tmdbResponse.data.credits.crew.length) {
      let directors = tmdbResponse.data.credits.crew.filter((ele) => {
        if (ele.job == Constant.DIRECTOR) {
          return ele.name;
        }
      });
      let directorsName = directors.map((ele) => ele.name);
      create_movie_details.director = directorsName;
    }
    if (tmdbResponse.data.credits.cast.length) {
      let castArry = [];
      for (
        let index = 0;
        index < tmdbResponse.data.credits.cast.length;
        index++
      ) {
        const element = tmdbResponse.data.credits.cast[index];
        let castObj = {
          person_id: element.id,
          name: element.name,
        };
        castArry.push(castObj);
        let exist_person = await person_details.countDocuments({
          person_id: element.id,
        });
        if (exist_person == 0) {
          let getPersonDetail = await axios.get(
            `https://api.themoviedb.org/3/person/${element.id}?api_key=${Constant.API_KEY}`
          );
          let person = {
            person_id: element.id,
            name: element.name,
            also_known_as: getPersonDetail.data.also_known_as,
            profile_path: element.profile_path
              ? `${Constant.PROFILE_IMAGE_URL}${element.profile_path}`
              : "",
          };
          let createperson = new person_details(person);
          await createperson.save();
        }
      }
      create_movie_details.cast = castArry;
    }
    create_movie.webseed_url_1 = "";
    create_movie.webseed_url_2 = "";
    create_movie.webseed_url_3 = "";
    create_movie.subtitle_link = [];
    create_movie.save(function (err, doc) {
      if (doc) {
        create_movie_details.save();
        console.log(create_movie._id);
      }
    });
  }
};
module.exports = router;
