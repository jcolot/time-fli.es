/*!
 * Timemap.js
Copyright (C) 2012 Nick Rabinowitz, Julien Colot

//////////MIT LICENSE////////////////////////////////
Permission is hereby granted, free of charge,
to any person obtaining a copy of this software
and associated documentation files (the "Software"),
to deal in the Software without restriction,
including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software, and to permit 
persons to whom the Software is furnished to do so, 
subject to the following conditions:

The above copyright notice and this permission notice
shall be included in all copies or substantial 
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY 
OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT 
NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, 
ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//////////////////////////////////////////////////////

/**
 * @overview
 *
 * <p>Timemap.js is intended to sync a SIMILE Timeline with a google map.
 * Thanks to Jorn Clausen (http://www.oe-files.de) for initial concept and code.
 * Timemap.js is licensed under the MIT License (see <a href="../LICENSE.txt">LICENSE.txt</a>).</p>
 * <p><strong>Depends on:</strong>
 *         <a href="http://jquery.com">jQuery</a>,
 *         <a href="https://developers.google.com/maps/">google maps</a>,
 *         <a href="code.google.com/p/simile-widgets">SIMILE Timeline v1.2 - 2.3.1.</a>
 * </p>
 * <ul>
 *     <li><a href="http://code.google.com/p/timemap/">Project Homepage</a></li>
 *     <li><a href="http://groups.google.com/group/timemap-development">Discussion Group</a></li>
 *     <li><a href="../examples/index.html">Working Examples</a></li>
 * </ul>
 *
 * @name timemap.js
 * @author Nick Rabinowitz, (www.nickrabinowitz.com), Julien Colot (time-fli.es)
 * @version 2.2 (google_maps_only)
 */



