﻿var RideTimes = (function () {

    "use strict";
    var bleTime = {},
        pad2 = function (num) {
            var s = "00" + num;
            return s.substr(s.length - 2);
        },
        dateString = function (time) {
            // toLocaleTimeString() is no good for different platforms
            //return [time.getFullYear(), pad2(time.getMonth() + 1), pad2(time.getDate())].join('-');
            return time.toDateString();
        },
        timeString = function (time) {
            // toLocaleTimeString() is no good for different platforms
            return [pad2(time.getHours()), pad2(time.getMinutes())].join(':');
        },
        timeStringSecs = function (time) {
            return [pad2(time.getHours()), pad2(time.getMinutes()), pad2(time.getSeconds())].join(':');
        };

    return {
        DateString: function (time) {
            return dateString(time);
        },
        TimeString: function (time) {
            return timeString(time);
        },
        dateTimeString: function (time) {
            return dateString(time) + " " + timeString(time);
        },
        addDays: function (time, num) {
            var value = time.valueOf();
            value += 86400000 * num;
            return new Date(value);
        },
        toIntDays: function (time) {
            // return number of whole days since 01/01/1970
            var value = time.valueOf();
            value /= 86400000;
            return parseInt(value.toFixed(0));  
        },
        fromIntDays: function (intdays) {
            // return normal date from number of whole days since 01/01/1970
            var msecs = intdays * 86400000;
            var date = new Date(msecs);
            return dateString(date);
        },
        fromIntTime: function (intTime) {
            // return time of day from minutes;
            var hours = Math.floor(intTime / 60);
            var mins = intTime % 60;
            return pad2(hours) + ':' +pad2(mins);
        },
        datepickerDates: function (date) {
            var search = this.toIntDays(date);
            var popupString = '';
            var rides = RideList.findRides(search);
            if (rides === null) {
                return { tooltip: 'No rides' };
            }
            $.each(rides, function (index, ride) {
                if (ride !== null) {
                    var route = TCCroutes.findRoute(ride.routeID);
                    if (route !== null) {
                        popupString += route.dest + ' (' + ride.leaderName + '), ';
                    }
                    else
                        popupString += 'id '+ ride.routeID + '?,'
                }
            });
            return { classes: 'highlight', tooltip: popupString };
         },

        log: function (string) {
            var d, timestr;
            d = new Date();
            timestr = timeStringSecs(d);
            timestr += ' ';
            timestr += d.getMilliseconds();
            if (window.hyper && window.hyper.log) {
                hyper.log(timestr + ': ' + string);
            }
            else {
                console.log(timestr + ': ' + string);
            }
        }
    };

}());