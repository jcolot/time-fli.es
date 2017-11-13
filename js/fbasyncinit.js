var response;
window.fbAsyncInit = function() {
    FB.init({
        appId  : '360006414020299',
        status : true, // check login
        cookie : true, // enable cookies 
        xfbml  : true,  // parse XFBML
        oauth  : true
    });

    FB.Event.subscribe('auth.login', function (response){
        response=response;
        // do something with response
        $("#login-button").toggle(); 
        $("#logout-button").toggle(); 
//        reloadTimeMapEvents();
    });
};

(function(d){
    var js, id = 'facebook-jssdk'; 
    if (d.getElementById(id)) {
        return;
    }
    js = d.createElement('script'); 
    js.id = id; 
    js.async = true;
    js.src = "//connect.facebook.net/en_US/all.js";
    d.getElementsByTagName('head')[0].appendChild(js);
 }(document));

