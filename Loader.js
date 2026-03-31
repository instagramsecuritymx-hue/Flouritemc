// Variable global para que el Script Principal pueda leerla después
var authData = {
    key: "",
    expires: "N/A",
    vendor: "N/A",
    status: "Offline"
};

// ... dentro del onClick del loginBtn ...
new java.lang.Thread(new java.lang.Runnable({
    run: function () {
        try {
            // CAMBIO: Ahora consultamos tu API en PHP
            var apiUrl = "http://aktsukiloader.kesug.com/Admin/api.php?key=" + enteredKey;
            var url = new java.net.URL(apiUrl);
            var con = url.openConnection();
            
            var reader = new java.io.BufferedReader(new java.io.InputStreamReader(con.getInputStream()));
            var response = "";
            var line;
            while ((line = reader.readLine()) != null) response += line;
            reader.close();

            // Parseamos el JSON que envía el PHP
            var res = JSON.parse(response);

            if (res.success) {
                // Guardamos los datos para la pestaña Account
                authData.key = enteredKey;
                authData.expires = res.expire_date;
                authData.vendor = res.vendor;
                authData.status = "Online";

                ui(function() {
                    clientMessage("§a¡Bienvenido! Expiración: " + res.expire_date);
                    if (GUI != null) GUI.dismiss();
                });

                // Cargamos el script original
                loadRemoteScript("https://raw.githubusercontent.com/Skylertester1863/Keys.txt/main/Loader.js");

            } else {
                ui(function() {
                    clientMessage("§cError: " + res.message);
                });
            }
        } catch (e) {
            ui(function() { clientMessage("§cError de red: " + e); });
        }
    }
})).start();
