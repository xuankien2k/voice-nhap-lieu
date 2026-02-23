use enigo::{Enigo, Keyboard, Settings};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![simulate_keyboard_type, open_accessibility_settings])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Open macOS System Settings to Accessibility pane so user can add app.
#[tauri::command]
fn open_accessibility_settings() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = ();
        // Windows: Settings > Privacy > Accessibility - no direct URL
    }
    Ok(())
}

/// Simulate typing text at the current cursor position using keyboard.
/// Requires Accessibility permission on macOS.
#[tauri::command]
fn simulate_keyboard_type(text: &str) -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    enigo.text(text).map_err(|e| e.to_string())?;
    Ok(())
}
