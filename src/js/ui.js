jsasm = self.jsasm || {};
jsasm.ui = (function () {
    var cm,
        vm,
        runBtn,
        stepBtn,
        resetBtn,
        curReg = -1,
        curMem = -1,
        curLine = -1,
        errLine = -1,
        memCells,
        regCells,
        errorCell;
    var fs, newBtn, deleteBtn, clearStorageBtn, fileSelect;
    var STEP_TIMEOUT = 100;
    function init(_vm, _fs) {
        fs = _fs;
        vm = _vm;
        cm = CodeMirror(document.getElementById("editor"), { firstLineNumber: 0, lineNumbers: true, mode: "z80" });
        runBtn = document.getElementById("run_btn");
        runBtn.addEventListener("click", run);
        stepBtn = document.getElementById("step_btn");
        stepBtn.addEventListener("click", step);
        resetBtn = document.getElementById("reset_btn");
        resetBtn.disabled = "disabled";
        resetBtn.addEventListener("click", reset);
        memCells = document.getElementById("memory").getElementsByTagName("td");
        regCells = document.getElementById("registers").getElementsByTagName("td");
        errorCell = document.getElementById("error");
        newBtn = document.getElementById("new_btn");
        newBtn.addEventListener("click", new_file);
        deleteBtn = document.getElementById("delete_btn");
        deleteBtn.addEventListener("click", delete_file);
        clearStorageBtn = document.getElementById("clear_storage_btn");
        clearStorageBtn.addEventListener("click", clear_storage);
        fileSelect = document.getElementById("file_select");
        reload_filesystem();
        fileSelect.addEventListener("change", file_changed);
        cm.on("change", content_changed);
    }

    function reset() {
        resetBtn.disabled = "disabled";
        stepBtn.disabled = "";
        runBtn.disabled = "";
        newBtn.disabled = "";
        deleteBtn.disabled = "";
        clearStorageBtn.disabled = "";
        fileSelect.disabled = "";
        vm.reset();
        refresh();
    }

    function step() {
        if (!vm.initialized) {
            vm.init(cm.getValue());
            resetBtn.disabled = "";
            runBtn.disabled = "disabled";
            newBtn.disabled = "disabled";
            deleteBtn.disabled = "disabled";
            clearStorageBtn.disabled = "disabled";
            fileSelect.disabled = "disabled";
        }
        var ret = vm.step();
        if (ret.end || ret.error) {
            resetBtn.disabled = "";
            stepBtn.disabled = "disabled";
            runBtn.disabled = "disabled";
        }
        refresh(ret);
    }

    function new_file() {
        var name = prompt("Provide file name:");
        if (!name) {
            return;
        }
        if (fs.exists(name)) {
            alert("File already exists!");
            return;
        }
        fs.save(name, "");
        reload_filesystem();
    }

    function delete_file() {
        if (confirm("Are you sure you want to delete the current file?")) {
            fs.delete(fileSelect.value);
        }
        reload_filesystem();
    }

    function clear_storage() {
        if (confirm("Are you sure you want to clear your local storage and all created files?")) {
            fs.reset();
            reload_filesystem();
        }
    }

    function file_changed(e) {
        var name = e.target.value;
        cm.setValue(fs.load(name).content);
    }

    function reload_filesystem() {
        fileSelect.options.length = 0;
        fs.list().forEach((element) => {
            fileSelect.appendChild(new Option(element, element));
        });
        var latest = fs.load_latest();
        fileSelect.value = latest.name;
        cm.setValue(latest.content);
    }

    function content_changed(e) {
        fs.save_latest(cm.getValue());
    }

    function run() {
        vm.reset();
        vm.init(cm.getValue());
        resetBtn.disabled = "";
        stepBtn.disabled = "disabled";
        runBtn.disabled = "disabled";
        newBtn.disabled = "disabled";
        deleteBtn.disabled = "disabled";
        clearStorageBtn.disabled = "disabled";
        fileSelect.disabled = "disabled";
        (function () {
            if (vm.initialized) {
                var ret = vm.step();
                refresh(ret);
                if (ret.end || ret.error) {
                    resetBtn.disabled = "";
                    stepBtn.disabled = "disabled";
                    runBtn.disabled = "disabled";
                } else {
                    setTimeout(arguments.callee, STEP_TIMEOUT);
                }
            }
        })();
    }

    function refresh(spec) {
        errorCell.innerHTML = "";
        errorCell.style.display = "none";
        if (curLine >= 0) {
            cm.removeLineClass(curLine, "background", "curLine");
            curLine = -1;
        }
        if (errLine >= 0) {
            cm.removeLineClass(errLine, "background", "errLine");
            errLine = -1;
        }
        if (curReg >= 0) {
            regCells[curReg].className = "";
            curReg = -1;
        }
        if (curMem >= 0) {
            memCells[curMem].className = "";
            curMem = -1;
        }
        if (spec) {
            if (spec.line >= 0 && !spec.end) {
                if (spec.error) {
                    errorCell.style.display = "inline-block";
                    errorCell.innerHTML = spec.error;
                    errLine = spec.line;
                    cm.addLineClass(errLine, "background", "errLine");
                } else {
                    curLine = spec.line;
                    cm.addLineClass(curLine, "background", "curLine");
                }
            }
            if (spec.reg >= 0) {
                curReg = spec.reg;
                regCells[curReg].innerHTML = vm.regs[curReg];
                regCells[curReg].className = "highlight";
            }
            if (spec.mem >= 0) {
                curMem = spec.mem;
                memCells[curMem].innerHTML = vm.memory[curMem];
                memCells[curMem].className = "highlight";
            }
        } else {
            for (var i = 0, l = vm.memory.length; i < l; i++) {
                memCells[i].innerHTML = vm.memory[i];
            }
            for (var i = 0, l = vm.regs.length; i < l; i++) {
                regCells[i].innerHTML = vm.regs[i];
            }
        }
        cm.refresh();
    }

    return {
        init: init,
    };
})();
