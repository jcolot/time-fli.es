(function(){
// tf is the client session object
window.tf = {};
window.tf.users = {};
window.tf.connecting = false;
window.tf.connected = false;

var userId;
var urlParams;

tf.growProgressBar = function() {
    tf.itemsLoaded ++;
    if (tf.itemsLoaded <= tf.itemsToLoad) {
        var ratio = Math.round(100 * tf.itemsLoaded / tf.itemsToLoad) + "%";
        $("#progress-bar-inner").css("width", ratio);
    }

    if (tf.itemsLoaded == tf.itemsToLoad) {
        setTimeout(function(){
            $("#loading-mask").hide();
        }, 500);
    }
};

tf.setProgressBar = function(itemsToLoad) {
    $("#progress-bar-inner").css("width", 0);
    $("#loading-mask").show();
    tf.itemsToLoad = itemsToLoad;
    tf.itemsLoaded = 0;
}

tf.setProgressBar(3);

if (document.URL.split("?").length > 1) {
    urlParams = document.URL.split("?")[1].split("&");
}

if ($.isArray(urlParams)) {
    urlParams.forEach(
        function(item){
            var urlParam = item.split("=");
            if (urlParam.length > 1) {
                if (urlParam[0] == "user_id") {
                    tf.itemsToLoad ++;
                    userId = urlParam[1];
                }
                if (urlParam[0] == "album_id") {
                    albumId = urlParam[1];
                }
            }
        }
    )
}

var fetchUser = function(userId) {
    $.getJSON("php/google+.php?google_id=" + userId, function(data) {
        tf.users[userId] = data;
        tf.growProgressBar();
    });
};

if (userId) {
   fetchUser(userId);
}

$("#tl-zoom-in").click(
    function(e){
        e.preventDefault();
        e.stopPropagation();
        tm.timeline.getBand(0).zoom(true);
        tm.filter("map");
        tm.timeline.paint();
    }
);   

$("#tl-zoom-out").click(
    function(e){
        e.preventDefault();
        e.stopPropagation();
        tm.timeline.getBand(0).zoom(false);
        tm.filter("map");
        tm.timeline.paint();
    }
); 

$(document).bind("mobileinit", function(){
  // overrides default jQuery Mobile init
    $.mobile.autoInitializePage = false;
});

$(window).on("load", function() {

tf.growProgressBar();

var theme = Timeline.ClassicTheme.create();
theme.event.track.offset = 0;
theme.event.track.height = 20;
theme.event.tape.height = 0;
// These are for the default stand-alone icon
theme.event.instant.iconWidth = 84; 
theme.event.instant.iconHeight = 32; 
theme.event.instant.iconAlign = "center"; 

var triggerClusterOpenInfoWindow = function () {
    var marker = this.marker;
    var cluster = marker.cluster_;
    var mc = cluster.markerClusterer_;
    google.maps.event.trigger(mc, "click", cluster, marker); 
};

var mapOptions = {
    zoomControl: true,
    zoomControlOptions: { 
        style: google.maps.ZoomControlStyle.LARGE,
        position: google.maps.ControlPosition.LEFT_CENTER
    },
    panControl: false,
    streetViewControl: false,
    mapTypeControl: false,
    //select the mapTypeId selected in html
    mapTypeId: $(".map-type-id.selected").attr("name"),
    zoom: 3,
    center: new google.maps.LatLng(0,0)
};

window.tm = new TimeMap({
    mapId: "map",               // Id of map div element (required)
    timelineId: "timeline",     // Id of timeline div element (required)
    classicTape: true,
    mapOptions: mapOptions,
    eventIconPath: "",
    centerOnItems: true,
    iconAnchor: [42, 42],
    openInfoWindow: triggerClusterOpenInfoWindow,
    mapFilter: 'none',
    bandInfo: [
        {
        theme: theme,
        trackHeight: 12.0,
        trackGap: 0.5,
        timeZone: - new Date().getTimezoneOffset()/60,
        width:          "90",
        eventPainter:   Timeline.CompactEventPainter,
        eventPainterParams: 
            {clusterEvents: true},
        zoomIndex:      9,
        zoomSteps:      new Array(
          {pixelsPerInterval: 140,  unit: Timeline.DateTime.MINUTE},
          {pixelsPerInterval:  70,  unit: Timeline.DateTime.MINUTE},
          {pixelsPerInterval:  35,  unit: Timeline.DateTime.MINUTE},
          {pixelsPerInterval: 140,  unit: Timeline.DateTime.QUARTERHOUR},
          {pixelsPerInterval:  70,  unit: Timeline.DateTime.QUARTERHOUR},
          {pixelsPerInterval:  35,  unit: Timeline.DateTime.QUARTERHOUR},
          {pixelsPerInterval:  70,  unit: Timeline.DateTime.HOUR},
          {pixelsPerInterval:  35,  unit: Timeline.DateTime.HOUR},
          {pixelsPerInterval: 400,  unit: Timeline.DateTime.DAY},
          {pixelsPerInterval: 200,  unit: Timeline.DateTime.DAY},
          {pixelsPerInterval: 100,  unit: Timeline.DateTime.DAY},
          {pixelsPerInterval:  50,  unit: Timeline.DateTime.DAY},
          {pixelsPerInterval: 400,  unit: Timeline.DateTime.MONTH},
          {pixelsPerInterval: 200,  unit: Timeline.DateTime.MONTH},
          {pixelsPerInterval: 100,  unit: Timeline.DateTime.MONTH},
          {pixelsPerInterval: 300,  unit: Timeline.DateTime.YEAR}, 
          {pixelsPerInterval: 200,  unit: Timeline.DateTime.YEAR}, 
          {pixelsPerInterval: 100,  unit: Timeline.DateTime.YEAR} 
        )
        }
    ]
});


google.maps.event.addListener(tm.map.markerClusterer, "click", 
        function(cluster, marker) {cluster.openInfoWindow(marker);});

$(window).on(
    "resize",
    function(){
        var tlWidth = tm.timeline.getBand(0).getViewWidth(); 
        $("#tl-height-handle").css("top", 
                window.innerHeight - 65 - tlWidth + "px");
        if (window.innerHeight - 1.6 * tlWidth < 270) {
            tm.map.setOptions({zoomControl: false});
        } else if (window.innerHeight - 1.6 * tlWidth < 370) {
            tm.map.setOptions({
                zoomControl:true,
                zoomControlOptions: {
                    style: google.maps.ZoomControlStyle.SMALL,
                    position: google.maps.ControlPosition.LEFT_CENTER
                    }
                }   
            );
        } else {
            tm.map.setOptions({
                zoomControl:true,
                zoomControlOptions: {
                    style: google.maps.ZoomControlStyle.LARGE,
                    position: google.maps.ControlPosition.LEFT_CENTER
                    }
                }   
            );
        }
        if (tf.tlFullScreen) {
            tlHeight(window.innerHeight - 30);
        }
        
        
    }
);

$(window).trigger("resize");

tm.loadAlbum = function(id, data) {
    var ds = tm.createDataset(id, {title: id, eventSource: tm.eventSource});
    ds.setDataCache(data);
    tm.timeline.getBand(0).centerOnEvents(true);
};

//window.showDateLabel = function(){
//    var label = document.getElementById("tl-date-label");
//    var line = document.getElementById("tl-middle-line");
//    label.style.display = "block";
//    line.style.display = "block";
//    var date = tm.timeline.getBand(0).getCenterVisibleDate();
//    label.innerHTML = date.format("ddd mmm d, yyyy hh:MM");
//};
//
//window.updateDateLabel = function(){
//    var label = document.getElementById("tl-date-label");
//    var date = tm.timeline.getBand(0).getCenterVisibleDate();
//    label.innerHTML = date.format("ddd mmm d, yyyy hh:MM");
//};

//window.hideDateLabel = function(){
//    var label = document.getElementById("tl-date-label");
//    var line = document.getElementById("tl-middle-line");
//    label.style.display = "none";
//    line.style.display = "none";
//};

//tm.timeline.getBand(0).addListener("dragstart", showDateLabel);
//tm.timeline.getBand(0).addListener("drag", updateDateLabel);
//tm.timeline.getBand(0).addListener("dragend", hideDateLabel);

// progress bar
google.maps.event.addListenerOnce(tm.map, 'idle', function() {
    tf.growProgressBar();
});

google.maps.event.addListenerOnce(tm.map, 'tilesloaded', function() {
    tf.growProgressBar();
});

$("#tl-zoom-in").click(
    function(e){
        e.preventDefault();
        e.stopPropagation();
        tm.timeline.getBand(0).zoom(true);
        tm.filter("map");
        tm.timeline.paint();
    }
);   

$("#tl-zoom-out").click(
    function(e){
        e.preventDefault();
        e.stopPropagation();
        tm.timeline.getBand(0).zoom(false);
        tm.filter("map");
        tm.timeline.paint();
    }
); 

$(".connect").click(
    function(e){
        e.preventDefault();
        e.stopPropagation();
        if (! window.focus)return true;
        var href = "https://accounts.google.com/o/oauth2/auth?" +
        "scope=https%3A%2F%2Fpicasaweb.google.com%2Fdata%2F+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile&" +
        "state=%2Fprofile&" +
        "redirect_uri=http://time-fli.es/php/oauth2callback.php&" +
        "response_type=code&" +
        "client_id=" + 793897304035 + ".apps.googleusercontent.com&approval_prompt=force";
        setCookie("google_id", null, -1);
        var popup = window.open(href, "Connect with Google+", 'width=500,height=450,scrollbars=yes,toolbar=0');
        return false;
    }
);


var flickrhref = "https://www.flickr.com/services/oauth/request_token" +
"?oauth_nonce=95613465" + 
Math.floor(Math.random() * 10000000) +
"&oauth_timestamp=" +  Date.now() +
"&oauth_consumer_key=1abb4eb5824f10649b8ec8013a67ba4f" +
"&oauth_signature_method=HMAC-SHA1" +
"&oauth_version=1.0" +
"&oauth_signature=7w18YS2bONDPL%2FzgyzP5XTr5af4%3D" +
"&oauth_callback=http%3A%2F%2Ftime-fli.es%2Fphp%2F%flickrcallback.php";


$("#map-settings-tab").click(
    function(e){
        e.preventDefault();
        e.stopPropagation();
        $("#map-settings").css("left", $(this).offset().left - 5 + "px");
        $("#map-settings").toggle();
        $(document).one("click.mst",function(){
            $("#map-settings").toggle();
        });
    }
);

$('.map-type-id').bind({
    click: function(e){
        e.preventDefault();
        e.stopPropagation();
        $('.map-type-id').toggleClass("selected", false);
        $('.map-type-id').toggleClass("mouseover", false);
        $(this).toggleClass("selected", true);
        tm.map.setOptions({mapTypeId: $(this).attr("name")});
    },
    mouseover: function(e){
        if(!$(this).is(".selected")) {;
            $('.map-type-id').toggleClass("mouseover", false);
            $(this).toggleClass("mouseover", true);
        }
    }, 
    mouseout: function(e){
        if(!$(this).is(".selected")) {;
            $('.map-type-id').toggleClass("mouseover", false);
        }
    }
});

$(".header-item").hover(
    function(){
        $(this)
            .css("color", "#fff")
            .find(".down-arrow")
            .css("border-color", "#fff transparent transparent");
    },
    function(){
        $(this)
            .css("color", "#999")
            .find(".down-arrow")
            .css("border-color", "#999 transparent transparent");
    }
);

$('div').mousemove(function(e) {e.preventDefault()});

$('input').keypress(function(e) {
    if (e.which == 13) {
        $(this).blur();
        $('#search').trigger('click');
    }
});

var fetchMyAlbums = function(callback) {
    $.getJSON("php/picasa.php", function(data){
        tf.albums = {};
        tf.setProgressBar(1); 
        $.each(data, function(key, val) {

            if (val.title != "Auto-Backup" && val.title != "Profile Photos" && val.title != "Scrapbook Photos"){
                tf.albums[val.id] = val;
            }        //album in modalbox
        });
        tf.growProgressBar();
    
        if (typeof callback == "function") {    
            callback();
        }
        //displayMyAlbums();
    });
};

var displayMyAlbums = function(){
    var items = [];
    $.each(tf.albums, function(key, val) {
        var albumId = val.id;
        var authorId = val.authorId;
        var authorName = val.authorName;
        var albumThumbnail = val.thumbnail;
        var albumTitle = val.title;
        var albumNumPhotos = val.numPhotos;
        

        items.push(
        '<div class="modalbox-album-label"><div class="modalbox-album-thumbnail cursor-hand"'+
        ' name="' + albumId + '" numphotos="' + albumNumPhotos +  '"><img  src="' + albumThumbnail + 
        '" /></div><div class="modalbox-album-title">' + albumTitle + '</div>' +
        '<div class="modalbox-album-numphotos">#photos: ' + albumNumPhotos + '</div>' + 
        '<button class="add-album" name="' + albumId + '">display on timeline</button></div>'
        ); 

    });

    var header =
        '<div class="albums-close"></div>'+
        '<div class="albums-header">'+
        '<span class="modalbox-header">My Albums</span>'+
        '<img class="picasaweb-logo" src="img/ww-picasa-logo.png" /></div>';
    var outer = '<div class="albums-outer">';
    var inner = '<div class="albums-inner">';
    var end = '</div></div></div>';
    $("#albums").html(header + outer + inner + items.join(" ") + end).waitForImages(function(){albumsResize()});
    albumsResize();
    //show-hide album on timeline
    $('#overlay').show();
    $('#albums-container').show();

    $(".add-album").click(function(){
        var $this = $(this);
        var albumId = this.name;
        if(!$this.data("itemsloaded")) {
            fetchMyAlbum(albumId, function(){
                tm.datasets[albumId].loadItemsFromDataCache();
                $this.data("itemsloaded", true);
                tm.timeline.getBand(0).centerOnEvents(true);
                $this.css("border", "3px double #fff")
                $this.text("remove from timeline");
            });
        } else {
            tm.datasets[this.name].clear(false);
            tm.timeline.getBand(0).centerOnEvents(true);
            $this.css("border", "1px solid #3079ED")
            $this.css("border-style", "solid")
            $this.text("display on timeline");
            $this.data("itemsloaded", false);
        }
    });

    $(".modalbox-album-thumbnail").one('click', function(){
        var $this = $(this);
        var albumId = $this.attr("name");
        if (typeof tf.albums[albumId].photos != 'object') {
            fetchMyAlbum(albumId, function(){
                displayMyAlbum(albumId);
            });
        }else{
            displayMyAlbum(albumId);
        }
    });

    $(".albums-close").one('click', function(){
        $('#overlay').hide();
        $('#albums-container').hide();
        $(window).unbind("resize", albumsResize);
    });
        
    albumsResize();

};

var displayMyPhoto = function() {
    $(".modalbox-photo-close").one('click', function(){
        $('.modalbox-photo-container').hide();
        $(window).unbind("resize", albumsResize);
    });
}

// get the album in the global tf object, once done call displayMyAlbum
var fetchMyAlbum = function(albumId, callback) {
   $.getJSON( "php/picasa.php?album_id="+ albumId, function(data) {
        if (data == null) {
            return;
        }

        tm.loadAlbum(albumId, data.photos);
        if (data.photos.length) data.photos.sort(
            function(a,b) {return a.start - b.start});

        tf.albums[albumId].photos = data.photos;
        
        var Photos = function(photos) {
            this.getElementById = function(id) {
                for (var el in photos) {
                    if (el.id == id) return el;}
            };

            return this;
        }
        //$.each(data.photos, function(key, val) {
        //    tf.albums[albumId].photos[key] = val;
        //});

        if (typeof callback == "function") {    
            callback();
        }
 
        //displayMyAlbum(albumId);
    })
};

var displayMyAlbum = function(albumId){
//album in modalbox
    var album = tf.albums[albumId];
    var albumTitle = album.title;
    if (album.photos.length > 0) {
        var items = [];
        $.each(album.photos, function(key, val) {
            var photoId = val.id;
            var photoSmallImage = val.options.smallImage;
            var photoDesc = val.description;

            items.push(
            '<div class="modalbox-photo-label"><div class="modalbox-photo-thumbnail cursor-hand"'+
            ' albumId="' + albumId + '" photoId="' + photoId + '"><img src="' + photoSmallImage + 
            '" /></div><div class="modalbox-album-desc">' + photoDesc + '</div>' +
            '</div>'); 

        });
        var header =
            '<div class="albums-close"></div>'+
            '<div class="albums-header">'+
            '<a class="back-to-albums">Albums > </a>'+
            '<span class="modalbox-header">' + albumTitle +' </span>'+
            '<img class="picasaweb-logo" src="img/ww-picasa-logo.png" /></div>';
        var outer = 
            '<div class="albums-outer">';
        var inner = '<div class="albums-inner">';
        var end = '</div></div></div>';
        
        $("#albums").html(header + outer + inner + items.join(" ") + end).waitForImages(function(){albumsResize()});
        albumsResize();
        //show-hide album on timeline
    }

    $(".back-to-albums").one("click", function(){
        displayMyAlbums();
    });

    $(".albums-close").one('click', function(){
        $('#overlay').hide();
        $('#albums-container').hide();
        $(window).unbind("resize", albumsResize);
    });

    $(".modalbox-photo-thumbnail").one('click', function(evt){
        photoId = this.attributes.photoId.value;
        albumId = this.attributes.albumId.value;
        function matchPhotoId(element) {if (element.id==photoId)return element;};
        var album = tf.albums[albumId];
        var photo = album.photos.find(matchPhotoId);
        var index;
        
        for (var i = 0; i < album.photos.length; i++) {
            if (album.photos[i].id = photoId) {
                index = i;
            }
        }

        console.log(album.photos[i]);

        displayPhoto(album, index);

        $('#albums-container').hide();
        $(window).unbind("resize", albumsResize);
    });
};


window.fetchMyAlbums = fetchMyAlbums;
window.fetchMyAlbum = fetchMyAlbum;

$(document).bind("userconnected", function(){
    $('#albums-container').hide();
    $('#overlay').hide();
    fetchMyAlbums(function(){
        tf.connected = true;
    });
    tf.growProgressBar();
});

var albumsResize = function() {
    $('#albums').width(document.body.offsetWidth - (document.body.offsetWidth % 190) - 165);
    $('#albums').height(document.body.offsetHeight - 100);
    $('#albums').css('top', '20px');

    var $header = $(".albums-header");
    var $outer = $(".albums-outer");
    var $inner = $(".albums-inner");
    $outer.height($("#albums").height() - $header.outerHeight(true)); 

    // leave some space for the scrollbar
    if ($outer.height() < $inner.height()) {
        $('#albums').width(document.body.offsetWidth - (document.body.offsetWidth % 190) - 165 + 15);
    };
    $inner.css("top", 0);
    $('#albums').height($('.albums-header').outerHeight(true) + $('.albums-outer').outerHeight(true));
    $('#albums').css('top', ((document.body.scrollHeight- $('#albums').outerHeight(true)))/ 2 + "px");
}

$("#albums-tab").click(function(){
    // trigger the resize function.
    if (!tf.connected){
        fetchMyAlbums(function(){
            displayMyAlbums();
        });
    } else {
        displayMyAlbums();
    }
    $(window).bind("resize", albumsResize);

});
    
var tlHeight = function(height) {
    $("#timeline-container").height(height + 10);
    $("#timeline").height(height);
    $("#tl-middle-line").height(height);
    $("#timeline-band-0").height(height);
    $("#timeline-band-scrollbar-0").height(height);
    tm.timeline._bands[0]._bandInfo.width = "" + height;
    $("#tl-date-label").css("top", ((height / 2) - 10) + "px");
    tm.timeline._bands[0]._showScrollbar();
    $("#tl-zoom").css("top", ((height / 2) - 5) + "px")
}

$("#tl-height-handle").draggable({
    axis: "y",
    drag: function(e, ui) {
        if(ui.position.top >= window.innerHeight - 165){
            ui.position.top = window.innerHeight - 165;
        } else if (ui.position.top <=  50) {
            ui.position.top = 50;
        }
        tlHeight(window.innerHeight - 65 - ui.position.top);
    },
    stop: function() {
        $(window).trigger("resize");
    }
});

});
// end of onload()

var codeAddress = function () {
    var map = tm.map;
    var address = document.getElementById("address");
    address.focus();
    address.select();
   
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode( { 'address': address.value}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        map.setCenter(results[0].geometry.location);
        map.fitBounds(results[0].geometry.viewport);
      } else {
        address.select();
      }
    });
};

