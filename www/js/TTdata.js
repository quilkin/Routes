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
                // date has been chosen, get it and close options
                rideDate = new Date($("#rideDate").val());
                $('#fromDate').hide();
                //$('#toDate').hide();
                bleData.setDateChooser('View other dates');
                TCCrides.Clear();
                TCCrides.CreateRideList(rideDate);
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
            //$('#toDate').show();



            bleData.setDateChooser('OK');
        },
       

        urlBase = function () {
            if (bleApp.isMobile()) {
                return "http://www.quilkin.co.uk/routes.svc/";
                //return "http://192.168.1.73:54684/Service1.svc/";
            }
           //return "/Routes.svc/";
            return "http://localhost:54684/Routes.svc/";

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

    bleData.CreateLists = function () {
        // get list of all routes in db
        TCCroutes.CreateRouteList();

        // get list of rides for next Sunday
        // find next Sunday's date
        var today = new Date();
        today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        while (today.getDay() !== 0) {
            today = bleTime.addDays(today, 1);
        }
        TCCrides.CreateRideList(today);
    };
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

    bleData.getGPX = function () {
        var currentroute = TCCroutes.currentRoute();
        if (currentroute === null) {
            popup.Alert("No GPX data found!");
            return null;
        }
        var routeID = currentroute.id;
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

            var name = TCCroutes.currentRoute().dest;
            _t('h3').textContent = name + ":  ";

            var distance = (gpx.get_distance() / 1000).toFixed(0);
            var elev_gain = gpx.get_elevation_gain().toFixed(0);
            var elev_loss = gpx.get_elevation_loss().toFixed(0);

            var route = TCCroutes.currentRoute();
            if (route.distance === null || route.distance === 0) {
                route.distance = distance;
                bleData.myJson("UpdateRoute", "POST", route, function (response) {
                    var reply = response;

                }, false, null);
            }
            if (tab !== 'setup-tab') {
                // add a download link
                var a = document.createElement('a');
                var linkText = document.createTextNode("Get GPX");
                //a.style.fontStyle = "italic";
                a.style.textDecoration = "underline";
                a.appendChild(linkText);
                a.title = "get GPX";
                a.href = 'data:text/csv;base64,' + btoa(gpxdata);
                a.download = name + '.gpx';
                _t('h3').appendChild(a);
           

                _c('distance').textContent = distance;
                _c('elevation-gain').textContent = elev_gain;
                _c('elevation-loss').textContent = elev_loss;
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

    bleData.leadRide = function () {
        $('#convertToRide').show();
        $('#route-url-label').hide();
        $('#route-url').hide();
        //$('#routeTitle').html('Destination (with unique name); Description e.g. easy,middle, hard');
        $("#rideDate1").datepicker({ todayBtn: false, autoclose: true, format: "dd M yyyy" });
        $("#rideDate1").datepicker('setDate', rideDate);

        $("#rideDate1").change(function () {
            rideDate = new Date($("#rideDate1").val());
        });
        $("#saveRide").on('click', function () {
            var startPlace = $("#rideMeeting").text();
            var route = TCCroutes.currentRoute();
            var leader = login.User();
            var time = 8 * 60 + 15;
            var dest = route.dest;
            var date = bleTime.toIntDays(rideDate);
            var ride = new TCCrides.Ride(dest, leader, date, time, startPlace, 0);
            popup.Confirm("Save this ride", "Are you sure?", function () {
                bleData.myJson("SaveRide", "POST", ride, function (response) {
                    // if successful, response should be just a new ID
                    if (response.length < 5) {
                        ride.id = response;
                        TCCroutes.SetRoute(route);
                        TCCrides.Add(ride);
                        $('#home-tab').tab('show');
                        bleData.setCurrentTab('home-tab');
                        bleData.setDate(rideDate);
                        bleData.setDateChooser('View other dates');
                        TCCrides.CreateRideList(rideDate);
                    }
                    else {
                        popup.Alert(response);
                    }

                }, true, null);
            }, null, -10);
        });
    };

    bleData.saveParticipant = function (rideID, rider) {
        var list = "";
        popup.Confirm("Join this ride", "Are you sure?", function () {
            var pp = new TCCrides.Participant(rider, rideID);
            bleData.myJson("SaveParticipant", "POST", pp, function (response) {
                if (response[0] === '*') {
                    // a list of riders entered
                    list = response.substr(1);
                    popup.Alert("You have been added to this ride");
                    TCCrides.CreateRideList(null);
                }
                else {
                    popup.Alert(response);
                }
            }, true, null);
        }, null, -10);
        return list;
    };
    bleData.leaveParticipant = function (rideID, rider) {
        popup.Confirm("Leave this ride", "Are you sure?", function () {
            var pp = new TCCrides.Participant(rider, rideID);
            bleData.myJson("LeaveParticipant", "POST", pp, function (response) {
                if (response === 'OK') {
                    popup.Alert("You have left this ride");
                    // recursively create a new list
                    TCCrides.CreateRideList(null);
                }
                else {
                    popup.Alert(response);
                }
            }, true, null);
        }, null, -10);
    };
    bleData.deleteRide = function (rideID) {
        popup.Confirm("Delete this ride", "Are you sure?", function () {
            bleData.myJson("DeleteRide", "POST", rideID, function (response) {
                if (response === 'OK') {
                    popup.Alert("You have deleted this ride");
                    // recursively create a new list
                    TCCrides.CreateRideList(null);
                }
                else {
                    popup.Alert(response);
                }
            }, true, null);
        }, null, -10);
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



