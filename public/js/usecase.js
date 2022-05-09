$(document).ready(function(){
  checklang();
  var currenturl = "/usecase";
  checkLogin(currenturl);
  copyText();
    //clear active menu class
    $('.nav-link', $('#navbar_container')).removeClass('active');
    $('#usecase-lg', $('#navbar_container')).addClass('active');
});
