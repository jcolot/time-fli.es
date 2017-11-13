/**
 * WYSIWYG - jQuery plugin 0.96
 * (Pretty girl)
 *
 * Copyright (c) 2008-2009 Juan M Martinez, 2010-2011 Akzhan Abdulin and all contributors
 * https://github.com/akzhan/jwysiwyg
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 */

/*jslint browser: true, forin: true */

(function ($) {
	/* Wysiwyg namespace: private properties and methods */

	var console = window.console ? window.console : {
		log: $.noop,
		error: function (msg) {
			$.error(msg);
		}
	};

	function Wysiwyg() {
		this.controls = {
			bold: {
				groupIndex: 0,
				visible: true,
				tags: ["b", "strong"],
				css: {
					fontWeight: "bold"
				},
				tooltip: "Bold",
				hotkey: {"ctrl": 1, "key": 66}
			},

			copy: {
				groupIndex: 8,
				visible: false,
				tooltip: "Copy"
			},

			createLink: {
				groupIndex: 6,
				visible: true,
				exec: function () {
					var self = this;
					if ($.wysiwyg.controls && $.wysiwyg.controls.link) {
						$.wysiwyg.controls.link.init(this);
					} else if ($.wysiwyg.autoload) {
						$.wysiwyg.autoload.control("wysiwyg.link.js", function () {
							self.controls.createLink.exec.apply(self);
						});
					} else {
						console.error("$.wysiwyg.controls.link not defined. You need to include wysiwyg.link.js file");
					}
				},
				tags: ["a"],
				tooltip: "Create link"
			},

			cut: {
				groupIndex: 8,
				visible: false,
				tooltip: "Cut"
			},

			decreaseFontSize: {
				groupIndex: 9,
				visible: false && !($.browser.msie),
				tags: ["small"],
				tooltip: "Decrease font size"
			},

			h1: {
				groupIndex: 7,
				visible: true,
				className: "h1",
				command: ($.browser.msie || $.browser.safari) ? "FormatBlock" : "heading",
				"arguments": ($.browser.msie || $.browser.safari) ? "<h1>" : "h1",
				tags: ["h1"],
				tooltip: "Header 1"
			},

			h2: {
				groupIndex: 7,
				visible: true,
				className: "h2",
				command: ($.browser.msie || $.browser.safari)	? "FormatBlock" : "heading",
				"arguments": ($.browser.msie || $.browser.safari) ? "<h2>" : "h2",
				tags: ["h2"],
				tooltip: "Header 2"
			},

			h3: {
				groupIndex: 7,
				visible: true,
				className: "h3",
				command: ($.browser.msie || $.browser.safari) ? "FormatBlock" : "heading",
				"arguments": ($.browser.msie || $.browser.safari) ? "<h3>" : "h3",
				tags: ["h3"],
				tooltip: "Header 3"
			},

			html: {
				groupIndex: 10,
				visible: false,
				exec: function () {
					if (this.viewHTML) {
						this.setContent($(this.original).val());
						$(this.original).hide();
						this.editor.show();
						
						this.ui.toolbar.find("li").each(function () {
							var li = $(this);

							if (li.hasClass("html")) {
								li.removeClass("active");
							} else {
								li.attr("disabled", "false");
							}
						});
					} else {
						this.saveContent();
						$(this.original).css({
							width:	this.element.outerWidth() - 6,
							height: this.element.height() - this.ui.toolbar.height() - 6,
							resize: "none"
						}).show();
						this.editor.hide();

						this.ui.toolbar.find("li").each(function () {
							var li = $(this);

							if (li.hasClass("html")) {
								li.addClass("active");
							} else {
								if (false === li.hasClass("fullscreen")) {
									li.removeClass("active");
									li.attr("disabled", "true");
								}
							}
						});
					}

					this.viewHTML = !(this.viewHTML);
				},
				tooltip: "View source code"
			},

			increaseFontSize: {
				groupIndex: 9,
				visible: false && !($.browser.msie),
				tags: ["big"],
				tooltip: "Increase font size"
			},

			indent: {
				groupIndex: 2,
				visible: true,
				tooltip: "Indent"
			},

			insertHorizontalRule: {
				groupIndex: 6,
				visible: true,
				tags: ["hr"],
				tooltip: "Insert Horizontal Rule"
			},

			insertImage: {
				groupIndex: 6,
				visible: true,
				exec: function () {
					var self = this;

					if ($.wysiwyg.controls && $.wysiwyg.controls.image) {
						$.wysiwyg.controls.image.init(this);
					} else if ($.wysiwyg.autoload) {
						$.wysiwyg.autoload.control("wysiwyg.image.js", function () {
							self.controls.insertImage.exec.apply(self);
						});
					} else {
						console.error("$.wysiwyg.controls.image not defined. You need to include wysiwyg.image.js file");
					}
				},
				tags: ["img"],
				tooltip: "Insert image"
			},

			insertOrderedList: {
				groupIndex: 5,
				visible: true,
				tags: ["ol"],
				tooltip: "Insert Ordered List"
			},

			insertTable: {
				groupIndex: 6,
				visible: true,
				exec: function () {
					var self = this;

					if ($.wysiwyg.controls && $.wysiwyg.controls.table) {
						$.wysiwyg.controls.table(this);
					} else if ($.wysiwyg.autoload) {
						$.wysiwyg.autoload.control("wysiwyg.table.js", function () {
							self.controls.insertTable.exec.apply(self);
						});
					} else {
						console.error("$.wysiwyg.controls.table not defined. You need to include wysiwyg.table.js file");
					}
				},
				tags: ["table"],
				tooltip: "Insert table"
			},

			insertUnorderedList: {
				groupIndex: 5,
				visible: true,
				tags: ["ul"],
				tooltip: "Insert Unordered List"
			},

			italic: {
				groupIndex: 0,
				visible: true,
				tags: ["i", "em"],
				css: {
					fontStyle: "italic"
				},
				tooltip: "Italic",
				hotkey: {"ctrl": 1, "key": 73}
			},

			justifyCenter: {
				groupIndex: 1,
				visible: true,
				tags: ["center"],
				css: {
					textAlign: "center"
				},
				tooltip: "Justify Center"
			},

			justifyFull: {
				groupIndex: 1,
				visible: true,
				css: {
					textAlign: "justify"
				},
				tooltip: "Justify Full"
			},

			justifyLeft: {
				visible: true,
				groupIndex: 1,
				css: {
					textAlign: "left"
				},
				tooltip: "Justify Left"
			},

			justifyRight: {
				groupIndex: 1,
				visible: true,
				css: {
					textAlign: "right"
				},
				tooltip: "Justify Right"
			},

			ltr: {
				groupIndex: 10,
				visible: false,
				exec: function () {
					var range = this.getInternalRange(),
					p = this.dom.getElement("p");

					if (!p) {
						return false;
					}

					$(p).attr("dir", "ltr");
				},
				tooltip : "Left to Right"
			},

			outdent: {
				groupIndex: 2,
				visible: true,
				tooltip: "Outdent"
			},

			paragraph: {
				groupIndex: 7,
				visible: false,
				className: "paragraph",
				command: "FormatBlock",
				"arguments": ($.browser.msie || $.browser.safari) ? "<p>" : "p",
				tags: ["p"],
				tooltip: "Paragraph"
			},

			paste: {
				groupIndex: 8,
				visible: false,
				tooltip: "Paste"
			},

			redo: {
				groupIndex: 4,
				visible: true,
				tooltip: "Redo"
			},

			removeFormat: {
				groupIndex: 10,
				visible: true,
				exec: function () {
					this.removeFormat();
				},
				tooltip: "Remove formatting"
			},

			rtl: {
				groupIndex: 10,
				visible: false,
				exec: function () {
					var range = this.getInternalRange(),
						p = this.dom.getElement("p");

					if (!p) {
						return false;
					}

					$(p).attr("dir", "rtl");
				},
				tooltip : "Right to Left"
			},

			strikeThrough: {
				groupIndex: 0,
				visible: true,
				tags: ["s", "strike"],
				css: {
					textDecoration: "line-through"
				},
				tooltip: "Strike-through"
			},

			subscript: {
				groupIndex: 3,
				visible: true,
				tags: ["sub"],
				tooltip: "Subscript"
			},

			superscript: {
				groupIndex: 3,
				visible: true,
				tags: ["sup"],
				tooltip: "Superscript"
			},

			underline: {
				groupIndex: 0,
				visible: true,
				tags: ["u"],
				css: {
					textDecoration: "underline"
				},
				tooltip: "Underline",
				hotkey: {"ctrl": 1, "key": 85}
			},

			undo: {
				groupIndex: 4,
				visible: true,
				tooltip: "Undo"
			}
		};

		this.defaults = {
			html: '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"><html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></head><body style="margin: 0px;">INITIAL_CONTENT</body></html>',
			debug: false,
			controls: {},
			css: {},
			events: {},
			autoGrow: false,
			autoload: {"css": ["jquery.wysiwyg.css", "jquery.wysiwyg.modal.css"]},
			autoSave: true,
			brIE: true,					// http://code.google.com/p/jwysiwyg/issues/detail?id=15
			formHeight: 270,
			formWidth: 440,
			i18n: false,
			iFrameClass: null,
			initialContent: "<p>Initial content</p>",
			maxHeight: 10000,			// see autoGrow
			messages: {
				nonSelection: "Select the text you wish to link"
			},
			toolbarHtml: '<ul role="menu" class="toolbar"></ul>',
			removeHeadings: false,
			replaceDivWithP: false,
			resizeOptions: false,
			rmMsWordMarkup: false,
			rmUnusedControls: false,	// https://github.com/akzhan/jwysiwyg/issues/52
			rmUnwantedBr: true,			// http://code.google.com/p/jwysiwyg/issues/detail?id=11
			tableFiller: "Lorem ipsum"
		};

		this.availableControlProperties = [
			"arguments",
			"callback",
			"className",
			"command",
			"css",
			"custom",
			"exec",
			"groupIndex",
			"hotkey",
			"icon",
			"tags",
			"tooltip",
			"visible"
		];

		this.editor		= null;
		this.editorDoc	= null;
		this.element	= null;
		this.options	= {};
		this.original	= null;
		this.savedRange	= null;
		this.timers		= [];

		this.dom		= { // DOM related properties and methods
			ie:		{
				parent: null // link to dom
			},
			w3c:	{
				parent: null // link to dom
			}
		};
		this.dom.parent		= this;
		this.dom.ie.parent	= this.dom;
		this.dom.w3c.parent	= this.dom;

		this.ui			= {};	// UI related properties and methods
		this.ui.self	= this;
		this.ui.toolbar	= null;
		this.ui.initialHeight = null; // ui.grow

		this.dom.getAncestor = function (element, filterTagName) {
			filterTagName = filterTagName.toLowerCase();

			while (element && "body" !== element.tagName.toLowerCase()) {
				if (filterTagName === element.tagName.toLowerCase()) {
					return element;
				}

				element = element.parentNode;
			}

			return null;
		};

		this.dom.getElement = function (filterTagName) {
			var dom = this;

			if (window.getSelection) {
				return dom.w3c.getElement(filterTagName);
			} else {
				return dom.ie.getElement(filterTagName);
			}
		};

		this.dom.ie.getElement = function (filterTagName) {
			var dom			= this.parent,
				selection	= dom.parent.getInternalSelection(),
				range		= selection.createRange(),
				element;

			if ("Control" === selection.type) {
				// control selection
				if (1 === range.length) {
					element = range.item(0);
				} else {
					// multiple control selection
					return null;
				}
			} else {
				element = range.parentElement();
			}

			return dom.getAncestor(element, filterTagName);
		};

		this.dom.w3c.getElement = function (filterTagName) {
			var dom		= this.parent,
				range	= dom.parent.getInternalRange(),
				element;
			
			if (!range) {
				return null;
			}

			element	= range.commonAncestorContainer;

			if (3 === element.nodeType) {
				element = element.parentNode;
			}

			// if startContainer not Text, Comment, or CDATASection element then
			// startOffset is the number of child nodes between the start of the
			// startContainer and the boundary point of the Range
			if (element === range.startContainer) {
				element = element.childNodes[range.startOffset];
			}

			return dom.getAncestor(element, filterTagName);
		};

		this.ui.addHoverClass = function () {
			$(this).addClass("wysiwyg-button-hover");
		};

		this.ui.appendControls = function () {
			var ui = this,
				self = this.self,
				controls = self.parseControls(),
				hasVisibleControls	= true, // to prevent separator before first item
				groups = [],
				controlsByGroup = {},
				i,
				currentGroupIndex, // jslint wants all vars at top of function
				iterateGroup = function (controlName, control) {
					if (control.groupIndex && currentGroupIndex !== control.groupIndex) {
						currentGroupIndex = control.groupIndex;
						hasVisibleControls = false;
					}

					if (!control.visible) {
						return;
					}

					if (!hasVisibleControls) {
						ui.appendItemSeparator();
						hasVisibleControls = true;
					}

					if (control.custom) {
						ui.appendItemCustom(controlName, control);
					} else {
						ui.appendItem(controlName, control);
					}
				};

			$.each(controls, function (name, c) {
				var index = "empty";

				if (undefined !== c.groupIndex) {
					if ("" === c.groupIndex) {
						index = "empty";
					} else {
						index = c.groupIndex;
					}
				}

				if (undefined === controlsByGroup[index]) {
					groups.push(index);
					controlsByGroup[index] = {};
				}
				controlsByGroup[index][name] = c;
			});

			groups.sort(function (a, b) {
				if ("number" === typeof (a) && typeof (a) === typeof (b)) {
					return (a - b);
				} else {
					a = "" + a;
					b = "" + b;

					if (a > b) {
						return 1;
					}

					if (a === b) {
						return 0;
					}

					return -1;
				}
			});

			if (0 < groups.length) {
				// set to first index in groups to proper placement of separator
				currentGroupIndex = groups[0];
			}

			for (i = 0; i < groups.length; i += 1) {
				$.each(controlsByGroup[groups[i]], iterateGroup);
			}
		};

		this.ui.appendItem = function (name, control) {
			var self = this.self,
				className = control.className || control.command || name || "empty",
				tooltip = control.tooltip || control.command || name || "";

			if ($.wysiwyg.i18n) {
				tooltip = $.wysiwyg.i18n.t(tooltip, "controls");
			}

			return $('<li role="menuitem" unselectable="on">' + (className) + "</li>")
				.addClass(className)
				.attr("title", tooltip)
				.hover(this.addHoverClass, this.removeHoverClass)
				.click(function () {
					if ("true" === $(this).attr("disabled")) {
						return false;
					}

					self.triggerControl.apply(self, [name, control]);

					this.blur();
					self.ui.returnRange();
					self.ui.focus();
				})
				.appendTo(self.ui.toolbar);
		};

		this.ui.appendItemCustom = function (name, control) {
			var self = this.self,
				tooltip = control.tooltip || control.command || name || "";

			if ($.wysiwyg.i18n) {
				tooltip = $.wysiwyg.i18n.t(tooltip, "controls");
			}

			if (control.callback) {
				$(window).bind("trigger-" + name + ".wysiwyg", control.callback);
			}

			return $('<li role="menuitem" unselectable="on" style="background: url(\'' + control.icon + '\') no-repeat;"></li>')
				.addClass("custom-command-" + name)
				.addClass("wysiwyg-custom-command")
				.addClass(name)
				.attr("title", control.tooltip)
				.hover(this.addHoverClass, this.removeHoverClass)
				.click(function () {
					if ("true" === $(this).attr("disabled")) {
						return false;
					}

					self.triggerControl.apply(self, [name, control]);

					this.blur();
					self.ui.returnRange();
					self.ui.focus();

					self.triggerControlCallback(name);
				})
				.appendTo(self.ui.toolbar);
		};

		this.ui.appendItemSeparator = function () {
			var self = this.self;
			return $('<li role="separator" class="separator"></li>').appendTo(self.ui.toolbar);
		};

		this.autoSaveFunction = function () {
			this.saveContent();
		};

		this.ui.checkTargets = function (element) {
			var self = this.self;

			$.each(self.options.controls, function (name, control) {
				var className = control.className || control.command || name || "empty",
					tags,
					elm,
					css,
					el,
					checkActiveStatus = function (cssProperty, cssValue) {
						var handler;

						if ("function" === typeof (cssValue)) {
							handler = cssValue;
							if (handler(el.css(cssProperty).toString().toLowerCase(), self)) {
								self.ui.toolbar.find("." + className).addClass("active");
							}
						} else {
							if (el.css(cssProperty).toString().toLowerCase() === cssValue) {
								self.ui.toolbar.find("." + className).addClass("active");
							}
						}
					};

				if ("fullscreen" !== className) {
					self.ui.toolbar.find("." + className).removeClass("active");
				}

				if (control.tags || (control.options && control.options.tags)) {
					tags = control.tags || (control.options && control.options.tags);

					elm = element;
					while (elm) {
						if (elm.nodeType !== 1) {
							break;
						}

						if ($.inArray(elm.tagName.toLowerCase(), tags) !== -1) {
							self.ui.toolbar.find("." + className).addClass("active");
						}

						elm = elm.parentNode;
					}
				}

				if (control.css || (control.options && control.options.css)) {
					css = control.css || (control.options && control.options.css);
					el = $(element);

					while (el) {
						if (el[0].nodeType !== 1) {
							break;
						}
						$.each(css, checkActiveStatus);

						el = el.parent();
					}
				}
			});
		};

		this.ui.designMode = function () {
			var attempts = 3,
				self = this.self,
				runner = function (attempts) {
					if ("on" === self.editorDoc.designMode) {
						if (self.timers.designMode) {
							window.clearTimeout(self.timers.designMode);
						}

						// IE needs to reget the document element (this.editorDoc) after designMode was set
						if (self.innerDocument() !== self.editorDoc) {
							self.ui.initFrame();
						}

						return;
					}

					try {
						self.editorDoc.designMode = "on";
					} catch (e) {
					}

					attempts -= 1;
					if (attempts > 0) {
						self.timers.designMode = window.setTimeout(function () { runner(attempts); }, 100);
					}
				};

			runner(attempts);
		};

		this.destroy = function () {
			var i, $form = this.element.closest("form");

			for (i = 0; i < this.timers.length; i += 1) {
				window.clearTimeout(this.timers[i]);
			}

			// Remove bindings
			$form.unbind(".wysiwyg");
			this.element.remove();
			$.removeData(this.original, "wysiwyg");
			$(this.original).show();
			return this;
		};

		this.getRangeText = function () {
			var r = this.getInternalRange();

			if (r.toString) {
				r = r.toString();
			} else if (r.text) {	// IE
				r = r.text;
			}

			return r;
		};
		//not used?
		this.execute = function (command, arg) {
			if (typeof (arg) === "undefined") {
				arg = null;
			}
			this.editorDoc.execCommand(command, false, arg);
		};

		this.extendOptions = function (options) {
			var controls = {}, namesToRemove = [];

			/**
			 * If the user set custom controls, we catch it, and merge with the
			 * defaults controls later.
			 */
			if ("object" === typeof options.controls) {
				controls = options.controls;
				delete options.controls;
			}

			options = $.extend(true, {}, this.defaults, options);
			options.controls = $.extend(true, this.controls, controls);

			if (options.rmUnusedControls) {
				$.each(options.controls, function (controlName) {
					if (!controls[controlName]) {
						namesToRemove.push(controlName);
					}
				});

				$.each(namesToRemove, function (name) {
					delete options.controls[namesToRemove[name]];
				});
			}

			return options;
		};

		this.ui.focus = function () {
			var self = this.self;

			self.editor.get(0).contentWindow.focus();
			return self;
		};

		this.ui.returnRange = function () {
			var self = this.self, sel;

			if (self.savedRange !== null) {
				if (window.getSelection) { //non IE and there is already a selection
					sel = window.getSelection();
					if (sel.rangeCount > 0) {
						sel.removeAllRanges();
					}
					try {
						sel.addRange(self.savedRange);
					} catch (e) {
						console.error(e);
					}
				} else if (window.document.createRange) { // non IE and no selection
					window.getSelection().addRange(self.savedRange);
				} else if (window.document.selection) { //IE
					self.savedRange.select();
				}

				self.savedRange = null;
			}
		};

		this.getContent = function () {
			return this.editorDoc.body.innerHTML;
		};

		this.getElementByAttributeValue = function (tagName, attributeName, attributeValue) {
			var i, value, elements = this.editorDoc.getElementsByTagName(tagName);

			for (i = 0; i < elements.length; i += 1) {
				value = elements[i].getAttribute(attributeName);

				if ($.browser.msie) {
					/** IE add full path, so I check by the last chars. */
					value = value.substr(value.length - attributeValue.length);
				}

				if (value === attributeValue) {
					return elements[i];
				}
			}

			return false;
		};

		this.getInternalRange = function () {
			var selection = this.getInternalSelection();

			if (!selection) {
				return null;
			}

			if (selection.rangeCount && selection.rangeCount > 0) { // w3c
				return selection.getRangeAt(0);
			} else if (selection.createRange) { // ie
				return selection.createRange();
			}

			return null;
		};

		this.getInternalSelection = function () {
			// firefox: document.getSelection is deprecated
			if (this.editor.get(0).contentWindow) {
				if (this.editor.get(0).contentWindow.getSelection) {
					return this.editor.get(0).contentWindow.getSelection();
				}
				if (this.editor.get(0).contentWindow.selection) {
					return this.editor.get(0).contentWindow.selection;
				}
			}
			if (this.editorDoc.getSelection) {
				return this.editorDoc.getSelection();
			}
			if (this.editorDoc.selection) {
				return this.editorDoc.selection;
			}

			return null;
		};

		this.getRange = function () {
			var selection = this.getSelection();

			if (!selection) {
				return null;
			}

			if (selection.rangeCount && selection.rangeCount > 0) { // w3c
				selection.getRangeAt(0);
			} else if (selection.createRange) { // ie
				return selection.createRange();
			}

			return null;
		};

		this.getSelection = function () {
			return (window.getSelection) ? window.getSelection() : window.document.selection;
		};

		// :TODO: you can type long string and letters will be hidden because of overflow
		this.ui.grow = function () {
			var self = this.self,
				innerBody = $(self.editorDoc.body),
				innerHeight = $.browser.msie ? innerBody[0].scrollHeight : innerBody.height() + 2 + 20, // 2 - borders, 20 - to prevent content jumping on grow
				minHeight = self.ui.initialHeight,
				height = Math.max(innerHeight, minHeight);

			height = Math.min(height, self.options.maxHeight);

			self.editor.attr("scrolling", height < self.options.maxHeight ? "no" : "auto"); // hide scrollbar firefox
			innerBody.css("overflow", height < self.options.maxHeight ? "hidden" : ""); // hide scrollbar chrome

			self.editor.get(0).height = height;

			return self;
		};

		this.init = function (element, options) {
			var self = this,
				$form = $(element).closest("form"),
				newX = element.width || element.clientWidth || 0,
				newY = element.height || element.clientHeight || 0,
				i;

			this.options	= this.extendOptions(options);
			this.original	= element;
			this.ui.toolbar	= $(this.options.toolbarHtml);

			if (this.options.autoload) {
				if ($.wysiwyg.autoload) {
					if (this.options.autoload.css) {
						for (i = 0; i < this.options.autoload.css.length; i += 1) {
							$.wysiwyg.autoload.css(this.options.autoload.css[i]);
						}
					}
				}
			}

			if (this.options.i18n && $.wysiwyg.i18n) {
				$.wysiwyg.i18n.init(this, this.options.i18n);
			}

			if ($.browser.msie && parseInt($.browser.version, 10) < 8) {
				this.options.autoGrow = false;
			}

			if (newX === 0 && element.cols) {
				newX = (element.cols * 8) + 21;

				// fix for issue 30 ( http://github.com/akzhan/jwysiwyg/issues/issue/30 )
//				element.cols = 1;
			}
			if (newY === 0 && element.rows) {
				newY = (element.rows * 16) + 16;

				// fix for issue 30 ( http://github.com/akzhan/jwysiwyg/issues/issue/30 )
//				element.rows = 1;
			}

			this.editor = $(window.location.protocol === "https:" ? '<iframe src="javascript:false;"></iframe>' : "<iframe></iframe>").attr("frameborder", "0");

			if (this.options.iFrameClass) {
				this.editor.addClass(this.options.iFrameClass);
			} else {
				this.editor.css({
					minHeight: (newY - 6).toString() + "px",
					// fix for issue 12 ( http://github.com/akzhan/jwysiwyg/issues/issue/12 )
					width: (newX > 50) ? (newX - 8).toString() + "px" : ""
				});
				if ($.browser.msie && parseInt($.browser.version, 10) < 7) {
					this.editor.css("height", newY.toString() + "px");
				}
			}
			/**
			 * http://code.google.com/p/jwysiwyg/issues/detail?id=96
			 */
			this.editor.attr("tabindex", $(element).attr("tabindex"));

			this.element = $("<div/>").addClass("wysiwyg");

			if (!this.options.iFrameClass) {
				this.element.css({
					width: (newX > 0) ? newX.toString() + "px" : "100%"
				});
			}

			$(element).hide().before(this.element);

			this.viewHTML = false;

			/**
			 * @link http://code.google.com/p/jwysiwyg/issues/detail?id=52
			 */
			this.initialContent = $(element).val();
			this.ui.initFrame();

			if (this.options.resizeOptions && $.fn.resizable) {
				this.element.resizable($.extend(true, {
					alsoResize: this.editor
				}, this.options.resizeOptions));
			}

			if (this.options.autoSave) {
				$form.bind("submit.wysiwyg", function () { self.autoSaveFunction(); });
			}

			$form.bind("reset.wysiwyg", function () { self.resetFunction(); });
		};

		this.ui.initFrame = function () {
			var self = this.self,
				stylesheet,
				growHandler,
				saveHandler;

			self.ui.appendControls();
			self.element.append(self.ui.toolbar)
				.append($("<div><!-- --></div>")
					.css({
						clear: "both"
					}))
				.append(self.editor);

			self.editorDoc = self.innerDocument();
			self.ui.designMode();
			self.editorDoc.open();
			self.editorDoc.write(
				self.options.html
					/**
					 * @link http://code.google.com/p/jwysiwyg/issues/detail?id=144
					 */
					.replace(/INITIAL_CONTENT/, function () { return self.wrapInitialContent(); })
			);
			self.editorDoc.close();

			$(self.editorDoc).bind("click.wysiwyg", function (event) {
				self.ui.checkTargets(event.target ? event.target : event.srcElement);
			});

			/**
			 * @link http://code.google.com/p/jwysiwyg/issues/detail?id=20
			 */
			$(self.original).focus(function () {
				if ($(this).filter(":visible")) {
					return;
				}
				self.ui.focus();
			});

			$(self.editorDoc).keydown(function (event) {
				var emptyContentRegex = /^<([\w]+)[^>]*>(<br\/?>)?<\/\1>/;
				if (event.keyCode === 8) { // backspace
					if (emptyContentRegex.test(self.getContent())) { // if content is empty
						event.stopPropagation(); // prevent remove single empty tag
						return false;
					}
				}
				return true;
			});

			if (!$.browser.msie) {
				$(self.editorDoc).keydown(function (event) {
					var controlName;

					/* Meta for Macs. tom@punkave.com */
					if (event.ctrlKey || event.metaKey) {
						for (controlName in self.controls) {
							if (self.controls[controlName].hotkey && self.controls[controlName].hotkey.ctrl) {
								if (event.keyCode === self.controls[controlName].hotkey.key) {
									self.triggerControl.apply(self, [controlName, self.controls[controlName]]);

									return false;
								}
							}
						}
					}

					return true;
				});
			} else if (self.options.brIE) {
				$(self.editorDoc).keydown(function (event) {
					if (event.keyCode === 13) {
						var rng = self.getRange();
						rng.pasteHTML("<br/>");
						rng.collapse(false);
						rng.select();

						return false;
					}

					return true;
				});
			}

			if (self.options.rmMsWordMarkup) {
				$(self.editorDoc).bind("keyup.wysiwyg", function (event) {
					if (event.ctrlKey || event.metaKey) {
						// CTRL + V (paste)
						if (86 === event.keyCode) {
							if (self.options.rmMsWordMarkup) {
								if ($.wysiwyg.rmFormat) {
									if ("object" === typeof (self.options.rmMsWordMarkup)) {
										$.wysiwyg.rmFormat.run(self, {rules: { msWordMarkup: self.options.rmMsWordMarkup }});
									} else {
										$.wysiwyg.rmFormat.run(self, {rules: { msWordMarkup: { enabled: true }}});
									}
								}
							}
						}
					}
				});
			}

			if (self.options.autoSave) {
				$(self.editorDoc).keydown(function () { self.autoSaveFunction(); })
					.keyup(function () { self.autoSaveFunction(); })
					.mousedown(function () { self.autoSaveFunction(); })
					.bind($.support.noCloneEvent ? "input.wysiwyg" : "paste.wysiwyg", function () { self.autoSaveFunction(); });
			}

			if (self.options.autoGrow) {
				self.ui.initialHeight = $(self.editorDoc).height();
				$(self.editorDoc.body).css("border", "1px solid white"); // cancel margin collapsing

				growHandler = function () {
					self.ui.grow();
				};

				$(self.editorDoc).keyup(growHandler);
				$(self.editorDoc).bind("wysiwyg:refresh", growHandler);

				// fix when content height > textarea height
				self.ui.grow();
			}

			if (self.options.css) {
				if (String === self.options.css.constructor) {
					if ($.browser.msie) {
						stylesheet = self.editorDoc.createStyleSheet(self.options.css);
						$(stylesheet).attr({
							"media":	"all"
						});
					} else {
						stylesheet = $("<link/>").attr({
							"href":		self.options.css,
							"media":	"all",
							"rel":		"stylesheet",
							"type":		"text/css"
						});

						$(self.editorDoc).find("head").append(stylesheet);
					}
				} else {
					self.timers.initFrame_Css = window.setTimeout(function () {
						$(self.editorDoc.body).css(self.options.css);
					}, 0);
				}
			}

			if (self.initialContent.length === 0) {
				if ("function" === typeof (self.options.initialContent)) {
					self.setContent(self.options.initialContent());
				} else {
					self.setContent(self.options.initialContent);
				}
			}

			$.each(self.options.events, function (key, handler) {
				$(self.editorDoc).bind(key + ".wysiwyg", handler);
			});

			// restores selection properly on focus
			if ($.browser.msie) {
				// Event chain: beforedeactivate => focusout => blur.
				// Focusout & blur fired too late to handle internalRange() in dialogs.
				// When clicked on input boxes both got range = null
				$(self.editorDoc).bind("beforedeactivate.wysiwyg", function () {
					self.savedRange = self.getInternalRange();
				});
			} else {
				$(self.editorDoc).bind("blur.wysiwyg", function () {
					self.savedRange = self.getInternalRange();
				});
			}

			$(self.editorDoc.body).addClass("wysiwyg");
			if (self.options.events && self.options.events.save) {
				saveHandler = self.options.events.save;

				$(self.editorDoc).bind("keyup.wysiwyg", saveHandler);
				$(self.editorDoc).bind("change.wysiwyg", saveHandler);

				if ($.support.noCloneEvent) {
					$(self.editorDoc).bind("input.wysiwyg", saveHandler);
				} else {
					$(self.editorDoc).bind("paste.wysiwyg", saveHandler);
					$(self.editorDoc).bind("cut.wysiwyg", saveHandler);
				}
			}
		};

		this.innerDocument = function () {
			var element = this.editor.get(0);

			if (element.nodeName.toLowerCase() === "iframe") {
				if (element.contentDocument) {				// Gecko
					return element.contentDocument;
				} else if (element.contentWindow) {			// IE
					return element.contentWindow.document;
				}

				console.error("Unexpected error in innerDocument");
				/*
				 return ( $.browser.msie )
				 ? document.frames[element.id].document
				 : element.contentWindow.document // contentDocument;
				 */
			}

			return element;
		};

		this.insertHtml = function (szHTML) {
			var img;

			if (!szHTML || szHTML.length === 0) {
				return this;
			}

			if ($.browser.msie) {
				this.ui.focus();
				this.editorDoc.execCommand("insertImage", false, "#jwysiwyg#");
				img = this.getElementByAttributeValue("img", "src", "#jwysiwyg#");
				if (img) {
					$(img).replaceWith(szHTML);
				}
			} else {
				this.editorDoc.execCommand("insertHTML", false, szHTML);
			}
			return this;
		};

		this.parseControls = function () {
			var self = this;

			$.each(this.options.controls, function (controlName, control) {
				$.each(control, function (propertyName) {
					if (-1 === $.inArray(propertyName, self.availableControlProperties)) {
						throw controlName + '["' + propertyName + '"]: property "' + propertyName + '" not exists in Wysiwyg.availableControlProperties';
					}
				});
			});

			if (this.options.parseControls) {
				return this.options.parseControls.call(this);
			}

			return this.options.controls;
		};

		this.removeFormat = function () {
			if ($.browser.msie) {
				this.ui.focus();
			}

			if (this.options.removeHeadings) {
				this.editorDoc.execCommand("formatBlock", false, "<p>"); // remove headings
			}

			this.editorDoc.execCommand("removeFormat", false, null);
			this.editorDoc.execCommand("unlink", false, null);

			if ($.wysiwyg.rmFormat && $.wysiwyg.rmFormat.enabled) {
				$.wysiwyg.rmFormat.run(this);
			}

			return this;
		};

		this.ui.removeHoverClass = function () {
			$(this).removeClass("wysiwyg-button-hover");
		};

		this.resetFunction = function () {
			this.setContent(this.initialContent);
			this.saveContent();
		};

		this.saveContent = function () {
			if (this.original) {
				var content;

				if (this.viewHTML) {
					this.setContent($(this.original).val());
				}

				content = this.getContent();

				if (this.options.rmUnwantedBr) {
					content = content.replace(/<br\/?>$/, "");
				}

				if (this.options.replaceDivWithP) {
					newContent = $("<div/>").addClass("temp").append(content);

					newContent.children("div").each(function () {
						var element = $(this), p = element.find("p"), i;

						if (0 === p.length) {
							p = $("<p></p>");

							if (this.attributes.length > 0) {
								for (i = 0; i < this.attributes.length; i += 1) {
									p.attr(this.attributes[i].name, element.attr(this.attributes[i].name));
								}
							}

							p.append(element.html());

							element.replaceWith(p);
						}
					});
					
					content = newContent.html();
				}

				$(this.original).val(content);

				if (this.options.events && this.options.events.save) {
					this.options.events.save.call(this);
				}
			}

			return this;
		};

		this.setContent = function (newContent) {
			this.editorDoc.body.innerHTML = newContent;
			return this;
		};

		this.triggerControl = function (name, control) {
			var cmd = control.command || name,
				args = control["arguments"] || [];

			if (control.exec) {
				control.exec.apply(this);
			} else {
				this.ui.focus();
				this.ui.withoutCss();
				// when click <Cut>, <Copy> or <Paste> got "Access to XPConnect service denied" code: "1011"
				// in Firefox untrusted JavaScript is not allowed to access the clipboard
				try {
					this.editorDoc.execCommand(cmd, false, args);
				} catch (e) {
					console.error(e);
				}
			}

			if (this.options.autoSave) {
				this.autoSaveFunction();
			}
		};

		this.triggerControlCallback = function (name) {
			$(window).trigger("trigger-" + name + ".wysiwyg", [this]);
		};

		this.ui.withoutCss = function () {
			var self = this.self;

			if ($.browser.mozilla) {
				try {
					self.editorDoc.execCommand("styleWithCSS", false, false);
				} catch (e) {
					try {
						self.editorDoc.execCommand("useCSS", false, true);
					} catch (e2) {
					}
				}
			}

			return self;
		};

		this.wrapInitialContent = function () {
			var content = this.initialContent,
				found = content.match(/<\/?p>/gi);

			if (!found) {
				return "<p>" + content + "</p>";
			} else {
				// :TODO: checking/replacing
			}

			return content;
		};
	}

	/*
	 * Wysiwyg namespace: public properties and methods
	 */
	$.wysiwyg = {
		/**
		 * Custom control support by Alec Gorge ( http://github.com/alecgorge )
		 */
		addControl: function (object, name, settings) {
			if ("object" !== typeof (object) || !object.context) {
				object = this;
			}

			if (!object.each) {
				console.error("Something goes wrong, check object");
			}

			return object.each(function () {
				var oWysiwyg = $(this).data("wysiwyg"),
					customControl = {},
					toolbar;

				if (!oWysiwyg) {
					return this;
				}

				customControl[name] = $.extend(true, {visible: true, custom: true}, settings);
				$.extend(true, oWysiwyg.controls, customControl);

				// render new toolbar
				toolbar = $(oWysiwyg.options.toolbarHtml);
				oWysiwyg.ui.toolbar.replaceWith(toolbar);
				oWysiwyg.ui.toolbar = toolbar;
				oWysiwyg.ui.appendControls();
			});
		},

		clear: function (object) {
			if ("object" !== typeof (object) || !object.context) {
				object = this;
			}

			if (!object.each) {
				console.error("Something goes wrong, check object");
			}

			return object.each(function () {
				var oWysiwyg = $(this).data("wysiwyg");

				if (!oWysiwyg) {
					return this;
				}

				oWysiwyg.setContent("");
				oWysiwyg.saveContent();
			});
		},

		console: console, // let our console be available for extensions

		destroy: function (object) {
			if ("object" !== typeof (object) || !object.context) {
				object = this;
			}

			if (!object.each) {
				console.error("Something goes wrong, check object");
			}

			return object.each(function () {
				var oWysiwyg = $(this).data("wysiwyg");

				if (!oWysiwyg) {
					return this;
				}

				oWysiwyg.destroy();
			});
		},

		"document": function (object) {
			if ("object" !== typeof (object) || !object.context) {
				object = this;
			}

			if (!object.each) {
				console.error("Something goes wrong, check object");
			}

			// no chains because of return
			var oWysiwyg = object.data("wysiwyg");

			if (!oWysiwyg) {
				return undefined;
			}

			return $(oWysiwyg.editorDoc);
		},

		getContent: function (object) {
			if ("object" !== typeof (object) || !object.context) {
				object = this;
			}

			if (!object.each) {
				console.error("Something goes wrong, check object");
			}

			// no chains because of return
			var oWysiwyg = object.data("wysiwyg");

			if (!oWysiwyg) {
				return undefined;
			}

			return oWysiwyg.getContent();
		},

		init: function (object, options) {
			if ("object" !== typeof (object) || !object.context) {
				object = this;
			}

			if (!object.each) {
				console.error("Something goes wrong, check object");
			}

			return object.each(function () {
				var opts = $.extend(true, {}, options),
					obj;

				// :4fun:
				// remove this textarea validation and change line in this.saveContent function
				// $(this.original).val(content); to $(this.original).html(content);
				// now you can make WYSIWYG editor on h1, p, and many more tags
				if (("textarea" !== this.nodeName.toLowerCase()) || $(this).data("wysiwyg")) {
					return;
				}

				obj = new Wysiwyg();
				obj.init(this, opts);
				$.data(this, "wysiwyg", obj);
			});
		},

		insertHtml: function (object, szHTML) {
			if ("object" !== typeof (object) || !object.context) {
				object = this;
			}

			if (!object.each) {
				console.error("Something goes wrong, check object");
			}

			return object.each(function () {
				var oWysiwyg = $(this).data("wysiwyg");

				if (!oWysiwyg) {
					return this;
				}

				oWysiwyg.insertHtml(szHTML);
			});
		},

		plugin: {
			exists: function (name) {
				var plugin;

				if ("string" !== typeof (name)) {
					return false;
				}

				plugin = this.parseName(name);

				if (!$.wysiwyg[plugin.name]) {
					return false;
				}

				if (!$.wysiwyg[plugin.name][plugin.method]) {
					return false;
				}

				return true;
			},

			parseName: function (name) {
				var elements;

				if ("string" !== typeof (name)) {
					return false;
				}

				elements = name.split(".");

				if (2 > elements.length) {
					return false;
				}

				return {name: elements[0], method: elements[1]};
			},

			register: function (data) {
				if (!data.name) {
					console.error("Plugin name missing");
				}

				$.each($.wysiwyg, function (pluginName) {
					if (pluginName === data.name) {
						console.error("Plugin with name '" + data.name + "' was already registered");
					}
				});

				$.wysiwyg[data.name] = data;

				return true;
			}
		},

		removeFormat: function (object) {
			if ("object" !== typeof (object) || !object.context) {
				object = this;
			}

			if (!object.each) {
				console.error("Something goes wrong, check object");
			}

			return object.each(function () {
				var oWysiwyg = $(this).data("wysiwyg");

				if (!oWysiwyg) {
					return this;
				}

				oWysiwyg.removeFormat();
			});
		},

		save: function (object) {
			if ("object" !== typeof (object) || !object.context) {
				object = this;
			}

			if (!object.each) {
				console.error("Something goes wrong, check object");
			}

			return object.each(function () {
				var oWysiwyg = $(this).data("wysiwyg");

				if (!oWysiwyg) {
					return this;
				}

				oWysiwyg.saveContent();
			});
		},

		setContent: function (object, newContent) {
			if ("object" !== typeof (object) || !object.context) {
				object = this;
			}

			if (!object.each) {
				console.error("Something goes wrong, check object");
			}

			return object.each(function () {
				var oWysiwyg = $(this).data("wysiwyg");

				if (!oWysiwyg) {
					return this;
				}

				oWysiwyg.setContent(newContent);
				oWysiwyg.saveContent();
			});
		},

		triggerControl: function (object, controlName) {
			if ("object" !== typeof (object) || !object.context) {
				object = this;
			}

			if (!object.each) {
				console.error("Something goes wrong, check object");
			}

			return object.each(function () {
				var oWysiwyg = $(this).data("wysiwyg");

				if (!oWysiwyg) {
					return this;
				}

				if (!oWysiwyg.controls[controlName]) {
					console.error("Control '" + controlName + "' not exists");
				}

				oWysiwyg.triggerControl.apply(oWysiwyg, [controlName, oWysiwyg.controls[controlName]]);
			});
		},

		utils: {
			extraSafeEntities: [["<", ">", "'", '"', " "], [32]],

			encodeEntities: function (str) {
				var self = this, aStr, aRet = [];

				if (this.extraSafeEntities[1].length === 0) {
					$.each(this.extraSafeEntities[0], function (i, ch) {
						self.extraSafeEntities[1].push(ch.charCodeAt());
					});
				}
				aStr = str.split("");
				$.each(aStr, function (i) {
					var iC = aStr[i].charCodeAt();
					if ($.inArray(iC, self.extraSafeEntities[1]) && (iC < 65 || iC > 127 || (iC > 90 && iC < 97))) {
						aRet.push('&#' + iC + ';');
					} else {
						aRet.push(aStr[i]);
					}
				});

				return aRet.join('');
			}
		}
	};

	$.fn.wysiwyg = function (method) {
		var args = arguments, plugin;

		if ("undefined" !== typeof $.wysiwyg[method]) {
			// set argument object to undefined
			args = Array.prototype.concat.call([args[0]], [undefined], Array.prototype.slice.call(args, 1));
			return $.wysiwyg[method].apply(this, Array.prototype.slice.call(args, 1));
		} else if ("object" === typeof method || !method) {
			Array.prototype.unshift.call(args, undefined);
			return $.wysiwyg.init.apply(this, args);
		} else if ($.wysiwyg.plugin.exists(method)) {
			plugin = $.wysiwyg.plugin.parseName(method);
			args = Array.prototype.concat.call([args[0]], [undefined], Array.prototype.slice.call(args, 1));
			return $.wysiwyg[plugin.name][plugin.method].apply(this, Array.prototype.slice.call(args, 1));
		} else {
			console.error("Method '" +  method + "' does not exist on jQuery.wysiwyg.\nTry to include some extra controls or plugins");
		}
	};
})(jQuery);


