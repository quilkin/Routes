
/*global jQuery,TCCroutes*/




var bleSetup = (function ($) {

    "use strict";

    var bleSetup = {},

    saveRoute = function (route) {
        if (route.dest.length < 2) {
            popup.Alert("Destination needed");
            return;
        }
        if (route.description.length < 2 && route.url.length < 2) {
            popup.Alert("Description needed");
            return;
        }
        if (route.url.length < 2) {
            route.url = 'none';
            // prevent this route showing in routes listing
            route.dest = '*' + route.dest;
        }

        bleData.myJson("SaveRoute", "POST", route, function (response) {
            // if successful, response should be just a new ID
            if (response.length < 5) {
                route.id = response;
                $("#setupDone").hide();
                //popup.Alert("Route saved OK, id = " + route.id);
                TCCroutes.SetRoute(route);

                TCCroutes.Add(route);
                if (route.url !== 'none') {
                    bleData.getGPX();
                    bleData.showRoute();
                    TCCroutes.CreateRouteList();
                }
                $('#leadRide').show();

            }
            else {
                popup.Alert(response);
            }

        }, true, null);
    },
    validURL = function (string) {
        try {
            new URL(string);
        } catch (_) {
            return false;
        }

        return true;
    };

    $('#uploadRoute').show();
    $("#setupDone").show();
    $('#leadRide').hide();
    $('#convertToRide').hide();
    $("#setupDone").show();
    //$('#routeTitle').html('Destination (with unique name); Description e.g. easy,middle, hard');
    $("#leadRide").on('click', bleData.leadRide);
    $("#setupDone").on('click', function () {
        $("#saveRoute").prop("disabled", true);

        if (login.Role < 1) {
            popup.Alert("You need to register for this");
            return;
        }
        $("#setupDone").hide();
        var descrip  = $("#route-descrip").val();
        var dest = $("#route-dest").val();
        var url = $("#route-url").val();
        var owner = login.ID();
        var route = new TCCroutes.Route(url, dest, descrip, 0, 0, owner, 0);
        if (url.length < 2) {
            popup.Confirm("Add a ride without uploading a route?", "Are you sure?", saveRoute(route), null, -10);

        }
        else if (validURL(url)) {
            route.url = url;
            popup.Confirm("Save new route", "Are you sure?", saveRoute(route), null, -10);
        }
        else {
            popup.Alert("Invalid URL, sorry!");
        }

    });
    
    $("#cancelNewRoute").on('click', function () {
   
            $(".navbar-nav a[href=#home]").tab('show');

    });
    $("#cancelLeadRide").on('click', function () {

        $(".navbar-nav a[href=#home]").tab('show');

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