var RideList = (function ($) {
    "use strict";

    const maxridesperday = 10;
    const message = ", and cannot join more than one ride each day";
    const joinText = 'Join';
    const reserveText = 'Reserve';
    const meText = 'me';
    const mePlusText = 'me+';
    const leaveReserveText = 'UnReserve';
    const editRideText = 'Edit/Cancel';


    var RideList = {},

    // list of rides downloaded from database
    rides = [],
    //rideIDs = [],
    //array of lists of participants, each member will be a string of paticipants for that ride
    participants = [],
    //array of lists of reserve participants, each member will be a string of paticipants for that ride
    reserves = [],

    // number of signed-up riders for each ride
    numRiders = [],

    // will be used to break up participant strings into 2D arrays
    pp,
    rs,
    // the latest one to be downloaded from web. Includes URL only, not full gpx
    currentride = null,

    // curently chosen one from the list, used for getting participants
    currentIndex = 0,
    // to check that riders don't join two rides on same day
    alreadyRidingDest, alreadyRidingDate,
    alreadyReservedDest, alreadyReservedDate,
    alreadyLeadingDest, alreadyLeadingDate,

    // state of join/leave button
    joinButton = [],

    currentDate,

    last_msec = 0,

    getWebRides = function (date) {
        var rideIDs = [];
        var intdays = RideTimes.toIntDays(date);
        console.log("getWebRides: ");
        rideData.myAjax("GetRidesForDate", "POST", intdays, function (response) {
            rides = response;
            if (rides.length === 0) {
                $('#ridelist').empty();  // this will also remove any handlers
                qPopup.Alert(RideTimes.DateString(date) + ": no rides found for 60 days");
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
        else if (alreadyReservedDest.length > 0 && alreadyReservedDate == ride.date) {
            qPopup.Alert("You are aleady reserved for " + alreadyReservedDest + message);
            return false;
        }
        else if (alreadyRidingDest.length > 0 && alreadyRidingDate == ride.date) {
            qPopup.Alert("You are aleady listed for " + alreadyRidingDest + message);
            return false;
        }
        else if (alreadyLeadingDest.length > 0 && alreadyLeadingDate == ride.date) {
            qPopup.Alert("You are aleady leading " + alreadyLeadingDest + message);
            return false;
        }
        return true;
    },

    showRideRow = function (index, ride) {
        var htmlstr = htmlstringFirstbit[index] + htmlstringSecondbit[index] + htmlstringThirdbit[index] + htmlstringFourthbit[index];
        $('#ridelist').append(htmlstr);
        $('#view' + index).click(function () {
            currentride = ride;
            var route = TCCroutes.findRoute(ride.routeID);
            TCCroutes.SetRoute(route);
            TCCMap.showRoute();
        });
        if (login.loggedIn()) {
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
        }

        if (ride.date < RideTimes.toIntDays(new Date()))  // before today
        {
            $('#join' + index).prop("disabled", true);
            $('#join' + index).html('Closed');
        }
        $('#join' + index).click(function () {
            currentride = ride;
           // var user = login.User();
            if (login.loggedOut()) {
              //  $('#loginModal').modal();
                //qPopup.Alert("You are not logged in, please 'account' menu to log in again");
                return false;
            }
            var buttontext = $('#join' + index).text();
            if (buttontext === joinText) {
                if (OK2Join(ride) === true) {
                    rideData.saveParticipant(ride.rideID, login.User());
                }
            }
            else if (buttontext === editRideText) {
                currentIndex = index;
                $('#editRideModal').modal();
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
        });
        $('#btnParticipants' + index).click(function () {
            RideList.clearPopovers(index);
        });
        if (index === 0) {
            // show route for first ride in list
            currentride = ride;
        }

    },
    showDateRow = function (date) {
        var htmlstr = '<a id="sen' + date + '" class="list-group-item list-group-item-info" style="color:blue;  font-size: larger">' + RideTimes.fromIntDays(date) +'</a>';
        $('#ridelist').append(htmlstr);
        $("#sen" + date).on('click', rideData.ChooseDates);
    },
        
    showRideList = function (rides) {

        var rideDate = null;
        $.each(rides, function (index, ride) {
            var start = ride.meetingAt;
            var descrip = ride.description;
            var route = TCCroutes.findRoute(ride.routeID);
            if (route === null)
                return;
            var time = RideTimes.fromIntTime(ride.time);
            var distanceStr = rideData.DistanceString(route);
            var climbingStr = rideData.ClimbingString(route);

            htmlstringFirstbit[index] = '<a id="sen' + index + '" class="list-group-item">' +
                time + ' <button id="view' + index + '" type="button" class="btn btn-lifted btn-primary btn-responsive btn-fixed ellipsis" data-toggle="button tooltip" title="' + descrip + ', Starting at: ' +
                start + '">' + route.dest + '</button>' + distanceStr + climbingStr +
                '<span style="color: blue; font-weight: bold"> (' + ride.leaderName + ') </span>';
            htmlstringSecondbit[index] = '<button id="btnParticipants' + index + '" type="button" class="btn btn-lifted btn-info btn-responsive pull-right has-popover" >Rider List</button>   ';
            htmlstringThirdbit[index] = '<button id="join' + index + '" type="button" class="btn btn-lifted btn-info  btn-responsive pull-right" >' + joinButton[index] + '</button > </a>';
            htmlstringFourthbit[index] = ride.description + '<span style="color: blue; font-weight: bold"> Meeting at: </span>' + ride.meetingAt ;

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

        alreadyRidingDest = '';
        alreadyReservedDest = '';
        alreadyLeadingDest= '';
        alreadyRidingDate = 0;
        alreadyReservedDate = 0;
        alreadyLeadingDate = 0;
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
                if (pp[index].includes(ID)) {
                    alreadyRidingDest = dest;
                    alreadyRidingDate = ride.date;
                }
                if (rs[index].includes(ID)) {
                    alreadyReservedDest = dest;
                    alreadyReservedDate = ride.date;
                }
                    var leader = ride.leaderName;
                if (leader === ID) {
                    alreadyLeadingDest = dest;
                    alreadyLeadingDate = ride.date;
                }
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
        //$.each(rides, function (index, ride) {
        //    if (login.loggedOut()) {
        //        $('#btnParticipants' + index).prop("disabled", true);
        //    }
        //});
        // show the current route (first in list)
        //var route = TCCroutes.findRoute(Ride.GetCurrent());
        var route = TCCroutes.findRoute(currentride.routeID);
        TCCroutes.SetRoute(route);
        // load new map
        TCCMap.showRoute();
    };

    RideList.CreateRideList = function (date) {

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
    RideList.DatesWithRides = [];

 
    RideList.findRides = function (date) {
        var found = $.grep(RideList.DatesWithRides, function (e, i) {
            return e.date === date;
        });
        if (found.length > 0) {
            return found;
        }
        return null;
    };

    RideList.Clear = function () {
        while (rides.length > 0) { rides.pop(); }
    };
    RideList.Add = function (ride) {
        rides.push(ride);
    };
    //RideList.Participants = function () {
    //    return pp;
    //};
    RideList.CurrentParticipants = function () {
        return pp[currentIndex];
    };
    RideList.CurrentRide = function () {
        return currentride;
    };
    RideList.clearPopovers = function (thisIndex) {
        $.each(rides, function (index) {
            if (index !== thisIndex) {
                $('#btnParticipants' + index).popover('hide');
            }
        });
    };


    return RideList;
}(jQuery));
