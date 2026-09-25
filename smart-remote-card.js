const SMART_REMOTE_VERSION = "0.4.1";

const PRESET_LABELS = {
  android_tv: "Android TV Remote",
  remote: "Generic Remote",
  webos: "LG webOS",
  totalplay: "Totalplay",
  media_player: "Media Player",
};

const PRESETS = {
  android_tv: {
    up: "DPAD_UP", down: "DPAD_DOWN", left: "DPAD_LEFT", right: "DPAD_RIGHT", ok: "DPAD_CENTER",
    back: "BACK", home: "HOME", menu: "MENU", guide: "GUIDE", info: "INFO", settings: "SETTINGS",
    play_pause: "MEDIA_PLAY_PAUSE", play: "MEDIA_PLAY", pause: "MEDIA_PAUSE", stop: "MEDIA_STOP",
    previous: "MEDIA_PREVIOUS", next: "MEDIA_NEXT", rewind: "MEDIA_REWIND", fast_forward: "MEDIA_FAST_FORWARD",
    channel_up: "CHANNEL_UP", channel_down: "CHANNEL_DOWN", delete: "DEL", power: "POWER",
    volume_up: "VOLUME_UP", volume_down: "VOLUME_DOWN", mute: "MUTE",
    "0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
  },
  remote: {
    up: "UP", down: "DOWN", left: "LEFT", right: "RIGHT", ok: "ENTER",
    back: "BACK", home: "HOME", menu: "MENU", guide: "GUIDE", info: "INFO",
    play_pause: "PLAY_PAUSE", play: "PLAY", pause: "PAUSE", stop: "STOP",
    previous: "PREVIOUS", next: "NEXT", rewind: "REWIND", fast_forward: "FAST_FORWARD",
    channel_up: "CHANNEL_UP", channel_down: "CHANNEL_DOWN", delete: "DELETE", power: "POWER",
    volume_up: "VOLUME_UP", volume_down: "VOLUME_DOWN", mute: "MUTE",
    "0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
  },
  totalplay: {
    up: "up", down: "down", left: "left", right: "right", ok: "ok", back: "back",
    menu: "KEY_MENU", guide: "KEY_GUIDE", play_pause: "play_pause", stop: "stop",
    previous: "prev", next: "next", channel_up: "channel_up", channel_down: "channel_down",
    delete: "delete", power: "on_off", volume_up: "volume_up", volume_down: "volume_down", mute: "mute",
    "0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
  },
  webos: {
    up: "UP", down: "DOWN", left: "LEFT", right: "RIGHT", ok: "ENTER", back: "BACK",
    home: "HOME", menu: "MENU", guide: "GUIDE", info: "INFO", play: "PLAY", pause: "PAUSE",
    channel_up: "CHANNELUP", channel_down: "CHANNELDOWN", volume_up: "VOLUMEUP", volume_down: "VOLUMEDOWN", mute: "MUTE",
    "0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
  },
};

const BUTTONS = {
  back: ["mdi:arrow-left", "Back"], home: ["mdi:home-outline", "Home"], menu: ["mdi:menu", "Menu"],
  guide: ["mdi:television-guide", "Guide"], info: ["mdi:information-outline", "Info"],
  channel_down: ["mdi:minus", "CH −"], channel_up: ["mdi:plus", "CH +"],
  rewind: ["mdi:rewind", "Rewind"], play_pause: ["mdi:play-pause", "Play/Pause"], fast_forward: ["mdi:fast-forward", "Fast forward"],
  previous: ["mdi:skip-previous", "Previous"], stop: ["mdi:stop", "Stop"], next: ["mdi:skip-next", "Next"],
};

