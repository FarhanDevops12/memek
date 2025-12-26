export class VirtualFS {
    constructor() {
        this.files = new Map();
    }

    /**
     * Mounts the bundle into memory
     * @param {Array<{path: string, content: string}>} bundle 
     */
    mount(bundle) {
        this.files.clear();
        for (const file of bundle) {
            // Normalize paths: remove ./ and ensure consistent keys
            const cleanPath = file.path.replace(/^\.\//, '');
            this.files.set(cleanPath, file.content);
        }
    }

    exists(path) {
        return this.files.has(path);
    }

    read(path) {
        return this.files.get(path);
    }
}