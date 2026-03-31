var ctx = com.mojang.minecraftpe.MainActivity.currentMainActivity.get();
var GUI = null;
var currentTab = "Local Player";
var states = {
    "Aimbot Mode": "Smooth",
    "Aimbot Target": "Cabeza", // Nueva configuración
    "Speed (Slowest)": 0
};

var COLORS = {
    bg: "#FF2B2B2B",      
    accent: "#FF8C00",    
    border: "#FF8C00",    
    text: "#FFFFFF"
};

/* --- FUNCIONES DE APOYO --- */
function dip(v) { return Math.ceil(v * ctx.getResources().getDisplayMetrics().density); }
function ui(f) { ctx.runOnUiThread(new java.lang.Runnable({run: f})); }

function skin(color, radius, strokeSize, strokeColor) {
    var shape = new android.graphics.drawable.GradientDrawable();
    shape.setColor(android.graphics.Color.parseColor(color));
    shape.setCornerRadius(dip(radius));
    if(strokeSize) shape.setStroke(dip(strokeSize), android.graphics.Color.parseColor(strokeColor));
    return shape;
}

/* --- LÓGICA PRINCIPAL (modTick) --- */
function modTick() {
    var p = getPlayerEnt();
    
    // 1. HITBOX LOGIC
    var target = Player.getPointedEntity();
    if (states["Hitbox"] && target != -1) {
        Entity.setCollisionSize(target, 2, 2.5);
    }

    // 2. SPEED x3 LOGIC
    if (states["Speed Enabled"]) {
        var curspeed = Math.sqrt(Math.pow(Entity.getVelX(p), 2) + Math.pow(Entity.getVelZ(p), 2));
        if (curspeed > 0.1) {
            setVelX(p, Entity.getVelX(p) * 1.1); 
            setVelZ(p, Entity.getVelZ(p) * 1.1);
        }
    }

    // 3. AIMBOT MODES (Smooth, Vectored, Rage)
    if (states["Aimbot Enabled"]) {
        var ents = Entity.getAll();
        for (var i in ents) {
            var e = ents[i];
            if (e != p && Entity.getEntityTypeId(e) < 64) {
                var dx = Entity.getX(e) - Player.getX();
                var dz = Entity.getZ(e) - Player.getZ();
                
                // Configuración de altura del objetivo (Cabeza, Pecho, Cuello)
                var dy;
                if(states["Aimbot Target"] == "Cabeza") dy = Entity.getY(e) - Player.getY() + 0.3;
                else if(states["Aimbot Target"] == "Cuello") dy = Entity.getY(e) - Player.getY() + 0.1;
                else dy = Entity.getY(e) - Player.getY() - 0.2; // Pecho

                var dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

                if (dist < 8) {
                    var yawAim = Math.atan2(-dx, dz) * 180 / Math.PI;
                    var pitchAim = -Math.atan2(dy, Math.sqrt(dx*dx + dz*dz)) * 180 / Math.PI;
                    
                    if (states["Aimbot Mode"] == "Rage") {
                        Entity.setRot(p, yawAim, pitchAim);
                    } else if (states["Aimbot Mode"] == "Smooth") {
                        // Smooth mejorado (0.08 para un movimiento mucho más suave y humano)
                        var curYaw = getYaw();
                        var curPitch = getPitch();
                        var diffYaw = yawAim - curYaw;
                        while (diffYaw < -180) diffYaw += 360;
                        while (diffYaw > 180) diffYaw -= 360;
                        
                        Entity.setRot(p, curYaw + (diffYaw * 0.08), curPitch + ((pitchAim - curPitch) * 0.08));
                    } else if (states["Aimbot Mode"] == "Vectored") {
                        Entity.setRot(p, yawAim + Entity.getVelX(e) * 10, pitchAim);
                    }
                    break;
                }
            }
        }
    }
}

