
/*global device,screen,FastClick,bleTime*/

(function () {
    "use strict";

    function onPause() {
        // TODO: This application has been suspended. Save application state here.
    }

    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
    }
    function onDeviceReady() {
        // Handle the Cordova pause and resume events
        document.addEventListener('pause', onPause.bind(this), false);
        document.addEventListener('resume', onResume.bind(this), false);
        window.addEventListener('load', function () { FastClick.attach(document.body); }, false);

        bleTime.log(device.platform + ": " + device.model);
        bleApp.setMobile(true);
        // needs doing again
        //bleApp.detectScreenHeight();
        // don't always need login for mobile use (login may not be possible when downloading devices)
        $('#loginModal').modal('hide');
        // go straight to connection page
        $(".navbar-nav a[href=#home]").tab('show');
        tagConnect.initialize();
        bleApp.SetPlatform(device.platform);
    }

    document.addEventListener( 'deviceready', onDeviceReady.bind( this ), false );
    

    $(document).ready(function () {
        $(".navbar-nav li a").click(function (event) {
            $(".navbar-collapse").collapse('hide');
        });
        bleApp.init();
        //bleApp.detectScreenHeight();

        // add some handlers
        $("#form-signin").on("show", login.Login());

        $("#tableName").click(bleData.DisplayValues);

        //$('#statusConnect').click(function () { $('#scanlist').show(); });
        // hide these elements until they are needed
        $("#progress-bar").hide();
        $("#upload-all").hide();
        $('#statusConnect').hide();
        $('#fromDate').hide();
        //$('#toDate').hide();
        $('#loading').hide();
        $('#planRide').hide();
        $('#planRide').click(function () {
            // move to different tab
            //$('.nav-tabs a[href="#setup-tab"]').tab('show');
            bleData.setCurrentTab('setup-tab');
            $('#setup-tab').tab('show');
            $('#uploadRoute').hide();
            bleData.showRoute();
            bleData.leadRide();
        });
        //$('#panel-setup').on('show',function () {
        //    $('#uploadRoute').show();
        //});
        //$(function () {
        //    $('#tabs').tabs({
        //        activate: function (event, ui) {
        //            var $activeTab = $('#tabs').tabs('option', 'active');
        //            if ($activeTab === 2) {
        //                $('#uploadRoute').show();
        //            }
        //        }
        //    });
        //});
        //$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        //    var target = $(e.target).attr("href"); // activated tab
        //    if (target === $('#panel-setup')) {
        //        $('#uploadRoute').show();
        //    }
        //});
        $('#home-tab').tab('show');
        bleData.setCurrentTab('home-tab');


        var today = new Date();
        today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        // find next Sunday's date
        while (today.getDay() !== 0) {
            today = bleTime.addDays(today,1);
        }
        
        bleData.setDate(today);
        bleData.setDateChooser('View other dates');


        $('#start-time').timepicker();

        $(".detectChange").change(function () {
            $("#saveRoute").prop("disabled", false);
        });

        $(document).ajaxStart(function() {
            $('<div class="loader" id="loading"><img id="loading-image" src="images/page-loader.gif" alt="waiting..." /></div>')
        .prependTo('body');
        });

        $(document).ajaxStop(function()  {
           // $('.loader').hide();
            $('.loader').remove();
        });
        // need to know which tab is in use so we know where to place map etc
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            //show selected tab / active
            var tab = $(e.target).attr('id');
            bleData.setCurrentTab(tab);
            console.log(tab);
            if (tab === 'setup-tab') {
                $('#uploadRoute').show();
            }
        });
        $(function () {
            $('[data-toggle="tooltip"]').tooltip();
        });

        $('#loginModal').on('shown.bs.modal', function (e) {
            $("#form-register").hide();
            $("#signin-cancel").on('click', function () {
                $("#myTabContent").hide();
                $("#home").hide();
                $("#webdata").hide();
                $("#panel-setup").hide();
                $('#loginModal').modal('hide');
            });
            $("#signin-register").on('click', function () {
                $("#form-register").show();
            });
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

    $('#scanlist').on('click', function (e) {
        var previous = $(this).closest(".list-group").children(".active");
        previous.removeClass('active'); // previous list-item
        $(e.target).addClass('active'); // activated list-item
    });

})();

var bleApp = (function () {
    "use strict";
    var bleApp = {},
    ismobile,
    interval = 60;  // seconds

    function updateTime() {
        var d = new Date();
        var timetext, string, username = login.User();
        if (d.getSeconds() < interval) {
            if ($(window).width() >= 800) {
                timetext = d.toDateString() + ' ' + bleTime.timeString(d);
                string = 'TCC Ride Planner <span style="color:black; font-size:small">' + timetext;
                if (username !== undefined) {
                    string = string + ' Logged in as: </span>' + username;
                }
            }
            else {
                timetext = d.toDateString();
                string = 'TCC Rides <span style="color:black; font-size:small">' + timetext;
                if (username !== undefined) {
                    string = string + '  </span> (' + username + ')';
                }
            }
            $("#realtime").html(string);
        }
        if (ismobile) {
            // every few seconds, update connected status of devices
            tagConnect.updateConnections(interval);
        }
    }

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


