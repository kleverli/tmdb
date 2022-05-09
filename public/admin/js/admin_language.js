/**
 * author: Martin SangDo
 Manage languages
 */
//========== CLASS
function AdminLanguage() { }

//show dialog to confirm deleting movie(s)
AdminLanguage.prototype.save_detail = function(btn_save){
    if (submitting){
        return;
    }
    var $container = $(btn_save).closest('tr');
    var _id = $container.attr('data-id');
    var key = $('.txt_key', $container).val().trim();
    var en_name = $('.txt_en', $container).val().trim();
    var kr_name = $('.txt_kr', $container).val().trim();
    var cn_name = $('.txt_cn', $container).val().trim();
    var ru_name = $('.txt_ru', $container).val().trim();
    if (key == '' || en_name == ''){
        adminCommon.showToast('Missing key or English words', true, 'error');
        return;
    }
    if (key.indexOf(' ') > -1){
        adminCommon.showToast('Blank is not allowed in key', true, 'error');
        return;
    }
    //find duplicated key name
    var $rows = $('.tr_data', $('#real_tbl'));
    var is_duplicated = false;
    for (var i=0; i<$rows.length; i++){
        var another_key_name = $('.txt_key', $($rows[i])).val().trim().toLowerCase();
        if (key.toLowerCase() == another_key_name && _id != $($rows[i]).attr('data-id')){
            is_duplicated = true;
            break;
        }
    }
    if (is_duplicated){
        adminCommon.showToast('Duplicated key', true, 'error');
        return;
    }
    var params = {
        id: _id,
        key: key.toLowerCase(),
        en: en_name,
        kr: kr_name,
        cn: cn_name,
        ru: ru_name,
        is_active: $('input[type="checkbox"]', $container).is(':checked')?1:0
    };
    submitting = true;
    adminCommon.showToast();
    common.ajaxPost(ADMIN_API_URI.SAVE_LANGUAGE_DETAIL, params, function(resp){
        if (resp.result == 'OK' || resp=='OK') {
            //success
            adminCommon.updateToastAndClose(STR_MESS_FRONT.UPDATE_SUCCESS);
            if (resp.new_id != null && resp.new_id != ''){
                $container.attr('data-id', resp.new_id);
            }
        } else if (common.isset(resp.message)){
            adminCommon.updateToastAndClose(resp.message);
        } else {
            adminCommon.updateToastAndClose(STR_MESS_FRONT.SERVER_ERROR);
        }
        submitting = false;
    });
};
//add new empty row
AdminLanguage.prototype.add_new_row = function() {
    //check if any row having empty key
    var $rows = $('.tr_data', $('#real_tbl'));
    var has_empty_row = false;
    for (var i=0; i<$rows.length; i++){
        var another_key_name = $('.txt_key', $($rows[i])).val().trim().toLowerCase();
        if (another_key_name == ''){
            has_empty_row = true;
            break;
        }
    }
    if (has_empty_row){
        adminCommon.showToast('There is 1 empty key in the list', true, 'error');
        return;
    }
    var $new_tr = $('tr', $('#tbl_template')).clone(false);
    $('#real_tbl').append($new_tr);
};
//==========
var adminLanguage = new AdminLanguage();		//global object