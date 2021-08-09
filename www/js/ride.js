var Ride = (function ($) {
    "use strict";

    const maxRidersPerRide = 10;
    const removeGuest = "Remove guest";
    const addGuest = "Add a guest";

    var

        // define a ride, happening on a defined date/time, led by a defined leader.
        Ride = function (r_id, leader, date, time, meeting, id, descrip, max) {
            this.leaderName = leader;
            this.routeID = r_id;
            this.date = date;
            this.rideID = id;
            this.time = time;
            this.meetingAt = meeting;
            this.description = descrip;
            this.groupSize = max;
        },

        thisRideDate,
        starthours, startmins,


        saveRide = function () {
            var startPlace = $("#ride-meeting").val();
            var description = $("#ride-descrip").val();
            var maxRiders = $("#ride-maxriders").val();
            var route = TCCroutes.currentRoute();
            var leader = login.User();
            var time = starthours * 60 + startmins;
            var date = RideTimes.toIntDays(thisRideDate);

            var ride = new Ride(route.id, leader, date, time, startPlace, 0, description, maxRiders);
            qPopup.Confirm("Save this ride", "Are you sure?", function () {
                rideData.myAjax("SaveRide", "POST", ride, function (response) {
                    // if successful, response should be just a new ID
                    if (response.length < 5) {
                        ride.id = response;
                        TCCroutes.SetRoute(route);
                        RideList.Add(ride);
                        $('#convertToRide').hide();
                        rideData.setCurrentTab('rides-tab');
                        rideData.setDate(thisRideDate);
                        rideData.setDateChooser('View other dates');
                        RideList.CreateRideList(thisRideDate);

                    }
                    else {
                        qPopup.Alert(response);
                    }

                });
            }, null, -10);
        },


        handleRideEdit = function () {
            var descrip = $("#edit-ride-description").val();
            var start = $("#edit-ride-start").val();
            var dest = $("#edit-ride-dest").val();
            var dist = $("#edit-ride-distance").val();
            var maxRiders = $("#edit-ride-maxriders").val();
            var newtime = starthours * 60 + startmins;
            if (dest.length < 2 || dist === '' || dist === 0) {
                qPopup.Alert("Destination and distance needed");
                return;
            }

            qPopup.Confirm("Save edited ride", "Are you sure?", function () {
                var thisRoute = TCCroutes.findRoute(RideList.CurrentRide().routeID);
                thisRoute.dest = dest;
                var current = RideList.CurrentRide();
                current.description = descrip;
                current.meetingAt = start;
                current.time = newtime;
                current.groupSize = maxRiders;
                thisRoute.distance = dist;
                rideData.myAjax("EditRoute", "POST", thisRoute, function (response) {
                    if (response === 'OK') {
                        rideData.myAjax("EditRide", "POST", current, function (response) {
                            if (response === 'OK') {
                                createRideList();
                                $('#editRideModal').modal('hide');
                            }
                            else {
                                qPopup.Alert(response);
                            }
                        });
                    }
                });
            }, null, -10);
        },
        currentParticipants = function () {
            return RideList.CurrentParticipants();
        },
    setMeeting = function () {
        var text = $("input[name='meet']:checked").parent('label').text();
        $('#ride-meeting').val(text);
    },
    setMeetingEdit = function () {
        var text = $("input[name='meet']:checked").parent('label').text();
        $('#edit-ride-start').val(text);
    };

        
    Ride.leadRide = function () {
        $('#convertToRide').show();
        $("#meet2").prop('checked', true);
        $('#start-time').timepicker('setTime', '08:00 AM');
        $("#meet1").click(setMeeting);
        $("#meet2").click(setMeeting);
        $("#meet3").click(setMeeting);
        $("#meetOther").click(function () { $('#ride-meeting').val(''); });
        $("#ride-maxriders").attr("max", maxRidersPerRide);

        thisRideDate = new Date();
        $("#rideDate1").datepicker({
            beforeShowDay: function (date) { return RideTimes.datepickerDates(date); },
            todayBtn: false,
            autoclose: true,
            format: "DD M dd yyyy",
            'setDate': thisRideDate
        });
        $("#rideDate1").change(function () {
            thisRideDate = new Date($("#rideDate1").val());
        });
    };

    $('#start-time').timepicker().on('changeTime.timepicker', function (e) {
        if (e.time !== undefined) {

            starthours = e.time.hours;
            startmins = e.time.minutes;
        }
    });
    $('#start-time-edit').timepicker().on('changeTime.timepicker', function (e) {
        if (e.time !== undefined) {

            starthours = e.time.hours;
            startmins = e.time.minutes;
        }
    });

    $('#editRideModal').on('shown.bs.modal', function (e) {
        var current = RideList.CurrentRide();
        var thisRoute = TCCroutes.findRoute(current.routeID);
        var units = ' km';
        if (login.Units() === 'm') {
            units = ' miles';
        }

        $("#edit-ride-description").attr("value", current.description);
        $("#edit-ride-dest").attr("value", thisRoute.dest);
        $("#edit-ride-distance").attr("value", thisRoute.distance);
        $("#edit-ride-maxriders").attr("value", current.groupSize);
        $("#edit-ride-maxriders").attr("max", maxRidersPerRide);
        $("#edit-ride-start").attr("value", current.meetingAt);
        $("#edit-cancelRide").prop('readonly', true);

        $("#meet11").click(setMeetingEdit);
        $("#meet12").click(setMeetingEdit);
        $("#meet13").click(setMeetingEdit);
        $("#meet1Other").click(function () { $('#edit-ride-start').val(''); });
        // convert our time in minutes to a string for editing the time

        $('#start-time-edit').timepicker('setTime', RideTimes.fromIntTime(current.time));

        if (thisRoute.hasGPX) {
            // cannot edit distance for routes wth GPX file
            $("#edit-ride-distance").prop('readonly', true);
            $("#label-distance").html("To edit distance, please upload a different route using 'View all Routes'");
        }
        else {
            $("#edit-ride-distance").prop('readonly', false);
            $("#label-distance").html("Distance" + units + ':');
        }
        if (thisRoute.owner !== login.User()) {
            // cannot edit name of someone else's route
            $("#edit-ride-dest").prop('readonly', true);
            $("#label-dest").html("You cannot edit the name of another user's route");
        }
        if (currentParticipants()[0] === '') {
            $("#edit-cancelRide").prop('readonly', false);
            $("#edit-ride-title").html("Edit ride details");
        }
        else {
            // there are riders booked on this ride
            $("#edit-ride-title").html("There are rider(s) booked on this ride. Please make only minor changes");
        }
        if (currentParticipants().includes(login.User() + '+')) {
            // guest aleady added
            $("#edit-guest").html(removeGuest);
        }
        else {
            $("#edit-guest").html(addGuest);
        }

    });
    $("#edit-ride-ok").on("click", handleRideEdit);
    $("#edit-ride-cancel").on('click', function () {
        $('#editRideModal').modal('hide');
    });
    $("#edit-cancelRide").on('click', function () {
        if (currentParticipants()[0] === '') {
            rideData.deleteRide(RideList.CurrentRide().rideID);
            $('#editRideModal').modal('hide');
        }
        else {
            qPopup.Alert("There are rider(s) booked on this ride. Please find a different leader if you cannot attend");
        }

    });
    $("#edit-guest").on('click', function () {
        if (currentParticipants().includes(login.User() + '+')) {
            rideData.leaveGuest(RideList.CurrentRide().rideID, login.User());
            $("#edit-guest").html(addGuest);
        }
        else {
            rideData.saveGuest(RideList.CurrentRide().rideID, login.User());
            $("#edit-guest").html(removeGuest);
        }

    });
    $("#saveRide").on('click', saveRide);

    return Ride;
}(jQuery));
