// a 'ride' is a defined ride, happening on a defined date/time, led by a defined leader. 

var TCCrides = (function () {
    "use strict";

        //ride data members
//[DataMember(Name = "dest")]        public string Dest { get; set; }
//[DataMember(Name = "leaderName")]        public string LeaderName { get; set; }
//[DataMember(Name = "rideID")]        public int ID { get; set; }
//[DataMember(Name = "date")]        public int Date { get; set; }
//[DataMember(Name = "time")]        public int Time { get; set; }
//[DataMember(Name = "meetingAt")]        public string MeetAt { get; set; }

    var TCCrides = {},

        // list of rides downloaded from database
        rides = [],
        rideIDs = [],
        //array of lists of participants, each member will be a string of paticipants for that ride
        participants = [],
        // state of join/leave button
        joinButton = [],
        joinText = 'Join',
        leaveText = 'Leave',
        cancelRideText = 'Cancel this ride',
        currentDate,

        // the latest one to be downloaded from web. Includes URL only, not full gpx
        currentride = null,

        getWebRides = function (date) {
            var intdays = bleTime.toIntDays(date);
            bleData.myJson("GetRidesForDate", "POST", intdays, function (response) {
                rides = response;
                if (rides.length === 0) {
                    popup.Alert("No rides found for " + bleTime.dateString(date));
                    return null;
                }
                $.each(rides, function (index) {
                    rideIDs[index] = rides[index].rideID;
                });
                GetParticipants(rideIDs, participants);
                return rides;
            }, false, null);

            return rides;
        },

        GetParticipants = function (rideIDs, participants) {

            bleData.myJson("GetParticipants", "POST", rideIDs, function (response) {
                $.each(rideIDs, function (index, ride) {
                    participants[index] = response[index];
                });
                //         return participants;

            }, false, null);
        },

        // may need to split html for each row so that we can update part of it as user adds/removes names
        htmlstringFirstbit = [],
        htmlstringSecondbit = [],
        today = bleTime.toIntDays(new Date()),
        showRideRow = function (index, ride) {


            var htmlstr = htmlstringFirstbit[index] + participants[index] + htmlstringSecondbit[index];

            $('#ridelist').append(htmlstr);

            $('#view' + index).click(function () {
                currentride = ride;
                var route = TCCroutes.findIDFromDest(ride.dest);
                TCCroutes.SetRoute(route);
                // get ready to load new map
                TCCroutes.SetGPX(null);
                bleData.showRoute();
            });
            if (ride.date < today) {
                $('#join' + index).prop("disabled", true);
                $('#join' + index).html('Closed');
            }
            $('#join' + index).click(function () {
                currentride = ride;
                var buttontext = $('#join' + index).text();
                if (buttontext === joinText) {
                    if (ride.leaderName === login.User()) {
                        popup.Alert("You cannot join your own ride!!");
                    }
                    else {
                        bleData.saveParticipant(ride.rideID, login.User());
                    }
                }
                else if (buttontext === cancelRideText) {
                    bleData.deleteRide(ride.rideID);
                }
                else {
                    bleData.leaveParticipant(ride.rideID, login.User());

                }
            });
            if (index === 0) {
                // show route for first ride in list
                currentride = ride;
            }

        },

        showRideList = function (rides) {
           // data-complete-text="Select"

            $.each(rides, function (index, ride) {
                var dest = ride.dest;
                var start = ride.meetingAt;
                var route = TCCroutes.findIDFromDest(ride.dest);
                var distance = route.distance;
                var time = bleTime.fromIntTime(ride.time);
                if (distance === undefined) {
                    distance = "";
                }

                htmlstringFirstbit[index] = '<a id="sen' + index + '" class="list-group-item">' +
                    '<button id="view' + index + '" type="button" class="btn btn-lifted btn-info btn-sm " data-toggle="button tooltip" title="Starting at: ' +
                    start + ', ' + time + '">' + dest + '</button>' +

                    '<span style="color:red; font-weight: bold">  ' + distance + 'km</span>' +
                    '<span style="color:blue; font-weight: bold">  ' + ride.leaderName + '</span>';
                htmlstringSecondbit[index] = '<button id="join' + index + '" type="button" class="btn btn-lifted btn-info btn-sm pull-right" data-toggle="button">' +
                    joinButton[index] + '</button > </a>';
            });

            $('#ridelist').empty();  // this will also remove any handlers
            $.each(rides, function (index, ride) {
                showRideRow(index, ride);
            });

        },
        // the latest full gpx text
        currentGPX = null;


    TCCrides.CreateRideList = function (date) {
        var id = login.ID();
        if (id === undefined || id === 0) {
            $('#loginModal').modal();
            return;
        }
        if (date === null) {
            // recursive call from having aadded or removed a rider
            date = currentDate;
            while (rides.length > 0) { rides.pop(); }
        }
        else {
            currentDate = date;
        }
        while (participants.length > 0) { participants.pop(); }


     //   if (rides === undefined || rides.length === 0) {
            getWebRides(date);
      //  }
        // decide wether to show 'Join' or 'leave' for each ride
        $.each(rides, function (index, ride) {
           // string to search for in participant list
            var commaID = ',' + login.User() + ',';
            if (login.Role() < 1) {
                joinButton[index].hide();
            }
            else
            if (participants[index].includes(commaID)) {
                // member is already signed up for this ride
                joinButton[index] = leaveText;
            }
            else if (login.User() === ride.leaderName && participants[index].length < 2) {
                joinButton[index] = cancelRideText;
            }
            else {
                joinButton[index] = joinText;
            }

        });

        showRideList(rides);

        // to review: maybe can't load a route here because of web callbacks overloading. Previous callbacks now made sync not async - will this be OK?
        var ride = TCCrides.currentride();
        var route = TCCroutes.findIDFromDest(ride.dest);
        TCCroutes.SetRoute(route);
        // load new map
        TCCroutes.SetGPX(null);
        bleData.showRoute();
    };

    TCCrides.Ride = function (dest, leader, date, time, meeting, id) {
        this.leaderName = leader;
        this.dest = dest;
        this.date = date;
        //this.distance = dist;
        //this.description = descrip;
        this.rideID = id;
        this.time = time;
        this.meetingAt = meeting;
    };
    TCCrides.Participant = function (rider, rideID) {
        this.rider = rider;
        this.rideID = rideID;
    };

    TCCrides.findRide = function (id) {
        var found = $.grep(foundRides, function (e, i) {
            return e.id === id;
        });
        if (found.length > 0) {
            return found[0];
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
    //TCCrides.currentGPX = function () {
    //    return currentGPX;
    //};
    TCCrides.Setride = function (ride) {
        currentride = ride;
    };
    //TCCrides.SetGPX = function (gpx) {
    //    currentGPX = gpx;
    //};
    TCCrides.displayedrides = function () {
        return displayedrides;
    };
    //TCCrides.Foundrides = function () {
    //    return foundrides;
    //};
    //TCCrides.ClearFoundrides = function () {
    //    while (foundrides.length > 0) { foundrides.pop(); }
    //};
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
    return TCCrides;
}());
