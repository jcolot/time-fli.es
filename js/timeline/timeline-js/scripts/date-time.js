/**
 * @fileOverview A collection of date/time utility functions
 * @name Timeline.DateTime
 */

Timeline.DateTime = new Object();

Timeline.DateTime.MILLISECOND = 0;
Timeline.DateTime.SECOND = 1;
Timeline.DateTime.MINUTE = 2;
Timeline.DateTime.HOUR = 3;
Timeline.DateTime.DAY = 4;
Timeline.DateTime.WEEK = 5;
Timeline.DateTime.MONTH = 6;
Timeline.DateTime.YEAR = 7;
Timeline.DateTime.DECADE = 8;
Timeline.DateTime.CENTURY = 9;
Timeline.DateTime.MILLENNIUM = 10;
Timeline.DateTime.WEEKNUMBER = 11;
Timeline.DateTime.QUARTERHOUR = 12;

Timeline.DateTime.EPOCH = -1;
Timeline.DateTime.ERA = -2;

/**
 * An array of unit lengths, expressed in milliseconds, of various lengths of
 * time.  The array indices are predefined and stored as properties of the
 * Timeline.DateTime object, e.g. Timeline.DateTime.YEAR.
 * @type Array
 */
Timeline.DateTime.gregorianUnitLengths = [];
(function () {
    var d = Timeline.DateTime;
    var a = d.gregorianUnitLengths;

    a[d.MILLISECOND] = 1;
    a[d.SECOND] = 1000;
    a[d.MINUTE] = a[d.SECOND] * 60;
    a[d.HOUR] = a[d.MINUTE] * 60;
    a[d.DAY] = a[d.HOUR] * 24;
    a[d.MONTH] = a[d.DAY] * 31;
    a[d.YEAR] = a[d.DAY] * 365;
    a[d.DECADE] = a[d.YEAR] * 10;
    a[d.CENTURY] = a[d.YEAR] * 100;
    a[d.MILLENNIUM] = a[d.YEAR] * 1000;
    a[d.WEEK] = a[d.DAY] * 7;
    a[d.WEEKNUMBER] = a[d.DAY] * 7;
    a[d.QUARTERHOUR] = a[d.MINUTE] * 15;
})();

Timeline.DateTime._dateRegexp = new RegExp(
        "^(-?)([0-9]{4})(" + [
            "(-?([0-9]{2})(-?([0-9]{2}))?)", // -month-dayOfMonth
            "(-?([0-9]{3}))", // -dayOfYear
            "(-?W([0-9]{2})(-?([1-7]))?)"    // -Wweek-dayOfWeek
        ].join("|") + ")?$"
        );
Timeline.DateTime._timezoneRegexp = new RegExp(
        "Z|(([-+])([0-9]{2})(:?([0-9]{2}))?)$"
        );
Timeline.DateTime._timeRegexp = new RegExp(
        "^([0-9]{2})(:?([0-9]{2})(:?([0-9]{2})(\.([0-9]+))?)?)?$"
        );

/**
 * Takes a date object and a string containing an ISO 8601 date and sets the
 * the date using information parsed from the string.  Note that this method
 * does not parse any time information.
 *
 * @param {Date} dateObject the date object to modify
 * @param {String} string an ISO 8601 string to parse
 * @return {Date} the modified date object
 */
Timeline.DateTime.setIso8601Date = function (dateObject, string) {
    /*
     *  This function has been adapted from dojo.date, v.0.3.0
     *  http://dojotoolkit.org/.
     */

    var d = string.match(Timeline.DateTime._dateRegexp);
    if (!d) {
        throw new Error("Invalid date string: " + string);
    }

    var sign = (d[1] == "-") ? -1 : 1; // BC or AD
    var year = sign * d[2];
    var month = d[5];
    var date = d[7];
    var dayofyear = d[9];
    var week = d[11];
    var dayofweek = (d[13]) ? d[13] : 1;

    dateObject.setUTCFullYear(year);
    if (dayofyear) {
        dateObject.setUTCMonth(0);
        dateObject.setUTCDate(Number(dayofyear));
    } else if (week) {
        dateObject.setUTCMonth(0);
        dateObject.setUTCDate(1);
        var gd = dateObject.getUTCDay();
        var day = (gd) ? gd : 7;
        var offset = Number(dayofweek) + (7 * Number(week));

        if (day <= 4) {
            dateObject.setUTCDate(offset + 1 - day);
        } else {
            dateObject.setUTCDate(offset + 8 - day);
        }
    } else {
        if (month) {
            dateObject.setUTCDate(1);
            dateObject.setUTCMonth(month - 1);
        }
        if (date) {
            dateObject.setUTCDate(date);
        }
    }

    return dateObject;
};

