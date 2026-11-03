package io.github.aminaqatan.zoozitv;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Zoozi App for Android TV / Google TV (Sony BRAVIA and others).
 * Shows the published Zoozi web app full screen and adds what a TV needs:
 * the remote's Back and media buttons, the TV's reading voice and a TV home-screen banner.
 * Story updates published to GitHub Pages appear here automatically.
 */
public class MainActivity extends Activity {

    static final String HOME_URL = "https://aminaqatan.github.io/Zoozi-App/?tv=1";
    static final String HOME_HOST = "aminaqatan.github.io";
    static final String OFFLINE_URL = "file:///android_asset/offline.html";

    private FrameLayout root;
    private WebView web;
    private View fullScreenView;
    private WebChromeClient.CustomViewCallback fullScreenCallback;

    private TextToSpeech tts;
    private boolean ttsReady;
    private boolean ttsFailed;
    private final List<String[]> waitingSpeech = new ArrayList<>();

    private long lastBackPress;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(243, 247, 255));
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(243, 247, 255));
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);

        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setTextZoom(100);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setUserAgentString(settings.getUserAgentString() + " ZooziTV/1");

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(web, true); // YouTube players need this.

        web.addJavascriptInterface(new TvBridge(), "ZooziTVNative");
        web.setWebViewClient(new ZooziClient());
        web.setWebChromeClient(new ZooziChrome());
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);

        startSpeechEngine();
        web.loadUrl(HOME_URL);
        web.requestFocus();
    }

    // ---------- Remote control ----------

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int key = event.getKeyCode();
        if (key == KeyEvent.KEYCODE_BACK) {
            if (event.getAction() == KeyEvent.ACTION_UP && !event.isCanceled()) onRemoteBack();
            return true;
        }
        String media = null;
        switch (key) {
            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
            case KeyEvent.KEYCODE_MEDIA_PLAY:
            case KeyEvent.KEYCODE_MEDIA_PAUSE:
                media = "play";
                break;
            case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD:
            case KeyEvent.KEYCODE_MEDIA_NEXT:
            case KeyEvent.KEYCODE_CHANNEL_UP:
                media = "next";
                break;
            case KeyEvent.KEYCODE_MEDIA_REWIND:
            case KeyEvent.KEYCODE_MEDIA_PREVIOUS:
            case KeyEvent.KEYCODE_CHANNEL_DOWN:
                media = "previous";
                break;
            default:
                break;
        }
        if (media != null && fullScreenView == null) {
            if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0) {
                runScript("window.zooziTvKey&&window.zooziTvKey('" + media + "')");
            }
            return true;
        }
        return super.dispatchKeyEvent(event);
    }

    private void onRemoteBack() {
        if (fullScreenView != null) {
            leaveFullScreen();
            return;
        }
        String url = web.getUrl();
        Uri uri = url == null ? null : Uri.parse(url);
        boolean onZoozi = uri != null && HOME_HOST.equals(uri.getHost());
        if (!onZoozi) {
            // The offline page, or a website opened from a story.
            if (url != null && url.startsWith("file:")) {
                askToClose();
            } else if (web.canGoBack()) {
                web.goBack();
            } else {
                web.loadUrl(HOME_URL);
            }
            return;
        }
        web.evaluateJavascript(
                "(function(){try{return window.zooziTvBack?window.zooziTvBack():'exit'}catch(e){return 'exit'}})()",
                value -> {
                    if (value == null || !value.contains("handled")) askToClose();
                });
    }

    private void askToClose() {
        long now = System.currentTimeMillis();
        if (now - lastBackPress < 2500) {
            finish();
        } else {
            lastBackPress = now;
            Toast.makeText(this, "Press Back again to close Zoozi", Toast.LENGTH_SHORT).show();
        }
    }

    private void runScript(String script) {
        if (web != null) web.evaluateJavascript(script, null);
    }

    // ---------- Pages and links ----------

    private class ZooziClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return request.isForMainFrame() && handleLink(request.getUrl());
        }

        @SuppressWarnings("deprecation")
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return handleLink(Uri.parse(url));
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame()) showOffline();
        }

        @SuppressWarnings("deprecation")
        @Override
        public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
            if (Build.VERSION.SDK_INT < 23 && failingUrl != null && !failingUrl.startsWith("file:")) showOffline();
        }
    }

    /** Returns true when the link was handled outside this screen. */
    private boolean handleLink(Uri uri) {
        String scheme = uri.getScheme() == null ? "" : uri.getScheme();
        String host = uri.getHost() == null ? "" : uri.getHost();
        if (scheme.equals("file") || host.equals(HOME_HOST)) return false;
        if (host.equals("youtu.be") || host.equals("youtube.com") || host.endsWith(".youtube.com")) {
            // "Watch on YouTube" opens the TV's YouTube app when it is installed.
            return openOutside(uri);
        }
        if (scheme.equals("http") || scheme.equals("https")) return false; // Other websites open here; Back returns.
        return openOutside(uri);
    }

    private boolean openOutside(Uri uri) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(intent);
            return true;
        } catch (ActivityNotFoundException | SecurityException e) {
            return false;
        }
    }

    private void showOffline() {
        if (web != null && !OFFLINE_URL.equals(web.getUrl())) web.loadUrl(OFFLINE_URL);
    }

    // ---------- Full-screen video from inside a player ----------

    private class ZooziChrome extends WebChromeClient {
        @Override
        public void onShowCustomView(View view, CustomViewCallback callback) {
            if (fullScreenView != null) {
                callback.onCustomViewHidden();
                return;
            }
            fullScreenView = view;
            fullScreenCallback = callback;
            root.addView(view, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
            web.setVisibility(View.GONE);
            view.requestFocus();
        }

        @Override
        public void onHideCustomView() {
            removeFullScreenView();
        }

        @Override
        public Bitmap getDefaultVideoPoster() {
            return Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888); // No grey placeholder before videos.
        }

        @Override
        public void onPermissionRequest(PermissionRequest request) {
            request.deny(); // Zoozi never needs the camera or microphone.
        }
    }

    private void leaveFullScreen() {
        WebChromeClient.CustomViewCallback callback = fullScreenCallback;
        removeFullScreenView();
        if (callback != null) callback.onCustomViewHidden();
    }

    private void removeFullScreenView() {
        if (fullScreenView != null) root.removeView(fullScreenView);
        fullScreenView = null;
        fullScreenCallback = null;
        web.setVisibility(View.VISIBLE);
        web.requestFocus();
    }

    // ---------- The TV's reading voice (used by the illustrated novel) ----------

    private void startSpeechEngine() {
        tts = new TextToSpeech(this, status -> runOnUiThread(() -> {
            if (status == TextToSpeech.SUCCESS && tts != null) {
                ttsReady = true;
                int result = tts.setLanguage(Locale.US);
                if (result < 0) tts.setLanguage(Locale.ENGLISH);
            } else {
                ttsFailed = true;
            }
            List<String[]> waiting = new ArrayList<>(waitingSpeech);
            waitingSpeech.clear();
            for (String[] item : waiting) speakNow(item[0], item[1], Float.parseFloat(item[2]), Float.parseFloat(item[3]), item[4]);
        }));
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override
            public void onStart(String id) {
                sendSpeechEvent(id, "start");
            }

            @Override
            public void onDone(String id) {
                sendSpeechEvent(id, "done");
            }

            @SuppressWarnings("deprecation")
            @Override
            public void onError(String id) {
                sendSpeechEvent(id, "synthesis-failed");
            }

            @Override
            public void onError(String id, int errorCode) {
                sendSpeechEvent(id, "synthesis-failed");
            }

            @Override
            public void onStop(String id, boolean interrupted) {
                sendSpeechEvent(id, "interrupted");
            }
        });
    }

    private void speakNow(String text, String lang, float rate, float pitch, String id) {
        if (!ttsReady) {
            if (ttsFailed || tts == null) sendSpeechEvent(id, "synthesis-unavailable");
            else waitingSpeech.add(new String[]{text, lang, String.valueOf(rate), String.valueOf(pitch), id});
            return;
        }
        Locale locale = Locale.forLanguageTag(lang == null || lang.isEmpty() ? "en-US" : lang);
        if (tts.setLanguage(locale) < 0) tts.setLanguage(Locale.US);
        tts.setSpeechRate(Math.max(0.5f, Math.min(2f, rate)));
        tts.setPitch(Math.max(0.5f, Math.min(2f, pitch)));
        if (tts.speak(text, TextToSpeech.QUEUE_ADD, null, id) != TextToSpeech.SUCCESS) {
            sendSpeechEvent(id, "synthesis-failed");
        }
    }

    private void sendSpeechEvent(String id, String event) {
        final String safeId = id == null ? "" : id.replaceAll("[^A-Za-z0-9_-]", "");
        runOnUiThread(() -> runScript("window.__zooziTts&&window.__zooziTts('" + safeId + "','" + event + "')"));
    }

    /** Called from the web app (window.ZooziTVNative). */
    private class TvBridge {
        @JavascriptInterface
        public void speak(String text, String lang, double rate, double pitch, String id) {
            final String words = text == null ? "" : text;
            runOnUiThread(() -> speakNow(words, lang, (float) rate, (float) pitch, id));
        }

        @JavascriptInterface
        public void stopSpeaking() {
            runOnUiThread(() -> {
                waitingSpeech.clear();
                if (tts != null) tts.stop();
            });
        }

        @JavascriptInterface
        public String version() {
            return "1";
        }
    }

    // ---------- Lifecycle ----------

    @Override
    protected void onPause() {
        if (tts != null) tts.stop();
        if (web != null) web.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) {
            web.onResume();
            web.requestFocus();
        }
    }

    @Override
    protected void onDestroy() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
            tts = null;
        }
        if (web != null) {
            root.removeAllViews();
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
