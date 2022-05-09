/*
    API uri of Admin functions
 */
var ADMIN_CONTROLLER = '/admin-control/';
var ADMIN_MOVIE_CONTROLLER_NAME = '/admin-movie/';
var ADMIN_CATEGORY_CONTROLLER_NAME = '/admin-category/';
var ADMIN_SITE_SETTING_CONTROLLER_NAME = '/admin-site-setting/';
var ADMIN_ACTRESS_CONTROLLER_NAME = '/admin-actress/';

 var ADMIN_API_URI = {
     //login
     READ_NEW_CAPTCHA: ADMIN_CONTROLLER+ 'read_new_captcha',
     LOGIN: ADMIN_CONTROLLER+ 'check_login',
     LOGOUT: ADMIN_CONTROLLER+ 'logout',
     CHANGE_ADMIN_PASSWORD: ADMIN_CONTROLLER + 'change_password_admin',
     //movie list
     MOVIE_LIST: ADMIN_MOVIE_CONTROLLER_NAME+'list',    //page
     GET_MOVIE_LIST: ADMIN_MOVIE_CONTROLLER_NAME + 'paging-list',
     GET_MOVIE_DETAIL: ADMIN_MOVIE_CONTROLLER_NAME + 'movie-detail?id=',
     SAVE_BASIC_MOVIE_DETAIL: ADMIN_MOVIE_CONTROLLER_NAME + 'save-basic-detail',
     SAVE_EXTRA_MOVIE_DETAIL: ADMIN_MOVIE_CONTROLLER_NAME + 'save-extra-detail',
     DELETE_MOVIES: ADMIN_MOVIE_CONTROLLER_NAME + 'delete-movies',
     INSERT_MOVIE: ADMIN_MOVIE_CONTROLLER_NAME + 'insert-movie',
     BULK_UPDATE_MOVIES: ADMIN_MOVIE_CONTROLLER_NAME + 'bulk-update',
     GET_SPEED_DATA: ADMIN_MOVIE_CONTROLLER_NAME + 'speed-data',
     UPDATE_SPEED: ADMIN_MOVIE_CONTROLLER_NAME + 'update-speed',
     SIGN_S3: ADMIN_MOVIE_CONTROLLER_NAME + 'sign-s3',
     GET_NAV_MOVIE_DETAIL: ADMIN_MOVIE_CONTROLLER_NAME + 'single-movie-navigation',
     SAVE_SUBTITLE: ADMIN_MOVIE_CONTROLLER_NAME + 'save-subtitle',
     //category
     GET_ACTIVE_CATEGORY_LIST: ADMIN_CATEGORY_CONTROLLER_NAME + 'data-list',    //get active movies only
     SAVE_CATEGORY_DETAIL: ADMIN_CATEGORY_CONTROLLER_NAME + 'save-detail',
     //site settings
     SAVE_SITE_SETTING: ADMIN_SITE_SETTING_CONTROLLER_NAME + 'save-detail',
     //actress
     GET_ACTRESS_LIST: ADMIN_ACTRESS_CONTROLLER_NAME + 'paging-list',
     TOGGLE_ACTIVE_MOVIE: ADMIN_ACTRESS_CONTROLLER_NAME + 'toggle-active-movie',
     SAVE_ACTRESS_DETAIL: ADMIN_ACTRESS_CONTROLLER_NAME + 'save-detail',

 };
