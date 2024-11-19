class FS {
    static #samples = {
        "[Sample] Fill memory 1 to 40": "MOV R0,40\nMOV R1,R0\nSUB R1,1\nMOV @R1,R0\nSUB R0,1\nJNZ 2",
        "[Sample] Add 5 to 5": "MOV R0,5\nADD R0,5",
    };
    static #sample_entries = Object.keys(FS.#samples);
    #content;
    #entries;
    #latest_entry;

    constructor() {
        this.#deserialize();
    }

    #serialize() {
        var payload = {
            content: this.#content,
            latest_entry: this.#latest_entry,
        };
        window.localStorage.setItem("payload", JSON.stringify(payload));
    }

    #deserialize() {
        var payloadStr = window.localStorage.getItem("payload");
        if (!payloadStr) {
            this.#content = { ...FS.#samples };
            this.#entries = Object.keys(this.#content).sort();
            this.#latest_entry = this.#entries[0];
            this.#serialize();
        } else {
            var payload = JSON.parse(payloadStr);
            this.#content = payload.content;
            this.#entries = Object.keys(this.#content).sort();
            this.#latest_entry = payload.latest_entry;
        }
    }

    reset() {
        this.#content = { ...FS.#samples };
        this.#entries = Object.keys(this.#content).sort();
        this.#latest_entry = this.#entries[0];
        this.#serialize();
    }

    list() {
        return [...this.#entries];
    }

    exists(name) {
        if (this.#content.hasOwnProperty(name)) {
            return true;
        }
        return false;
    }

    load(name) {
        this.#latest_entry = name;
        this.#serialize();
        return {
            name: name,
            content: this.#content[name],
        };
    }

    save(name, content) {
        if (FS.#sample_entries.indexOf(name) >= 0) {
            return;
        }

        this.#content[name] = content;
        this.#entries = Object.keys(this.#content).sort();
        this.#latest_entry = name;
        this.#serialize();
    }

    delete(name) {
        if (FS.#sample_entries.indexOf(name) >= 0) {
            return;
        }

        delete this.#content[name];
        this.#entries = Object.keys(this.#content).sort();
        if (this.#latest_entry == name) {
            this.#latest_entry = this.#entries[0];
        }
        this.#serialize();
    }

    load_latest() {
        return this.load(this.#latest_entry);
    }

    save_latest(content) {
        this.save(this.#latest_entry, content);
    }
}

module.exports = {
    FS,
};
