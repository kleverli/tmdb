/**
 * author: Martin SangDo
 Manage site settings
 */
//========== CLASS
function AdminSiteSetting() { }

//show dialog to confirm deleting movie(s)
AdminSiteSetting.prototype.save_detail = function(btn_save){
    if (submitting){
        return;
    }
    var home_torrent_link = $('#home_torrent_link').val().trim();
    if (home_torrent_link == ''){
        adminCommon.showToast('Invalid link', true, 'error');
        return;
    }
    var params = {
        home_torrent_link: home_torrent_link
    };
    submitting = true;
    adminCommon.showToast();
    common.ajaxPost(ADMIN_API_URI.SAVE_SITE_SETTING, params, function(resp){
        if (resp.result == 'OK' || resp=='OK') {
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
var adminSiteSetting = new AdminSiteSetting();		//global object
