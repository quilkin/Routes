
var TCCroutes = (function () {
    "use strict";

    var TCCroutes = {},
    
    // list of routes downloaded from database
    routes = [],
    // list of sensors currently displayed in chart etc
    displayedRoutes = [],

    // the latest one to be downloaded from web
    currentRoute=null;

    // local functions
    function getWebRoutes(userID) {
        bleData.myJson("GetRouteSummaries", "POST", userID, function (response) { routes = response; }, false, null);
        if (routes.length === 0) {
            popup.Alert("No data found!");
            return;
        }
        return routess;
    }



    TCCroutes.Route = function (serial, name, rssi, ID, period, description, alarmlo, alarmhi, owner) {
        this.Serial = serial;       // full serial number e.g. "12:34:56:78:9A:BC"
        this.ShortSerial = TCCroutes.shortSerial(serial);
        this.Name = name;
        this.RSSI = rssi;
        this.Period = period;
        this.Description = description;
        this.AlarmLow = alarmlo;
        this.AlarmHigh = alarmhi;
        this.ID = ID;
        this.Owner = owner;
        // negative time indicates not connected
        this.ConnectionTime = -1;
        // flag used to avoid downloading more than neccessary
        this.downloaded = false;
        // index in displayedRoutes
        //this.index = -1;
        // recent values stored temporarily before being uploaded to database
        this.NewValues = [];
    };

    TCCroutes.addFoundSensor = function (obj) {
        var found = $.grep(foundSensors, function (e, i) {
            return e.Serial === obj.address;
        });
        if (found.length > 0) {
            return null;
         //   currentRoute = found[0];
        }

        currentRoute = new TCCroutes.Route(obj.address, obj.name, obj.rssi);
        foundSensors.push(currentRoute);

        //else {
        //    found.NewValues = sensor.NewValues;
        //}
        return currentRoute;
    };
    TCCroutes.findSensor = function (serial) {
        var found = $.grep(foundSensors, function (e, i) {
            return e.Serial === serial;
        });
        if (found.length > 0) {
            return found[0];
        }

        return null;

    };
    TCCroutes.currentRoute = function () {
        return currentRoute;
    };
    TCCroutes.SetSensor = function (sensor) {
        currentRoute = sensor;
    };
    TCCroutes.displayedRoutes = function () {
        return displayedRoutes;
    };
    TCCroutes.FoundSensors = function () {
        return foundSensors;
    };
    TCCroutes.ClearFoundSensors = function () {
        while (foundSensors.length > 0) { foundSensors.pop(); }
    }
    TCCroutes.DisplayedSensorNames = function () {
        var index, nameStr='';
        for (index = 0; index < displayedRoutes.length; index++) {
            nameStr += (displayedRoutes[index].Name);
            nameStr += ', ';
        }
        nameStr = nameStr.slice(0, -2);
        return nameStr;
    };
    TCCroutes.DisplayedSensorIDs = function () {
        var index, ids=[];
        for (index = 0; index < displayedRoutes.length; index++)
        {
            ids.push(displayedRoutes[index].ID);
        }
        return ids;
    };
    TCCroutes.isDisplayed = function (sensor) {
        var index = $.inArray(sensor, displayedRoutes);
        if (index < 0) { return false; }
        return true;
    };
    TCCroutes.DisplaySensor = function (sensor, yes) {
        var index, howmany = displayedRoutes.length;
        for (index =0; index<howmany; index++){
            if (displayedRoutes[index].ShortSerial === sensor.ShortSerial)
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
     //           sensor.index = -1;
            }
        }
        else {
        // not already in list
            if (yes) {
                displayedRoutes.push(sensor);
   //             sensor.index = $.inArray(sensor, displayedRoutes);
            }
            else {
  //              sensor.index = -1;
            }
        }
        // must re-arrange into ID order so that SQL query wiil return corresponding data
        displayedRoutes.sort(function (a, b) { return a.ID - b.ID });
        if (yes) { currentRoute = sensor; }
    };

    TCCroutes.CreateSensorList = function () {
        var id = login.ID();
        if (id === undefined || id === 0) {
            $('#loginModal').modal();
            return;
        }
        if (sensors === undefined || sensors.length === 0) {
            getWebRoutes(id);
        }
        $('#findlist').empty();  // this will also remove any handlers
        $('#setuplist').empty();
        $.each(sensors, function (index, sensor) {

            var htmlstr = '<a id="sen' + index + '" class="list-group-item">' + sensor.Name +
                '<button id="get' + index + '" type="button" class="btn btn-lifted btn-info btn-sm pull-right" data-toggle="button" data-complete-text="Deselect">Select</button>' +
                '</a>';
            $('#findlist').append(htmlstr);
            if (TCCroutes.isDisplayed(sensor)) {
                // for re-showing list when sensors have previously been displayed (list will be emptied for small screens)
                $('#get' + index).button('complete');
            }
            $('#get' +index).click(function () {
                if (TCCroutes.isDisplayed(sensor)) {
                    $(this).button('reset');
                    TCCroutes.DisplaySensor(sensor, false);
                }
                else {
                    $(this).button('complete');
                    TCCroutes.DisplaySensor(sensor,true);
                }
                //bleData.showData();
            });
            htmlstr = '<a id="sen' + index + '" class="list-group-item">' + sensor.Name +
                '<button id="set' + index + '" type="button" class="btn btn-lifted btn-info btn-sm pull-right" >Set up</button>' +
                '</a>';
            $('#setuplist').append(htmlstr);
            $('#set' + index).click(function () {
                TCCroutes.SetSensor(sensor);
                bleSetup.initialise();
                $('#sensorTitle').text("Set up Route: serial no. " + sensor.Serial);
                // if it's a short screen, collapse the sensor list and date chooser to make it easier to see the graph
                // if ($('#btnMenu').is(":visible")) {
                // *** To Do: this won't work correctly for landscape/portrait changes
                if (bleApp.tableHeight < 300) {
                    $('#setuplist').empty();
                    htmlstr = '<a id="setupTitle" class="list-group-item list-group-item-info">Choose sensor</a>';
                    $('#setuplist').append(htmlstr);
                    $('#setupTitle').click(TCCroutes.CreateSensorList);
                }
                if (bleApp.tableHeight < 250) {
                    // save more space by making the setup title bar clickable, instead of the sensor list title
                    $('#setupTitle').hide();
                    $('#sensorTitle').click(TCCroutes.CreateSensorList);
                }
            });
            index++;
        });
        $('#findlist').append('<div><button id="showSelected" type="button" class="btn btn-info  pull-right">Show Selection</button></div>');
        $('#showSelected').click(bleData.showData);

    };



    return TCCroutes;
}());