(function(){
var
    // Will speed up references to window, and allows munging its name.
    window = this,
    // Will speed up references to undefined, and allows munging its name.
    undefined,
    // aliases for Timeline objects
    Timeline = window.Timeline, DateTime = Timeline.DateTime,
    // alias libraries
    $ = window.jQuery,
    Map = google.maps.Map,
    LatLng = google.maps.LatLng,
    LatLngBounds = google.maps.LatLngBounds,
    Marker = google.maps.Marker,
    MarkerImage = google.maps.MarkerImage,
    Point = google.maps.Point,
    Size = google.maps.Size,
    Polyline = google.maps.Polyline,
    InfoWindow = google.maps.InfoWindow,
    // events
    E_ITEMS_LOADED = 'itemsloaded',
    // Google icon path
    GIP = "http://www.google.com/intl/en_us/mapfiles/ms/icons/",
    // aliases for class names, allowing munging
    TimeMap, TimeMapFilterChain, TimeMapDataset, TimeMapTheme, TimeMapItem;

/*----------------------------------------------------------------------------
 * TimeMap Class
 *---------------------------------------------------------------------------*/
 
/**
 * @class
 * The TimeMap object holds references to timeline, map, and datasets.
 *
 * @constructor
 * This will create the visible map, but not the timeline, which must be initialized separately.
 *
 * @param {DOM Element} tElement                  The timeline element.
 * @param {DOM Element} mElement                  The map element.
 * @param {Object} [options]                      A container for optional arguments
 * @param {TimeMapTheme|String}[options.theme=red]
 *                                                Color theme for the timemap
 * @param {Boolean} [options.syncBands=true]      Whether to synchronize all bands in timeline
 * @param {LatLng} [options.mapCenter=0,0]        Point for map center
 * @param {Number} [options.mapZoom=0]            Initial map zoom level
 * @param {String} [options.mapTypeId=terrain]    The mapTypeId for the map 
 * @param {Function|String} [options.mapFilter={@link TimeMap.filters.hidePastFuture}]
                                                  How to hide/show map items depending on timeline state;
 *                                                options: keys in {@link TimeMap.filters} or function. Set to
 *                                                null or false for no filter.
 * @param {Boolean} [options.mapTypeIdControl=true]  
                                                  Whether to display the map type control
 * @param {Boolean} [options.zoomCtrl=true]       Whether to show map zoom control
 * @param {Boolean} [options.panCtrl=true]        Whether to show map panCtrl control
 * @param {Boolean} [options.streetViewCtrl=true] Whether to show Street View control
 * @param {Boolean} [options.centerMapOnItems=true] Whether to center and zoom the map based on loaded item
 * @param {Oject} [options.mapOptions]            Set map options as an object, as defined in google.maps api
                                                  , override all previous settings and allow to define all additional 
                                                  google maps settings
 * @param {String} [options.eventIconPath]        Path for directory holding event icons; if set at the TimeMap
 *                                                level, will override dataset and item defaults
 * @param {Boolean} [options.checkResize=true]    Whether to update the timemap display when the window is
 *                                                resized. Necessary for fluid layouts, but might be better set to
 *                                                false for absolutely-sized timemaps to avoid extra processing
 * @param {mixed} [options[...]]                  Any of the options for {@link TimeMapDataset},
 *                                                {@link TimeMapItem}, or {@link TimeMapTheme} may be set here,
 *                                                to cascade to the entire TimeMap, though they can be overridden
 *                                                at lower levels
 * @param {String} [options.mapId]                 DOM id, jQuery Object or node of the element to contain the map.
 *                                                Either this or mapSelector is required.
 * @param {String} [options.timelineId]            DOM id, jQuery Object or node of the element to contain the timeline.
 *                                                Either this or timelineSelector is required.
 * @param {String} [config.mapSelector]             jQuery selector for the element to contain the map.
 *                                                  Either this or mapId is required.
 * @param {String} [config.timelineSelector]        jQuery selector for the element to contain the timeline.
 *                                                  Either this or timelineId is required.
 * @param {Object} [options.options]                 Options for the TimeMap object (see the {@link TimeMap} constructor)
 * @param {Object[]} options.datasets                Array of datasets to load
 * @param {Object} options.datasets[x]               Configuration options for a particular dataset
 * @param {Object} options.datasets[x].options       Options for the loader. See the {@link TimeMap.loaders.base}
 *                                                  constructor and the constructors for the various loaders for
 *                                                  more details.
 * @param {String} [options.datasets[x].id]          Optional id for the dataset in the {@link TimeMap#datasets}
 *                                                  object, for future reference; otherwise "ds"+x is used
 * @param {String} [options.datasets[x][...]]        Other options for the {@link TimeMapDataset} object
 * @param {String|Array} [options.bandIntervals=wk]  Intervals for the two default timeline bands. Can either be an
 *                                                  array of interval constants or a key in {@link TimeMap.intervals}
 * @param {Object[]} [options.bandInfo]              Array of configuration objects for Timeline bands, to be passed to
 *                                                  Timeline.createBandInfo (see the <a href="http://code.google.com/p/simile-widgets/wiki/Timeline_GettingStarted">Timeline Getting Started tutorial</a>).
 *                                                  This will override config.bandIntervals, if provided.
 * @param {Timeline.Band[]} [options.bands]          Array of instantiated Timeline Band objects. This will override
 *                                                  config.bandIntervals and config.bandInfo, if provided.
 * @param {String|Date} [options.scrollTo=earliest]  Date to scroll to once data is loaded - see
 *                                                  {@link TimeMap.parseDate} for options
 * @return {TimeMap}                                The initialized TimeMap object
 *
 * </pre>
 */
TimeMap = function(options) {

    var tm = this,
    err = "TimeMap.init: Either %Id or %Selector is required", 
        // set defaults for options
        defaults = {
            mapCenter:          new LatLng(0,0),
            mapZoom:            0,
            mapTypeId:          'roadmap',
            mapTypeIdControl:   true,
            panControl:         true,
            zoomControl:        true,
            streetViewControl:  true,
            mapOptions:         null,
            syncBands:          true,
            mapFilter:          'hidePastFuture',
            centerOnItems:      true,
            theme:              'red',
            dateParser:         'hybrid',
            checkResize:        true,
            selected:           -1,
            datasets:       [],
            bands:          false,
            bandInfo:       false,
            bandIntervals:  "wk",
            scrollTo:       "earliest"
        },

        state = TimeMap.state,
        intervals, tm,
        datasets = [], x, dsOptions, topOptions, dsId,
        bands = [], eventSource;

      // get DOM element selectors
    options.mapSelector = options.mapSelector || '#' + options.mapId;
    options.timelineSelector = options.timelineSelector || '#' + options.timelineId;
   
    // get state from url hash if state functions are available
    if (state) {
        state.setOptionsFromUrl(options);
    }
    // merge options and defaults
    options = $.extend(defaults, options);

    if (!options.bandInfo && !options.bands) {
        // allow intervals to be specified by key
        intervals = util.lookup(options.bandIntervals, TimeMap.intervals);
        // make default band info
        options.bandInfo = [
            {
                width:          "80%",
                intervalUnit:   intervals[0],
                intervalPixels: 70
            },
            {
                width:          "20%",
                intervalUnit:   intervals[1],
                intervalPixels: 100,
                showEventText:  false,
                overview:       true,
                trackHeight:    0.4,
                trackGap:       0.2
            }
        ];
    }

    tm.eventSource = eventSource = new Timeline.DefaultEventSource();
    // check for pre-initialized bands (manually created with Timeline.createBandInfo())
    if (options.bands) {
        options.bands.forEach(function(band) {
            // substitute dataset event source
            // assume that these have been set up like "normal" Timeline bands:
            // with an empty event source if events are desired, and null otherwise
            if (band.eventSource !== null) {
                band.eventSource = eventSource;
            }
        });
        bands = config.bands;
    }
    // otherwise, make bands from band info
    else {
        options.bandInfo.forEach(function(bandInfo, x) {
            // if eventSource is explicitly set to null or false, ignore
            if (!(('eventSource' in bandInfo) && !bandInfo.eventSource)) {
                bandInfo.eventSource = eventSource;
            }
            else {
                bandInfo.eventSource = null;
            }
            bands[x] = Timeline.createBandInfo(bandInfo);
            if (x > 0 && util.TimelineVersion() == "1.2") {
                // set all to the same layout
                bands[x].eventPainter.setLayout(bands[0].eventPainter.getLayout());
            }
        });
    }
    // initialize timeline
   
    // save DOM elements
    /**
     * Map element
     * @name TimeMap#mElement
     * @type DOM Element
     */
    tm.mElement = $(options.mapSelector).get(0);

    /**
     * Timeline element
     * @name TimeMap#tElement
     * @type DOM Element
     */
    tm.tElement = $(options.timelineSelector).get(0);
   
    /**
     * Map of datasets
     * @name TimeMap#datasets
     * @type Object
     */
    tm.datasets = {};
    /**
     * Filter chains for this timemap
     * @name TimeMap#chains
     * @type Object
     */
    tm.chains = {};
   
    /**
     * Container for optional settings passed in the "options" parameter
     * @name TimeMap#opts
     * @type Object
     */
    tm.opts = options = $.extend(defaults, options);
   
    // allow map center to be specified as a point object
    mapCenter = options.mapCenter;
    if (mapCenter.constructor != LatLng && mapCenter.lat) {
        options.mapCenter = new LatLng(mapCenter.lat, mapCenter.lng);
    }
    // allow map filters to be specified by key
    options.mapFilter = util.lookup(options.mapFilter, TimeMap.filters);
    // allow theme options to be specified in options
    options.theme = TimeMapTheme.create(options.theme, options);
   
    // initialize timeline and map
    tm.initMap();
    tm.initTimeline(bands);
    return tm;
};

// STATIC FIELDS

/**
 * Current library version.
 * @constant
 * @type String
 */
TimeMap.version = "2.2_jc33";

/**
 * @name TimeMap.util
 * @namespace
 * Namespace for TimeMap utility functions.
 */
var util = TimeMap.util = {};

// STATIC METHODS


TimeMap.prototype = {

    /**
     *
     * Initialize the map.
     */
    initMap: function() {
        var tm = this,
            options = tm.opts,
            map, i;
       
        /**
         * @name TimeMap#map
         */

        // display the map centered on a latitude and longitude
       
        // set default controls and map type
        if (!options.mapOptions) {
             var mapOptions = {
                 panControl: options.panControl,
                 zoomControl: options.zoomControl,
                 mapTypeControl: options.mapTypeControl,
                 streetViewControl: options.streetViewControl,
                 mapTypeId: options.mapTypeId,
                 center: options.mapCenter,
                 zoom: options.mapZoom
             };
        } else {
            var mapOptions = options.mapOptions;
        }

        tm.map = map = new Map(tm.mElement, mapOptions);

        //options for the MarkerClusterer
        mcOptions = {
            averageCenter: true,
            minimumClusterSize: 1,
            zoomOnClick: false
        };
        
        // create a Marker Clusterer (depends on markerclusterer.js)
        tm.map.markerClusterer = new MarkerClusterer(map, null, mcOptions);
    },

    /**
     * Initialize the timeline - this must happen separately to allow full control of
     * timeline properties.
     *
     * @param {BandInfo Array} bands    Array of band information objects for timeline
     */
    initTimeline: function(bands) {
        var tm = this, timeline,
            opts = tm.opts,
            // filter: hide when item is hidden
            itemVisible = function(item) {
                return item.visible;
            },
            // filter: hide when dataset is hidden
            datasetVisible = function(item) {
                return item.dataset.visible;
            },
            // handler to open item window
            eventClickHandler = function(x, y, evt) {
                if ($.isArray(evt)){
                    evt[0].item.openInfoWindow();
                } else {
                    evt.item.openInfoWindow();
                }
            },
            resizeTimerID, x, painter;
       
        // synchronize & highlight timeline bands
        for (x=1; x < bands.length; x++) {
            if (opts.syncBands) {
                bands[x].syncWith = 0;
            }
            bands[x].highlight = true;
        }
       
        /**
         * The associated timeline object
         * @name TimeMap#timeline
         * @type Timeline
         */

        tm.timeline = timeline = Timeline.create(tm.tElement, bands);

        // hijack timeline popup window to open info window
        for (x=0; x < timeline.getBandCount(); x++) {
            painter = timeline.getBand(x).getEventPainter().constructor;
            painter.prototype._showBubble = eventClickHandler;
        }
       
        // filter chain for map markers
        tm.addFilterChain("map",
            // on
            function(item) {
                item.showMarker();
            },
            // off
            function(item) {
                item.hideMarker();
            },
            // pre/post
            null, null,
            // initial chain
            [itemVisible, datasetVisible]
        );
       
        // filter: hide map items depending on timeline state
        if (opts.mapFilter) {
            tm.addFilter("map", opts.mapFilter);
            // update map on timeline scroll
            // JC33 : wait for the clustering to complete
            google.maps.event.addListener(tm.map.markerClusterer, "clusteringend",
                function() {
                    timeline.getBand(0).addListener("scroll", 
                        function() {
                            tm.filter("map");
                        }
                    )
                }
            );
        }
       
        // filter chain for timeline events
        tm.addFilterChain("timeline",
            // on
            function(item) {
                item.showEvent();
            },
            // off
            function(item) {
                item.hideEvent();
            },
            // pre
            null,
            // post
            function() {
                // XXX: needed if we go to Timeline filtering?
                tm.eventSource._events._index();
                timeline.layout();
            },
            // initial chain
            [itemVisible, datasetVisible]
        );
       
        // filter: hide timeline items depending on map state
        if (opts.timelineFilter) {
            tm.addFilter("map", opts.timelineFilter);
        }
       
        // add callback for window resize, if necessary
        if (opts.checkResize) {
            window.onresize = function() {
                if (!resizeTimerID) {
                    resizeTimerID = window.setTimeout(function() {
                        resizeTimerID = null;
                        timeline.layout();
                    }, 500);
                }
            };
        }
    },

    /**
     * Parse a date in the context of the timeline. Uses the standard parser
     * ({@link TimeMap.dateParsers.hybrid}) but accepts "now", "earliest",
     * "latest", "first", and "last" (referring to loaded events)
     *
     * @param {String|Date} s   String (or date) to parse
     * @return {Date}           Parsed date
     */
    parseDate: function(s) {
        var d = new Date(),
            eventSource = this.eventSource,
            parser = TimeMap.dateParsers.hybrid,
            // make sure there are events to scroll to
            hasEvents = eventSource.getCount() > 0 ? true : false;
        switch (s) {
            case "now":
                break;
            case "earliest":
            case "first":
                if (hasEvents) {
                    d = eventSource.getEarliestDate();
                }
                break;
            case "latest":
            case "last":
                if (hasEvents) {
                    d = eventSource.getLatestDate();
                }
                break;
            default:
                // assume it's a date, try to parse
                d = parser(s);
        }
        return d;
    },

    /**
     * Scroll the timeline to a given date. If lazyLayout is specified, this function
     * will also call timeline.layout(), but only if it won't be called by the
     * onScroll listener. This involves a certain amount of reverse engineering,
     * and may not be future-proof.
     *
     * @param {String|Date} d           Date to scroll to (either a date object, a
     *                                  date string, or one of the strings accepted
     *                                  by TimeMap#parseDate)
     * @param {Boolean} [lazyLayout]    Whether to call timeline.layout() if not
     *                                  required by the scroll.
     * @param {Boolean} [animated]      Whether to do an animated scroll, rather than a jump.
     */
    scrollToDate: function(d, lazyLayout, animated) {
        var timeline = this.timeline,
            topband = timeline.getBand(0),
            x, time, layouts = [],
            band, minTime, maxTime;
        d = this.parseDate(d);
        if (d) {
            time = d.getTime();
            // check which bands will need layout after scroll
            for (x=0; x < timeline.getBandCount(); x++) {
                band = timeline.getBand(x);
                minTime = band.getMinDate().getTime();
                maxTime = band.getMaxDate().getTime();
                layouts[x] = (lazyLayout && time > minTime && time < maxTime);
            }
            // do scroll
            if (animated) {
                // create animation
                    a = Timeline.Graphics.createAnimation(function(abs, diff) {
                        topband.setCenterVisibleDate(new Date(abs));
                    }, topband.getCenterVisibleDate().getTime(), time, 1000);
                a.run();
            }
            else {
                topband.setCenterVisibleDate(d);
            }
            // layout as necessary
            for (x=0; x < layouts.length; x++) {
                if (layouts[x]) {
                    timeline.getBand(x).layout();
                }
            }
        }
        // layout if requested even if no date is found
        else if (lazyLayout) {
            timeline.layout();
        }
    },

    /**
     * Create an empty dataset object and add it to the timemap
     *
     * @param {String} id           The id of the dataset
     * @param {Object} options      A container for optional arguments for dataset constructor -
     *                              see the options passed to {@link TimeMapDataset}
     * @return {TimeMapDataset}     The new dataset object    
     */
    createDataset: function(id, options) {
        var tm = this,
            dataset = new TimeMapDataset(tm, options);
        tm.datasets[id] = dataset;
        // add event listener
        if (tm.opts.centerOnItems) {
            var map = tm.map;
            $(dataset).bind(E_ITEMS_LOADED, function() {
                // determine the center and zoom level from the bounds
                tm.autoCenterAndZoom();
            });
        }
        return dataset;
    },

    /**
     * Run a function on each dataset in the timemap. This is the preferred
     * iteration method, as it allows for future iterator options.
     *
     * @param {Function} f    The function to run, taking one dataset as an argument
     */
    each: function(f) {
        var tm = this,
            id;
        for (id in tm.datasets) {
            if (tm.datasets.hasOwnProperty(id)) {
                f(tm.datasets[id]);
            }
        }
    },

    /**
     * Run a function on each item in each dataset in the timemap.
     * @param {Function} f    The function to run, taking one item as an argument
     */
    eachItem: function(f) {
        this.each(function(ds) {
            ds.each(function(item) {
                f(item);
            });
        });
    },

    /**
     * Get all items from all datasets.
     * @return {TimeMapItem[]}  Array of all items
     */
    getItems: function() {
        var items = [];
        this.each(function(ds) {
            items = items.concat(ds.items);
        });
        return items;
    },
   
    /**
     * Find the index of an item in the current array of items
     * @param {TimeMapItem} item    Item to find
     */
    getIndex: function(item) {
        return this.getItems().indexOf(item);
    },
   
    /**
     * Save the index of the currently selected item
     * @param {TimeMapItem} item    Item to select
     */
    setSelected: function(item) {
        this.opts.selected = this.getIndex(item);
    },
   
    /**
     * Get the index of the currently selected item
     * @return {Number} Index of selected item
     */
    getSelected: function() {
        return this.opts.selected;
    },
   
    /**
     * Get the currently selected item
     * @return {TimeMapItem} item    Selected item
     */
    getSelectedItem: function() {
        var tm = this,
            sel = tm.getSelected();
        return sel >= 0 ? tm.getItems()[sel] : null;
    },
   
    // Helper functions for dealing with filters
   
    /**
     * Update items, hiding or showing according to filters
     * @param {String} chainId  Filter chain to update on
     */
    filter: function(chainId) {
        var fc = this.chains[chainId];
        if (fc) {
            fc.run();
        }  
    },

    /**
     * Add a new filter chain
     *
     * @param {String} chainId      Id of the filter chain
     * @param {Function} fon        Function to run on an item if filter is true
     * @param {Function} foff       Function to run on an item if filter is false
     * @param {Function} [pre]      Function to run before the filter runs
     * @param {Function} [post]     Function to run after the filter runs
     * @param {Function[]} [chain]  Optional initial filter chain
     */
    addFilterChain: function(chainId, fon, foff, pre, post, chain) {
        this.chains[chainId] = new TimeMapFilterChain(this, fon, foff, pre, post, chain);
    },

    /**
     * Remove a filter chain
     *
     * @param {String} chainId  Id of the filter chain
     */
    removeFilterChain: function(chainId) {
        delete this.chains[chainId];
    },

    /**
     * Add a function to a filter chain
     *
     * @param {String} chainId  Id of the filter chain
     * @param {Function} f      Function to add
     */
    addFilter: function(chainId, f) {
        var fc = this.chains[chainId];
        if (fc) {
            fc.add(f);
        }
    },

    /**
     * Remove a function from a filter chain
     *
     * @param {String} chainId  Id of the filter chain
     * @param {Function} [f]    The function to remove
     */
    removeFilter: function(chainId, f) {
        var fc = this.chains[chainId];
        if (fc) {
            fc.remove(f);
        }
    },

    /**
     * autoCenterAndZoom sets the center and zoom of the map to the smallest bounding box
     * containing all markers
     * @param {Object} [dataset]    The dataset to center the map on
     */
    autoCenterAndZoom:  function(dataset) {
        if (dataset == undefined){
            $.each(this.datasets, function(){
                this.timemap.autoCenterAndZoom(this);
                if (this.timemap.datasets.length == 0) {
                    var center = this.opts.mapCenter || this.opts.mapOptions.center;
                    var zoom = this.opts.mapZoom || this.opts.mapOptions.zoom;
                    this.timemap.map.setCenter(center); 
                    this.timemap.map.setZoom(zoom); 
                }
            });
            return;
        }
        
        if (! $.isArray(dataset.items) || dataset.items.length == 0) {
            return false;
        }

        var bounds = new LatLngBounds();
        var notype = true;

        for (var i = 0; i < dataset.items.length; i++) {
            var type = dataset.items[i].getType();
            if (type == "marker") {
                notype = false;
                bounds.extend(dataset.items[i].marker.getPosition());
            } else if (type == "polyline" || type == "polygon") {
                notype = false;
                var points = dataset.items[i].marker.points;
                for (var j = 0; j < points.length; j++) {
                            bounds.extend(points[j]);
                };
            };
        };

        if (notype == true) {
            return false;
        }

        // JC33: Let's be a bit conservative:
        var ne = new google.maps.LatLng(
            2 * bounds.getNorthEast().lat() - bounds.getCenter().lat(),
            2 * bounds.getNorthEast().lng() - bounds.getNorthEast().lng()
        );

        var sw = new google.maps.LatLng(
            2 * bounds.getSouthWest().lat() -  bounds.getCenter().lat(),
            2 * bounds.getSouthWest().lng() - bounds.getCenter().lng()
        );        

        bounds.extend(ne);
        bounds.extend(sw);

        this.map.fitBounds(bounds);

    }

};

 
/**
 * @class
 * TimeMapFilterChain holds a set of filters to apply to the map or timeline.
 *
 * @constructor
 * @param {TimeMap} timemap     Reference to the timemap object
 * @param {Function} fon        Function to run on an item if filter is true
 * @param {Function} foff       Function to run on an item if filter is false
 * @param {Function} [pre]      Function to run before the filter runs
 * @param {Function} [post]     Function to run after the filter runs
 * @param {Function[]} [chain]  Optional initial filter chain
 */
TimeMapFilterChain = function(timemap, fon, foff, pre, post, chain) {
    var fc = this,
        dummy = $.noop;
    /**
     * Reference to parent TimeMap
     * @name TimeMapFilterChain#timemap
     * @type TimeMap
     */
    fc.timemap = timemap;
   
    /**
     * Chain of filter functions, each taking an item and returning a boolean
     * @name TimeMapFilterChain#chain
     * @type Function[]
     */
    fc.chain = chain || [];
   
    /**
     * Function to run on an item if filter is true
     * @name TimeMapFilterChain#on
     * @function
     */
    fc.on = fon || dummy;
   
    /**
     * Function to run on an item if filter is false
     * @name TimeMapFilterChain#off
     * @function
     */
    fc.off = foff || dummy;
   
    /**
     * Function to run before the filter runs
     * @name TimeMapFilterChain#pre
     * @function
     */
    fc.pre = pre || dummy;
   
    /**
     * Function to run after the filter runs
     * @name TimeMapFilterChain#post
     * @function
     */
    fc.post = post || dummy;
};

// METHODS

TimeMapFilterChain.prototype = {

    /**
     * Add a filter to the filter chain.
     * @param {Function} f      Function to add
     */
    add: function(f) {
        return this.chain.push(f);
    },

    /**
     * Remove a filter from the filter chain
     * @param {Function} [f]    Function to remove; if not supplied, the last filter
     *                          added is removed
     */
    remove: function(f) {
        var chain = this.chain,
            i = f ? chain.indexOf(f) : chain.length - 1;
        // remove specific filter or last if none specified
        return chain.splice(i, 1);
    },

    /**
     * Run filters on all items
     */
    run: function() {
        var fc = this,
            chain = fc.chain;
        // early exit
        if (!chain.length) {
            return;
        }
        // pre-filter function
        fc.pre();
        // run items through filter
        fc.timemap.eachItem(function(item) {
            var done,
                i = chain.length;
            L: while (!done) {
                while (i--) {
                    if (!chain[i](item)) {
                        // false condition
                        fc.off(item);
                        break L;
                    }
                }
                // true condition
                fc.on(item);
                done = true;
            }
        });
        // post-filter function
        fc.post();
    }
   
};

/**
 * @namespace
 * Namespace for different filter functions. Adding new filters to this
 * namespace allows them to be specified by string name.
 * @example
    TimeMap.init({
        options: {
            mapFilter: "hideFuture"
        },
        // etc...
    });
 */
TimeMap.filters = {

    /**
     * Static filter function: Hide items not in the visible area of the timeline.
     *
     * @param {TimeMapItem} item    Item to test for filter
     * @return {Boolean}            Whether to show the item
     */
    hidePastFuture: function(item) {
        var topband = item.timeline.getBand(0),
            maxVisibleDate = topband.getMaxVisibleDate().getTime(),
            minVisibleDate = topband.getMinVisibleDate().getTime(),
            itemStart = item.getStart().getTime(),
            itemEnd = item.getEnd().getTime();
        if (itemStart !== undefined) {
            // hide items in the future
            return itemStart < maxVisibleDate &&
                // hide items in the past
                (itemEnd > minVisibleDate || itemStart > minVisibleDate);
        }
        return true;
    },

    /**
     * Static filter function: Hide items later than the visible area of the timeline.
     *
     * @param {TimeMapItem} item    Item to test for filter
     * @return {Boolean}            Whether to show the item
     */
    hideFuture: function(item) {
        var maxVisibleDate = item.timeline.getBand(0).getMaxVisibleDate().getTime(),
            itemStart = item.getStartTime();
        if (itemStart !== undefined) {
            // hide items in the future
            return itemStart < maxVisibleDate;
        }
        return true;
    },

    /**
     * Static filter function: Hide items not present at the exact
     * center date of the timeline (will only work for duration events).
     *
     * @param {TimeMapItem} item    Item to test for filter
     * @return {Boolean}            Whether to show the item
     */
    showMomentOnly: function(item) {
        var topband = item.timeline.getBand(0),
            momentDate = topband.getCenterVisibleDate().getTime(),
            itemStart = item.getStartTime(),
            itemEnd = item.getEndTime();
        if (itemStart !== undefined) {
            // hide items in the future
            return itemStart < momentDate &&
                // hide items in the past
                (itemEnd > momentDate || itemStart > momentDate);
        }
        return true;
    }

};


/*----------------------------------------------------------------------------
 * TimeMapDataset Class
 *---------------------------------------------------------------------------*/

/**
 * @class
 * The TimeMapDataset object holds an array of items and dataset-level
 * options and settings, including visual themes.
 *
 * @constructor
 * @param {TimeMap} timemap         Reference to the timemap object
 * @param {Object} [options]        Object holding optional arguments
 * @param {String} [options.id]                     Key for this dataset in the datasets map
 * @param {String} [options.title]                  Title of the dataset (for the legend)
 * @param {String} [options.eventSource]            Eventsource
 * @param {String|TimeMapTheme} [options.theme]     Theme settings
 * @param {String|Function} [options.dateParser]    Function to replace default date parser
 * @param {Boolean} [options.noEventLoad=false]     Whether to skip loading events on the timeline
 * @param {Boolean} [options.noMarkerLoad=false] Whether to skip loading markers on the map
 * @param {String} [options.infoTemplate]       HTML for the info window content, with variable expressions
 *                                              (as "{{varname}}" by default) to be replaced by option data
 * @param {String} [options.templatePattern]    Regex pattern defining variable syntax in the infoTemplate
 * @param {mixed} [options[...]]                Any of the options for {@link TimeMapItem} or
 *                                              {@link TimeMapTheme} may be set here, to cascade to
 *                                              the dataset's objects, though they can be
 *                                              overridden at the TimeMapItem level
 */
TimeMapDataset = function(timemap, options) {
    var ds = this;

    /**
     * Reference to parent TimeMap
     * @name TimeMapDataset#timemap
     * @type TimeMap
     */
    ds.timemap = timemap;
   
    /**
     * EventSource for timeline events
     * @name TimeMapDataset#eventSource
     * @type Timeline.EventSource
     */
    ds.eventSource = new Timeline.DefaultEventSource();
   
    /**
     * Array of item's data
     * @name TimeMapDataset#data
     * @type Array
     */
    ds.dataCache = options.dataCache || [];
   
    /**
     * Array of child TimeMapItems
     * @name TimeMapDataset#items
     * @type Array
     */
    ds.items = [];
   
    /**
     * Whether the dataset is visible
     * @name TimeMapDataset#visible
     * @type Boolean
     */
    ds.visible = true;
       
    /**
     * Container for optional settings passed in the "options" parameter
     * @name TimeMapDataset#opts
     * @type Object
     */
    ds.opts = options = $.extend({}, timemap.opts, options);
    
    ds.eventSource = options.eventSource || ds.eventSource;
    // allow date parser to be specified by key
    options.dateParser = util.lookup(options.dateParser, TimeMap.dateParsers);
    // allow theme options to be specified in options
    options.theme = TimeMapTheme.create(options.theme, options);
};

TimeMapDataset.prototype = {
   
    /**
     * Return an array of this dataset's items
     * @param {Number} [index]     Index of single item to return
     * @return {TimeMapItem[]}  Single item, or array of all items if no index was supplied
     */
    getItems: function(index) {
        var items = this.items;
        return index === undefined ? items :
            index in items ? items[index] : null;
    },
   
    /**
     * Return the title of the dataset
     * @return {String}     Dataset title
     */
    getTitle: function() {
        return this.opts.title;
    },

    /**
     * Run a function on each item in the dataset. This is the preferred
     * iteration method, as it allows for future iterator options.
     *
     * @param {Function} f    The function to run
     */
    each: function(f) {
        this.items.forEach(f);
    },

    /**
     * Add an array of items to the map and timeline.
     *
     * @param {Object[]} data           Array of data to be loaded
     * @param {Function} [transform]    Function to transform data before loading
     * @see TimeMapDataset#loadItem
     */
    loadItems: function(data, transform, cacheData) {
        if (data) {
            var ds = this;
            data.forEach(function(item) {
                ds.loadItem(item, transform, cacheData);
            });
            $(ds).trigger(E_ITEMS_LOADED);
        }
    },

    /**
     * Add one item to map and timeline.
     * Each item has both a timeline event and a map marker.
     *
     * @param {Object} data         Data to be loaded - see the {@link TimeMapItem} constructor for details
     * @param {Function} [transform]        If data is not in the above format, transformation function to make it so
     * @return {TimeMapItem}                The created item (for convenience, as it's already been added)
     * @see TimeMapItem
     */
    loadItem: function(data, transform, cacheData) {
        // apply transformation, if any
        if (transform) {
            data = transform(data);
        }
        // By default, cache data
        if (cacheData === undefined) {
            cacheData = true;
        }
        // transform functions can return a false value to skip a datum in the set
        if (data) {
            // create new item, cascading options
            var ds = this, item;
            var diff = {};
            // if data is already cached, no need to add it twice
            if (cacheData) {ds.dataCache.push(data)};
            data.options = $.extend({}, ds.opts, {title:null}, data.options);
            item = new TimeMapItem(data, ds);
            item.dataCache = data;
            // add the item to the dataset
            ds.items.push(item);
            // return the item object
            return item;
        }
    }

};

/*----------------------------------------------------------------------------
 * TimeMapTheme Class
 *---------------------------------------------------------------------------*/

/**
 * @class
 * Predefined visual themes for datasets, defining colors and images for
 * map markers and timeline events. Note that theme is only used at creation
 * time - updating the theme of an existing object won't do anything.
 *
 * @constructor
 * @param {Object} [options]        A container for optional arguments
 * @param {String} [options.icon=http://www.google.com/intl/en_us/mapfiles/ms/icons/red-dot.png]
 *                                                      Icon image for marker markers
 * @param {Number[]} [options.iconSize=[32,32]]         Array of two integers indicating marker icon size as
 *                                                      [width, height] in pixels
 * @param {String} [options.iconShadow=http://www.google.com/intl/en_us/mapfiles/ms/icons/msmarker.shadow.png]
 *                                                      Icon image for marker markers
 * @param {Number[]} [options.iconShadowSize=[59,32]]   Array of two integers indicating marker icon shadow
 *                                                      size as [width, height] in pixels
 * @param {Number[]} [options.iconAnchor=[16,33]]       Array of two integers indicating marker icon anchor
 *                                                      point as [xoffset, yoffset] in pixels
 * @param {String} [options.color=#FE766A]              Default color in hex for events, polylines, polygons.
 * @param {String} [options.lineColor=color]            Color for polylines/polygons.
 * @param {Number} [options.lineOpacity=1]              Opacity for polylines/polygons.
 * @param {Number} [options.lineWeight=2]               Line weight in pixels for polylines/polygons.
 * @param {String} [options.fillColor=color]            Color for polygon fill.
 * @param {String} [options.fillOpacity=0.25]           Opacity for polygon fill.
 * @param {String} [options.eventColor=color]           Background color for duration events.
 * @param {String} [options.eventTextColor=null]        Text color for events (null=Timeline default).
 * @param {String} [options.eventIconPath=timemap/images/]  Path to instant event icon directory.
 * @param {String} [options.eventIconImage=red-circle.gif]  Filename of instant event icon image.
 * @param {URL} [options.eventIcon=eventIconPath+eventIconImage] URL for instant event icons.
 * @param {Boolean} [options.classicTape=false]         Whether to use the "classic" style timeline event tape
 *                                                      (needs additional css to work - see examples/artists.html).
 */
TimeMapTheme = function(options) {

    // work out various defaults - the default theme is Google's reddish color
    var defaults = {
        /** Default color in hex
         * @name TimeMapTheme#color
         * @type String */
        color:          "#FE766A",
        /** Opacity for polylines/polygons
         * @name TimeMapTheme#lineOpacity
         * @type Number */
        lineOpacity:    1,
        /** Line weight in pixels for polylines/polygons
         * @name TimeMapTheme#lineWeight
         * @type Number */
        lineWeight:     2,
        /** Opacity for polygon fill
         * @name TimeMapTheme#fillOpacity
         * @type Number */
        fillOpacity:    0.4,
        /** Text color for duration events
         * @name TimeMapTheme#eventTextColor
         * @type String */
        eventTextColor: null,
        /** Path to instant event icon directory
         * @name TimeMapTheme#eventIconPath
         * @type String */
        eventIconPath:  "",
        /** Filename of instant event icon image
         * @name TimeMapTheme#eventIconImage
         * @type String */
        eventIconImage: "red-circle.png",
        /** Whether to use the "classic" style timeline event tape
         * @name TimeMapTheme#classicTape
         * @type Boolean */
        classicTape:    false,
        /** Icon image for marker markers
         * @name TimeMapTheme#icon
         * @type String */
        icon:      GIP + "red-dot.png",
        /** Icon size for marker markers
         * @name TimeMapTheme#iconSize
         * @type Number[] */
        iconSize: [50, 50],
        /** Icon shadow image for marker markers
         * @name TimeMapTheme#iconShadow
         * @type String */
        iconShadow: GIP + "msmarker.shadow.png",
        /** Icon shadow size for marker markers
         * @name TimeMapTheme#iconShadowSize
         * @type Number[] */
        iconShadowSize: [59, 32],
        /** Icon anchor for marker markers
         * @name TimeMapTheme#iconAnchor
         * @type Number[] */
        iconAnchor: [16, 33]
    };
   
    // merge defaults with options
    var settings = $.extend(defaults, options);
   
    // cascade some settings as defaults
    defaults = {
        /** Line color for polylines/polygons
         * @name TimeMapTheme#lineColor
         * @type String */
        lineColor:          settings.color,
        /** Fill color for polygons
         * @name TimeMapTheme#fillColor
         * @type String */
        fillColor:          settings.color,
        /** Background color for duration events
         * @name TimeMapTheme#eventColor
         * @type String */
        eventColor:         settings.color,
        /** Full URL for instant event icons
         * @name TimeMapTheme#eventIcon
         * @type String */
        eventIcon:          settings.eventIcon || settings.eventIconPath + settings.eventIconImage
    };
   
    // return configured options as theme
    return $.extend(defaults, settings);
};

/**
 * Create a theme, based on an optional new or pre-set theme
 *
 * @param {TimeMapTheme|String} [theme] Existing theme to clone, or string key in {@link TimeMap.themes}
 * @param {Object} [options]            Optional settings to overwrite - see {@link TimeMapTheme}
 * @return {TimeMapTheme}               Configured theme
 */
TimeMapTheme.create = function(theme, options) {
    // test for string matches and missing themes
    theme = util.lookup(theme, TimeMap.themes);
    if (!theme) {
        return new TimeMapTheme(options);
    }
    if (options) {
        // see if we need to clone - guessing fewer keys in options
        var clone = false, key;
        for (key in options) {
            if (theme.hasOwnProperty(key)) {
                clone = {};
                break;
            }
        }
        // clone if necessary
        if (clone) {
            for (key in theme) {
                if (theme.hasOwnProperty(key)) {
                    clone[key] = options[key] || theme[key];
                }
            }
            // fix event icon path, allowing full image path in options
            clone.eventIcon = options.eventIcon ||
                clone.eventIconPath + clone.eventIconImage;
            return clone;
        }
    }
    return theme;
};


/*----------------------------------------------------------------------------
 * TimeMapItem Class
 *---------------------------------------------------------------------------*/

/**
 * @class
 * The TimeMapItem object holds references to one or more map markers and
 * an associated timeline event.
 *
 * @constructor
 * @param {String} data             Object containing all item data
 * @param {String} [data.title=""] Title of the item (visible on timeline)
 * @param {String|Date} [data.start]    Start time of the event on the timeline
 * @param {String|Date} [data.end]      End time of the event on the timeline (duration events only)
 * @param {Object} [data.point]         Data for a single-point marker:
 * @param {Float} [data.point.lat]          Latitude of map marker
 * @param {Float} [data.point.lng]          Longitude of map marker
 * @param {Object[]} [data.polyline]    Data for a polyline marker, as an array in "point" format
 * @param {Object[]} [data.polygon]     Data for a polygon marker, as an array "point" format
 * @param {Object} [data.overlay]       Data for a ground overlay:
 * @param {String} [data.overlay.image]     URL of image to overlay
 * @param {Float} [data.overlay.north]      Northern latitude of the overlay
 * @param {Float} [data.overlay.south]      Southern latitude of the overlay
 * @param {Float} [data.overlay.east]       Eastern longitude of the overlay
 * @param {Float} [data.overlay.west]       Western longitude of the overlay
 * @param {Object[]} [data.markers]  Array of markers, e.g. [{point:{...}}, {polyline:[...]}]
 * @param {Object} [data.options]       A container for optional arguments
 * @param {String} [data.options.description]       Plain-text description of the item
 * @param {LatLng} [data.options.infoPoint]    Point indicating the center of this item
 * @param {String} [data.options.infoHTML]          Full HTML for the info window
 * @param {String} [data.options.infoUrl]           URL from which to retrieve full HTML for the info window
 * @param {String} [data.options.infoTemplate]      HTML for the info window content, with variable expressions
 *                                                  (as "{{varname}}" by default) to be replaced by option data
 * @param {String} [data.options.templatePattern=/{{([^}]+)}}/g]
 *                                                  Regex pattern defining variable syntax in the infoTemplate
 * @param {String|TimeMapTheme} [data.options.theme]    Theme applying to this item, overriding dataset theme
 * @param {mixed} [data.options[...]]               Any of the options for {@link TimeMapTheme} may be set here
 * @param {TimeMapDataset} dataset  Reference to the parent dataset object
 */
TimeMapItem = function(data, dataset) {
    // improve compression
    var item = this,
        // set defaults for options
        options = $.extend({
                type: 'none',
                description: '',
                infoPoint: null,
                infoHTML: '',
                openInfoWindow: TimeMapItem.openInfoWindow,
                infoTemplate: '<div class="infotitle">{{title}}</div>' +
                              '<div class="infodescription">{{description}}</div>',
                templatePattern: /\{\{([^}]+)\}\}/g,
                closeInfoWindow: TimeMapItem.closeInfoWindow
            }, data.options),
        tm = dataset.timemap,
        markerClusterer = tm.map.markerClusterer,
        // allow theme options to be specified in options
        theme = options.theme = TimeMapTheme.create(options.theme, options),
        parser = options.dateParser,
        eventClass = Timeline.DefaultEventSource.Event,
        // settings for timeline event
        start = data.start,
        end = data.end,
        eventIcon = theme.eventIcon,
        textColor = theme.eventTextColor,
        //title = options.title = data.title || '',
        title = '',
        description = options.description,
        className = options.className = data.className || '',
        event = null,
        instant,
        // empty containers
        markers = [],
        pdataArr = [],
        pdata = null,
        type = "",
        point = null,
        i;
   
    // set core fields
   
    /**
     * This item's parent dataset
     * @name TimeMapItem#dataset
     * @type TimeMapDataset
     */
    item.dataset = dataset;

    /**
     * This item data
     * @name TimeMapItem#data
     * @type Object
     */
    item.data = data;
   
    /**
     * The timemap's map object
     * @name TimeMapItem#map
     */
    item.map = tm.map;
   
    /**
     * The timemap's timeline object
     * @name TimeMapItem#timeline
     * @type Timeline
     */
    item.timeline = tm.timeline;
   
    /**
     * Container for optional settings passed in through the "options" parameter
     * @name TimeMapItem#opts
     * @type Object
     */
    item.opts = options;
   
    // Create timeline event
   
    start = start ? parser(start) : null;
    end = end ? parser(end) : null;
    instant = !end;
    if (start !== null) {
        if (!textColor) {
            // tweak to show old-style events
            textColor = (theme.classicTape && !instant) ? '#FFFFFF' : '#000000';
        }
        // attributes in object
        event = new eventClass({
            start: start,
            end: end,
            instant: instant,
            text: title,
            description: description,
            icon: eventIcon,
            color: theme.eventColor,
            textColor: textColor,
            className: className
        });
        // create cross-reference and add to timeline
        event.item = item;
        // allow for custom event loading
        if (!options.noEventLoad) {
            // add event to timeline
            dataset.eventSource.add(event);
        }
    }

    /**
     * This item's timeline event
     * @name TimeMapItem#event
     * @type Timeline.Event
     */
    item.event = event;
   
    // internal function: create map marker
    // takes a data object (could be full data, could be just marker)
    // returns an object with {marker, type, point}
    function createMarker(pdata) {
        var marker = null,
            infowindow,
            type = "",
            point = null,
            pBounds;
        // point marker
        if (pdata.point) {
            var lat = pdata.point.lat,
                lng = pdata.point.lng;
            if (lat === undefined || lat === "" || lat === null || 
                lng === undefined || lng === "" || lng === null) {
                // give up
                return marker;
            }
            point = new LatLng(
                parseFloat(lat),
                parseFloat(lng)
            );
            // create marker
            marker = new Marker();
            // infoWindow is now opened on the cluster
            marker.infoWindow = new InfoWindow();
            marker.setTitle(pdata.title);
            var iconSize = new Size(theme.iconSize[0], theme.iconSize[1]);
            var iconAnchor = 
                new Point(theme.iconAnchor[0], theme.iconAnchor[1]);
            marker.setPosition(point)
            var markerImage = 
                new MarkerImage(theme.icon, iconSize, undefined, iconAnchor);
            marker.setIcon(markerImage);
            marker.setMap(tm.map);
            tm.map.markerClusterer.addMarker(marker);
            type = "marker";
        }
        // polyline and polygon markers
        else if (pdata.polyline || pdata.polygon) {
            var points = [],
                isPolygon = "polygon" in pdata,
                line = pdata.polyline || pdata.polygon,
                x;
            pBounds = new LatLngBounds();
            if (line && line.length) {
                for (x=0; x<line.length; x++) {
                    point = new LatLng(
                        parseFloat(line[x].lat),
                        parseFloat(line[x].lng)
                    );
                    points.push(point);
                    // add point to visible map bounds
                    pBounds.extend(point);
                }
                // make polyline or polygon
                marker = new Polyline(points);
                marker.setOptions({
                    color: theme.lineColor,
                    width: theme.lineWeight,
                    opacity: theme.lineOpacity,
                    closed: isPolygon,
                    fillColor: theme.fillColor,
                    fillOpacity: theme.fillOpacity
                });
                // set type and point
                type = isPolygon ? "polygon" : "polyline";
                point = isPolygon ?
                    pBounds.getCenter() :
                    points[Math.floor(points.length/2)];
            }
        }
        // ground overlay marker
        else if ("overlay" in pdata) {
            var sw = new LatLng(
                    parseFloat(pdata.overlay.south),
                    parseFloat(pdata.overlay.west)
                ),
                ne = new LatLng(
                    parseFloat(pdata.overlay.north),
                    parseFloat(pdata.overlay.east)
                );
            pBounds = new LatLngBounds(sw, ne);
            // mapstraction can only add it - there's no marker type :(
            // XXX: look into extending Mapstraction here
            tm.map.addImageOverlay("img" + (new Date()).getTime(), pdata.overlay.image, theme.lineOpacity,
                sw.lng, sw.lat, ne.lng, ne.lat);
            type = "overlay";
            point = pBounds.getCenter();
        }
        return {
            "marker": marker,
            "type": type,
            "point": point
        };
    }
   
    // Create marker or markers
   
    // Create array of marker data
    if ("markers" in data) {
        pdataArr = data.markers;
    } else {
        // we have one or more single markers
        ["point", "polyline", "polygon", "overlay"].forEach(function(type) {
            if (type in data) {
                // push markers into array
                pdata = {};
                pdata[type] = data[type];
                pdataArr.push(pdata);
            }
        });
    }
    // Create marker objects
    pdataArr.forEach(function(pdata) {
        // put in title if necessary
        pdata.title = pdata.title || title;
        // create the marker
        var p = createMarker(pdata);
        // check that the marker was valid
        if (p) {
            // take the first point and type as a default
            point = point || p.point;
            type = type || p.type;
            if (p.marker) {
                markers.push(p.marker);
            }
        }
    });
    // set type, overriding for arrays
    options.type = markers.length > 1 ? "array" : type;
   
    // set infoPoint, checking for custom option
    options.infoPoint = options.infoPoint ?
        // check for custom infoPoint and convert to point
        new LatLng(
            parseFloat(options.infoPoint.lat),
            parseFloat(options.infoPoint.lng)
        ) :
        point;
   
    // create cross-reference(s) and add marker(s) if any exist
    markers.forEach(function(marker) {
        marker.item = item;
        // add listener to make marker open when event is clicked
        google.maps.event.addListener(marker, 'click', function() {
            item.openInfoWindow();
            google.maps.event.trigger(markerClusterer, 'click', marker.cluster_);
        });
        // hide marker to sync with the filter
        marker.setVisible(false);
    });
   
    /**
     * This item's marker(s)
     * @name TimeMapItem#marker
     * @type Marker|Polyline|Array
     */
    item.marker = markers.length == 1 ? markers[0] :
        markers.length ? markers :
        null;
   
    // getter functions
   
    /**
     * Return this item's native marker object (specific to map provider;
     * undefined if this item has more than one marker)
     * @name TimeMapItem#getNativeMarker
     * @function
     * @return {Object}     The native marker object (e.g. GMarker)
     */
    item.getNativeMarker = function() {
        var marker = item.marker;
        return marker && (marker.proprietary_marker || marker.proprietary_polyline);
    };
   
    /**
     * Return the marker type for this item
     * @name TimeMapItem#getType
     * @function
     *
     * @return {String}     Marker type
     */
    item.getType = function() { return options.type; };
   
    /**
     * Return the title for this item
     * @name TimeMapItem#getTitle
     * @function
     *
     * @return {String}     Item title
     */
    item.getTitle = function() { return options.title; };
   
    /**
     * Return the item's "info point" (the anchor for the map info window)
     * @name TimeMapItem#getInfoPoint
     * @function
     *
     * @return {GLatLng}    Info point
     */
    item.getInfoPoint = function() {
        // default to map center if marker not set
        return options.infoPoint || item.map.getCenter();
    };
   
    /**
     * Return the start date of the item's event, if any
     * @name TimeMapItem#getStart
     * @function
     *
     * @return {Date}   Item start date or undefined
     */
    item.getStart = function() {
        return item.event ? item.event.getStart() : null;
    };
   
    /**
     * Return the end date of the item's event, if any
     * @name TimeMapItem#getEnd
     * @function
     *
     * @return {Date}   Item end dateor undefined
     */
    item.getEnd = function() {
        return item.event ? item.event.getEnd() : null;
    };
   
    /**
     * Whether the item is currently selected
     * (i.e., the item's info window is open)
     * @name TimeMapItem#isSelected
     * @function
     * @return Boolean
     */
    item.isSelected = function() {
        return tm.getSelectedItem() == item;
    };
   
    /**
     * Whether the item is visible
     * @name TimeMapItem#visible
     * @type Boolean
     */
    item.visible = true;
   
    /**
     * Whether the item's marker is visible
     * @name TimeMapItem#markerVisible
     * @type Boolean
     */
    item.markerVisible = false;
   
    /**
     * Whether the item's event is visible
     * @name TimeMapItem#eventVisible
     * @type Boolean
     */
    item.eventVisible = true;
   
    /**
     * Open the info window for this item.
     * By default this is the map infoWindow, but you can set custom functions
     * for whatever behavior you want when the event or marker is clicked
     * @name TimeMapItem#openInfoWindow
     * @function
     */
    item.openInfoWindow = function() {
        options.openInfoWindow.call(item);
        tm.setSelected(item);
    };
   
    /**
     * Close the info window for this item.
     * By default this is the map infoWindow, but you can set custom functions
     * for whatever behavior you want.
     * @name TimeMapItem#closeInfoWindow
     * @function
     */
    item.closeInfoWindow = function() {
        options.closeInfoWindow.call(item);
        tm.setSelected(null);
    };
};

TimeMapItem.prototype = {
    /**
     * Show the map marker(s)
     */
    showMarker: function() {
        // XXX: Special case for overlay image (support for some providers)?
        var item = this,
            f = function(marker) {
                item.map.markerClusterer.addMarker(marker);
                //marker.cluster_.clusterIcon_.show();
                marker.setVisible(true);
            };
        if (item.marker && !item.markerVisible) {
            if (item.getType() == "array") {
                item.marker.forEach(f);
            } else {
                f(item.marker);
            }
            item.markerVisible = true;
        }
    },

    /**
     * Hide the map marker(s)
     */
    hideMarker: function() {
        // XXX: Special case for overlay image (support for some providers)?
        var item = this,
            f = function(marker) {
              //  marker.cluster_.clusterIcon_.hide();
                marker.cluster_.markerClusterer_.removeMarker(marker);
                marker.setVisible(false);
            };
        if (item.marker && item.markerVisible) {
            if (item.getType() == "array") {
                item.marker.forEach(f);
            } else {
                f(item.marker);
            }
            item.markerVisible = false;
        }
        item.closeInfoWindow();
    },

    /**
     * Show the timeline event.
     * NB: Will likely require calling timeline.layout()
     */
    showEvent: function() {
        var item = this,
            event = item.event;
        if (event && !item.eventVisible) {
            // XXX: Use timeline filtering API
            item.timeline.getBand(0)
                .getEventSource()._events._events.add(event);
            item.eventVisible = true;
        }
    },

    /**
     * Hide the timeline event.
     * NB: Will likely require calling timeline.layout(),
     * AND calling eventSource._events._index()  (ugh)
     */
    hideEvent: function() {
        var item = this,
            event = item.event;
        if (event && item.eventVisible){
            // XXX: Use timeline filtering API
            item.timeline.getBand(0)
                .getEventSource()._events._events.remove(event);
            item.eventVisible = false;
        }
    },

    /**
     * Scroll the timeline to the start of this item's event
     * @param {Boolean} [animated]      Whether to do an animated scroll, rather than a jump.
     */
    scrollToStart: function(animated) {
        var item = this;
        if (item.event) {
            item.dataset.timemap.scrollToDate(item.getStart(), false, animated);
        }
    },

/**
* Get the HTML for the info window, filling in the template if necessary
* @return {String} Info window HTML
*/ 
    getInfoHTML: function() {
        var opts = this.opts,
        html = opts.infoHTML,
        pattern = opts.templatePattern,
        match;
    // create content for info window if none is provided
        if (!html) {
    // fill in template
            html = opts.infoTemplate;
            match = pattern.exec(html);
            while (match) {
                html = html.replace(match[0], opts[match[1]]||'');
                match = pattern.exec(html);
        }
        // cache for future use
        opts.infoHTML = html;
        }
    return html;
    },

    /**
    * Determine if this item's event is in the current visible area
    * of the top band of the timeline. Note that this only considers the
    * dates, not whether the event is otherwise hidden.
    * @return {Boolean} Whether the item's event is visible
    */     
    visibleOnTimeline: function() {
        var item = this,
           topband = item.timeline.getBand(0),
            maxVisibleDate = topband.getMaxVisibleDate().getTime(),
            minVisibleDate = topband.getMinVisibleDate().getTime(),
            itemStart = item.getStartTime(),
            itemEnd = item.getEndTime();
        return itemStart !== undefined ?
            // item is in the future
            itemStart < maxVisibleDate &&
            // item is in the past
            (itemEnd > minVisibleDate || itemStart > minVisibleDate) :
            // item has no start date
            true;
    }

};

/**
 * Standard open info window function, using static text in map window
 */
TimeMapItem.openInfoWindow = function() {
    var item = this,
        opts = item.opts,
        html = item.getInfoHTML(),
        ds = item.dataset
    // create content for info window if none is provided
    // scroll timeline if necessary
    // XXX: this assumes hidePastFuture. Better to encapsulate the logic there and reuse here.
    if (!item.visibleOnTimeline()) {
        ds.timemap.scrollToDate(item.event.getStart());
    }
    // open window
    var infoWindow = item.marker.infoWindow;
    infoWindow.setContent(html);
    infoWindow.open(item.marker.getMap(), item.marker);
    // deselect when window is closed
    var closeHandler = google.maps.event.addListener(infoWindow, "closeclick", 
        function() {
        // deselect
        item.dataset.timemap.setSelected(null);
        // kill self
        google.maps.event.removeListener(closeHandler);
    });
};

/**
 * Standard close window function, using the map window
 */
TimeMapItem.closeInfoWindow = function() {
    var item = this;
    if (item.getType() == "marker") {
        item.marker.infoWindow.close();
    } else {
        if (item == item.map.tmBubbleItem) {
            item.map.closeBubble();
            item.map.tmBubbleItem = null;
        }
    }
};

/*----------------------------------------------------------------------------
 * Utility functions
 *---------------------------------------------------------------------------*/

/**
 * Get XML tag value as a string
 *
 * @param {jQuery} n        jQuery object with context
 * @param {String} tag      Name of tag to look for
 * @param {String} [ns]     XML namespace to look in
 * @return {String}         Tag value as string
 */
TimeMap.util.getTagValue = function(n, tag, ns) {
    return util.getNodeList(n, tag, ns).first().text();
};

/**
 * Empty container for mapping XML namespaces to URLs
 * @example
 TimeMap.util.nsMap['georss'] = 'http://www.georss.org/georss';
 // find georss:point
 TimeMap.util.getNodeList(node, 'point', 'georss')
 */
TimeMap.util.nsMap = {};

/**
 * Cross-browser implementation of getElementsByTagNameNS.
 * Note: Expects any applicable namespaces to be mapped in
 * {@link TimeMap.util.nsMap}.
 *
 * @param {jQuery|XML Node} n   jQuery object with context, or XML node
 * @param {String} tag          Name of tag to look for
 * @param {String} [ns]         XML namespace to look in
 * @return {jQuery}             jQuery object with the list of nodes found
 */
TimeMap.util.getNodeList = function(n, tag, ns) {
    var nsMap = TimeMap.util.nsMap;
    // get context node
    n = n.jquery ? n[0] : n;
    // no context
    return !n ? $() :
        // no namespace
        !ns ? $(tag, n) :
        // native function exists
        (n.getElementsByTagNameNS && nsMap[ns]) ? $(n.getElementsByTagNameNS(nsMap[ns], tag)) :
        // no function, try the colon tag name
        $(n.getElementsByTagName(ns + ':' + tag));
};

/**
 * Make TimeMap.init()-style points from a GLatLng, LatLng, array, or string
 *
 * @param {Object} coords       GLatLng, LatLng, array, or string to convert
 * @param {Boolean} [reversed]  Whether the points are KML-style lon/lat, rather than lat/lng
 * @return {Object}             TimeMap.init()-style point object
 */
TimeMap.util.makePoint = function(coords, reversed) {
    var latLng = null;
    // GLatLng or LatLng
    if (coords.lat() && coords.lng()) {
        latLng = [coords.lat(), coords.lng()];
    }
    // array of coordinates
    if ($.type(coords)=='array') {
        latLng = coords;
    }
    // string
    if (!latLng) {
        // trim extra whitespace
        coords = $.trim(coords);
        if (coords.indexOf(',') > -1) {
            // split on commas
            latLng = coords.split(",");
        } else {
            // split on whitespace
            latLng = coords.split(/[\r\n\f ]+/);
        }
    }
    // deal with extra coordinates (i.e. KML altitude)
    if (latLng.length > 2) {
        latLng = latLng.slice(0, 2);
    }
    // deal with backwards (i.e. KML-style) coordinates
    if (reversed) {
        latLng.reverse();
    }
    return {
        "lat": $.trim(latLng[0]),
        "lng": $.trim(latLng[1])
    };
};

/**
 * Make TimeMap.init()-style polyline/polygons from a whitespace-delimited
 * string of coordinates (such as those in GeoRSS and KML).
 *
 * @param {Object} coords       String to convert
 * @param {Boolean} [reversed]  Whether the points are KML-style lng/lat, rather than lat/lng
 * @return {Object}             Formated coordinate array
 */
TimeMap.util.makePoly = function(coords, reversed) {
    var poly = [],
        latLng, x,
        coordArr = $.trim(coords).split(/[\r\n\f ]+/);
    // loop through coordinates
    for (x=0; x<coordArr.length; x++) {
        latLng = (coordArr[x].indexOf(',') > 0) ?
            // comma-separated coordinates (KML-style lng/lat)
            coordArr[x].split(",") :
            // space-separated coordinates - increment to step by 2s
            [coordArr[x], coordArr[++x]];
        // deal with extra coordinates (i.e. KML altitude)
        if (latLng.length > 2) {
            latLng = latLng.slice(0, 2);
        }
        // deal with backwards (i.e. KML-style) coordinates
        if (reversed) {
            latLng.reverse();
        }
        poly.push({
            "lat": latLng[0],
            "lng": latLng[1]
        });
    }
    return poly;
};

/**
 * Format a date as an ISO 8601 string
 *
 * @param {Date} d          Date to format
 * @param {Number} [precision] Precision indicator:<pre>
 *      3 (default): Show full date and time
 *      2: Show full date and time, omitting seconds
 *      1: Show date only
 *</pre>
 * @return {String}         Formatted string
 */
TimeMap.util.formatDate = function(d, precision) {
    // default to high precision
    precision = precision || 3;
    var str = "";
    if (d) {
        var yyyy = d.getUTCFullYear(),
            mo = d.getUTCMonth(),
            dd = d.getUTCDate();
        // deal with early dates
        if (yyyy < 1000) {
            return (yyyy < 1 ? (yyyy * -1 + "BC") : yyyy + "");
        }
        // check for date.js support
        if (d.toISOString && precision == 3) {
            return d.toISOString();
        }
        // otherwise, build ISO 8601 string
        var pad = function(num) {
            return ((num < 10) ? "0" : "") + num;
        };
        str += yyyy + '-' + pad(mo + 1 ) + '-' + pad(dd);
        // show time if top interval less than a week
        if (precision > 1) {
            var hh = d.getUTCHours(),
                mm = d.getUTCMinutes(),
                ss = d.getUTCSeconds();
            str += 'T' + pad(hh) + ':' + pad(mm);
            // show seconds if the interval is less than a day
            if (precision > 2) {
                str += pad(ss);
            }
            str += 'Z';
        }
    }
    return str;
};

/**
 * Determine the SIMILE Timeline version.
 *
 * @return {String}     At the moment, only "1.2", "2.2.0", or what Timeline provides
 */
TimeMap.util.TimelineVersion = function() {
    // Timeline.version support added in 2.3.0
    return Timeline.version ||
        // otherwise check manually
        (Timeline.DurationEventPainter ? "1.2" : "2.2.0");
};

/**
 * Identify the marker type of a marker
 *
 * @param {Object} pm       Marker to identify
 * @return {String}         Type of marker, or false if none found
 */
TimeMap.util.getMarkerType = function(pm) {
    return pm.constructor == Marker ? 'marker' :
        pm.constructor == Polyline ?
            (pm.closed ? 'polygon' : 'polyline') :
        false;
};

/**
 * Attempt look up a key in an object, returning either the value,
 * undefined if the key is a string but not found, or the key if not a string
 *
 * @param {String|Object} key   Key to look up
 * @param {Object} map          Object in which to look
 * @return {Object}             Value, undefined, or key
 */
TimeMap.util.lookup = function(key, map) {
    return typeof key == 'string' ? map[key] : key;
};

// add indexOf support for older browsers (simple version, no "from" support)
if (!([].indexOf)) {
    Array.prototype.indexOf = function(el) {
        var a = this,
            i = a.length;
        while (--i > 0) {
            if (a[i] === el) {
                return i;
            }
        }
        return -1;
    };
}

// add forEach support for older browsers (simple version, no "this" support)
if (!([].forEach)) {
    Array.prototype.forEach = function(f) {
        var a = this,
            i;
        for (i=0; i < a.length; i++) {
            if (i in a) {
                f(a[i], i, a);
            }
        }
    };
}


/*----------------------------------------------------------------------------
 * Lookup maps
 * (need to be at end because some call util functions on initialization)
 *---------------------------------------------------------------------------*/

/**
 * @namespace
 * Lookup map of common timeline intervals.  
 * Add custom intervals here if you want to refer to them by key rather
 * than as a function name.
 * @example
    TimeMap.init({
        bandIntervals: "hr",
        // etc...
    });
 *
 */
TimeMap.intervals = {
    /** second / minute */
    sec: [DateTime.SECOND, DateTime.MINUTE],
    /** minute / hour */
    min: [DateTime.MINUTE, DateTime.HOUR],
    /** hour / day */
    hr: [DateTime.HOUR, DateTime.DAY],
    /** day / week */
    day: [DateTime.DAY, DateTime.WEEK],
    /** week / month */
    wk: [DateTime.WEEK, DateTime.MONTH],
    /** month / year */
    mon: [DateTime.MONTH, DateTime.YEAR],
    /** year / decade */
    yr: [DateTime.YEAR, DateTime.DECADE],
    /** decade / century */
    dec: [DateTime.DECADE, DateTime.CENTURY]
};


/**
 * @namespace
 * Lookup map of supported date parser functions.
 * Add custom date parsers here if you want to refer to them by key rather
 * than as a function name.
 * @example
    TimeMap.init({
        datasets: [
            {
                options: {
                    dateParser: "gregorian"
                },
                // etc...
            }
        ],
        // etc...
    });
 */
TimeMap.dateParsers = {
   
    /**
     * Better Timeline Gregorian parser... shouldn't be necessary 
     * Gregorian dates are years with "BC" or "AD"
     *
     * @param {String} s    String to parse into a Date object
     * @return {Date}       Parsed date or null
     */
    gregorian: function(s) {
        if (!s || typeof s != "string") {
            return null;
        }
        // look for BC
        var bc = Boolean(s.match(/b\.?c\.?/i)),
            // parse - parseInt will stop at non-number characters
            year = parseInt(s, 10),
            d;
        // look for success
        if (!isNaN(year)) {
            // deal with BC
            if (bc) {
                year = 1 - year;
            }
            // make Date and return
            d = new Date(0);
            d.setUTCFullYear(year);
            return d;
        }
        else {
            return null;
        }
    },

    /**
     * Parse date strings with a series of date parser functions, until one works.
     * In order:
     * <ol>
     *  <li>Date.parse() (so Date.js should work here, if it works with Timeline...)</li>
     *  <li>Gregorian parser</li>
     *  <li>The Timeline ISO 8601 parser</li>
     * </ol>
     *
     * @param {String} s    String to parse into a Date object
     * @return {Date}       Parsed date or null
     */
    hybrid: function(s) {
        // in case we don't know if this is a string or a date
        if (s instanceof Date) {
            return s;
        }
        var parsers = TimeMap.dateParsers,
            // try native date parse and timestamp
            d = new Date(typeof s == "number" ? s : Date.parse(parsers.fixChromeBug(s)));
        if (isNaN(d)) {
            if (typeof s == "string") {
                // look for Gregorian dates
                if (s.match(/^-?\d{1,6} ?(a\.?d\.?|b\.?c\.?e?\.?|c\.?e\.?)?$/i)) {
                    d = parsers.gregorian(s);
                }
                // try ISO 8601 parse
                else {
                    try {
                        d = parsers.iso8601(s);
                    } catch(e) {
                        d = null;
                    }
                }
                // look for timestamps
                if (!d && s.match(/^\d{7,}$/)) {
                    d = new Date(parseInt(s, 10));
                }
            } else {
                return null;
            }
        }
        // d should be a date or null
        return d;
    },
   
    /**
     * ISO8601 parser: parse ISO8601 datetime strings
     * @function
     */
    iso8601: DateTime.parseIso8601DateTime,
   
    /**
     * Clunky fix for Chrome bug: http://code.google.com/p/chromium/issues/detail?id=46703
     * @private
     */
    fixChromeBug: function(s) {
        return Date.parse("-200") == Date.parse("200") ?
            (typeof s == "string" && s.substr(0,1) == "-" ? null : s) :
            s;
    }
};
 
/**
 * @namespace
 * Pre-set event/marker themes in a variety of colors.
 * Add custom themes here if you want to refer to them by key rather
 * than as a function name.
 * @example
    TimeMap.init({
        options: {
            theme: "orange"
        },
        datasets: [
            {
                options: {
                    theme: "yellow"
                },
                // etc...
            }
        ],
        // etc...
    });
 */
TimeMap.themes = {

    /**
     * Red theme: <span style="background:#FE766A">#FE766A</span>
     * This is the default.
     *
     * @type TimeMapTheme
     */
    red: new TimeMapTheme(),
   
    /**
     * Blue theme: <span style="background:#5A7ACF">#5A7ACF</span>
     *
     * @type TimeMapTheme
     */
    blue: new TimeMapTheme({
        icon: GIP + "blue-dot.png",
        color: "#5A7ACF",
        eventIconImage: "blue-circle.png"
    }),

    /**
     * Green theme: <span style="background:#19CF54">#19CF54</span>
     *
     * @type TimeMapTheme
     */
    green: new TimeMapTheme({
        icon: GIP + "green-dot.png",
        color: "#19CF54",
        eventIconImage: "green-circle.png"
    }),

    /**
     * Light blue theme: <span style="background:#5ACFCF">#5ACFCF</span>
     *
     * @type TimeMapTheme
     */
    ltblue: new TimeMapTheme({
        icon: GIP + "ltblue-dot.png",
        color: "#5ACFCF",
        eventIconImage: "ltblue-circle.png"
    }),

    /**
     * Purple theme: <span style="background:#8E67FD">#8E67FD</span>
     *
     * @type TimeMapTheme
     */
    purple: new TimeMapTheme({
        icon: GIP + "purple-dot.png",
        color: "#8E67FD",
        eventIconImage: "purple-circle.png"
    }),

    /**
     * Orange theme: <span style="background:#FF9900">#FF9900</span>
     *
     * @type TimeMapTheme
     */
    orange: new TimeMapTheme({
        icon: GIP + "orange-dot.png",
        color: "#FF9900",
        eventIconImage: "orange-circle.png"
    }),

    /**
     * Yellow theme: <span style="background:#FF9900">#ECE64A</span>
     *
     * @type TimeMapTheme
     */
    yellow: new TimeMapTheme({
        icon: GIP + "yellow-dot.png",
        color: "#ECE64A",
        eventIconImage: "yellow-circle.png"
    }),

    /**
     * Pink theme: <span style="background:#E14E9D">#E14E9D</span>
     *
     * @type TimeMapTheme
     */
    pink: new TimeMapTheme({
        icon: GIP + "pink-dot.png",
        color: "#E14E9D",
        eventIconImage: "pink-circle.png"
    })
};

// save to window
window.TimeMap = TimeMap;
window.TimeMapFilterChain = TimeMapFilterChain;
window.TimeMapDataset = TimeMapDataset;
window.TimeMapTheme = TimeMapTheme;
window.TimeMapItem = TimeMapItem;

})();

