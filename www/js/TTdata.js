/*global bleTime,TCCroutes,bleTable,jQuery*/

var bleData = (function ($) {

    "use strict";

    var bleData = {},
        // recent values stored temporarily before adding timestamps
        tempValues1 = [],

        // values downloaded from database for displaying
        dispValues = [],
        // part of the data from device which was stored in RAM rather than flash
        ramValues = [],
        // keeping track up async uplaod process
        uploadsDone = [],
        // start & end of currently displayed data
        rideDate,
        map,
        chart,
        currentTab,

        // button to be reset when json interaction is complete
        $jsonBtn,

        chooseDates = function (sensor) {
            if ($('#fromDate').is(":visible")) {
                // dates have been chosen, get them and close options
                rideDate = new Date($("#rideDate").val());
                $('#fromDate').hide();
                $('#toDate').hide();
                bleData.setDateChooser('Change');
                // in case dates have been changed....
                bleData.showRoute();
                return;
            }

            $("#rideDate").datepicker({ todayBtn: true, autoclose: true, format: "dd M yyyy" });
            $("#rideDate").datepicker('setDate', rideDate);

            $("#rideDate").change(function () {
                rideDate = new Date($("#rideDate").val());
            });

            //$("#chooseSensor").html(sensor.Name + ' <span class="caret"></span>');
            $("#chartName").html(sensor.Name);
            //$("#tableName").html("Preparing table.....");
            $('#fromDate').show();
            $('#toDate').show();



            bleData.setDateChooser('OK');
        },
       

        urlBase = function () {
            if (bleApp.isMobile()) {
                return "http://www.quilkin.co.uk/Service1.svc/";
                //return "http://192.168.1.73:54684/Service1.svc/";
            }

            // return "http://www.quilkin.co.uk/Service1.svc/";
            return "http://localhost/routes/Service1.svc/";

        },
        webRequestFailed = function (handle, status, error) {
            var responseText = handle.responseText;
            //   popup.Alert("Error with web request: " + error);
            popup.Alert("Error with web request: " + responseText);
            if ($jsonBtn !== null) {
                $jsonBtn.button('reset');
            }

        },
        webRequestSuccess = function (success, res) {
            success(res);
            if ($jsonBtn !== null) {
                $jsonBtn.button('reset');
            }

        };


    $("#dateTitle").on('click', chooseDates);


    // global functions

    ////var dataTime = new Date;
    //bleData.Logdata = function (ID, time, value) {
    //    // short names to keep json.stringify small
    //    this.S = ID;
    //    this.T = time;
    //    // just a  single value in the array for uploading
    //    this.V = [value];
    //};

    //bleData.requestRecords = function (idlist, from, to) {
    //    this.IDlist= idlist;
    //    this.From = from;
    //    this.To = to;
    //};


    //bleData.ClearData = function (address) {
    //    var values, sensor = TCCroutes.findSensor(address);
    //    if (sensor !== null && sensor !== undefined) {
    //        values = sensor.NewValues;
    //        if (values !== null && values !== undefined) {
    //            while (values.length > 0) { values.pop(); }
    //        }
    //    }
    //    while (tempValues1.length > 0) { tempValues1.pop(); }
    //    while (ramValues.length > 0) { ramValues.pop(); }
    //    while (dispValues.length > 0) { dispValues.pop(); }
    //};

    bleData.setDate = function (start) {
        rideDate = start;
    };
    bleData.height = function (dist_t, height_t) {
        this.Distance = dist_t;
        this.Height = height_t;
    };

    bleData.setCurrentTab = function (tab) {
        currentTab = tab;
    };
    bleData.getCurrentTab = function () {
        return currentTab;
    };
    bleData.clearChart = function () {
        //   chart.validateData();
        if (chart !== undefined)
            chart.clear();
    };
    bleData.drawProfile = function (elevid, elev_data) {

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

    bleData.getGPX= function () {
        var routeID = TCCroutes.currentRoute().id;
        var gpxdata = null;

        bleData.myJson("GetGPXforRoute", "POST", routeID, function (response) {
            gpxdata = response;
            if (gpxdata.length === 0) {
                popup.Alert("No GPX data found!");
                return null;
            }
            TCCroutes.SetGPX(gpxdata);
        }, false, null);
    }; 
  
    bleData.showRoute = function () {
        var gpxdata = TCCroutes.currentGPX();
        if (gpxdata === null || gpxdata.length < 100) {
            bleData.getGPX();
            gpxdata = TCCroutes.currentGPX();
        }
        var tab = currentTab;
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
            //     control.addOverlay(gpx, gpx.get_name());

            //_t('h3').textContent = gpx.get_name() + "  ";
            _t('h3').textContent = TCCroutes.currentRoute().dest + "  ";

            if (tab !== 'setup-tab') {
                // add a download link
                var a = document.createElement('a');
                var linkText = document.createTextNode("(get GPX)");
                a.style.fontStyle = "italic";
                a.appendChild(linkText);
                a.title = "download GPX";
                a.href = gpxdata;
                _t('h3').appendChild(a);
           

                _c('distance').textContent = (gpx.get_distance() / 1000).toFixed(1);
                _c('elevation-gain').textContent = gpx.get_elevation_gain().toFixed(0);
                _c('elevation-loss').textContent = gpx.get_elevation_loss().toFixed(0);
                //_c('elevation-net').textContent = (gpx.get_elevation_gain() - gpx.get_elevation_loss()).toFixed(0);

                //drawProfile1("demo-elev", elev_data);
                if (gpx.get_elevation_gain() > 0 && gpx.get_elevation_loss() > 0) {
                    elev_data = gpx.get_elevation_data();
                    // convert array to json for profile graph
                    var i, n = elev_data.length;
                    var json_elev = new Array();
                    for (i = 0; i < n; i++) {
                        json_elev.push(new bleData.height(elev_data[i][0].toFixed(1), elev_data[i][1].toFixed(0)));

                    }
                    _c('elevation-none').textContent = "";
                    bleData.drawProfile(elevid, json_elev);
                }
                else {
                    bleData.clearChart();
                    _c('elevation-none').textContent = " : No elevation data in this route";

                    }
            }

        }).addTo(map);
    };

    bleData.CreateRide = function (rideDate, startPlace) {
        var route = TCCRoutes.currentRoute();
        var leader = login.ID();
        var time = "08:15";
        var dest = route.dest;

    };

    bleData.showData = function () {
        getWebData(null);
        // if it's a narrow screen (i.e. mobile phone), collapse the sensor list and date chooser to make it easier to see the graph
        if ($('#btnMenu').is(":visible")) {
            $('#routelist').empty();
            var htmlstr = '<a id="routeTitle" class="list-group-item list-group-item-info">Choose sensor(s)</a>';
            $('#routelist').append(htmlstr);
            $('#routeTitle').click(TCCroutes.CreateSensorList);
            $('#fromDate').hide();
            $('#toDate').hide();
            bleData.setDateChooser('Change');
        }
    };


    bleData.setDateChooser = function (btntext) {
        $('#dateTitle').html(bleTime.dateString(rideDate) +  '<span id="btnGo" role="button" class="btn btn-lifted  btn-info btn-sm pull-right">' + btntext + '</span>');
    };
          
    bleData.myJson = function (url, type, data, successfunc, async, $btn) {
        var dataJson = JSON.stringify(data),
            thisurl = urlBase() + url;

        $jsonBtn = $btn;

        $.ajax({
            type: type,
            data: dataJson,
            url: thisurl,
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            async: async,
            success: function (response) { webRequestSuccess(successfunc, response); },
            error: webRequestFailed

        });
    };


    return bleData;
}(jQuery));



