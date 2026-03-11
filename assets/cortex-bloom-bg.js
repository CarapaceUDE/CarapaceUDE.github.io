(function () {
  function ensureLayers() {
    if (document.querySelector('.cortex-bg-layer')) return;
    const bg = document.createElement('div');
    bg.className = 'cortex-bg-layer';
    const wave = document.createElement('div');
    wave.className = 'cortex-wave-layer';
    const waveCanvas = document.createElement('canvas');
    wave.appendChild(waveCanvas);
    const brain = document.createElement('div');
    brain.className = 'cortex-brain-layer';
    const brainCanvas = document.createElement('canvas');
    brain.appendChild(brainCanvas);
    document.body.prepend(brain);
    document.body.prepend(wave);
    document.body.prepend(bg);
    return { waveCanvas, brainCanvas };
  }

  function setupCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    function resize() {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);
    return ctx;
  }

  function drawWaves(canvas) {
    const ctx = setupCanvas(canvas);
    let t = 0;
    function frame() {
      t += 0.012;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      for (let layer = 0; layer < 5; layer++) {
        ctx.beginPath();
        const baseY = h * 0.35 + layer * 28;
        const amp = 10 + layer * 5;
        const speed = t * (0.6 + layer * 0.25);
        const freq = 0.006 + layer * 0.002;
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 3) {
          const y = baseY + Math.sin(x * freq + speed) * amp + Math.sin(x * freq * 0.5 + speed * 1.4) * amp * 0.5 + Math.sin(x * freq * 1.8 + speed * 0.6) * amp * 0.25;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        const alpha = Math.max(0.03 - layer * 0.005, 0.005);
        ctx.fillStyle = `hsla(180, 100%, 50%, ${alpha})`;
        ctx.fill();
      }
      for (let wl = 0; wl < 4; wl++) {
        ctx.beginPath();
        const baseY = h * 0.3 + wl * 35;
        for (let x = 0; x <= w; x += 2) {
          const y = baseY + Math.sin(x * 0.008 + t * 1.0 + wl * 1.5) * 12 + Math.sin(x * 0.004 + t * 0.5 + wl) * 8;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `hsla(180, 100%, 55%, ${0.05 - wl * 0.01})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function generateNodes() {
    const nodes = [];
    const addHemisphere = (side) => {
      for (let i = 0; i < 60; i++) {
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = Math.random() * Math.PI * 2;
        let rx = 130 + Math.random() * 20;
        let ry = 95 + Math.random() * 15;
        let rz = 110 + Math.random() * 15;
        let x = rx * Math.sin(phi) * Math.cos(theta) * (side > 0 ? 0.52 : -0.52) + side * 30;
        let y = ry * Math.cos(phi) * 0.85;
        let z = rz * Math.sin(phi) * Math.sin(theta);
        if (y > 60) y = 60 + (y - 60) * 0.3;
        nodes.push({ x, y, z, px: 0, py: 0, connections: [], pulse: Math.random() * Math.PI * 2, layer: side > 0 ? 0 : 1 });
      }
    };
    addHemisphere(1); addHemisphere(-1);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dz = nodes[i].z - nodes[j].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 55 && nodes[i].connections.length < 6) {
          nodes[i].connections.push(j);
          nodes[j].connections.push(i);
        }
      }
    }
    return nodes;
  }

  function drawBrain(canvas) {
    const ctx = setupCanvas(canvas);
    const nodes = generateNodes();
    let t = 0;
    function frame() {
      t += 0.008;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;
      ctx.clearRect(0, 0, w, h);
      const rotY = t * 0.3;
      const rotX = 0.1;
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY), cosX = Math.cos(rotX), sinX = Math.sin(rotX);
      for (const node of nodes) {
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.x * sinY + node.z * cosY;
        const y1 = node.y * cosX - z1 * sinX;
        const z2 = node.y * sinX + z1 * cosX;
        const scale = 400 / (400 + z2);
        node.px = cx + x1 * scale;
        node.py = cy + y1 * scale;
      }
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        for (const j of n.connections) {
          if (j <= i) continue;
          const m = nodes[j];
          const pulseVal = (Math.sin(t * 2 + n.pulse) + 1) * 0.5;
          ctx.beginPath();
          ctx.moveTo(n.px, n.py);
          ctx.lineTo(m.px, m.py);
          ctx.strokeStyle = `hsla(180, 100%, 50%, ${0.05 + pulseVal * 0.1})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
      for (const node of nodes) {
        const pulseVal = (Math.sin(t * 3 + node.pulse) + 1) * 0.5;
        const size = 1.2 + pulseVal * 1.2;
        ctx.beginPath();
        ctx.arc(node.px, node.py, size + 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(180, 100%, 60%, ${pulseVal * 0.1})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(node.px, node.py, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(180, 100%, ${60 + pulseVal * 20}%, ${0.32 + pulseVal * 0.5})`;
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.body.classList.add('cortex-bloom-body');
    const layers = ensureLayers();
    drawWaves(layers.waveCanvas);
    drawBrain(layers.brainCanvas);
  });
})();
