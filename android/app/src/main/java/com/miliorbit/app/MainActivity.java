package com.miliorbit.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Własne wtyczki aplikacji rejestrujemy przed startem mostu Capacitora.
        registerPlugin(VoicePlugin.class);
        registerPlugin(PhoneNumbersPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