/**
 * Takes a date object and a string containing an ISO 8601 time and sets the
 * the time using information parsed from the string.  Note that this method
 * does not parse any date information.
 *
 * @param {Date} dateObject the date object to modify
 * @param {String} string an ISO 8601 string to parse
 * @return {Date} the modified date object
 */
Timeline.DateTime.setIso8601Time = function (dateObject, string) {
    /*
     *  This function has been adapted from dojo.date, v.0.3.0
     *  http://dojotoolkit.org/.
     */

    var d = string.match(Timeline.DateTime._timeRegexp);
    if (!d) {
        console.log("Invalid time string: " + string);
        return false;
    }
    var hours = d[1];
    var mins = Number((d[3]) ? d[3] : 0);
    var secs = (d[5]) ? d[5] : 0;
    var ms = d[7] ? (Number("0." + d[7]) * 1000) : 0;

    dateObject.setUTCHours(hours);
    dateObject.setUTCMinutes(mins);
    dateObject.setUTCSeconds(secs);
    dateObject.setUTCMilliseconds(ms);

    return dateObject;
};

/**
 * The timezone offset in minutes in the user's browser.
 * @type Number
 */
Timeline.DateTime.timezoneOffset = new Date().getTimezoneOffset();

/**
 * Takes a date object and a string containing an ISO 8601 date and time and 
 * sets the date object using information parsed from the string.
 *
 * @param {Date} dateObject the date object to modify
 * @param {String} string an ISO 8601 string to parse
 * @return {Date} the modified date object
 */
Timeline.DateTime.setIso8601 = function (dateObject, string) {
    /*
     *  This function has been adapted from dojo.date, v.0.3.0
     *  http://dojotoolkit.org/.
     */

    var offset = null;
    var comps = (string.indexOf("T") == -1) ? string.split(" ") : string.split("T");

    Timeline.DateTime.setIso8601Date(dateObject, comps[0]);
    if (comps.length == 2) {
        // first strip timezone info from the end
        var d = comps[1].match(Timeline.DateTime._timezoneRegexp);
        if (d) {
            if (d[0] == 'Z') {
                offset = 0;
            } else {
                offset = (Number(d[3]) * 60) + Number(d[5]);
                offset *= ((d[2] == '-') ? 1 : -1);
            }
            comps[1] = comps[1].substr(0, comps[1].length - d[0].length);
        }

        Timeline.DateTime.setIso8601Time(dateObject, comps[1]);
    }
    if (offset == null) {
        offset = dateObject.getTimezoneOffset(); // local time zone if no tz info
    }
    dateObject.setTime(dateObject.getTime() + offset * 60000);

    return dateObject;
};

/**
 * Takes a string containing an ISO 8601 date and returns a newly instantiated
 * date object with the parsed date and time information from the string.
 *
 * @param {String} string an ISO 8601 string to parse
 * @return {Date} a new date object created from the string
 */
Timeline.DateTime.parseIso8601DateTime = function (string) {
    try {
        return Timeline.DateTime.setIso8601(new Date(0), string);
    } catch (e) {
        return null;
    }
};

/**
 * Takes a string containing a Gregorian date and time and returns a newly
 * instantiated date object with the parsed date and time information from the
 * string.  If the param is actually an instance of Date instead of a string, 
 * simply returns the given date instead.
 *
 * @param {Object} o an object, to either return or parse as a string
 * @return {Date} the date object
 */
Timeline.DateTime.parseGregorianDateTime = function (o) {
    if (o == null) {
        return null;
    } else if (o instanceof Date) {
        return o;
    }

    var s = o.toString();
    if (s.length > 0 && s.length < 8) {
        var space = s.indexOf(" ");
        if (space > 0) {
            var year = parseInt(s.substr(0, space));
            var suffix = s.substr(space + 1);
            if (suffix.toLowerCase() == "bc") {
                year = 1 - year;
            }
        } else {
            var year = parseInt(s);
        }

        var d = new Date(0);
        d.setUTCFullYear(year);

        return d;
    }

    try {
        return new Date(Date.parse(s));
    } catch (e) {
        return null;
    }
};

