// A simplified version of canvas-confetti for the completion page
export default function confetti(options = {}) {
  const defaults = {
    particleCount: 50,
    angle: 90,
    spread: 45,
    startVelocity: 45,
    decay: 0.9,
    gravity: 1,
    drift: 0,
    ticks: 200,
    x: 0.5,
    y: 0.5,
    shapes: ["square", "circle"],
    colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#00ffff", "#ff00ff"],
    origin: { x: 0.5, y: 0.5 },
  }

  const mergedOptions = { ...defaults, ...options }

  // Create canvas element
  const canvas = document.createElement("canvas")
  canvas.style.position = "fixed"
  canvas.style.top = "0"
  canvas.style.left = "0"
  canvas.style.pointerEvents = "none"
  canvas.style.width = "100%"
  canvas.style.height = "100%"
  canvas.style.zIndex = "999999"
  document.body.appendChild(canvas)

  canvas.width = canvas.offsetWidth
  canvas.height = canvas.offsetHeight

  const ctx = canvas.getContext("2d")

  // Create particles
  const particles = []
  for (let i = 0; i < mergedOptions.particleCount; i++) {
    const angle = (mergedOptions.angle * Math.PI) / 180 + ((Math.random() - 0.5) * mergedOptions.spread * Math.PI) / 180
    const velocity = mergedOptions.startVelocity * (1 + Math.random() * 0.2)

    particles.push({
      x: mergedOptions.origin.x * canvas.width,
      y: mergedOptions.origin.y * canvas.height,
      vx: Math.cos(angle) * velocity,
      vy: Math.sin(angle) * velocity,
      color: mergedOptions.colors[Math.floor(Math.random() * mergedOptions.colors.length)],
      shape: mergedOptions.shapes[Math.floor(Math.random() * mergedOptions.shapes.length)],
      size: Math.random() * 10 + 5,
      decay: mergedOptions.decay,
      gravity: mergedOptions.gravity,
      drift: mergedOptions.drift,
      ticks: mergedOptions.ticks,
      opacity: 1,
    })
  }

  // Animation loop
  let animationFrame
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    let stillActive = false
    for (const particle of particles) {
      if (particle.ticks <= 0) continue

      particle.ticks -= 1
      particle.x += particle.vx
      particle.y += particle.vy
      particle.vy += particle.gravity
      particle.vx += particle.drift
      particle.vx *= particle.decay
      particle.vy *= particle.decay
      particle.opacity = particle.ticks / mergedOptions.ticks

      ctx.globalAlpha = particle.opacity
      ctx.fillStyle = particle.color

      if (particle.shape === "square") {
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size)
      } else {
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2)
        ctx.fill()
      }

      stillActive = true
    }

    if (stillActive) {
      animationFrame = requestAnimationFrame(animate)
    } else {
      document.body.removeChild(canvas)
    }
  }

  animationFrame = requestAnimationFrame(animate)

  // Clean up function
  return () => {
    cancelAnimationFrame(animationFrame)
    if (canvas.parentNode) {
      document.body.removeChild(canvas)
    }
  }
}
