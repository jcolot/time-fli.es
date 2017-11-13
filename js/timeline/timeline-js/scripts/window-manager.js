/**
 * @fileOverview UI layers and window-wide dragging
 * @name Timeline.WindowManager
 */

/**
 *  This is a singleton that keeps track of UI layers (modal and 
 *  modeless) and enables/disables UI elements based on which layers
 *  they belong to. It also provides window-wide dragging 
 *  implementation.
 */
Timeline.WindowManager = {
    _initialized: false,
    _listeners: [],

    _draggedElement: null,
    _draggedElementCallback: null,
    _dropTargetHighlightElement: null,
    _lastCoords: null,
    _ghostCoords: null,
    _draggingMode: "",
    _dragging: false,

    _layers: []
};

Timeline.WindowManager.initialize = function () {
    if (Timeline.WindowManager._initialized) {
        return;
    }

    jQuery(document.body).on("mousedown", Timeline.WindowManager._onBodyMouseDown);
    jQuery(document.body).on("mousemove", Timeline.WindowManager._onBodyMouseMove);
    jQuery(document.body).on("mouseup", Timeline.WindowManager._onBodyMouseUp);
    jQuery(document).on("keydown", Timeline.WindowManager._onBodyKeyDown);
    jQuery(document).on("keyup", Timeline.WindowManager._onBodyKeyUp);

    Timeline.WindowManager._layers.push({index: 0});

    Timeline.WindowManager._historyListener = {
        onBeforeUndoSeveral: function () {},
        onAfterUndoSeveral: function () {},
        onBeforeUndo: function () {},
        onAfterUndo: function () {},

        onBeforeRedoSeveral: function () {},
        onAfterRedoSeveral: function () {},
        onBeforeRedo: function () {},
        onAfterRedo: function () {}
    };
    Timeline.History.addListener(Timeline.WindowManager._historyListener);

    Timeline.WindowManager._initialized = true;
};

Timeline.WindowManager.getBaseLayer = function () {
    Timeline.WindowManager.initialize();
    return Timeline.WindowManager._layers[0];
};

Timeline.WindowManager.getHighestLayer = function () {
    Timeline.WindowManager.initialize();
    return Timeline.WindowManager._layers[Timeline.WindowManager._layers.length - 1];
};

Timeline.WindowManager.registerEventWithObject = function (elmt, eventName, obj, handlerName, layer) {
    Timeline.WindowManager.registerEvent(
            elmt,
            eventName,
            function (elmt2, evt, target) {
                return obj[handlerName].call(obj, elmt2, evt, target);
            },
            layer
            );
};

Timeline.WindowManager.registerEvent = function (elmt, eventName, handler, layer) {
    if (layer == null) {
        layer = Timeline.WindowManager.getHighestLayer();
    }

    var handler2 = function (elmt, evt, target) {
        if (Timeline.WindowManager._canProcessEventAtLayer(layer)) {
            Timeline.WindowManager._popToLayer(layer.index);
            try {
                handler(elmt, evt, target);
            } catch (e) {
                Timeline.Debug.exception(e);
            }
        }
        Timeline.DOM.cancelEvent(evt);
        return false;
    }

    Timeline.DOM.registerEvent(elmt, eventName, handler2);
};

Timeline.WindowManager.pushLayer = function (f, ephemeral, elmt) {
    var layer = {onPop: f, index: Timeline.WindowManager._layers.length, ephemeral: (ephemeral), elmt: elmt};
    Timeline.WindowManager._layers.push(layer);

    return layer;
};

Timeline.WindowManager.popLayer = function (layer) {
    for (var i = 1; i < Timeline.WindowManager._layers.length; i++) {
        if (Timeline.WindowManager._layers[i] == layer) {
            Timeline.WindowManager._popToLayer(i - 1);
            break;
        }
    }
};

Timeline.WindowManager.popAllLayers = function () {
    Timeline.WindowManager._popToLayer(0);
};

