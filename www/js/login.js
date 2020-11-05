

var login = (function () {
    "use strict";

    const dummyEmail = 'do_not@change.me';

    //const dropdownHtml1 = '<div class="dropdown"> <button class="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown">';
    //const dropdownHtml2 = '< span class="caret" ></span ></button > ' +
    //    '<ul class="dropdown-menu"><li><a href="#">HTML</a></li><li><a href="#">CSS</a></li><li><a href="#">JavaScript</a></li></ul></div>';
    var login = {},
        role,
        id,
        username,
        email,
        //needSensorList = true,;
        UserRoles = { None: 0, Viewer: 1, SiteAdmin: 2, FullAdmin: 3 };

    login.Role = function () { return role; };
    login.ID = function () { return id; };
    login.loggedIn = function () { return (role > UserRoles.None); };
    login.loggedOut = function () { return (role === UserRoles.None); };
    login.User = function () { return username; };
    login.Email = function () { return email; };
    login.setUser = function (u) { username = u; };


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
    // Logged in successfully
    ///
    function loggedInOK() {

        rideData.CreateLists();
        $('#loginModal').modal('hide');
        // switch to home tab
        $(".navbar-nav a[href=#home]").tab('show');
        //add username to account dropdown button
        if (username !== undefined) {
            $("#userName").html(username + ' <span class="caret"></span>');
        }
        // may need to redo things done by logging out
        $("#logOut").html('Log Out');
        $("#account").prop('disabled', false);
        $("#setup-tab").attr('class', 'enabled');

    }

    function logout() {
        username = '';
        role = 0;
        TCCrides.CreateRideList(null);
        $("#logOut").html('Log In');
        $("#account").prop('disabled', true);
        $("#setup-tab").attr('class', 'disabled');
        $('#setup-tab').click(function (event) {
            if ($(this).hasClass('disabled')) {
                return false;
            }
        });
        popup.Alert("You are not logged in. Rides are still visible but you cannot join or create rides");

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

            rideData.myJson('Login', "POST", creds, function (res) {
                if (res.id > 0) {
                    role = res.role;
                    id = res.id;
                    username = res.name;
                    email = res.email;
                    //if (userRole < 2)
                    //    $(".adminonly").prop("disabled", true);
                    //store
                    if (remember) {
                        window.localStorage.username = u;
                        window.localStorage.password = p;
                    }
                    if (role === 0) {
                        popup.Alert("You need to reply to your email to complete registration");
                    }
                    else
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

    function checkdetails(u, p1, p2, blanksOK) {
        if (p1 !== p2) {
            popup.Alert("Passwords do not match");
            return false;
        }
        if (u.length > 10 || u.includes(' ')) {
            popup.Alert("User name must be 10 characters or less, and no spaces");
            return false;
        }
        if (blanksOK)
            return true;
        if (p1.length < 4 || p1.length > 10 || p1.includes(' ')) {
            popup.Alert("Password must be 4-10 characters and no spaces");
            return false;
        }

        return true;

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

        if (checkdetails(u, p1, p2, false) === false) {
            $("#button-register").removeAttr("disabled");
            return false;
        }

        if (u !== '' && p1 === p2 && p1 !== ''  && e !== '') {
            creds = { name: u, pw: p1, email: e, code: c };
            rideData.myJson('Signup', "POST", creds, function (res) {
                popup.Alert(res);
                $("#button-register").removeAttr("disabled");
                if (res.substring(0, 2) === "OK") {
                    $("#code").show();
                    //$("#lblCode").show();
                }

            }, true, null);

        } else {
            popup.Alert("You must enter a usernameand valid email address");
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


        if (checkdetails(u, p1, p2, true) === false)
            return false;
        if (e === dummyEmail) {
            e = '';
        }
        var myid = id;
        creds = { id: myid, name: u, pw: p1, email: e };
        var success = false;
        rideData.myJson('ChangeAccount', "POST", creds, function (res) {
           
            if (res.substring(0, 2) === "OK") {
                success = true;
                popup.Alert("Your details have been saved");
                cancelAccount();
                username = u;
                if (e !== '')
                    email = e;
                $('#loginModal').modal();

            }
            else 
                popup.Alert(res);

        }, true, null);


        return success;
    }
    function cancelSignIn() {

        $('#loginModal').modal('hide');
        rideData.CreateLists();
        // switch to 'all routes' tab
        $(".navbar-nav a[href=#webdata-tab]").tab('show');
        $("#userName").html('Log In <span class="caret"></span>');
        logout();

    }
    function cancelRegister() {
        
        // get ready for next time
        $("#form-register").hide();
        $("#form-signin").show();
        cancelSignIn();
    }
    function cancelAccount() {
        $('#accountModal').modal('hide');
    }
    function handlePassword()
    {
        var form, email;

        form = $("#form-password");
        email = $("#email3", form).val();
        if (email !== '') {
            var success = false;
            rideData.myJson('ForgetPassword', "POST", email, function (res) {
                success = true;
                $('#passwordModal').modal('hide');
                popup.Alert(res);

            }, true, null);
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
        rideData.myJson('Register', "POST", creds, function (res) {
            if (res.substring(0, 9) === "Thank you")           //"Thank you, you have now registered"
            {
                success = true;
                popup.Alert("Thank you, you can now log in");
             } else {
                popup.Alert("Invalid username , code or email");
            }

        }, true, null);
        return success;
    };
    login.ResetAccount = function (user) {
        username = user;
        var success = false;
        // check that timeout hasn't expired
        rideData.myJson('CheckTimeout', "POST", username, function (res) {
            
            if (res.substring(0, 2) === "OK")           
            {
                success = true;
                // remainder of res has login id
                var userID = res.substring(2);
                id = parseInt(userID);
                $('#accountModal').modal();
            } else {
                popup.Alert(res);
            }

        }, true, null);
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
    });
    $('#accountModal').on('shown.bs.modal', function (e) {

        if (email === '')
            email = dummyEmail;
        $("#username2").attr("value", username);
        $("#email2").attr("value", email);
        $("#form-account").on("submit", handleAccount);
        $("#account-cancel").on('click', cancelAccount);

    });
    $("#account").click(function () {

        $('#accountModal').modal();
    });
    $("#settings").click(function () {
        popup.Alert("not yet implemented, sorry");
    });
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