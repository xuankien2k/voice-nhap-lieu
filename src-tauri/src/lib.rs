use enigo::{Enigo, Keyboard, Settings};
use tauri::Manager;
use tauri_plugin_global_shortcut::ShortcutState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .invoke_handler(tauri::generate_handler![simulate_keyboard_type])
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcuts(["CommandOrControl+Shift+Space"])
                .unwrap()
                .with_handler(|app, _shortcut, event| {
                    if event.state == ShortcutState::Pressed {
                        let _ = app.emit("toggle-record", ());
                    }
                })
                .build(),
        )
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
