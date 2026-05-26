import "./ClippyOcular.js";
import "./ClippyMetal.js";
import "./ClippyPaper.js";
import "./ClippyDialog.js";

class ClippyCharacter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get styles() {
    return /* css */`
      :host {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        pointer-events: none;
      }

      .container {
        max-width: 475px;
        display: flex;
        gap: 25px;
        pointer-events: auto;
      }

      .subcontainer {
        --width: 150px;
        --height: 290px;
        width: var(--width);
        height: var(--height);
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
        top: -10px;
        right: -10px;
        width: 20px;
        height: 20px;
        background: #ff4444;
        border: 1px solid #333;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        color: white;
        z-index: 10;
      }

      .close-button:hover {
        background: #ff6666;
      }
    `;
  }

  connectedCallback() {
    this.render();
    this.setupCloseButton();
    this.startAnimations();
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
    setInterval(() => {
      this.classList.add("blink");
      setTimeout(() => this.classList.remove("blink"), 350);
    }, 4000);
  }

  render() {
    this.shadowRoot.innerHTML = /* html */`
    <style>${ClippyCharacter.styles}</style>
    <div class="container">
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
      <clippy-dialog></clippy-dialog>
      <div class="close-button">×</div>
    </div>`;
  }
}

customElements.define("clippy-character", ClippyCharacter);
