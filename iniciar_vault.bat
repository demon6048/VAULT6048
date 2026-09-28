@echo off
TITLE Vault KGB Security Server
color 0B

echo ===================================================
echo     INICIANDO VAULT KGB - SERVIDOR LOCAL SEGURO
echo ===================================================
echo.
echo No cierres esta ventana negra mientras usas la app.
echo Minimizala si deseas. Para apagar, solo cierra esta ventana.
echo.
echo Iniciando servidor de React...

:: Inicia el servidor de Vite
start /b npm run dev

:: Espera 3 segundos para que el servidor cargue bien
timeout /t 3 /nobreak > NUL

:: Abre tu navegador predeterminado exactamente en esa direccion local
start http://localhost:5173/

exit