/*global jQuery,TCCroutes,rideData*/

var newRoute = (function ($) {

    "use strict";

    var newRoute = {},
        saveRoute = function (route) {
            rideData.myJson("SaveRoute", "POST", route, function (response) {
                // if successful, response should be just a new ID
                if (response.length < 5) {
                    route.id =  parseInt(response);
                    TCCroutes.SetRoute(route);
                    TCCroutes.Add(route);
                    if (route.url === 'none')  {
                        $('#manual-leadRide').show();
                    }
                    else {
                        TCCMap.showRoute();
                        TCCroutes.CreateRouteList(false);
                        $('#leadRide').show();
                    }
                    

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

        readSuccess = function (event) {
            myXML = event.target.result;
            if (checkXML(myXML) === false) {
                popup.Alert("Invalid route file");
            }
            else {
                //   popup.Alert("Route file OK");
                $("#route-url").html('Route file OK! ' + myXML.length + ' bytes');
                //console.log('Route file OK! ' + myXML.length + ' bytes');
                TCCMap.showRouteStage2(myXML,false);
            }
        },
        readFile = function(file) {

            var reader = new FileReader();
            reader.onload = readSuccess;
            reader.readAsText(file);
            
        };

    $('#uploadRoute').show();
    $("#setupDone").show();
    $('#manualRoute').show();
    $("#manual-setupDone").show();

    $('#leadRide').hide();
    $('#manual-leadRide').hide();

    $('#convertToRide').hide();

    $("#leadRide").on('click', TCCrides.leadRide);
    $("#manual-leadRide").on('click', TCCrides.leadRide);

    document.getElementById('route-file').onchange = function (e) {
        readFile(e.srcElement.files[0]);
    };

    myXML = "";
    $("#manual-setupDone").on('click', function () {
        $("#saveRoute").prop("disabled", true);

        if (login.Role < 1) {
            popup.Alert("You need to register for this");
            return;
        }
       
        var descrip  = $("#manual-route-descrip").val();
        var dest = $("#route-dest").val();
        var dist = $("#route-distance").val();
        if (dist === '') dist = 0;
            dist = Number(dist);
            dist = dist.toFixed(0);
        var owner = login.ID();

        if (dest.length < 2 || dist === '' || dist === 0) {
            popup.Alert("Destination and distance needed");
            return;
        }
        if (descrip.length < 2) {
            popup.Alert("Description needed");
            return;
        }
        //route.url = 'none';
        // prevent this route showing in routes listing
        dest = '*' + dest;

        var route = new TCCroutes.Route('none', dest, descrip,dist, 0, owner, 0);
        var existing = TCCroutes.findDest(dest);
        if (existing === dest) {
            popup.Confirm("There is already a route with this destination.", "Do you want to use the same destination?", saveRoute(route), null, -10);
        }
        else {
            popup.Confirm("Save new route", "Are you sure?", saveRoute(route), null, -10);
        }

    });
    $("#setupDone").on('click', function () {
        $("#saveRoute").prop("disabled", true);

        if (login.Role < 1) {
            popup.Alert("You need to register for this");
            return;
        }
        var descrip = $("#route-descrip").val();
        var url = $("#route-url").val();
        var owner = login.ID();
        var dest = '';
        var route = new TCCroutes.Route(url, dest, descrip, 0, 0, owner, 0);

        if (myXML.length > 1000) {
            // user has complete data on PC
            route.url = myXML;
            route.dist = 0;
            popup.Confirm("Save new route", "Are you sure?", saveRoute(route), null, -10);
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
    $("#manual-cancelNewRoute").on('click', function () {

        $(".navbar-nav a[href=#home]").tab('show');

    });
    $("#cancelLeadRide").on('click', function () {

        $(".navbar-nav a[href=#home]").tab('show');

    });
 



    return newRoute;
}(jQuery));