// attach codeAddress to window
window.codeAddress = codeAddress;

var setCookie = function(cName, cValue, exDays) {   
    var exDate=new Date();
    exDate.setDate(exDate.getDate() + exDays);
    var cValue=escape(cValue) + ((exDays==null) ? "" : "; expires="+exDate.toUTCString());
    document.cookie=cName + "=" + cValue;
}

var getCookie = function(cName) {
    var i,x,y,arrCookies=document.cookie.split(";");
    for (i=0;i<arrCookies.length;i++){
        x=arrCookies[i].substr(0,arrCookies[i].indexOf("="));
        y=arrCookies[i].substr(arrCookies[i].indexOf("=")+1);
        x=x.replace(/^\s+|\s+$/g,"");
        if (x==cName){
            return unescape(y);
        }
    }
}

var editLocation = function(lat, lng){
    var albumId = $('.modalbox-photo').attr('albumId');
    var photoId = $('.modalbox-photo').attr('photoId');
    lat = (lat==undefined)?0:lat;
    lng = (lng==undefined)?0:lng;
    var $photoContainerCopy =  $('.modalbox-photo-container').clone(true, true);
    var $photoContainer =  $('.modalbox-photo-container');
    var $photoInfoCopy =  $('.modalbox-photo-info').clone(true, true);
    var $photoInfo =  $('.modalbox-photo-info');
    // replace photoInfo with edit buttons
    //$photoInfo.empty();
    $photoInfo.html(
        '<div class="modalbox-edit-location">Edit location</div>' +
        '<input type="text" class="modalbox-search-location" placeholder="Enter a location">' +
        '<div class="modalbox-add-placemark">Add placemark</div>'+
        '<div class="modalbox-save-location">Save</div>'+
        '<div class="modalbox-cancel">Cancel</div>'
    );

    $('.modalbox-cancel').click(function(){
        $photoInfo.html($photoInfoCopy.html());
        $photoContainer.html($photoContainerCopy.html());
                        // handle photo title gray zone at bottom of photo

            $photoContainer.unbind();
            $photoContainer.bind({
                mouseenter: function(e) {
                    $(".modalbox-photo-title").animate({
                        bottom: "0" 
                    }, 100);
                },
                mouseleave: function(e) {
                    $(".modalbox-photo-title").animate({
                        bottom: "-30px"
                    }, 100);
                }
            });
        
            $('.modalbox-photo-edit-location').click(
                function(){
                    editLocation();
                }
            );
            $photoContainer.css('background-color', '');
    });

//    $('.modalbox-photo').append(photoContainer);
    var mapOptions = {
        zoom: 2,
        center: new google.maps.LatLng(lat, lng),
        zoomControl: true,
        streetViewControl: false,
        panControl: false,
        zoomControlOptions: {
            style: google.maps.ZoomControlStyle.SMALL,
            position: google.maps.ControlPosition.TOP_LEFT
        }
    };

    var map = new google.maps.Map($('.modalbox-photo-container').get(0),
        mapOptions);

    var markerOptions = {
        map: map,
        draggable: true
    };

   if (typeof marker != "object") {
       var marker = new google.maps.Marker(markerOptions);
   };

    var codeAddress = function () {
        var address = document.getElementById("modalbox-search-location");
        address.focus();
        address.select();
        
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode( { 'address': address.value}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
            map.fitBounds(results[0].geometry.viewport);
          } else {
            address.select();
          }
        });
    };


    var setAddPlacemark = function(){
        $('.modalbox-add-placemark').one('click', function(){ 
            $('.modalbox-add-placemark').html(
                'Click on map or ' +
                '<a class="modalbox-cancel-placemark-link">Cancel</a>'
            ).removeClass('modalbox-add-placemark').addClass('modalbox-cancel-placemark');
    
            var mapClickListener = google.maps.event.addListenerOnce(map, 'click', function(event) {
                marker.setPosition(event.latLng);
                $('.modalbox-save-location').css('opacity', '1.0');
                $('.modalbox-save-location').click(function(){
                    $.getJSON(
                        'php/picasa.php?' + 
                        'album_id=' + albumId +
                        '&photo_id=' + photoId +
                        '&location=' + marker.getPosition().lat() + '%20' + marker.getPosition().lng()
                    ).success(
                        function(){
                            $photoInfo.html($photoInfoCopy.html());
                            $photoContainer.html($photoContainerCopy.html());
                            // reset events
                            $(".modalbox-photo-right-side").unbind();
                            $(".modalbox-photo-right-side").bind({
                                mouseenter: function(e) {
                                    $(".modalbox-right-arrow").toggleClass("modalbox-sprite-bg", true);
                                },
                                mouseleave: function(e) {
                                    $(".modalbox-right-arrow").toggleClass("modalbox-sprite-bg", false);
                                },
                                click: function() {
                                    nextPhoto(1);
                                }
                            }); 
                            $(".modalbox-photo-left-side").unbind();
                            $(".modalbox-photo-left-side").bind({
                                mouseenter: function(e) {
                                    $(".modalbox-left-arrow").toggleClass("modalbox-sprite-bg", true);
                                },
                                mouseleave: function(e) {
                                    $(".modalbox-left-arrow").toggleClass("modalbox-sprite-bg", false);
                                },
                                click: function() {
                                    nextPhoto(-1);
                                }
                                // previous photo in album
                            });
                    
                            // handle photo title gray zone at bottom of photo
                    
                            $photoContainer.unbind();
                            $photoContainer.bind({
                                mouseenter: function(e) {
                                    $(".modalbox-photo-title").animate({
                                        bottom: "0" 
                                    }, 100);
                                },
                                mouseleave: function(e) {
                                    $(".modalbox-photo-title").animate({
                                        bottom: "-30px"
                                    }, 100);
                                }
                            });
                            $('.modalbox-photo-edit-location').click(
                                function(){
                                    editLocation();
                                }
                            );
                            $photoContainer.css('background-color', '');
                        }
                    );
                });
                $('.modalbox-cancel-placemark').html('Add placemark')
                    .removeClass('modalbox-cancel-placemark')
                    .addClass('modalbox-add-placemark');
                google.maps.event.removeListener(mapClickListener);
                setAddPlacemark(marker);
            });
    
            $('.modalbox-cancel-placemark-link').one('click', function(){ 
                $('.modalbox-cancel-placemark').html('Add placemark')
                    .removeClass('modalbox-cancel-placemark')
                    .addClass('modalbox-add-placemark');
                google.maps.event.removeListener(mapClickListener);
                setTimeout(function(){setAddPlacemark(marker)}, 0);
            });
        });
    }
    setAddPlacemark();
}

