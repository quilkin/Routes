
/*global device,screen,FastClick,bleTime*/

(function () {
    "use strict";

    //function onPause() {
    //    // TODO: This application has been suspended. Save application state here.
    //}

    //function onResume() {
    //    // TODO: This application has been reactivated. Restore application state here.
    //}
    //function onDeviceReady() {
    //    // Handle the Cordova pause and resume events
    //    document.addEventListener('pause', onPause.bind(this), false);
    //    document.addEventListener('resume', onResume.bind(this), false);
    //    window.addEventListener('load', function () { FastClick.attach(document.body); }, false);

    //    bleTime.log(device.platform + ": " + device.model);
    //    bleApp.setMobile(true);
    //    // needs doing again
    //    //bleApp.detectScreenHeight();
    //    // don't always need login for mobile use (login may not be possible when downloading devices)
    //    $('#loginModal').modal('hide');
    //    // go straight to connection page
    //    $(".navbar-nav a[href=#home]").tab('show');
    //    tagConnect.initialize();
    //    bleApp.SetPlatform(device.platform);
    //}

    //document.addEventListener( 'deviceready', onDeviceReady.bind( this ), false );
    

    $(document).ready(function () {
        $(".navbar-nav li a").click(function (event) {
            $(".navbar-collapse").collapse('hide');
        });
        bleApp.init();

        $("#form-signin").on("show", login.Login());

        // hide these elements until they are needed
        $("#progress-bar").hide();
        $("#upload-all").hide();
        $('#statusConnect').hide();
        $('#fromDate').hide();
        $('#loading').hide();
        $('#planRide').hide();
        $('#deleteRoute').hide();
        $("#form-signin").show();
        //$('#planRide').click(function () {
        //    // move to different tab
        //    rideData.setCurrentTab('setup-tab');
        //    $('#setup-tab').tab('show');
        //    $('#uploadRoute').hide();
        //    TCCMap.showRoute();
        //    TCCrides.leadRide();
        //});



        $("#rideDate1").datepicker({ todayBtn: false, autoclose: true, format: "DD M dd yyyy" });
        $("#rideDate").datepicker({ todayBtn: true, autoclose: true, format: "DD M dd yyyy" });


        $('#home-tab').tab('show');
        rideData.setCurrentTab('home-tab');

        var today = new Date();
        today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        // find next Sunday's date
        while (today.getDay() !== 0) {
            today = bleTime.addDays(today,1);
        }
        
        rideData.setDate(today);
        rideData.setDateChooser('View other dates');


        $(".detectChange").change(function () {
            $("#saveRoute").prop("disabled", false);
        });

        $(document).ajaxStart(function() {
            $('<div class="loader" id="loading"><img id="loading-image" src="images/page-loader.gif" alt="waiting..." /></div>')
        .prependTo('body');
        });

        $(document).ajaxStop(function()  {
            $('.loader').remove();
        });
        var lasttab = 'home-tab';
        // need to know which tab is in use so we know where to place map etc
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            //show selected tab / active
            var tab = $(e.target).attr('id');
            rideData.setCurrentTab(tab);
            console.log(tab);
            if (tab === 'setup-tab') {
                if ($('#convertToRide').is(":hidden")) {
                    $('#uploadRoute').show();
                }
            }
            if (tab === 'webdata-tab') {
                TCCroutes.ShowStartLocation();
            }
        });
        $(function () {
            $('[data-toggle="tooltip"]').tooltip();
        });

        //$('#loginModal').on('shown.bs.modal', function (e) {
        //    $("#form-register").hide();
        //    $("#signin-cancel").on('click', login.cancelSignIn);
        //    $("#signin-register").on('click', function () {
        //        $("#form-register").show();
        //        $("#form-signin").hide();
        //    });
        //});

        // add a hash to the URL when the user clicks on a tab
        $('a[data-toggle="tab"]').on('click', function (e) {
            lasttab = $(e.target).attr('id');
            history.pushState(null, null, $(this).attr('href'));
        });
        // navigate to a tab when the history changes
        window.addEventListener("popstate", function (e) {
            var hash = window.location.hash;
            if (hash.length > 0) {
                var activeTab = $('[href=' + hash + ']');
                if (activeTab.length) {
                    activeTab.tab('show');
                }
                else {
                    $('.nav-tabs a:first').tab('show');
                }
            } else {
                $('.nav-tabs a:first').tab('show');
            }
        });


        // see if any URL params for registration
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const username = urlParams.get('username');
        const regcode = urlParams.get('regcode');
        const email1 = urlParams.get('m1');
        const email2 = urlParams.get('m2');

        const email = email1 + '@' + email2;
        if (username !== null && regcode !== null) {
            var success = login.CompleteRegistration(username, regcode, email);
            if (success === true) {
                // always need to login, cannot download devices from non-mobile
                $('#loginModal').modal();
                // switch straight to home tab
                $(".navbar-nav a[href=#home]").tab('show');
            }
        }
        else if (bleApp.isMobile() === false) {
            // always need to login, cannot download devices from non-mobile
            $('#loginModal').modal();
            // switch straight to home tab
            $(".navbar-nav a[href=#home]").tab('show');

        }


    });

})();

