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
        var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) + ("00" + (~ ~(g * 255)).toString(16)).slice(-2) + ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
        return c;
    },

    showRoute = function (index,route) {
        
        //var tab = rideData.getCurrentTab();
    
    
        var map_pane = document.getElementById('routes');
        //if (tab === 'setup-tab') {
        //    mapid = "setup-map";
        //    map_pane = document.getElementById('setup');
        //}
        //else if (tab === 'rides-tab') {
        //    mapid = "rides-map";
        //    map_pane = document.getElementById('rides');
        //}
        //if (gpxdata === null || gpxdata === 'none' || gpxdata.length < 100) {
        //    $("#" + mapid).hide();
        //    _t('h4').textContent = TCCroutes.currentRoute().dest + ": No route map provided";
        //    $('.info').hide();
        //    return;
        //}
        //else {
        //    $("#" + mapid).show();
        //    $('.info').show();

        //}

        $("#routes-elev").hide();
        $('.info').hide();
        _t('h4').textContent = "Point to a route to show details";

        function _t(t) { return map_pane.getElementsByTagName(t)[0]; }
        function _c(c) { return map_pane.getElementsByClassName(c)[0]; }


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
            console.log(e.line);
            e.line.on('mouseover', function (e) {
                var layer = e.target;
                layer.setStyle({
                    opacity: 1,
                    weight: 5
                });
                var popup = L.popup()
                    .setLatLng(e.latlng)
                    .setContent(route.dest + ": " + route.distance + " km")
                    .openOn(map);
            });
            e.line.on('mouseout', function (e) {
                var layer = e.target;
                layer.setStyle({
                    opacity: 0.6,
                    weight: 3
                });
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