var displayPhoto = function (album, index) {
    var photo = album.photos[index];
    var $photoContainer = $("#photo-container");
    var $photoStage = $('#photo-stage');
    $('#photo-container').css('display', 'block');
    var src = photo.options.largeImage;
    var photoTitle = photo.title;
    var photoDescription = photo.description;
    var photoDate = photo.start;
    photoDate = new Date(parseInt(photoDate)).toDateString() 
    var photoWidth = photo.options.maxImgWidth;
    var photoHeight = photo.options.maxImgHeight;
    var infoWidth = 350;
    
    $("#photo-right-side").unbind("click");
    $("#photo-right-side").bind("click", function() {
        displayPhoto(album, (index + 1)% album.photos.length);
    });

    $("#photo-left-side").unbind("click");
    $("#photo-left-side").bind("click", function() {
        displayPhoto(album, (album.photos.length + index - 1) % album.photos.length);
    });

    $(window).unbind("keydown");
    $(window).bind("keydown", function(evt) {
        if (evt.keyCode == 37) {
            displayPhoto(album, (album.photos.length + index - 1) % album.photos.length);
        } else if (evt.keyCode == 39) {
            displayPhoto(album, (index + 1)% album.photos.length);
        }
    });

    $('#photo-img').css('visibility', 'hidden');
    var img = new Image();
    img.src = src;
    img.onload = function(){
        $('#photo-img').attr('src', src);
        $('#photo-img').css('visibility', 'visible');


        var photoStageRatio = window.innerHeight / (window.innerWidth - infoWidth);
        var photoWidth = this.width;
        var photoHeight = this.height;

        var $photoImage = $("#photo-img");
        var photoRatio = photoHeight / photoWidth;
        
        if (photoRatio == photoStageRatio) { 
            $photoImage.css({
                "width": "100%",
                "height": "100%"
            });
        } else if (photoRatio > photoStageRatio) {
            var marginLeft = 
                Math.round(($photoContainer.height() * 
                ((1 / photoStageRatio) - (1 / photoRatio))) / 2);
            $photoImage.css({
                "margin-top": "",
                "margin-left": marginLeft,
                "height": "100%",
                "width": ""
            });
        } else {
            var marginTop = 
                Math.round(($photoContainer.width() * (photoStageRatio - photoRatio)) / 2);
            $photoImage.css({
                "margin-left": "",
                "margin-top": marginTop,
                "height": "",
                "width": "100%"
            });
        }
        if ($photoContainer.height() > photoHeight && $photoContainer.width() > photoWidth){
            var marginTop = ($photoContainer.height() - photoHeight)/2 
            var marginLeft = (window.innerWidth - infoWidth - photoWidth)/2 
            $photoImage.css({
                "margin-left": marginLeft,
                "margin-top": marginTop,
                "height": photoHeight + 'px',
                "width": photoWidth + 'px'
            });
        }
    }; 

    $('#photo-title-inner').html(
        '<b>' 
        + photoTitle
        + '</b>&nbsp; ' 
        + 'photo ' 
    //    + (index + 1) + ' of ' 
    //    + numPhotos
    );
    $('#photo-description').html(photoDescription);
    $('#photo-date').html(photoDate);


    // fill the map 

    var $mapDiv = $("#photo-map");
    var mapDiv = $mapDiv.get(0);
    if (typeof photo.point == "object") { 
        $mapDiv.css('display', 'block');
        var center = photo.point;
        center = new google.maps.LatLng(center.lat, center.lng);
        var mapOptions = {
            center: center,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            zoom: 7,
            mapTypeControl: false,
            streetViewControl: false
        };
        var bounds = photo.options.bounds;
        var ne = new google.maps.LatLng(bounds.ne.lat,bounds.ne.lng);
        var sw = new google.maps.LatLng(bounds.sw.lat,bounds.sw.lng);
        bounds = new google.maps.LatLngBounds(sw, ne);
        var map = new google.maps.Map(mapDiv, mapOptions);
        if (bounds.ne) {
            map.fitBounds(bounds);
        } else map.setZoom(20);
        var photoMarker = new google.maps.Marker({
            position: center,
            map: map
        });
    } else {
        // hide map    
        $mapDiv.css('display', 'none');
    }
    
    $('#photo-stage').focus();

}