// /ext

// /ext/circle_icon.js

/**
 * Create the URL for a Google Charts circle image.
 */
TimeMapTheme.getCircleUrl = function(size, color, alpha) {
    return "http://chart.apis.google.com/" + 
        "chart?cht=it&chs=" + size + "x" + size + 
        "&chco=" + color + ",00000001,ffffff01" +
        "&chf=bg,s,00000000|a,s,000000" + alpha + "&ext=.png";
};

/**
 * Create a timemap theme with matching event icons and sized map circles
 *  
 * @param {Object} [opts]       Config options
 * @param {Number} [opts.size=20]           Diameter of map circle
 * @param {Number} [opts.eventIconSize=10]  Diameter of event circle
 * @param {String} [opts.color='1f77b4']    Circle color (map + event), in RRGGBB hex or rgb(r,g,b) format
 * @param {String} [opts.alpha='bb']        Circle alpha (map), in AA hex
 * @param {String} [opts.eventAlpha='ff']   Circle alpha (event), in AA hex
 */
TimeMapTheme.createCircleTheme = function(opts) {
    var defaults = {
            size:20,
            color:'1f77b4',
            alpha:'bb',
            eventIconSize:10,
            eventAlpha:'ff'
        };
    opts = $.extend(defaults, opts);
    return new TimeMapTheme({
        icon: TimeMapTheme.getCircleUrl(opts.size, opts.color, opts.alpha),
        iconShadow: null,
        iconShadowSize: [0,0],
        iconSize: [opts.size, opts.size],
        iconAnchor: [opts.size/2, opts.size/2],
        eventIcon: TimeMapTheme.getCircleUrl(opts.eventIconSize, opts.color, opts.eventAlpha),
        color: opts.color
    });
};
 
