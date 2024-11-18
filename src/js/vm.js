jsasm = self.jsasm || {};
jsasm.VM = (function () {
    var MEM_SIZE = 40;
    var REG_SIZE = 4;

    function toArray(a) {
        return Array.prototype.slice.call(a);
    }

    Function.prototype.curry = function () {
        if (arguments.length < 1) {
            return this;
        }
        var func = this;
        var args = toArray(arguments);
        return function () {
            return func.apply(this, args.concat(toArray(arguments)));
        };
    }

    var binary_op = function (operator, args) {
        var t = this;
        if (args.length !== 2) {
            t.ret.error = "Incorrect number of arguments";
        } else {
            var op1, op2;
            if ((op1 = t.getval(args[0])) == null || (op2 = t.getval(args[1])) == null) {
                return;
            } else {
                t.setval(args[0], ~~eval(op1 + operator + op2));
            }
        }
    }

    var jump = function (cond, args) {
        var t = this, line = 0 | args[0];
        if (!isFinite(args[0]) || line < 0 || line >= t.code.length) {
            t.ret.error = "Incorrect instruction location";
            return;
        }
        if (cond == null || eval(t.last_val + cond + '0')) {
            t.ret.line = line;
        }
    }

    COMMANDS = {
        mov: function (args) {
            var t = this;
            if (args.length !== 2) {
                t.ret.error = "Incorrect number of arguments";
            } else {
                var val = t.getval(args[1]);
                if (val == null) return;
                t.setval(args[0], val);
            }
        },

        add: binary_op.curry('+'),
        sub: binary_op.curry('-'),
        mul: binary_op.curry('*'),
        div: binary_op.curry('/'),

        jmp: jump.curry(null),
        jz: jump.curry('=='),
        jnz: jump.curry('!=='),
        jg: jump.curry('>'),
        jng: jump.curry('<='),
        jl: jump.curry('<'),
        jnl: jump.curry('>=')
    };

    var VM = function () {
        if (!(this instanceof arguments.callee)) {
            return new arguments.callee();
        }
        var t = this;
        t.reset();
    }

    VM.prototype = {
        init: function (code) {
            var t = this;
            t.code = code.split('\n');
            t.initialized = true;
        },

        run: function () {
            var t = this, ret;
            while (t.line < t.code.length) {
                ret = t.step();
                if (ret.error) {
                    break;
                }
            }
            return ret;
        },

        reset: function () {
            var t = this;
            t.initialized = false;
            t.last_val = 0;
            t.line = -1;
            t.code = null;
            t.memory = [];
            for (var i = 0; i < MEM_SIZE; i++) {
                t.memory.push(0);
            }
            t.regs = [];
            for (var i = 0; i < REG_SIZE; i++) {
                t.regs.push(0);
            }
        },

        step: function () {
            var t = this, ret = (t.ret = {});
            if (t.line >= t.code.length) {
                ret.end = true;
            } else if (t.line >= 0) {
                t.process(t.code[t.line], t.line);
                if (ret.line !== undefined) {
                    t.line = ret.line;
                }
                if (t.line >= t.code.length) {
                    ret.end = true;
                }
            } else {
                t.line++;
                ret = { line: t.line };
            }
            return ret;
        },

        process: function (line, no) {
            var t = this, ret = t.ret;
            line = line.trim();
            if (line.length > 0 && line[0] !== '#') {
                var line_parts = line.split(' ');
                if (line_parts.length !== 2) {
                    ret.error = "Incorrect instruction format";
                } else {
                    var command = line_parts[0].toLowerCase();
                    var args = line_parts[1].split(',');
                    if (!COMMANDS[command]) {
                        ret.error = "Unknown instruction " + command;
                    } else {
                        COMMANDS[command].call(t, args);
                    }
                }
            }

            if (ret.line === undefined) {
                ret.line = (ret.error) ? no : no + 1;
            }
        },

        getval: function (argument) {
            var t = this, idx;
            if (argument.indexOf('@R') === 0) {
                idx = t.get_reg_mem_index(argument);
                if (idx == null) return null;
                return t.memory[idx];
            } else if (argument.indexOf('#') === 0) {
                idx = t.get_mem_index(argument);
                if (idx == null) return null;
                return t.memory[idx];
            } else if (argument.indexOf('R') === 0) {
                idx = t.get_reg_index(argument);
                if (idx == null) return null;
                return t.regs[idx];
            } else {
                if (isFinite(argument)) {
                    return 0 | argument;
                } else {
                    t.ret.error = "Incorrect format of constant " + argument;
                    return null;
                }
            }
        },

        setval: function (argument, value) {
            var t = this, idx;
            if (argument.indexOf('@R') === 0) {
                idx = t.get_reg_mem_index(argument);
                if (idx == null) return;
                t.memory[idx] = value;
                t.ret.mem = idx;
            } else if (argument.indexOf('#') === 0) {
                idx = t.get_mem_index(argument);
                if (idx == null) return;
                t.memory[idx] = value;
                t.ret.mem = idx;
            } else if (argument.indexOf('R') === 0) {
                idx = t.get_reg_index(argument);
                if (idx == null) return;
                t.regs[idx] = value;
                t.ret.reg = idx;
            } else {
                t.ret.error = "Incorrect address: " + argument;
                return;
            }
            t.last_val = value;
        },

        get_mem_index: function (argument) {
            var t = this, ret = 0 | argument.substr(1);
            if (ret < 0 || ret >= MEM_SIZE) {
                t.ret.error = "Incorrect address: " + argument;
                return null;
            }
            return ret;
        },

        get_reg_mem_index: function (argument) {
            var t = this, ret = t.get_reg_index(argument.substr(1));
            if (ret == null) return null;
            ret = t.regs[ret];
            if (ret < 0 || ret >= MEM_SIZE) {
                t.ret.error = "Incorrect address: " + ret + ", in register: " + argument;
                return null;
            }
            return ret;
        },

        get_reg_index: function (argument) {
            var t = this, ret = 0 | argument.substr(1);
            if (ret < 0 || ret >= REG_SIZE) {
                t.ret.error = "Incorrect register: " + argument;
                return null;
            }
            return ret;
        }

    };

    return VM;
})();
