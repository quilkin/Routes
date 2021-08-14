/*global bootbox*/

var qPopup = (function () {

    "use strict";

    var qPopup = {},
        popupCount = 0,

        checkpopups = function () {
            if (popupCount > 5) {
                bootbox.hideAll();
                window.alert("Too many popups?");
                popupCount = 0;
            }
            ++popupCount;
            
        };

    var lastAlert = null;
    qPopup.Alert = function (alertstr, timeout) {
        var alert, timer = null;

        checkpopups();
        if (alertstr === lastAlert)
            return;
        lastAlert = alertstr;
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

    qPopup.Confirm = function (message, question, yesfunc, nofunc, timeout) {
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
           // callback: yesfunc
        });
        if (timeout !== null) {
            if (timeout > 0) {
                timer = window.setTimeout(function () {
                    confirm.modal('hide');
                    yesfunc;
                }, timeout * 1000);
            }
            else {
                timer = window.setTimeout(function () {
                    confirm.modal('hide');
                    nofunc;
                }, -timeout * 1000);
            }

        }
        confirm.on('hidden.bs.modal', function (e) {
            --popupCount;
            window.clearTimeout(timer);
        });
    };

    qPopup.Choose2 = function (message, question, option1, option2, chooseCallback, timeout) {
        var confirm, timer = null;
        checkpopups();
        confirm = bootbox.prompt({
            title: message,
            message: question,
            inputType: 'radio',
            inputOptions: [
                {
                    text: option1,
                    value: '1'
                },
                {
                    text: option2,
                    value: '2'
                }

            ],
            callback: function (result) {
                chooseCallback(result);
            }

        });

        if (timeout !== null) {

            timer = window.setTimeout(function () {
                confirm.modal('hide');
                null;
            }, timeout * 1000);


        }
        confirm.on('hidden.bs.modal', function (e) {
            --popupCount;
            window.clearTimeout(timer);
        });
    };

    return qPopup;
}());


