/*global bleTime,TCCroutes,TCCrides,jQuery*/

var rideData = (function ($) {

    "use strict";

    var rideData = {},

        urlBase = function () {
            if (bleApp.isMobile()) {
                return "http://www.quilkin.co.uk/routes.svc/";
                //return "http://192.168.1.73:54684/Service1.svc/";
            }

            return "http://localhost/routes/Routes.svc/";
           //return "/Routes.svc/";
            //return "http://localhost:54684/Routes.svc/";


        },

        rideDate,
        newDate,
        currentTab,

        // button to be reset when json interaction is complete
        $jsonBtn,

        chooseDates = function () {
            $('#fromDate').show();
            if ($('#fromDate').is(":visible") && newDate !== undefined) {
                var newTime = newDate.getTime();
                var oldTime = rideDate.getTime();
                if (newTime !== oldTime) {
                    //rideDate = new Date($("#rideDate").val());
                    rideDate = newDate;
                    rideData.setDateChooser('View other dates');
                    TCCrides.Clear();
                    TCCrides.CreateRideList(rideDate);
                    $("#rideDate").datepicker('hide');
                    $('#fromDate').hide();
                    return;
                }
            }
            $("#rideDate").datepicker('setDate', rideDate);

           // rideData.setDateChooser('OK');
        },


        webRequestFailed = function (handle, status, error) {
            popup.Alert("Error with web request: " + handle.responseText + ' ' + handle.statusText);
            if ($jsonBtn !== null) {
                $jsonBtn.button('reset');
            }

        },
        webRequestSuccess = function (success, res) {
            success(res);
            if ($jsonBtn !== null) {
                $jsonBtn.button('reset');
            }

        };

    $("#dateTitle").on('click', chooseDates);

    $("#rideDate").change(function () {
        newDate = new Date($("#rideDate").val());
        var newTime = newDate.getTime();
        var oldTime = rideDate.getTime();
        if (newTime !== oldTime) {
            //console.log("new ride time!");
            //rideDate = new Date($("#rideDate").val());
            rideDate = newDate;
            rideData.setDateChooser('View other dates');
            TCCrides.Clear();
            TCCrides.CreateRideList(rideDate);
            $("#rideDate").datepicker('hide');
            $('#fromDate').hide();
        }
    });

    // global functions

    rideData.CreateLists = function () {
        // get list of all routes in db
        TCCroutes.CreateRouteList(true);

        //// get list of rides for next Sunday
        //// find next Sunday's date
        //var today = new Date();
        //today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        //while (today.getDay() !== 0) {
        //    today = bleTime.addDays(today, 1);
        //}
        //TCCrides.CreateRideList(today);
    };
    rideData.setDate = function (start) {
        rideDate = start;
    };


    rideData.setCurrentTab = function (tab) {
        currentTab = tab;
    };
    rideData.getCurrentTab = function () {
        return currentTab;
    };


    //rideData.getGPX = function () {
    //    var currentroute = TCCroutes.currentRoute();
    //    if (currentroute === null) {
    //        popup.Alert("No GPX data found!");
    //        return null;
    //    }
    //    var routeID = currentroute.id;
    //    var gpxdata = null;

    //    rideData.myJson("GetGPXforRoute", "POST", routeID, function (response) {
    //        gpxdata = response;
    //        if (gpxdata.length === 0) {
    //            popup.Alert("No GPX data found!");
    //            return null;
    //        }
    //        TCCMap.showRouteStage2(gpxdata);
    //       // TCCroutes.SetGPX(gpxdata);
    //        return gpxdata;
    //    }, true, null);
    //    return gpxdata;
    //}; 
  

    rideData.saveParticipant = function (rideID, rider) {
        var list = "";
        popup.Confirm("Join this ride", "Are you sure?", function () {
            var pp = new TCCrides.Participant(rider, rideID);
            rideData.myJson("SaveParticipant", "POST", pp, function (response) {
                if (response[0] === '*') {
                    // a list of riders entered
                    list = response.substr(1);
                    popup.Alert("You have been added to this ride");
                    TCCrides.CreateRideList(null);
                }
                else {
                    popup.Alert(response);
                }
            }, true, null);
        }, null, -10);
        return list;
    };
    rideData.saveReserveParticipant = function (rideID, rider) {
        var list = "";
        popup.Confirm("Ride is full", "Would you like to be on a  reserve list?", function () {
            var reserve = '+' + rider;
            var pp = new TCCrides.Participant(reserve, rideID);
            rideData.myJson("SaveParticipant", "POST", pp, function (response) {
                if (response[0] === '*') {
                    // a list of riders entered
                    list = response.substr(1);
                    popup.Alert("You have been added to reserve list for this ride");
                    TCCrides.CreateRideList(null);
                }
                else {
                    popup.Alert(response);
                }
            }, true, null);
        }, null, -10);
        return list;
    };
    rideData.leaveParticipant = function (rideID, rider) {
        popup.Confirm("Leave this ride", "Are you sure?", function () {
            var pp = new TCCrides.Participant(rider, rideID);
            rideData.myJson("LeaveParticipant", "POST", pp, function (response) {
                if (response === 'OK') {
                    popup.Alert("You have left this ride");
                    // recursively create a new list
                    TCCrides.CreateRideList(null);
                }
                else {
                    popup.Alert(response);
                }
            }, true, null);
        }, null, -10);
    };
    rideData.deleteRide = function (rideID) {
        popup.Confirm("Delete this ride", "Are you sure?", function () {
            rideData.myJson("DeleteRide", "POST", rideID, function (response) {
                if (response === 'OK') {
                    popup.Alert("You have deleted this ride");
                    // recursively create a new list
                    TCCrides.CreateRideList(null);
                }
                else {
                    popup.Alert(response);
                }
            }, true, null);
        }, null, -10);
    };


    rideData.setDateChooser = function (btntext) {
        $('#dateTitle').html(bleTime.dateString(rideDate) +  '<span id="btnGo" role="button" class="btn btn-lifted  btn-info btn-sm pull-right">' + btntext + '</span>');
    };
          
    rideData.myJson = function (url, type, data, successfunc, async, $btn) {
        var dataJson = JSON.stringify(data),
            thisurl = urlBase() + url;

        $jsonBtn = $btn;

        $.ajax({
            type: type,
            data: dataJson,
            url: thisurl,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
           // async: async,
            async: true,
            success: function (response) { webRequestSuccess(successfunc, response); },
            error: webRequestFailed

        });
    };


    return rideData;
}(jQuery));



