package com.miliorbit.app;

import android.app.Activity;
import android.content.Intent;
import android.speech.RecognizerIntent;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;

/**
 * Mikrofon: systemowe okno rozpoznawania mowy Androida (to samo, co przy dyktowaniu w klawiaturze Google).
 * Aplikacja nie nagrywa dźwięku sama i nie potrzebuje uprawnienia do mikrofonu; dostaje tylko gotowy tekst.
 */
@CapacitorPlugin(name = "Voice")
public class VoicePlugin extends Plugin {

    @PluginMethod
    public void available(PluginCall call) {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        JSObject ret = new JSObject();
        ret.put("available", intent.resolveActivity(getContext().getPackageManager()) != null);
        call.resolve(ret);
    }

    @PluginMethod
    public void listen(PluginCall call) {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        String language = call.getString("language", "");
        if (language != null && !language.isEmpty()) intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, language);
        String prompt = call.getString("prompt", "");
        if (prompt != null && !prompt.isEmpty()) intent.putExtra(RecognizerIntent.EXTRA_PROMPT, prompt);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        if (intent.resolveActivity(getContext().getPackageManager()) == null) {
            call.reject("unavailable");
            return;
        }
        startActivityForResult(call, intent, "listenResult");
    }

    @ActivityCallback
    private void listenResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        JSObject ret = new JSObject();
        if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
            ArrayList<String> matches = result.getData().getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS);
            ret.put("text", matches != null && !matches.isEmpty() ? matches.get(0) : "");
        } else {
            ret.put("text", "");
        }
        call.resolve(ret);
    }
}
