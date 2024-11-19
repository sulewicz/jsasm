import { Dialog } from "./dialog.js";

var STEP_TIMEOUT = 100;

class UI {
    #cm;
    #vm;
    #runBtn;
    #stepBtn;
    #resetBtn;
    #curReg = -1;
    #curMem = -1;
    #curLine = -1;
    #errLine = -1;
    #memCells;
    #regCells;
    #errorCell;
    #fs;
    #newBtn;
    #deleteBtn;
    #clearStorageBtn;
    #fileSelect;

    constructor(_vm, _fs) {
        this.#fs = _fs;
        this.#vm = _vm;
        this.#cm = CodeMirror(document.getElementById("editor"), { firstLineNumber: 0, lineNumbers: true, mode: "z80" });
        this.#runBtn = document.getElementById("run_btn");
        this.#runBtn.addEventListener("click", this.#run.bind(this));
        this.#stepBtn = document.getElementById("step_btn");
        this.#stepBtn.addEventListener("click", this.#step.bind(this));
        this.#resetBtn = document.getElementById("reset_btn");
        this.#resetBtn.disabled = "disabled";
        this.#resetBtn.addEventListener("click", this.#reset.bind(this));
        this.#memCells = document.getElementById("memory").getElementsByTagName("td");
        this.#regCells = document.getElementById("registers").getElementsByTagName("td");
        this.#errorCell = document.getElementById("error");
        this.#newBtn = document.getElementById("new_btn");
        this.#newBtn.addEventListener("click", this.#new_file.bind(this));
        this.#deleteBtn = document.getElementById("delete_btn");
        this.#deleteBtn.addEventListener("click", this.#delete_file.bind(this));
        this.#clearStorageBtn = document.getElementById("clear_storage_btn");
        this.#clearStorageBtn.addEventListener("click", this.#clear_storage.bind(this));
        this.#fileSelect = document.getElementById("file_select");
        this.#reload_filesystem();
        this.#fileSelect.addEventListener("change", this.#file_changed.bind(this));
        this.#cm.on("change", this.#content_changed.bind(this));
    }

    #reset() {
        this.#resetBtn.disabled = "disabled";
        this.#stepBtn.disabled = "";
        this.#runBtn.disabled = "";
        this.#newBtn.disabled = "";
        this.#deleteBtn.disabled = "";
        this.#clearStorageBtn.disabled = "";
        this.#fileSelect.disabled = "";
        this.#vm.reset();
        this.#refresh();
    }

    #step() {
        if (!this.#vm.initialized) {
            this.#vm.init(this.#cm.getValue());
            this.#resetBtn.disabled = "";
            this.#runBtn.disabled = "disabled";
            this.#newBtn.disabled = "disabled";
            this.#deleteBtn.disabled = "disabled";
            this.#clearStorageBtn.disabled = "disabled";
            this.#fileSelect.disabled = "disabled";
        }
        var ret = this.#vm.step();
        if (ret.end || ret.error) {
            this.#resetBtn.disabled = "";
            this.#stepBtn.disabled = "disabled";
            this.#runBtn.disabled = "disabled";
        }
        this.#refresh(ret);
    }

    async #new_file() {
        var name = await Dialog.showTextPrompt("Provide file name:");
        if (!name) {
            return;
        }
        name = name.trim();
        if (this.#fs.exists(name)) {
            await Dialog.showError("File already exists!");
            return;
        }
        this.#fs.save(name, "");
        this.#reload_filesystem();
    }

    async #delete_file() {
        if (await Dialog.showBooleanPrompt("Are you sure you want to delete the current file?")) {
            this.#fs.delete(this.#fileSelect.value);
        }
        this.#reload_filesystem();
    }

    async #clear_storage() {
        if (await Dialog.showBooleanPrompt("Are you sure you want to clear your local storage and all created files?")) {
            this.#fs.reset();
            this.#reload_filesystem();
        }
    }

    #file_changed(e) {
        var name = e.target.value;
        this.#cm.setValue(this.#fs.load(name).content);
    }

    #reload_filesystem() {
        this.#fileSelect.options.length = 0;
        this.#fs.list().forEach((element) => {
            this.#fileSelect.appendChild(new Option(element, element));
        });
        var latest = this.#fs.load_latest();
        this.#fileSelect.value = latest.name;
        this.#cm.setValue(latest.content);
    }

    #content_changed(e) {
        this.#fs.save_latest(this.#cm.getValue());
    }

    #run() {
        this.#vm.reset();
        this.#vm.init(this.#cm.getValue());
        this.#resetBtn.disabled = "";
        this.#stepBtn.disabled = "disabled";
        this.#runBtn.disabled = "disabled";
        this.#newBtn.disabled = "disabled";
        this.#deleteBtn.disabled = "disabled";
        this.#clearStorageBtn.disabled = "disabled";
        this.#fileSelect.disabled = "disabled";
        this.#loop();
    }

    #loop() {
        if (this.#vm.initialized) {
            var ret = this.#vm.step();
            this.#refresh(ret);
            if (ret.end || ret.error) {
                this.#resetBtn.disabled = "";
                this.#stepBtn.disabled = "disabled";
                this.#runBtn.disabled = "disabled";
            } else {
                setTimeout(this.#loop.bind(this), STEP_TIMEOUT);
            }
        }
    }

    #refresh(spec) {
        this.#errorCell.innerHTML = "";
        this.#errorCell.style.display = "none";
        if (this.#curLine >= 0) {
            this.#cm.removeLineClass(this.#curLine, "background", "curLine");
            this.#curLine = -1;
        }
        if (this.#errLine >= 0) {
            this.#cm.removeLineClass(this.#errLine, "background", "errLine");
            this.#errLine = -1;
        }
        if (this.#curReg >= 0) {
            this.#regCells[this.#curReg].className = "";
            this.#curReg = -1;
        }
        if (this.#curMem >= 0) {
            this.#memCells[this.#curMem].className = "";
            this.#curMem = -1;
        }
        if (spec) {
            if (spec.line >= 0 && !spec.end) {
                if (spec.error) {
                    this.#errorCell.style.display = "inline-block";
                    this.#errorCell.innerHTML = spec.error;
                    this.#errLine = spec.line;
                    this.#cm.addLineClass(this.#errLine, "background", "errLine");
                } else {
                    this.#curLine = spec.line;
                    this.#cm.addLineClass(this.#curLine, "background", "curLine");
                }
            }
            if (spec.reg >= 0) {
                this.#curReg = spec.reg;
                this.#regCells[this.#curReg].innerHTML = this.#vm.regs[this.#curReg];
                this.#regCells[this.#curReg].className = "highlight";
            }
            if (spec.mem >= 0) {
                this.#curMem = spec.mem;
                this.#memCells[this.#curMem].innerHTML = this.#vm.memory[this.#curMem];
                this.#memCells[this.#curMem].className = "highlight";
            }
        } else {
            for (var i = 0, l = this.#vm.memory.length; i < l; i++) {
                this.#memCells[i].innerHTML = this.#vm.memory[i];
            }
            for (var i = 0, l = this.#vm.regs.length; i < l; i++) {
                this.#regCells[i].innerHTML = this.#vm.regs[i];
            }
        }
        this.#cm.refresh();
    }
}

module.exports = {
    UI,
};
