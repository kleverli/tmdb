/**
 * Process common functions of Admin, used in every Admin pages
 * author: Martin SangDo
 */
//========== CLASS
function AdminCommon() { }

//logout
AdminCommon.prototype.logout = function(){
    common.ajaxPost(ADMIN_API_URI.LOGOUT, {}, function(resp){
        //correct authentication
        common.redirect(ADMIN_CONTROLLER+'login');
    }, function(err){
        //show alert
        alert('Something wrong when logout, try it later');
    });
};
//publish/unpublish record, used in some list
AdminCommon.prototype.toggle_publish = function(ico, id, api_uri){
    if (submitting){
        return;
    }
    var $ico = $(ico);
    var params = {
        id: id
    };
    if ($('.ico_publish', $ico).hasClass('icon_active')){
        //being publishing
        params['status'] = 0;       //unpublish it
    } else {
        //being unpublishing
        params['status'] = 1;       //publish it
    }
    submitting = true;
    common.ajaxPost(api_uri, params, function(resp){
        submitting = false;
        $('.ico_publish', $ico).toggleClass('icon_active');
    }, function(err){
        submitting = false;
    });
};
//move index of row up/down by 1 unit
AdminCommon.prototype.move_row_step = function(ico, step_unit, api_uri) {
    if (submitting){
        return;
    }
    var $tbl_container = $('#tbl_container');
    $current_row = $(ico).closest('tr');
    var old_index = parseInt($current_row.attr('data-index'));  //index of current row
    //get index & id of closest row
    if (step_unit > 0){
        //move row down to bottom
        var $swap_row = $current_row.next();
    } else {
        //move row up to top
        var $swap_row = $current_row.prev();
    }
    //swap index
    var params = {
        id: parseInt($current_row.attr('data-id')),
        new_index: parseInt($swap_row.attr('data-index')),
        swap_id: parseInt($swap_row.attr('data-id')),
        swap_index: old_index   //other row will replaced by this index
    };
    submitting = true;
    common.ajaxPost(api_uri, params, function(resp){
        //update index of 2 rows
        $current_row.attr('data-index', $swap_row.attr('data-index'));
        $swap_row.attr('data-index', old_index);
        if (step_unit > 0){
            //move row down to bottom
            $current_row.insertAfter($swap_row);
            if ($current_row.next().length == 0){
                //there is no more row below, hide btn Down
                $('.ico_down', $current_row).addClass('hidden');
            }
            $('.ico_up', $current_row).removeClass('hidden');
            //
            if ($swap_row.prev().length == 0){
                //there is no more row above, hide btn Up
                $('.ico_up', $swap_row).addClass('hidden');
            }
            $('.ico_down', $swap_row).removeClass('hidden');
        } else {
            //move row up to top
            $current_row.insertBefore($swap_row);
            if ($current_row.prev().length == 0){
                //there is no more row above, hide btn Up
                $('.ico_up', $current_row).addClass('hidden');
            }
            $('.ico_down', $current_row).removeClass('hidden');
            //
            if ($swap_row.next().length == 0){
                //there is no more row below, hide btn Down
                $('.ico_down', $swap_row).addClass('hidden');
            }
            $('.ico_up', $swap_row).removeClass('hidden');
        }
        submitting = false;
    }, function(err){
        submitting = false;
    });
};
//get no. of unread messages/contact & show it in top bar
AdminCommon.prototype.get_unread_message = function() {
    common.ajaxPost(ADMIN_API_URI.GET_UNREAD_MESS_NUM, {}, function(resp){
        if (resp.num > 0){
            $(ADMIN_CONST.BADGE_MESS_NUM).removeClass('hidden').text(resp.num);
        }
    }, function(err){
    });
};
//encrypt/decrypt magnet link from db
AdminCommon.prototype.decrypt_magnet_link = function(encrypted_magnet_link) {
    var len = encrypted_magnet_link.length;
    if (len < ADMIN_CONSTANT_JS.MAGNET_ENCRYPT_LEN){
        return encrypted_magnet_link;       //invalid link
    }
    //cut magnet link
    var encrypted_str = encrypted_magnet_link.substr(len - ADMIN_CONSTANT_JS.MAGNET_ENCRYPT_LEN, len);
    //revert
    var reverted_str = encrypted_str.split("").reverse().join("");
    //add back
    var part_org_str = encrypted_magnet_link.substr(0, len - ADMIN_CONSTANT_JS.MAGNET_ENCRYPT_LEN);
    return part_org_str + reverted_str;
};
//
AdminCommon.prototype.showToast = function(default_text, need_auto_close, type){
    if (default_text == null || default_text == ''){
        default_text = "Processing ...";
    }
    if (type == null || type == ''){
        type = "success";   //default
    }
    newNoty = new Noty({
        "type": type,
        "layout": "topCenter",
        "timeout": false,
        "animation": {
            "open": "animated fadeIn",
            "close": "animated fadeOut"
        },
        "closeWith": [
            "click"//, "button"
        ],
        "text": "<div id='toast_body_text'>"+default_text+"</div>",
        "theme": "unify--v1"
    }).show();
    if (need_auto_close){
        setTimeout(function(){
            newNoty.close();
        }, 2000);
    }
};
AdminCommon.prototype.closeToast = function() {
    if (newNoty == null){
        return;
    }
    newNoty.close();
};
//toast must be showing
AdminCommon.prototype.updateToastAndClose = function(new_text) {
    if (newNoty == null || new_text == ''){
        return;
    }
    $('#toast_body_text').text(new_text);
    setTimeout(function(){
        newNoty.close();
    }, 2000);
};
//check, uncheck all checkboxes in big container
AdminCommon.prototype.toggleCheckboxesSelection = function(chkMaster, container_id, chkClassname) {
    var $container = $('#'+container_id);
    var container_checked = $(chkMaster).is(':checked');
    $('.'+chkClassname, $container).prop('checked', container_checked);
    //change color of row(s)
    if (container_checked){
        $('tr.normal_tr', $container).addClass(ADMIN_CONSTANT_JS.MARK_ROW_BG); //clear mark all rows
    } else {
        $('tr.normal_tr', $container).removeClass(ADMIN_CONSTANT_JS.MARK_ROW_BG); //clear mark all rows
    }
};
//check, uncheck current checkbox
AdminCommon.prototype.toggleCheckboxSelection = function(chk, container_id) {
    var $container = $('#'+container_id);
    var chk_checked = $(chk).is(':checked');
    var $tr = $(chk).closest('tr');
    //change color of current row
    if (chk_checked){
        $tr.addClass(ADMIN_CONSTANT_JS.MARK_ROW_BG); //clear mark all rows
    } else {
        $tr.removeClass(ADMIN_CONSTANT_JS.MARK_ROW_BG); //clear mark all rows
    }
};
//==========
var adminCommon = new AdminCommon();		//global object
var newNoty = null;    //toast

