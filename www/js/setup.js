﻿
/*global jQuery,TCCroutes*/

//route data members

//[DataMember(Name = "route")]          public string GPX { get; set; }
//[DataMember(Name = "dest")]           public string Dest { get; set; }
//[DataMember(Name = "description")]    public string Descrip { get; set; }
//[DataMember(Name = "distance")]       public int Distance { get; set; }      
//[DataMember(Name = "climbing")]       public int Climbing { get; set; }
//[DataMember(Name = "owner")]          public int Owner { get; set; }
//[DataMember(Name = "place")]          public string Place { get; set; }
//[DataMember(Name = "date")]           public DateTime Date { get; set; }
//[DataMember(Name = "time")]           public DateTime Time { get; set; }
//[DataMember(Name = "id")]             public int ID{ get; set; }


var bleSetup = (function ($) {

    "use strict";

    var bleSetup = {},
        //alarmSlider,
        //minAlarm = 2,
        //maxAlarm = 8,
        //minVal = -30,
        //maxVal = 90,
        registering = false,

        validURL = function (string) {
            try {
                new URL(string);
            } catch (_) {
                return false;
            }

            return true;
        };

    //save = function (route) {        
    //    popup.Confirm("Save new route", "Are you sure?", function () {
    //        bleData.myJson("SaveRoute", "POST", route, function (response) {
    //            popup.Alert(response);
    //        }, true, null);
    //    }, null, -10);
    //};

    $("#btnLow-").on('click', function () {
        if (minAlarm > minVal) {
            --minAlarm;
            update();
        }
        else {    /* beep? */ }
    });
    $("#btnLowPlus").on('click', function () {
        if (minAlarm < maxAlarm) {
            ++minAlarm;
            update();
        }
        else {    /* beep? */ }
    });
    $("#btnHi-").on('click', function () {
        if (maxAlarm > minAlarm) {
            --maxAlarm;
            update();
        }
        else {    /* beep? */ }
    });
    $("#btnHiPlus").on('click', function () {
        if (maxAlarm < maxVal) {
            ++maxAlarm;
            update();
        }
        else {    /* beep? */ }
    });
    $("#setupDone").on('click', function () {
        $("#saveRoute").prop("disabled", true);
        
        var descrip  = $("#route-descrip").val();
        var dest = $("#route-dest").val();
        var url = $("#route-url").val();
        var owner = login.ID();
        if (validURL(url)) {
            var route = new TCCroutes.Route(url, dest, descrip, 0,0, owner,0);
            popup.Confirm("Save new route", "Are you sure?", function () {
                bleData.myJson("SaveRoute", "POST", route, function (response) {
                // if successful, response should be just a new ID
                if (response.length < 5) {
                    route.id = response;

                    popup.Alert("Route saved OK, id = " + route.id);
                    TCCroutes.SetRoute(route);

                    TCCroutes.Add(route);
                    bleData.getGPX();
                    bleData.showRoute();
                    TCCroutes.CreateRouteList();
                                        // to do:  need to ask user to verify this route
                }
                else {
                    popup.Alert(response);
                }

                }, true, null);
            }, null, -10);
        }
        else {
            popup.Alert("Invalid URL, sorry!");
        }

    });
    
    $("#cancelChanges").on('click', function () {
       // if (registering) {
            // switch back to connection tab
            $(".navbar-nav a[href=#home]").tab('show');
      //  }
      //  else {
            // TO DO: change back to original values
      //  }
    });

    bleSetup.initialise = function (reg) {
       
        //if (bleData.currentRoute() === null) {
        //    popup.Alert("Please choose a route");
        //    return;
        //}
        registering = reg;
        var perioditem,route =  TCCroutes.currentRoute();
        if (route === undefined || route === null) {
            route = new TCCroutes.Route("no gpx", "destination?", "description?", 0, 0, 0);
        }
        $("#route-dest").val(route.Dest);
        $("#route-descrip").val(route.Description);
        //periodButton(route);
        //minAlarm = route.AlarmLow / 10;
        //maxAlarm = route.AlarmHigh / 10;
        $("#saveRoute").prop("disabled", true);


        update();
    };

    return bleSetup;
}(jQuery));