# Eco Defender Corporate Guardrails

Status: Binding standard for the first playable browsergame version.
Scope: Browsergame using Phaser/Canvas or Vanilla Canvas with an environmental arcade-shooter theme.

## Non-Negotiables

- Keep the game fictional, arcade-like, and suitable for a broad audience.
- Do not use real companies, logos, politicians, public figures, countries as enemies, or trademark-like names.
- Do not depict violence against humans, animals, protected groups, or real-world communities.
- Do not collect personal data unless explicitly approved in a future privacy review.
- Do not add network calls, trackers, ads, analytics, cookies, or persistent identifiers for the first playable build.
- Do not import AI assets, fonts, sounds, or code snippets unless their origin and usage rights are clear.

## Safety

- Enemies may be fictional objects such as oil tankers, smog drones, and deforestation robots.
- Player actions must read as cleanup, protection, recycling, repair, or neutralization of machines.
- Avoid gore, injury, screams, realistic explosions near people, disaster footage, or traumatic imagery.
- Do not reward destructive pollution behavior. Pollution may appear only as a threat to reduce or clean.
- Avoid flashing effects faster than 3 flashes per second.
- Provide a pause/restart path that works from keyboard and pointer input.

## Privacy

- Default build stores no personal data.
- Local storage may only be used for non-sensitive settings such as volume, controls, or high score.
- If high scores are stored locally, use anonymous values only and document the key name in code.
- No telemetry, analytics, remote leaderboard, account system, email capture, or fingerprinting.
- No third-party embeds or CDN dependencies unless explicitly reviewed.
- Console logs must not print user paths, environment variables, tokens, or browser identifiers.

## Accessibility

- Game must be playable with keyboard controls.
- Core controls must be visible in the game UI or start screen.
- Provide mute or volume control for sound.
- Use strong contrast for player, enemies, shots, hazards, score, and health.
- Do not rely on color alone to distinguish pickups, hazards, or health states.
- Keep text large enough to read on desktop and mobile browsers.
- Avoid tiny hit targets for essential UI; target at least 40 x 40 CSS pixels where practical.
- Pause state must stop gameplay motion and make current state understandable.

## Performance

- First playable target: stable 60 FPS on a modern laptop browser; acceptable floor is 30 FPS.
- Keep the initial load small: no heavy video, no uncompressed large audio, no oversized images.
- Use sprite atlases or simple generated shapes when they reduce draw calls and asset size.
- Cap active bullets, enemies, particles, and pickups to avoid runaway object growth.
- Remove or recycle off-screen objects.
- Avoid per-frame DOM writes during gameplay; render gameplay in canvas.
- Keep main loop work deterministic and bounded.

## Content Safety

- Environmental theme must be constructive, not fearmongering.
- Do not blame real nations, ethnic groups, workers, or individual professions for pollution.
- Avoid political slogans and real-world campaign messaging.
- Use fictional names: examples include Smog Drone, Tar Tanker, Waste Bot, Clearwave Shield.
- Text should be age-appropriate and free from profanity.
- Game-over and win text should encourage retry, repair, restoration, or improvement.

## Brand And IP Safety

- No real brand names, logos, trade dress, mascots, product shapes, or parody names close to real brands.
- Do not copy Space Invaders sprites, enemy layouts, sounds, fonts, or names.
- Inspiration is allowed at the mechanic level only: waves, dodging, shooting, score, lives, boss patterns.
- Use original names, icons, sprites, sounds, and UI styling.
- If placeholder assets are used, mark them clearly in code or docs as placeholders before release.
- Do not use copyrighted music, sound effects, stock art, or web images without documented permission.

## Engineering Quality

- Keep changes scoped to the assigned ownership area during parallel work.
- Do not revert or overwrite another worker's changes.
- Prefer simple, readable game-state code over broad abstractions for the first playable build.
- Use constants for tunable values such as speed, spawn rate, damage, score, and health.
- Avoid magic numbers in collision, scoring, and wave logic when a named constant is practical.
- Make input handling explicit and testable enough to reason about.
- Ensure restart resets score, health, enemies, bullets, timers, and wave state.
- Avoid global mutable state leaks beyond the game module or scene unless intentionally documented.
- Keep browser console free of avoidable errors and noisy debug logs before release.

## Release Readiness

- A fresh page load must show a playable start state without manual console commands.
- Verify keyboard movement, firing, collision, scoring, damage, win or progression, pause, restart, and mute.
- Verify at least one desktop viewport and one mobile/narrow viewport.
- Verify game does not crash after repeated restarts.
- Verify all required assets load locally from the project.
- Verify no external network request is required for gameplay.
- Verify no placeholder with unclear rights is shipped as final.
- Document known gaps separately; do not hide them in release notes.

## AI And Asset Usage

- AI-generated art, sound, or text must be treated as project-owned only after review for IP risk.
- Do not prompt for or recreate real brands, artists' styles, celebrity likenesses, or copyrighted game assets.
- Keep generated assets generic and original: eco ships, cleanup beams, smog drones, waste bots.
- Prefer transparent provenance: note whether assets are hand-made, generated, licensed, or placeholder.
- Generated code must be reviewed before use; no blind paste of security-sensitive or obfuscated code.
- Do not include prompt text, hidden metadata, or API keys in shipped assets or source files.

## Final Gate

Before calling a build playable, confirm:

- No real-world target or brand is attacked.
- No personal data is collected or transmitted.
- Core loop is playable without console errors.
- Controls are understandable and accessible.
- Performance stays stable under normal enemy and bullet counts.
- Asset rights are known or assets are clearly marked as placeholders.
