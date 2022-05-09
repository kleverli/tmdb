$(document).ready(function(){
    checklang();
    var currenturl = "/opensource";
    checkLogin(currenturl);
    //clear active menu class
    $('.nav-link', $('#navbar_container')).removeClass('active');
    $('#opensource-lg', $('#navbar_container')).addClass('active');
});
