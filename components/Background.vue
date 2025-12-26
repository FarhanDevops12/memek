<template>
  <div class="fixed inset-0 z-0 pointer-events-none bg-black">
    <canvas ref="canvasRef" class="absolute inset-0 w-full h-full opacity-30"></canvas>
    <div class="absolute inset-0 bg-radial-gradient"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'

const canvasRef = ref(null)
let ctx = null
let animationFrameId = null
let width = 0
let height = 0
let columns = []
const fontSize = 14

// Karakter Matrix
const chars = "01010101XYZABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

const initMatrix = () => {
  width = window.innerWidth
  height = window.innerHeight
  canvasRef.value.width = width
  canvasRef.value.height = height
  
  const columnCount = Math.floor(width / fontSize)
  columns = []
  for (let i = 0; i < columnCount; i++) {
    columns[i] = Math.random() * height // Posisi Y acak
  }
}

const animate = () => {
  // Efek Trail: Timpa dengan hitam transparan, bukan dihapus total
  ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = "#00ff41" // Hijau Hacker
  ctx.font = `${fontSize}px 'JetBrains Mono'`

  for (let i = 0; i < columns.length; i++) {
    const text = chars[Math.floor(Math.random() * chars.length)]
    const x = i * fontSize
    const y = columns[i] * fontSize

    ctx.fillText(text, x, y)

    // Reset ke atas secara acak jika sudah lewat bawah layar
    if (y * fontSize > height && Math.random() > 0.975) {
      columns[i] = 0
    }
    columns[i]++
  }

  animationFrameId = requestAnimationFrame(animate)
}

const handleResize = () => {
  if (canvasRef.value) initMatrix()
}

onMounted(() => {
  if (canvasRef.value) {
    ctx = canvasRef.value.getContext('2d')
    initMatrix()
    animate()
    window.addEventListener('resize', handleResize)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  cancelAnimationFrame(animationFrameId)
})
</script>

<style scoped>
.bg-radial-gradient {
  background: radial-gradient(circle, transparent 0%, #000000 100%);
}
</style>