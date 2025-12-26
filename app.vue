<template>
  <Head>
    <title>Hakutaka Obfuscator</title>
    <meta name="theme-color" content="#000000" />
  </Head>

  <Background />
  <div class="fixed inset-0 scanlines w-full h-full"></div>

  <div class="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
    
    <header class="text-center mb-8 animate-fade-in-down">
      <h1 class="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2 glitch-text">
        HAKUTAKA
      </h1>
      <div class="flex items-center justify-center gap-3 text-[10px] md:text-xs font-bold tracking-[0.3em] text-hacker-green">
        <span>LUA OBFUSCATOR</span>
        <span class="w-1 h-1 bg-gray-500 rounded-full"></span>
        <span>SECURE ENV</span>
      </div>
    </header>

    <div class="w-full max-w-lg glass-panel p-6 md:p-8 rounded-2xl relative group">
      <div class="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-hacker-green opacity-50 group-hover:opacity-100 transition"></div>
      <div class="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-hacker-green opacity-50 group-hover:opacity-100 transition"></div>

      <div class="space-y-6">
        
        <div 
          class="relative w-full h-32 border-2 border-dashed border-gray-700 rounded-xl bg-[#050505] hover:border-hacker-green hover:bg-[#0a0a0a] transition-all group/upload cursor-pointer overflow-hidden"
          :class="{'border-hacker-green bg-[#080f08]': fileName}"
        >
          <input type="file" accept=".lua,.txt" @change="handleTargetUpload" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
          
          <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
            <div class="mb-2 p-3 rounded-full bg-gray-900 group-hover/upload:bg-gray-800 transition">
              <span class="text-2xl">{{ fileName ? '📄' : '☁️' }}</span>
            </div>
            <span class="text-xs font-bold uppercase tracking-widest" :class="fileName ? 'text-hacker-green' : 'text-gray-500'">
              {{ fileName || 'TAP TO UPLOAD SCRIPT' }}
            </span>
            <span v-if="fileSize" class="text-[10px] text-gray-600 mt-1 font-mono">{{ fileSize }}</span>
          </div>
        </div>

        <div>
          <label class="text-[10px] font-bold text-gray-500 uppercase mb-2 block ml-1">Security Protocol</label>
          <div class="relative">
            <select v-model="selectedPreset" class="select-cyber">
              <option value="Minify">MINIFY (Ultra Fast)</option>
              <option value="Weak">WEAK (Basic Protection)</option>
              <option value="Medium">MEDIUM (Recommended)</option>
              <option value="Strong">STRONG (High Security)</option>
              <option value="MaxStrong">MAX STRONG (Heavy)</option>
              <option value="InsaneMode">INSANE (Risk of Crash)</option>
            </select>
            <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-hacker-green text-[10px]">▼</div>
          </div>
          <div class="mt-3 p-3 bg-black/40 border-l-2 text-[10px] text-gray-400 leading-relaxed" :class="getPresetColor(selectedPreset)">
            {{ getPresetDesc(selectedPreset) }}
          </div>
        </div>

        <button @click="startObfuscation" :disabled="!workerReady || isProcessing || !inputCode" class="btn-cyber w-full">
          <span v-if="!workerReady" class="animate-pulse">INITIALIZING SYSTEM...</span>
          <span v-else-if="isProcessing">ENCRYPTING PAYLOAD...</span>
          <span v-else>INITIATE OBFUSCATION</span>
        </button>

      </div>
    </div>

    <footer class="mt-12 text-center space-y-2 opacity-60 hover:opacity-100 transition">
      <p class="text-[10px] text-gray-500 font-mono">
        &copy; {{ new Date().getFullYear() }} HAKUTAKA DEV. ALL RIGHTS RESERVED.
      </p>
      <div class="flex items-center justify-center gap-4 text-[10px]">
        <a href="https://github.com/prometheus-lua/Prometheus.git" target="_blank" class="text-gray-600 hover:text-hacker-green transition flex items-center gap-1">
          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
          Based on Prometheus
        </a>
      </div>
    </footer>

    <TransitionGroup name="toast" tag="div" class="fixed top-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      <div v-for="t in toasts" :key="t.id" class="pointer-events-auto min-w-[280px] bg-black/90 border-l-4 p-4 rounded shadow-2xl backdrop-blur flex items-center gap-3"
           :class="t.type === 'error' ? 'border-red-500' : 'border-hacker-green'">
        <div class="text-lg">{{ t.type === 'error' ? '🛑' : '✅' }}</div>
        <div>
          <h4 class="font-bold text-[10px] text-gray-400 uppercase tracking-widest">{{ t.title }}</h4>
          <p class="text-xs text-white font-medium">{{ t.msg }}</p>
        </div>
      </div>
    </TransitionGroup>

    <Transition name="modal">
      <div v-if="showDownloadModal" class="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div class="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(0,255,65,0.1)] relative">
          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-hacker-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span class="text-2xl">💾</span>
            </div>
            <h3 class="text-xl font-bold text-white mb-1">FILE ENCRYPTED</h3>
            <p class="text-xs text-gray-500">Your script has been successfully obfuscated.</p>
          </div>
          
          <div class="bg-black/50 p-3 rounded border border-gray-800 mb-6 font-mono text-[10px] text-gray-400">
            <div class="flex justify-between mb-1"><span>STATUS:</span> <span class="text-hacker-green">SECURE</span></div>
            <div class="flex justify-between"><span>SIZE:</span> <span>{{ (resultSize / 1024).toFixed(2) }} KB</span></div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <button @click="showDownloadModal = false" class="py-3 text-xs font-bold text-gray-400 bg-gray-900 rounded-lg hover:bg-gray-800 transition">DISCARD</button>
            <button @click="confirmDownload" class="py-3 text-xs font-bold text-black bg-hacker-green rounded-lg hover:bg-[#33ff66] transition shadow-[0_0_15px_rgba(0,255,65,0.3)]">DOWNLOAD</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="isProcessing" class="fixed inset-0 z-[120] bg-black/95 flex flex-col items-center justify-center p-6">
        <div class="w-full max-w-md font-mono">
          <div class="flex justify-between text-xs text-hacker-green mb-2">
            <span class="animate-pulse">PROCESSING_DATA_STREAM...</span>
            <span>{{ timer }}s</span>
          </div>
          <div class="h-32 overflow-hidden border border-gray-800 bg-[#050505] p-3 rounded mb-4 text-[10px] text-gray-500 space-y-1" ref="terminalRef">
             <div v-for="(line, i) in terminalLogs" :key="i" class="truncate">
              <span class="text-hacker-green mr-2">➜</span>
              <span :class="{'text-white': i === terminalLogs.length-1}">{{ line }}</span>
            </div>
          </div>
          <div class="h-1 bg-gray-900 rounded-full overflow-hidden w-full mb-6">
            <div class="h-full bg-hacker-green animate-progress shadow-[0_0_10px_#00ff41]"></div>
          </div>
          <button @click="terminateWorker" class="text-[10px] text-red-500 hover:text-red-400 uppercase tracking-widest w-full text-center">
            [ EMERGENCY ABORT ]
          </button>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import Background from './components/Background.vue'