Timeline.WindowManager.registerForDragging = function (elmt, callback, layer) {
    Timeline.WindowManager.registerEvent(
            elmt,
            "mousedown",
            function (elmt, evt, target) {
                Timeline.WindowManager._handleMouseDown(elmt, evt, callback);
            },
            layer
            );
};

Timeline.WindowManager._popToLayer = function (level) {
    while (level + 1 < Timeline.WindowManager._layers.length) {
        try {
            var layer = Timeline.WindowManager._layers.pop();
            if (layer.onPop != null) {
                layer.onPop();
            }
        } catch (e) {
        }
    }
};

Timeline.WindowManager._canProcessEventAtLayer = function (layer) {
    if (layer.index == (Timeline.WindowManager._layers.length - 1)) {
        return true;
    }
    for (var i = layer.index + 1; i < Timeline.WindowManager._layers.length; i++) {
        if (!Timeline.WindowManager._layers[i].ephemeral) {
            return false;
        }
    }
    return true;
};

Timeline.WindowManager.cancelPopups = function (evt) {
    var evtCoords = (evt) ? Timeline.DOM.getEventPageCoordinates(evt) : {x: -1, y: -1};

    var i = Timeline.WindowManager._layers.length - 1;
    while (i > 0 && Timeline.WindowManager._layers[i].ephemeral) {
        var layer = Timeline.WindowManager._layers[i];
        if (layer.elmt != null) { // if event falls within main element of layer then don't cancel
            var elmt = layer.elmt;
            var elmtCoords = Timeline.DOM.getPageCoordinates(elmt);
            if (evtCoords.x >= elmtCoords.left && evtCoords.x < (elmtCoords.left + elmt.offsetWidth) &&
                    evtCoords.y >= elmtCoords.top && evtCoords.y < (elmtCoords.top + elmt.offsetHeight)) {
                break;
            }
        }
        i--;
    }
    Timeline.WindowManager._popToLayer(i);
};

Timeline.WindowManager._onBodyMouseDown = function (elmt, evt, target) {
    if (!("eventPhase" in evt) || evt.eventPhase == evt.BUBBLING_PHASE) {
        Timeline.WindowManager.cancelPopups(evt);
    }
};

Timeline.WindowManager._handleMouseDown = function (elmt, evt, callback) {
    Timeline.WindowManager._draggedElement = elmt;
    Timeline.WindowManager._draggedElementCallback = callback;
    Timeline.WindowManager._lastCoords = {x: evt.clientX, y: evt.clientY};

    Timeline.DOM.cancelEvent(evt);
    return false;
};

Timeline.WindowManager._onBodyKeyDown = function (elmt, evt, target) {
    if (Timeline.WindowManager._dragging) {
        if (evt.keyCode == 27) { // esc
            Timeline.WindowManager._cancelDragging();
        } else if ((evt.keyCode == 17 || evt.keyCode == 16) && Timeline.WindowManager._draggingMode != "copy") {
            Timeline.WindowManager._draggingMode = "copy";

            var img = Timeline.Graphics.createTranslucentImage(Timeline.urlPrefix + "images/copy.png");
            img.style.position = "absolute";
            img.style.left = (Timeline.WindowManager._ghostCoords.left - 16) + "px";
            img.style.top = (Timeline.WindowManager._ghostCoords.top) + "px";
            document.body.appendChild(img);

            Timeline.WindowManager._draggingModeIndicatorElmt = img;
        }
    }
};

Timeline.WindowManager._onBodyKeyUp = function (elmt, evt, target) {
    if (Timeline.WindowManager._dragging) {
        if (evt.keyCode == 17 || evt.keyCode == 16) {
            Timeline.WindowManager._draggingMode = "";
            if (Timeline.WindowManager._draggingModeIndicatorElmt != null) {
                document.body.removeChild(Timeline.WindowManager._draggingModeIndicatorElmt);
                Timeline.WindowManager._draggingModeIndicatorElmt = null;
            }
        }
    }
};

