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
        // list of rides currently displayed 
        displayedRides = [],

        // the latest one to be downloaded from web. Includes URL only, not full gpx
        currentride = null,
        // the latest full gpx text
        currentGPX = null;


    TCCrides.getWebRides = function (date) {
        var intdays = bleTime.toIntDays(date);
        bleData.myJson("GetRidesForDate", "POST", intdays, function (response) {
            rides = response;
            if (rides.length === 0) {
                popup.Alert("No rides found for " + bleTime.dateString(date));
                return null;
            }
            return rides;
        }, false, null);

        return rides;
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


    TCCrides.CreateRideList = function (date) {
        var id = login.ID();
        if (id === undefined || id === 0) {
            $('#loginModal').modal();
            return;
        }
        if (rides === undefined || rides.length === 0) {
            TCCrides.getWebRides(date);
        }
        $('#ridelist').empty();  // this will also remove any handlers
        
        $.each(rides, function (index, ride) {
            var title = ride.dest;
            if (ride.dist !== undefined) {
                title = title + '(' + ride.dist + 'km)';
            }

            var htmlstr = '<a id="sen' + index + '" class="list-group-item">' +
                '<button id="view' + index + '" type="button" class="btn btn-lifted btn-info btn-sm " data-toggle="button" data-complete-text="Select">View</button> ' +
                title + ' (leader: ' + ride.leaderName + ') ' +
                '<button id="join' + index + '" type="button" class="btn btn-lifted btn-info btn-sm pull-right" data-toggle="button" data-complete-text="Select">Join</button>' +
                '</a>';
            $('#ridelist').append(htmlstr);

            $('#view' + index).click(function () {
                currentride = ride;
                var route = TCCroutes.findIDFromDest(ride.dest);
                TCCroutes.SetRoute(route);
                // get ready to load new map
                TCCroutes.SetGPX(null);
                bleData.showRoute();
            });

            $('#join' + index).click(function () {
                currentride = ride;
            // todo
            });
            if (index === 0) {
                //$('#home-tab').tab('show');
                // show route for first ride in list
                currentride = ride;
            }
            index++;
        });
        var ride = TCCrides.currentride();
        var route = TCCroutes.findIDFromDest(ride.dest);
        TCCroutes.SetRoute(route);
        // load new map
        TCCroutes.SetGPX(null);
        bleData.showRoute();
    };
    TCCrides.ShowFirstRide = function () {

    };
    return TCCrides;
}());
