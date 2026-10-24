# Native Android push notifications — implementation notes

## Current status

The Android build workflow can now optionally consume the GitHub Actions repository secret
`GOOGLE_SERVICES_JSON`. When present, it writes the file only into the temporary build
workspace, checks that it belongs to Firebase project `kalimat-2014` and Android package
`com.kalimat.messenger`, installs Capacitor Push Notifications v6, and applies the Google
Services Gradle plugin before building. The JSON file is not committed to this repository.

If the secret is absent, the existing APK build remains available and logs that native FCM
configuration was skipped. This avoids breaking current builds while the integration is
being completed.

## Important: this is not yet end-to-end push delivery

Native push requires both sides:
1. The Android app must register with FCM and associate its token with the authenticated
   `mx_users/{uid}` account (with token rotation and logout handling).
2. A trusted server must verify the sender and authorize access to the recipient/chat before
   sending an FCM HTTP v1 notification.

Do not add a service-account private key to the app, this repository, or a GitHub build artifact.
Do not expose an unauthenticated endpoint that accepts arbitrary recipient IDs or notification
text. A Cloudflare Worker can be used without Firebase Cloud Functions, but it must verify
Firebase ID tokens and validate conversation membership before sending FCM. Its service-account
credential must be stored as a Cloudflare secret, never in client code.

## GitHub Actions secret setup (when requested)

Create repository secret `GOOGLE_SERVICES_JSON` containing the entire downloaded
`google-services.json` text. It must be the file for project `kalimat-2014` and package
`com.kalimat.messenger`. Do not paste this file into chat or commit it.

## Next verification

Run the workflow on `feat/native-fcm-android` and confirm the build succeeds with and without
the secret. Then complete and test token registration, trusted message/call event delivery,
Android notification channels/permission, and device-to-device delivery before treating this
feature as complete or merging to `main`.
