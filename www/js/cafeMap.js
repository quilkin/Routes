
var mapOfCafes = (function ($) {
    "use strict";

    //[DataMember(Name = "id")]        public int ID { get; set; }
    //[DataMember(Name = "name")]        public string Name { get; set; }
    //[DataMember(Name = "placename")]        public string PlaceName { get; set; }
    //[DataMember(Name = "lat")]        public double Lat{ get; set; }
    //[DataMember(Name = "lng")]        public double Lng { get; set; }
    //[DataMember(Name = "daysopen")]        public int DaysOpen { get; set; }
    //[DataMember(Name = "timesopen")]        public String TimesOpen { get; set; }
    //[DataMember(Name = "notes")]        public String Notes { get; set; }

    var mapOfCafes = {},
        cafemap = null,
        latlng,
        cafes = [],
        cafe,
        popup,
        markers = [],
        wayPoints = [],
        lastLine1, lastLine2, lastDem,
        dialog;



    var greenIcon = new L.Icon({
        iconUrl: 'scripts/images/marker-icon-green.png',
        shadowUrl: 'scripts/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const coffeeIcon = L.divIcon({
        html: '<i class="fa fa-coffee fa-lg"></i>',
        iconSize: [12, 12],
        className: 'myIcon'
    });


    // Create additional Control placeholders
    function addControlPlaceholders(map) {
        var corners = map._controlCorners,
            l = 'leaflet-',
            container = map._controlContainer;

        function createCorner(vSide, hSide) {
            var className = l + vSide + ' ' + l + hSide;

            corners[vSide + hSide] = L.DomUtil.create('div', className, container);
        }

        createCorner('verticalcenter', 'left');
        createCorner('verticalcenter', 'right');
        createCorner('center', 'left');
        createCorner('center', 'right');

    }

    function getCafes() {
              // get the list of cafes to map
        rideData.myJson('GetCafes', "POST", null, function (response) {
            cafes = response;
            updateMap();
        }, true, null);
    }
    

    function updateMap() {
        $.each(cafes, function (index, cafe) {

            var coffee = L.marker([cafe.lat, cafe.lng], {
                icon: coffeeIcon
            }).addTo(cafemap);
            var popupname = cafe.name;
            var popupplace = cafe.placename;

            coffee.bindPopup('<b>' + popupname + '</b><br />' + popupplace);
                
        });
        popup = L.popup();
        cafemap.setView([cafes[0].lat, cafes[0].lng], 10);
       
    }
    function Cafe(id, lat, lng, name, place, opendays, opentimes, notes) {
        this.id = id;
        this.timesopen = opentimes;
        this.daysopen = opendays;
        this.lat = lat;
        this.lng = lng;
        this.placename = place;
        this.name = name;
        this.notes = notes;
    }
    function showCafeList() {
        // to do
    }

    function handleCafeEdit() {
      
        cafe.notes = $("#edit-cafe-notes").val();
        cafe.name = $("#edit-cafe-name").val();
        cafe.placename = $("#edit-cafe-place").val();
        cafe.daysopen = $("#edit-cafe-days").val();
        cafe.timesopen = $("#edit-cafe-times").val();

        if (cafe.name.length < 2 ) {
            qPopup.Alert("Cafe name needed");
            return;
        }

        qPopup.Confirm("Save edited cafe", "Are you sure?", function () {
            rideData.myJson("SaveCafe", "POST", cafe, function (response) {
                // if successful, response should be just a new ID
                if (response.length < 5) {
                    cafe.id = response;
                    cafes.push(cafe);
                    showCafeList();
                    $('#editCafeModal').modal('hide');
                }
                else {
                    qPopup.Alert(response);
                }
            }, true, null);
        }, null, -10);
    }

    function findCafeFromLoc(lat,lng)  {
        var found = $.grep(cafes, function (e, i) {
            return e.lat === lat && e.lng === lng;
        });
        if (found.length > 0) {
            return found[0];
        }
        return null;
    }

    $("#edit-cafe-ok").on("click", handleCafeEdit);
    $("#edit-cafe-cancel").on('click', function () {
        $('#editCafeModal').modal('hide');
    });

    $('#editCafeModal').on('shown.bs.modal', function (e) {
        var lat = latlng.lat;
        var lng = latlng.lng;
        cafe = findCafeFromLoc(lat, lng);
        if (cafe === null) {
            cafe = new Cafe(0, lat, lng, 'name', 'where', 'every day', '', '');
        }

        $("#edit-cafe-notes").attr("value", cafe.notes);
        $("#edit-cafe-name").attr("value", cafe.name);
        $("#edit-cafe-place").attr("value", cafe.placename);
        $("#edit-cafe-days").attr("value", cafe.daysopen);
        $("#edit-cafe-times").attr("value", cafe.timesopen);
 

    });



    function onMapDblClick(e) {
        latlng = e.latlng;
        console.log("cafe click @ " + e.latlng.lat + ',' + e.latlng.lng);


        // todo:  mustn't be too near an existing cafe


        $('#editCafeModal').modal();
    }

    mapOfCafes.createMap = function () {
        if (cafemap !== undefined && cafemap !== null) {
            cafemap.remove();
        }
        cafemap = L.map('cafe-map', { messagebox: true });
        L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors',
            zoom: 13

        }).addTo(cafemap);

        getCafes();
        AddControls();
        cafemap.on('dblclick', onMapDblClick);
        cafemap.doubleClickZoom.disable();
    };

    mapOfCafes.checkForCafe = function (lat, lng) {
        var found = '';
        $.each(cafes, function (index, cafe) {
            var lat_cafe = cafe.lat;
            var lng_cafe = cafe.lng;
            var lat_diff = Math.abs(lat - lat_cafe);
            var lng_diff = Math.abs(lng - lng_cafe);
            if (lat_diff < 0.0005 && lng_diff < 0.0005) {
                found = cafe.name;
                return false;
            }
        });
        return found;
    };


    function AddControls() {

        addControlPlaceholders(cafemap);

        L.control.mousePosition().addTo(cafemap);
        

        //// a cross-hair for choosing points
        //iconCentre1 = L.control({ position: 'centerleft' });
        //iconCentre1.onAdd = function (map) {
        //    this._div = L.DomUtil.create('div', 'myControl');
        //    var img_log = "<div><img src=\"images/crosshair.png\"></img></div>";
        //    this._div.innerHTML = img_log;
        //    return this._div;

        //};
        //iconCentre1.addTo(cafemap);

        //dialogContents = [
        //    "<p>Truro CC cafe stops: Options</p>",
        //    "<button class='btn btn-primary' onclick='CafeMap.changeBike()'>Bike Type: Hybrid</button><br/><br/>",
        //    "<button class='btn btn-primary' onclick='CafeMap.changeHills()'>Use of hills (0-9): 2</button><br/><br/>",
        //    "<button class='btn btn-primary' onclick='CafeMap.changeMainRoads()'>Use of main roads (0-9): 2</button><br/><br/>",
        //].join('');

        //dialog = L.control.dialog()
        //    .setContent(dialogContents)
        //    .addTo(cafeMap);

        ////L.easyButton('<span class="bigfont">&rarr;</span>', createRoute).addTo(map);
        //L.easyButton('<span class="bigfont">&check;</span>', addPoint).addTo(cafemap);
        //L.easyButton('<span class="bigfont">&cross;</span>', deletePoint).addTo(cafemap);
        //L.easyButton('<span class="bigfont">&odot;</span>', openDialog).addTo(cafemap);
 
        //cafeMap.messagebox.options.timeout = 5000;
        //cafeMap.messagebox.setPosition('bottomleft');
        //cafeMap.messagebox.show('');


    }

    function addPoint() {

        var centre = cafemap.getCenter();
        wayPoints.push(L.latLng(centre.lat, centre.lng));
        //if (route == undefined) {
        //if (routes.length == 0)
        var marker = L.marker([centre.lat, centre.lng]).addTo(cafemap);
        // responsiveVoice.speak("Added a point");
        if (wayPoints.length === 1) {
            marker = L.marker([centre.lat, centre.lng], { icon: greenIcon }).addTo(cafemap);
            markers.push(marker);
            // this is first (starting) point. Need more points!
            return;
        }

        markers.push(marker);
        createRoute();
    }
    function deletePoint() {
        if (wayPoints.length < 2) {
            alert("No waypoints to delete!");
            return;
        }
        var marker = markers.pop();
        cafemap.removeLayer(marker);
        wayPoints.pop();
        createRoute();
    }
    function openDialog() {
        dialog.open();
    }

    // Code from Mapzen site
    function polyLineDecode(str, precision) {
        var index = 0,
            lat = 0,
            lng = 0,
            coordinates = [],
            shift = 0,
            result = 0,
            byte = null,
            latitude_change,
            longitude_change,
            factor = Math.pow(10, precision || 6);

        // Coordinates have variable length when encoded, so just keep
        // track of whether we've hit the end of the string. In each
        // loop iteration, a single coordinate is decoded.
        while (index < str.length) {

            // Reset shift, result, and byte
            byte = null;
            shift = 0;
            result = 0;

            do {
                byte = str.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);

            latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

            shift = result = 0;

            do {
                byte = str.charCodeAt(index++) - 63;
                result |= (byte & 0x1f) << shift;
                shift += 5;
            } while (byte >= 0x20);

            longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

            lat += latitude_change;
            lng += longitude_change;

            coordinates.push([lat / factor, lng / factor]);
        }

        return coordinates;
    };


    function pointToLine(point0, line1, line2) {
        // find min distance from point0 to line defined by points line1 and line2
        // equation from Wikipedia
        var numer, dem;
        var x1 = line1[0], x2 = line2[0], x0 = point0[0];
        var y1 = line1[1], y2 = line2[1], y0 = point0[1];

        if (line1 === lastLine1 && line2 === lastLine2) {
            // same line as we checked before, can save time by not recalculating sqaure root on demoninator
            dem = lastDem;
        }
        else {
            dem = Math.sqrt((y2 - y1) * (y2 - y1) + (x2 - x1) * (x2 - x1));
            lastLine1 = line1;
            lastLine2 = line2;
            lastDem = dem;
        }
        numer = Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1);
        return numer / dem;

    }
    function distanceBetweenCoordinates(point0, point1) {
        var x1 = point0[0], x2 = point1[0];
        var y1 = point0[1], y2 = point1[1];
        var R = 6371e3; // metres
        var φ1 = x1 / 57.2958;
        var φ2 = x2 / 57.2958;
        var Δφ = (x2 - x1) / 57.2958;
        var Δλ = (y2 - y1) / 57.2958;

        var a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        var d = R * c;
        return d;

    }

    return mapOfCafes;
})(jQuery);
