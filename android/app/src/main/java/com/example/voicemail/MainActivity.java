package com.example.voicemail;

import android.Manifest;
import android.app.Activity;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONObject;
import android.speech.tts.Voice;

import java.util.ArrayList;
import java.util.Locale;

/** WebView shell. Exposes native speech-to-text and text-to-speech to the React app as window.Android. */
public class MainActivity extends Activity {
    private static final String LANG = "en-IN";   // change to "en-US" etc. if needed
    private WebView web;
    private SpeechRecognizer recognizer;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private String pendingSpeech = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, 1);
        }

        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                int r = tts.setLanguage(Locale.forLanguageTag(LANG));
                if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) tts.setLanguage(Locale.US);
                pickBestVoice();
                tts.setAudioAttributes(new android.media.AudioAttributes.Builder()
                    .setUsage(android.media.AudioAttributes.USAGE_MEDIA)
                    .setContentType(android.media.AudioAttributes.CONTENT_TYPE_SPEECH).build());
                ttsReady = true;
                if (pendingSpeech != null) { String t = pendingSpeech; pendingSpeech = null; tts.speak(t, TextToSpeech.QUEUE_FLUSH, null, "u" + System.nanoTime()); }
            }
        });
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String id) { }
            @Override public void onDone(String id) { emit("tts", "done"); }
            @Override public void onError(String id) { emit("tts", "error"); }
        });

        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        web.addJavascriptInterface(new Bridge(), "Android");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (!r.isForMainFrame()) return;
                String html = "<body style='font-family:sans-serif;background:#0f172a;color:#e2e8f0;text-align:center;padding:2rem'>"
                    + "<h2>Cannot reach the server</h2><p>Check your internet connection and that the website is deployed.</p>"
                    + "<p style='color:#94a3b8;word-break:break-all'>" + BuildConfig.APP_URL + "</p>"
                    + "<p><a style='color:#38bdf8;font-size:1.3rem' href='" + BuildConfig.APP_URL + "'>Try again</a></p></body>";
                v.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (u.getHost() != null && BuildConfig.APP_URL.contains(u.getHost())) return false;
                startActivity(new Intent(Intent.ACTION_VIEW, u));
                return true;
            }
        });
        web.loadUrl(BuildConfig.APP_URL);
    }

    private void emit(String type, String data) {
        final String js = "window.onNative&&window.onNative(" + JSONObject.quote(type) + "," + JSONObject.quote(data) + ")";
        runOnUiThread(() -> web.evaluateJavascript(js, null));
    }

    /** Free: choose the most natural installed system voice (prefers en-IN/en-US, highest quality). */
    private void pickBestVoice() {
        try {
            Voice best = null; int bestScore = -1;
            for (Voice v : tts.getVoices()) {
                Locale l = v.getLocale();
                if (!"en".equals(l.getLanguage()) || v.getFeatures().contains("notInstalled") || v.isNetworkConnectionRequired()) continue;
                int score = v.getQuality() + ("IN".equals(l.getCountry()) ? 300 : "US".equals(l.getCountry()) ? 200 : 100);
                if (score > bestScore) { bestScore = score; best = v; }
            }
            if (best != null) tts.setVoice(best);
            tts.setSpeechRate(1.03f);
        } catch (Exception ignored) { }
    }

    private ComponentName googleRecognizer() {
        try {
            ComponentName c = new ComponentName("com.google.android.googlequicksearchbox",
                "com.google.android.voicesearch.serviceapi.GoogleRecognitionService");
            getPackageManager().getServiceInfo(c, 0);
            return c;
        } catch (Exception e) { return null; }
    }

    private void startRecognizer() {
        ComponentName google = googleRecognizer();
        if (google == null && !SpeechRecognizer.isRecognitionAvailable(this)) { emit("error", "unavailable"); return; }
        if (recognizer == null) {
            // Prefer Google's recognizer explicitly: some phones set another app (e.g. an assistant) as the default, which can't transcribe for us.
            recognizer = google != null ? SpeechRecognizer.createSpeechRecognizer(this, google) : SpeechRecognizer.createSpeechRecognizer(this);
            recognizer.setRecognitionListener(new RecognitionListener() {
                @Override public void onResults(Bundle b) {
                    ArrayList<String> r = b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    if (r != null && !r.isEmpty()) emit("result", new JSONArray(r).toString()); else emit("error", "empty");
                }
                @Override public void onError(int code) { emit("error", String.valueOf(code)); }
                @Override public void onReadyForSpeech(Bundle p) { }
                @Override public void onBeginningOfSpeech() { }
                @Override public void onRmsChanged(float v) { }
                @Override public void onBufferReceived(byte[] b) { }
                @Override public void onEndOfSpeech() { }
                @Override public void onPartialResults(Bundle b) {
                    ArrayList<String> r = b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    if (r != null && !r.isEmpty()) emit("partial", r.get(0));
                }
                @Override public void onEvent(int t, Bundle b) { }
            });
        }
        recognizer.cancel();
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, LANG);
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);              // alternatives: JS picks the one that parses as an email
        i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);       // needed for voice interruption
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 1800L);            // don't cut off natural pauses
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 1500L);
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 2500L);
        recognizer.startListening(i);
    }

    private class Bridge {
        @JavascriptInterface public void listen() { runOnUiThread(MainActivity.this::startRecognizer); }

        @JavascriptInterface public void stopListening() {
            runOnUiThread(() -> { if (recognizer != null) recognizer.cancel(); });
        }

        @JavascriptInterface public void speak(String text) {
            runOnUiThread(() -> {
                if (!ttsReady) { pendingSpeech = text; return; }   // spoken as soon as the engine finishes starting
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "u" + System.nanoTime());
            });
        }

        @JavascriptInterface public void stopSpeaking() {
            runOnUiThread(() -> { if (tts != null) tts.stop(); emit("tts", "stopped"); });
        }

        @JavascriptInterface public void openUrl(String url) {
            runOnUiThread(() -> startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url))));
        }
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack(); else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (recognizer != null) recognizer.destroy();
        if (tts != null) { tts.stop(); tts.shutdown(); }
        super.onDestroy();
    }
}
