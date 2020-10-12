﻿

var login = (function () {
    "use strict";

    var login = {},
        role,
        id,
        username,
        //needSensorList = true,
        UserRoles = { None: 0, Viewer: 1, SiteAdmin: 2, FullAdmin: 3 };

    login.Role = function () { return role; };
    login.ID = function () { return id; };
    login.loggedIn = function () { return (role > UserRoles.None); };
    login.User = function () { return username; };
    

    function checkPreAuth() {
        //   comment out temporarily to test sign-up

        var form = $("#form-signin");
        if (window.localStorage.username !== undefined && window.localStorage.password !== undefined) {
            $("#username", form).val(window.localStorage.username);
            $("#password", form).val(window.localStorage.password);
            //handleLogin();
        }
    }

    function checkRole() {
        if (role < UserRoles.SiteAdmin) {
            popup.Alert("To access this function, please request site-level authorisation by emailing 'admin@quilkin.co.uk'");
            return false;
        }
        return true;
    }

    ///
    // Logged in successfully, maybe create a list of sensors that can be displayed
    ///
    function loggedInOK() {
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

        $('#loginModal').modal('hide');
        // switch to web data tab
        $(".navbar-nav a[href=#home]").tab('show');
        //if (needSensorList) {

        //}
    }

    function handleLogin() {
        var form, u, p, remember, creds;

        form = $("#form-signin");
        u = $("#username", form).val();
        p = $("#password", form).val();
        remember = $("#remember").is(':checked');



        role = 0;

        if (u !== '' && p !== '') {
            creds = { name: u, pw: p, email: "", code: 0 };

            bleData.myJson('Login', "POST", creds, function (res) {
                if (res.id > 0) {
                    role = res.role;
                    id = res.id;
                    username = res.name;
                    //if (userRole < 2)
                    //    $(".adminonly").prop("disabled", true);
                    //store
                    if (remember) {
                        window.localStorage.username = u;
                        window.localStorage.password = p;
                    }
                    loggedInOK();

                } else {
                    popup.Alert("Invalid username or password");
                }
                $("#button-signin").removeAttr("disabled");

            }, true, null);

        } else {
            popup.Alert("You must enter a username and password");
            $("#button-signin").removeAttr("disabled");
        }
        return false;
    }


    function handleSignup() {
        var form, u, p1, p2, e, c, creds;

        form = $("#form-register");
        //disable the button so we can't resubmit while we wait
        $("#button-register", form).attr("disabled", "disabled");
        u = $("#username1", form).val();
        p1 = $("#password1", form).val();
        p2 = $("#password2", form).val();
        e = $("#email1", form).val();
        c = $("#code", form).val();
        if (c === undefined || c === '') { c = 0; }

        if (p1 !== p2) {
            popup.Alert("Passwords do not match");
            $("#button-register").removeAttr("disabled");
            return false;
        }
        if (u.length > 8 || u.includes(' ')) {
            popup.Alert("User name must be 8 characters or less, and no spaces");
            $("#button-register").removeAttr("disabled");
            return false;

        }

        if (u !== '' && p1 === p2 && p1 !== '' && e !== '') {
            creds = { name: u, pw: p1, email: e, code: c };
            bleData.myJson('Signup', "POST", creds, function (res) {
                popup.Alert(res);
                $("#button-register").removeAttr("disabled");
                if (res.substring(0, 2) === "OK") {
                    $("#code").show();
                    //$("#lblCode").show();
                }
                if (res.substring(0, 9) === "Thank you")           //"Thank you, you have now registered"
                {
                    role = UserRoles.Viewer;
                    var creds = { name: u, pw: p1, email: "", code: 0 };

                    bleData.myJson('Login', "POST", creds, function (res) {
                        if (res.id > 0) {
                            role = res.role;
                            id = res.id;
                            username = res.name;
                            loggedInOK();

                        } else {
                            popup.Alert("Invalid username or password");
                        }
                        
                    }, true, null);

                    loggedInOK();
                }
            }, true, null);

        } else {
            popup.Alert("You must enter a username, password and valid email address");
            $("#button-register").removeAttr("disabled");
        }
        return false;
    }
    login.Login = function () {
        
        if (role === undefined || role === UserRoles.None) {
            $("#form-signin").on("submit", handleLogin);
            $("#form-register").on("submit", handleSignup);
            //$("#button-signin").on("click", function () {
            //    //var $btn = $(this).button('loading');
            //    handleLogin();
            //    //setTimeout(function () {
            //    //      handleLogin($btn);
            //    //}, 100);
            //})
            //$("#button-register").on("click", function () {
            //    var $btn = $(this).button('loading');
            //    setTimeout(function () { handleSignup($btn); }, 100);
            //})
            checkPreAuth();

        }
        else {
            role = UserRoles.None;
            $("#logIn").text("Log In");
        }
    };
    login.GetUserName = function (id) {

    };

    return login;
}());