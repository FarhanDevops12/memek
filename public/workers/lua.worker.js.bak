/* eslint-disable no-undef */
// ===== HAKUTAKA WORKER ENGINE (FENGARI EDITION) =====

// Import Fengari (Universal Module Definition)
// Ensure 'fengari-web.js' is available in your public/lib folder
// Or use a reliable CDN if internet access is guaranteed
importScripts('https://cdn.jsdelivr.net/npm/fengari-web@0.1.4/dist/fengari-web.js');

// --- Virtual File System (Inlined for Worker Isolation) ---
class VirtualFS {
    constructor() {
        this.files = new Map();
    }
    mount(bundle) {
        this.files.clear();
        for (const file of bundle) {
            let cleanPath = file.path;
            // Normalize Windows/Unix paths to Unix style
            cleanPath = cleanPath.replace(/\\/g, '/');
            // Remove leading ./ if present
            if (cleanPath.startsWith('./')) cleanPath = cleanPath.substring(2);
            this.files.set(cleanPath, file.content);
        }
    }
    exists(path) { return this.files.has(path); }
    read(path) { return this.files.get(path); }
}

// --- Runtime Wrapper ---
const { lua, lauxlib, lualib, to_luastring } = fengari;

class Engine {
    constructor() {
        this.L = null;
        this.fs = new VirtualFS();
    }

    initialize(bundle) {
        // Mount files
        this.fs.mount(bundle);

        // Initialize Lua State
        this.L = lauxlib.luaL_newstate();
        lualib.luaL_openlibs(this.L);

        // 1. Compatibility Shim (5.3 -> 5.1/LuaJIT for Prometheus)
        const polyfills = `
            _G.unpack = table.unpack or _G.unpack
            _G.loadstring = load
            _G.bit32 = _G.bit32 or require("bit") -- If bit32 is missing
        `;
        lauxlib.luaL_dostring(this.L, to_luastring(polyfills));

        // 2. Custom Package Searcher
        // This bridges Lua's require() to our VirtualFS Map
        const loaderCode = `
            local js_fs = ...
            local function loader(name)
                local path = name:gsub("%.", "/") .. ".lua"
                if js_fs:exists(path) then
                    return load(js_fs:read(path), path)
                end
                return "\\n\\t[VFS] no file '" .. path .. "'"
            end
            table.insert(package.searchers, 2, loader)
        `;
        
        // Load the loader chunk
        lauxlib.luaL_loadbuffer(this.L, to_luastring(loaderCode), null, to_luastring("vfs_loader"));
        // Push the JS FS object instance as a lightuserdata
        lua.lua_pushlightuserdata(this.L, this.fs);
        // Execute loader setup
        lua.lua_call(this.L, 1, 0);
    }

    run(code, preset) {
        if (!this.L) throw new Error("Engine not initialized");

        // Prepare Execution Script
        const script = `
            local code, preset = ...
            
            -- Setup Path for Prometheus logic
            -- Note: Our VFS loader handles the lookup, but Prometheus might check package.path
            package.path = "./?.lua;./src/?.lua;./src/prometheus/?.lua;" .. package.path
            
            local success, P = pcall(require, "src.prometheus")
            if not success then error("Failed to load Prometheus: " .. tostring(P)) end
            
            local cfg = P.Presets[preset]
            if not cfg then error("Invalid Preset: " .. tostring(preset)) end
            
            cfg.PrettyPrint = false
            
            -- Execute Pipeline
            return P.Pipeline:fromConfig(cfg):apply(code, "script.lua")
        `;

        const status = lauxlib.luaL_loadstring(this.L, to_luastring(script));
        if (status !== lua.LUA_OK) {
            const errMsg = lua.lua_tojsstring(this.L, -1);
            lua.lua_pop(this.L, 1);
            throw new Error(`Lua Compile Error: ${errMsg}`);
        }

        // Push Args
        lua.lua_pushstring(this.L, to_luastring(code));
        lua.lua_pushstring(this.L, to_luastring(preset));

        // Call (2 args, 1 result)
        const pcallStatus = lua.lua_pcall(this.L, 2, 1, 0);
        
        if (pcallStatus !== lua.LUA_OK) {
            const err = lua.lua_tojsstring(this.L, -1);
            lua.lua_pop(this.L, 1);
            throw new Error(err);
        }

        const result = lua.lua_tojsstring(this.L, -1);
        lua.lua_pop(this.L, 1);
        return result;
    }
}

// --- Worker Event Handling ---
const engine = new Engine();

self.onmessage = async (e) => {
    const { type, payload } = e.data;

    try {
        if (type === 'INIT') {
            // Fetch bundle from public folder
            const response = await fetch(`${payload.baseUrl}/prometheus-bundle.json`);
            if (!response.ok) throw new Error("Failed to load Prometheus bundle");
            const bundle = await response.json();
            
            engine.initialize(bundle);
            self.postMessage({ type: 'READY' });
        } 
        else if (type === 'RUN') {
            const result = engine.run(payload.code, payload.preset);
            self.postMessage({ type: 'SUCCESS', result });
        }
    } catch (err) {
        self.postMessage({ type: 'ERROR', msg: err.message });
    }
};