// /ext/export.js


/*
 * Timemap.js Copyright 2010 Nick Rabinowitz.
 * Licensed under the MIT License (see LICENSE.txt)
 */

/**
 * @fileOverview
 * TimeMap Export Functions
 *
 * <p>Functions in this file allow TimeMap, TimeMapDataset, and TimeMapItem
 * objects to be serialized to a JSON string suitable for loading back into
 * TimeMap.init(). This allows for a range of server-side options for
 * data persistence and management.NOTE: I haven't looked at this recently! It
 * may well need to be updated.<p>
 * 
 * @requires json2: lib/json2.pack.js
 *
 * @author Nick Rabinowitz (www.nickrabinowitz.com)
 */

/*globals TimeMap, TimeMapDataset, TimeMapItem */
 
/**
 * Clean up TimeMap into a nice object for serialization
 * This is called automatically by the JSON.stringify() function
 */
TimeMap.prototype.toJSON = function() {
    var data = {
        'options': this.makeOptionData,
        'datasets': this.datasets
    };
    data = this.addExportData(data);
    return data;
};

/**
 * Make a cleaned up object for the TimeMap options
 */
TimeMap.prototype.makeOptionData = function() {
    var data = {}, util = TimeMap.util;
    // copy options
    var opts = this.opts;
    for (var k in opts) {
        if (opts.hasOwnProperty(k)) {
            data[k] = opts[k];
        }
    }
    // clean up: mapCenter
    if (data.mapCenter) {
        data.mapCenter = util.makePoint(data.mapCenter);
    }
    // clean up: bandIntervals
    if (data.bandIntervals) {
        data.bandIntervals = util.revHash(TimeMap.intervals, data.bandIntervals);
    }
    // including themes here too - might be a TimeMap attribute
    var themes=[], t, id;
    for (id in this.datasets) {
        if (this.datasets.hasOwnProperty(id)) {
            t = util.revHash(TimeMapDataset.themes, this.datasets[id].opts.theme);
            if (t) {
                themes.push(t);
            }
        }
    }
    data.themes = t;
    return data;
};

