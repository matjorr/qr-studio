
const $ = (selector) => document.querySelector(selector);

let kind = "url";
let qr = null;
const fields = $("#fields");

const templates = {
  url: `<label class="field">Website URL<input id="url" value="https://example.com" placeholder="https://yourwebsite.com"><small>We'll add https:// if you leave it out.</small></label>`,

  text: `<label class="field">Your message<textarea id="text" rows="5">Hello! Thanks for scanning this QR code.</textarea><small>Keep it concise for a simpler QR code.</small></label>`,

  wifi: `<div class="field-grid"><label class="field full">Network name (SSID)<input id="ssid" value="My Wi-Fi"></label><label class="field">Password<input id="pass" type="password" placeholder="Wi-Fi password"></label><label class="field">Security<select id="security"><option value="WPA">WPA / WPA2</option><option value="WEP">WEP</option><option value="nopass">No password</option></select></label><label class="check full"><input id="hidden" type="checkbox"> Hidden network</label></div>`,

  email: `<div class="field-grid"><label class="field full">Email address<input id="email" type="email" value="hello@example.com"></label><label class="field full">Subject<input id="subject" value="Hello"></label><label class="field full">Message<textarea id="message" rows="3"></textarea></label></div>`,

  contact: `<div class="field-grid"><label class="field">First name<input id="first" placeholder="First name"></label><label class="field">Last name<input id="last" placeholder="Last name"></label><label class="field">Phone<input id="phone" placeholder="+1 555 000 0000"></label><label class="field">Email<input id="cemail" type="email" placeholder="name@example.com"></label><label class="field full">Website<input id="website" placeholder="https://example.com"></label></div>`
};

function val(id) {
  return document.getElementById(id)?.value.trim() || "";
}

function esc(value) {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

function payload() {
  if (kind === "url") {
    const url = val("url");
    if (!url) return "";
    return /^https?:\/\//i.test(url) ? url : `https://${url}`;
  }

  if (kind === "text") return val("text");

  if (kind === "wifi") {
    const ssid = val("ssid");
    const security = val("security") || "WPA";
    if (!ssid) return "";

    const password = security === "nopass" ? "" : `P:${esc(val("pass"))};`;
    const hidden = $("#hidden")?.checked ? "true" : "false";

    return `WIFI:T:${security};S:${esc(ssid)};${password}H:${hidden};;`;
  }

  if (kind === "email") {
    const email = val("email");
    if (!email) return "";

    const params = new URLSearchParams();
    if (val("subject")) params.set("subject", val("subject"));
    if (val("message")) params.set("body", val("message"));

    return `mailto:${email}${params.toString() ? `?${params.toString()}` : ""}`;
  }

  const first = val("first");
  const last = val("last");
  const fullName = `${first} ${last}`.trim();

  if (!fullName && !val("phone") && !val("cemail") && !val("website")) return "";

  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${last};${first};;;`,
    `FN:${fullName}`,
    val("phone") ? `TEL;TYPE=CELL:${val("phone")}` : "",
    val("cemail") ? `EMAIL:${val("cemail")}` : "",
    val("website") ? `URL:${val("website")}` : "",
    "END:VCARD"
  ].filter(Boolean).join("\n");
}

function render() {
  const content = payload();
  const size = Number($("#size").value);
  const foreground = $("#fg").value;
  const background = $("#bg").value;

  $("#fgval").textContent = foreground.toUpperCase();
  $("#bgval").textContent = background.toUpperCase();
  $("#qrcode").innerHTML = "";
  $("#error").textContent = "";
  $("#empty").style.display = content ? "none" : "flex";
  qr = null;

  $("#png").disabled = !content;
  $("#svg").disabled = !content;
  $("#copy").disabled = !content;

  if (!content) return;

  try {
    if (typeof QRCode === "undefined") {
      throw new Error("QR code library did not load.");
    }

    const node = document.createElement("div");
    $("#qrcode").appendChild(node);

    qr = new QRCode(node, {
      text: content,
      width: size,
      height: size,
      colorDark: foreground,
      colorLight: background,
      correctLevel: QRCode.CorrectLevel.H
    });
  } catch (error) {
    qr = null;
    $("#error").textContent = "Could not create this QR code. Check your connection or try shorter content.";
    console.error(error);
  }
}

function download(type) {
  const canvas = $("#qrcode canvas");
  if (!canvas || !qr) return;

  if (type === "png") {
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "qr-code.png";
    link.click();
    return;
  }

  try {
    const model = qr._oQRCode;
    const count = model.getModuleCount();
    const quiet = 4;
    const total = count + quiet * 2;
    const foreground = $("#fg").value;
    const background = $("#bg").value;

    const parts = [
      `<rect width="${total}" height="${total}" fill="${background}"/>`
    ];

    for (let row = 0; row < count; row++) {
      for (let column = 0; column < count; column++) {
        if (model.isDark(row, column)) {
          parts.push(`<rect x="${column + quiet}" y="${row + quiet}" width="1" height="1" fill="${foreground}"/>`);
        }
      }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total * 8}" height="${total * 8}" shape-rendering="crispEdges">${parts.join("")}</svg>`;

    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "qr-code.svg";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (error) {
    $("#error").textContent = "SVG download failed. Please try downloading the PNG instead.";
    console.error(error);
  }
}

function activate(nextKind) {
  kind = nextKind;

  document.querySelectorAll(".tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.kind === nextKind);
  });

  fields.innerHTML = templates[nextKind];

  fields.querySelectorAll("input, textarea, select").forEach((element) => {
    element.addEventListener("input", render);
    element.addEventListener("change", render);
  });

  render();
}

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => activate(button.dataset.kind));
});

$("#fields").addEventListener("input", render);

["fg", "bg", "size"].forEach((id) => {
  $(`#${id}`).addEventListener("input", render);
});

$("#reset").onclick = () => {
  $("#fg").value = "#203d2b";
  $("#bg").value = "#ffffff";
  $("#size").value = "512";
  render();
};

$("#png").onclick = () => download("png");
$("#svg").onclick = () => download("svg");

$("#copy").onclick = async () => {
  try {
    await navigator.clipboard.writeText(payload());
    $("#copy").textContent = "✓ Content copied";

    setTimeout(() => {
      $("#copy").textContent = "▢ Copy encoded content";
    }, 1400);
  } catch {
    $("#error").textContent = "Clipboard access is unavailable in this browser.";
  }
};

$("#theme").onclick = () => {
  const dark = document.documentElement.dataset.theme !== "dark";

  document.documentElement.dataset.theme = dark ? "dark" : "light";
  localStorage.setItem("qr-theme", dark ? "dark" : "light");

  $("#theme").innerHTML = dark ? "☼ <span>Light</span>" : "☾ <span>Dark</span>";
};

const savedDarkTheme = localStorage.getItem("qr-theme") === "dark";

document.documentElement.dataset.theme = savedDarkTheme ? "dark" : "light";
$("#theme").innerHTML = savedDarkTheme ? "☼ <span>Light</span>" : "☾ <span>Dark</span>";

$("#year").textContent = new Date().getFullYear();

activate("url");
