package com.miliorbit.app;

import android.Manifest;
import android.database.Cursor;
import android.provider.ContactsContract;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * „Znajdź znajomych”: czyta z kontaktów same numery telefonów (bez imion, zdjęć i adresów).
 * Numery od razu na telefonie zamieniamy na skróty (src/lib/contacts.ts); na serwer trafiają tylko skróty.
 * Prosi wyłącznie o odczyt kontaktów (READ_CONTACTS), nigdy o zapis.
 */
@CapacitorPlugin(name = "PhoneNumbers", permissions = { @Permission(strings = { Manifest.permission.READ_CONTACTS }, alias = "contacts") })
public class PhoneNumbersPlugin extends Plugin {

    @PluginMethod
    public void getNumbers(PluginCall call) {
        if (getPermissionState("contacts") != PermissionState.GRANTED) {
            requestPermissionForAlias("contacts", call, "contactsPermission");
            return;
        }
        read(call);
    }

    @PermissionCallback
    private void contactsPermission(PluginCall call) {
        if (getPermissionState("contacts") != PermissionState.GRANTED) {
            call.reject("denied");
            return;
        }
        read(call);
    }

    private void read(PluginCall call) {
        execute(() -> {
            JSArray numbers = new JSArray();
            String[] projection = { ContactsContract.CommonDataKinds.Phone.NUMBER };
            try (Cursor c = getContext().getContentResolver().query(ContactsContract.CommonDataKinds.Phone.CONTENT_URI, projection, null, null, null)) {
                if (c != null) {
                    while (c.moveToNext()) {
                        String n = c.getString(0);
                        if (n != null && !n.isEmpty()) numbers.put(n);
                    }
                }
            } catch (Exception e) {
                call.reject("error");
                return;
            }
            JSObject ret = new JSObject();
            ret.put("numbers", numbers);
            call.resolve(ret);
        });
    }
}
