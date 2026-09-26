# Changelog

## v0.6.1 — 2026-09-25

- Fixed Android TV Remote applications configured manually in Home Assistant not appearing in the mapped-device app selector.
- Smart Remote now reads supported media players through Home Assistant's `media_player/browse_media` WebSocket API.
- Browse-media applications are merged with the entity's normal `source_list` without duplicating matching apps.
- Android TV Remote browse-media apps launch through `media_player.play_media` using media type `app`.
- The current Android TV app is matched using `app_id`, `app_name`, or source name.
- Media players without Browse Media support continue using `source_list` only.


## v0.6.0 — 2026-09-25

- Formalized Light, Dark, and System theme selection in the visual editor.
- Added accent color presets: System, Blue, Purple, Teal, Green, Orange, Red, and Pink.
- Added a Custom accent option with a hex color field.
- Accent color now controls selected tabs, OK/playback primary buttons, Now Playing progress, active device-power state, focus outlines, and popup button icon.
- System accent continues to follow Home Assistant's current primary theme color.
- Theme and accent settings apply to both the full Smart Remote Card and popup remote.


## v0.5.0 — 2026-09-25

- Added a Now Playing section to the Playback tab.
- Added live playback progress using `media_position`, `media_duration`, and `media_position_updated_at`.
- Progress advances locally each second while the media player is in the playing state.
- Added elapsed and total playback time.
- Added title, series/episode, and app/source context when reported by the media player.
- Added an optional Playback media entity per source mapping.
- Playback media entity automatically falls back to the mapping's Apps / source entity, then to the control entity when it is a media player.
- Added a visual-editor toggle for Now Playing.


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
