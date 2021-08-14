
(function () {
    "use strict";

    var
        lastClickTime = new Date(),
        lasttab = null,
        interval = 120;  // seconds

    function updateTime() {
        var d = new Date();
        
        if (d.getSeconds() < interval) {

            var sinceLastClick = d.valueOf() - lastClickTime.valueOf();
            if (login.loggedIn()) {
                if (sinceLastClick > 600000) {
                    // after 10 minutes, log out
                    RideList.clearPopovers(-1);
                    login.LogOut();
                    qPopup.Alert("No activity, you have been logged out");
                    lastClickTime = d;
                }
            }
        }
    };
    function init() {
        
        updateTime();
        interval = 5;
        window.setInterval(function () {
            updateTime();
        }, interval * 1000);
        $.ajaxSetup({ cache: false });

        var today = new Date();
        today = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        rideData.setDate(today);
        rideData.setDateChooser('View other dates');
    };

    $(document).ready(function () {

        $(".navbar-nav li a").click(function (event) {
            $(".navbar-collapse").collapse('hide');
        });
        
        $("#form-signin").on("show", login.Login());

        // hide these elements until they are needed
        $("#progress-bar").hide();
        $("#upload-all").hide();
        $('#statusConnect').hide();
        $('#fromDate').hide();
        $('#loading').hide();
        $('#planRide').hide();
        $('#deleteRoute').hide();
        $('#editRoute').hide();
        //$("#form-signin").show();

        $('#rides-tab').tab('show');
       
        rideData.setCurrentTab('rides-tab');

        $('#help').click(function () {
            var win = window.open("Rides-signup.htm");
            win.focus();
        });
        $('#allRoutes').click(function () {
            MultiMap.showRoutes();
        });

        $(".detectChange").change(function () {
            $("#saveRoute").prop("disabled", false);
        });
        $('#setupExisting').click(function () {
            $('#routes-tab').tab('show');
            rideData.setCurrentTab('routes-tab');
        });

        // need to know which tab is in use so we know where to place map etc
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            //show selected tab / active
            var tab = $(e.target).attr('id');
            rideData.setCurrentTab(tab);
            console.log(tab);
            if (tab === 'setup-tab') {
                if (login.loggedOut())
                {
                    $('#uploadRoute').hide();
                    $('#manualRoute').hide();
                    $('#existingRoute').hide();
                    $('#convertToRide').hide();
                }
                else
                {

                    if ($('#convertToRide').is(":hidden") || rideData.switchingFromLeadRide === false) {
                        $('#uploadRoute').show();
                        $('#manualRoute').show();
                        $('#existingRoute').show();
                        $('#convertToRide').hide();
                        $('#mapTitle').html('');

                    }
                    rideData.switchingFromLeadRide = false;
                }
            }
                

            if (tab === 'routes-tab') {
                MultiMap.showRoutes();
            }
            if (tab === 'cafes-tab') {
                mapOfCafes.createMap();
            }
            if (tab === 'rides-tab') {
                RideList.CreateRideList(null);
            }
            if (tab === 'account-tab') {
                login.setAccount();
            }
        });
        // add a hash to the URL when the user clicks on a tab
        $('a[data-toggle="tab"]').on('click', function (e) {
            lasttab = $(e.target).attr('id');
            history.pushState(null, null, $(this).attr('href'));
        });
        $('[data-toggle="tooltip"]').tooltip();

        init();

        //$(function () {
        //    $('[data-toggle="tooltip"]').tooltip();
        //});


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
        const username = urlParams.get('user');
        const regcode = urlParams.get('regcode');
        const forgotPW = urlParams.get('pwuser');
                
        var success = false;
        if (username !== null && regcode !== null) {

            success = login.CompleteRegistration(username, regcode);
            if (success === true) {
                // always need to login, 
                $('#loginModal').modal();
                // switch straight to ridestab
                $(".navbar-nav a[href=#rides-tab]").tab('show');
            }
        }
        else if (forgotPW !== null && regcode !== null) {
            login.ResetAccount(forgotPW);


        }
        else {
          
            // always need to login, 
       //     $('#loginModal').modal();
            // switch straight to rides tab
            rideData.CreateLists();
            $(".navbar-nav a[href=#rides-tab]").tab('show');

        }

    });
    $(document).click(function (e) {
        var popover = $(e.target).is('.has-popover');
        if (!popover) {
            RideList.clearPopovers(-1);
        }
        lastClickTime = new Date();
    });
})();
