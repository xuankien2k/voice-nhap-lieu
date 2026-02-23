use enigo::{Enigo, Keyboard, Settings};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![simulate_keyboard_type])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Simulate typing text at the current cursor position using keyboard.
/// Requires Accessibility permission on macOS.
#[tauri::command]
fn simulate_keyboard_type(text: &str) -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default()).map_err(|e| e.to_string())?;
    enigo.text(text).map_err(|e| e.to_string())?;
    Ok(())
}
