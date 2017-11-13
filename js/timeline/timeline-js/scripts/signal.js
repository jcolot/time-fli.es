/*==================================================
 *  This file is used to detect that all outstanding
 *  javascript files have been loaded. You can put
 *  a function reference into Timeline_onLoad
 *  to have it executed once all javascript files
 *  have loaded.
 *==================================================
 */
(function () {
    var substring = Timeline.urlPrefix + "scripts/signal.js";
    var heads = document.documentElement.getElementsByTagName("head");
    for (var h = 0; h < heads.length; h++) {
        var node = heads[h].firstChild;
        while (node != null) {
            if (node.nodeType == 1 && node.tagName.toLowerCase() == "script") {
                var url = node.src;
                var i = url.indexOf(substring);
                if (i >= 0) {
                    heads[h].removeChild(node); // remove it so we won't hit it again

                    var count = parseInt(url.substr(url.indexOf(substring) + substring.length + 1));
                    Timeline.loadingScriptsCount -= count;
                    if (Timeline.loadingScriptsCount == 0) {
                        var f = null;
                        if (typeof Timeline_onLoad == "string") {
                            f = eval(Timeline_onLoad);
                            Timeline_onLoad = null;
                        } else if (typeof Timeline_onLoad == "function") {
                            f = Timeline_onLoad;
                            Timeline_onLoad = null;
                        }

                        if (f != null) {
                            f();
                        }
                    }
                    return;
                }
            }
            node = node.nextSibling;
        }
    }
})();
