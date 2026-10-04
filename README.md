# Cancionero

Cancionero digital con panel de administración integrado, basado en [cancionero original](https://github.com/gomezalb/cancionero).

---

## Estructura de ramas

```
main   ← producción (lo que ven los usuarios, admin publica canciones aquí)
dev    ← desarrollo (cambios de código, nunca toca canciones.json del admin)
```

---

## Setup inicial (una sola vez)

```bash
# Clonar el repo
git clone https://github.com/gomezalb/cancionero.git
cd cancionero

# Crear y publicar la rama dev
git checkout -b dev
git push origin dev
```

---

## Flujo de trabajo como desarrollador

### 1. Antes de empezar a trabajar — sincronizar dev con main

```bash
git checkout main
git pull origin main          # traer últimos cambios (incluye canciones del admin)

git checkout dev
git merge main                # incorporar esos cambios a dev
```

### 2. Desarrollar normalmente

```bash
# Hacer cambios en el código...

git add .
git commit -m "Descripción del cambio"
git push origin dev           # push a dev, nunca toca main ni canciones.json
```

### 3. Llevar mejoras a producción (main)

```bash
git checkout main
git pull origin main          # IMPORTANTE: traer lo último del admin antes de mergear

git merge dev                 # incorporar cambios de código

# Restaurar canciones.json del admin por si el merge lo pisó
git checkout main -- canciones.json

git push origin main          # publicar a producción
```

### 4. Volver a dev para seguir desarrollando

```bash
git checkout dev
git merge main                # mantener dev sincronizado
```

---

## Archivos importantes

| Archivo | Descripción | ¿Se sube al repo? |
|---|---|---|
| `index.html` | Toda la aplicación | ✅ Sí |
| `config.js` | Owner, repo, branch (sin secretos) | ✅ Sí |
| `config.local.js` | Token GitHub real | ❌ No (.gitignore) |
| `canciones.json` | Base de datos de canciones | ✅ Sí (el admin lo gestiona) |
| `setlist.json` | Lista fijada actual | ✅ Sí (el admin lo gestiona) |
| `sw.js` | Service Worker (offline/PWA) | ✅ Sí |
| `manifest.json` | Configuración PWA | ✅ Sí |

---

## Configuración del token (cuando lo regenerás)

1. Ir a [github.com/settings/tokens](https://github.com/settings/tokens) → Fine-grained tokens
2. Regenerar el token `cancionero-admin`
3. Abrir `config.local.js` y reemplazar el valor de `GH_TOKEN_LOCAL`
4. La próxima vez que abrás el cancionero en local, el token se inyecta automáticamente en `localStorage`
5. Para el dispositivo del admin: ella lo ingresa una vez desde el modal al entrar a **Editar**

---

## Probar en local

```bash
# Cualquier servidor estático sirve, por ejemplo:
python3 -m http.server 8000

# Abrir en el navegador
http://localhost:8000
```

> **Nota:** `canciones.json` en local puede estar desactualizado respecto a lo que publicó el admin.
> Siempre hacer `git pull origin main` antes de arrancar para tener la versión más reciente.

---

## Versionado del Service Worker

Cada vez que subís cambios a `main`, incrementar la versión del caché en `sw.js` para forzar actualización en los dispositivos:

```js
// sw.js
const CACHE_VERSION = "cancionero-v4"; // ← incrementar este número
```

---

## Panel de administración

El panel está integrado en la pestaña **Editar** del cancionero.

| Función | Cómo acceder |
|---|---|
| Agregar / editar canciones | Pestaña Editar → ingresar token la primera vez |
| Publicar cambios | Pestaña Editar → botón ☁ Publicar cambios |
| Fijar lista para todos | Pestaña Editar → sección Fijar lista |
| Olvidar token guardado | Modal de token → botón "Olvidar token guardado" |

---

## Publicar desde local vs producción

`config.local.js` sobreescribe `GH_BRANCH = "dev"`, así al hacer click en **Publicar** desde localhost, el `canciones.json` sube a la rama `dev` y nunca pisa el del admin en `main`.

| Entorno | Branch de publicación | Archivo de config |
|---|---|---|
| Local (vos) | `dev` | `config.js` + `config.local.js` |
| Producción (admin) | `main` | solo `config.js` |
