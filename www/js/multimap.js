var MultiMap = (function ($) {

    "use strict";

    var MultiMap = {},
        // list of routes downloaded from database
        routes = [],
        numOfRoutes=1,
        map,

    routeColour = function (index) {
        // This function generates vibrant, "evenly spaced" colours (i.e. no clustering). This is ideal for creating easily distinguishable vibrant markers in Google Maps and other apps.
        // Adam Cole, 2011-Sept-14
        // https://stackoverflow.com/questions/1484506/random-color-generator
        
        var r, g, b;
        var h = index / numOfRoutes;
        var i = ~~(h * 6);
        var f = h * 6 - i;
        var q = 1 - f;
        switch (i % 6) {
            case 0: r = 1; g = f; b = 0; break;
            case 1: r = q; g = 1; b = 0; break;
            case 2: r = 0; g = 1; b = f; break;
            case 3: r = 0; g = q; b = 1; break;
            case 4: r = f; g = 0; b = 1; break;
            case 5: r = 1; g = 0; b = q; break;
        }
        //var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
        var c = "#" + ("00" + (~ ~(r * 200)).toString(16)).slice(-2) + ("00" + (~ ~(g * 200)).toString(16)).slice(-2) + ("00" + (~ ~(b * 200)).toString(16)).slice(-2);

        return c;
    },

    showRoute = function (index,route) {
       
   
        //var map_pane = document.getElementById('routes');
        var popup;

        $("#routes-elev").hide();
        $('.info').hide();
        $("#mapTitle2").html("Point to a route to show details");
        //$("#getGPX1").hide();
        //$("#getGPX2").hide();
        $("#leadRide").hide();

        //function _t(t) { return map_pane.getElementsByTagName(t)[0]; }
        //function _c(c) { return map_pane.getElementsByClassName(c)[0]; }


        new L.GPX(route.url, {
            async: true,
            polyline_options: {
                color: routeColour(index),
                opacity: 0.6,
                weight: 3
            },
            marker_options: {
                startIconUrl: '',
                endIconUrl: '',
                shadowUrl: ''
            }
        }).on('addline', function (e) {
           // console.log(e.line);
            e.line.on('mouseover', function (e) {
                var layer = e.target;
                layer.setStyle({
                    opacity: 1,
                    weight: 5
                });
                popup = L.popup(
                    {
                        className: 'custompopup2',
                        closeButton: false
                    }
                )
                    .setLatLng(e.latlng)
                    .setContent(route.dest + ": " + route.distance + " km<p></p>Click to display")
                    .openOn(map);
            });
            e.line.on('mouseout', function (e) {
                var layer = e.target;
                layer.setStyle({
                    opacity: 0.6,
                    weight: 3
                });
                popup.remove();
            });
            e.line.on('click', function (e) {
                $("#routes-elev").show();
                $('.info').show();
                TCCroutes.SetRoute(route);
                TCCMap.showRouteStage2(route.url, true);
            });

        }).on('loaded', function (e) {

        }).addTo(map);
    },

    showRoutes = function (routes) {
        $.each(routes, function (index, route) {
            showRoute(index, route);
        });
        var bounds = [[50.1, -5.4], [50.3, - 4.8]];  // most of Cornwall
        map.fitBounds(bounds);
    };

    MultiMap.showRoutes = function () {
        var mapid = "routes-map";
        document.getElementById(mapid).innerHTML = "<div id='map' style='width: 100%; height: 100%;'></div>";
       
        if (map !== undefined) { map.remove(); }
        map = L.map('map');
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data &copy; <a href="https://www.osm.org">OpenStreetMap</a>'
        }).addTo(map);

        if (routes.length === 0) {
            $(document).ajaxStart($.blockUI({ message: '<h4><img src="images/page-loader.gif" />wait...</h4>' })).ajaxStop($.unblockUI);

            rideData.myAjax("GetRoutesAll", "POST", null, function (response) {
                routes = response;
                numOfRoutes = routes.length;
                showRoutes(routes);
                return routes;
            });
        }
        else {
            showRoutes(routes);
        }

    };


    return MultiMap;
}(jQuery));