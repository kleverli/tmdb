/**
 * author: Martin SangDo
 Manage categories
 */
//========== CLASS
function AdminCategory() { }

//show dialog to confirm deleting movie(s)
AdminCategory.prototype.save_detail = function(btn_save){
    if (submitting){
        return;
    }
    var $container = $(btn_save).closest('tr');
    var cat_id = $container.attr('data-id');
    var cat_name = $('.txt_en_name', $container).val().trim();
    if (cat_name == ''){
        return;
    }
    //find duplicated English name
    var $rows = $('.tr_data', $('#real_tbl'));
    var is_duplicated = false;
    for (var i=0; i<$rows.length; i++){
        var another_cat_name = $('.txt_en_name', $($rows[i])).val().trim().toLowerCase();
        if (cat_name.toLowerCase() == another_cat_name && cat_id != $($rows[i]).attr('data-id')){
            is_duplicated = true;
            break;
        }
    }
    if (is_duplicated){
        adminCommon.showToast('Duplicated name', true, 'error');
        return;
    }
    var params = {
      id: cat_id,
      name: cat_name,
      is_active: $('input[type="checkbox"]', $container).is(':checked')?1:0
    };
    submitting = true;
    adminCommon.showToast();
    common.ajaxPost(ADMIN_API_URI.SAVE_CATEGORY_DETAIL, params, function(resp){
        if (resp == 'OK') {
            //success
            adminCommon.updateToastAndClose(STR_MESS_FRONT.UPDATE_SUCCESS);
        } else if (common.isset(resp.message)){
            adminCommon.updateToastAndClose(resp.message);
        } else {
            adminCommon.updateToastAndClose(STR_MESS_FRONT.SERVER_ERROR);
        }
        submitting = false;
    });
};

//==========
var adminCategory = new AdminCategory();		//global object