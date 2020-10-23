

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
    // Logged in successfully
    ///
    function loggedInOK() {
        $("myTabContent").show();
        $("home").show();
        $("webdata").show();
        $("panel-setup").show();
        bleData.CreateLists();
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
        if (u.length > 10 || u.includes(' ')) {
            popup.Alert("User name must be 10 characters or less, and no spaces");
            $("#button-register").removeAttr("disabled");
            return false;

        }
        if (p1.length > 10 || p1.includes(' ')) {
            popup.Alert("Password must be 10 characters or less, and no spaces");
            $("#button-register").removeAttr("disabled");
            return false;

        }

        if (u !== '' && p1 === p2 && p1 !== ''  && e !== '') {
            creds = { name: u, pw: p1, email: e, code: c };
            bleData.myJson('Signup', "POST", creds, function (res) {
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

    login.CompleteRegistration = function (user, regcode,em) {
        console.log('Registration: ' + user + ' ' + regcode + ' ' + em);

        var creds = { name: user, code: regcode, email: em };
        var success = false;
        bleData.myJson('Register', "POST", creds, function (res) {
            if (res.substring(0, 9) === "Thank you")           //"Thank you, you have now registered"
            {
                //role = UserRoles.Viewer;
                //var creds = { name: u, pw: p1, email: "", code: 0 };

                //bleData.myJson('Login', "POST", creds, function (res) {
                //    if (res.id > 0) {
                //        role = res.role;
                //        id = res.id;
                //        username = res.name;
                //        loggedInOK();

                //    } else {
                //        popup.Alert("Invalid username or password");
                //    }

                //}, true, null);

                //loggedInOK();
                success = true;
                popup.Alert("Thank you, you can now log in");
 

            } else {
                popup.Alert("Invalid username , code or email");
            }

        }, false, null);
        return success;
    };

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