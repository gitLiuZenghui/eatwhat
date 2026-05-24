const canvas = document.querySelector('#particle-canvas');
const context = canvas?.getContext('2d');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas && context && !reduceMotion) {
  const pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
  const particles = [];
  let animationFrame = 0;

  const colors = [
    'rgba(255, 106, 0, 0.46)',
    'rgba(255, 123, 80, 0.42)',
    'rgba(0, 201, 167, 0.34)',
    'rgba(74, 144, 217, 0.32)',
  ];

  const createParticle = () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 2.2 + 0.8,
    speedX: (Math.random() - 0.5) * 0.45,
    speedY: (Math.random() - 0.5) * 0.45,
    color: colors[Math.floor(Math.random() * colors.length)],
    pulse: Math.random() * Math.PI * 2,
  });

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const particleCount = Math.min(88, Math.max(42, Math.floor(window.innerWidth / 18)));
    particles.length = 0;

    Array.from({ length: particleCount }).forEach(() => {
      particles.push(createParticle());
    });
  };

  const drawLine = (first, second) => {
    const distanceX = first.x - second.x;
    const distanceY = first.y - second.y;
    const distance = Math.hypot(distanceX, distanceY);

    if (distance > 150) {
      return;
    }

    context.beginPath();
    context.moveTo(first.x / (window.devicePixelRatio || 1), first.y / (window.devicePixelRatio || 1));
    context.lineTo(second.x / (window.devicePixelRatio || 1), second.y / (window.devicePixelRatio || 1));
    context.strokeStyle = `rgba(74, 144, 217, ${0.08 * (1 - distance / 150)})`;
    context.lineWidth = 1;
    context.stroke();
  };

  const drawParticle = (particle) => {
    const ratio = window.devicePixelRatio || 1;
    const pointerDistance = Math.hypot(particle.x / ratio - pointer.x, particle.y / ratio - pointer.y);
    const pointerForce = Math.max(0, 1 - pointerDistance / 180);
    const radius = particle.radius + Math.sin(particle.pulse) * 0.45 + pointerForce * 1.4;

    context.beginPath();
    context.arc(particle.x / ratio, particle.y / ratio, radius, 0, Math.PI * 2);
    context.fillStyle = particle.color;
    context.shadowBlur = 18 + pointerForce * 24;
    context.shadowColor = particle.color;
    context.fill();
    context.shadowBlur = 0;
  };

  const updateParticle = (particle) => {
    const ratio = window.devicePixelRatio || 1;
    const pointerDistanceX = particle.x / ratio - pointer.x;
    const pointerDistanceY = particle.y / ratio - pointer.y;
    const pointerDistance = Math.hypot(pointerDistanceX, pointerDistanceY);

    if (pointerDistance < 160 && pointerDistance > 0) {
      particle.x += (pointerDistanceX / pointerDistance) * 0.55;
      particle.y += (pointerDistanceY / pointerDistance) * 0.55;
    }

    particle.x += particle.speedX * ratio;
    particle.y += particle.speedY * ratio;
    particle.pulse += 0.025;

    if (particle.x < 0 || particle.x > canvas.width) {
      particle.speedX *= -1;
    }

    if (particle.y < 0 || particle.y > canvas.height) {
      particle.speedY *= -1;
    }
  };

  const animate = () => {
    context.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle, index) => {
      updateParticle(particle);
      drawParticle(particle);

      particles.slice(index + 1).forEach((other) => {
        drawLine(particle, other);
      });
    });

    animationFrame = window.requestAnimationFrame(animate);
  };

  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });
  window.addEventListener('pagehide', () => {
    window.cancelAnimationFrame(animationFrame);
  });

  resize();
  animate();
}
