

var login = (function () {
    "use strict";

    const dummyEmail = 'do_not@change.me';

    var login = {},
        role,
        id,
        username,
        email,
        units,
        climbs,

        UserRoles = { None: 0, Viewer: 1, SiteAdmin: 2, FullAdmin: 3 };

    login.Role = function () { return role; };
    login.ID = function () { return id; };
    login.loggedIn = function () { return (role > UserRoles.None); };
    login.loggedOut = function () { return (role === UserRoles.None); };
    login.User = function () { return username; };
    login.Email = function () { return email; };
    login.setUser = function (u) { username = u; };
    login.LogOut = function () { logout(); };
    login.Units = function () { return units; };
    login.Climbs = function () { return climbs; };


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
            qPopup.Alert("To access this function, please request site-level authorisation by emailing 'admin@quilkin.co.uk'");
            return false;
        }
        return true;
    }

    ///
    // Logged in successfully
    ///
    function loggedInOK() {
        // get some preparory data from the DB
        //TCCrides.GetDatesOfRides();
        rideData.CreateLists();
        $('#loginModal').modal('hide');
        // switch to rides tab
        $(".navbar-nav a[href=#rides-tab]").tab('show');
        //add username to account dropdown button
        //if (username !== undefined) {
        //    $("#userName").html(username + ' <span class="caret"></span>');
        //}
        // may need to redo things done by logging out
        $("#logOut").html('<i class="fa fa-arrow-right"></i> Log Out');
        $("#account").prop('disabled', false);
        $("#setup-tab").attr('class', 'enabled');
        $('#rides-tab').tab('show');
        rideData.setCurrentTab('rides-tab');
    }

    function logout() {
        username = '';
        role = 0;
        TCCrides.CreateRideList(null);
        $("#logOut").html('<i class="fa fa-arrow-right"></i> Log In');
        $("#account").prop('disabled', true);
        $("#setup-tab").attr('class', 'disabled');
        $('#setup-tab').click(function (event) {
            if ($(this).hasClass('disabled')) {
                return false;
            }
        });
        qPopup.Alert("You are not logged in. Rides are still visible but you cannot join or create rides");

    }



    function handleLogin() {
        var form, u, p, remember, creds;

        form = $("#form-signin");
        u = $("#username", form).val();
        p = $("#password", form).val();
        remember = $("#remember").is(':checked');

         // prevent clicks while timer is downloading new data
         // see http://malsup.com/jquery/block/
            $(document).ajaxStart($.blockUI({ message: '<h4><img src="images/page-loader.gif" /> Just a moment...</h4>' })).ajaxStop($.unblockUI);


        role = 0;

        if (u !== '' && p !== '') {
            creds = { name: u, pw: p, email: "", code: 0 };

            rideData.myAjax('Login', "POST", creds, function (res) {
                if (res.id > 0) {
                    role = res.role;
                    id = res.id;
                    username = res.name;
                    email = res.email;
                    units = res.units;
                    climbs = res.climbs;
                    //if (userRole < 2)
                    //    $(".adminonly").prop("disabled", true);
                    //store
                    if (remember) {
                        window.localStorage.username = u;
                        window.localStorage.password = p;
                    }
                    if (role === 0) {
                        qPopup.Alert("You need to reply to your email to complete registration");
                    }
                    else
                        loggedInOK();

                } else {
                    qPopup.Alert("Invalid username or password");
                }
                $("#button-signin").removeAttr("disabled");

            });

        } else {
            qPopup.Alert("You must enter a username and password");
            $("#button-signin").removeAttr("disabled");
        }
        return false;
    }

    function checkdetails(u, p1, p2, blanksOK) {
        if (p1 !== p2) {
            qPopup.Alert("Passwords do not match");
            return false;
        }
        if (u.length > 10 || u.includes(' ')) {
            qPopup.Alert("User name must be 10 characters or less, and no spaces");
            return false;
        }
        if (blanksOK)
            return true;
        if (p1.length < 4 || p1.length > 10 || p1.includes(' ')) {
            qPopup.Alert("Password must be 4-10 characters and no spaces");
            return false;
        }

        return true;

    }

    function handleSignup() {
        var form, u, p1, p2, e, c, creds;

        // prevent clicks while timer is downloading new data
        // see http://malsup.com/jquery/block/
        $(document).ajaxStart($.blockUI({ message: '<h4><img src="images/page-loader.gif" /> Just a moment...</h4>' })).ajaxStop($.unblockUI);

        form = $("#form-register");
        //disable the button so we can't resubmit while we wait
        $("#button-register", form).attr("disabled", "disabled");
        u = $("#username1", form).val();
        p1 = $("#password1", form).val();
        p2 = $("#password2", form).val();
        e = $("#email1", form).val();
        c = $("#code", form).val();
        var km = $('input[name="units"]:checked').val();
        var climbing = $('input[name="climbs"]:checked').val();

        if (c === undefined || c === '') { c = 0; }

        if (checkdetails(u, p1, p2, false) === false) {
            $("#button-register").removeAttr("disabled");
            return false;
        }

        if (u !== '' && p1 === p2 && p1 !== ''  && e !== '') {
            creds = { name: u, pw: p1, email: e, code: c, units: km, climbs: climbing};
            rideData.myAjax('Signup', "POST", creds, function (res) {
                qPopup.Alert(res);
                $("#button-register").removeAttr("disabled");
                if (res.substring(0, 2) === "OK") {
                    $("#code").show();
                    //$("#lblCode").show();
                }

            });

        } else {
            qPopup.Alert("You must enter a usernameand valid email address");
            $("#button-register").removeAttr("disabled");
        }
        return false;
    }


    function handleAccount() {
        var form, u, p1, p2, e,  creds;

        form = $("#form-account");
        u = $("#username2", form).val();
        p1 = $("#password3", form).val();
        p2 = $("#password4", form).val();
        e = $("#email2", form).val();
        var km = $('input[name="units"]:checked').val();
        var climbing = $('input[name="climbs"]:checked').val();

        if (checkdetails(u, p1, p2, true) === false)
            return false;
        if (e === dummyEmail) {
            e = '';
        }
        var myid = id;
        creds = { id: myid, name: u, pw: p1, email: e, units: km , climbs: climbing};
        var success = false;
        rideData.myAjax('ChangeAccount', "POST", creds, function (res) {
           
            if (res.substring(0, 2) === "OK") {
                success = true;
                qPopup.Alert("Your details have been saved");
                //cancelAccount();
                username = u;
                if (e !== '')
                    email = e;
                $('#loginModal').modal();

            }
            else 
                qPopup.Alert(res);

        });


        return success;
    }
    function cancelSignIn() {

        $('#loginModal').modal('hide');
        // get some preparory data from the DB
        //TCCrides.GetDatesOfRides();
        rideData.CreateLists();
        // switch to 'all routes' tab

        $(".navbar-nav a[href=#routes-tab]").tab('show');
    //    $("#userName").html('Log In <span class="caret"></span>');
        logout();

    }
    function cancelRegister() {
        
        // get ready for next time
        $("#form-register").hide();
        $("#form-signin").show();
        cancelSignIn();
    }
    //function cancelAccount() {
    //    $('#accountModal').modal('hide');
    //}
    function handlePassword()
    {
        var form, email;

        form = $("#form-password");
        email = $("#email3", form).val();
        if (email !== '') {
            var success = false;
            rideData.myAjax('ForgetPassword', "POST", email, function (res) {
                success = true;
                $('#passwordModal').modal('hide');
                qPopup.Alert(res);

            });
        }
        return success;
    }
    function cancelPassword() {
        $('#passwordModal').modal('hide');
    }

    login.CompleteRegistration = function (user, regcode) {

        console.log('Registration: ' + user + ' ' + regcode + ' ');

        var creds = { name: user, code: regcode};
        var success = false;
        rideData.myAjax('Register', "POST", creds, function (res) {
            if (res.substring(0, 9) === "Thank you")           //"Thank you, you have now registered"
            {
                success = true;
                qPopup.Alert("Thank you, you can now log in");
             } else {
                qPopup.Alert("Invalid username , code or email");
            }

        });
        return success;
    };
    login.ResetAccount = function (user) {
        username = user;
        var success = false;
        // check that timeout hasn't expired
        rideData.myAjax('CheckTimeout', "POST", username, function (res) {
            
            if (res.substring(0, 2) === "OK")           
            {
                success = true;
                // remainder of res has login id
                var userID = res.substring(2);
                id = parseInt(userID);
                $('#accountModal').modal();
            } else {
                qPopup.Alert(res);
            }

        });
        return success;
    };
    login.Login = function () {
        
        if (role === undefined || role === UserRoles.None) {
            $("#form-signin").on("submit", handleLogin);
            $("#form-register").on("submit", handleSignup);
            
            checkPreAuth();

        }
        else {
            role = UserRoles.None;
            $("#logIn").text("Log In");
        }

    };


    $("#logOut").click(function () {
        console.log('logOut clicked');
        if (login.loggedOut()) {
            $('#loginModal').modal();
        }
        else {
            logout();
        }
    });
    $('#loginModal').on('shown.bs.modal', function (e) {
        $("#form-register").hide();
        $("#signin-cancel").on('click', cancelSignIn);
        $("#signin-register").on('click', function () {
            $("#form-register").show();
            $("#form-signin").hide();
            $("#register-cancel").on('click', cancelRegister);
        });
        $('#help2').click(function () {
            var win = window.open("Rides-signup.htm");
            win.focus();
        });
    });

    $("#form-account").on("submit", handleAccount);


    $("#account-cancel").on('click', function () {
        $('#routes-tab').tab('show');
        rideData.setCurrentTab('routes-tab');
    });

    login.setAccount = function () {
        //if (email === '')
        //    email = dummyEmail;
        $("#username2").attr("value", username);
        $("#email2").attr("value", email);
        $("#password3").attr("value", "");
        $("#password4").attr("value", "");
        $("#radioKm").prop('checked', units === 'k');
        $("#radioMile").prop('checked', units === 'm');
        $("#showClimbs").prop('checked', climbs > 0);
        $("#noShowClimbs").prop('checked', climbs === 0);

    };
    //$('#accountModal').on('shown.bs.modal', function (e) {

    //    if (email === '')
    //        email = dummyEmail;
    //    $("#username2").attr("value", username);
    //    $("#email2").attr("value", email);
    //    $("#radioKm").prop('checked', units === 'k');
    //    $("#radioMile").prop('checked', units === 'm');


    //});
    //$("#account").click(function () {

    //    $('#accountModal').modal();
    //});
    //$("#settings").click(function () {
    //    qPopup.Alert("not yet implemented, sorry");
    //});
    $("#signin-pw").click(function () {
        $('#passwordModal').modal();
    });
    $('#passwordModal').on('shown.bs.modal', function (e) {
        $("#form-password").on('submit', handlePassword);
        $("#password-cancel").on('click', cancelPassword);
    //    $("#password-ok").on('click', handlePassword);

    });
  //  $(document).on('submit', 'form-password', handlePassword);
    return login;
}());