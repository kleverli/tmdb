/**
 * author: Martin SangDo
 Manage movies
 */
//========== CLASS
function AdminMovie() { }

//get list with pagination. page_index starts from 1
AdminMovie.prototype.get_pagination_list = function(page_index, category_id, keyword, status, min_speed, max_speed, source, has_subtitle, wasabi_url){
    var uri = ADMIN_API_URI.GET_MOVIE_LIST+'?page='+page_index+adminMovie.compose_uri_params();
    if (common.isset(status) && status != 'all'){
        $('#select_status').val(status.trim());
    }
    if (common.isset(source) && source != 'all'){
        $('#select_source').val(source.trim());
    }
    if (common.isset(wasabi_url) && wasabi_url != 'all'){
        $('#select_wasabi_url').val(wasabi_url.trim());
    }
    if (common.isset(has_subtitle) && has_subtitle != 'all'){
        $('#select_subtitle').val(has_subtitle.trim());
    }
    if (common.isset(max_speed) && max_speed != 'all'){
        $('#select_speed').val(max_speed.trim());
    }
    if (common.isset(keyword)){
        $('#txt_keyword').val(keyword.trim());
    }
    common.ajaxRawGet(uri, function(resp){
        if (common.isset(resp) && common.isset(resp.list) && resp.list.length > 0){
            //render to UI
            var $row, item;
            var list_ids = [];
            for (var i=0; i<resp.list.length; i++){
                item = resp.list[i];
                list_ids.push(item['_id']);
                $row = $('tr', $('#template_tbl')).clone(false);
                $('.link_data_title', $row).text(item['title']);
                if (item['link_type'] == 'webseed'){
                    $('.link_data_title', $row).addClass('g-color-green');
                }
                if (common.isset(item['trailer_url'])){
                    $('.has_trailer', $row).removeClass('hidden').attr('data-trailer-url', item['trailer_url']);
                }
                $('.data_description', $row).text(item['description']);
                $('.data_note', $row).val(item['note']);
                $('.data_thumbnail', $row).attr('src', common.replace_custom_img(item['thumbnail']));
                $('.data_cover', $row).attr('src', common.replace_custom_img(item['cover_url']));
                $('.data_org_url', $row).val(item['org_url']);
                if (item['share_date'] != null && item['share_date'] != ''){
                    $('.data_share_date', $row).text(item['share_date']);
                } else {
                    $('.data_share_date', $row).text(common.format_short_date(new Date(item['created_time']*1000)));
                }
                if (common.isset(item['speed'])){
                    $('.data_speed', $row).text(common.format_speed_2_string(item['speed']));
                }
                $('.chk_active', $row).prop('checked', Boolean(parseInt(item['is_active']) > 0));
                if (common.isset(item['play_links']) && item['play_links'].length > 0){
                    var final_link = item['play_links'][item['play_links'].length-1];
                    $('.magnet_link', $row).val(adminCommon.decrypt_magnet_link(final_link));
                }
                $row.attr('data-id', item['_id']);
                $row.attr('data-size', item['size']);
                if (item['thumb_pics'] != null && item['thumb_pics'].length > 0 && item['thumb_pics'][0] != ''){
                    $('.has_snapshot', $row).removeClass('hidden');
                }
                if (item['subtitle_link'] != null && item['subtitle_link'] != ''){
                    $('.has_subtitle', $row).removeClass('hidden');
                }
                adminMovie.fetch_categories(resp.categories, item['category_id'], $('.data_category', $row));
                $('#real_tbl').append($row);
            }
        }
        $('#total_movies').text(resp.total);
        if (resp.total <= CONST.DEFAULT_PAGE_LEN){
            var total_pages = 1;    //only 1 page
        } else {
            var total_pages = Math.ceil(resp.total / CONST.DEFAULT_PAGE_LEN);
        }
        $('#txt_total_pages').text(total_pages);
        $('#txt_current_paging').val(page_index);
        //fetch categories to dropdown in search area
        adminMovie.fetch_categories(resp.categories, category_id, $('#select_category'));
        //fetch categories to dropdown in detail popup
        adminMovie.fetch_categories(resp.categories, category_id, $('#popup_category'));
        adminMovie.preview_big_image();
    });
};
//preview big image
AdminMovie.prototype.preview_big_image = function() {
    $('.movie_thumb_list', $('#real_tbl')).unbind();
    $('.movie_thumb_list', $('#real_tbl')).hover(function(e){
        //hover in
        if (e != null && e.currentTarget != null &&
            $(e.currentTarget).attr('src') != null || $(e.currentTarget).attr('src') != ''){
            $('#img_preview').attr('src', common.replace_custom_img($(e.currentTarget).attr('src')));
            $('#div_big_img').removeClass('hidden');
        }
    }, function(){
            $('#div_big_img').addClass('hidden');
    });
    $('.movie_thumb_list_landscape', $('#real_tbl')).unbind();
    $('.movie_thumb_list_landscape', $('#real_tbl')).hover(function(e){
        //hover in
        if (e != null && e.currentTarget != null &&
            $(e.currentTarget).attr('src') != null || $(e.currentTarget).attr('src') != ''){
            $('#img_preview').attr('src', common.replace_custom_img($(e.currentTarget).attr('src')));
            $('#div_big_img').removeClass('hidden');
        }
    }, function(){
        $('#div_big_img').addClass('hidden');
    });
};
//
AdminMovie.prototype.save_current_row = function(btn_save){
    if (submitting){
        return;
    }
    var $row = $(btn_save).closest('tr');
    var pure_magnet_link = $('.magnet_link', $row).val().trim();
    if (common.isset(pure_magnet_link) && !pure_magnet_link.startsWith(ADMIN_CONSTANT_JS.MAGNET_LINK_PREFIX)){
        adminCommon.showToast('Invalid magnet link format!', true, 'error');
        return;
    }
    submitting = true;
    var params = {
        id: $row.attr('data-id'),
        description: $('.data_description', $row).val().trim(),
        note: $('.data_note', $row).val().trim(),
        org_url: $('.data_org_url', $row).val().trim(),
        data_category: $('.data_category', $row).val(),
        magnet_link: adminCommon.decrypt_magnet_link(pure_magnet_link)
    };
    adminCommon.showToast();
    common.ajaxPost(ADMIN_API_URI.SAVE_BASIC_MOVIE_DETAIL, params, function(resp){
        if (resp == 'OK'){
            //success
            adminCommon.updateToastAndClose(STR_MESS_FRONT.UPDATE_SUCCESS);
        } else {
            adminCommon.updateToastAndClose(STR_MESS_FRONT.SERVER_ERROR);
        }
        submitting = false;
    });
};
//call server to soft delete movie(s)
AdminMovie.prototype.toggleCheckboxActive = function(chk_active){
    if (submitting){
        return;
    }
    var $row = $(chk_active).closest('tr');
    var is_active = $('.chk_active', $row).is(':checked')?1:0;
    var uri = ADMIN_API_URI.DELETE_MOVIES;
    var id = $row.attr('data-id');
    submitting = true;
    common.ajaxPost(uri, {ids: JSON.stringify(id), is_active: is_active}, function(resp){
        if (common.isset(resp) && resp == CONST.OK_CODE){
            //do nothing
        } else {
            //no result or error
            adminCommon.updateToastAndClose(STR_MESS_FRONT.SERVER_ERROR);
        }
        submitting = false;
    });
};
//go to previous page
AdminMovie.prototype.go_previous_page = function(){
    var page_index = common.get_url_param('page');
    if (page_index == '' || isNaN(page_index) || parseInt(page_index)<=0){
        page_index = 1;
    }
    page_index = parseInt(page_index);
    if (page_index == 1){
        return; //being in first page
    }
    window.location.href = '/admin-movie/list?page=' + (page_index-1)+adminMovie.compose_uri_params();
};
//go to next page
AdminMovie.prototype.go_next_page = function(){
    var page_index = common.get_url_param('page');
    if (page_index == '' || isNaN(page_index) || parseInt(page_index)<=0){
        page_index = 1;
    }
    page_index = parseInt(page_index);
    if (page_index == parseInt($('#txt_total_pages').text())){
        return; //being in last page
    }
    window.location.href = '/admin-movie/list?page=' + (page_index+1)+adminMovie.compose_uri_params();
};
//called when press Search
AdminMovie.prototype.search = function(){
    var keyword = $('#txt_keyword').val().trim();
    var cat_id = $('#select_category').val();
    var speed = $('#select_speed').val();
    var status = $('#select_status').val();
    var source = $('#select_source').val();
    var has_subtitle = $('#select_subtitle').val();
    var wasabi_url = $('#select_wasabi_url').val();

    if (keyword.length < 3 && cat_id == 'all' && speed == 'all' && status == 'all' && source == 'all'){
        //nothing to search here
        common.redirect('/admin-movie/list');
    }
    var uri = '/admin-movie/list?page=1';
    if (common.isset(cat_id) && cat_id != 'all'){
        uri += '&cat_id='+cat_id;
    }
    if (common.isset(keyword)){
        uri += '&keyword='+keyword;
    }
    if (common.isset(status) && status != 'all'){
        uri += '&status='+status;
    }
    if (common.isset(speed) && speed != 'all'){
        uri += '&max_speed='+speed;
        if (speed == 300){
            uri += '&min_speed=0';
        } else if (speed == 700){
            uri += '&min_speed=300';
        } else if (speed == 1000){
            uri += '&min_speed=700';
        } else if (speed == 999999999){
            uri += '&min_speed=1000';
        }
    }
    if (common.isset(source) && source != 'all'){
        uri += '&source='+source;
    }
    if (common.isset(has_subtitle)){
        uri += '&has_subtitle='+has_subtitle;
    }
    if (common.isset(wasabi_url)){
        uri += '&wasabi_url='+wasabi_url;
    }
    common.redirect(uri);
};
//========== DETAIL
//get movie detail
AdminMovie.prototype.get_detail = function(){
    var movie_id = common.get_url_param('id').trim();
    if (movie_id == ''){
        //get active categories only
        common.ajaxRawGet(ADMIN_API_URI.GET_ACTIVE_CATEGORY_LIST, function(resp_cat){
            if (common.isset(resp_cat) && common.isset(resp_cat.categories)) {
                adminMovie.fetch_categories(resp_cat.categories, '', $('#select_category'));
            }
        });
        return;
    }
};
//create/update movie
AdminMovie.prototype.insert_detail = function(){
    if (submitting){
        return;
    }
    //check required fields
    var $container = $('#tbl_form');
    var params = {
        title : $('#txt_title', $container).val().trim(),
        description : $('#txt_description', $container).val().trim(),
        magnet_link : adminCommon.decrypt_magnet_link($('#txt_magnet_link', $container).val().trim()),
        thumbnail : $('#txt_thumbnail_url', $container).val().trim(),
        cover : $('#txt_cover_url', $container).val().trim(),
        category_id: $('#select_category', $container).val(),
        size : $('#txt_size', $container).val().trim(),
        note : $('#txt_note', $container).val().trim(),
        video_len : $('#txt_video_len', $container).val().trim(),
        share_date : $('#txt_share_date', $container).val().trim()
    };

    if (params['title'] == '' ||
        params['thumbnail'] == '' || params['cover'] == ''){
        adminCommon.showToast('Please input required items (*)', true, 'error');
        return;
    }
    //validate magnet link
    if (params['magnet_link'] != '' && !params['magnet_link'].startsWith(ADMIN_CONSTANT_JS.MAGNET_LINK_PREFIX)){
        adminCommon.showToast('Invalid magnet link format!', true, 'error');
        return;
    }
    //
    submitting = true;
    adminCommon.showToast();
    common.ajaxPost(ADMIN_API_URI.INSERT_MOVIE, params, function(resp){
        if (resp != null && resp['result'] == 'OK'){
            //success
            adminCommon.updateToastAndClose(STR_MESS_FRONT.CREATE_SUCCESS);
            //clear the form
            $('input[type="text"]', $container).val('');
            $('textarea', $container).val('');
        } else if (common.isset(resp.message)){
            adminCommon.updateToastAndClose(resp.message);
        } else {
            adminCommon.updateToastAndClose(STR_MESS_FRONT.SERVER_ERROR);
        }
        submitting = false;
    });
};
//
AdminMovie.prototype.fetch_categories = function(categories, focus_cat_id, $select) {
    //categories rows
    for (var i=0; i<categories.length; i++){
        if (categories[i].name != null){
            if (focus_cat_id == categories[i]['_id']){
                $select.append('<option value="'+categories[i]['_id']+'" selected="selected">'+categories[i]['name']+'</option>');
            } else {
                $select.append('<option value="'+categories[i]['_id']+'">'+categories[i]['name']+'</option>');
            }
        }
    }
};
//
AdminMovie.prototype.bulk_update_movies = function() {
    if (submitting){
        return;
    }
    //get all movie id(s) need to be deleted
    var $rows = $('.'+ADMIN_CONSTANT_JS.MARK_ROW_BG, $('#real_tbl'));
    if ($rows == null || $rows.length == 0){
        return; //nothing to update
    }
    // submitting = true;
    var params = [], $row;      //id
    for (var i=0; i<$rows.length; i++){
        $row = $($rows[i]);
        params.push({
            id: $row.attr('data-id'),
            description: $('.data_description', $row).val().trim(),
            org_url: $('.data_org_url', $row).val().trim(),
            data_category: $('.data_category', $row).val(),
            magnet_link: adminCommon.decrypt_magnet_link($('.magnet_link', $row).val().trim())
        });
    }
    // console.log(params);
    adminCommon.showToast();
    common.ajaxPost(ADMIN_API_URI.BULK_UPDATE_MOVIES, {params: JSON.stringify(params)}, function(resp){
        if (resp == 'OK'){
            //success
            adminCommon.updateToastAndClose(STR_MESS_FRONT.UPDATE_SUCCESS);
        } else {
            adminCommon.updateToastAndClose(STR_MESS_FRONT.SERVER_ERROR);
        }
        submitting = false;
    });
};
//show popup to edit movies, called when user clicks movie in UI
AdminMovie.prototype.open_detail_popup = function(btn_title) {
    if (submitting){
        return;
    }
    $('#div_backdrop').show();
    $('body').addClass('lock_scroll');
    //get detail from db & show detail
    var $row = $(btn_title).closest('tr');
    var movie_id = $row.attr('data-id');
    submitting = true;
    common.ajaxRawGet(ADMIN_API_URI.GET_MOVIE_DETAIL+movie_id, function(resp_detail){
        if (common.isset(resp_detail) && common.isset(resp_detail.data)) {
            adminMovie.fetch_movie_detail(resp_detail.data);
        }
        submitting = false;
        $('#div_movie_extra_detail').show();
    });
};
//close & do nothing
AdminMovie.prototype.close_detail_popup = function() {
    if (!$('#div_original_links').is(':hidden')) {
        $('#div_original_links').hide();
    } else if (!$('#div_movie_extra_detail').is(':hidden')) {
        $('#div_movie_extra_detail').hide();
        $('#div_backdrop').hide();
        $('body').removeClass('lock_scroll');
    }
    //close trailer
    setTimeout(function() {
        document.getElementById('trailer_video').pause();
    }, 1000);
    $('#div_trailer_player').hide();
};
//update detail in popup
AdminMovie.prototype.update_extra_detail = function() {
    if (submitting || !can_process_poup_action()){
        return;
    }
    var $form_container = $('#div_movie_extra_detail');
    var title = $('.txt_title', $form_container).val().trim();
    if (title == ''){
        adminCommon.showToast('Please input title', true, 'error');
        return;
    }
    var pure_magnet_link = $('.txt_magnet_default', $form_container).val().trim();
    if (common.isset(pure_magnet_link) && !pure_magnet_link.startsWith(ADMIN_CONSTANT_JS.MAGNET_LINK_PREFIX)){
        adminCommon.showToast('Invalid magnet link format!', true, 'error');
        return;
    }
    if ($('.txt_thumbnail_url', $form_container).val().trim().indexOf('http') != 0){
        adminCommon.showToast('Invalid Thumbnail url!', true, 'error');
        return;
    }
    if ($('.txt_cover_url', $form_container).val().trim().indexOf('http') != 0){
        adminCommon.showToast('Invalid Cover url!', true, 'error');
        return;
    }
    submitting = true;
    var new_snapshots = $('.txt_snapshots', $form_container).val().trim();
    var id = $form_container.attr('data-id');
    var params = {
        id: id,
        title: title,
        thumbnail: $('.txt_thumbnail_url', $form_container).val().trim(),
        cover_url: $('.txt_cover_url', $form_container).val().trim(),
        size: $('.txt_size', $form_container).val().trim(),
        video_len: $('.video_len', $form_container).val().trim(),
        category_id: $('#popup_category', $form_container).val(),
        // description: $('.txt_description', $form_container).val().trim(),
        note: $('.txt_note', $form_container).val().trim(),
        subtitle_link: $('.txt_subtitle_link', $form_container).val().trim(),
        new_link: adminCommon.decrypt_magnet_link(pure_magnet_link),
        snapshots: new_snapshots
    };
    adminCommon.showToast();
    common.ajaxPost(ADMIN_API_URI.SAVE_EXTRA_MOVIE_DETAIL, params, function(resp){
        if (resp == 'OK'){
            //success, update row in list
            var $row = $('tr[data-id="'+id+'"]', $('#real_tbl'));
            $('.link_data_title', $row).text(title);
            $('.data_thumbnail', $row).attr('src', common.replace_custom_img($('.txt_thumbnail_url', $form_container).val().trim()));
            $('.data_cover', $row).attr('src', common.replace_custom_img($('.txt_cover_url', $form_container).val().trim()));
            // $('.data_description', $row).text($('.txt_description', $form_container).val().trim());
            $('.data_note', $row).val($('.txt_note', $form_container).val().trim());
            $('.data_category', $row).val($('#popup_category', $form_container).val());
            $('.magnet_link', $row).val(pure_magnet_link);
            //update snapshots again
            if (new_snapshots != ''){
                var snapshots = new_snapshots.split(',');
                $('.popup_thumb_pic', $form_container).attr('src', common.replace_custom_img(snapshots[0]));
                $('.thumb_pics_list', $form_container).val(new_snapshots);
                $('.current_snapshot_index', $form_container).text(1);
                $('.snapshot_total', $form_container).text(snapshots.length);
            } else {
                $('.popup_thumb_pic', $form_container).attr('src', '');
                $('.thumb_pics_list', $form_container).val('');
                $('.current_snapshot_index', $form_container).text(0);
                $('.snapshot_total', $form_container).text(0);
            }
            //
            adminCommon.updateToastAndClose(STR_MESS_FRONT.UPDATE_SUCCESS);
        } else {
            adminCommon.updateToastAndClose(STR_MESS_FRONT.SERVER_ERROR);
        }
        submitting = false;
    });
};
//update speed of all active movies
AdminMovie.prototype.update_speed = function() {
    if (submitting){
        return;
    }
    adminCommon.showToast();
    submitting = true;
    common.ajaxRawGet(ADMIN_API_URI.GET_SPEED_DATA, function(resp){
        if (resp.message == 'OK'){
            //begin composing speed for each movie
            adminMovie.compose_speed(resp.data);
        } else {
            adminCommon.updateToastAndClose(STR_MESS_FRONT.SERVER_ERROR);
            submitting = false;
        }
    });
};
//PRIVATE FUNCTIONS
AdminMovie.prototype.compose_speed = function(speed_list) {
    // console.log('speed_list', speed_list);
    if (speed_list == null || speed_list.length == 0){
        submitting = false;
        adminCommon.updateToastAndClose(STR_MESS_FRONT.UPDATE_SUCCESS);
        return;
    }
    var len = speed_list.length;
    var speed_map = {};     //key: movie id, value: speed data list
    var movie_speed_item_data;
    for (var i=0; i<len; i++){
        movie_speed_item_data = speed_map[speed_list[i]['movie_id']];
        if (movie_speed_item_data == null){
            movie_speed_item_data = {
                min_len_seconds: 1000000,      //min length of download speed array
                list: [],
                speed: 0    //average speed
            };
        }
        if (movie_speed_item_data['min_len_seconds'] > speed_list[i]['downloadSpeed'].length){
            movie_speed_item_data['min_len_seconds'] = speed_list[i]['downloadSpeed'].length;
        }
        movie_speed_item_data['list'].push(speed_list[i]['downloadSpeed']);
        speed_map[speed_list[i]['movie_id']] = movie_speed_item_data;
    }
    var list_device_len, avg_speed_each_movie, sum_speed_each_movie_at_second, max_avg, avg, params = [];
    for (var movie_id in speed_map) {
        // console.log('list', speed_map[movie_id]['list']);
        list_device_len = speed_map[movie_id]['list'].length;
        avg_speed_each_movie = [];
        max_avg = 0;
        for (var second = 0; second<speed_map[movie_id]['min_len_seconds']; second++){
            sum_speed_each_movie_at_second = 0;
            for (var device_index=0; device_index<list_device_len; device_index++){ //for each device
                sum_speed_each_movie_at_second += speed_map[movie_id]['list'][device_index][second];
            }
            avg = Math.floor(sum_speed_each_movie_at_second / list_device_len);
            avg_speed_each_movie.push(avg);
            if (max_avg < avg){
                max_avg = avg;
            }
        }
        params.push({
            movie_id: movie_id, speed: max_avg
        });
    }

    common.ajaxPost(ADMIN_API_URI.UPDATE_SPEED, {data: JSON.stringify(params)}, function(resp){
        if (resp.message == 'OK'){
            adminCommon.updateToastAndClose(STR_MESS_FRONT.UPDATE_SUCCESS);
            //refresh current page
            setTimeout(function(){
                common.redirect(window.location.href);
            }, 2000);
        } else {
            adminCommon.updateToastAndClose(STR_MESS_FRONT.SERVER_ERROR);
        }
        submitting = false;
    });
};
//
AdminMovie.prototype.listen_key_press = function(e, key_code) {
    switch (key_code) {
        case 37:    //arrow left
            if( e.target.nodeName.toLowerCase() != "input" && e.target.nodeName.toLowerCase() != "textarea" ){
                adminMovie.load_prev_popup_title();
            }
            break;
        case 38:    //arrow up
            adminMovie.load_popup_snapshot(false);
            break;
        case 39:    //arrow right
            if( e.target.nodeName.toLowerCase() != "input" && e.target.nodeName.toLowerCase() != "textarea" ) {
                adminMovie.load_next_popup_title();
            }
            break;
        case 40:    //arrow down
            adminMovie.load_popup_snapshot(true);
            break;
        case 113:    //F2
            adminMovie.load_current_movie_link();
            break;
        case 119:    //F8
            adminMovie.toggle_popup_activation();
            break;
        case 27:    //Escape
            adminMovie.close_detail_popup();
            break;
        case 13:    //Enter
            if (!$('#div_movie_extra_detail').is(':hidden')) {
                adminMovie.update_extra_detail();
            }
            break;
    }
};
//compose uri param link, exclude page
AdminMovie.prototype.compose_uri_params = function() {
    var str = [];
    var category_id = common.get_url_param('cat_id');
    var keyword = common.get_url_param('keyword');
    var min_speed = common.get_url_param('min_speed');
    var max_speed = common.get_url_param('max_speed');
    var status = common.get_url_param('status');
    var source = common.get_url_param('source');
    var has_subtitle = common.get_url_param('has_subtitle');
    var wasabi_url = common.get_url_param('wasabi_url');
    if (common.isset(category_id) && category_id != 'all'){
        str.push('cat_id='+category_id.trim());
    }
    if (common.isset(status) && status != 'all'){
        str.push('status='+status.trim());
    }
    if (common.isset(has_subtitle) && has_subtitle != 'all'){
        str.push('has_subtitle='+has_subtitle.trim());
    }
    if (common.isset(min_speed) && min_speed != 'all'){
        str.push('min_speed='+min_speed.trim());
    }
    if (common.isset(max_speed) && max_speed != 'all'){
        str.push('max_speed='+max_speed.trim());
    }
    if (common.isset(keyword)){
        str.push('keyword='+keyword.trim());
    }
    if (common.isset(source)){
        str.push('source='+source.trim());
    }
    if (common.isset(wasabi_url)){
        str.push('wasabi_url='+wasabi_url.trim());
    }
    if (str.length == 0){
        return '';
    }
    return '&'+str.join('&');
};
//render movie detail to popup after loading from db
AdminMovie.prototype.fetch_movie_detail = function(detail) {
    if (detail == null){
        return;
    }
    var $form_container = $('#div_movie_extra_detail');
    $form_container.attr('data-id', detail['_id']);  //movie id
    //
    $('.txt_title', $form_container).val(detail['title']);
    $('.txt_thumbnail_url', $form_container).val(detail['thumbnail']);
    $('.txt_cover_url', $form_container).val(detail['cover_url']);
    $('.txt_size', $form_container).val(detail['size']);
    $('.txt_description', $form_container).val(detail['description']);
    $('.txt_note', $form_container).val(detail['note']);
    $('.video_len', $form_container).val(detail['video_len']);
    if (detail['share_date'] != null){
        $('.data_share_date', $form_container).text(detail['share_date']);
    } else {
        $('.data_share_date', $form_container).text(common.format_short_date(new Date(detail['created_time']*1000)));
    }
    $('.txt_subtitle_link', $form_container).val(detail['subtitle_link']);
    $('#subtitle_file', $form_container).attr('data-movie-id', detail['_id']);
    if (common.isset(detail['play_links']) && detail['play_links'].length > 0){
        var final_link = detail['play_links'][detail['play_links'].length-1];
        $('.txt_magnet_default', $form_container).val(adminCommon.decrypt_magnet_link(final_link));
    } else {
        //clear
        $('.txt_magnet_default', $form_container).val('');
    }
    $('#popup_category', $form_container).val(detail['category_id']);
    $('.popup_cover', $form_container).attr('src', common.replace_custom_img(detail['cover_url']));
    if (common.isset(detail['thumb_pics']) && detail['thumb_pics'].length > 0){
        $('.popup_thumb_pic', $form_container).attr('src', common.replace_custom_img(detail['thumb_pics'][0]));
        $('.thumb_pics_list', $form_container).val(detail['thumb_pics'].join(','));
        $('.current_snapshot_index', $form_container).text(1);
        $('.snapshot_total', $form_container).text(detail['thumb_pics'].length);
        $('.txt_snapshots', $form_container).text(detail['thumb_pics'].join(','));
    } else {
        //clear
        $('.popup_thumb_pic', $form_container).attr('src', '');
        $('.thumb_pics_list', $form_container).val('');
        $('.current_snapshot_index', $form_container).text(0);
        $('.snapshot_total', $form_container).text(0);
        $('.txt_snapshots', $form_container).text('');
    }
    $('.poup_loading', $form_container).hide();
    $('.poup_loading', $form_container).hide();
    //
    fetch_original_links(detail['original_links']);
    //change bg of popup
    toggle_popup_bg(detail['is_active']);
};
//load next snapshot in detail popup
AdminMovie.prototype.load_popup_snapshot = function(is_load_next) {
    if (!can_process_poup_action()){
        return;
    }
    var $form_container = $('#div_movie_extra_detail');
    var total_snapshot = parseInt($('.snapshot_total', $form_container).text());
    var current_snapshot_index = parseInt($('.current_snapshot_index', $form_container).text());
    if (isNaN(total_snapshot) || total_snapshot == 0){
        return;
    }
    var list = $('.thumb_pics_list', $form_container).val();
    list = list.split(',');
    if (is_load_next){
        //load next
        if (current_snapshot_index == total_snapshot){
            //reset order
            current_snapshot_index = 1;
        } else {
            current_snapshot_index++;
        }
    } else {
        //load previous
        if (current_snapshot_index == 1){
            //reset order
            current_snapshot_index = total_snapshot;
        } else {
            current_snapshot_index--;
        }
    }
    $('.popup_thumb_pic', $form_container).attr('src', common.replace_custom_img(list[current_snapshot_index-1]));
    $('.current_snapshot_index', $form_container).text(current_snapshot_index);
};
//
AdminMovie.prototype.load_current_movie_link = function(is_load_next) {
    if (!can_process_poup_action()) {
        return;
    }
    var $form_container = $('#div_movie_extra_detail');
    var link = $('.txt_magnet_default', $form_container).val().trim();
    if (link == ''){
        return;
    }
    window.open(link);
};
//activate / deactive current movie
AdminMovie.prototype.toggle_popup_activation = function() {
    if (submitting){
        return;
    }
    var $form_container = $('#div_movie_extra_detail');
    var is_active = $form_container.hasClass('gray_bg')?1:0;    //new value
    var uri = ADMIN_API_URI.DELETE_MOVIES;
    var id = $form_container.attr('data-id');   //movie id
    submitting = true;
    common.ajaxPost(uri, {ids: JSON.stringify(id), is_active: is_active}, function(resp){
        if (common.isset(resp) && resp == CONST.OK_CODE){
            //success
            toggle_popup_bg(is_active);
            //update in list, if any
            $('.chk_active', $('tr[data-id="'+id+'"]', $('#real_tbl'))).prop('checked', Boolean(is_active > 0));
        } else {
            //no result or error
        }
        submitting = false;
    });
};
//
AdminMovie.prototype.load_prev_popup_title = function() {
    if (!can_process_poup_action()) {
        return;
    }
    var $form_container = $('#div_movie_extra_detail');
    var uri = ADMIN_API_URI.GET_NAV_MOVIE_DETAIL;
    if (window.location.search == ''){
        uri += '?navigation=next';
    } else {
        uri += window.location.search + '&navigation=previous';
    }
    uri += '&current_movie_id=' + $form_container.attr('data-id');   //current movie id
    submitting = true;
    common.ajaxRawGet(uri, function(resp){
        adminMovie.fetch_movie_detail(resp.data);
        submitting = false;
    });
};
//
AdminMovie.prototype.load_next_popup_title = function() {
    if (!can_process_poup_action()) {
        return;
    }
    var $form_container = $('#div_movie_extra_detail');
    var uri = ADMIN_API_URI.GET_NAV_MOVIE_DETAIL;
    if (window.location.search == ''){
        uri += '?navigation=next';
    } else {
        uri += window.location.search + '&navigation=next';
    }
    uri += '&current_movie_id=' + $form_container.attr('data-id');   //current movie id
    submitting = true;
    common.ajaxRawGet(uri, function(resp){
        adminMovie.fetch_movie_detail(resp.data);
        submitting = false;
    });
};
//show another link of this movie
AdminMovie.prototype.load_original_links = function() {
    if (!can_process_poup_action()) {
        return;
    }
    //disable current link
    var current_link = $('.txt_magnet_default', $('#div_movie_extra_detail')).val().trim();
    disable_row_link(current_link);
    //
    $('#div_original_links').show();
};
//
AdminMovie.prototype.replace_movie_link = function(btn_select) {
    var $tr = $(btn_select).closest('tr');
    var row_link = $('.link_title', $tr).attr('href');
    disable_row_link(row_link);
    adminMovie.close_detail_popup();    //close link popup
    $('.txt_magnet_default', $('#div_movie_extra_detail')).val(row_link);
    $('.txt_size', $('#div_movie_extra_detail')).val($('.size', $tr).text());
    adminMovie.update_extra_detail();   //auto save
};
//when user chose a file
//https://devcenter.heroku.com/articles/s3-upload-node
AdminMovie.prototype.on_selected_subtitle = function(obj) {
    const files = document.getElementById('subtitle_file').files;
    const file = files[0];
    if(file == null){
        return;
    }
    getSignedRequest(file, $(obj).attr('data-movie-id'));
};
//
AdminMovie.prototype.show_trailer_popup = function(icon){
    var trailer_url = $(icon).attr('data-trailer-url');
    $('source', $('#div_trailer_player')).attr('src', trailer_url);
    setTimeout(function() {
        document.getElementById('trailer_video').load();
        document.getElementById('trailer_video').play();
    }, 1000);
    $('#div_trailer_player').show();
};
//when select files to upload
AdminMovie.prototype.on_selected_subtitles = function(){
    if (submitting){
        return;
    }
    const files = document.getElementById('subtitle_files').files;
    if(files == null || files.length == 0){
        return;
    }
    submitting = true;
    var file_num = files.length;
    var $tbl = $('#file_list');
    $('tr', $tbl).remove();
    var titles = [];
    for (var i=0; i<file_num; i++){
        titles.push(files[i]['name'].replace('.srt', ''));
        var $tr = $('<tr></tr>').attr('data-filename', files[i]['name']);
        $tr.append($('<td></td>').text(files[i]['name']));
        $tr.append($('<td class="upload_status">Processing</td>'));
        $tbl.append($tr);
        getSignedRequest(files[i]); //upload directly
    }
    submitting = false;
};
//==========
function getSignedRequest(file, movie_id){
    common.ajaxPost(ADMIN_API_URI.SIGN_S3, {
        movie_id: movie_id,
        file_name: file.name,
        file_type: file.type
        }, function(resp){
            if (common.isset(resp) && common.isset(resp.signedRequest) && resp.message != 'NOT_FOUND'){
                //success
                uploadSubtitleFile(resp.movie_id, file, resp.signedRequest, resp.url);
            } else {
                //no result or error
                console.log('Could not get signed URL.');
                $('td.upload_status', $('tr[data-filename="'+file.name+'"]', $('#file_list'))).text('NOT_FOUND');
            }
    });
}
//
function uploadSubtitleFile(movie_id, file, signedRequest, url){
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedRequest);
    xhr.onreadystatechange = () => {
        if(xhr.readyState === 4){
            if(xhr.status === 200){
                $('.txt_subtitle_link', $('#div_movie_extra_detail')).val(file.name);
                // adminMovie.update_extra_detail();
                //save back to db
                common.ajaxPost(ADMIN_API_URI.SAVE_SUBTITLE, {id: movie_id, subtitle_link: file.name}, function(resp){
                    if (resp == 'OK'){
                        $('td.upload_status', $('tr[data-filename="'+file.name+'"]', $('#file_list'))).text('----- Uploaded -----');
                    } else {
                        $('td.upload_status', $('tr[data-filename="'+file.name+'"]', $('#file_list'))).text('Failed to save info to db');
                    }
                });
            } else {
                console.log('Could not upload file.', xhr);
                $('td.upload_status', $('tr[data-filename="'+file.name+'"]', $('#file_list'))).text('Failed to upload');
            }
        }
    };
    xhr.send(file);
}
//
function disable_row_link(current_link){
    var $div_original_links = $('#div_original_links');
    var $rows = $('tr', $div_original_links);
    var row_link;
    for (var i=0; i<$rows.length; i++){
        row_link = $('.link_title', $rows[i]).attr('href');
        if (row_link == current_link){
            $('.btn_select', $rows[i]).hide();
        } else {
            $('.btn_select', $rows[i]).show();
        }
    }
}
//
function fetch_original_links(links){
    if (links == null || links.length == 0){
        $('.btn_select_link_default', $('#div_movie_extra_detail')).hide();
        return;
    }
    $('tr', $('#div_original_links')).remove();
    var len = links.length;
    var $tmpl_row;
    for (var i=0; i<len; i++){
        $tmpl_row = $('tr', $('#tbl_link_tmpl')).clone(false);
        $('.link_title', $tmpl_row).text(links[i]['title']);
        $('.link_title', $tmpl_row).attr('href', links[i]['link']); //no encryption
        $('.size', $tmpl_row).text(links[i]['size']);
        $('.share_date', $tmpl_row).text(links[i]['share_date']);
        $('table', $('#div_original_links')).append($tmpl_row);
    }
    $('.btn_select_link_default', $('#div_movie_extra_detail')).show();
}
//
function can_process_poup_action(){
    if ($('#div_movie_extra_detail').is(':hidden') || !$('#div_original_links').is(':hidden')){
        //popup is hidden
        return false;
    }
    return true;
}
//
function toggle_popup_bg(is_active){
    if (is_active || is_active > 0){
        $('#div_movie_extra_detail').removeClass('gray_bg');
    } else {
        $('#div_movie_extra_detail').addClass('gray_bg');
    }
}
//==========
var adminMovie = new AdminMovie();		//global object
