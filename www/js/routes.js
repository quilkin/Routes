
var TCCroutes = (function () {
    "use strict";
    var TCCroutes = {},

        //route data members
        //[DataMember(Name = "route")]//            public string GPX { get; set; }
        //[DataMember(Name = "dest")]//                 public string Dest { get; set; }
        //[DataMember(Name = "distance")]//             public string Descrip { get; set; }
        //[DataMember(Name = "description")]//          public int Distance { get; set; }
        //[DataMember(Name = "climbing")]//             public int Climbing { get; set; }
        //[DataMember(Name = "owner")]//                public int Owner { get; set; }
        //[DataMember(Name = "id")]//                   public int ID{ get; set; }

        // list of routes downloaded from database
        routes = [],
        // list of routes currently displayed in chart etc
        displayedRoutes = [],

        // the latest one to be downloaded from web. Includes URL only, not full gpx
        currentRoute = null,

        // the latest full gpx text
        currentGPX = null,


        getWebRoutes = function () {
            rideData.myJson("GetRouteSummaries", "POST", null, function (response) {
                routes = response;
                if (routes.length === 0) {
                    popup.Alert("No data found!");
                    return null;
                }
                return routes;
            }, false, null);

            return routes;
        },
        lastCompareABC = 1,
        lastCompare123 = 1,

        compareDest = function(a, b) {
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
        showRouteList = function () {
            $('#routelist').empty();  // this will also remove any handlers
            //$('#setuplist').empty();
            $.each(routes, function (index, route) {

                var title = route.dest;
                if (title[0] === '*')
                    // don't display 'ghost' routes with no GPX file
                    return;
                if (route.distance === undefined || route.distance === 0) {
                    route.distance = '? ';
                }

                var htmlstr = '<a id="sen' + index + '" class="list-group-item">' + title +
                    '<span style="color:red; font-weight: bold">  ' + route.distance + 'km</span>' +
                    '<button id="get' + index + '" type="button" class="btn btn-lifted btn-info btn-sm pull-right" data-toggle="button" data-complete-text="Select">Show</button>' +
                    '</a>';
                $('#routelist').append(htmlstr);
                $('#planRide').hide();
                $('#deleteRoute').hide();

                $('#get' + index).click(function () {
                    currentRoute = route;

                    // get ready to load new map

                    TCCroutes.SetGPX(null);
                    TCCMap.showRoute();
                    if (login.loggedIn())
                        // allow user to plan a  ride from this route
                        $('#planRide').show();
                    var user = login.ID();
                    if (route.owner === user)
                        $('#deleteRoute').show();
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
    TCCroutes.currentGPX = function () {
        return currentGPX;
    };
    TCCroutes.SetRoute = function (route) {
        currentRoute = route;
    };
    TCCroutes.SetGPX = function (gpx) {
        currentGPX = gpx;
    };
    TCCroutes.displayedRoutes = function () {
        return displayedRoutes;
    };
    //TCCroutes.FoundRoutes = function () {
    //    return foundRoutes;
    //};
    //TCCroutes.ClearFoundRoutes = function () {
    //    while (foundRoutes.length > 0) { foundRoutes.pop(); }
    //};
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

        currentRoute = TCCroutes.findRoute(0);
        currentRoute.dest = 'Truro CC rides start here';
        TCCMap.showRoute();
    };

    TCCroutes.CreateRouteList = function () {
        //var id = login.ID();
        //if (id === undefined || id === 0) {
        //    $('#loginModal').modal();
        //    return;
        //}
        if (routes === undefined || routes.length === 0) {
            getWebRoutes();
        }
        showRouteList();
    };

    $('#planRide').click(function () {
        // move to different tab
        rideData.setCurrentTab('setup-tab');
        $('#setup-tab').tab('show');
        $('#uploadRoute').hide();
        TCCMap.showRoute();
        TCCrides.leadRide();
    });

    $('#deleteRoute').click(function () {
        var id = currentRoute.id;
        var dest = currentRoute.dest;

        popup.Confirm("Delete this route", "Are you sure?", function () {
            rideData.myJson("DeleteRoute", "POST", id, function (response) {
                if (response === 'OK') {
                    popup.Alert("You have deleted this route");
                    routes = routes.filter(function (e) { return e.id !== id;});
                    TCCroutes.CreateRouteList();
                }
                else {
                    popup.Alert(response);
                }
            }, true, null);
        }, null, -10);
    });

    $("#btnSort123").click(sort123);
    $("#btnSortabc").click(sortabc);


    return TCCroutes;
}());
