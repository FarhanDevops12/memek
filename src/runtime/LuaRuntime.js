import fengari from 'fengari-web'; // Ensure this is installed or loaded from CDN
const { lua, lauxlib, lualib, to_jsstring, to_luastring } = fengari;

export class LuaRuntime {
    constructor() {
        this.L = null;
    }

    init(fs) {
        // 1. Create new State
        this.L = lauxlib.luaL_newstate();
        
        // 2. Open standard libraries
        lualib.luaL_openlibs(this.L);

        // 3. Inject Polyfills for Lua 5.1 Compatibility (Crucial for Prometheus)
        const polyfills = `
            _G.unpack = table.unpack
            _G.loadstring = load
            -- Simple setfenv shim (not perfect, but works for most obfuscator scopes)
            _G.setfenv = function(f, t)
                local i = 1
                while true do
                    local name = debug.getupvalue(f, i)
                    if name == "_ENV" then
                        debug.setupvalue(f, i, t)
                        break
                    elseif not name then
                        break
                    end
                    i = i + 1
                end
                return f
            end
        `;
        lauxlib.luaL_dostring(this.L, to_luastring(polyfills));

        // 4. Register Custom Loader for VirtualFS
        // This allows require("src.prometheus") to read from our JS Map
        this.registerCustomLoader(fs);
    }

    registerCustomLoader(fs) {
        // We define a loader function in Lua that calls back into JS to find files
        const loaderCode = `
            local js_fs = ...
            local function loader(name)
                -- Convert module name (dotted) to path (slashed)
                local path = name:gsub("%.", "/") .. ".lua"
                
                -- Check if file exists in VirtualFS
                if js_fs:exists(path) then
                    local content = js_fs:read(path)
                    return load(content, path)
                end
                return "\n\tno file '" .. path .. "' in VirtualFS"
            end
            
            -- Insert loader at index 2 (after preload, before standard paths)
            table.insert(package.searchers, 2, loader)
        `;

        // Push the FS object as an argument to the chunk
        lauxlib.luaL_loadbuffer(this.L, to_luastring(loaderCode), null, null);
        lua.lua_pushlightuserdata(this.L, fs); 
        lua.lua_call(this.L, 1, 0);
    }

    runObfuscation(code, preset) {
        // Prepare the payload
        const bootstrap = `
            local code = ...
            local preset = ...
            
            -- Prometheus Entry Point Logic
            -- We assume the files are mounted via the custom loader
            
            package.path = "./?.lua;./src/?.lua;./src/prometheus/?.lua;" .. package.path
            local P = require("src.prometheus")
            
            local cfg = P.Presets[preset]
            if not cfg then 
                error("Preset not found: " .. tostring(preset)) 
            end
            
            cfg.PrettyPrint = false
            
            -- Execute Pipeline
            return P.Pipeline:fromConfig(cfg):apply(code, "hakutaka_script.lua")
        `;

        // Load the bootstrap chunk
        const status = lauxlib.luaL_loadstring(this.L, to_luastring(bootstrap));
        
        if (status !== lua.LUA_OK) {
            const err = lua.lua_tojsstring(this.L, -1);
            throw new Error(`Lua Load Error: ${err}`);
        }

        // Push arguments
        lua.lua_pushstring(this.L, to_luastring(code));
        lua.lua_pushstring(this.L, to_luastring(preset));

        // Pcall (Protected Call) - 2 args, 1 result
        const runStatus = lua.lua_pcall(this.L, 2, 1, 0);

        if (runStatus !== lua.LUA_OK) {
            const err = lua.lua_tojsstring(this.L, -1);
            throw new Error(`Obfuscation Error: ${err}`);
        }

        // Retrieve result
        const result = lua.lua_tojsstring(this.L, -1);
        lua.lua_pop(this.L, 1); // Clean stack

        return result;
    }

    destroy() {
        if (this.L) {
            lua.lua_close(this.L);
            this.L = null;
        }
    }
}