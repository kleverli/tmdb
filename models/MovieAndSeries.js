const mongoose = require("mongoose");
var Constant = require("../common/constant.js");

const MovieAndSeriesSchema = mongoose.Schema(
  {
    imdb_id: { type: String, index: true },
    parent_id: { type: String },
    season_number: { type: Number },
    episode_number: { type: Number },
    torrent_url_1: { type: Object },
    torrent_url_2: { type: Object },
    torrent_megnet_url:{type:Object},
    torrent_url_3: { type: Object },
    webseed_url_1: { type: String },
    webseed_url_2: { type: String },
    webseed_url_3: { type: String },
    file_size_1: { type: String },
    file_size_2: { type: String },
    file_size_3: { type: String },
    video_duration: { type: Number },
    imdb_score: { type: Number },
    category: { type: String, enum: ["movie", "tvseries"] },
    title_display_name: [{ type: Object }],
    rating: { type: String },
    startyear: { type: Number },
    releaseDate :{type: String},
    endyear: { type: Number },
    thumbnail_image: { type: String },
    cover_image: { type: String },
    backdrop_images: [{ type: String }],
    trailer_urls: [{ type: String }],
    is_active:{type:Number,enum:[0,1],default:1},
    note:{type:String},
    old_torrent_url_2:{type:Object},
    new_megnet_url:{type:Object},
    subtitle_link:[{language:{type:String},file_link:{type:String}}],
    totalRatingVotes:{type:String},
    countries:{type:String},
  },
  { timestamps: true }
);



let Tv_Movie = mongoose.model("movie_n_series", MovieAndSeriesSchema);

Tv_Movie.prototype.getAll = function(imdb_id,resp_func){
  Tv_Movie.findOne({imdb_id:imdb_id}).exec(function(err, res) {
      if (err) {
          var resp = {
              result : Constant.FAILED_CODE,
              message : Constant.SERVER_ERR,
              name: err.name,
              kind: err.kind
          };
         
      } else if(res && res.torrent_url_1){
          var resp = {
              result : Constant.OK_CODE,
              data : res.torrent_url_1
          };
         
      }
      else
      {
        var resp = {
          result : Constant.FAILED_CODE,
          message : Constant.SERVER_ERR,
          // name: err.name,
          // kind: err.kind
      };
      }
      resp_func(resp)
  });
};

module.exports = Tv_Movie;
