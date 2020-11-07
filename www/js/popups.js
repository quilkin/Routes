/*global bootbox*/

var popup = (function () {

    "use strict";

    var popup = {},
        popupCount = 0,
        yesfunc = function () {
            console.log("popup yes");
        },
        nofunc = function () {
            console.log("popup no");
        },
        checkpopups = function () {
            if (popupCount > 5) {
                window.alert("Too many popups?");
                popupCount = 0;
            }
            ++popupCount;
        };


    popup.Alert = function (alertstr, timeout) {
        var alert, timer = null;

        checkpopups();
        alert = bootbox.alert(alertstr);

        if (timeout !== null) {
            if (timeout > 0) {
                timer = window.setTimeout(function () { alert.modal('hide'); }, timeout * 1000);
            }
        }
        alert.on('hidden.bs.modal', function (e) {
            --popupCount;
            window.clearTimeout(timer);
        });

    };

    popup.Confirm = function (message, question, yesfunc, nofunc, timeout) {
        var confirm, timer = null;
        checkpopups();
        confirm = bootbox.dialog({
            message: message,
            title: question,
            buttons: {
                yes: {
                    label: "Yes",
                    className: "btn-success",
                    callback: yesfunc
                },
                no: {
                    label: "No",
                    className: "btn-default",
                    callback: nofunc
                }
            }
        });
        if (timeout !== null) {
            if (timeout > 0) {
                timer = window.setTimeout(function () {
                    confirm.modal('hide');
                    yesfunc();
                }, timeout * 1000);
            }
            else {
                timer = window.setTimeout(function () {
                    confirm.modal('hide');
                    nofunc();
                }, -timeout * 1000);
            }

        }
        confirm.on('hidden.bs.modal', function (e) {
            --popupCount;
            window.clearTimeout(timer);
        });
    };

    return popup;
}());