// --- STATE ---
const workerReady = ref(false)
const isProcessing = ref(false)
const showDownloadModal = ref(false)
const inputCode = ref('')
const fileName = ref('')
const fileSize = ref('')
const selectedPreset = ref('InsaneMode')
const terminalLogs = ref([])
const timer = ref(0.0)
const toasts = ref([])
const terminalRef = ref(null)
const resultBlob = ref(null)
const resultSize = ref(0)

let timerInterval = null
let worker = null

// --- TOAST SYSTEM ---
const showToast = (title, msg, type = 'success') => {
  const id = Date.now()
  toasts.value.push({ id, title, msg, type })
  setTimeout(() => toasts.value = toasts.value.filter(t => t.id !== id), 4000)
}

// --- WORKER SETUP ---
const initWorker = () => {
    const blob = new Blob([workerScript], { type: 'application/javascript' })
    const workerUrl = URL.createObjectURL(blob)
    worker = new Worker(workerUrl, { type: 'module' })

    worker.onmessage = async (e) => {
        const { type, result, msg } = e.data
        if (type === 'READY') {
            workerReady.value = true
        } else if (type === 'SUCCESS') {
            stopProcessing()
            // Simpan hasil ke state, buka modal
            resultBlob.value = result
            resultSize.value = new Blob([result]).size
            showDownloadModal.value = true
        } else if (type === 'ERROR') {
            stopProcessing()
            showToast("SYSTEM FAILURE", msg, "error")
        }
    }
    worker.postMessage({ type: 'INIT', payload: { baseUrl: window.location.origin } })
}

const terminateWorker = () => {
    if (worker) worker.terminate(); 
    initWorker(); 
    isProcessing.value = false;
    showToast("ABORTED", "Operation cancelled by user.", "error")
}

// --- HANDLERS ---
const handleTargetUpload = async (e) => {
    const file = e.target.files[0]
    if (file) {
        fileName.value = file.name
        fileSize.value = (file.size / 1024).toFixed(2) + " KB"
        inputCode.value = await file.text()
        showToast("FILE MOUNTED", `${file.name} ready.`, "success")
    }
}

