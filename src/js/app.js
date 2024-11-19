import { VM } from "./vm.js";
import { UI } from "./ui.js";

window.onload = (function () {
    return function () {
        let ui = new UI(new VM(), new jsasm.FS());
    };
})();
