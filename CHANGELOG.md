# Changelog

## v0.4.2 — 2026-09-25

- Fixed the popup remote ignoring an existing TV power helper.
- Fixed visual-editor power-mode defaults overriding a configured power helper.
- Centralized power-mode normalization across the full card, popup card, and both editors.
- Preserved backward compatibility for cards created before the explicit power-mode selector was added.


## v0.4.1 — 2026-09-25

- Moved main TV power selection into the Display section.
- Added an explicit Power control selector: use the TV entity or a separate power helper/entity.
- The dedicated TV power helper field now appears only when separate-helper mode is selected.
- Preserved backward compatibility with existing `power_entity` configurations.


## v0.4.0 — 2026-09-25

- Added a dedicated TV power helper / entity setting.
- Added an optional power helper / entity to every mapped source/device.
- Added a mapped-device power button that only appears when configured.
- Device power state is reflected visually on the mapped-device power button.
- Added support for media_player, switch, input_boolean, and remote power entities.


## v0.3.0 — 2026-09-25

- Added an optional Apps / source entity to each mapped TV input.
- Added automatic mapped-device source discovery from `media_player.source_list`.
- Added a second in-card selector for Android TV apps or other mapped-device sources.
- Device source selection uses `media_player.select_source`.
- The selector is automatically hidden when the mapped entity has no available sources.
- Added a visual-editor toggle for the mapped-device app/source selector.


## v0.2.0 — 2026-09-25

- Added `custom:smart-remote-popup-card`.
- Added **Smart Remote Popup Button** to Home Assistant's Add Card search.
- Added a self-contained modal popup with backdrop and close controls; no Browser Mod dependency.
- Added compact button styles: icon + text, icon only, and text only.
- Added compact, normal, and wide popup sizes.
- Added mobile bottom-sheet behavior.
- Reused the full Smart Remote visual configuration for display, mappings, global controls, fallback, and theme.


## v0.1.0 — 2026-09-25

Initial Smart Remote Card release.

- Source-aware routing based on the display entity's active input.
- Visual editor for TV/display, power, volume, source mappings, fallback device, theme, and visible control sections.
- Android TV Remote, generic Remote, LG webOS, Totalplay, and media-player control presets.
- Global TV power and volume targets independent of the routed HDMI/source device.
- Navigation D-pad, numeric keypad, channel controls, playback controls, and source selector.
- YAML command overrides for devices with non-standard remote command names.
- System, light, and dark themes.
