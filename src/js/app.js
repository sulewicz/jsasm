import { VM } from "./vm.js";
import { UI } from "./ui.js";
import { FS } from "./fs.js";

window.onload = (function () {
    return function () {
        let ui = new UI(new VM(), new FS());
    };
})();