/**
 * Controls: Image plugin
 *
 * Depends on jWYSIWYG
 */
(function ($) {
	if (undefined === $.wysiwyg) {
		throw "wysiwyg.image.js depends on $.wysiwyg";
	}

	if (!$.wysiwyg.controls) {
		$.wysiwyg.controls = {};
	}

	/*
	 * Wysiwyg namespace: public properties and methods
	 */
	$.wysiwyg.controls.image = {
		init: function (Wysiwyg) {
			var self = this, elements, dialog, szURL, formImageHtml,
				formTextLegend, formTextPreview, formTextUrl, formTextTitle,
				formTextDescription, formTextWidth, formTextHeight, formTextOriginal,
				formTextFloat, formTextFloatNone, formTextFloatLeft, formTextFloatRight,
				formTextSubmit, formTextReset,
				img = {
					alt: "",
					self: Wysiwyg.dom.getElement("img"), // link to element node
					src: "http://",
					title: ""
				};

			formTextLegend  = "Insert Image";
			formTextPreview = "Preview";
			formTextUrl     = "URL";
			formTextTitle   = "Title";
			formTextDescription = "Description";
			formTextWidth   = "Width";
			formTextHeight  = "Height";
			formTextOriginal = "Original W x H";
			formTextFloat	= "Float";
			formTextFloatNone = "None";
			formTextFloatLeft = "Left";
			formTextFloatRight = "Right";
			formTextSubmit  = "Insert Image";
			formTextReset   = "Cancel";

			if ($.wysiwyg.i18n) {
				formTextLegend = $.wysiwyg.i18n.t(formTextLegend, "dialogs.image");
				formTextPreview = $.wysiwyg.i18n.t(formTextPreview, "dialogs.image");
				formTextUrl = $.wysiwyg.i18n.t(formTextUrl, "dialogs.image");
				formTextTitle = $.wysiwyg.i18n.t(formTextTitle, "dialogs.image");
				formTextDescription = $.wysiwyg.i18n.t(formTextDescription, "dialogs.image");
				formTextWidth = $.wysiwyg.i18n.t(formTextWidth, "dialogs.image");
				formTextHeight = $.wysiwyg.i18n.t(formTextHeight, "dialogs.image");
				formTextOriginal = $.wysiwyg.i18n.t(formTextOriginal, "dialogs.image");
				formTextFloat = $.wysiwyg.i18n.t(formTextFloat, "dialogs.image");
				formTextFloatNone = $.wysiwyg.i18n.t(formTextFloatNone, "dialogs.image");
				formTextFloatLeft = $.wysiwyg.i18n.t(formTextFloatLeft, "dialogs.image");
				formTextFloatRight = $.wysiwyg.i18n.t(formTextFloatRight, "dialogs.image");
				formTextSubmit = $.wysiwyg.i18n.t(formTextSubmit, "dialogs.image");
				formTextReset = $.wysiwyg.i18n.t(formTextReset, "dialogs");
			}

			formImageHtml = '<form class="wysiwyg"><fieldset><legend>' + formTextLegend + '</legend>' +
				'<label>' + formTextPreview + ': <img src="" alt="' + formTextPreview + '" style="float: left; margin: 5px; width: 80px; height: 60px; border: 1px solid rgb(192, 192, 192);"/></label>' +
				'<label>' + formTextUrl + ': <input type="text" name="src" value=""/></label>' +
				'<label>' + formTextTitle + ': <input type="text" name="imgtitle" value=""/></label>' +
				'<label>' + formTextDescription + ': <input type="text" name="description" value=""/></label>' +
				'<label>' + formTextWidth + ' x ' + formTextHeight + ': <input type="text" name="width" value="" class="width"/> x <input type="text" name="height" value="" class="height"/></label>' +
				'<label>' + formTextOriginal + ': <input type="text" name="naturalWidth" value="" class="width" disabled="disabled"/> x ' +
				'<input type="text" name="naturalHeight" value="" class="height" disabled="disabled"/></label>' +
				'<label>' + formTextFloat + ': <select name="float">' + 
				'<option value="">' + formTextFloatNone + '</option>' +
				'<option value="left">' + formTextFloatLeft + '</option>' +
				'<option value="right">' + formTextFloatRight + '</option></select></label>' +
				'<input type="submit" class="button" value="' + formTextSubmit + '"/> ' +
				'<input type="reset" value="' + formTextReset + '"/></fieldset></form>';

			if (img.self) {
				img.src = img.self.src ? img.self.src : "";
				img.alt = img.self.alt ? img.self.alt : "";
				img.title = img.self.title ? img.self.title : "";
				img.width = img.self.width ? img.self.width : "";
				img.height = img.self.height ? img.self.height : "";
			}

			if ($.modal) {
				elements = $(formImageHtml);
				elements = self.makeForm(elements, img);

				$.modal(elements, {
					onShow: function (dialog) {
						$("input:submit", dialog.data).click(function (e) {
							e.preventDefault();

							self.processInsert(dialog, Wysiwyg, img);

							$.modal.close();
						});
						$("input:reset", dialog.data).click(function (e) {
							e.preventDefault();
							$.modal.close();
						});
					},
					maxWidth: Wysiwyg.defaults.formWidth,
					maxHeight: Wysiwyg.defaults.formHeight,
					overlayClose: true
				});
			} else if ($.fn.dialog) {
				elements = $(formImageHtml);
				elements = self.makeForm(elements, img);

				dialog = elements.appendTo("body");
				dialog.dialog({
					modal: true,
					width: Wysiwyg.defaults.formWidth,
					height: Wysiwyg.defaults.formHeight,
					open: function (ev, ui) {
						$("input:submit", dialog).click(function (e) {
							e.preventDefault();

							self.processInsert(dialog, Wysiwyg, img);

							$(dialog).dialog("close");
						});
						$("input:reset", dialog).click(function (e) {
							e.preventDefault();
							$(dialog).dialog("close");
						});
					},
					close: function (ev, ui) {
						dialog.dialog("destroy");
					}
				});
			} else {
				if ($.browser.msie) {
					Wysiwyg.ui.focus();
					Wysiwyg.editorDoc.execCommand("insertImage", true, null);
				} else {
					elements = $("<div/>")
						.css({"position": "absolute",
							"z-index": 2000,
							"left": "50%", "top": "50%", "background": "rgb(0, 0, 0)",
							"margin-top": -1 * Math.round(Wysiwyg.defaults.formHeight / 2),
							"margin-left": -1 * Math.round(Wysiwyg.defaults.formWidth / 2)})
						.html(formImageHtml);
					elements = self.makeForm(elements, img);

					$("input:submit", elements).click(function (event) {
						event.preventDefault();

						self.processInsert(elements, Wysiwyg, img);

						$(elements).remove();
					});
					$("input:reset", elements).click(function (event) {
						event.preventDefault();

						if ($.browser.msie) {
							Wysiwyg.ui.returnRange();
						}

						$(elements).remove();
					});

					$("body").append(elements);
				}
			}

			$(Wysiwyg.editorDoc).trigger("wysiwyg:refresh");
		},

		processInsert: function (form, Wysiwyg, img) {
			var image,
				szURL = $('input[name="src"]', form).val(),
				title = $('input[name="imgtitle"]', form).val(),
				description = $('input[name="description"]', form).val(),
				width = $('input[name="width"]', form).val(),
				height = $('input[name="height"]', form).val(),
				styleFloat = $('select[name="float"]', form).val(),
				style = [],
				found;

			if (img.self) {
				// to preserve all img attributes
				$(img.self).attr("src", szURL)
					.attr("title", title)
					.attr("alt", description)
					.css("float", styleFloat);

				if (width.toString().match(/^[0-9]+(px|%)?$/)) {
					$(img.self).css("width", width);
				} else {
					$(img.self).css("width", "");
				}

				if (height.toString().match(/^[0-9]+(px|%)?$/)) {
					$(img.self).css("height", height);
				} else {
					$(img.self).css("height", "");
				}
			} else {
				found = width.toString().match(/^[0-9]+(px|%)?$/);
				if (found) {
					if (found[1]) {
						style.push("width: " + width + ";");
					} else {
						style.push("width: " + width + "px;");
					}
				}

				found = height.toString().match(/^[0-9]+(px|%)?$/);
				if (found) {
					if (found[1]) {
						style.push("height: " + height + ";");
					} else {
						style.push("height: " + height + "px;");
					}
				}

				if (styleFloat.length > 0) {
					style.push("float: " + styleFloat + ";");
				}

				if (style.length > 0) {
					style = ' style="' + style.join(" ") + '"';
				}

				image = "<img src='" + szURL + "' title='" + title + "' alt='" + description + "'" + style + "/>";
				Wysiwyg.insertHtml(image);
			}
		},

		makeForm: function (form, img) {
			form.find("input[name=src]").val(img.src);
			form.find("input[name=imgtitle]").val(img.title);
			form.find("input[name=description]").val(img.alt);
			form.find('input[name="width"]').val(img.width);
			form.find('input[name="height"]').val(img.height);
			form.find('img').attr("src", img.src);

			form.find('img').bind("load", function () {
				if (form.find('img').attr("naturalWidth")) {
					form.find('input[name="naturalWidth"]').val(form.find('img').attr("naturalWidth"));
					form.find('input[name="naturalHeight"]').val(form.find('img').attr("naturalHeight"));
				}
			});

			form.find("input[name=src]").bind("change", function () {
				form.find('img').attr("src", this.value);
			});

			return form;
		}
	};

	$.wysiwyg.insertImage = function (object, szURL, attributes) {
		if ("object" !== typeof (object) || !object.context) {
			object = this;
		}

		if (!object.each) {
			console.error("Something goes wrong, check object");
		}

		return object.each(function () {
			var self = $(this).data("wysiwyg"),
				image,
				attribute;

			if (!self) {
				return this;
			}

			if (!szURL || szURL.length === 0) {
				return this;
			}

			if ($.browser.msie) {
				self.ui.focus();
			}

			if (attributes) {
				self.editorDoc.execCommand("insertImage", false, "#jwysiwyg#");
				image = self.getElementByAttributeValue("img", "src", "#jwysiwyg#");

				if (image) {
					image.src = szURL;

					for (attribute in attributes) {
						if (attributes.hasOwnProperty(attribute)) {
							image.setAttribute(attribute, attributes[attribute]);
						}
					}
				}
			} else {
				self.editorDoc.execCommand("insertImage", false, szURL);
			}

			$(self.editorDoc).trigger("wysiwyg:refresh");

			return this;
		});
	};
})(jQuery);



