﻿/*global bleTime,TCCroutes,TCCrides,bleData,jQuery*/

// a 'ride' is a defined ride, happening on a defined date/time, led by a defined leader.

var TCCrides = (function ($) {
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
        //array of lists of reserve participants, each member will be a string of paticipants for that ride
        reserves = [],
        // state of join/leave button
        joinButton = [],
        joinText = 'Join',
        leaveText = 'Leave',
        reserveText = 'Ride full: Reserve',
        leaveReserveText = 'Leave Reserves',
        cancelRideText = 'Cancel this ride',
        currentDate,
        starthours, startmins,
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
                GetParticipants(rideIDs);
                return rides;
            }, false, null);

            return rides;
        },

        GetParticipants = function (rideIDs) {
            
            while (reserves.length > 0) { reserves.pop(); }
            while (participants.length > 0) { participants.pop(); }
            bleData.myJson("GetParticipants", "POST", rideIDs, function (response) {
                $.each(rideIDs, function (index, ride) {
                    // get a list of all participants and reserves for the ride, split into two lists
                    var list = response[index].split(',');
                    var reserveList = '';
                    var ppList = '';
                    $.each(list, function (index,pp) {
                        if (pp.includes('+')) {
                            reserveList += pp.substring(1);
                            reserveList += ' ';
                        }
                        else {
                            ppList += pp;
                            ppList += ' ';
                        }
                    });
                    participants.push(ppList);
                    reserves.push(reserveList);
                });
                

            }, false, null);
        },


        // may need to split html for each row so that we can update part of it as user adds/removes names
        htmlstringFirstbit = [],
        htmlstringSecondbit = [],
        htmlstringThirdbit = [],
        htmlstringFourthbit = [],
        today = bleTime.toIntDays(new Date()),
        showRideRow = function (index, ride) {


            var htmlstr = htmlstringFirstbit[index]  + htmlstringSecondbit[index]  + htmlstringFourthbit[index];

            $('#ridelist').append(htmlstr);

            $('#view' + index).click(function () {
                currentride = ride;
                var route = TCCroutes.findIDFromDest(ride.dest);
                TCCroutes.SetRoute(route);
                // get ready to load new map
                TCCroutes.SetGPX(null);
                bleData.showRoute();
            });
            if (reserves[index].length > 4) {
                $('#participants' + index).popover({ title: participants[index], content: 'Reserves: ' + reserves[index], container: 'body', placement: 'bottom' });
            }
            else if (participants[index].length < 4) {
                $('#participants' + index).popover({ title: 'Riders: ', content: 'none (yet)', container: 'body', placement: 'bottom' });
            }
            else {
                $('#participants' + index).popover({ title: 'Riders: ', content: participants[index], container: 'body', placement: 'bottom' });
            }
            //$('#reserves' + index).popover({ title: 'Reserve List', content: reserves[index], container: 'body', placement: 'bottom' });

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
                else if (buttontext === reserveText) {
                    if (ride.leaderName === login.User()) {
                        popup.Alert("You cannot join your own ride!!");
                    }
                    else {
                        bleData.saveReserveParticipant(ride.rideID, login.User());
                    }
                }
                else if (buttontext === leaveText) {
                   
                    bleData.leaveParticipant(ride.rideID, login.User());
                }
                else if (buttontext === leaveReserveText) {
                    var reserve = '+' + login.User();
                    bleData.leaveParticipant(ride.rideID, reserve);
                }
                $('#participants' + index).popover('hide');
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
                    time + ' <button id="view' + index + '" type="button" class="btn btn-lifted btn-primary btn-sm " data-toggle="button tooltip" title="Starting at: ' +
                    start  + '">' + dest + '</button>' +
                    '<span style="color:red; font-weight: bold">  ' + distance + 'km </span>' +
                    'Leader: <span style="color:blue; font-weight: bold">  ' + ride.leaderName + '  </span>';
                htmlstringSecondbit[index] = '<button id="participants' + index + '" type="button" class="btn btn-lifted btn-info btn-sm  pull-right" >Rider List</button>   ';
                htmlstringFourthbit[index] = '<button id="join' + index + '" type="button" class="btn btn-lifted btn-info btn-sm pull-right" >' + joinButton[index] + '</button > </a>';
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

        getWebRides(date);

        // decide wether to show 'Join' or 'leave' for each ride
        $.each(rides, function (index, ride) {
           // string to search for in participant list
            //var commaID = ',' + login.User() + ',';
            //// participants in reserve list
            //var commaPlusID = ',+' + login.User() + ',';
            if (login.Role() < 1) {
                joinButton[index].hide();
            }
            else if (participants[index].includes(login.User())) {
                // member is already signed up for this ride
                joinButton[index] = leaveText;
            }
            else if (reserves[index].includes(login.User())) {
                // member is on reserve list for this ride
                joinButton[index] = leaveReserveText;
            }
            else if (participants[index].length >= 6) {     // Todo: need to get this figure from DB beforehand
                joinButton[index] = reserveText;
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
        //$('#fromDate').hide();
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
    $('#start-time').timepicker().on('changeTime.timepicker', function (e) {
        if (e.time !== undefined) {
            console.log('The time is ' + e.time.value);
            starthours = e.time.hours;
            startmins = e.time.minutes;
        }
    });

    TCCrides.leadRide = function () {
        $('#convertToRide').show();
        $('#route-url-label').hide();
        $('#route-url').hide();
        $('#start-time').timepicker('setTime', '08:00 AM');

        //$("#rideDate1").datepicker({ todayBtn: false, autoclose: true, format: "dd M yyyy" });
        
        var thisRideDate = new Date();
        $("#rideDate1").datepicker('setDate', thisRideDate);
        $("#rideDate1").change(function () {
            thisRideDate = new Date($("#rideDate1").val());
        });
        $("#saveRide").on('click', function () {
            var startPlace = $("#ride-meeting").val();
            var route = TCCroutes.currentRoute();
            var leader = login.User();
            var time = starthours * 60 + startmins;
            var dest = route.dest;
            var date = bleTime.toIntDays(thisRideDate);
            var ride = new TCCrides.Ride(dest, leader, date, time, startPlace, 0);
            popup.Confirm("Save this ride", "Are you sure?", function () {
                bleData.myJson("SaveRide", "POST", ride, function (response) {
                    // if successful, response should be just a new ID
                    if (response.length < 5) {
                        ride.id = response;
                        TCCroutes.SetRoute(route);
                        TCCrides.Add(ride);
                        $('#home-tab').tab('show');
                        bleData.setCurrentTab('home-tab');
                        bleData.setDate(thisRideDate);
                        bleData.setDateChooser('View other dates');
                        TCCrides.CreateRideList(thisRideDate);
                    }
                    else {
                        popup.Alert(response);
                    }

                }, true, null);
            }, null, -10);
        });
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
}(jQuery));
