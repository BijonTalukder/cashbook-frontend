# Native shell notes

The web app is also the Play Store app, running inside the Android WebView
wrapper. Everything below is **optional on the Java side** — the web build
detects what is missing and falls back — but wiring it up is what removes the
last few "this is a web page" tells.

## Detection

The web app treats itself as native when **either** is true:

- `window.AndroidBridge` exists, or
- the WebView `userAgent` contains `HisabBoiApp`

Appending a product token to the user agent is the cheaper of the two:

```java
WebSettings s = webView.getSettings();
s.setUserAgentString(s.getUserAgentString() + " HisabBoiApp/1.0");
```

When detected, the app sets `data-native="true"` on `<html>`, moves toasts
under the app bar, and enables the hardware-back contract below.

## Java → web

The wrapper calls into `window.__hisab`, which exists from first paint.

| Call | When | Notes |
| --- | --- | --- |
| `window.__hisab.onBackPressed()` | hardware / gesture back | Returns `true` if the web app consumed it (closed a sheet, drawer or menu, or navigated back). Only finish the Activity when it returns `false`. |
| `window.__hisab.applyInsets(top, right, bottom, left)` | on `WindowInsets` change | CSS pixels. Needed because Android 15 (`targetSdk 35`) forces edge-to-edge and `env(safe-area-inset-*)` is not reliably populated in a WebView. |
| `window.__hisab.onNetworkChange(online)` | connectivity callback | Feeds the existing offline/sync runtime. |
| `window.__hisab.onResume()` | `Activity.onResume` | Triggers a refresh so the recents list never shows stale numbers. |

Back-press example:

```java
webView.evaluateJavascript("window.__hisab && window.__hisab.onBackPressed()",
    value -> {
        if (!"true".equals(value)) {
            if (webView.canGoBack()) webView.goBack();
            else finish();
        }
    });
```

Insets: divide by `getResources().getDisplayMetrics().density` before passing —
the web side expects CSS pixels, not raw device pixels.

## Web → Java

Injected as `AndroidBridge`
(`addJavascriptInterface(new WebAppInterface(), "AndroidBridge")`).
Every method is called through optional chaining inside a `try`, so implement
as many or as few as you like.

| Method | Purpose | Web fallback if absent |
| --- | --- | --- |
| `haptic(String type)` | `light` / `medium` / `heavy` / `selection` / `success` / `warning` / `error` | `navigator.vibrate` |
| `setStatusBarColor(String hex, boolean darkIcons)` | keep the status bar in step with the in-app theme | `<meta name="theme-color">` only |
| `setNavBarColor(String hex, boolean darkIcons)` | same for the navigation bar | — |
| `share(String title, String text, String url)` | the real Android share sheet | `navigator.share` |
| `toast(String message)` | native toast | in-app toast |
| `openExternal(String url)` | open in the system browser instead of hijacking the WebView | `window.open` |
| `exitApp()` | close the app after the second back press on a root screen | no-op |
| `getInsets()` | JSON `{"top":n,"right":n,"bottom":n,"left":n}`, read synchronously at boot so a slow inset callback cannot flash an unpadded header | `env(safe-area-inset-*)` |

**ProGuard**: R8 has no Java-side reference to these methods, so a release
build strips them unless the interface class is kept.

```proguard
-keepclassmembers class <your.package>.WebAppInterface {
    @android.webkit.JavascriptInterface <methods>;
}
```

## WebView settings that matter

```java
WebSettings s = webView.getSettings();
s.setJavaScriptEnabled(true);
s.setDomStorageEnabled(true);        // IndexedDB + localStorage — the offline layer needs both
s.setDatabaseEnabled(true);
s.setUseWideViewPort(true);          // honour the <meta viewport>
s.setLoadWithOverviewMode(false);
s.setBuiltInZoomControls(false);
s.setMediaPlaybackRequiresUserGesture(false);
webView.setOverScrollMode(View.OVER_SCROLL_NEVER);  // the app draws its own pull-to-refresh
```

- **Do not** wrap the WebView in a `SwipeRefreshLayout`. The app implements
  pull-to-refresh itself so a pull re-fetches instead of reloading the page,
  which would discard the in-memory offline queue.
- Keep `android:windowSoftInputMode="adjustResize"` — bottom sheets size
  themselves with `dvh` and need the viewport to shrink when the keyboard opens.
- `setWebChromeClient` is required for file inputs (product images) and for
  `console.log` to reach logcat.
