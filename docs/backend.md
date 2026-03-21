# SportFlow Backend

## Descripción del Backend

El backend de SportFlow es una API REST construida con NestJS que permite gestionar y analizar actividades deportivas. En su fase inicial, el sistema permite:

- Subir archivos FIT exportados desde dispositivos deportivos
- Parsear y normalizar la información de las actividades
- Almacenar los datos en PostgreSQL
- Consultar las actividades almacenadas

El backend está diseñado de forma modular para permitir el crecimiento del sistema en futuras fases.

## Requisitos de Instalación

Para ejecutar el backend localmente necesitas:

- **Node.js**: versión 18.x o superior (recomendado LTS)
- **npm**: incluido con Node.js (versión 9.x o superior)

### Verificar instalación

```bash
node --version
npm --version
```

## Configuración de Variables de Entorno

El backend utiliza variables de entorno para la configuración (base de datos, etc.). Los archivos `.env` están en `.gitignore` y no se suben al repositorio.

Para configurar el entorno local:

1. Copia el archivo de ejemplo:
   ```bash
   cd backend
   cp .env.example .env
   ```
2. Edita `.env` con tus valores si es necesario (los valores por defecto funcionan con Docker Compose local).

Variables disponibles (ver `.env.example`):

| Variable | Descripción |
|----------|-------------|
| `DB_HOST` | Host de PostgreSQL |
| `DB_PORT` | Puerto de PostgreSQL |
| `DB_USERNAME` | Usuario de la base de datos |
| `DB_PASSWORD` | Contraseña |
| `DB_DATABASE` | Nombre de la base de datos |
| `DB_SYNCHRONIZE` | `true` en desarrollo para crear tablas automáticamente |

## Instalación de Dependencias

Navega al directorio `backend` e instala las dependencias del proyecto:

```bash
cd backend
npm install
```

## Iniciar el Servidor en Modo Desarrollo

Para ejecutar el servidor en modo desarrollo con recarga automática ante cambios:

```bash
cd backend
npm run start:dev
```

El servidor se iniciará por defecto en `http://localhost:3000`.

## Estructura Básica del Proyecto

```
backend/
├── src/
│   ├── app.controller.ts    # Controlador principal
│   ├── app.service.ts       # Servicio de aplicación
│   ├── app.module.ts        # Módulo raíz
│   └── main.ts              # Punto de entrada
├── test/                    # Tests unitarios y e2e
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### Descripción de archivos principales

- **main.ts**: Configura y arranca la aplicación NestJS
- **app.module.ts**: Módulo raíz que orquesta los controladores y servicios
- **app.controller.ts**: Expone los endpoints de la API
- **app.service.ts**: Lógica de negocio de la aplicación

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run start` | Inicia el servidor en modo producción |
| `npm run start:dev` | Inicia el servidor en modo desarrollo con watch |
| `npm run build` | Compila el proyecto a JavaScript |
| `npm run lint` | Ejecuta el linter ESLint |
| `npm run test` | Ejecuta los tests unitarios |
| `npm run test:e2e` | Ejecuta los tests end-to-end |

## Probar el Endpoint Inicial

Una vez que el servidor está en ejecución, puedes verificar que funciona correctamente:

### Con el navegador

Abre `http://localhost:3000` en tu navegador. Deberías ver el mensaje:

```
SportFlow API running
```

### Con curl

```bash
curl http://localhost:3000
```

Respuesta esperada:

```
SportFlow API running
```

### Con PowerShell

```powershell
Invoke-WebRequest -Uri http://localhost:3000 -UseBasicParsing | Select-Object -ExpandProperty Content
```
