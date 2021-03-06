﻿/*global jQuery,TCCroutes,rideData*/

var newRoute = (function ($) {

    "use strict";

    var newRoute = {},
        temproute,
        saveRoute = function () {
            rideData.myAjax("SaveRoute", "POST", temproute, function (response) {
                // if successful, response should be just a new ID
                if (response.length < 5) {
                    temproute.id =  parseInt(response);
                    TCCroutes.SetRoute(temproute);
                    TCCroutes.Add(temproute);
                    if (temproute.hasGPX === false) {
                        $('#uploadRoute').hide();
                        $('#manualRoute').hide();
                        $('#existingRoute').hide();
                        TCCrides.leadRide();
                    }
                    else {
                        TCCMap.showRoute();
                        TCCroutes.CreateRouteList(false);
                        $('#uploadRoute').hide();
                        $('#manualRoute').hide();
                        $('#existingRoute').hide();
                        qPopup.Alert("Route uploaded. You (or others) can now create ride(s) based on this route");
                        TCCrides.leadRide();
                    }
                }
                else {
                    if (response.includes("XML parse error"))
                        qPopup.Alert("Error: please ensure that this is a GPX file");
                    else
                        qPopup.Alert(response);
                }

            });

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
                qPopup.Alert("Invalid route file");
            }
            else {
                //   qPopup.Alert("Route file OK");
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
    $('#existingRoute').show();
    $("#manual-setupDone").show();

    $('#convertToRide').hide();

    document.getElementById('route-file').onchange = function (e) {
        var file = e.srcElement.files[0];
        if (file.name.length > 25) {
            // don't know why this occurs, and don't know max length. just guessing, I know 53 is too long!
            qPopup.Alert("Filename too long, please shorten to less than 25 and try again");
            return;
        }

        readFile(file);
    };

    myXML = "";
    $("#manual-setupDone").on('click', function () {
        $("#saveRoute").prop("disabled", true);

        if (login.Role < 1) {
            qPopup.Alert("You need to register for this");
            return;
        }
       
        var dest = $("#manual-route-dest").val();
        var dist = $("#route-distance").val();
        if (dist === '') dist = 0;
        dist = Number(dist);
        var owner = login.User();

        if (dest.length < 2 || dist === '' || dist === 0) {
            qPopup.Alert("Destination and distance needed");
            return;
        }

        // prevent this route showing in routes listing
       // dest = '*' + dest;

        temproute = new TCCroutes.Route('', dest, '',dist, 0, owner, 0);
        var existing = TCCroutes.findDest(dest);
        if (existing === dest) {
            qPopup.Confirm("There is already a route with this destination.", "Do you want to use the same destination?", saveRoute, null, -10);
        }
        else {
            qPopup.Confirm("Save new route", "Are you sure?", saveRoute, null, -10);
        }

    });
    $("#setupDone").on('click', function () {
        $("#saveRoute").prop("disabled", true);

        if (login.Role < 1) {
            qPopup.Alert("You need to register for this");
            return;
        }
        var dest = $("#route-dest").val();
        var url = $("#route-url").val();
        var owner = login.User();

        temproute = new TCCroutes.Route(url, dest, '', 0, 0, owner, 0);

        if (myXML.length > 1000) {
            // user has complete data on PC
            temproute.url = myXML;
            temproute.dist = 0;
            temproute.hasGPX = true;
            qPopup.Confirm("Save new route", "Are you sure?", saveRoute, null, -10);
        }
        else if (validURL(url)) {
            temproute.url = url;
            temproute.hasGPX = true;
            qPopup.Confirm("Save new route", "Are you sure?", saveRoute, null, -10);
        }
        else {
            qPopup.Alert("Invalid URL, sorry!");
        }

    });
    
    $("#cancelNewRoute").on('click', function () {
   
    //    $(".navbar-nav a[href=#rides-tab]").tab('show');
        $('#rides-tab').tab('show');
        rideData.setCurrentTab('rides-tab');

    });
    $("#manual-cancelNewRoute").on('click', function () {

    //    $(".navbar-nav a[href=#rides-tab]").tab('show');
        $('#rides-tab').tab('show');
        rideData.setCurrentTab('rides-tab');

    });
    $("#cancelLeadRide").on('click', function () {

 //       $(".navbar-nav a[href=#rides-tab]").tab('show');
        $('#convertToRide').hide();
        $('#rides-tab').tab('show');
        rideData.setCurrentTab('rides-tab');
    });
 



    return newRoute;
}(jQuery));