jsasm = self.jsasm || {};
jsasm.FS = (function () {
    var samples = {
        "[Sample] Fill memory 1 to 40": "MOV R0,40\nMOV R1,R0\nSUB R1,1\nMOV @R1,R0\nSUB R0,1\nJNZ 2"
    };

    var FS = function () {
        if (!(this instanceof arguments.callee)) {
            return new arguments.callee();
        }
        var t = this;
        t.reload();
    }

    FS.prototype = {
        reload: function () {
            var t = this;
            t.content = {...samples};
            t.entries = Object.keys(t.content).sort();
            t.current_entry = t.entries[0];
        },

        list: function () {
            var t = this;
            return [...t.entries];
        },

        load: function (name) {
            // TODO
        },

        save: function (name, content) {
            // TODO
        },

        delete: function (name) {
            // TODO
        },

        load_current: function () {
            var t = this;
            return {
                "name": t.current_entry,
                "content": t.content[t.current_entry]
            }
        }
    };

    return FS;
})();