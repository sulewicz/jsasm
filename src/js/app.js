import { VM } from "./vm.js";

window.onload = (function () {
    return function () {
        jsasm.ui.init(new VM(), new jsasm.FS());
    };
})();
