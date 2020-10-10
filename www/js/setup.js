
/*global jQuery,TCCroutes*/



var bleSetup = (function ($) {

    "use strict";

    var bleSetup = {},

        registering = false,
        rideDate,

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
    $('#uploadRoute').show();
    $("#setupDone").show();
    $('#leadRide').hide();
    $('#convertToRide').hide();
    $("#leadRide").on('click', bleData.leadRide);
        

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
                    $("#setupDone").hide();
                    //popup.Alert("Route saved OK, id = " + route.id);
                    TCCroutes.SetRoute(route);

                    TCCroutes.Add(route);
                    bleData.getGPX();
                    bleData.showRoute();
                    TCCroutes.CreateRouteList();
                    $('#leadRide').show();

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
        $('#leadRide').hide();
        $('#convertToRide').hide();

        update();
    };

    return bleSetup;
}(jQuery));