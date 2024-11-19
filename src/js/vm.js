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
};

let binary_op = function (operator, args) {
    if (args.length !== 2) {
        this.ret.error = "Incorrect number of arguments";
    } else {
        var op1, op2;
        if ((op1 = this.getval(args[0])) == null || (op2 = this.getval(args[1])) == null) {
            return;
        } else {
            this.setval(args[0], ~~eval(op1 + operator + op2));
        }
    }
};

let jump = function (cond, args) {
    var t = this,
        line = 0 | args[0];
    if (!isFinite(args[0]) || line < 0 || line >= this.code.length) {
        this.ret.error = "Incorrect instruction location";
        return;
    }
    if (cond == null || eval(this.last_val + cond + "0")) {
        this.ret.line = line;
    }
};

let COMMANDS = {
    mov(args) {
        if (args.length !== 2) {
            this.ret.error = "Incorrect number of arguments";
        } else {
            var val = this.getval(args[1]);
            if (val == null) return;
            this.setval(args[0], val);
        }
    },

    add: binary_op.curry("+"),
    sub: binary_op.curry("-"),
    mul: binary_op.curry("*"),
    div: binary_op.curry("/"),

    jmp: jump.curry(null),
    jz: jump.curry("=="),
    jnz: jump.curry("!=="),
    jg: jump.curry(">"),
    jng: jump.curry("<="),
    jl: jump.curry("<"),
    jnl: jump.curry(">="),
};

class VM {
    constructor() {
        this.reset();
    }

    init(code) {
        this.code = code.split("\n");
        this.initialized = true;
    }

    run() {
        var ret;
        while (this.line < this.code.length) {
            ret = this.step();
            if (ret.error) {
                break;
            }
        }
        return ret;
    }

    reset() {
        this.initialized = false;
        this.last_val = 0;
        this.line = -1;
        this.code = null;
        this.memory = [];
        for (var i = 0; i < MEM_SIZE; i++) {
            this.memory.push(0);
        }
        this.regs = [];
        for (var i = 0; i < REG_SIZE; i++) {
            this.regs.push(0);
        }
    }

    step() {
        var ret = (this.ret = {});
        if (this.line >= this.code.length) {
            ret.end = true;
        } else if (this.line >= 0) {
            this.process(this.code[this.line], this.line);
            if (ret.line !== undefined) {
                this.line = ret.line;
            }
            if (this.line >= this.code.length) {
                ret.end = true;
            }
        } else {
            this.line++;
            ret = { line: this.line };
        }
        return ret;
    }

    process(line, no) {
        var ret = this.ret;
        line = line.trim();
        if (line.length > 0 && line[0] !== "#") {
            var line_parts = line.split(" ");
            if (line_parts.length !== 2) {
                ret.error = "Incorrect instruction format";
            } else {
                var command = line_parts[0].toLowerCase();
                var args = line_parts[1].split(",");
                if (!COMMANDS[command]) {
                    ret.error = "Unknown instruction " + command;
                } else {
                    COMMANDS[command].call(this, args);
                }
            }
        }

        if (ret.line === undefined) {
            ret.line = ret.error ? no : no + 1;
        }
    }

    getval(argument) {
        var idx;
        if (argument.indexOf("@R") === 0) {
            idx = this.get_reg_mem_index(argument);
            if (idx == null) return null;
            return this.memory[idx];
        } else if (argument.indexOf("#") === 0) {
            idx = this.get_mem_index(argument);
            if (idx == null) return null;
            return this.memory[idx];
        } else if (argument.indexOf("R") === 0) {
            idx = this.get_reg_index(argument);
            if (idx == null) return null;
            return this.regs[idx];
        } else {
            if (isFinite(argument)) {
                return 0 | argument;
            } else {
                this.ret.error = "Incorrect format of constant " + argument;
                return null;
            }
        }
    }

    setval(argument, value) {
        var idx;
        if (argument.indexOf("@R") === 0) {
            idx = this.get_reg_mem_index(argument);
            if (idx == null) return;
            this.memory[idx] = value;
            this.ret.mem = idx;
        } else if (argument.indexOf("#") === 0) {
            idx = this.get_mem_index(argument);
            if (idx == null) return;
            this.memory[idx] = value;
            this.ret.mem = idx;
        } else if (argument.indexOf("R") === 0) {
            idx = this.get_reg_index(argument);
            if (idx == null) return;
            this.regs[idx] = value;
            this.ret.reg = idx;
        } else {
            this.ret.error = "Incorrect address: " + argument;
            return;
        }
        this.last_val = value;
    }

    get_mem_index(argument) {
        var ret = 0 | argument.substr(1);
        if (ret < 0 || ret >= MEM_SIZE) {
            this.ret.error = "Incorrect address: " + argument;
            return null;
        }
        return ret;
    }

    get_reg_mem_index(argument) {
        var ret = this.get_reg_index(argument.substr(1));
        if (ret == null) return null;
        ret = this.regs[ret];
        if (ret < 0 || ret >= MEM_SIZE) {
            this.ret.error = "Incorrect address: " + ret + ", in register: " + argument;
            return null;
        }
        return ret;
    }

    get_reg_index(argument) {
        var ret = 0 | argument.substr(1);
        if (ret < 0 || ret >= REG_SIZE) {
            this.ret.error = "Incorrect register: " + argument;
            return null;
        }
        return ret;
    }
}

module.exports = {
    VM,
};
