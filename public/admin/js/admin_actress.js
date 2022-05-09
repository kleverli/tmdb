/**
 * Process functions about actresses
 * author: Martin SangDo
 */
//========== CLASS
function AdminActress() { }

//get list with pagination. page_index starts from 1
AdminActress.prototype.get_pagination_list = function(page_index, category_id, keyword, status){
    var uri = ADMIN_API_URI.GET_ACTRESS_LIST+'?page='+page_index+adminActress.compose_uri_params();
    if (common.isset(status) && status != 'all'){
        $('#select_status').val(status.trim());
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
                $row = $('tr', $('#tbl_template')).clone(false);
                $('.jp', $row).val(item['names']['jp']);
                $('.kr', $row).val(item['names']['kr']);
                $('.tw', $row).val(item['names']['tw']);
                $('.en', $row).val(item['names']['en']);
                $('.img_actress', $row).attr('src', item['avatar']);
                $('a', $row).attr('href', item['url']);
                $('.category', $row).text(item['category_name']);
                $('.chk_active', $row).prop('checked', Boolean(parseInt(item['is_active']) > 0));
                $row.attr('data-id', item['_id']);
                $('#real_tbl').append($row);
            }
        }
        $('#total_actresses').text(resp.total);
        if (resp.total <= CONST.DEFAULT_PAGE_LEN){
            var total_pages = 1;    //only 1 page
        } else {
            var total_pages = Math.ceil(resp.total / CONST.DEFAULT_PAGE_LEN);
        }
        $('#txt_total_pages').text(total_pages);
        $('#txt_current_paging').val(page_index);
        //fetch categories to dropdown in search area
        adminActress.fetch_categories(resp.categories, category_id, $('#select_category'));
    });
};
//
AdminActress.prototype.save_current_row = function(btn_save){
    if (submitting){
        return;
    }
    var $row = $(btn_save).closest('tr');
    submitting = true;
    var params = {
        id: $row.attr('data-id'),
        name_jp: $('.jp', $row).val().trim(),
        name_kr: $('.kr', $row).val().trim(),
        name_tw: $('.tw', $row).val().trim(),
        name_en: $('.en', $row).val().trim()
    };
    adminCommon.showToast();
    common.ajaxPost(ADMIN_API_URI.SAVE_ACTRESS_DETAIL, params, function(resp){
        if (resp == 'OK'){
            //success
            adminCommon.updateToastAndClose(STR_MESS_FRONT.UPDATE_SUCCESS);
        } else {
            adminCommon.updateToastAndClose(STR_MESS_FRONT.SERVER_ERROR);
        }
        submitting = false;
    });
};
//called when press Search
AdminActress.prototype.search = function(){
    if (submitting){
        return;
    }
    var keyword = $('#txt_keyword').val().trim();
    var cat_id = $('#select_category').val();
    var status = $('#select_status').val();

    if (keyword.length < 3 && cat_id == 'all' && status == 'all'){
        //nothing to search here
        common.redirect('/admin-actress/list');
    }
    var uri = '/admin-actress/list?page=1';
    if (common.isset(cat_id) && cat_id != 'all'){
        uri += '&cat_id='+cat_id;
    }
    if (common.isset(keyword)){
        uri += '&keyword='+keyword;
    }
    if (common.isset(status) && status != 'all'){
        uri += '&status='+status;
    }
    common.redirect(uri);
};
//go to previous page
AdminActress.prototype.go_previous_page = function(){
    var page_index = common.get_url_param('page');
    if (page_index == '' || isNaN(page_index) || parseInt(page_index)<=0){
        page_index = 1;
    }
    page_index = parseInt(page_index);
    if (page_index == 1){
        return; //being in first page
    }
    window.location.href = '/admin-actress/list?page=' + (page_index-1)+adminActress.compose_uri_params();
};
//go to next page
AdminActress.prototype.go_next_page = function(){
    var page_index = common.get_url_param('page');
    if (page_index == '' || isNaN(page_index) || parseInt(page_index)<=0){
        page_index = 1;
    }
    page_index = parseInt(page_index);
    if (page_index == parseInt($('#txt_total_pages').text())){
        return; //being in last page
    }
    window.location.href = '/admin-actress/list?page=' + (page_index+1)+adminActress.compose_uri_params();
};
//
AdminActress.prototype.fetch_categories = function(categories, focus_cat_id, $select) {
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
//call server to soft delete actress(es)
AdminActress.prototype.toggleCheckboxActive = function(chk_active){
    if (submitting){
        return;
    }
    var $row = $(chk_active).closest('tr');
    var is_active = $('.chk_active', $row).is(':checked')?1:0;
    var uri = ADMIN_API_URI.TOGGLE_ACTIVE_MOVIE;
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
//compose uri param link, exclude page
AdminActress.prototype.compose_uri_params = function() {
    var str = [];
    var category_id = common.get_url_param('cat_id');
    var keyword = common.get_url_param('keyword');
    var status = common.get_url_param('status');

    if (common.isset(category_id) && category_id != 'all'){
        str.push('cat_id='+category_id.trim());
    }
    if (common.isset(status) && status != 'all'){
        str.push('status='+status.trim());
    }
    if (common.isset(keyword)){
        str.push('keyword='+keyword.trim());
    }
    if (str.length == 0){
        return '';
    }
    return '&'+str.join('&');
};
//
AdminActress.prototype.show_default_avatar = function(obj){
    $(obj).attr('onerror', "adminActress.show_default_avatar_2(this);");
    $(obj).attr('src', $(obj).attr('src').replace('.jpg', '.jpeg'));
};
//
AdminActress.prototype.show_default_avatar_2 = function(obj){
    $(obj).attr('onerror', '');
    $(obj).attr('src', '/img/default_actress.jpeg');
};
//
var adminActress = new AdminActress();		//global object
