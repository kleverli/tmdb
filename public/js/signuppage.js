$(document).ready(function(){
  checklang();
  var currenturl = window.location.href;
  currenturl = currenturl.substring(currenturl.lastIndexOf('/') + 1);
  currenturl = "/signup";
  checkLogin(currenturl);
  signup();
});
var curlang = window.localStorage.getItem('lang');
var crl = "EN";
if (!curlang) {
  crl = "EN";
}
else
{
  crl = curlang;
}
var onloadCallback = function() {
    grecaptcha.render('recaptcha1', {
      'sitekey' : "6Lf1SjQaAAAAAOzyZTg5q4Uz376atd1-MHBtyi9j",
      'hl' : crl
    });
};