/**
 * Rounds date objects down to the nearest interval or multiple of an interval.
 * This method modifies the given date object, converting it to the given
 * timezone if specified.
 * 
 * @param {Date} date the date object to round
 * @param {Number} intervalUnit a constant, integer index specifying an 
 *   interval, e.g. Timeline.DateTime.HOUR
 * @param {Number} timeZone a timezone shift, given in hours
 * @param {Number} multiple a multiple of the interval to round by
 * @param {Number} firstDayOfWeek an integer specifying the first day of the
 *   week, 0 corresponds to Sunday, 1 to Monday, etc.
 */
Timeline.DateTime.roundDownToInterval = function (date, intervalUnit, timeZone, multiple, firstDayOfWeek) {
    var timeShift = timeZone *
            Timeline.DateTime.gregorianUnitLengths[Timeline.DateTime.HOUR];

    var date2 = new Date(date.getTime() + timeShift);
    var clearInDay = function (d) {
        d.setUTCMilliseconds(0);
        d.setUTCSeconds(0);
        d.setUTCMinutes(0);
        d.setUTCHours(0);
    };
    var clearInYear = function (d) {
        clearInDay(d);
        d.setUTCDate(1);
        d.setUTCMonth(0);
    };

    switch (intervalUnit) {
        case Timeline.DateTime.MILLISECOND:
            var x = date2.getUTCMilliseconds();
            date2.setUTCMilliseconds(x - (x % multiple));
            break;
        case Timeline.DateTime.SECOND:
            date2.setUTCMilliseconds(0);

            var x = date2.getUTCSeconds();
            date2.setUTCSeconds(x - (x % multiple));
            break;
        case Timeline.DateTime.MINUTE:
            date2.setUTCMilliseconds(0);
            date2.setUTCSeconds(0);

            var x = date2.getUTCMinutes();
            date2.setTime(date2.getTime() -
                    (x % multiple) * Timeline.DateTime.gregorianUnitLengths[Timeline.DateTime.MINUTE]);
            break;
        case Timeline.DateTime.QUARTERHOUR:
            date2.setUTCMilliseconds(0);
            date2.setUTCSeconds(0);

            var x = date2.getUTCMinutes();
            x = (x - (x % 15)) / 15;
            date2.setUTCMinutes((x - (x % multiple)) * 15);
            break;
        case Timeline.DateTime.HOUR:
            date2.setUTCMilliseconds(0);
            date2.setUTCSeconds(0);
            date2.setUTCMinutes(0);

            var x = date2.getUTCHours();
            date2.setUTCHours(x - (x % multiple));
            break;
        case Timeline.DateTime.DAY:
            clearInDay(date2);
            break;
        case Timeline.DateTime.WEEK:
            clearInDay(date2);
            var d = (date2.getUTCDay() + 7 - firstDayOfWeek) % 7;
            date2.setTime(date2.getTime() -
                    d * Timeline.DateTime.gregorianUnitLengths[Timeline.DateTime.DAY]);
            break;
        case Timeline.DateTime.WEEKNUMBER:
            clearInDay(date2);
            var d = (date2.getUTCDay() + 7 - firstDayOfWeek) % 7;
            date2.setTime(date2.getTime() -
                    d * Timeline.DateTime.gregorianUnitLengths[Timeline.DateTime.DAY]);
            break;
        case Timeline.DateTime.MONTH:
            clearInDay(date2);
            date2.setUTCDate(1);

            var x = date2.getUTCMonth();
            date2.setUTCMonth(x - (x % multiple));
            break;
        case Timeline.DateTime.YEAR:
            clearInYear(date2);

            var x = date2.getUTCFullYear();
            date2.setUTCFullYear(x - (x % multiple));
            break;
        case Timeline.DateTime.DECADE:
            clearInYear(date2);
            date2.setUTCFullYear(Math.floor(date2.getUTCFullYear() / 10) * 10);
            break;
        case Timeline.DateTime.CENTURY:
            clearInYear(date2);
            date2.setUTCFullYear(Math.floor(date2.getUTCFullYear() / 100) * 100);
            break;
        case Timeline.DateTime.MILLENNIUM:
            clearInYear(date2);
            date2.setUTCFullYear(Math.floor(date2.getUTCFullYear() / 1000) * 1000);
            break;
    }

    date.setTime(date2.getTime() - timeShift);
};