const startObfuscation = () => {
    if (!inputCode.value) return showToast("NO INPUT", "Please upload a script first.", "error")
    
    isProcessing.value = true
    terminalLogs.value = []
    timer.value = 0.0
    
    // Fake Log Sequence
    const steps = ["INITIALIZING COMPILER...", "ANALYZING SYNTAX TREE...", `APPLYING PRESET: ${selectedPreset.value}...`, "ENCRYPTING STRINGS...", "GENERATING BYTECODE...", "FINALIZING PACKET..."]
    steps.forEach((step, i) => setTimeout(() => { if(isProcessing.value) terminalLogs.value.push(step) }, i * 600))

    timerInterval = setInterval(() => timer.value = (parseFloat(timer.value) + 0.1).toFixed(1), 100)

    // Delay sedikit biar animasi jalan
    setTimeout(() => {
        worker.postMessage({ type: 'RUN', payload: { code: inputCode.value, preset: selectedPreset.value } })
    }, 500)
}

const stopProcessing = () => {
    isProcessing.value = false
    if (timerInterval) clearInterval(timerInterval)
}

const confirmDownload = () => {
    if (!resultBlob.value) return
    const blob = new Blob([resultBlob.value], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hakutaka_protected_${Math.floor(Math.random()*9999)}.lua`
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    
    showDownloadModal.value = false
    showToast("SUCCESS", "File downloaded securely.", "success")
}

// --- UTILS ---
const getPresetColor = (p) => p === 'InsaneMode' ? 'border-red-500 text-red-400' : (p.includes('Strong') ? 'border-yellow-500 text-yellow-400' : 'border-hacker-green text-gray-400')
const getPresetDesc = (p) => ({
    'Minify': 'Simple compression. Removes spaces/comments.',
    'Weak': 'Basic variable renaming. Good for performance.',
    'Medium': 'Balanced obfuscation with control flow flattening.',
    'Strong': 'Heavy string encryption and flow obfuscation.',
    'MaxStrong': 'Maximum security layers. Might affect FPS.',
    'InsaneMode': 'EXPERIMENTAL. Extreme protection. Use at own risk.'
})[p]

watch(terminalLogs, async () => { await nextTick(); if (terminalRef.value) terminalRef.value.scrollTop = terminalRef.value.scrollHeight }, { deep: true })

onMounted(() => initWorker())
onBeforeUnmount(() => worker && worker.terminate())

// WORKER SCRIPT (Sama seperti sebelumnya)
const workerScript = `
import { LuaFactory } from 'https://cdn.jsdelivr.net/npm/wasmoon@1.16.0/+esm'
let lua, factory; self.onmessage = async (e) => {
    const { type, payload } = e.data
    if (type === 'INIT') {
        try {
            factory = new LuaFactory(); lua = await factory.createEngine()
            const bundle = await (await fetch(new URL('/prometheus-bundle.json', payload.baseUrl))).json()
            const mkdirRecursive = (path) => {
                const parts = path.split('/').filter(p => p.length > 0); let current = '';
                for (const part of parts) { current += (current ? '/' : '') + part; try { lua.global.lua.module.FS.mkdir(current) } catch(e){} }
            }
            for (const file of bundle) {
                const fp = file.path.substring(0, file.path.lastIndexOf('/')); if(fp) mkdirRecursive(fp);
                lua.global.lua.module.FS.writeFile(file.path, file.content)
            }
            await lua.doString(\`arg={};package.path="./?.lua;./src/?.lua;./src/prometheus/?.lua;"..package.path;local P=require("src.prometheus");function run_obfuscator(c,p) local cfg=P.Presets[p];if not cfg then return "Err" end;cfg.PrettyPrint=false;return P.Pipeline:fromConfig(cfg):apply(c,"s.lua") end\`)
            self.postMessage({ type: 'READY' })
        } catch (err) { self.postMessage({ type: 'ERROR', msg: err.message }) }
    }
    if (type === 'RUN') {
        try {
            if (!lua) throw new Error("Wait");
            const res = lua.global.get('run_obfuscator')(payload.code, payload.preset)
            self.postMessage({ type: 'SUCCESS', result: res })
        } catch (err) { self.postMessage({ type: 'ERROR', msg: err.message }) }
    }
}`
</script>

<style scoped>
/* Animasi */
@keyframes progress { 0% { width: 0%; } 100% { width: 100%; } }
.animate-progress { animation: progress 10s ease-out forwards; }
.animate-fade-in-down { animation: fadeInDown 0.8s ease-out; }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }

/* Transition Classes */
.toast-enter-active, .toast-leave-active, .modal-enter-active, .modal-leave-active, .fade-enter-active, .fade-leave-active { transition: all 0.3s ease; }
.toast-enter-from { opacity: 0; transform: translateX(20px); }
.toast-leave-to { opacity: 0; transform: translateX(20px); }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.9); }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>