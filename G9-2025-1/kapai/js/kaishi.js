export function initKaishi(container, onStart, opts = {}) {
  const startScreenHTML = `
    <section id="startScreen" class="start-screen"></section>
  `;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = startScreenHTML;
  const startScreen = tempDiv.querySelector('#startScreen');
  
  container.appendChild(startScreen);

  const btnStartGame = document.getElementById('btnStartGame');

  let isStarted = false;

  function startAction() {
    if (isStarted) return;
    isStarted = true;

    try {
      if (window.__game) {
        if (window.__game._bgmAutoplayBlocked) {
          window.__game.stopBgmImmediate();
        } else {
          window.__game.fadeOutBgm(3000);
        }
      }
    } catch (_) {}
    try { window.__game && window.__game.playCue('sound/zhandoukaishi.mp3'); } catch (_) {}

    window.removeEventListener('keydown', keydownHandler);
    startScreen.removeEventListener('click', startAction);
    startScreen.removeEventListener('touchstart', startAction);
    window.removeEventListener('pointerdown', startAction);
    if (btnStartGame) {
      btnStartGame.removeEventListener('click', startAction);
    }

    startScreen.classList.add('exit');
    let didBanner = false;
    let overlayTimer = null;
    const showBanner = () => {
      if (didBanner) return;
      didBanner = true;
      const banner = document.createElement('div');
      banner.className = 'start-level-banner';
      banner.textContent = '第一关';
      startScreen.appendChild(banner);
      setTimeout(() => {
        banner.remove();
        startScreen.remove();
        const overlay = document.createElement('div');
        overlay.className = 'map-overlay';
        document.body.appendChild(overlay);
        overlay.style.background = '#000';
        overlay.style.opacity = '1';
        const goNext = () => {
          if (overlayTimer) { clearTimeout(overlayTimer); overlayTimer = null; }
          overlay.remove();
          if (onStart) onStart();
        };
        overlayTimer = setTimeout(goNext, 600);
      }, 1500);
    };
    const playIntroThenBanner = () => {
      const video = document.createElement('video');
      video.src = 'video/begin.mp4';
      video.autoplay = true;
      video.playsInline = true;
      video.controls = false;
      video.style.position = 'fixed';
      video.style.inset = '0';
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      video.style.backgroundColor = '#000';
      video.style.zIndex = '10001';
      document.body.appendChild(video);
      const cleanup = () => { try { video.remove(); } catch (_) {} };
      video.addEventListener('ended', () => { cleanup(); showBanner(); }, { once: true });
      video.addEventListener('error', () => { cleanup(); showBanner(); }, { once: true });
      const p = video.play();
      if (p && typeof p.then === 'function') {
        p.catch(() => {
          video.muted = true;
          video.play().catch(() => { cleanup(); showBanner(); });
        });
      }
    };
    if (opts && opts.skipVideo) {
      startScreen.classList.add('force-dark');
      startScreen.style.pointerEvents = 'none';
      showBanner();
    } else {
      setTimeout(playIntroThenBanner, 3000);
    }
  }

  const keydownHandler = (event) => {
    startAction();
  };

  if (btnStartGame) {
    btnStartGame.addEventListener('click', startAction);
  }
  startScreen.addEventListener('click', startAction);
  startScreen.addEventListener('touchstart', startAction);
  window.addEventListener('pointerdown', startAction);
  window.addEventListener('keydown', keydownHandler);
  if (opts && opts.autoStart) {
    startAction();
  }
}