$(window).on('resize', function() {
        var infoWidth = $('#photo-infowindow').width();

        var photoStageRatio = window.innerHeight / (window.innerWidth - infoWidth);
        var $photoImage = $("#photo-img");
        var $photoContainer = $("#photo-container");
        var photoWidth = $photoImage.width();
        var photoHeight = $photoImage.height();

        var photoRatio = photoHeight / photoWidth;
        
        if (photoRatio == photoStageRatio) { 
            $photoImage.css({
                "width": "100%",
                "height": "100%"
            });
        } else if (photoRatio > photoStageRatio) {
            var marginLeft = 
                Math.round(($photoContainer.height() * 
                ((1 / photoStageRatio) - (1 / photoRatio))) / 2);
            $photoImage.css({
                "margin-top": "",
                "margin-left": marginLeft,
                "height": "100%",
                "width": ""
            });
        } else {
            var marginTop = 
                Math.round(($photoContainer.width() * (photoStageRatio - photoRatio)) / 2);
            $photoImage.css({
                "margin-left": "",
                "margin-top": marginTop,
                "height": "",
                "width": "100%"
            });
        }
        if ($photoContainer.height() > photoHeight && $photoContainer.width() > photoWidth){
            var marginTop = ($photoContainer.height() - photoHeight)/2 
            var marginLeft = (window.innerWidth - infoWidth - photoWidth)/2 
            $photoImage.css({
                "margin-left": marginLeft,
                "margin-top": marginTop,
                "height": photoHeight + 'px',
                "width": photoWidth + 'px'
            });
        }
    } 
)
 
$("#photo-close").click(
    function(){
        $("#photo-container").hide();
});

$("#photo-right-side").bind({
    mouseenter: function(e) {
        $("#photo-right-arrow").toggleClass("photo-sprite-bg", true);
    },
    mouseleave: function(e) {
        $("#photo-right-arrow").toggleClass("photo-sprite-bg", false);
    }
});

$("#photo-left-side").bind({
    mouseenter: function(e) {
        $("#photo-left-arrow").toggleClass("photo-sprite-bg", true);
    },
    mouseleave: function(e) {
        $("#photo-left-arrow").toggleClass("photo-sprite-bg", false);
    }
});

$("#tl-zoom-in").click(
    function(e){
        e.preventDefault();
        e.stopPropagation();
        tm.timeline.getBand(0).zoom(true);
        tm.filter("map");
        tm.timeline.paint();
    }
);   

$("#tl-zoom-out").click(
    function(e){
        e.preventDefault();
        e.stopPropagation();
        tm.timeline.getBand(0).zoom(false);
        tm.filter("map");
        tm.timeline.paint();
    }
); 


})();