/**
 * Controls: Link plugin
 *
 * Depends on jWYSIWYG
 *
 * By: Esteban Beltran (academo) <sergies@gmail.com>
 */
(function ($) {
	if (undefined === $.wysiwyg) {
		throw "wysiwyg.image.js depends on $.wysiwyg";
	}

	if (!$.wysiwyg.controls) {
		$.wysiwyg.controls = {};
	}

	/*
	* Wysiwyg namespace: public properties and methods
	*/
	$.wysiwyg.controls.link = {
		init: function (Wysiwyg) {
			var self = this, elements, dialog, szURL, a, selection,
				formLinkHtml, formTextLegend, formTextUrl, formTextTitle, formTextTarget,
				formTextSubmit, formTextReset;

			formTextLegend  = "Insert Link";
			formTextUrl     = "Link URL";
			formTextTitle   = "Link Title";
			formTextTarget  = "Link Target";
			formTextSubmit  = "Insert Link";
			formTextReset   = "Cancel";

			if ($.wysiwyg.i18n) {
				formTextLegend = $.wysiwyg.i18n.t(formTextLegend, "dialogs.link");
				formTextUrl    = $.wysiwyg.i18n.t(formTextUrl, "dialogs.link");
				formTextTitle  = $.wysiwyg.i18n.t(formTextTitle, "dialogs.link");
				formTextTarget = $.wysiwyg.i18n.t(formTextTarget, "dialogs.link");
				formTextSubmit = $.wysiwyg.i18n.t(formTextSubmit, "dialogs.link");
				formTextReset  = $.wysiwyg.i18n.t(formTextReset, "dialogs");
			}

			formLinkHtml = '<form class="wysiwyg"><fieldset><legend>' + formTextLegend + '</legend>' +
				'<label>' + formTextUrl + ': <input type="text" name="linkhref" value=""/></label>' +
				'<label>' + formTextTitle + ': <input type="text" name="linktitle" value=""/></label>' +
				'<label>' + formTextTarget + ': <input type="text" name="linktarget" value=""/></label>' +
				'<input type="submit" class="button" value="' + formTextSubmit + '"/> ' +
				'<input type="reset" value="' + formTextReset + '"/></fieldset></form>';

			a = {
				self: Wysiwyg.dom.getElement("a"), // link to element node
				href: "http://",
				title: "",
				target: ""
			};

			if (a.self) {
				a.href = a.self.href ? a.self.href : a.href;
				a.title = a.self.title ? a.self.title : "";
				a.target = a.self.target ? a.self.target : "";
			}

			if ($.fn.dialog) {
				elements = $(formLinkHtml);
				elements.find("input[name=linkhref]").val(a.href);
				elements.find("input[name=linktitle]").val(a.title);
				elements.find("input[name=linktarget]").val(a.target);

				if ($.browser.msie) {
					dialog = elements.appendTo(Wysiwyg.editorDoc.body);
				} else {
					dialog = elements.appendTo("body");
				}

				dialog.dialog({
					modal: true,
					width: Wysiwyg.defaults.formWidth,
					height: Wysiwyg.defaults.formHeight,
					open: function (ev, ui) {
						$("input:submit", dialog).click(function (e) {
							e.preventDefault();

							var szURL = $('input[name="linkhref"]', dialog).val(),
								title = $('input[name="linktitle"]', dialog).val(),
								target = $('input[name="linktarget"]', dialog).val();

							if (a.self) {
								if ("string" === typeof (szURL)) {
									if (szURL.length > 0) {
										// to preserve all link attributes
										$(a.self).attr("href", szURL).attr("title", title).attr("target", target);
									} else {
										$(a.self).replaceWith(a.self.innerHTML);
									}
								}
							} else {

								if ($.browser.msie) {
									Wysiwyg.ui.returnRange();
								}

								//Do new link element
								selection = Wysiwyg.getRangeText();
								img = Wysiwyg.dom.getElement("img");

								if ((selection && selection.length > 0) || img) {
									if ($.browser.msie) {
										Wysiwyg.ui.focus();
									}

									if ("string" === typeof (szURL)) {
										if (szURL.length > 0) {
											Wysiwyg.editorDoc.execCommand("createLink", false, szURL);
										} else {
											Wysiwyg.editorDoc.execCommand("unlink", false, null);
										}
									}

									a = Wysiwyg.dom.getElement("a");
									$(a).attr("href", szURL).attr("title", title).attr("target", target);
								} else if (Wysiwyg.options.messages.nonSelection) {
									window.alert(Wysiwyg.options.messages.nonSelection);
								}
							}
							$(dialog).dialog("close");
						});
						$("input:reset", dialog).click(function (e) {
							e.preventDefault();
							$(dialog).dialog("close");
						});
					},
					close: function (ev, ui) {
						dialog.dialog("destroy");
					}
				});
			} else {
				if (a.self) {
					szURL = window.prompt("URL", a.href);

					if ("string" === typeof (szURL)) {
						if (szURL.length > 0) {
							$(a.self).attr("href", szURL);
						} else {
							$(a.self).replaceWith(a.self.innerHTML);
						}
					}
				} else {
					//Do new link element
					selection = Wysiwyg.getRangeText();
					img = Wysiwyg.dom.getElement("img");

					if ((selection && selection.length > 0) || img) {
						if ($.browser.msie) {
							Wysiwyg.ui.focus();
							Wysiwyg.editorDoc.execCommand("createLink", true, null);
						} else {
							szURL = window.prompt(formTextUrl, a.href);

							if ("string" === typeof (szURL)) {
								if (szURL.length > 0) {
									Wysiwyg.editorDoc.execCommand("createLink", false, szURL);
								} else {
									Wysiwyg.editorDoc.execCommand("unlink", false, null);
								}
							}
						}
					} else if (Wysiwyg.options.messages.nonSelection) {
						window.alert(Wysiwyg.options.messages.nonSelection);
					}
				}
			}

			$(Wysiwyg.editorDoc).trigger("wysiwyg:refresh");
		}
	};

	$.wysiwyg.createLink = function (object, szURL) {
		if ("object" !== typeof (object) || !object.context) {
			object = this;
		}

		if (!object.each) {
			console.error("Something goes wrong, check object");
		}

		return object.each(function () {
			var oWysiwyg = $(this).data("wysiwyg"),
				selection;

			if (!oWysiwyg) {
				return this;
			}

			if (!szURL || szURL.length === 0) {
				return this;
			}

			selection = oWysiwyg.getRangeText();

			if (selection && selection.length > 0) {
				if ($.browser.msie) {
					oWysiwyg.ui.focus();
				}
				oWysiwyg.editorDoc.execCommand("unlink", false, null);
				oWysiwyg.editorDoc.execCommand("createLink", false, szURL);
			} else if (oWysiwyg.options.messages.nonSelection) {
				window.alert(oWysiwyg.options.messages.nonSelection);
			}
		});
	};
})(jQuery);
