
var TCCroutes = (function () {
    "use strict";
    var TCCroutes = {},

        //route data members
        //[DataMember(Name = "route")]//            public string GPX { get; set; }
        //[DataMember(Name = "dest")]//                 public string Dest { get; set; }
        //[DataMember(Name = "distance")]//             public string Descrip { get; set; }
        //[DataMember(Name = "description")]//          public int Distance { get; set; }
        //[DataMember(Name = "climbing")]//             public int Climbing { get; set; }
        /////[DataMember(Name = "owner")]//                public int Owner { get; set; }
        //[DataMember(Name = "id")]//                   public int ID{ get; set; }
        //[DataMember(Name = "owner")]//                public string Owner { get; set; }
       // [DataMember(Name = "hasGPX")]                public bool HasGPX {    get; set; }

        // list of routes downloaded from database
        routes = [],
        // list of routes currently displayed in chart etc
        displayedRoutes = [],

        // the latest one to be downloaded from web. Includes URL only, not full gpx
        currentRoute = null,

        // the latest full gpx text
        currentGPX = null,


        getWebRoutes = function (alsoGetRides) {
            rideData.myJson("GetRouteSummaries", "POST", null, function (response) {
                routes = response;
                if (routes.length === 0) {
                    qPopup.Alert("No data found!");
                    return null;
                }
                if (alsoGetRides) {
                    // get list of rides for next Sunday
                    // find next Sunday's date
                    var today = new Date();
                    today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    while (today.getDay() !== 0) {
                        today = bleTime.addDays(today, 1);
                    }
                    TCCrides.CreateRideList(today);
                    showRouteList();
                }
                return routes;
            }, true, null);

            return routes;
        },
        lastCompareABC = 1,
        lastCompare123 = 1,

        compareDest = function (a, b) {
            // Use toUpperCase() to ignore character casing
            const destA = a.dest.toUpperCase();
            const destB = b.dest.toUpperCase();

            var comparison = 0;
            if (destA > destB) {
                comparison = 1;
            } else if (destA < destB) {
                comparison = -1;
            }
            return comparison * lastCompareABC;
        },
        compareKm = function (a, b) {
            return (a.distance - b.distance) * lastCompare123;
        },

        sortabc = function () {
            console.log('sorting abc');
            routes.sort(compareDest);
            showRouteList();
            lastCompareABC = - lastCompareABC;
        },
        sort123 = function () {
            console.log('sorting 123');
            routes.sort(compareKm);
            showRouteList();
            lastCompare123 = - lastCompare123;
        },

        handleRouteEdit = function () {
            var descrip = $("#edit-route-descrip").val();
            var dest = $("#edit-route-dest").val();
            var dist = $("#edit-route-distance").val();


            if (dest.length < 2 || dist === '' || dist === 0) {
                qPopup.Alert("Destination and distance needed");
                return;
            }

            qPopup.Confirm("Save edited route", "Are you sure?", function () {
                currentRoute.dest = dest;
                currentRoute.description = descrip;
                currentRoute.distance = dist;
                rideData.myJson("EditRoute", "POST", currentRoute, function (response) {
                    if (response === 'OK') {
                        showRouteList();
                        $('#editRouteModal').modal('hide');
                    }
                    else {
                        qPopup.Alert(response);
                    }
                }, true, null);
            }, null, -10);
        },

        showRouteList = function () {
            $('#routelist').empty();  // this will also remove any handlers
            //$('#setuplist').empty();
            $.each(routes, function (index, route) {

                var distance = 0;
                var title = route.dest;
                if (route.distance !== undefined) {
                    distance = route.distance;
                }
                //if (title[0] === '*')
                //    // don't display 'ghost' routes with no GPX file
                //    return;
   
                var units = ' km ';
                if (login.Units() === 'm') {
                    units = ' m ';
                    distance = Math.round(distance * 0.62137);
                }


                var htmlstr = '<a id="sen' + index + '" class="list-group-item"><button id="get' + index
                    + '" type="button" class="btn btn-lifted btn-primary btn-sm" data-toggle="button tooltip" title="Author: ' + route.owner + '">' + title +
                    '</button><span style="color:red; font-weight: bold">  ' + distance + units + '</span> ' + route.description + '</a>';
                $('#routelist').append(htmlstr);


                $('#get' + index).click(function () {
                    currentRoute = route;

                    // get ready to load new map

                    //TCCroutes.SetGPX(null);
                    TCCMap.showRoute();
                    $('#planRide').hide();
                    $('#deleteRoute').hide();
                    $('#editRoute').hide();
                    if (login.loggedIn())
                        // allow user to plan a  ride from this route
                        $('#planRide').show();
                    var user = login.User();
                    if (route.owner === user && login.loggedIn()) {
                        $('#editRoute').show();
                        $('#deleteRoute').show();
                    }

                });

                index++;
            });

        };





    TCCroutes.Route = function (url,dest,descrip,dist,climb, owner,id) {
        this.url= url;       // URL of gpx file
        this.dest = dest;
        this.climbing = climb;
        this.distance= dist;
        this.description = descrip;
        this.id = id;
        this.owner = owner;
        this.hasGPX = url.length > 0;

    };


    TCCroutes.findRoute = function (id) {
        var found = $.grep(routes, function (e, i) {
            return e.id === id;
        });
        if (found.length > 0) {
            return found[0];
        }
        return null;
    };
    //TCCroutes.findIDFromDest = function (dest) {
    //    var found = $.grep(routes, function (e, i) {
    //        return e.dest === dest;
    //    });
    //    if (found.length > 0) {
    //        return found[0];
    //    }
    //    return null;
    //};
    TCCroutes.findDestFromID = function (id) {
        var found = $.grep(routes, function (e, i) {
            return e.id === id;
        });
        if (found.length > 0) {
            return found[0].dest;
        }
        return 'none';
    };
    TCCroutes.findDest = function (dest) {
        var found = $.grep(routes, function (e, i) {
            return e.dest === dest;
        });
        if (found.length > 0) {
            return dest;
        }
        return 'none';
    };
    TCCroutes.Add = function (route) {
        routes.push(route);
    };
    TCCroutes.currentRoute = function () {
        return currentRoute;
    };

    TCCroutes.SetRoute = function (route) {
        currentRoute = route;
    };

    TCCroutes.displayedRoutes = function () {
        return displayedRoutes;
    };

    TCCroutes.DisplayedRouteNames = function () {
        var index, nameStr='';
        for (index = 0; index < displayedRoutes.length; index++) {
            nameStr += displayedRoutes[index].Dest;
            nameStr += ', ';
        }
        nameStr = nameStr.slice(0, -2);
        return nameStr;
    };

    TCCroutes.ShowStartLocation = function () {
        // get default map which shows Lemon Quay

        currentRoute = TCCroutes.findRoute(71);
        currentRoute.dest = 'Truro CC rides start here';
        TCCMap.showRoute();
    };

    TCCroutes.CreateRouteList = function (alsoGetRides) {

        if (routes === undefined || routes.length === 0) {
            getWebRoutes(alsoGetRides);
            // showroutelist() will be called when ready
        }
        else {
            showRouteList();
        }
    };



    $('#planRide').click(function () {
        // move to different tab
        rideData.setCurrentTab('setup-tab');
        $('#setup-tab').tab('show');
        $('#uploadRoute').hide();
        $('#manualRoute').hide();
        TCCMap.showRoute();
        TCCrides.leadRide();
    });

    $('#deleteRoute').click(function () {
        var id = currentRoute.id;
        
        qPopup.Confirm("Delete this route", "Are you sure?", function () {
            rideData.myJson("DeleteRoute", "POST", id, function (response) {
                if (response === 'OK') {
                    qPopup.Alert("You have deleted this route");
                    routes = routes.filter(function (e) { return e.id !== id;});
                    TCCroutes.CreateRouteList(false);
                }
                else {
                    qPopup.Alert(response);
                }
            }, true, null);
        }, null, -10);
    });

    $('#editRouteModal').on('shown.bs.modal', function (e) {
        $("#edit-route-descrip").attr("value", currentRoute.description);
        $("#edit-route-dest").attr("value", currentRoute.dest);
        $("#edit-route-distance").attr("value", currentRoute.distance);

        if (currentRoute.hasGPX) {
            // cannot edit distance for routes wth GPX file
            $("#edit-route-distance").prop('disabled', true);
        }
        else {
            $("#edit-route-distance").prop('disabled', false);
        }
       // $("#form-editroute").on("submit", handleRouteEdit);  // strange bug if this is used!
        $("#edit-ok").on("click", handleRouteEdit);
        $("#edit-cancel").on('click', function () {
            $('#editRouteModal').modal('hide');
        });

    });
    $('#editRoute').click(function () {
        $('#editRouteModal').modal();
        
    });
    $("#btnSort123").click(sort123);
    $("#btnSortabc").click(sortabc);


    return TCCroutes;
}());