/**
 * Specify additional data for export. Replace this function to change settings.
 *
 * @param {Object} data      Initial map of export data
 * @return {Object}          Expanded map of export data
 */
TimeMap.prototype.addExportData = function(data) {
    data.options = data.options || {};
    // set any additional server info (e.g. a database key) in opts.saveOpts
    data.options.saveOpts = this.opts.saveOpts;
    return data;
};

/**
 * Clean up dataset into a nice object for serialization
 * This is called automatically by the JSON.stringify() function.
 *
 * <p>Note that, at the moment, this function only supports fully-serialized
 * datasets - so external data imported with JSON or KML will be serialized
 * in full and no longer connected to their original file.</p>
 */
TimeMapDataset.prototype.toJSON = function() {
    var data = {
        'title': this.getTitle(),
        'theme': TimeMap.util.revHash(TimeMapDataset.themes, this.opts.theme),
        'data': {
            'type':'basic', // only type supported by serialization at the moment
            'value': this.getItems()
        }
    };
    data = this.addExportData(data);
    return data;
};

/**
 * Specify additional data for export. Replace this function to change settings.
 *
 * @param {Object} data      Initial map of export data
 * @return {Object}          Expanded map of export data
 */
TimeMapDataset.prototype.addExportData = function(data) {
    data.options = data.options || {};
    // set any additional server info (e.g. a database key) in opts.saveOpts
    data.options.saveOpts = this.opts.saveOpts;
    return data;
};

