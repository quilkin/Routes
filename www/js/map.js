var TCCMap = (function ($) {

    "use strict";

    var TCCMap = {},
        map,
        chart,
        clearChart = function () {
            //   chart.validateData();
            if (chart !== undefined)
                chart.clear();
        },
        height = function (dist_t, height_t) {
            this.Distance = dist_t;
            this.Height = height_t;
        },
        drawProfile = function (elevid, elev_data) {

            chart = AmCharts.makeChart(elevid, {
                "type": "serial",
                "theme": "light",

                "dataProvider": elev_data,
                "valueAxes": [{
                    "gridColor": "#FFFFFF",
                    "gridAlpha": 0.2,
                    "title": "metres",
                    "maximum": 300,
                    "minimum": 0,
                    "dashLength": 0
                }],
                "gridAboveGraphs": true,
                "startDuration": 1,
                "graphs": [{
                    "balloonText": "[[category]]km<br><b>[[value]]m</b>",
                    "fillAlphas": 0.8,
                    "lineAlpha": 0.2,
                    "type": "line",
                    "valueField": "Height"
                }],
                "chartCursor": {
                    "categoryBalloonEnabled": false,
                    "cursorAlpha": 0,
                    "zoomable": false
                },
                "categoryField": "Distance",
                "categoryAxis": {
                    "gridPosition": "start",
                    "gridAlpha": 0,
                    "tickPosition": "start",
                    "tickLength": 20,
                    "precision": 0
                }
            });
        };





    TCCMap.showRoute = function () {
        var gpxdata = TCCroutes.currentGPX();
 //       if (gpxdata === null || gpxdata.length < 100) {    // always reload GPX or else it isn't shown properly for some reason
            rideData.getGPX();
 //       }

        gpxdata = TCCroutes.currentGPX();
        // }
        var tab = rideData.getCurrentTab();
        var mapid = "demo-map";
        var elevid = "demo-elev";
        var demo = document.getElementById('demo');
        if (tab === 'setup-tab') {
            mapid = "setup-map";
            elevid = "setup-elev";
            demo = document.getElementById('setup');
        }
        else if (tab === 'home-tab') {
            mapid = "home-map";
            elevid = "home-elev";
            demo = document.getElementById('home');
        }



        _t('h3').textContent = "please wait...";

        function _t(t) { return demo.getElementsByTagName(t)[0]; }
        function _c(c) { return demo.getElementsByClassName(c)[0]; }

        if (map !== undefined) { map.remove(); }
        map = L.map(mapid);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: 'Map data &copy; <a href="https://www.osm.org">OpenStreetMap</a>'
        }).addTo(map);

        //  var control = L.control.layers(null, null).addTo(map);

        new L.GPX(gpxdata, {
            async: true,
            marker_options: {
                startIconUrl: '',
                endIconUrl: '',
                shadowUrl: ''
            }
        }).on('loaded', function (e) {
            var gpx = e.target;
            var elev_data;
            var bounds = gpx.getBounds();
            map.fitBounds(bounds);

            var name = TCCroutes.currentRoute().dest;
            _t('h3').textContent = name + ":  ";

            var distance = (gpx.get_distance() / 1000).toFixed(0);
            var elev_gain = gpx.get_elevation_gain().toFixed(0);
            var elev_loss = gpx.get_elevation_loss().toFixed(0);

            var route = TCCroutes.currentRoute();
            if (route.distance === null || route.distance === 0 || route.distance.includes('?')) {
                route.distance = distance;
                rideData.myJson("UpdateRoute", "POST", route, function (response) {
                    var reply = response;

                }, false, null);
            }
            if (tab !== 'setup-tab' && route.id > 0) {
                // add a download link
                var a = document.createElement('a');
                var linkText = document.createTextNode("Get GPX");
                a.style.textDecoration = "underline";
                a.appendChild(linkText);
                a.title = "Get this into your PC's download folder so you can load into Garmin etc";
                a.href = 'data:text/csv;base64,' + btoa(gpxdata);
                a.download = name + '.gpx';
                _t('h3').appendChild(a);


                _c('distance').textContent = distance;
                _c('elevation-gain').textContent = elev_gain;
                _c('elevation-loss').textContent = elev_loss;

                if (gpx.get_elevation_gain() > 0 && gpx.get_elevation_loss() > 0) {
                    elev_data = gpx.get_elevation_data();
                    // convert array to json for profile graph
                    var i, n = elev_data.length;
                    var json_elev = new Array();
                    for (i = 0; i < n; i++) {
                        json_elev.push(new height(elev_data[i][0].toFixed(1), elev_data[i][1].toFixed(0)));

                    }
                    _c('elevation-none').textContent = "";
                    drawProfile(elevid, json_elev);
                }
                else {
                    clearChart();
                    _c('elevation-none').textContent = " : No elevation data in this route";

                }
            }

        }).addTo(map);
    };


    

    return TCCMap;
}(jQuery));