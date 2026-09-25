# Smart Remote Card

A source-aware universal remote card for Home Assistant.

**Smart Remote Card** watches a TV/media player's current source and automatically routes navigation, keypad, channel, and playback commands to the device mapped to that source. Power, volume, mute, and input selection can remain tied to the TV (or to helpers you choose).

## Highlights

- Card-only: no helper integration is required.
- Full Lovelace visual editor.
- Map `HDMI 1`, `HDMI 2`, native apps, or any other reported source to different devices.
- Automatic source detection using the display entity's `source` attribute (configurable).
- Global power and volume targets independent from the active HDMI device.
- Source selector built from the display entity's `source_list`.
- Reorderable source mappings.
- Light, dark, and Home Assistant system themes.
- Navigation, numeric keypad, playback, and channel controls.
- Fallback controller for unmapped/native-TV sources.
- Built-in presets for:
  - Android TV Remote
  - Generic `remote.*` entities
  - LG webOS
  - Totalplay STB
  - Generic `media_player.*` playback
- Optional YAML command overrides per mapping for unusual remotes.

## Installation with HACS

1. Open HACS in Home Assistant.
2. Open the dashboard/frontend section.
3. Add this repository as a custom repository:
   `https://github.com/fVaqueroG/HA-Smart-Remote-Card`
4. Select **Dashboard** as the category.
5. Install **Smart Remote Card**.
6. Refresh Home Assistant if HACS asks you to.

The card registers as:

```yaml
type: custom:smart-remote-card
```

## Recommended setup

Add the card from the Home Assistant dashboard editor and use the **visual configuration** panel.

### 1. Display

Choose the TV/media-player entity whose current source should decide the active remote target.

For example:

```text
media_player.lg_webos_tv_ur7800psb
```

The default source attribute is `source`.

### 2. Global TV controls

Choose entities for:

- **Power** — can be the TV itself, a switch, input boolean, or another helper.
- **Volume** — normally the TV `media_player` entity.

These controls do not change when the active HDMI source changes.

### 3. Source mappings

Add one mapping for each source you want to route.

Example:

| TV source | Device name | Control type | Entity |
| --- | --- | --- | --- |
| HDMI 1 | Android TV | Android TV Remote | `remote.mitv_aesp0` |
| HDMI 2 | Totalplay | Totalplay | `remote.totalplay_remote` |
| HDMI 3 | Other receiver | Generic Remote | `remote.other_receiver` |

If the TV reports `HDMI 1`, the D-pad and playback keys go to the Android TV remote. When the TV changes to `HDMI 2`, the same on-screen remote immediately starts controlling Totalplay.

### 4. Fallback

Configure a fallback controller for any source that is not explicitly mapped. For an LG TV, choose **LG webOS** and the LG `media_player` entity so native TV apps and menus can still be controlled.

## Example YAML

The visual editor generates configuration equivalent to:

```yaml
type: custom:smart-remote-card
title: Smart Remote
display_entity: media_player.lg_webos_tv_ur7800psb
source_attribute: source
power_entity: input_boolean.tv_sala
volume_entity: media_player.lg_webos_tv_ur7800psb
theme: system
show_source_selector: true
show_keypad: true
show_playback: true
show_channels: true
mappings:
  - source: HDMI 1
    name: Android TV
    type: android_tv
    entity: remote.mitv_aesp0
  - source: HDMI 2
    name: Totalplay
    type: totalplay
    entity: remote.totalplay_remote
fallback:
  name: LG webOS
  type: webos
  entity: media_player.lg_webos_tv_ur7800psb
```

## Control presets

### Android TV Remote

Uses Home Assistant's `remote.send_command` action with Android TV Remote key names such as `DPAD_UP`, `DPAD_CENTER`, `BACK`, `HOME`, `MEDIA_PLAY_PAUSE`, `CHANNEL_UP`, and digits.

### LG webOS

Navigation and remote buttons use `webostv.button`. Playback actions that are better represented by Home Assistant media-player actions use the selected `media_player` entity.

### Totalplay

Uses `remote.send_command` with the command names supported by the Totalplay Home Assistant integration, including `up`, `down`, `left`, `right`, `ok`, `back`, `KEY_MENU`, `KEY_GUIDE`, channel/volume controls, playback, and digits.

### Generic Remote

Uses `remote.send_command` with conventional command names. If your remote expects different names, use command overrides.

### Media Player

Uses standard Home Assistant `media_player` playback actions. Directional navigation is intentionally disabled because generic media players do not expose a standard D-pad command API.

## Advanced command overrides

A mapping can override any command in YAML while retaining the preset for every other button:

```yaml
mappings:
  - source: HDMI 3
    name: Custom box
    type: remote
    entity: remote.custom_box
    commands:
      up: KEY_UP
      down: KEY_DOWN
      left: KEY_LEFT
      right: KEY_RIGHT
      ok: KEY_SELECT
      home: KEY_HOME
```

Set a command to an empty value to disable that button for the mapping.

Supported action IDs include:

`up`, `down`, `left`, `right`, `ok`, `back`, `home`, `menu`, `guide`, `info`, `play_pause`, `play`, `pause`, `stop`, `previous`, `next`, `rewind`, `fast_forward`, `channel_up`, `channel_down`, `delete`, `power`, `volume_up`, `volume_down`, `mute`, and `0` through `9`.

## Themes

The visual editor offers:

- **System** — follows Home Assistant's theme variables.
- **Light**
- **Dark**

## Notes

- The source mapping is an exact, case-insensitive match after trimming whitespace.
- The display entity should expose `source` and preferably `source_list` for the best visual-editor experience.
- A button is automatically disabled when the active control preset does not support that action.
- Global power uses Home Assistant `turn_on` / `turn_off`, which allows a switch or helper to be used instead of the TV entity.

## Version

Current initial release: **v0.1.0**

## License

MIT