Timeline.WindowManager._onBodyMouseMove = function (elmt, evt, target) {
    if (Timeline.WindowManager._draggedElement != null) {
        var callback = Timeline.WindowManager._draggedElementCallback;

        var lastCoords = Timeline.WindowManager._lastCoords;
        var diffX = evt.clientX - lastCoords.x;
        var diffY = evt.clientY - lastCoords.y;

        if (!Timeline.WindowManager._dragging) {
            if (Math.abs(diffX) > 5 || Math.abs(diffY) > 5) {
                try {
                    if ("onDragStart" in callback) {
                        callback.onDragStart();
                    }

                    if ("ghost" in callback && callback.ghost) {
                        var draggedElmt = Timeline.WindowManager._draggedElement;

                        Timeline.WindowManager._ghostCoords = Timeline.DOM.getPageCoordinates(draggedElmt);
                        Timeline.WindowManager._ghostCoords.left += diffX;
                        Timeline.WindowManager._ghostCoords.top += diffY;

                        var ghostElmt = draggedElmt.cloneNode(true);
                        ghostElmt.style.position = "absolute";
                        ghostElmt.style.left = Timeline.WindowManager._ghostCoords.left + "px";
                        ghostElmt.style.top = Timeline.WindowManager._ghostCoords.top + "px";
                        ghostElmt.style.zIndex = 1000;
                        ghostElmt.style.opacity = 0.5;

                        document.body.appendChild(ghostElmt);
                        callback._ghostElmt = ghostElmt;
                    }

                    Timeline.WindowManager._dragging = true;
                    Timeline.WindowManager._lastCoords = {x: evt.clientX, y: evt.clientY};

                    document.body.focus();
                } catch (e) {
                    Timeline.Debug.exception("WindowManager: Error handling mouse down", e);
                    Timeline.WindowManager._cancelDragging();
                }
            }
        } else {
            try {
                Timeline.WindowManager._lastCoords = {x: evt.clientX, y: evt.clientY};

                if ("onDragBy" in callback) {
                    callback.onDragBy(diffX, diffY);
                }

                if ("_ghostElmt" in callback) {
                    var ghostElmt = callback._ghostElmt;

                    Timeline.WindowManager._ghostCoords.left += diffX;
                    Timeline.WindowManager._ghostCoords.top += diffY;

                    ghostElmt.style.left = Timeline.WindowManager._ghostCoords.left + "px";
                    ghostElmt.style.top = Timeline.WindowManager._ghostCoords.top + "px";
                    if (Timeline.WindowManager._draggingModeIndicatorElmt != null) {
                        var indicatorElmt = Timeline.WindowManager._draggingModeIndicatorElmt;

                        indicatorElmt.style.left = (Timeline.WindowManager._ghostCoords.left - 16) + "px";
                        indicatorElmt.style.top = Timeline.WindowManager._ghostCoords.top + "px";
                    }

                    if ("droppable" in callback && callback.droppable) {
                        var coords = Timeline.DOM.getEventPageCoordinates(evt);
                        var target = Timeline.DOM.hittest(
                                coords.x, coords.y,
                                [Timeline.WindowManager._ghostElmt,
                                    Timeline.WindowManager._dropTargetHighlightElement
                                ]
                                );
                        target = Timeline.WindowManager._findDropTarget(target);

                        if (target != Timeline.WindowManager._potentialDropTarget) {
                            if (Timeline.WindowManager._dropTargetHighlightElement != null) {
                                document.body.removeChild(Timeline.WindowManager._dropTargetHighlightElement);

                                Timeline.WindowManager._dropTargetHighlightElement = null;
                                Timeline.WindowManager._potentialDropTarget = null;
                            }

                            var droppable = false;
                            if (target != null) {
                                if ((!("canDropOn" in callback) || callback.canDropOn(target)) &&
                                        (!("canDrop" in target) || target.canDrop(Timeline.WindowManager._draggedElement))) {

                                    droppable = true;
                                }
                            }

                            if (droppable) {
                                var border = 4;
                                var targetCoords = Timeline.DOM.getPageCoordinates(target);
                                var highlight = document.createElement("div");
                                highlight.style.border = border + "px solid yellow";
                                highlight.style.backgroundColor = "yellow";
                                highlight.style.position = "absolute";
                                highlight.style.left = targetCoords.left + "px";
                                highlight.style.top = targetCoords.top + "px";
                                highlight.style.width = (target.offsetWidth - border * 2) + "px";
                                highlight.style.height = (target.offsetHeight - border * 2) + "px";
                                highlight.style.opacity = 0.3;
                                document.body.appendChild(highlight);

                                Timeline.WindowManager._potentialDropTarget = target;
                                Timeline.WindowManager._dropTargetHighlightElement = highlight;
                            }
                        }
                    }
                }
            } catch (e) {
                Timeline.Debug.exception("WindowManager: Error handling mouse move", e);
                Timeline.WindowManager._cancelDragging();
            }
        }

        Timeline.DOM.cancelEvent(evt);
        return false;
    }
};

