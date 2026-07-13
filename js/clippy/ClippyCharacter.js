import "./ClippyOcular.js";
import "./ClippyMetal.js";
import "./ClippyPaper.js";
import "./ClippyDialog.js?v=zaratexp-20260712-clippy-mobile1";

class ClippyCharacter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.blinkTimer = null;
    this.blinkResetTimer = null;
  }

  static get styles() {
    return /* css */`
      :host {
        display: block;
        pointer-events: none;
      }

      .container {
        width: max-content;
        max-width: min(475px, calc(100vw - 12px));
        display: flex;
        align-items: flex-end;
        gap: 25px;
        position: relative;
        pointer-events: none;
      }

      .sub-container {
        --width: 150px;
        /* The SVG wire is intrinsically tall; reserve its full box so the
           bottom-right host anchor contains the complete character. */
        --height: 491px;
        width: var(--width);
        height: var(--height);
        flex: 0 0 var(--width);
        position: relative;
        pointer-events: none;
      }

      .dialog-shell {
        width: min(300px, calc(100vw - 190px));
        align-self: flex-start;
        margin-top: 24px;
        position: relative;
        pointer-events: none;
      }

      clippy-dialog {
        display: block;
        width: 100%;
      }

      :host([no-paper]) clippy-paper {
        display: none;
      }

      header {
        display: flex;
        justify-content: space-between;
        transform: translateY(40px) rotate(7deg);
        z-index: 5;
        position: relative;
      }

      clippy-paper {
        position: absolute;
        top: 60px;
        left: 5px;
        z-index: -1;
      }

      .close-button {
        position: absolute;
        top: -9px;
        right: -9px;
        width: 28px;
        height: 28px;
        padding: 0;
        background: #ff4444;
        border: 1px solid #333;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font: bold 18px/1 Arial, sans-serif;
        font-weight: bold;
        color: white;
        z-index: 10;
        appearance: none;
        pointer-events: auto;
      }

      .close-button:hover {
        background: #ff6666;
      }

      .close-button:focus-visible {
        outline: 2px solid #0054e3;
        outline-offset: 2px;
      }
    `;
  }

  connectedCallback() {
    this.render();
    this.setupCloseButton();
    this.startAnimations();
  }

  disconnectedCallback() {
    window.clearInterval(this.blinkTimer);
    window.clearTimeout(this.blinkResetTimer);
    this.blinkTimer = null;
    this.blinkResetTimer = null;
  }

  setText(text) {
    this.shadowRoot.querySelector("clippy-dialog").setText(text);
  }

  setupCloseButton() {
    const closeButton = this.shadowRoot.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('clippy-close', { bubbles: true, composed: true }));
      this.remove();
    });
  }

  startAnimations() {
    // Parpadeo cada 4 segundos
    window.clearInterval(this.blinkTimer);
    this.blinkTimer = window.setInterval(() => {
      this.classList.add("blink");
      window.clearTimeout(this.blinkResetTimer);
      this.blinkResetTimer = window.setTimeout(() => this.classList.remove("blink"), 350);
    }, 4000);
  }

  render() {
    this.shadowRoot.innerHTML = /* html */`
    <style>${ClippyCharacter.styles}</style>
    <div class="container">
      <div class="dialog-shell">
        <clippy-dialog></clippy-dialog>
        <button class="close-button" type="button" aria-label="Cerrar" title="Cerrar"><span aria-hidden="true">×</span></button>
      </div>
      <div class="sub-container">
        <div class="clippy">
          <header>
            <clippy-ocular class="left"></clippy-ocular>
            <clippy-ocular class="right"></clippy-ocular>
          </header>
          <clippy-metal></clippy-metal>
        </div>
        <clippy-paper></clippy-paper>
      </div>
    </div>`;
  }
}

customElements.define("clippy-character", ClippyCharacter);