// XXX: export items to KML with marker.getKmlAsync?

/**
 * Clean up item into a nice object for serialization.
 * This is called automatically by the JSON.stringify() function
 */
TimeMapItem.prototype.toJSON = function() {
    // any additional info (e.g. a database key) should be set in opts.saveOpts
    var data = {
        'title': this.getTitle(),
        'options': {
            'description': this.opts.description
        }
    };
    // add event info
    if (this.event) {
        data.start = this.event.getStart();
        if (!this.event.isInstant()) {
            data.end = this.event.getEnd();
        }
    }
    // add marker info
    if (this.marker) {
        var util = TimeMap.util;
        // internal function - takes type, marker, data
        var makeMarkerJSON = function(type, pm, pdata) {
            type = type || util.getMarkerType(pm);
            switch (type) {
                case "marker":
                    pdata.point = util.makePoint(pm.getLatLng());
                    break;
                case "polyline":
                case "polygon":
                    var line = [];
                    for (var x=0; x<pm.getVertexCount(); x++) {
                        line.push(util.makePoint(pm.getVertex(x)));
                    }
                    pdata[type] = line;
                    break;
            }
            return pdata;
        };
        if (this.getType() == 'array') {
            data.markers = [];
            for (var i=0; i<this.marker.length; i++) {
                data.markers.push(makeMarkerJSON(false, this.marker[i], {}));
            }
        } else {
            data = makeMarkerJSON(this.getType(), this.marker, data);
        }
    }
    data = this.addExportData(data);
    return data;
};

