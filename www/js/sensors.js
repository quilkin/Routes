
var TCCroutes = (function () {
    "use strict";

    var TCCroutes = {},

        // list of routes downloaded from database
        routes = [],
        // list of routes currently displayed in chart etc
        displayedRoutes = [],

        // the latest one to be downloaded from web. Includes URL only, not full gpx
        currentRoute = null,
        // the latest full gpx text
        currentGPX = null;

    // local functions
    function getWebRoutes(userID) {
        bleData.myJson("GetRouteSummaries", "POST", userID, function (response) {
            routes = response;
            if (routes.length === 0) {
                popup.Alert("No data found!");
                return null;
            }
            return routes;
        }, false, null);

        return routes;
    }

    //route data members
//[DataMember(Name = "route")]//            public string GPX { get; set; }
//[DataMember(Name = "dest")]//                 public string Dest { get; set; }
//[DataMember(Name = "distance")]//             public string Descrip { get; set; }
//[DataMember(Name = "description")]//          public int Distance { get; set; }
//[DataMember(Name = "climbing")]//             public int Climbing { get; set; }
//[DataMember(Name = "owner")]//                public int Owner { get; set; }
//[DataMember(Name = "id")]//                   public int ID{ get; set; }


//  public Route(string gpx, string dest, string descrip, int d, int climb, int ow, string place, DateTime date, DateTime time)

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
        var found = $.grep(foundRoutes, function (e, i) {
            return e.id === id;
        });
        if (found.length > 0) {
            return found[0];
        }

        return null;

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
    TCCroutes.FoundRoutes = function () {
        return foundRoutes;
    };
    TCCroutes.ClearFoundRoutes = function () {
        while (foundRoutes.length > 0) { foundRoutes.pop(); }
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

    TCCroutes.isDisplayed = function (route) {
        var index = $.inArray(route, displayedRoutes);
        if (index < 0) { return false; }
        return true;
    };
    TCCroutes.DisplayRoute = function (route, yes) {
        var index, howmany = displayedRoutes.length;
        for (index = 0; index < howmany; index++){
            if (displayedRoutes[index].ID === route.ID)
                break;
        }
        if (index < howmany) {
            // it was found
            if (yes) {
    //            already there, do nothing
            }
            else {
                // remove it
                displayedRoutes.splice(index, 1);
     //           route.index = -1;
            }
        }
        else {
        // not already in list
            if (yes) {
                displayedRoutes.push(route);
   //             route.index = $.inArray(route, displayedRoutes);
            }
            else {
  //              route.index = -1;
            }
        }
        // must re-arrange into ID order so that SQL query wiil return corresponding data
        displayedRoutes.sort(function (a, b) { return a.ID - b.ID; });
        if (yes) { currentRoute = route; }
    };

    TCCroutes.CreateRouteList = function () {
        var id = login.ID();
        if (id === undefined || id === 0) {
            $('#loginModal').modal();
            return;
        }
        if (routes === undefined || routes.length === 0) {
            getWebRoutes(id);
        }
        $('#routelist').empty();  // this will also remove any handlers
        $('#setuplist').empty();
        $.each(routes, function (index, route) {
            var title = route.dest;
            if (route.dist !== undefined) {
                title = title + '(' + route.dist + 'km)';
            }
            while (title.length < 20) title = title + ' ';
            title = title + '.';
            var htmlstr = '<a id="sen' + index + '" class="list-group-item">' + title +
                '<button id="get' + index + '" type="button" class="btn btn-lifted btn-info btn-sm pull-right" data-toggle="button" data-complete-text="Select">Select</button>' +
                '</a>';
            $('#routelist').append(htmlstr);
            if (TCCroutes.isDisplayed(route)) {
                // for re-showing list when routes have previously been displayed (list will be emptied for small screens)
                $('#get' + index).button('complete');
            }
            $('#get' +index).click(function () {
                if (TCCroutes.isDisplayed(route)) {
                    $(this).button('reset');
                    TCCroutes.DisplayRoute(route, false);
                }
                else {
                    $(this).button('complete');
                    TCCroutes.DisplayRoute(route,true);
                }

                bleData.showRoute();
            });

            index++;
        });

    };



    return TCCroutes;
}());
