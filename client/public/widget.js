/**
 * FormMorph Embed Widget
 * Injects a floating chat bubble that opens the conversational form in an iframe.
 */
(function() {
  // Find the script tag to extract the form token
  const scriptTag = document.currentScript || document.querySelector('script[src*="widget.js"]');
  if (!scriptTag) return;

  const formToken = scriptTag.getAttribute('data-form');
  if (!formToken) {
    console.error('FormMorph: Missing data-form attribute on script tag.');
    return;
  }

  // Get the origin of where this script is hosted
  const scriptSrc = scriptTag.getAttribute('src');
  const origin = new URL(scriptSrc, window.location.href).origin;

  // Create styles
  const style = document.createElement('style');
  style.innerHTML = `
    .formmorph-widget-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 30px;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
      cursor: pointer;
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      border: none;
    }
    .formmorph-widget-btn:hover {
      transform: scale(1.1);
    }
    .formmorph-widget-btn svg {
      width: 28px;
      height: 28px;
      fill: none;
      stroke: white;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: transform 0.3s ease;
    }
    .formmorph-widget-btn.open svg {
      transform: rotate(90deg);
    }
    .formmorph-widget-iframe-container {
      position: fixed;
      bottom: 100px;
      right: 24px;
      width: 400px;
      height: 600px;
      max-height: calc(100vh - 120px);
      max-width: calc(100vw - 48px);
      background: #09090b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      z-index: 999999;
      opacity: 0;
      pointer-events: none;
      transform: translateY(20px) scale(0.95);
      transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
      overflow: hidden;
    }
    .formmorph-widget-iframe-container.open {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }
    .formmorph-widget-iframe {
      width: 100%;
      height: 100%;
      border: none;
      background: transparent;
    }
    
    @media (max-width: 480px) {
      .formmorph-widget-iframe-container {
        bottom: 0;
        right: 0;
        width: 100vw;
        height: 100vh;
        max-height: 100vh;
        max-width: 100vw;
        border-radius: 0;
        border: none;
      }
      .formmorph-widget-btn {
        bottom: 20px;
        right: 20px;
      }
    }
  `;
  document.head.appendChild(style);

  // Create iframe container
  const container = document.createElement('div');
  container.className = 'formmorph-widget-iframe-container';
  
  const iframe = document.createElement('iframe');
  iframe.className = 'formmorph-widget-iframe';
  // Use a special query param so the form knows it's embedded
  iframe.src = `${origin}/f/${formToken}?embed=true`;
  container.appendChild(iframe);
  document.body.appendChild(container);

  // Create toggle button
  const button = document.createElement('button');
  button.className = 'formmorph-widget-btn';
  button.innerHTML = `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
  document.body.appendChild(button);

  // Toggle logic
  let isOpen = false;
  button.addEventListener('click', () => {
    isOpen = !isOpen;
    if (isOpen) {
      container.classList.add('open');
      button.classList.add('open');
      button.innerHTML = `<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    } else {
      container.classList.remove('open');
      button.classList.remove('open');
      button.innerHTML = `<svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;
    }
  });

  // Listen for messages from iframe (e.g. form completed to auto-close)
  window.addEventListener('message', (event) => {
    if (event.origin !== origin) return;
    
    if (event.data === 'formmorph-close' && isOpen) {
      button.click();
    }
  });
})();
