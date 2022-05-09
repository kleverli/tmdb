/**
 * author: Martin SangDo
 Manage desktop app settings
 */
//========== CLASS
function AdminAppSetting() { }

//show dialog to confirm deleting movie(s)
AdminAppSetting.prototype.save_detail = function(btn_save){
    if (submitting){
        return;
    }
    var $container = $('#tbl_form');
    var $active_domains = $('.txt_domain', $container);
    var domains = [];
    var invalid_url = '';
    for (var i=0; i<$active_domains.length; i++){
        var domain = $($active_domains[i]).val().trim();
        if (domain == ''){
            continue;
        }
        if (!common.isValidUrl(domain)){
            invalid_url = domain;
            break;
        }
        if ($.inArray(domain.toLowerCase(), domains) == -1){
            domains.push(domain.toLowerCase());
        }
    }
    if (invalid_url != ''){
        adminCommon.showToast('Invalid domain: '+ invalid_url, true, 'error');
        return;
    }
    var contact_email = $('#txt_contact_email', $container).val().trim();
    if (contact_email == '' || !common.isValidEmail(contact_email)){
        adminCommon.showToast('Invalid contact email', true, 'error');
        return;
    }
    var params = {
        active_domains: JSON.stringify(domains),
        contact_email: contact_email.toLowerCase(),
        latest_version: $('#txt_latest_version', $container).val().trim(),
        upgrade_version_note: $('#txt_upgrade_note', $container).val().trim()
    };
    submitting = true;
    adminCommon.showToast();
    common.ajaxPost(ADMIN_API_URI.SAVE_APP_SETTING, params, function(resp){
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
var adminAppSetting = new AdminAppSetting();		//global object