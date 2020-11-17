/*global bleTime,TCCroutes,TCCrides,jQuery*/

var rideData = (function ($) {

    "use strict";

    var rideData = {},



        rideDate,
        newDate,
        currentTab,
        ajaxworking = '',

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
            // show highlighted dates for those when a ride is planned

            $("#rideDate").datepicker({
                beforeShowDay: function (date) { return bleTime.datepickerDates(date); },
                todayBtn: false,
                autoclose: true,
                format: "DD M dd yyyy",
                'setDate': rideDate
            });
        },


        webRequestFailed = function (handle, status, error) {
            qPopup.Alert("Error with web request: " + handle.responseText + ' ' + handle.statusText);

        };
        //webRequestSuccess = function (success, res) {
        //    success(res);

        //};

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


    rideData.saveParticipant = function (rideID, rider) {
        var list = "";
        qPopup.Confirm("Join this ride", "Are you sure?", function () {
            var pp = new TCCrides.Participant(rider, rideID);
            rideData.myAjax("SaveParticipant", "POST", pp, function (response) {
                if (response[0] === '*') {
                    // a list of riders entered
                    list = response.substr(1);
                    qPopup.Alert("You have been added to this ride");
                    TCCrides.CreateRideList(null);
                }
                else {
                    qPopup.Alert(response);
                }
            });
        }, null, -10);
        return list;
    };
    rideData.saveReserveParticipant = function (rideID, rider) {
        var list = "";
        qPopup.Confirm("Ride is full", "Would you like to be on a  reserve list?", function () {
            var reserve = '+' + rider;
            var pp = new TCCrides.Participant(reserve, rideID);
            rideData.myAjax("SaveParticipant", "POST", pp, function (response) {
                if (response[0] === '*') {
                    // a list of riders entered
                    list = response.substr(1);
                    qPopup.Alert("You have been added to reserve list for this ride");
                    TCCrides.CreateRideList(null);
                }
                else {
                    qPopup.Alert(response);
                }
            });
        }, null, -10);
        return list;
    };
    rideData.leaveParticipant = function (rideID, rider) {
        qPopup.Confirm("Leave this ride", "Are you sure?", function () {
            var pp = new TCCrides.Participant(rider, rideID);
            rideData.myAjax("LeaveParticipant", "POST", pp, function (response) {
                if (response === 'OK') {
                    qPopup.Alert("You have left this ride");
                    // recursively create a new list
                    TCCrides.CreateRideList(null);
                }
                else {
                    qPopup.Alert(response);
                }
            });
        }, null, -10);
    };
    rideData.deleteRide = function (rideID) {
        qPopup.Confirm("Delete this ride", "Are you sure?", function () {
            rideData.myAjax("DeleteRide", "POST", rideID, function (response) {
                if (response === 'OK') {
                    qPopup.Alert("You have deleted this ride");
                    // recursively create a new list
                    TCCrides.CreateRideList(null);
                }
                else {
                    qPopup.Alert(response);
                }
            });
        }, null, -10);
    };


    rideData.setDateChooser = function (btntext) {
        $('#dateTitle').html(bleTime.DateString(rideDate) +  '<span id="btnGo" role="button" class="btn btn-lifted  btn-info btn-sm pull-right">' + btntext + '</span>');
    };
          
    rideData.myAjax = function (url, type, data, successfunc) {
        var dataJson = JSON.stringify(data),
            thisurl = quilkinUrlBase() + url;

        if (ajaxworking.length > 0) {
            console.log(thisurl + ": concurrent Ajax call with: " + ajaxworking);
       //     qPopup.Alert("oops");
        }
        ajaxworking = thisurl;
        console.log(ajaxworking + ": start");
        $.ajax({
            type: type,
            data: dataJson,
            url: thisurl,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            async: true,
            success: function (response) {
                console.log(ajaxworking + ": done");
                ajaxworking = '';
                successfunc(response);

            },
            error: webRequestFailed

        });
    };


    return rideData;
}(jQuery));



