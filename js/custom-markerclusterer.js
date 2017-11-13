/**
 * Positions and shows the icon.
 */
ClusterIcon.prototype.show = function() {
    if (this.div_) {
        var pos = this.getPosFromLatLng_(this.center_);
        this.div_.style.cssText = this.createCss(pos);
        // (Would like to use "width: inherit;" below, but doesn't work with MSIE)
        var markers = this.cluster_.markers_;
        var marker = markers[markers.length - 1];
        var topImgSrc = marker.getIcon().url;
        this.div_.innerHTML = "<img src='" + topImgSrc + "' style='position:absolute;top:17px;left:17px'>";
        
        var sumDiv = this.div_.ownerDocument.createElement("div");
        sumDiv.style.position = "absolute";
        sumDiv.style.top = "62px";
        sumDiv.style.left = "60px";
        sumDiv.style.minWidth = "15px";
        sumDiv.style.fontWeight = "bold";
        sumDiv.style.textAlign = "center";
        sumDiv.style.background = "white";
        sumDiv.style.boxShadow = "black 1px 1px 1.5px";
        sumDiv.style.padding = "2px";
        sumDiv.style.borderRadius = "7px";
        sumDiv.class = "icon-element-number";
        sumDiv.innerHTML = this.sums_.text;
        this.div_.appendChild(sumDiv);
        this.div_.title = this.cluster_.getMarkerClusterer().getTitle();
        this.div_.style.display = "";
    }
    this.visible_ = true;
};


/**
 * Hides the icon.
 */
ClusterIcon.prototype.hide = function() {
    if (this.div_) {
        this.div_.style.display = "none";
    }
    this.cluster_.infoWindow_.close();
    this.visible_ = false;
};


/**
 * Adds a marker to the cluster.
 *
 * @param {google.maps.Marker} marker The marker to be added.
 * @return {boolean} True if the marker was added.
 * @ignore
 */
Cluster.prototype.addMarker = function(marker) {
    var i;
    var mCount;
    var mz;
    if (this.isMarkerAlreadyAdded_(marker)) {
        return false;
    }

    // attach the cluster to the marker to test when a infowindow wants to open if it's for a marker alone or a cluster
    marker.cluster_ = this;

    if (!this.center_) {
        this.center_ = marker.getPosition();
        this.calculateBounds_();
    } else {
        if (this.averageCenter_) {
            var l = this.markers_.length + 1;
            var lat = (this.center_.lat() * (l - 1) + marker.getPosition().lat()) / l;
            var lng = (this.center_.lng() * (l - 1) + marker.getPosition().lng()) / l;
            this.center_ = new google.maps.LatLng(lat, lng);
            this.calculateBounds_();
        }
    }

    marker.isAdded = true;
    this.markers_.push(marker);
    mCount = this.markers_.length;
    mz = this.markerClusterer_.getMaxZoom();
    if (mz !== null && this.map_.getZoom() > mz) {
        // Zoomed in past max zoom, so show the marker.
        if (marker.getMap() !== this.map_) {
            marker.setMap(this.map_);
        }
    } else if (mCount < this.minClusterSize_) {
        // Min cluster size not reached so show the marker.
        if (marker.getMap() !== this.map_) {
            marker.setMap(this.map_);
        }
    } else if (mCount === this.minClusterSize_) {
        // Hide the markers that were showing.
        for (i = 0; i < mCount; i++) {
            this.markers_[i].setMap(null);
        }
    } else {
        marker.setMap(null);
    }

    this.updateIcon_();
    return true;
};


/**
 * Sets up the styles object.
 */
MarkerClusterer.prototype.setupStyles_ = function() {
    var i, size;
    if (this.styles_.length > 0) {
        return;
    }

    for (i = 0; i < this.imageSizes_.length; i++) {
        size = this.imageSizes_[i];
        this.styles_.push({
            url: this.imagePath_ + (i + 1) + this.imageExtension_,
            height: size,
            width: size
        });
    }
};


/**
 * Sets the icon styles to the appropriate element in the styles array.
 *
 * @param {ClusterIconInfo} sums The icon label text and styles index.
 */
ClusterIcon.prototype.useStyle = function(sums) {
    this.sums_ = sums;
    var index = Math.max(0, sums.index - 1);
    index = Math.min(this.styles_.length - 1, index);
    var style = this.styles_[index];
    this.url_ = style.url;
    this.height_ = style.height;
    this.width_ = style.width;
    this.anchor_ = style.anchor;
    this.anchorIcon_ = style.anchorIcon || [parseInt(this.height_ / 2, 10), parseInt(this.width_ / 2, 10)];
    this.textColor_ = style.textColor || "black";
    this.textSize_ = style.textSize || 11;
    this.textDecoration_ = style.textDecoration || "none";
    this.fontWeight_ = style.fontWeight || "bold";
    this.fontStyle_ = style.fontStyle || "normal";
    this.fontFamily_ = style.fontFamily || "Arial,sans-serif";
    this.backgroundPosition_ = "center";
    this.backgroundRepeat_ = "no-repeat";
}