/**
 * Specify additional data for export. Replace this function to change settings.
 *
 * @param {Object} data      Initial map of export data
 * @return {Object}          Expanded map of export data
 */
TimeMapItem.prototype.addExportData = function(data) {
    data.options = data.options || {};
    // set any additional server info (e.g. a database key) in opts.saveOpts
    data.options.saveOpts = this.opts.saveOpts;
    return data;
};

/**
 * Util function: get the key from the map if the value is found
 *
 * @param {Object} map      Object to search
 * @param {?} val           Value to look for
 * @return {String}         Key if found, null if not
 */
TimeMap.util.revHash = function(map, val) {
    for (var k in map) {
        if (map[k] == val) {
            return k;
        }
    }
    // nothing found
    return null;
};

// for JSLint
/*global TimeMap */

// manipulation.js

/**
 * @fileOverview
 * Additional TimeMap manipulation functions.
 * Functions in this file are used to manipulate a TimeMap, TimeMapDataset, or
 * TimeMapItem after the initial load process.
 *
 * @author Nick Rabinowitz (www.nickrabinowitz.com)
 */
 
(function(){
    var window = this,
        TimeMap = window.TimeMap, 
        TimeMapDataset = window.TimeMapDataset, 
        TimeMapItem = window.TimeMapItem,
        util = TimeMap.util;
        
/*----------------------------------------------------------------------------
 * TimeMap manipulation: stuff affecting every dataset
 *---------------------------------------------------------------------------*/

// XXX: This should $.extend the prototype, I think
 
/**
 * Delete all datasets, clearing them from map and timeline. Note
 * that this is more efficient than calling clear() on each dataset.
 */
TimeMap.prototype.clear = function() {
    var tm = this;
    tm.eachItem(function(item) {
        item.event = item.marker = null;
    });
    tm.map.removeAllPolylines();
    tm.map.removeAllMarkers();
    tm.eventSource.clear();
    tm.datasets = [];
};

/**
 * Delete one dataset, clearing it from map and timeline
 *
 * @param {String} id    Id of dataset to delete
 */
TimeMap.prototype.deleteDataset = function(id) {
    this.datasets[id].clear();
    delete this.datasets[id];
};

/**
 * Hides markers for a given dataset
 * 
 * @param {String} id   The id of the dataset to hide
 */
TimeMap.prototype.hideDataset = function (id){
    if (id in this.datasets) {
        this.datasets[id].hide();
    }
};

/**
 * Hides all the datasets on the map
 */
TimeMap.prototype.hideDatasets = function(){
    var tm = this;
    tm.each(function(ds) {
        ds.visible = false;
    });
    tm.filter("map");
    tm.filter("timeline");
};

/**
 * Shows markers for a given dataset
 * 
 * @param {String} id   The id of the dataset to hide
 */
TimeMap.prototype.showDataset = function(id) {
    if (id in this.datasets) {
        this.datasets[id].show();
    }
};

/**
 * Shows all the datasets on the map
 */
TimeMap.prototype.showDatasets = function() {
    var tm = this;
    tm.each(function(ds) {
        ds.visible = true;
    });
    tm.filter("map");
    tm.filter("timeline");
};
 
/**
 * Change the default map type
 *
 * @param {String} mapTypeId   The maptype for the map 
 */
TimeMap.prototype.changeMapTypeId = function (mapTypeId) {
    var tm = this;
    // check for no change
    if (mapTypeId == tm.opts.mapTypeId) {
        return;
    }
    // no mapTypeId specified
    if (!mapTypeId) {
        return;
    }
    // change it
    tm.opts.mapTypeId = mapTypeId;
    tm.map.setMapTypeId(mapTypeId);
};


/*----------------------------------------------------------------------------
 * TimeMap manipulation: stuff affecting the timeline
 *---------------------------------------------------------------------------*/

/**
 * Refresh the timeline, maintaining the current date
 */
TimeMap.prototype.refreshTimeline = function () {
    var topband = this.timeline.getBand(0);
    var centerDate = topband.getCenterVisibleDate();
    if (util.TimelineVersion() == "1.2") {
        topband.getEventPainter().getLayout()._laidout = false;
    }
    this.timeline.layout();
    topband.setCenterVisibleDate(centerDate);
};

/**
 * Change the intervals on the timeline.
 *
 * @param {String|Array} intervals   New intervals. If string, looks up in TimeMap.intervals.
 */
TimeMap.prototype.changeTimeIntervals = function (intervals) {
    var tm = this;
    // check for no change
    if (intervals == tm.opts.bandIntervals) {
        return;
    }
    // look for intervals
    if (typeof(intervals) == 'string') {
        intervals = TimeMap.intervals[intervals];
    }
    // no intervals specified
    if (!intervals) {
        return;
    }
    tm.opts.bandIntervals = intervals;
    // internal function - change band interval
    function changeInterval(band, interval) {
        band.getEther()._interval = Timeline.DateTime.gregorianUnitLengths[interval];
        band.getEtherPainter()._unit = interval;
    }
    // grab date
    var topband = tm.timeline.getBand(0),
        centerDate = topband.getCenterVisibleDate(),
        x;
    // change interval for each band
    for (x=0; x<tm.timeline.getBandCount(); x++) {
        changeInterval(tm.timeline.getBand(x), intervals[x]);
    }
    // re-layout timeline
    if (util.TimelineVersion() == "1.2") {
    topband.getEventPainter().getLayout()._laidout = false;
    };
    tm.timeline.layout();
    topband.setCenterVisibleDate(centerDate);
};


/*----------------------------------------------------------------------------
 * TimeMapDataset manipulation: global settings, stuff affecting every item
 *---------------------------------------------------------------------------*/

/**
 * Delete all items, clearing them from map and timeline
 */
TimeMapDataset.prototype.clear = function(uncacheData) {
    var ds = this;
    if (uncacheData === undefined) {uncacheData = true};
    ds.each(function(item) {
        item.clear(true);
    });
    if (uncacheData) {ds.dataCache = []}
    ds.items = [];
    ds.timemap.timeline.layout();
};

/**
 * Delete one item, clearing it from map and timeline
 * 
 * @param {TimeMapItem} item      Item to delete
 */
TimeMapDataset.prototype.deleteItem = function(item, uncacheData) {
    var ds = this, x;
    // uncache data by default
    if (uncacheData === undefined) {uncacheData = true};
    for (x=0; x < ds.items.length; x++) {
        if (ds.items[x] == item) {
            ds.items.splice(x, 1);
            if (uncacheData) { 
                for (var i = 0; i < ds.dataCache.length; i++ ) {
                    if (ds.dataCache[i] == item.dataCache) {
                        ds.dataCache.splice(i, 1);
                    }
                }
            };
            item.clear();
            break;
        }
    }
};

/**
 * Show dataset
 */
TimeMapDataset.prototype.show = function() {
    var ds = this,
        tm = ds.timemap;
    if (!ds.visible) {
        ds.visible = true;
        tm.filter("map");
        tm.filter("timeline");
    }
};

/**
 * Hide dataset
 */
TimeMapDataset.prototype.hide = function() {
    var ds = this,
        tm = ds.timemap;
    if (ds.visible) {
        ds.visible = false;
        tm.filter("map");
        tm.filter("timeline");
    }
};

/**
 * Load data in cache
 */
TimeMapDataset.prototype.setDataCache = function(data) {
    var ds = this;
    ds.dataCache = data;
};

/**
 * Get data from cache
 */
TimeMapDataset.prototype.getDataCache = function(data) {
    var ds = this;
    return ds.dataCache;
};

/**
 * Clear data cache
 */
TimeMapDataset.prototype.clearDataCache = function(data) {
    var ds = this;
    ds.dataCache = null;
};

/**
 * Load items from cache
 */
TimeMapDataset.prototype.loadItemsFromDataCache = function() {
    var ds = this;
    ds.loadItems(ds.dataCache, undefined, false);
};

/**
* Change the theme for every item in a dataset
*
* @param {TimeMapTheme|String} theme   New theme, or string key in {@link TimeMap.themes}
*/
TimeMapDataset.prototype.changeTheme = function(newTheme) {
    var ds = this;
    newTheme = util.lookup(newTheme, TimeMap.themes);
    ds.opts.theme = newTheme;
    ds.each(function(item) {
        item.changeTheme(newTheme, true);
    });
    ds.timemap.timeline.layout();
};
 
 
/*----------------------------------------------------------------------------
 * TimeMapItem manipulation: manipulate events and markers
 *---------------------------------------------------------------------------*/

/** 
 * Show event and marker
 */
TimeMapItem.prototype.show = function() {
    var item = this;
    item.showEvent();
    item.showMarker();
    item.visible = true;
};

/** 
 * Hide event and marker
 */
TimeMapItem.prototype.hide = function() {
    var item = this;
    item.hideEvent();
    item.hideMarker();
    item.visible = false;
};

/**
 * Delete marker from map and event from timeline
 * @param [suppressLayout]      Whether to suppress laying out the timeline 
 *                              (e.g. for batch operations)
 */
TimeMapItem.prototype.clear = function(suppressLayout) {
    var item = this,
        i;
    // remove event
    if (item.event) {
        // this is just ridiculous
        item.dataset.timemap.timeline.getBand(0)
            .getEventSource()._events._events.remove(item.event);
        if (!suppressLayout) {
            item.timeline.layout();
        }
    }
    // remove marker
    function removeOverlay(p) {
        try {
            item.dataset.timemap.map.markerClusterer.removeMarker(p);
        } catch(e) {}
    }
    if (item.marker) {
        item.hideMarker();
        if (item.getType() == "array") {
            item.marker.forEach(removeOverlay);
        } else {
            removeOverlay(item.marker);
        }
    }
    item.event = item.marker = null;
};

 /**
 * Create a new event for the item.
 * 
 * @param {Date} start      Start date for the event
 * @param {Date} [end]      End date for the event
 */
TimeMapItem.prototype.createEvent = function(start, end) {
    var item = this,
        theme = item.opts.theme,
        instant = (end === undefined),
        title = item.getTitle();
    // create event
    var event = new Timeline.DefaultEventSource.Event(start, end, null, null, instant, title, 
        null, null, null, theme.eventIcon, theme.eventColor, null);
    // add references
    event.item = item;
    item.event = event;
    item.dataset.eventSource.add(event);
    item.timeline.layout();
};
 
 /**
 * Change the theme for an item
 *
 * @param {TimeMapTheme|String} theme   New theme, or string key in {@link TimeMap.themes}
 * @param [suppressLayout]      Whether to suppress laying out the timeline 
 *                              (e.g. for batch operations)
 */
TimeMapItem.prototype.changeTheme = function(newTheme, suppressLayout) {
    var item = this,
        type = item.getType(),
        event = item.event,
        marker = item.marker,
        i;
    newTheme = util.lookup(newTheme, TimeMap.themes);
    item.opts.theme = newTheme;
    // internal function - takes type, marker
    function changeMarker(pm) {
        pm.setOptions(newTheme);
        // XXX: Need to update this in Mapstraction - most implementations not available
        pm.update();
    }
    // change marker
    if (marker) {
        if (type == 'array') {
            marker.forEach(changeMarker);
        } else {
            changeMarker(marker);
        }
    }
    // change event
    if (event) {
        event._color = newTheme.eventColor;
        event._icon = newTheme.eventIcon;
        if (!suppressLayout) {
            item.timeline.layout();
        }
    }
};


/** 
 * Find the next or previous item chronologically
 *
 * @param {Boolean} [backwards=false]   Whether to look backwards (i.e. find previous) 
 * @param {Boolean} [inDataset=false]   Whether to only look in this item's dataset
 * @return {TimeMapItem}                Next/previous item, if any
 */
TimeMapItem.prototype.getNeighbour = function(backwards, inDataset) {
    var item = this,
        eventSource = item.dataset.timemap.timeline.getBand(0).getEventSource(),
        // iterator dates are non-inclusive, hence the juggle here
        i = backwards ? 
            eventSource.getEventReverseIterator(
                new Date(eventSource.getEarliestDate().getTime() - 1),
                item.event.getStart()) :
            eventSource.getEventIterator(
                item.event.getStart(), 
                new Date(eventSource.getLatestDate().getTime() + 1)
            ),
        next = null;
    if (!item.event) {
        return;
    }
    while (next === null) {
        if (i.hasNext()) {
            next = i.next().item;
            if (inDataset && next.dataset != item.dataset) {
                next = null;
            }
        } else {
            break;
        }
    }
    return next;
};

/** 
 * Find the next item chronologically
 *
 * @param {Boolean} [inDataset=false]   Whether to only look in this item's dataset
 * @return {TimeMapItem}                Next item, if any
 */
TimeMapItem.prototype.getNext = function(inDataset) {
    return this.getNeighbour(false, inDataset);
};

/** 
 * Find the previous item chronologically
 *
 * @requires Timeline v.2.2.0 or greater
 *
 * @param {Boolean} [inDataset=false]   Whether to only look in this item's dataset
 * @return {TimeMapItem}                Next item, if any
 */
TimeMapItem.prototype.getPrev = function(inDataset) {
    return this.getNeighbour(true, inDataset);
};

})();

