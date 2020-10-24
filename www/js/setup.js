
/*global jQuery,TCCroutes*/




var bleSetup = (function ($) {

    "use strict";

    var bleSetup = {},

        saveRoute = function (route) {


            if (route.url.length < 2) {
                if (route.dest.length < 2 || route.dist === '' || route.dist === 0) {
                    popup.Alert("Destination and distance needed");
                    return;
                }
                if (route.description.length < 2) {
                    popup.Alert("Description needed");
                    return;
                }
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
            }
            catch (_) {
                return false;
            }
            return true;
        },
        checkXML = function (xmlstring) {
            var oParser = new DOMParser();
            var oDOM = oParser.parseFromString(xmlstring, "text/xml");
            // print the name of the root element or error message
            console.log(oDOM.documentElement.nodeName);
            if (oDOM.documentElement.nodeName === "parsererror")
                return false;
            return true;
        },
        myXML,
        readEnd = function (event) {
         //   popup.Alert(" file read ended");
        },
        readSuccess = function (event) {
            myXML = event.target.result;
            if (checkXML(myXML) === false) {
                popup.Alert("Invalid route file");
            }
            else {
                //   popup.Alert("Route file OK");
                $("#route-url").html('Route file OK! ' + myXML.length + ' bytes');
                console.log('Route file OK! ' + myXML.length + ' bytes');
            }
        },
        readFile = function(file) {

            var reader = new FileReader();
            reader.onload = readSuccess;
          //  reader.onloadstart = readStart;
            reader.onloadend = readEnd;

            reader.readAsText(file);
        };

    $('#uploadRoute').show();
    $("#setupDone").show();
    $('#leadRide').hide();
    $('#convertToRide').hide();

    //$('#routeTitle').html('Destination (with unique name); Description e.g. easy,middle, hard');
    $("#leadRide").on('click', TCCrides.leadRide);
   // document.getElementById('route-file').addEventListener('change', readFile, false);
    document.getElementById('route-file').onchange = function (e) {
        readFile(e.srcElement.files[0]);
    };
    //$("#route-file").on('change', readFile, false);
    myXML = "";
    $("#setupDone").on('click', function () {
        $("#saveRoute").prop("disabled", true);

        if (login.Role < 1) {
            popup.Alert("You need to register for this");
            return;
        }
       
        var descrip  = $("#route-descrip").val();
        var dest = $("#route-dest").val();
        var url = $("#route-url").val();
        var dist = $("#route-distance").val();         if (dist === '') dist = 0;
        var owner = login.ID();
        var route = new TCCroutes.Route(url, dest, descrip,dist, 0, owner, 0);

        if (myXML.length > 1000) {
            // user has complete data on PC
            route.url = myXML;
            route.dist = 0;
            popup.Confirm("Save new route", "Are you sure?", saveRoute(route), null, -10);
        }
        else if (url.length < 2) {
            popup.Confirm("Add a ride without uploading a route?", "Are you sure?", saveRoute(route), null, -10);
        }
        else if (validURL(url) ) {
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