Cluster.prototype.openInfoWindow = function(marker) {
    var markers = this.markers_;
    var mc = this.markerClusterer_;
    var infoWindow = this.infoWindow_;
    var clusters = mc.clusters_;

    // close any window still open
    for (var i = 0; i < clusters.length; i++) {
        clusters[i].infoWindow_.setMap(null);
    }

    //create InfoWindow content
    var content = document.createElement("div");
    content.style.paddingTop = "5px";
    var innerDiv = document.createElement("div");
    innerDiv.style.textAlign = "center"
    content.appendChild(innerDiv);

    var iwAlbum = document.createElement("div");
    var title = document.createElement("div");
    var description = document.createElement("div");
    var mediumImage = document.createElement("img");
    title.setAttribute("class", "iw-title");
    description.setAttribute("class", "iw-description");
    mediumImage.setAttribute("class", "iw-medium-img");

    innerDiv.appendChild(title);
    innerDiv.appendChild(description);
    innerDiv.appendChild(mediumImage);

    //define which image to display as medium image:
    // the one on top of the stack if many

    var markerIndex;

    if (!(typeof marker === "undefined")) {
        for (var i = 0; i < markers.length; i++) {
            if (marker === markers[i]) {
                markerIndex = i;
                //marker.item.scrollToStart(true);
                break;
            }
        }
    } else {
        markerIndex = markers.length - 1;
        var marker = markers[markerIndex];
        //marker.item.scrollToStart(true);
    }

    mediumImage.src = marker.item.opts.mediumImage;

    var map = this.map_;
    infoWindow.setMap(this.map_);

    if (markers.length > 1) {
        var tableDiv = document.createElement("div");
        tableDiv.style.width = "320px";
        tableDiv.style.height = "50px";
        tableDiv.style.paddingTop = "2px";
        var table = document.createElement("table");
        var tr = document.createElement("tr");
        innerDiv.appendChild(tableDiv);
        tableDiv.appendChild(table);
        tableDiv.style.overflow = "hidden";
        table.appendChild(tr);

        for (var i = 0; i < markers.length; i++) {
            var td = document.createElement("td");
            td.style.paddingLeft = '3px';
            var thumbnail = document.createElement("img");
            thumbnail.src = markers[i].getIcon().url;
            thumbnail.onclick = (function(j) {
                return function(e) {
                    var mediumImage = $("img.iw-medium-img");
                    var src = markers[j].item.opts.mediumImage;
                    mediumImage.attr("src", src);
                    mediumImage.attr("index", j);
                    //set the marker for mediumImage.onclick 
                    marker = markers[j];
                    //marker.item.scrollToStart(true)
                }
            })(i);
            tr.appendChild(td);
            td.appendChild(thumbnail)
        }

        var tableWidth = markers.length * 54;

        $(table).draggable({
            axis: "x",
            containment: [tableWidth, 0, tableWidth + 320, 55],
            grid: [53,53.5],
        });

        if (markers.length > 6) {

            var leftShadow = document.createElement("div");
            leftShadow.setAttribute("class", "drop-shadow-left");
            leftShadow.style.height = "57px";
            leftShadow.style.width = "5px";
            leftShadow.style.position = "relative";
            leftShadow.style.left = "0px";
            leftShadow.style.top = "-55px";
            tableDiv.appendChild(leftShadow);

            var rightShadow = document.createElement("div");
            rightShadow.setAttribute("class", "drop-shadow-right");
            rightShadow.style.height = "57px";
            rightShadow.style.width = "5px";
            rightShadow.style.position = "relative";
            rightShadow.style.left = "315px";
            rightShadow.style.top = "-115px";
            tableDiv.appendChild(rightShadow);
        }
    }

    infoWindow.setContent(content);
    infoWindow.setPosition(this.getCenter());
    infoWindow.open(map);

    $(".iw-medium-img").click(function() {});
};

// Constants

MarkerClusterer.CALCULATOR = function(markers, numStyles) {
    var index = 0;
    var count = markers.length.toString();
    index = count;
    index = Math.min(index, numStyles);
    return {
        text: count,
        index: index
    };
};


MarkerClusterer.IMAGE_PATH = "img/frame-";
MarkerClusterer.IMAGE_EXTENSION = ".png";
MarkerClusterer.IMAGE_SIZES = [84, 84, 84, 84];
