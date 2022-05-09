module.exports = {
    'secret': 'protectedSecretToken',
    'database': {
        'username': 'yourusername',
        'password': 'yourpassword',
        'host': 'localhost',
        'database': ''
    },
    // "AppDev": "http://localhost:3001",
    "AppDev": "https://pmdb.me",  //config real domain
    "AppProd": "",
    "fromName": "PMDB Online",
    "fromEmail": "pmdb.me@gmail.com",
    "authEmail": "pmdb.me@gmail.com",
    "authpwd": "Swipex1!",
    "sessname": "sid",
    "sesstime" : parseInt(3600000*2),
    "googleCaptchaSecretKey": "6Lf1SjQaAAAAAMYXviNW-KFcV81QmIGqRyn382hG",
    "googleCaptchaVerificationUrl": "https://www.google.com/recaptcha/api/siteverify?secret=",
    // "verifymail1" : "http://localhost:3001/verification.?issuccess=",   //config real domain
    "verifymail1" : "https://pmdb.me/verification?issuccess=",
    "verifymail2" : "&message="
};
