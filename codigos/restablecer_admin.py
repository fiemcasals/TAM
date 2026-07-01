import tkinter as tk
from tkinter import messagebox
import subprocess
import os
import sys

def reset_password():
    new_pw = entry_new.get()
    confirm_pw = entry_confirm.get()
    
    if not new_pw:
        messagebox.showerror("Error", "La contraseña no puede estar vacía.")
        return
        
    if new_pw != confirm_pw:
        messagebox.showerror("Error", "Las contraseñas no coinciden.")
        return
        
    if len(new_pw) < 6:
        messagebox.showerror("Error", "La contraseña debe tener al menos 6 caracteres.")
        return

    # Directorios de ejecución
    base_dir = os.path.dirname(os.path.abspath(__file__))
    node_exe = os.path.join(base_dir, "portable", "node", "node.exe")
    script_js = os.path.join(base_dir, "proyectotam", "scripts", "reset_admin_pw.js")
    
    # Si no existe el node portable, intentar usar el node del sistema
    if not os.path.exists(node_exe):
        node_exe = "node"
        
    if not os.path.exists(script_js):
        messagebox.showerror("Error", f"No se encontró el script de base de datos:\n{script_js}")
        return
        
    try:
        # Ejecutar el script JS usando el motor node portable en segundo plano
        result = subprocess.run(
            [node_exe, script_js, new_pw],
            capture_output=True,
            text=True,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0
        )
        
        if result.returncode == 0:
            messagebox.showinfo("Éxito", result.stdout.strip())
            root.destroy()
        else:
            messagebox.showerror("Error de Ejecución", result.stderr.strip() or result.stdout.strip() or "Error desconocido.")
    except Exception as e:
        messagebox.showerror("Error del Sistema", f"No se pudo ejecutar el proceso de restablecimiento:\n{str(e)}")

# Crear la ventana principal de la interfaz
root = tk.Tk()
root.title("TAM 2C - Restablecer Contraseña Admin")
root.geometry("380x230")
root.resizable(False, False)

# Centrar la ventana en la pantalla del usuario
window_width = 380
window_height = 230
screen_width = root.winfo_screenwidth()
screen_height = root.winfo_screenheight()
x = (screen_width - window_width) // 2
y = (screen_height - window_height) // 2
root.geometry(f"{window_width}x{window_height}+{x}+{y}")

# Configurar el diseño
label_title = tk.Label(root, text="Restablecer Contraseña del Jefe de Proyecto", font=("Arial", 11, "bold"))
label_title.pack(pady=10)

frame = tk.Frame(root)
frame.pack(padx=20, pady=5, fill="both", expand=True)

label_new = tk.Label(frame, text="Nueva Contraseña:")
label_new.grid(row=0, column=0, sticky="w", pady=5)
entry_new = tk.Entry(frame, show="*", width=25)
entry_new.grid(row=0, column=1, pady=5)

label_confirm = tk.Label(frame, text="Confirmar Contraseña:")
label_confirm.grid(row=1, column=0, sticky="w", pady=5)
entry_confirm = tk.Entry(frame, show="*", width=25)
entry_confirm.grid(row=1, column=1, pady=5)

def toggle_visibility():
    if var_show.get():
        entry_new.config(show="")
        entry_confirm.config(show="")
    else:
        entry_new.config(show="*")
        entry_confirm.config(show="*")

var_show = tk.BooleanVar()
check_show = tk.Checkbutton(frame, text="Mostrar contraseñas", variable=var_show, command=toggle_visibility)
check_show.grid(row=2, column=1, sticky="w", pady=5)

btn_reset = tk.Button(root, text="Restablecer Contraseña", command=reset_password, bg="#1d4ed8", fg="white", font=("Arial", 10, "bold"), padx=10, pady=5)
btn_reset.pack(pady=15)

root.mainloop()
