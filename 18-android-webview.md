# Android WebView and cleartext traffic

**Scoring area:** Security (96/100)

## What graders look for
Safe WebView settings, minimal permissions, no cleartext in production.

## Where your project stands
Permissions are minimal (`INTERNET`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`). OAuth opens in the real browser (`openUrl`), which Google requires. `addJavascriptInterface` is used for the `Android` bridge.

## Gap
`android:usesCleartextTraffic="true"` allows HTTP for all hosts; the bridge is exposed to whatever page the WebView loads.

## What to do
1. Use a `network_security_config.xml` that allows cleartext only for `localhost`/`10.0.2.2` in debug builds.
2. In `shouldOverrideUrlLoading`, only load your `APP_URL` origin and open everything else externally.
3. Make sure `openUrl` only accepts `https://` URLs.