/* --- PANEL DE CONTENIDO --- */
function loadTabContent(panel) {
    panel.removeAllViews();
    
    if (currentTab == "Local Player") {
        panel.addView(makeSubtitle("Aimbot Master"));
        panel.addView(makeSwitch("Aimbot Enabled"));
        
        // Botón de Modo
        var modeBtn = new android.widget.Button(ctx);
        modeBtn.setText("MODE: " + states["Aimbot Mode"]);
        modeBtn.setTextColor(android.graphics.Color.WHITE);
        modeBtn.setBackgroundDrawable(skin("#444444", 8, 1, COLORS.accent));
        modeBtn.setOnClickListener(new android.view.View.OnClickListener({
            onClick: function() {
                if (states["Aimbot Mode"] == "Smooth") states["Aimbot Mode"] = "Vectored";
                else if (states["Aimbot Mode"] == "Vectored") states["Aimbot Mode"] = "Rage";
                else states["Aimbot Mode"] = "Smooth";
                modeBtn.setText("MODE: " + states["Aimbot Mode"]);
            }
        }));
        panel.addView(modeBtn);

        // Botón de Objetivo (Cabeza, Pecho, Cuello)
        var targetBtn = new android.widget.Button(ctx);
        targetBtn.setText("TARGET: " + states["Aimbot Target"]);
        targetBtn.setTextColor(android.graphics.Color.WHITE);
        targetBtn.setBackgroundDrawable(skin("#444444", 8, 1, COLORS.accent));
        var params = new android.widget.LinearLayout.LayoutParams(-1, -2);
        params.setMargins(0, dip(5), 0, 0);
        targetBtn.setLayoutParams(params);
        targetBtn.setOnClickListener(new android.view.View.OnClickListener({
            onClick: function() {
                if (states["Aimbot Target"] == "Cabeza") states["Aimbot Target"] = "Cuello";
                else if (states["Aimbot Target"] == "Cuello") states["Aimbot Target"] = "Pecho";
                else states["Aimbot Target"] = "Cabeza";
                targetBtn.setText("TARGET: " + states["Aimbot Target"]);
            }
        }));
        panel.addView(targetBtn);

        panel.addView(makeSubtitle("Abilities"));
        panel.addView(makeSwitch("Hitbox"));
        panel.addView(makeSwitch("Auto Eat (Low Health)"));
        panel.addView(makeSwitch("Bunny Jump"));
    }
    
    if (currentTab == "Local") {
        panel.addView(makeSubtitle("Movement x2"));
        panel.addView(makeSwitch("Speed Enabled"));
        
        var resetBtn = new android.widget.Button(ctx);
        resetBtn.setText("RESET SPEED");
        resetBtn.setBackgroundDrawable(skin("#660000", 10, 0, null));
        resetBtn.setOnClickListener(new android.view.View.OnClickListener({
            onClick: function() {
                states["Speed Enabled"] = false;
                setVelX(getPlayerEnt(), 0);
                setVelZ(getPlayerEnt(), 0);
                clientMessage("§cSpeed Reset.");
            }
        }));
        panel.addView(resetBtn);
    }

    if (currentTab == "Account") {
    panel.addView(makeSubtitle("User Profile"));
    
    var info = new android.widget.TextView(ctx);
    // Usamos los datos que guardó el Loader al iniciar sesión
    info.setText(
        "User: " + Player.getName(getPlayerEnt()) + "\n" +
        "Key: " + authData.key + "\n" +
        "Key expires at: " + authData.expires + "\n" +
        "Key status: " + authData.status + "\n" +
        "Vendedor: " + authData.vendor
    );
    info.setTextColor(android.graphics.Color.WHITE);
    info.setTextSize(14);
    panel.addView(info);
}

    if (currentTab == "API") {
        panel.addView(makeSubtitle("MCStatus API v3 (fixing)"));
        var apiMsg = new android.widget.EditText(ctx);
        apiMsg.setHint("/ping (ip) (port)");
        panel.addView(apiMsg);
    }
}

/* --- GUI BASE --- */
function makeSubtitle(text) {
    var t = new android.widget.TextView(ctx);
    t.setText(text.toUpperCase());
    t.setTextColor(android.graphics.Color.parseColor(COLORS.accent));
    t.setPadding(0, dip(10), 0, dip(5));
    return t;
}

function makeSwitch(name) {
    var row = new android.widget.LinearLayout(ctx);
    var txt = new android.widget.TextView(ctx);
    txt.setText(name);
    txt.setTextColor(android.graphics.Color.WHITE);
    var sw = new android.widget.Switch(ctx);
    sw.setChecked(states[name] || false);
    sw.setOnCheckedChangeListener(new android.widget.CompoundButton.OnCheckedChangeListener({
        onCheckedChanged: function(v, s) { states[name] = s; }
    }));
    row.addView(txt, new android.widget.LinearLayout.LayoutParams(0, -2, 1));
    row.addView(sw);
    return row;
}

function openMenu() {
    ui(function() {
        if (GUI != null) { GUI.dismiss(); GUI = null; return; }
        var main = new android.widget.LinearLayout(ctx);
        main.setOrientation(1);
        main.setBackgroundDrawable(skin(COLORS.bg, 15, 2, COLORS.border));

        var header = new android.widget.LinearLayout(ctx);
        var title = new android.widget.TextView(ctx);
        title.setText("  Flourite Android");
        title.setTextColor(android.graphics.Color.parseColor(COLORS.accent));
        title.setTextSize(20);
        header.addView(title);
        main.addView(header);

        var body = new android.widget.LinearLayout(ctx);
        var side = new android.widget.LinearLayout(ctx);
        side.setOrientation(1);
        var tabs = ["Local Player", "Local", "Account", "API"];
        for(var i in tabs) {
            var t = new android.widget.TextView(ctx);
            t.setText(tabs[i]);
            t.setPadding(dip(10), dip(15), dip(10), dip(15));
            t.setTextColor(currentTab == tabs[i] ? android.graphics.Color.WHITE : android.graphics.Color.GRAY);
            if(currentTab == tabs[i]) t.setBackgroundColor(android.graphics.Color.parseColor("#33FF8C00"));
            (function(n){
                t.setOnClickListener(new android.view.View.OnClickListener({
                    onClick: function() { currentTab = n; GUI.dismiss(); GUI = null; openMenu(); }
                }));
            })(tabs[i]);
            side.addView(t);
        }

        var scroll = new android.widget.ScrollView(ctx);
        var content = new android.widget.LinearLayout(ctx);
        content.setOrientation(1);
        content.setPadding(dip(15), 0, dip(15), dip(15));
        loadTabContent(content);
        scroll.addView(content);

        body.addView(side, new android.widget.LinearLayout.LayoutParams(dip(120), -1));
        body.addView(scroll, new android.widget.LinearLayout.LayoutParams(-1, -1));
        main.addView(body);

        GUI = new android.widget.PopupWindow(main, dip(450), dip(300));
        GUI.setFocusable(true);
        GUI.showAtLocation(ctx.getWindow().getDecorView(), 17, 0, 0);
    });
}

// Botón "F"
ui(function() {
    var b = new android.widget.Button(ctx);
    b.setText("F");
    b.setTextColor(android.graphics.Color.WHITE);
    b.setBackgroundDrawable(skin(COLORS.accent, 30, 0, null));
    b.setOnClickListener(new android.view.View.OnClickListener({ onClick: function() { openMenu(); } }));
    var p = new android.widget.PopupWindow(b, dip(50), dip(50));
    p.showAtLocation(ctx.getWindow().getDecorView(), 17, dip(10), dip(100));
});
