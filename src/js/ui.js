jsasm = self.jsasm || {};
jsasm.ui = (function () {
    var cm, vm, fs, runBtn, stepBtn, resetBtn, curReg = -1, curMem = -1, curLine = -1, errLine = -1, memCells, regCells, errorCell;
    var STEP_TIMEOUT = 100;
    function init(_vm, _fs) {
        fs = _fs;
        vm = _vm;
        var current = fs.load_current();
        cm = CodeMirror(document.getElementById("editor"), { firstLineNumber: 0, lineNumbers: true, mode: 'z80', value: current.content });
        runBtn = document.getElementById("run_btn");
        runBtn.addEventListener('click', run);
        stepBtn = document.getElementById("step_btn");
        stepBtn.addEventListener('click', step);
        resetBtn = document.getElementById("reset_btn");
        resetBtn.disabled = "disabled";
        resetBtn.addEventListener('click', reset);
        memCells = document.getElementById("memory").getElementsByTagName("td");
        regCells = document.getElementById("registers").getElementsByTagName("td");
        errorCell = document.getElementById("error");
    }

    function reset() {
        resetBtn.disabled = "disabled";
        stepBtn.disabled = "";
        runBtn.disabled = "";
        vm.reset();
        refresh();
    }

    function step() {
        if (!vm.initialized) {
            vm.init(cm.getValue());
            resetBtn.disabled = "";
            runBtn.disabled = "disabled";
        }
        var ret = vm.step();
        if (ret.end || ret.error) {
            resetBtn.disabled = "";
            stepBtn.disabled = "disabled";
            runBtn.disabled = "disabled";
        }
        refresh(ret);
    }

    function run() {
        vm.reset();
        vm.init(cm.getValue());
        resetBtn.disabled = "";
        stepBtn.disabled = "disabled";
        runBtn.disabled = "disabled";
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
            cm.removeLineClass(curLine, 'background', 'curLine');
            curLine = -1;
        }
        if (errLine >= 0) {
            cm.removeLineClass(errLine, 'background', 'errLine');
            errLine = -1;
        }
        if (curReg >= 0) {
            regCells[curReg].className = '';
            curReg = -1;
        }
        if (curMem >= 0) {
            memCells[curMem].className = '';
            curMem = -1;
        }
        if (spec) {
            if (spec.line >= 0 && !spec.end) {
                if (spec.error) {
                    errorCell.style.display = "inline-block";
                    errorCell.innerHTML = spec.error;
                    errLine = spec.line;
                    cm.addLineClass(errLine, 'background', 'errLine');
                } else {
                    curLine = spec.line;
                    cm.addLineClass(curLine, 'background', 'curLine');
                }
            }
            if (spec.reg >= 0) {
                curReg = spec.reg;
                regCells[curReg].innerHTML = vm.regs[curReg];
                regCells[curReg].className = 'highlight';
            }
            if (spec.mem >= 0) {
                curMem = spec.mem;
                memCells[curMem].innerHTML = vm.memory[curMem];
                memCells[curMem].className = 'highlight';
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
        init: init
    }
})();
