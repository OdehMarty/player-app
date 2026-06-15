package com.boxplayer;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.boxplayer.plugins.AllFilesAccessPlugin;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AllFilesAccessPlugin.class);
        super.onCreate(savedInstanceState);

        WebView.setWebContentsDebuggingEnabled(true);
        WebView webView = getBridge().getWebView();
        WebSettings webSettings = webView.getSettings();
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);
    }
}
