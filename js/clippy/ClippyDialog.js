class ClippyDialog extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get styles() {
    return /* css */`
      .container {
        background: #ffffcc;
        border: 2px solid #000;
        border-radius: 15px;
        padding: 0.5em 1em;
        font-family: "Trebuchet MS", Arial, sans-serif;
        font-size: 14px;
        color: #000;
        max-width: 280px;
        position: relative;
        box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
      }

      .container::before {
        content: "";
        width: 30px;
        height: 30px;
        display: inline-block;
        position: absolute;
        background: #ffffcc;
        clip-path: polygon(0 100%, 100% 0, 100% 100%);
        transform: translate(-38px, 15px);
        border-left: 2px solid #000;
        border-bottom: 2px solid #000;
      }

      p {
        margin: 0.5em 0;
        line-height: 1.4;
      }

      .welcome-text {
        font-weight: bold;
        color: #0066cc;
      }

      .subtitle {
        font-size: 12px;
        color: #666;
        margin-top: 0.3em;
      }
    `;
  }

  setText(text) {
    const template = document.createElement("template");
    template.innerHTML = String(text || "");
    const allowedClasses = new Set(["welcome-text", "subtitle"]);
    template.content.querySelectorAll("*").forEach((node) => {
      if (node.tagName !== "P") {
        node.replaceWith(document.createTextNode(node.textContent || ""));
        return;
      }

      Array.from(node.attributes).forEach((attribute) => {
        if (attribute.name !== "class" || !allowedClasses.has(attribute.value)) {
          node.removeAttribute(attribute.name);
        }
      });
    });
    this.shadowRoot.querySelector(".container").replaceChildren(template.content);
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = /* html */`
    <style>${ClippyDialog.styles}</style>
    <div class="container">
      <p class="welcome-text">¡Bienvenido a mi portfolio!</p>
      <p class="subtitle">Explora mis proyectos y habilidades</p>
    </div>`;
  }
}

customElements.define("clippy-dialog", ClippyDialog);
