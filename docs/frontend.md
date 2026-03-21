# SportFlow Frontend

## Descripción del Frontend Futuro

El frontend de SportFlow será una aplicación web que permitirá a los usuarios interactuar con el sistema de análisis de actividades deportivas. Los usuarios podrán:

- Visualizar sus actividades subidas
- Explorar estadísticas y métricas de entrenamiento
- Consultar mapas y trazados de las rutas
- Gestionar su perfil y preferencias

## Tecnologías Previstas

- **Angular**: Framework principal para la construcción de la aplicación SPA (Single Page Application)
- TypeScript para desarrollo tipado
- Componentes y servicios siguiendo las mejores prácticas de Angular

## Estructura Planeada del Proyecto

La aplicación frontend se ubicará en la carpeta `frontend/` del proyecto SportFlow con una estructura similar a:

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/           # Servicios singletons, guards, interceptors
│   │   ├── shared/         # Componentes, pipes, directivas reutilizables
│   │   ├── features/       # Módulos por funcionalidad
│   │   └── app.component.ts
│   ├── assets/
│   └── environments/
├── angular.json
└── package.json
```

## Nota Importante

**El frontend se implementará en una fase posterior del proyecto.**

En la Fase 1, el desarrollo se centra exclusivamente en el backend y el pipeline de ingestión de actividades (upload, parseo, persistencia). Una vez completada la base del backend, se procederá con el desarrollo del frontend Angular.
