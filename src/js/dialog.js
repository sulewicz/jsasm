import Swal from "sweetalert2";

const commonDialogParams = {
    buttonsStyling: false,
    heightAuto: false,
    customClass: {
        popup: "dialog-popup",
        confirmButton: "button",
        loader: "loader",
    },
};

const Dialog = {
    showError: async function (msg) {
        await Swal.fire({
            title: "Error!",
            text: msg,
            confirmButtonText: "OK",
            ...commonDialogParams,
        });
    },

    showInfo: async function (msg) {
        await Swal.fire({
            title: "",
            text: msg,
            confirmButtonText: "OK",
            ...commonDialogParams,
        });
    },

    showTextPrompt: async function (msg, cancelLabel, confirmLabel) {
        let result = await Swal.fire({
            title: "",
            text: msg,
            confirmButtonText: confirmLabel || "OK",
            input: "text",
            showCancelButton: true,
            cancelButtonText: cancelLabel || "Cancel",
            inputValidator: (value) => {
                if (value.trim().length == 0) {
                    return "Please enter a valid text!";
                }
            },
            ...commonDialogParams,
        });
        if (result.isConfirmed) {
            return result.value;
        } else {
            return null;
        }
    },

    showIntegerPrompt: async function (msg, cancelLabel, confirmLabel) {
        let result = await Swal.fire({
            title: "",
            text: msg,
            confirmButtonText: confirmLabel || "OK",
            input: "text",
            showCancelButton: true,
            cancelButtonText: cancelLabel || "Cancel",
            inputPlaceholder: "Type a number...",
            inputValidator: (value) => {
                if (value.length === 0 || isNaN(value) || !Number.isInteger(Number(value))) {
                    return "Please enter a valid integer number!";
                }
            },
            ...commonDialogParams,
        });
        if (result.isConfirmed) {
            return Number(result.value);
        } else {
            return null;
        }
    },

    showBooleanPrompt: async function (msg, cancelLabel, confirmLabel) {
        let result = await Swal.fire({
            title: "",
            text: msg,
            confirmButtonText: confirmLabel || "Yes",
            showCancelButton: true,
            cancelButtonText: cancelLabel || "Cancel",
            ...commonDialogParams,
        });
        if (result.isConfirmed) {
            return true;
        } else {
            return false;
        }
    },

    showLoading: function (msg) {
        Swal.fire({
            title: "",
            text: msg,
            allowEscapeKey: false,
            allowOutsideClick: false,
            showConfirmButton: false,
            showLoaderOnConfirm: true,
            ...commonDialogParams,
        });
        Swal.showLoading();
    },

    hide: function () {
        Swal.close();
    },
};

module.exports = {
    Dialog,
};
