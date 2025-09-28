# 🔍 Guía de Debug OAuth - Supabase Google

## Estado del Diagnóstico

✅ **Variables de entorno**: Correctamente configuradas
✅ **Código del callback**: Mejorado con logging detallado  
✅ **Problema PKCE identificado**: `invalid request: both auth code and code verifier should be non-empty`
✅ **Solución implementada**: OAuth client-side con PKCE automático
🔄 **Pendiente**: Verificación de funcionamiento

## Variables de Entorno Verificadas

```
NEXT_PUBLIC_SUPABASE_URL=https://jkirhngfztxbvcdzbczl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

## Pasos para Solucionar el Problema OAuth

### 1. Verificar Configuración en Supabase Dashboard

Ve a: https://supabase.com/dashboard/project/jkirhngfztxbvcdzbczl

#### Authentication > Providers > Google

- ✅ **Habilitar Google Provider**
- ✅ **Client ID**: Debe estar configurado
- ✅ **Client Secret**: Debe estar configurado

#### Authentication > URL Configuration

- ✅ **Site URL**: `http://localhost:3000`
- ✅ **Redirect URLs**: Debe incluir:
  - `http://localhost:3000/auth/callback`
  - `https://tudominio.com/auth/callback` (para producción)

### 2. Configuración de Google Cloud Console

Ve a: https://console.cloud.google.com/

#### APIs & Services > Credentials > OAuth 2.0 Client IDs

- ✅ **Authorized JavaScript origins**:
  - `http://localhost:3000`
  - `https://jkirhngfztxbvcdzbczl.supabase.co`
- ✅ **Authorized redirect URIs**:
  - `https://jkirhngfztxbvcdzbczl.supabase.co/auth/v1/callback`

### 3. Verificar los Logs Mejorados

Con las mejoras implementadas, deberías ver logs como estos:

#### Al hacer click en "Continuar con Google":

```
🚀 Iniciando autenticación con Google...
🔗 URL de redirección configurada: http://localhost:3000/auth/callback
🔑 Resultado de signInWithOAuth: { hasData: true, hasUrl: true, url: "https://..." }
✅ Redirigiendo a: https://accounts.google.com/oauth/authorize?...
```

#### En el callback `/auth/callback`:

```
🔄 OAuth Callback recibido: { code: "074f68bd...", error: null, url: "..." }
🔑 Intentando intercambiar código por sesión...
🔑 Resultado del intercambio: { hasSession: true, hasUser: true, userId: "...", userEmail: "..." }
✅ Usuario autenticado exitosamente, redirigiendo a academia
```

### 4. Errores Comunes y Soluciones

#### Error: `redirect_uri_mismatch`

- **Causa**: La URL de redirección no está autorizada
- **Solución**: Agregar `https://jkirhngfztxbvcdzbczl.supabase.co/auth/v1/callback` a Google Cloud Console

#### Error: `access_denied`

- **Causa**: Usuario canceló la autorización o no tiene permisos
- **Solución**: Verificar que el usuario complete el flujo OAuth

#### Error: `invalid_client`

- **Causa**: Client ID o Secret incorrectos
- **Solución**: Verificar credenciales en Supabase Dashboard

#### Error: `exchange failed`

- **Causa**: Problema al intercambiar código por token
- **Solución**: Verificar configuración de URLs en ambos lados

### 5. Comando de Verificación

Ejecuta este script para verificar la configuración:

```bash
node debug-oauth.js
```

### 6. Checklist Final

- [ ] Google Provider habilitado en Supabase
- [ ] Client ID/Secret configurados en Supabase
- [ ] URLs de redirección configuradas en Supabase
- [ ] URLs autorizadas configuradas en Google Cloud Console
- [ ] Variables de entorno cargadas correctamente
- [ ] Logs aparecen en la consola del servidor

## Solución Implementada: OAuth Client-Side

### Problema PKCE Identificado

Error: `invalid request: both auth code and code verifier should be non-empty`

### Causa

- Supabase server actions no manejan PKCE automáticamente
- OAuth requiere PKCE para seguridad, especialmente en aplicaciones SPA

### Solución Completa

- ✅ **OAuth client-side**: `AuthOAuthButton` usa `createSupabaseClient()` del navegador para iniciar
- ✅ **Middleware PKCE**: Intercambio de código manejado en middleware con acceso a cookies PKCE
- ✅ **Callback simplificado**: Route handler simplificado que solo maneja errores
- ✅ **Logging completo**: Logs detallados en cliente, middleware y callback

### Próximo Paso

👉 **Probar la autenticación OAuth nuevamente**

1. Abre la consola del navegador (F12)
2. Ve a `http://localhost:3000/sign-in`
3. Haz click en "Continuar con Google"
4. Revisa los logs en la consola del navegador
5. Completa el flujo OAuth de Google

Los logs esperados ahora serán:

```
🚀 Iniciando OAuth con google desde cliente
🔗 URL de redirección: http://localhost:3000/auth/callback
🔑 Resultado OAuth google: { hasData: true, hasUrl: true }
```

Y luego en el servidor:

**Middleware:**

```
🔄 Middleware: Interceptando callback OAuth con código
🔑 Middleware: Resultado intercambio PKCE: { hasSession: true, hasUser: true, userId: "..." }
✅ Middleware: Sesión establecida, redirigiendo a academia
```

**Callback Route:**

```
🔄 Callback Route: OAuth callback route llamado
🔄 Callback Route: Middleware ya procesó, redirigiendo a academia
```