// params.js

/**
 * @fileOverview
 * This file defines the Param class, which is used to get, set, and serialize
 * different fields on TimeMap and TimeMapItem objects.
 *
 * @author Nick Rabinowitz (www.nickrabinowitz.com)
 */

// save a few bytes
(function() {

/**
 * @name TimeMap.params
 * @namespace Namespace for parameter classes
 */
var params = TimeMap.params = {
    /**
     * @class
     * A parameter, with methods to get, set, and serialize the current value.
     *
     * @constructor
     * @param {String} paramName        String name of the parameter
     * @param {Object} options          Container for named arguments
     * @param {String} [sourceName]             String name of the source element, if different
     * @param {Function} [options.get]          Function to get the current param value
     * @param {Function} [options.set]          Function to set the param to a new value
     * @param {Function} [options.setConfig]    Function to set a new value in a config object
     * @param {Function} [options.fromStr]      Function to parse the value from a string
     * @param {Function} [options.toStr]        Function to serialize the current value to a string
     * @param {Function} [options.setConfigXML] Function to parse the value from an XML node and set to config
     */
    Param: function(paramName, options) {
        var param = this;
        options = options || {};
        
        /**
         * String name of this param
         * @name TimeMap.params.Param#paramName
         * @type String
         */
        param.paramName = paramName;
        
        /**
         * String name of the source element, if different
         * @name TimeMap.params.Param#sourceName
         */
        param.sourceName = options.sourceName || paramName;
    
        /**
         * Get the current state value from a TimeMap or TimeMapItem object
         * @name TimeMap.params.Param#get
         * @function
         *
         * @param {TimeMap|TimeMapItem} o       Object to inspect
         * @return {mixed}                      Current state value
         */
        param.get = options.get;
        
        /**
         * Set the current state value on a TimeMap or TimeMapItem object
         * @name TimeMap.params.Param#set
         * @function
         *
         * @param {TimeMap|TimeMapItem} o       Object to modify
         * @param {mixed} value                 Value to set
         */
        param.set = options.set;
        
        /**
         * Set a new value on a config object for TimeMap.init()
         * @name TimeMap.params.Param#setConfig
         * @function
         * @see TimeMap.init
         *
         * @param {Object} config   Config object to modify
         * @param {mixed} value     Value to set
         */
        param.setConfig = options.setConfig || function(config, value) {
            // default: set at top level
            config[paramName] = value;
        };
        
        /**
         * Parse a state value from a string
         * @name TimeMap.params.Param#fromString
         * @function
         *
         * @param {String} s        String to parse
         * @return {mixed}          Current state value
         */
        param.fromString = options.fromStr || function(s) {
            // default: param is a string
            return s;
        };
        
        /**
         * Serialize a state value as a string
         * @name TimeMap.params.Param#toString
         * @function
         *
         * @param {mixed} value     Value to serialize
         * @return {String}         Serialized string
         */
        param.toString = options.toStr || function(value) {
            // default: use the built-in string method
            return value.toString();
        };
        
        /**
         * Get the current value as a string
         * @name TimeMap.params.Param#getString
         * @function
         * 
         * @param {TimeMap|TimeMapItem} o       Object to inspect
         */
        param.getString = function(o) {
            param.toString(param.get(o));
        };
        
        /**
         * Set the current state value from a string
         * @name TimeMap.params.Param#setString
         * @function
         * 
         * @param {TimeMap|TimeMapItem} o       Object to modify
         * @param {String} s                    String version of value to set
         */
        param.setString = function(o, s) {
            param.set(o, param.fromString(s));
        };
        
        /**
         * Set a config object based on an XML tag
         * @name TimeMap.params.Param#setConfigXML
         * @function
         * 
         * @param {Object} config       Config object to modify
         * @param {XML NodeList} node   Parent node of the desired tag
         */
        param.setConfigXML = options.setConfigXML || function(config, node) {
            var tagName = param.sourceName,
                nameParts = tagName.split(':'), 
                ns; 
            // deal with namespaced tags
            if (nameParts.length > 1) {
                tagName = nameParts[1];
                ns = nameParts[0];
            }
            // set to config
            param.setConfig(config, TimeMap.util.getTagValue(node, tagName, ns));
        };
    },

    /**
     * @class
     * A convenience class for those parameters which deal with a value
     * in the options of a TimeMap or TimeMapItem object, setting some
     * additional default functions.
     *
     * @augments TimeMap.params.Param
     *
     * @constructor
     * @param {String} paramName        String name of the option parameter
     * @param {Object} [options]        Container for named arguments (see {@link TimeMap.params.Param})
     */
    OptionParam: function(paramName, options) {
        options = options || {};
        var defaults = {
            
            /**
             * Get the current state value from the opts object of a TimeMap or TimeMapItem
             * @name TimeMap.params.OptionParam#get
             * @function
             *
             * @param {TimeMap|TimeMapItem} o       Object to inspect
             * @return {mixed}                      Current state value
             */
            get: function(o) {
                return o.opts[paramName];
            },
            
            /**
             * Set the state value in the opts object of a TimeMap or TimeMapItem
             * @name TimeMap.params.OptionParam#set
             *
             * @param {TimeMap|TimeMapItem} o       Object to modify
             * @param {mixed} value                 Value to set
             */
            set: function(o, value) {
                o.opts[paramName] = value;
            },
            
            /**
             * Set a new value on a config object for TimeMap.init() or a particular item
             * @name TimeMap.params.OptionParam#setConfig
             * @function
             *
             * @param {Object} config   Config object to modify
             * @param {mixed} value     Value to set
             */
            setConfig: function(config, value) {
                config.options = config.options || {};
                config.options[paramName] = value;
            }
            
        };
        options = $.extend(defaults, options);
        return new params.Param(paramName, options);
    }
};

})();

// state.js

/**
 * @fileOverview
 * Functions in this file are used to set the timemap state programmatically,
 * either in a script or from the url hash.
 *
 * @requires param.js
 *
 * @author Nick Rabinowitz (www.nickrabinowitz.com)
 */

(function() {

/*----------------------------------------------------------------------------
 * State namespace, with setters, serializers, and url functions
 *---------------------------------------------------------------------------*/

var paramNS = TimeMap.params,

    /**
     * @name TimeMap.state
     * @namespace Namespace for static state functions used to 
     * set the timemap state programmatically, either in a script or 
     * from the url hash.
     * @see <a href="../../examples/state.html#zoom=8&center=44.04811573082351,13.29345703125&date=1500-01-21T12:17:37Z&selected=0">State Example</a>
     */
    stateNS = TimeMap.state = {
    
    /**
     * Get the state parameters from the URL, returning as a config object
     * 
     * @return {Object}             Object with state config settings
     */
    fromUrl: function() {
        var pairs = location.hash.substring(1).split('&'),
            params = stateNS.params,
            state = {};
        pairs.forEach(function(pair) {
            var kv = pair.split('=');
            if (kv.length > 1) {
                key = kv[0];
                if (key && key in params) {
                    state[key] = params[key].fromString(decodeURI(kv[1]));
                }
            }
        });
        return state;
    },
    
    /**
     * Make a parameter string from a state object
     *
     * @param {Object} state        Object with state config settings
     * @return {String}             Parameter string in URL param format
     */
    toParamString: function(state) {
        var params = stateNS.params, 
            paramArray = [], 
            key;
        // go through each key in state
        for (key in state) {
            if (state.hasOwnProperty(key)) {
                if (key in params) {
                    paramArray.push(key + "=" + encodeURI(params[key].toString(state[key])));
                }
            }
        }
        return paramArray.join("&");
    },
    
    /**
     * Make a full URL from a state object
     *
     * @param {Object} state        Object with state config settings
     * @return {String}             Full URL with parameters
     */
    toUrl: function(state) {
        var paramString = stateNS.toParamString(state),
            url = location.href.split("#")[0];
        return url + "#" + paramString;
    },
    
    /**
     * Set state settings on a config object for TimeMap.init()
     * @see TimeMap.init
     *
     * @param {Object} config       Config object for TimeMap.init(), modified in place
     * @param {Object} state        Object with state config settings
     */
    setConfig: function(config, state) {
        var params = stateNS.params,
            key;
        for (key in state) {
            if (state.hasOwnProperty(key)) {
                if (key in params) {
                    params[key].setConfig(config, state[key]);
                }
            }
        }
    },
    
    /**
     * Set state settings on a config object for TimeMap.init() using
     * parameters in the URL. Note that as of Timemap.js v.1.6, this
     * will run automatically if state functions are present.
     * @see TimeMap.init
     * @example
 // set up the config object
 var config = {
    // various settings, as usual for TimeMap.init()
 };
 
 // get state settings from the URL, e.g.:
 // http://www.example.com/mytimemap.html#zoom=4&selected=1
 TimeMap.state.setOptionsFromUrl(config);
 
 // initialize TimeMap object
 var tm = TimeMap.init(config);
     *
     * @param {Object} config       Config object for TimeMap.init()
     */
    setOptionsFromUrl: function(config) {
        stateNS.setConfig(config, stateNS.fromUrl());
    }

};

/*----------------------------------------------------------------------------
 * TimeMap object methods
 *---------------------------------------------------------------------------*/

/**
 * Set the timemap state with a set of configuration options.
 *
 * @param {Object} state    Object with state config settings
 */
TimeMap.prototype.setState = function(state) {
    var params = stateNS.params,
        key;
    // go through each key in state
    for (key in state) {
        if (state.hasOwnProperty(key)) {
            if (key in params) {
                // run setter function with config value
                params[key].set(this, state[key]);
            }
        }
    }
};

/**
 * Get a configuration object of state variables
 *
 * @return {Object}     Object with state config settings
 */
TimeMap.prototype.getState = function() {
    var state = {},
        params = stateNS.params,
        key;
    // run through params, adding values to state
    for (key in params) {
        if (params.hasOwnProperty(key)) {
            // get state value
            state[key] = params[key].get(this);
        }
    }
    return state;
};

/**
 * Initialize state tracking based on URL. 
 * Note: continuous tracking will only work
 * on browsers that support the "onhashchange" event.
 */
TimeMap.prototype.initState = function() {   
    var tm = this;
    tm.setStateFromUrl();
    window.onhashchange = function() {
        tm.setStateFromUrl();
    };
};

/**
 * Set the timemap state with parameters in the URL
 */
TimeMap.prototype.setStateFromUrl = function() {
    this.setState(stateNS.fromUrl());
};

/**
 * Get current state parameters serialized as a hash string
 *
 * @return {String}     State parameters serialized as a hash string
 */
TimeMap.prototype.getStateParamString = function() {
    return stateNS.toParamString(this.getState());
};

/**
 * Get URL with current state parameters in hash
 *
 * @return {String}     URL with state parameters
 */
TimeMap.prototype.getStateUrl = function() {
    return stateNS.toUrl(this.getState());
};


/*----------------------------------------------------------------------------
 * State parameters
 *---------------------------------------------------------------------------*/

/**
 * @namespace
 * Namespace for state parameters, each with a set of functions to set and serialize values.
 * Add your own Param objects to this namespace to get and set additional state variables.
 */
TimeMap.state.params = {
        
        /**
         * Map zoom level
         * @type TimeMap.params.Param
         */
        zoom: new paramNS.OptionParam("mapZoom", {
            get: function(tm) {
                return tm.map.getZoom();
            },
            set: function(tm, value) {
                tm.map.setZoom(value);
            },
            fromStr: function(s) {
                return parseInt(s, 10);
            }
        }),
        
        /**
         * Map center
         * @type TimeMap.params.Param
         */
        center: new paramNS.OptionParam("mapCenter", {
            get: function(tm) {
                return tm.map.getCenter();
            },
            set: function(tm, value) {
                tm.map.setCenter(value);
            },
            fromStr: function(s) {
                var params = s.split(",");
                if (params.length < 2) {
                    // give up
                    return null;
                }
                return new LatLng(
                    parseFloat(params[0]),
                    parseFloat(params[1])
                );
            },
            toStr: function(value) {
                return value.lat() + "," + value.lng();
            }
        }),
        
        /**
         * Timeline center date
         * @type TimeMap.params.Param
         */
        date: new paramNS.Param("scrollTo", {
            get: function(tm) {
                return tm.timeline.getBand(0).getCenterVisibleDate();
            },
            set: function(tm, value) {
                tm.scrollToDate(value);
            },
            fromStr: function(s) {
                return TimeMap.dateParsers.hybrid(s);
            },
            toStr: function(value) {
                return TimeMap.util.formatDate(value);
            }
        }),
        
        /**
         * Index of selected/open item, if any
         * @type TimeMap.params.Param
         */
        selected: new paramNS.OptionParam("selected", {
            set: function(tm, value) {
                if (value >= 0) {
                    var item = tm.getItems()[value];
                    if (item) {
                        item.openInfoWindow();
                    }
                }
            },
            fromStr: function(s) {
                return parseInt(s, 10);
            }
        })
};

})();