/**
 * Rounds date objects up to the nearest interval or multiple of an interval.
 * This method modifies the given date object, converting it to the given
 * timezone if specified.
 * 
 * @param {Date} date the date object to round
 * @param {Number} intervalUnit a constant, integer index specifying an 
 *   interval, e.g. Timeline.DateTime.HOUR
 * @param {Number} timeZone a timezone shift, given in hours
 * @param {Number} multiple a multiple of the interval to round by
 * @param {Number} firstDayOfWeek an integer specifying the first day of the
 *   week, 0 corresponds to Sunday, 1 to Monday, etc.
 * @see Timeline.DateTime.roundDownToInterval
 */
Timeline.DateTime.roundUpToInterval = function (date, intervalUnit, timeZone, multiple, firstDayOfWeek) {
    var originalTime = date.getTime();
    Timeline.DateTime.roundDownToInterval(date, intervalUnit, timeZone, multiple, firstDayOfWeek);
    if (date.getTime() < originalTime) {
        date.setTime(date.getTime() +
                Timeline.DateTime.gregorianUnitLengths[intervalUnit] * multiple);
    }
};

/**
 * Increments a date object by a specified interval, taking into
 * consideration the timezone.
 *
 * @param {Date} date the date object to increment
 * @param {Number} intervalUnit a constant, integer index specifying an 
 *   interval, e.g. Timeline.DateTime.HOUR
 * @param {Number} timeZone the timezone offset in hours
 */
Timeline.DateTime.incrementByInterval = function (date, intervalUnit, timeZone) {
    timeZone = (typeof timeZone == 'undefined') ? 0 : timeZone;

    var timeShift = timeZone *
            Timeline.DateTime.gregorianUnitLengths[Timeline.DateTime.HOUR];

    var date2 = new Date(date.getTime() + timeShift);

    switch (intervalUnit) {
        case Timeline.DateTime.MILLISECOND:
            date2.setTime(date2.getTime() + 1)
            break;
        case Timeline.DateTime.SECOND:
            date2.setTime(date2.getTime() + 1000);
            break;
        case Timeline.DateTime.MINUTE:
            date2.setTime(date2.getTime() +
                    Timeline.DateTime.gregorianUnitLengths[Timeline.DateTime.MINUTE]);
            break;
        case Timeline.DateTime.QUARTERHOUR:
            date2.setTime(date2.getTime() +
                    Timeline.DateTime.gregorianUnitLengths[Timeline.DateTime.QUARTERHOUR]);
            break;
        case Timeline.DateTime.HOUR:
            date2.setTime(date2.getTime() +
                    Timeline.DateTime.gregorianUnitLengths[Timeline.DateTime.HOUR]);
            break;
        case Timeline.DateTime.DAY:
            date2.setUTCDate(date2.getUTCDate() + 1);
            break;
        case Timeline.DateTime.WEEK:
            date2.setUTCDate(date2.getUTCDate() + 7);
            break;
        case Timeline.DateTime.WEEKNUMBER:
            date2.setUTCDate(date2.getUTCDate() + 7);
            break;
        case Timeline.DateTime.MONTH:
            date2.setUTCMonth(date2.getUTCMonth() + 1);
            break;
        case Timeline.DateTime.YEAR:
            date2.setUTCFullYear(date2.getUTCFullYear() + 1);
            break;
        case Timeline.DateTime.DECADE:
            date2.setUTCFullYear(date2.getUTCFullYear() + 10);
            break;
        case Timeline.DateTime.CENTURY:
            date2.setUTCFullYear(date2.getUTCFullYear() + 100);
            break;
        case Timeline.DateTime.MILLENNIUM:
            date2.setUTCFullYear(date2.getUTCFullYear() + 1000);
            break;
    }

    date.setTime(date2.getTime() - timeShift);
};

/**
 * Returns a new date object with the given time offset removed.
 *
 * @param {Date} date the starting date
 * @param {Number} timeZone a timezone specified in an hour offset to remove
 * @return {Date} a new date object with the offset removed
 */
Timeline.DateTime.removeTimeZoneOffset = function (date, timeZone) {
    return new Date(date.getTime() +
            timeZone * Timeline.DateTime.gregorianUnitLengths[Timeline.DateTime.HOUR]);
};

/**
 * Returns the timezone of the user's browser.
 *
 * @return {Number} the timezone in the user's locale in hours
 */
Timeline.DateTime.getTimezone = function () {
    var d = new Date().getTimezoneOffset();
    return d / -60;
};
