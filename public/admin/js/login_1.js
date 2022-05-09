/**
 * Process login page
 * author: Martin SangDo
 Login Admin Web
 */
//========== CLASS
function LoginPage() { }

var loginPage = new LoginPage();		//global object
//get new captcha image
LoginPage.prototype.refresh_captcha = function(){
    var uri = ADMIN_API_URI.READ_NEW_CAPTCHA;
    common.ajaxPost(uri, {}, function(resp){
       if (common.isset(resp)){
           $('#captcha_container').html(resp);
       }
    });
};
//begin login progress
LoginPage.prototype.process_login = function(){
    if (submitting){
        return;
    }
    //verify input
    var txt_account = $.trim($('#txt_account').val());
    var txt_password = $.trim($('#txt_password').val());
    if (common.isEmpty(txt_account) || common.isEmpty(txt_password)){
        $('#label_message').text(STR_MESS.MISSING_INPUT);
        return;
    }
    var encrypted_pass = sha256(txt_password);
    var params = {
        username: txt_account,
        password: encrypted_pass
    };
    $('#label_message').text('');
    submitting = true;
    common.ajaxPost(ADMIN_API_URI.LOGIN, params, function(resp){
        console.log(resp);
        if (resp.result == 'OK' || resp=='OK') {
            //correct authentication
            //save username
            localStorage.setItem(LOCALSTORAGE_KEY_USERNAME, txt_account);
            common.redirect(ADMIN_API_URI.MOVIE_LIST);
        } else if (common.isset(resp.message)){
            adminCommon.showToast(resp.message, true, 'error');
        } else {
            adminCommon.showToast(STR_MESS_FRONT.SERVER_ERROR, true, 'error');
        }
        submitting = false;
    }, function(err){
        err = $.parseJSON(err);
        if (err.message == 'WRONG_CAPTCHA'){
            $('#label_message').text(STR_MESS.WRONG_CAPTCHA);
            $.trim($('#txt_captcha').val(''));
        } else if (err.message == 'NOT_FOUND'){
            $('#label_message').text(STR_MESS.INVALID_LOGIN_ADMIN);
        }
        $.trim($('#txt_password').val(''));
        submitting = false;
    });
}

//
window.onload = function(){
    $('#txt_password').unbind();
    $('#txt_password').keypress(function(e){
        if (e.which == 13){
            //pressed ENTER
            loginPage.process_login();
        }
    });
}
