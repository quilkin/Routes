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
        startDate,
        endDate,
        map,
        chart,
    // button to be reset when json interaction is complete
        $jsonBtn,
            
        chooseDates = function (sensor) {
            if ($('#fromDate').is(":visible")) {
                // dates have been chosen, get them and close options
                startDate = new Date($("#startDate").val());
                endDate = new Date($("#endDate").val());
                $('#fromDate').hide();
                $('#toDate').hide();
                bleData.setDateChooser('Change');
                // in case dates have been changed....
                bleData.showRoute();
                return;
            }

            $("#startDate").datepicker({ todayBtn: true, autoclose: true, format: "dd M yyyy" });
            $("#endDate").datepicker({ todayBtn: true, autoclose: true, format: "dd M yyyy" });
            $("#startDate").datepicker('setDate', startDate);
            $("#endDate").datepicker('setDate', endDate);
            $("#startDate").change(function () {
                startDate = new Date($("#startDate").val());
            });
            $("#endDate").change(function () {
                endDate = new Date($("#endDate").val());
            });
            $("#chooseSensor").html(sensor.Name + ' <span class="caret"></span>');
            $("#chartName").html(sensor.Name);
            //$("#tableName").html("Preparing table.....");
            $('#fromDate').show();
            $('#toDate').show();
            bleData.setDateChooser('OK');
        },
         // upload any sensors that have had data extracted
        upload = function (sensorIndex) {

            var sensor, size, address,
            // need to split into smaller chunks for sending
                values1a = [],
                values1b = [],
                values1c = [],
                index, newindex,
                len, overlaps, saved,
                sensors2upload = TCCroutes.FoundSensors();
            

            overlaps = 0;
            saved = 0;
            if (sensorIndex === 0) {
                // clear out any previously done upload results
                while (uploadsDone.length > 0) { uploadsDone.pop(); }
            }

            if (sensorIndex >= sensors2upload.length) {
                // all done, report results and quit
                $.each(uploadsDone, function (index, upload) {
                    popup.Alert(upload[0] + ": " + upload[1] + " new records uploaded OK (" + upload[2] + " records already stored)");
                });
                return;
            }
            sensor = sensors2upload[sensorIndex];
            size = sensor.NewValues.length;
            if (size < 5) {
                // not enough to bother with....
                upload(sensorIndex + 1);
                return;
            }

            address = sensor.Serial;
        
            // add  a serial number to first & last records. No need to add to every record, takes too much time/size for upload
 
            for (index = 0; index < size / 3; index++) {
                values1a[index] = sensor.NewValues[index];
            }

            len = values1a.length;
            if (len > 0) {
                values1a[0].S = address;
            }
            if (len > 2) {
                values1a[len - 1].S = address;
            }

            newindex = 0;
            for (index; index < size * 2 / 3; index++) {
                values1b[newindex++] = sensor.NewValues[index];
            }
            len = values1b.length;
            if (len > 0) {
                values1b[0].S = address;
            }
            if (len > 2) {
                values1b[len - 1].S = address;
            }

            newindex = 0;
            for (index; index < size; index++) {
                values1c[newindex++] = sensor.NewValues[index];
            }
            len = values1c.length;
            if (len > 0) {
                values1c[0].S = address;
            }
            if (len > 2) {
                values1c[len - 1].S = address;
            }


            bleData.myJson("SaveLogdata", "POST", values1a, function (response) {
                overlaps += response.Overlaps;
                saved += response.Saved;
                bleData.myJson("SaveLogdata", "POST", values1b, function (response) {
                    overlaps += response.Overlaps;
                    saved += response.Saved;
                    bleData.myJson("SaveLogdata", "POST", values1c, function (response) {
                        overlaps += response.Overlaps;
                        saved += response.Saved;
                        uploadsDone.push([sensor.Serial, saved, overlaps]);
                        // now upload next sensor recursively
                        upload(sensorIndex + 1);
                    }, true, null);
                }, true, null);
            }, true, null);
  
        },
  
    urlBase = function() {
        if (bleApp.isMobile()) {
            return "http://www.quilkin.co.uk/Service1.svc/";
            //return "http://192.168.1.73:54684/Service1.svc/";
        }

         // return "http://www.quilkin.co.uk/Service1.svc/";
        return "http://localhost/routes/Service1.svc/";

    },
    webRequestFailed = function(handle, status, error) {
        popup.Alert("Error with web request: " + error);
        if ($jsonBtn !== null) {
            $jsonBtn.button('reset');
        }

    },
    webRequestSuccess = function(success, res) {
        success(res);
        if ($jsonBtn !== null) {
            $jsonBtn.button('reset');
        }

    },

    getWebData = function($btn) {

        if (TCCroutes.displayedRoutes().length === 0) {
            popup.Alert("Please choose a sensor");
            //$btn.button('reset');
            return;
        }
        var query,
            when1 = startDate,
            // get data until *end of* selected date
            when2 = bleTime.addDays(endDate, 1);

        query = new bleData.requestRecords(TCCroutes.DisplayedSensorIDs(), Math.round(when1.valueOf() / 60000), Math.round(when2.valueOf() / 60000));
        bleData.myJson("GetLogdata", "POST", query, function (response) {
            if (response.length === 0) {
                popup.Alert("No data found!");
                return;
            }
            //var index = TCCroutes.currentRoute().index;
            dispValues = response;
            TCCroutes.currentRoute().downloaded = true;
            bleData.CreateChart('dbChart');

        }, true, $btn);
    }

    $("#dateTitle").on('click', chooseDates);


    // global functions

    //var dataTime = new Date;
    bleData.Logdata = function (ID, time, value) {
        // short names to keep json.stringify small
        this.S = ID;
        this.T = time;
        // just a  single value in the array for uploading
        this.V = [value];
    };

    bleData.requestRecords = function (idlist, from, to) {
        this.IDlist= idlist;
        this.From = from;
        this.To = to;
    };

    bleData.ClearData = function (address) {
        var values, sensor = TCCroutes.findSensor(address);
        if (sensor !== null && sensor !== undefined) {
            values = sensor.NewValues;
            if (values !== null && values !== undefined) {
                while (values.length > 0) { values.pop(); }
            }
        }
        while (tempValues1.length > 0) { tempValues1.pop(); }
        while (ramValues.length > 0) { ramValues.pop(); }
        while (dispValues.length > 0) { dispValues.pop(); }
    };

    bleData.setDates = function (start, end) {
        startDate = start;
        endDate = end;
    };
    bleData.height = function (dist_t, height_t) {
        this.Distance = dist_t;
        this.Height = height_t;
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


    bleData.showRoute = function () {
        var mapid = "demo-map";
        var elevid = "demo-elev";
        var demo = document.getElementById('demo');
        var routeID = TCCroutes.currentRoute().id;
        var gpxdata = null;

        bleData.myJson("GetGPXforRoute", "POST", routeID, function (response) {
            gpxdata = response;
            if (gpxdata.length === 0) {
                popup.Alert("No GPX data found!");
                return null;
            }
                                         
            _t('h3').textContent = "please wait...";

            function _t(t) { return demo.getElementsByTagName(t)[0]; }
            function _c(c) { return demo.getElementsByClassName(c)[0]; }

            if (map != undefined) { map.remove(); }
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
                    shadowUrl: '',
                },
            }).on('loaded', function (e) {
                var gpx = e.target;
                var elev_data;
                var bounds = gpx.getBounds();
                map.fitBounds(bounds);
                //     control.addOverlay(gpx, gpx.get_name());

                _t('h3').textContent = gpx.get_name() + "  ";

                // add a download link
                var a = document.createElement('a');
                var linkText = document.createTextNode("(download GPX)");
                a.style.fontStyle = "italic";
                a.appendChild(linkText);
                a.title = "download GPX";
                a.href = gpxdata;
                _t('h3').appendChild(a);

                _c('distance').textContent = (gpx.get_distance() / 1000).toFixed(1);
                _c('elevation-gain').textContent = gpx.get_elevation_gain().toFixed(0);
                _c('elevation-loss').textContent = gpx.get_elevation_loss().toFixed(0);
                _c('elevation-net').textContent = (gpx.get_elevation_gain() - gpx.get_elevation_loss()).toFixed(0);

                //drawProfile1("demo-elev", elev_data);
                if (gpx.get_elevation_gain() > 0 && gpx.get_elevation_loss() > 0) {
                    var elev_data = gpx.get_elevation_data();
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

            }).addTo(map);
        }, false, null);
    }

    bleData.showData = function () {
        getWebData(null);
        // if it's a narrow screen (i.e. mobile phone), collapse the sensor list and date chooser to make it easier to see the graph
        if ($('#btnMenu').is(":visible")) {
            $('#findlist').empty();
            var htmlstr = '<a id="findTitle" class="list-group-item list-group-item-info">Choose sensor(s)</a>';
            $('#findlist').append(htmlstr);
            $('#findTitle').click(TCCroutes.CreateSensorList);
            $('#fromDate').hide();
            $('#toDate').hide();
            bleData.setDateChooser('Change');
        }
    };
    bleData.setDateChooser = function (btntext) {
        $('#dateTitle').html(bleTime.dateString(startDate) + " to " + bleTime.dateString(endDate) + '<span id="btnGo" role="button" class="btn btn-lifted  btn-info btn-sm pull-right">' + btntext + '</span>');
    };


    //bleData.updateEndDate = function (datetext, obj) { $("#endDate").datepicker("update", datetext); };

    bleData.SaveValues = function (index, ambient) {

        if (isNaN(ambient)) {
            ambient = -273;
        }
        //if (isNaN(remote))
        //    remote = -273;

        // To Do: this isn't correct, not using 'index', it assumes all data arrives in the correct order
        tempValues1.push(ambient);
        //tempValues2.push(remote);
    };

    bleData.ApplyTimestamps = function (sensor) {
        var records = tempValues1.length,
            dataTime = new Date(),
            record, value, logdata, logdata1, marker,
            lastbit, firstbit;

        // new data just been downloaded
        // assume 1-min interval for now

        dataTime = new Date(dataTime.getTime() - records * 60000);
        for (record = 0; record < records; record++) {
            value = tempValues1[record];
            if (value === -500) {
                // marker for beginning of RAM section: NOT the first data 
                // put all the rest into a new temporary buffer so it can be rejigged
                for (record+1; record < records; record++) {
                    value = tempValues1[record];
                    //if (value !== -500) {
                        ramValues.push(value);
                    //}
                }
                break;
            }
            //else if (value == -501) {
            //    // marker for first/last data in RAM section 
            //    continue;       // debug marker for now
            //}
            logdata1 = new bleData.Logdata('', Math.round(dataTime.valueOf() / 60000), value);
            //var logdata2 = new bleData.Logdata(id + 1, Math.round(dataTime.valueOf() / 60000), tempValues2[record]);
            sensor.NewValues.push(logdata1);
            //newValues2.push(logdata2);
            // assume 1-min interval for now
            dataTime = new Date(dataTime.getTime() + 60000);
        }
        // now deal with the RAM section; newest data will be at the -501 marker
        marker = ramValues.indexOf(-501);
        if (marker < 0) {
            popup.Alert("error in data?");
            marker = 0;
        }
        //if (marker >= 0) {
        lastbit = ramValues.slice(0, marker);
        firstbit = ramValues.slice(marker);
        for (record = 0; record < firstbit.length; record++) {
            logdata = new bleData.Logdata('', Math.round(dataTime.valueOf() / 60000), firstbit[record]);
            sensor.NewValues.push(logdata);
            // assume 1-min interval for now
            dataTime = new Date(dataTime.getTime() + 60000);
        }
        for (record = 0; record < lastbit.length; record++) {
            logdata = new bleData.Logdata('', Math.round(dataTime.valueOf() / 60000), lastbit[record]);
            sensor.NewValues.push(logdata);
            // assume 1-min interval for now
            dataTime = new Date(dataTime.getTime() + 60000);
        }
        //}

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


    bleData.DisplayValues = function () {
        $("#tableName").html("Preparing table (" + dispValues.length + " records...)");
        // put a timeout here to enable the new html to be displayed at the correct time....
        window.setTimeout(function () {
            var d, v, val, vals,
                row,
                titles,
                valStr,
                dataArray = [];
            //var device = "";
            
            $.each(dispValues, function (index, logdata) {
                row = [];
                d = new Date(logdata.T * 60000);
                row.push(bleTime.dateString(d));
                row.push(bleTime.timeString(d));
                vals = logdata.V.length;
                for (v = 0; v < vals; v++) {
                    val = logdata.V[v];
                    if (val > -270) {
                        row.push(val);
                    }
                    else {
                        // missing data?
                        row.push('****');
                    }
                }
                dataArray.push(row);
            });
            titles = [{ "sTitle": "Date" }, { "sTitle": "Time" }];
            $.each(TCCroutes.displayedRoutes(), function (index, sensor) {
                valStr = '(' + (index + 1) + ')';
                titles.push({ "sTitle": valStr });
            });
            bleTable('#data', null, dataArray, bleApp.tableHeight(), titles, null);
            $("#tableName").html(TCCroutes.DisplayedSensorNames());
        }, 100);
    };


    bleData.CreateChart = function (div) {
        var chartData = [],
            d, v, val, vals, valname, dataPoint;

        $("#chartName").html("Preparing chart (" + dispValues.length + " records...)");
        // put a timeout here to enable the new html to be displayed at the correct time....
        window.setTimeout(function () {
            $.each(dispValues, function (index,logdata) {

                if (logdata.V < -270) {
                    // badData = true;
                    return true;
                }
                // logdata is in the form
                // {time:xx, v:[v1,v2,v3]}   (e.g. for three sets of values)
                // for the graph, need to change it to
                //  {time:xx, val1:v1, val2:v2, val3:v3}
                //
                
                d = new Date(logdata.T * 60000);
                vals = logdata.V.length;

                dataPoint = {
                    time: bleTime.dateTimeString(d),
                    minAlarm: 2,
                    maxAlarm: 8
                };
                for (v = 0; v < vals; v++) {
                    valname = "val" + (v + 2);
                    val = logdata.V[v];
                    if (val > -272) {
                        dataPoint[valname] = val;
                    }
                    //else {
                    //    dataPoint[valname] = '';
                    //}
                }
                // add object to chartData array
                chartData.push(dataPoint);

            });
            if (chartData.length < 4) {
                return null;
            }
            $("#chartName").html("Creating chart (" + dispValues.length + " records...)");
            window.setTimeout(function () {
                createAMChart(chartData, div,vals);
                $("#chartName").html(TCCroutes.DisplayedSensorNames());
            }, 100);

        }, 100);
        return chartData;
    };


    bleData.DisplayNewChart = function (sensor) {
        var name, index;
        for (index = 0; index < sensor.NewValues.length; index++) {
            dispValues[index] = sensor.NewValues[index];
        }

        //name = tagConnect.Connection().Name;
        name = sensor.Name;
        bleData.CreateChart('newChart');
        //bleData.DisplayValues();
        $("#newChartName").html(name);
        $("#newTableName").html(name);
    };

    return bleData;
}(jQuery));