var bleApp = (function () {
    "use strict";
    var bleApp = {},
        ismobile,
        lastClickTime = new Date(),
        interval = 60;  // seconds


    function updateTime() {
        var d = new Date();
        //var timetext, string, username = login.User();
        if (d.getSeconds() < interval) {
         //   $('#realtime').empty(); 
        //    if ($(window).width() >= 800) {
                //timetext = d.toDateString() + ' ' + bleTime.timeString(d);
            //string = 'TCC Ride Planner <span style="color:black; font-size:small">'; // + timetext;
            //    if (username !== undefined) {
            //        string = string + ' Logged in as: </span> <button id="userName">' + username + '</button >';
            //    }
        //    }
            //else {
            //    timetext = d.toDateString();
            //    string = 'TCC Rides <span style="color:black; font-size:small">' + timetext;
            //    if (username !== undefined) {
            //        string = string + '  </span> (' + username + ')';
            //    }
            //}
            var sinceLastClick = d.valueOf() - lastClickTime.valueOf();
            if (sinceLastClick > 60000 && rideData.getCurrentTab()==='home-tab') {
                // update rides list in case other users have modified it
                TCCrides.clearPopovers(-1);
                TCCrides.CreateRideList(null);
                lastClickTime = d;
            }

            //$("#realtime").html(string);
            //$('#userName').click(function () {
            //    console.log('username clicked');
            //});
        }
        if (ismobile) {
            // every few seconds, update connected status of devices
            tagConnect.updateConnections(interval);
        }
    }
    $(document).click(function (e) {
        var popover = $(e.target).is('.has-popover');
        if (!popover) {
            TCCrides.clearPopovers(-1);
        }
        lastClickTime = new Date();
    });


    return {
        init: function () {
            ismobile = false;
            updateTime();
            interval = 5;
            window.setInterval(function () {
                updateTime();
            }, interval * 1000);
            $.ajaxSetup({ cache: false });
        },
        setPlatform: function (x) { platform = x; },
        getPlatform: function () {
            return (platform === undefined ? '' : platform);
        },
        isMobile: function () { return ismobile; },
        setMobile: function (x) { ismobile = x; },
        tableHeight: function () {
            var tableHeight, screenHeight;
            //bleApp.detectScreenHeight = function () {
            if (ismobile) {
                screenHeight = $(window).height();
                tableHeight = screenHeight - 175;
                //screenWidth = $(window).width();
                //    this.screenWidth = screen.availWidth;
            }
            else {
                screenHeight = $(window).height();
                tableHeight = screenHeight - 175;
                //screenWidth = $(window).width();
                //    this.tableHeight = window.innerHeight - 175;
                //    this.screenHeight = window.innerHeight;
                //    this.screenWidth = window.innerWidth;
            }
            return tableHeight; 
        }
    };

}());


