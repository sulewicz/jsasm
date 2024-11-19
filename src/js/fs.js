jsasm = self.jsasm || {};
jsasm.FS = (function () {
    var samples = {
        "[Sample] Fill memory 1 to 40": "MOV R0,40\nMOV R1,R0\nSUB R1,1\nMOV @R1,R0\nSUB R0,1\nJNZ 2",
        "[Sample] Add 5 to 5": "MOV R0,5\nADD R0,5",
    };
    var sample_entries = Object.keys(samples);

    var FS = function () {
        if (!(this instanceof arguments.callee)) {
            return new arguments.callee();
        }
        var t = this;
        t.deserialize();
    };

    FS.prototype = {
        serialize: function () {
            var t = this;
            var payload = {
                content: t.content,
                latest_entry: t.latest_entry,
            };
            window.localStorage.setItem("payload", JSON.stringify(payload));
        },

        deserialize: function () {
            var t = this;
            var payloadStr = window.localStorage.getItem("payload");
            if (!payloadStr) {
                t.content = { ...samples };
                t.entries = Object.keys(t.content).sort();
                t.latest_entry = t.entries[0];
                t.serialize();
            } else {
                var payload = JSON.parse(payloadStr);
                t.content = payload.content;
                t.entries = Object.keys(t.content).sort();
                t.latest_entry = payload.latest_entry;
            }
        },

        reset: function () {
            var t = this;
            t.content = { ...samples };
            t.entries = Object.keys(t.content).sort();
            t.latest_entry = t.entries[0];
            t.serialize();
        },

        list: function () {
            var t = this;
            return [...t.entries];
        },

        exists: function (name) {
            var t = this;
            if (t.content.hasOwnProperty(name)) {
                return true;
            }
            return false;
        },

        load: function (name) {
            var t = this;
            t.latest_entry = name;
            t.serialize();
            return {
                name: name,
                content: t.content[name],
            };
        },

        save: function (name, content) {
            var t = this;
            if (sample_entries.indexOf(name) >= 0) {
                return;
            }

            t.content[name] = content;
            t.entries = Object.keys(t.content).sort();
            t.latest_entry = name;
            t.serialize();
        },

        delete: function (name) {
            var t = this;
            if (sample_entries.indexOf(name) >= 0) {
                return;
            }

            delete t.content[name];
            t.entries = Object.keys(t.content).sort();
            if (t.latest_entry == name) {
                t.latest_entry = t.entries[0];
            }
            t.serialize();
        },

        load_latest: function () {
            var t = this;
            return t.load(t.latest_entry);
        },

        save_latest: function (content) {
            var t = this;
            t.save(t.latest_entry, content);
        },
    };

    return FS;
})();
