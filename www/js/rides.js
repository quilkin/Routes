﻿/*global bleTime,TCCroutes,TCCrides,rideData,jQuery*/

// a 'ride' is a defined ride, happening on a defined date/time, led by a defined leader.

var TCCrides = (function ($) {
    "use strict";

        //ride data members
//[DataMember(Name = "routeID")]           public int routeID { get; set; }
//[DataMember(Name = "leaderName")]        public string LeaderName { get; set; }
//[DataMember(Name = "rideID")]        public int ID { get; set; }
//[DataMember(Name = "date")]        public int Date { get; set; }
//[DataMember(Name = "time")]        public int Time { get; set; }
//[DataMember(Name = "meetingAt")]        public string MeetAt { get; set; }
//[DataMember(Name = "description")]        public string Description { get; set; }
//[DataMember(Name = "groupSize")]       public int GroupSize { get; set; }

    const maxridesperday = 10;
    const maxRidersPerRide = 10;
    const message = ", and cannot join more than one ride each day";
    const joinText = 'Join';
    //const leaveText = 'Leave';
    const reserveText = 'Reserve';
    //const guestText = 'Add Guest';
    const meText = 'me';
    const mePlusText = 'me+';
    const leaveReserveText = 'UnReserve';
    const editRideText = 'Edit/Cancel';


    var TCCrides = {},

        // list of rides downloaded from database
        rides = [],
        //rideIDs = [],
        //array of lists of participants, each member will be a string of paticipants for that ride
        participants = [],
        //array of lists of reserve participants, each member will be a string of paticipants for that ride
        reserves = [],

        // a list of all recent and future dates that have rides attached
        datesWithRides = [],

        // number of signed-up riders for each ride
        numRiders = [],

        // will be used to break up participant strings into 2D arrays
        pp,
        rs,

        // to check that riders don't join two rides on same day
        alreadyRidingToday,
        alreadyReservedToday,
        alreadyLeadingToday,
        // state of join/leave button
        joinButton = [],
        thisRideDate,

        currentDate,
        starthours, startmins,
        // the latest one to be downloaded from web. Includes URL only, not full gpx
        currentride = null,
        // curently chosen one from the list, used for getting participants
        currentIndex = 0,

        getWebRides = function (date) {
            var rideIDs = [];
            var intdays = bleTime.toIntDays(date);
            console.log("getWebRides: ");
            rideData.myAjax("GetRidesForDate", "POST", intdays, function (response) {
                rides = response;
                if (rides.length === 0) {
                    $('#ridelist').empty();  // this will also remove any handlers
                    qPopup.Alert(bleTime.DateString(date) + ": no rides found for 31 days");
                    return null;
                }
                $.each(rides, function (index) {
                    rideIDs.push(rides[index].rideID);
                });
                GetParticipants(rideIDs);

            });
        },

        GetParticipants = function (rideIDs) {

            pp = new Array(maxridesperday);
            rs = new Array(maxridesperday);

            var success = false;
            while (reserves.length > 0) { reserves.pop(); }
            while (participants.length > 0) { participants.pop(); }
            while (numRiders.length > 0) numRiders.pop();

            rideData.myAjax("GetParticipants", "POST", rideIDs, function (response) {
                if (rideIDs.length > 0) {
                    $.each(rideIDs, function (index, ride) {
                        if (index >= maxridesperday) {
                            qPopup.Alert('too many rides for this date');
                            return false;
                        }
                        // get a list of all participants and reserves for the ride, split into two lists
                        var list = response[index].split(',');
                        var reserveList = '';
                        var ppList = '';
                        var numberOfRiders = 1; // leader
                        $.each(list, function (index, pp) {
                            if (pp[0] == '+') {
                                reserveList += pp.substring(1);
                                reserveList += ' ';
                            }
                            else if (pp.length > 2) {
                                ppList += pp;
                                ppList += ' ';
                                ++numberOfRiders;
                            }
                        });
                        if (ppList.endsWith(' ')) {
                            ppList = ppList.substring(0, ppList.length - 1);
                        }
                        if (reserveList.endsWith(' ')) {
                            reserveList = reserveList.substring(0, reserveList.length - 1);
                        }
                        //if (ppList.length > 0)
                        participants.push(ppList);
                        //if (reserveList.length > 0)
                        reserves.push(reserveList);
                        numRiders.push(numberOfRiders);
                    });
                }
                // all ready now to show the rides list??
                createRideList();
                success = true;

            });
            return success;
        },


        // may need to split html for each row so that we can update part of it as user adds/removes names
        htmlstringFirstbit = [],
        htmlstringSecondbit = [],
        htmlstringThirdbit = [],
        htmlstringFourthbit = [],

        OK2Join = function (ride) {
            if (ride.leaderName === login.User()) {
                qPopup.Alert("You cannot join your own ride!!");
                return false;
            }
            else if (alreadyReservedToday.length > 0) {
                qPopup.Alert("You are aleady reserved for " + alreadyReservedToday + message);
                return false;
            }
            else if (alreadyRidingToday.length > 0) {
                qPopup.Alert("You are aleady listed for " + alreadyRidingToday + message);
                return false;
            }
            else if (alreadyLeadingToday.length > 0) {
                qPopup.Alert("You are aleady leading " + alreadyLeadingToday + message);
                return false;
            }
            return true;
        },

        today = bleTime.toIntDays(new Date()),
        showRideRow = function (index, ride) {
            var htmlstr = htmlstringFirstbit[index] + htmlstringSecondbit[index] + htmlstringThirdbit[index] + htmlstringFourthbit[index];
            $('#ridelist').append(htmlstr);
            $('#view' + index).click(function () {
                currentride = ride;
                //var route = TCCroutes.findIDFromDest(ride.dest);
                var route = TCCroutes.findRoute(ride.routeID);
                TCCroutes.SetRoute(route);
                // get ready to load new map
                //TCCroutes.SetGPX(null);
                TCCMap.showRoute();
            });
            var spacesLeft = ride.groupSize - numRiders[index];
            var spacesLeftStr = "Riders (" + spacesLeft + " spaces left):";
            if (reserves[index].length > 4) {
                $('#btnParticipants' + index).popover({ title: participants[index] + " (full)", content: 'Reserves: ' + reserves[index], container: 'body', placement: 'bottom' });
            }
            else if (participants[index].length < 4) {
                $('#btnParticipants' + index).popover({ title: 'Riders: ', content: 'none (yet)', container: 'body', placement: 'bottom' });
            }
            else {
                $('#btnParticipants' + index).popover({ title: spacesLeftStr, content: participants[index], container: 'body', placement: 'bottom' });
            }


            if (ride.date < today) {
                $('#join' + index).prop("disabled", true);
                $('#join' + index).html('Closed');
            }
            $('#join' + index).click(function () {
                currentride = ride;
                var user = login.User();
                if (login.loggedOut()) {
                    qPopup.Alert("You are not logged in, please 'account' menu to log in again");
                    return false;
                }
                var buttontext = $('#join' + index).text();
                if (buttontext === joinText) {
                    if (OK2Join(ride) === true) {
                        rideData.saveParticipant(ride.rideID, login.User());
                    }
                }
                //if (buttontext === guestText) {
                //    rideData.saveGuest(ride.rideID, login.User());
                //    $('#join' + index).html(leaveText);
                //}
                else if (buttontext === editRideText) {
                    currentIndex = index;
                    $('#editRideModal').modal();
                    //rideData.deleteRide(ride.rideID);
                }
                else if (buttontext === reserveText) {
                    if (OK2Join(ride) === true) {
                        rideData.saveReserveParticipant(ride.rideID, login.User());
                    }
                }
                else if (buttontext === meText) {
                    qPopup.Choose2("You are signed up for this ride", "What do you want to do?",
                        "Leave the ride", "Add a guest rider",
                        function (choice) {
                            if (choice == '1')
                                rideData.leaveParticipant(ride.rideID, login.User())
                            else if (choice == '2')
                                rideData.saveGuest(ride.rideID, login.User())
                        },
                        100);
                    ;
                }
                else if (buttontext === mePlusText) {
                    qPopup.Choose2("You have signed a guest for this ride", "What do you want to do?",
                        "Remove your guest", "Both leave the ride",
                        function (choice) {
                            if (choice == '2') {
                                rideData.leaveBoth(ride.rideID, login.User());
                            }
                            else if (choice == '1') {
                                rideData.leaveGuest(ride.rideID, login.User());
                            }
                        },
                        100);
                    ;
                }
                else if (buttontext === leaveReserveText) {
                    var reserve = '+' + login.User();
                    rideData.leaveParticipant(ride.rideID, reserve);
                }
                // TCCrides.clearPopovers(-1);
            });
            $('#btnParticipants' + index).click(function () {
                TCCrides.clearPopovers(index);
            });
            if (index === 0) {
                // show route for first ride in list
                currentride = ride;
            }

        },
        showDateRow = function (date) {
            //var htmlstr = '<a style="color:blue;  font-size: larger" &nbsp; &nbsp; >';
         //   var htmlstr = '<a id="sen' + date + '" class="list-group-item list-group-item-info" style="color:blue;  font-size: larger"' + bleTime.fromIntDays(date) + '<button  type="button" id="help3" class="btn btn-lifted btn-info btn-sm pull-right"> Help</button></a>'  ;
            var htmlstr = '<a id="sen' + date + '" class="list-group-item list-group-item-info" style="color:blue;  font-size: larger">' + bleTime.fromIntDays(date) +'</a>';

            $('#ridelist').append(htmlstr);
            $("#sen" + date).on('click', rideData.ChooseDates);
        },
        
        showRideList = function (rides) {
            // data-complete-text="Select"
            var rideDate = null;

            $.each(rides, function (index, ride) {
                // var dest = ride.dest;
                var start = ride.meetingAt;
                var descrip = ride.description;
                var route = TCCroutes.findRoute(ride.routeID);
                if (route === null)
                    return true;
                var time = bleTime.fromIntTime(ride.time);
                var distanceStr = rideData.DistanceString(route);
                var climbingStr = rideData.ClimbingString(route);

                htmlstringFirstbit[index] = '<a id="sen' + index + '" class="list-group-item">' +
                    time + ' <button id="view' + index + '" type="button" class="btn btn-lifted btn-primary btn-responsive btn-fixed ellipsis" data-toggle="button tooltip" title="' + descrip + ', Starting at: ' +
                    start + '">' + route.dest + '</button>' + distanceStr + climbingStr +
                    '<span style="color: blue; font-weight: bold"> (' + ride.leaderName + ') </span>';
                htmlstringSecondbit[index] = '<button id="btnParticipants' + index + '" type="button" class="btn btn-lifted btn-info btn-responsive pull-right has-popover" >Rider List</button>   ';
                htmlstringThirdbit[index] = '<button id="join' + index + '" type="button" class="btn btn-lifted btn-info  btn-responsive pull-right" >' + joinButton[index] + '</button > </a>';
                htmlstringFourthbit[index] = '<a>' + ride.description + ', <i>meeting at: </i>' + ride.meetingAt + '</a>';

            });

            $('#ridelist').empty();  // this will also remove any handlers
            $.each(rides, function (index, ride) {
                if (ride.date != rideDate) {
                    showDateRow(ride.date);
                    rideDate = ride.date;
                }
                showRideRow(index, ride);
            });

        },

        createRideList = function () {

            alreadyRidingToday = '';
            alreadyReservedToday = '';
            alreadyLeadingToday = '';
            // first, split participant list into arrays for each ride

            $.each(rides, function (index, ride) {
                try {
                    if (participants.length > 0)
                        pp[index] = participants[index].split(' ');
                }
                catch (e) {
                    console.log(e.message);
                }
                try {
                    if (reserves.length > 0)
                        rs[index] = reserves[index].split(' ');
                }
                catch (e) {
                    console.log(e.message);
                }
            });

            // now see if this rider is aleady booked on a  ride for this date
            var ID = 'nobody';
            if (login.loggedIn())
                ID = login.User();

            $.each(rides, function (index, ride) {
                try {
                    var dest = TCCroutes.findDestFromID(ride.routeID);
                    if (pp[index].includes(ID))
                        alreadyRidingToday = dest;
                    if (rs[index].includes(ID))
                        alreadyReservedToday = dest;
                    var leader = ride.leaderName;
                    if (leader === ID)
                        alreadyLeadingToday = dest;
                }
                catch (e) {
                    console.log(e.message);
                }
            });

            // decide wether to show 'Join' or 'leave' for each ride
            $.each(rides, function (index, ride) {


                if (pp[index].includes(ID)) {
                    // member is already signed up for this ride
                    joinButton[index] = meText;
                    var riders = pp[index];
                    var rider = riders.indexOf(ID);
                    //if (rider > -1) {
                    //    riders.splice(rider, 1);
                    //}
                    if (riders.includes(ID + '+')) {
                        // guest aleady added
                        joinButton[index] = mePlusText;
                    }
                    else {
                        joinButton[index] = meText;
                    }
                }
                else if (rs[index].includes(ID)) {
                    // member is on reserve list for this ride
                    joinButton[index] = leaveReserveText;
                }
                else if (pp[index].length >= ride.groupSize) {     
                    joinButton[index] = reserveText;
                }
                else if (login.User() === ride.leaderName /*&& pp[index][0] === ''*/) {
                    // can edit your own ride, but not join it
                    joinButton[index] = editRideText;
                }
                else {
                    joinButton[index] = joinText;
                }

            });
            $('#rides-tab').tab('show');
            showRideList(rides);
            $.each(rides, function (index, ride) {
                if (login.loggedOut()) {
                 //   $('#join' + index).prop("disabled", true);
                    $('#btnParticipants' + index).prop("disabled", true);
                }
            });
            // show the current route (first in list)
            var ride = TCCrides.currentride();
            var route = TCCroutes.findRoute(ride.routeID);
            TCCroutes.SetRoute(route);
            // load new map
            //TCCroutes.SetGPX(null);
            TCCMap.showRoute();

        };

    TCCrides.handleRideEdit = function () {
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
            var thisRoute = TCCroutes.findRoute(currentride.routeID);
            thisRoute.dest = dest;
            currentride.description = descrip;
            currentride.meetingAt = start;
            currentride.time = newtime;
            currentride.groupSize = maxRiders;
            thisRoute.distance = dist;
            rideData.myAjax("EditRoute", "POST", thisRoute, function (response) {
                if (response === 'OK') {
                    rideData.myAjax("EditRide", "POST", currentride, function (response) {
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
    };

    var last_msec = 0;


    TCCrides.CreateRideList = function (date) {

        var t = new Date();
        var msec = t.getTime();
        if (msec - last_msec > 2000)  // don't do too often
        {
            last_msec = msec;
            if (date === null) {
                // recursive call from having aadded or removed a rider
                date = currentDate;
                while (rides.length > 0) { rides.pop(); }
            }
            else {
                currentDate = date;
            }

            getWebRides(date); // will call part 2 as and when ready
        }


    };
    TCCrides.DatesWithRides = [];

  //  TCCrides.GetDatesOfRides = function()
  //  {
  //      rideData.myAjax("GetDatesWithRides", "POST", null, function (response) {
  //          TCCrides.DatesWithRides = response;
  ////          rideData.CreateLists();
  //      });
  //  };

    TCCrides.Ride = function (r_id, leader, date, time, meeting, id,descrip,max) {
        this.leaderName = leader;
        this.routeID= r_id;
        this.date = date;
        this.rideID = id;
        this.time = time;
        this.meetingAt = meeting;
        this.description = descrip;
        this.groupSize = max;
    };
    TCCrides.Participant = function (rider, rideID) {
        this.rider = rider;
        this.rideID = rideID;
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

    TCCrides.setMeeting = function () {
        var text = $("input[name='meet']:checked").parent('label').text();
        $('#ride-meeting').val(text);
    };
    TCCrides.setMeetingEdit = function () {
        var text = $("input[name='meet']:checked").parent('label').text();
        $('#edit-ride-start').val(text);
    };

    TCCrides.leadRide = function () {
        $('#convertToRide').show();
        $("#meet2").prop('checked', true);
        $('#start-time').timepicker('setTime', '08:00 AM');
        $("#meet1").click(TCCrides.setMeeting);
        $("#meet2").click(TCCrides.setMeeting);
        $("#meet3").click(TCCrides.setMeeting);
        $("#meetOther").click(function () { $('#ride-meeting').val(''); });
        $("#ride-maxriders").attr("max", maxRidersPerRide);
        
        
        thisRideDate = new Date();
        $("#rideDate1").datepicker({
            beforeShowDay: function (date) { return bleTime.datepickerDates(date); },
            todayBtn: false,
            autoclose: true,
            format: "DD M dd yyyy",
            'setDate': thisRideDate
        });
        $("#rideDate1").change(function () {
            thisRideDate = new Date($("#rideDate1").val());
        });
        
    };
    TCCrides.saveRide = function () {
        var startPlace = $("#ride-meeting").val();
        var description = $("#ride-descrip").val();
        var maxRiders = $("#ride-maxriders").val();
        var route = TCCroutes.currentRoute();
        var leader = login.User();
        var time = starthours * 60 + startmins;
        //var dest = route.dest;
        var date = bleTime.toIntDays(thisRideDate);

        var ride = new TCCrides.Ride(route.id, leader, date, time, startPlace, 0, description,maxRiders);
        qPopup.Confirm("Save this ride", "Are you sure?", function () {
            rideData.myAjax("SaveRide", "POST", ride, function (response) {
                // if successful, response should be just a new ID
                if (response.length < 5) {
                    ride.id = response;
                    TCCroutes.SetRoute(route);
                    TCCrides.Add(ride);
                    $('#convertToRide').hide();
                    //$('#rides-tab').tab('show');
                    rideData.setCurrentTab('rides-tab');
                    rideData.setDate(thisRideDate);
                    rideData.setDateChooser('View other dates');
                    TCCrides.CreateRideList(thisRideDate);

                }
                else {
                    qPopup.Alert(response);
                }

            });
        }, null, -10);
    };

    TCCrides.findRides = function (date) {
        var found = $.grep(TCCrides.DatesWithRides, function (e, i) {
            return e.date === date;
        });
        if (found.length > 0) {
            return found;
        }
        return null;
    };
    TCCrides.Add = function (ride) {
        rides.push(ride);
    };
    TCCrides.currentride = function () {
        return currentride;
    };
    TCCrides.Clear = function () {
        while (rides.length > 0) { rides.pop(); }
    };

    TCCrides.Setride = function (ride) {
        currentride = ride;
    };

    TCCrides.displayedrides = function () {
        return displayedrides;
    };

    TCCrides.DisplayedrideNames = function () {
        var index, nameStr = '';
        for (index = 0; index < displayedrides.length; index++) {
            nameStr += displayedrides[index].Dest;
            nameStr += ', ';
        }
        nameStr = nameStr.slice(0, -2);
        return nameStr;
    };

    TCCrides.ShowFirstRide = function () {

    };
    TCCrides.clearPopovers = function (thisIndex) {
        $.each(rides, function (index) {
            if (index !== thisIndex) {
                $('#btnParticipants' + index).popover('hide');
            }
        });
    };

    $('#editRideModal').on('shown.bs.modal', function (e) {
        var thisRoute = TCCroutes.findRoute(currentride.routeID);
        var units = ' km';
        if (login.Units() === 'm') {
            units = ' miles';
        }

        $("#edit-ride-description").attr("value", currentride.description);
        $("#edit-ride-dest").attr("value", thisRoute.dest);
        $("#edit-ride-distance").attr("value", thisRoute.distance);
        $("#edit-ride-maxriders").attr("value", currentride.groupSize);
        $("#edit-ride-maxriders").attr("max", maxRidersPerRide);
        $("#edit-ride-start").attr("value", currentride.meetingAt);
        $("#edit-cancelRide").prop('readonly', true);

        $("#meet11").click(TCCrides.setMeetingEdit);
        $("#meet12").click(TCCrides.setMeetingEdit);
        $("#meet13").click(TCCrides.setMeetingEdit);
        $("#meet1Other").click(function () { $('#edit-ride-start').val(''); });
        // convert our time in minutes to a string for editing the time

        $('#start-time-edit').timepicker('setTime', bleTime.fromIntTime(currentride.time));

        if (thisRoute.hasGPX) {
            // cannot edit distance for routes wth GPX file
            $("#edit-ride-distance").prop('readonly', true);
            $("#label-distance").html("To edit distance, please upload a different route using 'View all Routes'");
        }
        else {
            $("#edit-ride-distance").prop('readonly', false);
            $("#label-distance").html("Distance" + units + ':');
        }
        if (thisRoute.owner !==login.User()) {
            // cannot edit name of someone else's route
            $("#edit-ride-dest").prop('readonly', true);
            $("#label-dest").html("You cannot edit the name of another user's route");
        }
        if (pp[currentIndex][0] === '') {
            $("#edit-cancelRide").prop('readonly', false);
            $("#edit-ride-title").html("Edit ride details");
        }
        else {
            // there are riders booked on this ride
            $("#edit-ride-title").html("There are rider(s) booked on this ride. Please make only minor changes");
        }

    });
    $("#edit-ride-ok").on("click", TCCrides.handleRideEdit);
    $("#edit-ride-cancel").on('click', function () {
        $('#editRideModal').modal('hide');
    });
    $("#edit-cancelRide").on('click', function () {
        if (pp[currentIndex][0] === '') {
            rideData.deleteRide(currentride.rideID);
            $('#editRideModal').modal('hide');
        }
        else {
            qPopup.Alert("There are rider(s) booked on this ride. Please find a different leader if you cannot attend");
        }

    });
    $("#saveRide").on('click', TCCrides.saveRide);

    return TCCrides;
}(jQuery));
