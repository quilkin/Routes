
var mapOfCafes = (function ($) {
    "use strict";


    const coffeeIcon = L.divIcon({
        html: '<i class="fa fa-coffee fa-lg"></i>',
        iconSize: [12, 12],
        className: 'myIcon'
    });
    const bikeIcon = L.divIcon({
        html: '<i class="fa fa-bicycle fa-2x"></i>',
        iconSize: [20, 20],
        className: 'myIcon'
    });

    var mapOfCafes = {},
        cafemap = null,
        latlng,
        cafes = [],
        cafe,
        markers = [],
        wayPoints = [],
        lastLine1, lastLine2, lastDem,

        Cafe = function(id, lat, lng, name, place, opendays, opentimes, notes, user) {
            this.id = id;
            this.timesopen = opentimes;
            this.daysopen = opendays;
            this.lat = lat;
            this.lng = lng;
            this.placename = place;
            this.name = name;
            this.notes = notes;
            this.user = user;
        },

        checkForNearCafe = function (lat, lng) {
            var found = null;
            $.each(cafes, function (index, cafe) {
                var lat_cafe = cafe.lat;
                var lng_cafe = cafe.lng;
                var lat_diff = Math.abs(lat - lat_cafe);
                var lng_diff = Math.abs(lng - lng_cafe);
                if (lat_diff < 0.005 && lng_diff < 0.005) {
                    found = cafe;
                    return false;
                }
            });
            return found;
        },

        // find exact match
        findCafeFromLoc = function(lat, lng) {
            var found = $.grep(cafes, function (e, i) {
                return e.lat === lat && e.lng === lng;
            });
            if (found.length > 0) {
                return found[0];
            }
            return null;
        },

        getCafes = function () {
            // get the list of cafes to map
            rideData.myAjax('GetCafes', "POST", null, function (response) {
                cafes = response;
                //$.each(cafes, function (index, cafe) {
                //    //var dateParts = isoFormatDateString.split("-");
                //    //var jsDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2].substr(0, 2));
                //    var date = cafe.updated;
                //});
                updateMap();
            });
        };
    

    function updateMap() {
        $.each(cafes, function (index, thiscafe) {

            var myicon = index === 0 ? bikeIcon : coffeeIcon;
            var coffee = L.marker([thiscafe.lat, thiscafe.lng], {
                icon: myicon
            }).addTo(cafemap);

            var popupContent = '<b>' + thiscafe.name + '</b><br />' + thiscafe.placename + '<br />';
            if (index > 0) {
                popupContent += '-----------------<br />';
                popupContent += 'days: ' + thiscafe.daysopen + '<br />';
                popupContent += 'times: ' + thiscafe.timesopen + '<br />';
                popupContent += '-----------------<br />';
                popupContent += thiscafe.notes + '<br />';
                popupContent += '-----------------<br />';
                popupContent += 'updated: ' + thiscafe.updated;
            }

            coffee.bindPopup(popupContent);

            if (index > 0) { 
                coffee.on('click', function (e) {
                    var latlng = e.latlng;
                    cafe = findCafeFromLoc(latlng.lat, latlng.lng);
                    if (cafe !== null) {
                        $("#cafeTitle").html(cafe.name);

                    }
                });
            }
                
        });
        //popup = L.popup();
        cafemap.setView([cafes[0].lat, cafes[0].lng], 10);

       
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
        cafe.user = login.User();

        if (cafe.name.length < 2 ) {
            qPopup.Alert("Cafe name needed");
            return;
        }

        qPopup.Confirm("Save edited cafe", "Are you sure?", function () {
            rideData.myAjax("SaveCafe", "POST", cafe, function (response) {
                // if successful, response should be just a new ID
                if (response.length < 5) {
                    if (response !== '0') {
                        // new cafe
                        cafe.id = response;
                        cafes.push(cafe);
                    }
                    updateMap();
                    showCafeList();
                    $('#editCafeModal').modal('hide');
                }
                else {
                    qPopup.Alert(response);
                }
            });
        }, null, -10);
    }


    $("#editCafe").on("click", function () {
        
        $('#editCafeModal').modal();
    });
    $("#deleteCafe").on("click", function () {

        qPopup.Alert("Not yet implemented");
    });

    $("#edit-cafe-ok").on("click", handleCafeEdit);
    $("#edit-cafe-cancel").on('click', function () {
        $('#editCafeModal').modal('hide');
    });

    $('#editCafeModal').on('shown.bs.modal', function (e) {
        
        if (cafe === null) {
            cafe = new Cafe(0, latlng.lat, latlng.lng, 'new cafe', 'where', 'every day', '', '');
        }
        $("#cafeTitle").attr("value",cafe.name);
        $("#edit-cafe-notes").attr("value", cafe.notes);
        $("#edit-cafe-name").attr("value",cafe.name);
        $("#edit-cafe-place").attr("value",cafe.placename);
        $("#edit-cafe-days").attr("value",cafe.daysopen);
        $("#edit-cafe-times").attr("value",cafe.timesopen);
 
        $("#edit-cafe-user").html(cafe.user);
        $("#edit-cafe-time").html(cafe.updated);
    });



    function onMapDblClick(e) {
        latlng = e.latlng;
        console.log("cafe click @ " + e.latlng.lat + ',' + e.latlng.lng);

          // is it too too near an existing cafe?
        cafe = checkForNearCafe(latlng.lat, latlng.lng);
        if (cafe !== null) {
            qPopup.Confirm("This is very close to '" + cafe.name + "'", "Add a new cafe?",
                function () {
                    cafe = null; $('#editCafeModal').modal();
                },
                function () {
                    qPopup.Confirm("'" + cafe.name + "'", "Edit this cafe?",
                        function () {
                            $('#editCafeModal').modal();
                        }, null, -10);
                }, -10);
        }
        else {
            $('#editCafeModal').modal();
        }

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
        //AddControls();
        cafemap.on('dblclick', onMapDblClick);
        cafemap.doubleClickZoom.disable();
        if (login.loggedOut()) {
            $("#editCafe").prop("disabled", true);
            $("#deleteCafe").prop("disabled", true);
        }

    };




    function AddControls() {

        //addControlPlaceholders(cafemap);

        //L.control.mousePosition().addTo(cafemap);
        

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