Timeline.WindowManager._onBodyMouseUp = function (elmt, evt, target) {
    if (Timeline.WindowManager._draggedElement != null) {
        try {
            if (Timeline.WindowManager._dragging) {
                var callback = Timeline.WindowManager._draggedElementCallback;
                if ("onDragEnd" in callback) {
                    callback.onDragEnd();
                }
                if ("droppable" in callback && callback.droppable) {
                    var dropped = false;

                    var target = Timeline.WindowManager._potentialDropTarget;
                    if (target != null) {
                        if ((!("canDropOn" in callback) || callback.canDropOn(target)) &&
                                (!("canDrop" in target) || target.canDrop(Timeline.WindowManager._draggedElement))) {

                            if ("onDropOn" in callback) {
                                callback.onDropOn(target);
                            }
                            target.ondrop(Timeline.WindowManager._draggedElement, Timeline.WindowManager._draggingMode);

                            dropped = true;
                        }
                    }

                    if (!dropped) {
                        // TODO: do holywood explosion here
                    }
                }
            }
        } finally {
            Timeline.WindowManager._cancelDragging();
        }

        Timeline.DOM.cancelEvent(evt);
        return false;
    }
};

Timeline.WindowManager._cancelDragging = function () {
    var callback = Timeline.WindowManager._draggedElementCallback;
    if ("_ghostElmt" in callback) {
        var ghostElmt = callback._ghostElmt;
        document.body.removeChild(ghostElmt);

        delete callback._ghostElmt;
    }
    if (Timeline.WindowManager._dropTargetHighlightElement != null) {
        document.body.removeChild(Timeline.WindowManager._dropTargetHighlightElement);
        Timeline.WindowManager._dropTargetHighlightElement = null;
    }
    if (Timeline.WindowManager._draggingModeIndicatorElmt != null) {
        document.body.removeChild(Timeline.WindowManager._draggingModeIndicatorElmt);
        Timeline.WindowManager._draggingModeIndicatorElmt = null;
    }

    Timeline.WindowManager._draggedElement = null;
    Timeline.WindowManager._draggedElementCallback = null;
    Timeline.WindowManager._potentialDropTarget = null;
    Timeline.WindowManager._dropTargetHighlightElement = null;
    Timeline.WindowManager._lastCoords = null;
    Timeline.WindowManager._ghostCoords = null;
    Timeline.WindowManager._draggingMode = "";
    Timeline.WindowManager._dragging = false;
};

Timeline.WindowManager._findDropTarget = function (elmt) {
    while (elmt != null) {
        if ("ondrop" in elmt && (typeof elmt.ondrop) == "function") {
            break;
        }
        elmt = elmt.parentNode;
    }
    return elmt;
};
