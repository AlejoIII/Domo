# Manuales de usuario Domo (PDF)

## Generar PDFs

```powershell
cd erp-saas-backend
npm run manuals:generate
```

Los PDF se crean en `docs/user-manuals/pdf/` y se copian a `erp-saas-frontend/public/manuals/` para descarga en la app (`/help/manuals`).

## Capturas de pantalla (opcional)

**Antes de capturar**, deja corriendo la app (dos terminales):

```powershell
# Terminal 1
cd erp-saas-backend
npm run start:dev

# Terminal 2
cd erp-saas-frontend
npm run dev
```

Luego (instala Chromium la primera vez con `npm run manuals:prepare`):

```powershell
cd erp-saas-frontend
npm run manuals:build
```

Si no quieres abrir terminales manualmente:

```powershell
npm run manuals:build:auto
```

(arranca API + Vite, captura, genera PDFs y apaga lo que él mismo haya iniciado)

Solo capturas o solo PDFs:

```powershell
npm run manuals:screenshots
npm run manuals:generate --prefix ../erp-saas-backend
```

Si falla con `Executable doesn't exist`, ejecuta una vez:

```powershell
npm run manuals:prepare
```

Las imágenes se guardan en `docs/user-manuals/assets/`.

## Editar contenido

Modifica `manuals.content.mjs`:

- `summary`, `objectives`, `prerequisites` y `faq` por manual
- Pasos con `S(título, cuerpo, { bullets, tip, screenshot, imageCaption })`
- Rutas de captura en `MANUAL_SCREENSHOT_ROUTES`

Tras editar: `npm run manuals:generate`. Para imágenes reales de cada módulo, arranca **API + frontend** y ejecuta `npm run manuals:build` en el frontend.
