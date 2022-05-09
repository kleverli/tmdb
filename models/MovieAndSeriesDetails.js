const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const MovieAndSeriesDetailsSchema = mongoose.Schema({
  movie_id: { type: Schema.Types.ObjectId, ref: "tv_movie" },
  genre: [{ type: String }],
  discription: [{ type: Object }],
  director: [{ type: String }],
  cast: [{ type: Object }],
},{  timestamps: true });

let Tv_Movie_Details = mongoose.model(
  "movie_n_series_details",
  MovieAndSeriesDetailsSchema
);

module.exports = Tv_Movie_Details;