function esc(value) {
  return String(value ?? "").replace(/[&<>'"]/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[ch]));
}

function norm(value) { return String(value ?? "").trim().toLowerCase(); }
function domainOf(entity) { return String(entity || "").split(".")[0]; }
function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

class SmartRemoteCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._tab = "nav";
    this._lastSource = undefined;
  }

  static getConfigElement() { return document.createElement("smart-remote-card-editor"); }
  static getStubConfig() {
    return {
      title: "Smart Remote",
      source_attribute: "source",
      power_mode: "display",
      theme: "system",
      show_source_selector: true,
      show_device_source_selector: true,
      show_keypad: true,
      show_playback: true,
      show_channels: true,
      mappings: [],
      fallback: { type: "webos", entity: "" },
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Smart Remote Card requires configuration.");
    this._config = Object.assign({
      title: "Smart Remote",
      source_attribute: "source",
      power_mode: "display",
      theme: "system",
      show_source_selector: true,
      show_device_source_selector: true,
      show_keypad: true,
      show_playback: true,
      show_channels: true,
      mappings: [],
      fallback: { type: "webos", entity: "" },
    }, config);
    this._config.mappings = Array.isArray(config.mappings) ? config.mappings : [];
    if (!config.power_mode) {
      this._config.power_mode = config.power_entity && config.power_entity !== config.display_entity ? "helper" : "display";
    }
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    const source = this._currentSource();
    if (source !== this._lastSource) this._lastSource = source;
    this.render();
  }

  getCardSize() { return 7; }
  getGridOptions() { return { columns: 6, rows: 7, min_columns: 3, min_rows: 5 }; }

  _displayState() {
    return this._hass?.states?.[this._config.display_entity] || null;
  }

  _currentSource() {
    const state = this._displayState();
    const attr = this._config.source_attribute || "source";
    return state?.attributes?.[attr] ?? "";
  }

  _sourceList() {
    const list = this._displayState()?.attributes?.source_list;
    return Array.isArray(list) ? list : [];
  }

  _activeMapping() {
    const source = norm(this._currentSource());
    const mapping = this._config.mappings.find(item => norm(item?.source) === source);
    if (mapping) return { ...mapping, fallback: false };
    const fallback = this._config.fallback || {};
    const entity = fallback.entity || this._config.display_entity || "";
    return { name: fallback.name || "Display", type: fallback.type || "webos", entity, fallback: true };
  }

  _routeName(route) {
    if (!route) return "Not mapped";
    return route.name || this._hass?.states?.[route.entity]?.attributes?.friendly_name || route.entity || PRESET_LABELS[route.type] || "Device";
  }

  _commandFor(route, action) {
    if (!route) return null;
    if (route.commands && Object.prototype.hasOwnProperty.call(route.commands, action)) return route.commands[action] || null;
    return PRESETS[route.type]?.[action] ?? null;
  }

  async _call(domain, service, data, targetEntity) {
    if (!this._hass) return;
    try {
      if (targetEntity) await this._hass.callService(domain, service, data || {}, { entity_id: targetEntity });
      else await this._hass.callService(domain, service, data || {});
    } catch (err) {
      console.error("Smart Remote Card:", err);
      this._toast(err?.message || "Remote command failed");
    }
  }

  _toast(message) {
    this.dispatchEvent(new CustomEvent("hass-notification", { detail: { message }, bubbles: true, composed: true }));
  }

  async _send(action) {
    const route = this._activeMapping();
    const entity = route?.entity;
    if (!entity) return this._toast(`No device is mapped for ${this._currentSource() || "the current source"}.`);

    if (route.type === "media_player") return this._sendMediaPlayer(entity, action);

    if (route.type === "webos") {
      if (action === "play_pause") return this._call("media_player", "media_play_pause", {}, entity);
      if (action === "stop") return this._call("media_player", "media_stop", {}, entity);
      if (action === "previous") return this._call("media_player", "media_previous_track", {}, entity);
      if (action === "next") return this._call("media_player", "media_next_track", {}, entity);
    }

    const command = this._commandFor(route, action);
    if (!command) return;

    if (route.type === "webos") return this._call("webostv", "button", { button: command }, entity);

    return this._call("remote", "send_command", { command }, entity);
  }

  async _sendMediaPlayer(entity, action) {
    const serviceMap = {
      play_pause: "media_play_pause", play: "media_play", pause: "media_pause", stop: "media_stop",
      next: "media_next_track", previous: "media_previous_track", volume_up: "volume_up", volume_down: "volume_down",
      channel_up: "media_next_track", channel_down: "media_previous_track",
    };
    if (action === "mute") {
      const state = this._hass?.states?.[entity];
      return this._call("media_player", "volume_mute", { is_volume_muted: !Boolean(state?.attributes?.is_volume_muted) }, entity);
    }
    const service = serviceMap[action];
    if (service) return this._call("media_player", service, {}, entity);
  }

  async _togglePowerEntity(entity, label = "Power") {
    if (!entity) return this._toast(`Choose a ${label.toLowerCase()} entity in the visual editor.`);
    const state = this._hass?.states?.[entity];
    const off = ["off", "standby", "unavailable", "unknown"].includes(state?.state);
    return this._call("homeassistant", off ? "turn_on" : "turn_off", {}, entity);
  }

  async _power() {
    const inferredMode = this._config.power_entity && this._config.power_entity !== this._config.display_entity ? "helper" : "display";
    const mode = this._config.power_mode || inferredMode;
    const entity = mode === "helper" ? this._config.power_entity : this._config.display_entity;
    if (mode === "helper" && !entity) return this._toast("Choose a TV power helper / entity in the visual editor.");
    return this._togglePowerEntity(entity, "TV power");
  }

  async _devicePower() {
    const route = this._activeMapping();
    if (!route?.power_entity) return;
    return this._togglePowerEntity(route.power_entity, `${this._routeName(route)} power`);
  }

  _devicePowerState(route = this._activeMapping()) {
    const entity = route?.power_entity;
    return entity ? this._hass?.states?.[entity] || null : null;
  }

  async _volume(action) {
    const entity = this._config.volume_entity || this._config.display_entity;
    if (!entity) return this._toast("Choose a volume entity in the visual editor.");
    const domain = domainOf(entity);
    if (domain === "remote") {
      const preset = this._config.volume_remote_type || "android_tv";
      const key = action === "up" ? "volume_up" : action === "down" ? "volume_down" : "mute";
      const command = PRESETS[preset]?.[key] || PRESETS.remote[key];
      return this._call("remote", "send_command", { command }, entity);
    }
    if (domain !== "media_player") return this._toast("Volume entity must be a media_player or remote entity.");
    if (action === "mute") {
      const state = this._hass?.states?.[entity];
      return this._call("media_player", "volume_mute", { is_volume_muted: !Boolean(state?.attributes?.is_volume_muted) }, entity);
    }
    return this._call("media_player", action === "up" ? "volume_up" : "volume_down", {}, entity);
  }

  async _selectSource(source) {
    const entity = this._config.display_entity;
    if (!entity || !source) return;
    return this._call("media_player", "select_source", { source }, entity);
  }

  _deviceSourceEntity(route = this._activeMapping()) {
    if (!route) return "";
    if (route.source_entity) return route.source_entity;
    return route.type === "media_player" ? route.entity || "" : "";
  }

  _deviceSourceState(route = this._activeMapping()) {
    const entity = this._deviceSourceEntity(route);
    return entity ? this._hass?.states?.[entity] || null : null;
  }

  _deviceSourceList(route = this._activeMapping()) {
    const list = this._deviceSourceState(route)?.attributes?.source_list;
    return Array.isArray(list) ? list : [];
  }

  _currentDeviceSource(route = this._activeMapping()) {
    return this._deviceSourceState(route)?.attributes?.source ?? "";
  }

  async _selectDeviceSource(source) {
    const route = this._activeMapping();
    const entity = this._deviceSourceEntity(route);
    if (!entity || !source) return;
    return this._call("media_player", "select_source", { source }, entity);
  }

  _supported(action) {
    const route = this._activeMapping();
    if (route?.type === "media_player") return ["play_pause","play","pause","stop","next","previous","volume_up","volume_down","mute","channel_up","channel_down"].includes(action);
    if (route?.type === "webos" && ["play_pause","stop","previous","next"].includes(action)) return true;
    return Boolean(this._commandFor(route, action));
  }

  _button(action, icon, label, extra = "") {
    const disabled = !this._supported(action);
    return `<button class="key ${extra}" data-action="${esc(action)}" ${disabled ? "disabled" : ""} title="${esc(label)}" aria-label="${esc(label)}"><ha-icon icon="${esc(icon)}"></ha-icon><span>${esc(label)}</span></button>`;
  }

  _iconButton(action, icon, label, extra = "") {
    const disabled = !this._supported(action);
    return `<button class="icon-key ${extra}" data-action="${esc(action)}" ${disabled ? "disabled" : ""} title="${esc(label)}" aria-label="${esc(label)}"><ha-icon icon="${esc(icon)}"></ha-icon></button>`;
  }

  render() {
    if (!this.shadowRoot) return;
    const route = this._activeMapping();
    const source = this._currentSource();
    const sources = this._sourceList();
    const display = this._displayState();
    const isOff = !display || ["off", "unavailable", "unknown"].includes(display.state);
    const theme = ["light", "dark"].includes(this._config.theme) ? this._config.theme : "system";

    const sourceSelector = this._config.show_source_selector !== false && sources.length
      ? `<select id="source-select" aria-label="TV source">${sources.map(s => `<option value="${esc(s)}" ${String(s) === String(source) ? "selected" : ""}>${esc(s)}</option>`).join("")}</select>`
      : "";

    const deviceSources = this._deviceSourceList(route);
    const currentDeviceSource = this._currentDeviceSource(route);
    const deviceSourceSelector = this._config.show_device_source_selector !== false && deviceSources.length
      ? `<select id="device-source-select" aria-label="${esc(this._routeName(route))} app or source">${deviceSources.map(s => `<option value="${esc(s)}" ${String(s) === String(currentDeviceSource) ? "selected" : ""}>${esc(s)}</option>`).join("")}</select>`
      : "";
    const devicePowerState = this._devicePowerState(route);
    const devicePowerOn = Boolean(devicePowerState && !["off","standby","unavailable","unknown"].includes(devicePowerState.state));
    const devicePowerButton = route?.power_entity
      ? `<button id="device-power" class="device-power ${devicePowerOn ? "is-on" : ""}" title="${esc(this._routeName(route))} power" aria-label="${esc(this._routeName(route))} power"><ha-icon icon="mdi:power"></ha-icon></button>`
      : "";

    const tabs = [
      ["nav", "Navigation", "mdi:remote-tv"],
      ...(this._config.show_keypad === false ? [] : [["keypad", "Keypad", "mdi:dialpad"]]),
      ...(this._config.show_playback === false ? [] : [["playback", "Playback", "mdi:play-circle-outline"]]),
    ];
    if (!tabs.some(t => t[0] === this._tab)) this._tab = "nav";

    let panel = "";
    if (this._tab === "nav") {
      panel = `
        <div class="utility-row">
          ${this._button("back", "mdi:arrow-left", "Back")}
          ${this._button("home", "mdi:home-outline", "Home")}
          ${this._button("menu", "mdi:menu", "Menu")}
        </div>
        <div class="dpad" role="group" aria-label="Directional pad">
          ${this._iconButton("up", "mdi:chevron-up", "Up", "up")}
          ${this._iconButton("left", "mdi:chevron-left", "Left", "left")}
          <button class="ok" data-action="ok" ${this._supported("ok") ? "" : "disabled"} aria-label="OK">OK</button>
          ${this._iconButton("right", "mdi:chevron-right", "Right", "right")}
          ${this._iconButton("down", "mdi:chevron-down", "Down", "down")}
        </div>
        ${this._config.show_channels === false ? "" : `<div class="utility-row channel-row">
          ${this._button("channel_down", "mdi:chevron-down", "CH −")}
          ${this._button("guide", "mdi:television-guide", "Guide")}
          ${this._button("channel_up", "mdi:chevron-up", "CH +")}
        </div>`}
      `;
    } else if (this._tab === "keypad") {
      panel = `<div class="keypad">${[1,2,3,4,5,6,7,8,9].map(n => `<button class="digit" data-action="${n}" ${this._supported(String(n)) ? "" : "disabled"}>${n}</button>`).join("")}
        <button class="digit muted-slot" disabled></button><button class="digit" data-action="0" ${this._supported("0") ? "" : "disabled"}>0</button>${this._iconButton("delete", "mdi:backspace-outline", "Delete", "digit")}
      </div>`;
    } else {
      panel = `<div class="playback-grid">
        ${this._iconButton("rewind", "mdi:rewind", "Rewind")}
        ${this._iconButton("play_pause", "mdi:play-pause", "Play/Pause", "primary")}
        ${this._iconButton("fast_forward", "mdi:fast-forward", "Fast forward")}
        ${this._iconButton("previous", "mdi:skip-previous", "Previous")}
        ${this._iconButton("stop", "mdi:stop", "Stop")}
        ${this._iconButton("next", "mdi:skip-next", "Next")}
      </div>`;
    }

    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <ha-card data-theme="${theme}">
        <div class="shell">
          <header>
            <div class="heading">
              <div class="title">${esc(this._config.title || "Smart Remote")}</div>
              <div class="status">
                <span class="source">${esc(source || (isOff ? "Display off" : "Source unknown"))}</span>
                <span class="dot">•</span>
                <span>${esc(this._routeName(route))}</span>
                ${route?.fallback ? '<span class="fallback">fallback</span>' : ""}
              </div>
            </div>
            <button id="power" class="round power" title="Power" aria-label="Power"><ha-icon icon="mdi:power"></ha-icon></button>
          </header>
          ${sourceSelector ? `<div class="source-row"><ha-icon icon="mdi:video-input-hdmi"></ha-icon><div class="source-select-wrap"><span>TV input</span>${sourceSelector}</div></div>` : ""}
          ${(deviceSourceSelector || devicePowerButton) ? `<div class="source-row device-source-row"><ha-icon icon="${deviceSourceSelector ? "mdi:apps" : "mdi:devices"}"></ha-icon><div class="source-select-wrap"><span>${esc(this._routeName(route))}</span>${deviceSourceSelector || '<span class="device-power-label">Device power</span>'}</div>${devicePowerButton}</div>` : ""}
          <div class="global-row" role="group" aria-label="TV controls">
            <button data-volume="down" title="Volume down"><ha-icon icon="mdi:volume-minus"></ha-icon></button>
            <button data-volume="mute" title="Mute"><ha-icon icon="mdi:volume-mute"></ha-icon></button>
            <button data-volume="up" title="Volume up"><ha-icon icon="mdi:volume-plus"></ha-icon></button>
          </div>
          <nav class="tabs">${tabs.map(([id,label,icon]) => `<button data-tab="${id}" class="${id === this._tab ? "selected" : ""}" title="${label}"><ha-icon icon="${icon}"></ha-icon><span>${label}</span></button>`).join("")}</nav>
          <main>${panel}</main>
          <footer><span>Smart Remote Card</span><span>v${SMART_REMOTE_VERSION}</span></footer>
        </div>
      </ha-card>`;

    this.shadowRoot.querySelectorAll("[data-action]").forEach(btn => btn.addEventListener("click", () => this._send(btn.dataset.action)));
    this.shadowRoot.querySelectorAll("[data-volume]").forEach(btn => btn.addEventListener("click", () => this._volume(btn.dataset.volume)));
    this.shadowRoot.querySelectorAll("[data-tab]").forEach(btn => btn.addEventListener("click", () => { this._tab = btn.dataset.tab; this.render(); }));
    this.shadowRoot.getElementById("power")?.addEventListener("click", () => this._power());
    this.shadowRoot.getElementById("source-select")?.addEventListener("change", e => this._selectSource(e.target.value));
    this.shadowRoot.getElementById("device-source-select")?.addEventListener("change", e => this._selectDeviceSource(e.target.value));
    this.shadowRoot.getElementById("device-power")?.addEventListener("click", () => this._devicePower());
  }

  _styles() {
    return `
      :host{display:block}
      ha-card{overflow:hidden;background:var(--ha-card-background,var(--card-background-color));color:var(--primary-text-color);border-radius:var(--ha-card-border-radius,18px)}
      ha-card[data-theme="dark"]{--smart-bg:#1c1c1e;--smart-panel:#2c2c2e;--smart-soft:#3a3a3c;--smart-text:#fff;--smart-muted:#a9a9ad;--smart-border:rgba(255,255,255,.09)}
      ha-card[data-theme="light"]{--smart-bg:#f7f7f8;--smart-panel:#fff;--smart-soft:#eeeeF1;--smart-text:#151516;--smart-muted:#68686d;--smart-border:rgba(0,0,0,.08)}
      ha-card[data-theme="system"]{--smart-bg:var(--card-background-color);--smart-panel:var(--secondary-background-color);--smart-soft:color-mix(in srgb,var(--secondary-background-color) 82%,var(--primary-text-color) 18%);--smart-text:var(--primary-text-color);--smart-muted:var(--secondary-text-color);--smart-border:var(--divider-color)}
      *{box-sizing:border-box} button,select{font:inherit}
      .shell{max-width:410px;margin:0 auto;padding:18px;background:var(--smart-bg);color:var(--smart-text)}
      header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.title{font-size:20px;font-weight:700;line-height:1.15}.status{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:5px;font-size:12px;color:var(--smart-muted)}.source{font-weight:700;color:var(--smart-text)}.dot{opacity:.55}.fallback{padding:2px 6px;border-radius:999px;background:var(--smart-soft);font-size:10px;text-transform:uppercase;letter-spacing:.04em}
      button{border:0;color:var(--smart-text);background:var(--smart-panel);cursor:pointer;transition:transform .08s ease,background .15s ease}button:active:not(:disabled){transform:scale(.96)}button:disabled{opacity:.28;cursor:not-allowed}.round{width:44px;height:44px;border-radius:50%;display:grid;place-items:center}.power{color:var(--error-color,#e53935)}.power ha-icon{--mdc-icon-size:23px}
      .source-row{display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:8px 11px;border:1px solid var(--smart-border);border-radius:14px;background:var(--smart-panel)}.source-row ha-icon{color:var(--smart-muted);--mdc-icon-size:21px}.source-select-wrap{display:flex;align-items:center;gap:8px;flex:1;min-width:0}.source-select-wrap>span{font-size:11px;color:var(--smart-muted);white-space:nowrap}.source-row select{flex:1;min-width:0;border:0;outline:0;background:transparent;color:var(--smart-text);padding:4px}.source-row option{color:#111;background:#fff}.device-source-row{margin-top:-4px}.device-power{width:34px;height:34px;flex:0 0 34px;border-radius:50%;display:grid;place-items:center;background:var(--smart-soft);color:var(--smart-muted)}.device-power.is-on{color:var(--primary-color);background:color-mix(in srgb,var(--primary-color) 16%,var(--smart-panel))}.device-power ha-icon{--mdc-icon-size:19px}.device-power-label{flex:1}
      .global-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px}.global-row button{height:44px;border-radius:14px}.global-row ha-icon{--mdc-icon-size:24px}
      .tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:4px;margin-bottom:16px;border-radius:14px;background:var(--smart-panel)}.tabs button{min-width:0;height:38px;border-radius:11px;background:transparent;color:var(--smart-muted);display:flex;align-items:center;justify-content:center;gap:5px;font-size:11px}.tabs button.selected{background:var(--primary-color);color:var(--text-primary-color,#fff);box-shadow:0 2px 8px rgba(0,0,0,.12)}.tabs ha-icon{--mdc-icon-size:18px}@media(max-width:340px){.tabs span{display:none}}
      main{min-height:238px;display:flex;flex-direction:column;justify-content:center}.utility-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.key{height:48px;border-radius:15px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px}.key ha-icon{--mdc-icon-size:20px}.dpad{position:relative;width:184px;height:184px;margin:14px auto;border-radius:50%;background:radial-gradient(circle at center,var(--smart-panel) 0 32%,var(--smart-soft) 33% 100%);box-shadow:inset 0 0 0 1px var(--smart-border)}.icon-key{width:54px;height:54px;border-radius:50%;display:grid;place-items:center}.icon-key ha-icon{--mdc-icon-size:29px}.dpad .icon-key{position:absolute;background:transparent}.dpad .up{top:2px;left:65px}.dpad .down{bottom:2px;left:65px}.dpad .left{left:2px;top:65px}.dpad .right{right:2px;top:65px}.dpad .ok{position:absolute;left:62px;top:62px;width:60px;height:60px;border-radius:50%;background:var(--primary-color);color:var(--text-primary-color,#fff);font-weight:800}.channel-row{margin-top:0}
      .keypad{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:290px;width:100%;margin:auto}.digit{height:54px;border-radius:17px;font-size:18px;font-weight:700}.digit.icon-key{width:auto}.muted-slot{visibility:hidden}.playback-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;max-width:290px;width:100%;margin:auto}.playback-grid .icon-key{width:100%;height:62px;border-radius:19px}.playback-grid .primary{background:var(--primary-color);color:var(--text-primary-color,#fff)}
      footer{display:flex;justify-content:space-between;margin-top:14px;padding-top:10px;border-top:1px solid var(--smart-border);font-size:10px;color:var(--smart-muted)}
      button:focus-visible,select:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
    `;
  }
}

class SmartRemoteCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = SmartRemoteCard.getStubConfig();
    this._hass = null;
    this._rendered = false;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._rendered) this.render();
  }

  setConfig(config) {
    this._config = Object.assign(SmartRemoteCard.getStubConfig(), clone(config || {}));
    this._config.mappings = Array.isArray(config?.mappings) ? clone(config.mappings) : [];
    this._config.fallback = Object.assign({ type: "webos", entity: "" }, clone(config?.fallback || {}));
    if (!this._rendered || !this.matches(":focus-within")) this.render();
  }

  _fire(next) {
    this._config = next;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: next }, bubbles: true, composed: true }));
  }

  _entities(domains = []) {
    if (!this._hass) return [];
    return Object.keys(this._hass.states).filter(id => !domains.length || domains.includes(domainOf(id))).sort((a,b) => {
      const an = this._hass.states[a]?.attributes?.friendly_name || a;
      const bn = this._hass.states[b]?.attributes?.friendly_name || b;
      return an.localeCompare(bn);
    });
  }

  _entityOptions(selected, domains = []) {
    const ids = this._entities(domains);
    if (selected && !ids.includes(selected)) ids.unshift(selected);
    return `<option value="">— None —</option>${ids.map(id => `<option value="${esc(id)}" ${id === selected ? "selected" : ""}>${esc(this._hass?.states?.[id]?.attributes?.friendly_name || id)} · ${esc(id)}</option>`).join("")}`;
  }

  _sourceOptions(selected) {
    const entity = this._config.display_entity;
    const sources = this._hass?.states?.[entity]?.attributes?.source_list;
    if (!Array.isArray(sources) || !sources.length) return null;
    const list = [...sources];
    if (selected && !list.includes(selected)) list.unshift(selected);
    return list.map(s => `<option value="${esc(s)}" ${s === selected ? "selected" : ""}>${esc(s)}</option>`).join("");
  }

  _typeOptions(selected) {
    return Object.entries(PRESET_LABELS).map(([value,label]) => `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`).join("");
  }

  _domainsForType(type) {
    if (["android_tv","remote","totalplay"].includes(type)) return ["remote"];
    if (["webos","media_player"].includes(type)) return ["media_player"];
    return [];
  }

  _update(path, value) {
    const next = clone(this._config);
    if (path[0] === "mapping") {
      const [,index,key] = path;
      next.mappings[index] = { ...(next.mappings[index] || {}), [key]: value };
    } else if (path[0] === "fallback") {
      next.fallback = { ...(next.fallback || {}), [path[1]]: value };
    } else {
      next[path[0]] = value;
    }
    this._fire(next);
  }

  _addMapping() {
    const next = clone(this._config);
    const sources = this._hass?.states?.[next.display_entity]?.attributes?.source_list || [];
    const used = new Set(next.mappings.map(m => m.source));
    const source = sources.find(s => !used.has(s)) || "HDMI 1";
    next.mappings.push({ source, name: "", type: "android_tv", entity: "", source_entity: "", power_entity: "" });
    this._fire(next);
    this.render();
  }

  _removeMapping(index) {
    const next = clone(this._config);
    next.mappings.splice(index, 1);
    this._fire(next);
    this.render();
  }

  _moveMapping(index, delta) {
    const next = clone(this._config);
    const to = index + delta;
    if (to < 0 || to >= next.mappings.length) return;
    [next.mappings[index], next.mappings[to]] = [next.mappings[to], next.mappings[index]];
    this._fire(next);
    this.render();
  }

  render() {
    if (!this.shadowRoot) return;
    this._rendered = true;
    const c = this._config || SmartRemoteCard.getStubConfig();
    const mappings = c.mappings || [];
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;color:var(--primary-text-color)}*{box-sizing:border-box}h3{margin:20px 0 8px;font-size:15px}p.help{margin:0 0 10px;color:var(--secondary-text-color);font-size:12px;line-height:1.4}.grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.field{display:flex;flex-direction:column;gap:5px}.field.full{grid-column:1/-1}label{font-size:11px;color:var(--secondary-text-color)}input,select{width:100%;min-width:0;height:40px;padding:0 10px;border:1px solid var(--divider-color);border-radius:10px;background:var(--card-background-color);color:var(--primary-text-color);font:inherit}.checks{display:grid;grid-template-columns:1fr 1fr;gap:8px}.check{display:flex;align-items:center;gap:8px;font-size:13px}.check input{width:auto;height:auto}.mapping{padding:12px;margin:10px 0;border:1px solid var(--divider-color);border-radius:14px;background:var(--secondary-background-color)}.mapping-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}.mapping-title{font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.map-actions{display:flex;gap:4px}.small{width:32px;height:32px;border:0;border-radius:9px;background:var(--card-background-color);color:var(--primary-text-color);cursor:pointer}.small.danger{color:var(--error-color)}.add{width:100%;height:42px;border:1px dashed var(--primary-color);border-radius:12px;background:transparent;color:var(--primary-color);font-weight:700;cursor:pointer}.version{margin-top:18px;font-size:10px;color:var(--secondary-text-color);text-align:right}@media(max-width:520px){.grid{grid-template-columns:1fr}.field.full{grid-column:auto}.checks{grid-template-columns:1fr}}
      </style>
      <h3>Display</h3>
      <p class="help">The display's current source chooses which mapped device receives remote commands.</p>
      <div class="grid">
        <div class="field full"><label>Display / TV entity</label><select data-root="display_entity">${this._entityOptions(c.display_entity,["media_player"])}</select></div>
        <div class="field"><label>Card title</label><input data-root="title" value="${esc(c.title || "")}"></div>
        <div class="field"><label>Source attribute</label><input data-root="source_attribute" value="${esc(c.source_attribute || "source")}"></div>
        <div class="field full"><label>Power control</label><select data-root="power_mode">
          <option value="display" ${(c.power_mode || ((!c.power_entity || c.power_entity === c.display_entity) ? "display" : "helper")) === "display" ? "selected" : ""}>Use Display / TV entity</option>
          <option value="helper" ${(c.power_mode || ((!c.power_entity || c.power_entity === c.display_entity) ? "display" : "helper")) === "helper" ? "selected" : ""}>Use separate power helper / entity</option>
        </select></div>
        ${(c.power_mode || ((!c.power_entity || c.power_entity === c.display_entity) ? "display" : "helper")) === "helper"
          ? `<div class="field full"><label>TV power helper / entity</label><select data-root="power_entity">${this._entityOptions(c.power_entity || "",["media_player","switch","input_boolean","remote"])}</select></div>`
          : ""}
      </div>

      <h3>Global TV controls</h3>
      <p class="help">Volume stays on this entity even when HDMI device routing changes.</p>
      <div class="grid">
        <div class="field full"><label>Volume entity</label><select data-root="volume_entity">${this._entityOptions(c.volume_entity || c.display_entity,["media_player","remote"])}</select></div>
        <div class="field"><label>Remote volume preset</label><select data-root="volume_remote_type">${["android_tv","totalplay","remote"].map(v=>`<option value="${v}" ${v === (c.volume_remote_type || "android_tv") ? "selected" : ""}>${PRESET_LABELS[v]}</option>`).join("")}</select></div>
      </div>

      <h3>Source mappings</h3>
      <p class="help">Map each HDMI/source name to the entity that should receive navigation and media keys.</p>
      <div id="mappings">${mappings.map((m,i) => {
        const sourceOptions = this._sourceOptions(m.source);
        const domains = this._domainsForType(m.type || "android_tv");
        return `<div class="mapping" data-index="${i}">
          <div class="mapping-head"><div class="mapping-title">${esc(m.name || m.source || `Mapping ${i+1}`)}</div><div class="map-actions">
            <button class="small" data-move="-1" ${i===0?"disabled":""} title="Move up">↑</button>
            <button class="small" data-move="1" ${i===mappings.length-1?"disabled":""} title="Move down">↓</button>
            <button class="small danger" data-remove title="Remove">×</button>
          </div></div>
          <div class="grid">
            <div class="field"><label>TV source</label>${sourceOptions ? `<select data-map="source">${sourceOptions}</select>` : `<input data-map="source" value="${esc(m.source || "")}" placeholder="HDMI 1">`}</div>
            <div class="field"><label>Device name</label><input data-map="name" value="${esc(m.name || "")}" placeholder="Android TV"></div>
            <div class="field"><label>Control type</label><select data-map="type">${this._typeOptions(m.type || "android_tv")}</select></div>
            <div class="field"><label>Control entity</label><select data-map="entity">${this._entityOptions(m.entity || "",domains)}</select></div>
            <div class="field full"><label>Apps / source entity (optional)</label><select data-map="source_entity">${this._entityOptions(m.source_entity || (m.type === "media_player" ? m.entity : ""),["media_player"])}</select></div>
            <div class="field full"><label>Device power helper / entity (optional)</label><select data-map="power_entity">${this._entityOptions(m.power_entity || "",["media_player","switch","input_boolean","remote"])}</select></div>
          </div>
        </div>`;
      }).join("")}</div>
      <button class="add" id="add-mapping">+ Add source mapping</button>

      <h3>Unmapped sources</h3>
      <p class="help">This fallback handles native TV apps or any source without an explicit mapping.</p>
      <div class="grid">
        <div class="field"><label>Fallback control type</label><select data-fallback="type">${this._typeOptions(c.fallback?.type || "webos")}</select></div>
        <div class="field"><label>Fallback entity</label><select data-fallback="entity">${this._entityOptions(c.fallback?.entity || c.display_entity,this._domainsForType(c.fallback?.type || "webos"))}</select></div>
        <div class="field full"><label>Fallback name</label><input data-fallback="name" value="${esc(c.fallback?.name || "")}" placeholder="LG webOS"></div>
      </div>

      <h3>Appearance</h3>
      <div class="grid"><div class="field"><label>Theme</label><select data-root="theme">${["system","light","dark"].map(v=>`<option value="${v}" ${v === (c.theme || "system") ? "selected" : ""}>${v[0].toUpperCase()+v.slice(1)}</option>`).join("")}</select></div></div>
      <div class="checks">
        ${[["show_source_selector","TV source selector"],["show_device_source_selector","Mapped device app/source selector"],["show_keypad","Keypad tab"],["show_playback","Playback tab"],["show_channels","Channel controls"]].map(([key,label])=>`<label class="check"><input type="checkbox" data-check="${key}" ${c[key] !== false ? "checked" : ""}>${label}</label>`).join("")}
      </div>
      <div class="version">Smart Remote Card v${SMART_REMOTE_VERSION}</div>`;

    this.shadowRoot.querySelectorAll("[data-root]").forEach(el => el.addEventListener("change", e => { this._update([el.dataset.root], e.target.value); if (["display_entity","power_mode"].includes(el.dataset.root)) this.render(); }));
    this.shadowRoot.querySelectorAll("input[data-root]").forEach(el => el.addEventListener("input", e => this._update([el.dataset.root], e.target.value)));
    this.shadowRoot.querySelectorAll("[data-check]").forEach(el => el.addEventListener("change", e => this._update([el.dataset.check], e.target.checked)));
    this.shadowRoot.querySelectorAll(".mapping").forEach(box => {
      const index = Number(box.dataset.index);
      box.querySelectorAll("[data-map]").forEach(el => el.addEventListener(el.tagName === "INPUT" ? "input" : "change", e => { this._update(["mapping",index,el.dataset.map], e.target.value); if (el.dataset.map === "type") this.render(); }));
      box.querySelector("[data-remove]")?.addEventListener("click", () => this._removeMapping(index));
      box.querySelectorAll("[data-move]").forEach(btn => btn.addEventListener("click", () => this._moveMapping(index, Number(btn.dataset.move))));
    });
    this.shadowRoot.querySelectorAll("[data-fallback]").forEach(el => el.addEventListener(el.tagName === "INPUT" ? "input" : "change", e => { this._update(["fallback",el.dataset.fallback], e.target.value); if (el.dataset.fallback === "type") this.render(); }));
    this.shadowRoot.getElementById("add-mapping")?.addEventListener("click", () => this._addMapping());
  }
}


class SmartRemotePopupCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._portal = null;
    this._escHandler = event => {
      if (event.key === "Escape") this._closePopup();
    };
  }

  static getConfigElement() { return document.createElement("smart-remote-popup-card-editor"); }
  static getStubConfig() {
    return Object.assign(SmartRemoteCard.getStubConfig(), {
      button_label: "Remote",
      button_icon: "mdi:remote-tv",
      button_style: "horizontal",
      popup_width: "normal",
    });
  }

  setConfig(config) {
    if (!config) throw new Error("Smart Remote Popup Button requires configuration.");
    this._config = Object.assign(SmartRemotePopupCard.getStubConfig(), clone(config));
    this._config.mappings = Array.isArray(config.mappings) ? clone(config.mappings) : [];
    this._config.fallback = Object.assign({ type: "webos", entity: "" }, clone(config.fallback || {}));
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    const remote = this._portal?.querySelector("smart-remote-card");
    if (remote) remote.hass = hass;
    this.render();
  }

  getCardSize() { return 1; }
  getGridOptions() {
    const style = this._config.button_style || "horizontal";
    return { columns: style === "icon" ? 1 : 2, rows: 1, min_columns: 1, min_rows: 1 };
  }

  _popupWidth() {
    const mode = String(this._config.popup_width || "normal").toLowerCase();
    if (mode === "wide") return "min(620px, calc(100vw - 24px))";
    if (mode === "compact") return "min(420px, calc(100vw - 24px))";
    return "min(500px, calc(100vw - 24px))";
  }

  _remoteConfig() {
    const config = clone(this._config);
    delete config.button_label;
    delete config.button_icon;
    delete config.button_style;
    delete config.popup_width;
    return config;
  }

  _openPopup() {
    if (this._portal) return;
    const portal = document.createElement("div");
    portal.id = "smart-remote-popup-portal";
    portal.style.cssText = "position:fixed;inset:0;z-index:2147483000;pointer-events:none;";

    const style = document.createElement("style");
    style.textContent =
      "#smart-remote-popup-portal .srp-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.42);backdrop-filter:blur(2px);pointer-events:auto}" +
      "#smart-remote-popup-portal .srp-shell{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:" + this._popupWidth() + ";max-height:min(88dvh,760px);overflow:auto;border-radius:24px;pointer-events:auto;box-shadow:0 24px 80px rgba(0,0,0,.45);overscroll-behavior:contain}" +
      "#smart-remote-popup-portal .srp-close{position:sticky;float:right;top:10px;right:10px;z-index:20;width:36px;height:36px;margin:10px 10px -46px 0;border:0;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--card-background-color,#fff) 88%,transparent);color:var(--primary-text-color,#111);box-shadow:0 2px 12px rgba(0,0,0,.16);cursor:pointer}" +
      "#smart-remote-popup-portal .srp-close ha-icon{--mdc-icon-size:20px}" +
      "#smart-remote-popup-portal smart-remote-card{display:block}" +
      "@media(max-width:520px){#smart-remote-popup-portal .srp-shell{top:auto;bottom:0;left:0;transform:none;width:100%;max-height:92dvh;border-radius:24px 24px 0 0}}";

    const backdrop = document.createElement("div");
    backdrop.className = "srp-backdrop";

    const shell = document.createElement("div");
    shell.className = "srp-shell";
    shell.setAttribute("role", "dialog");
    shell.setAttribute("aria-modal", "true");
    shell.setAttribute("aria-label", "Smart Remote");

    const close = document.createElement("button");
    close.className = "srp-close";
    close.title = "Close";
    close.setAttribute("aria-label", "Close");
    close.innerHTML = '<ha-icon icon="mdi:close"></ha-icon>';

    const remote = document.createElement("smart-remote-card");
    remote.setConfig(this._remoteConfig());
    if (this._hass) remote.hass = this._hass;

    shell.append(close, remote);
    portal.append(style, backdrop, shell);

    backdrop.addEventListener("click", () => this._closePopup());
    close.addEventListener("click", () => this._closePopup());

    (document.body || document.documentElement).appendChild(portal);
    document.addEventListener("keydown", this._escHandler);
    this._portal = portal;
  }

  _closePopup() {
    if (this._portal) this._portal.remove();
    this._portal = null;
    document.removeEventListener("keydown", this._escHandler);
  }

  disconnectedCallback() { this._closePopup(); }

  render() {
    if (!this.shadowRoot) return;
    const label = this._config.button_label || "Remote";
    const icon = this._config.button_icon || "mdi:remote-tv";
    const style = this._config.button_style || "horizontal";
    const iconOnly = style === "icon";
    const textOnly = style === "text";

    this.shadowRoot.innerHTML =
      '<style>:host{display:block}ha-card{height:100%;overflow:hidden;cursor:pointer}button{width:100%;min-height:56px;height:100%;padding:10px 14px;border:0;background:transparent;color:var(--primary-text-color);font:inherit;cursor:pointer;display:flex;align-items:center;gap:10px;text-align:left}button:active{transform:scale(.98)}button:focus-visible{outline:2px solid var(--primary-color);outline-offset:-3px;border-radius:var(--ha-card-border-radius,12px)}ha-icon{--mdc-icon-size:24px;color:var(--primary-color)}.label{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.chevron{margin-left:auto;color:var(--secondary-text-color)}</style>' +
      '<ha-card><button id="open" aria-label="' + esc(label) + '">' +
      (textOnly ? "" : '<ha-icon icon="' + esc(icon) + '"></ha-icon>') +
      (iconOnly ? "" : '<span class="label">' + esc(label) + '</span>') +
      (style === "horizontal" ? '<ha-icon class="chevron" icon="mdi:chevron-up"></ha-icon>' : "") +
      "</button></ha-card>";

    const button = this.shadowRoot.getElementById("open");
    if (button && iconOnly) button.style.justifyContent = "center";
    button?.addEventListener("click", () => this._openPopup());
  }
}

class SmartRemotePopupCardEditor extends SmartRemoteCardEditor {
  setConfig(config) {
    this._config = Object.assign(SmartRemotePopupCard.getStubConfig(), clone(config || {}));
    this._config.mappings = Array.isArray(config?.mappings) ? clone(config.mappings) : [];
    this._config.fallback = Object.assign({ type: "webos", entity: "" }, clone(config?.fallback || {}));
    if (!this._rendered || !this.matches(":focus-within")) this.render();
  }

  render() {
    super.render();
    if (!this.shadowRoot) return;

    const c = this._config || SmartRemotePopupCard.getStubConfig();
    const wrap = document.createElement("div");
    wrap.className = "popup-options";
    wrap.innerHTML =
      '<h3>Popup button</h3>' +
      '<p class="help">Configure the compact dashboard button that opens this remote.</p>' +
      '<div class="grid">' +
        '<div class="field"><label>Button label</label><input data-popup-root="button_label" value="' + esc(c.button_label || "Remote") + '"></div>' +
        '<div class="field"><label>Button icon</label><input data-popup-root="button_icon" value="' + esc(c.button_icon || "mdi:remote-tv") + '"></div>' +
        '<div class="field"><label>Button style</label><select data-popup-root="button_style">' +
          '<option value="horizontal"' + ((c.button_style || "horizontal") === "horizontal" ? " selected" : "") + '>Icon + text</option>' +
          '<option value="icon"' + (c.button_style === "icon" ? " selected" : "") + '>Icon only</option>' +
          '<option value="text"' + (c.button_style === "text" ? " selected" : "") + '>Text only</option>' +
        '</select></div>' +
        '<div class="field"><label>Popup width</label><select data-popup-root="popup_width">' +
          '<option value="compact"' + (c.popup_width === "compact" ? " selected" : "") + '>Compact</option>' +
          '<option value="normal"' + ((c.popup_width || "normal") === "normal" ? " selected" : "") + '>Normal</option>' +
          '<option value="wide"' + (c.popup_width === "wide" ? " selected" : "") + '>Wide</option>' +
        '</select></div>' +
      '</div>';

    const firstHeading = this.shadowRoot.querySelector("h3");
    if (firstHeading) firstHeading.before(wrap);
    else this.shadowRoot.prepend(wrap);

    wrap.querySelectorAll("[data-popup-root]").forEach(el => {
      const eventName = el.tagName === "INPUT" ? "input" : "change";
      el.addEventListener(eventName, event => this._update([el.dataset.popupRoot], event.target.value));
    });

    const version = this.shadowRoot.querySelector(".version");
    if (version) version.textContent = "Smart Remote Popup Button v" + SMART_REMOTE_VERSION;
  }
}


if (!customElements.get("smart-remote-card")) customElements.define("smart-remote-card", SmartRemoteCard);
if (!customElements.get("smart-remote-card-editor")) customElements.define("smart-remote-card-editor", SmartRemoteCardEditor);
if (!customElements.get("smart-remote-popup-card")) customElements.define("smart-remote-popup-card", SmartRemotePopupCard);
if (!customElements.get("smart-remote-popup-card-editor")) customElements.define("smart-remote-popup-card-editor", SmartRemotePopupCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some(card => card.type === "smart-remote-card")) {
  window.customCards.push({
    type: "smart-remote-card",
    name: "Smart Remote Card",
    description: "A source-aware universal remote that routes commands to the device connected to the active TV input.",
    preview: true,
    documentationURL: "https://github.com/fVaqueroG/HA-Smart-Remote-Card",
  });
}

if (!window.customCards.some(card => card.type === "smart-remote-popup-card")) {
  window.customCards.push({
    type: "smart-remote-popup-card",
    name: "Smart Remote Popup Button",
    description: "Open a fully configured Smart Remote in a popup from a compact dashboard button.",
    preview: true,
    documentationURL: "https://github.com/fVaqueroG/HA-Smart-Remote-Card",
  });
}

console.info(`%c SMART-REMOTE-CARD %c v${SMART_REMOTE_VERSION} `, "color:white;background:#6750A4;font-weight:700", "color:#6750A4;background:#EEEAF7");
