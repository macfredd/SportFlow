# SportFlow - Project Structure

## Approach: Feature-based (modular)

The codebase is organized by **feature/domain** rather than by file type. Each feature owns its entities, services, controllers, and DTOs.

### Why feature-based?

1. **Scalability**: Easy to add new features (e.g. `users`, `reports`) without cluttering shared folders
2. **Discoverability**: Everything related to "activities" lives under `activities/`
3. **NestJS alignment**: Matches the framework's module concept
4. **Maintainability**: Changes to a feature stay localized; fewer merge conflicts
5. **Team-friendly**: Different developers can work on different features in parallel

### Structure

```
src/
├── app.module.ts           # Root module, imports feature modules
├── app.controller.ts       # App-level (e.g. health check)
├── app.service.ts
├── main.ts
│
├── activities/             # Feature: activities
│   ├── entities/
│   │   └── activity.entity.ts
│   ├── activities.module.ts
│   ├── activities.controller.ts   # (when implemented)
│   └── activities.service.ts      # (when implemented)
│
├── common/                 # Shared code across features (future)
│   ├── pipes/
│   ├── guards/
│   └── filters/
│
└── ...                     # Other features (users, etc.)
```

### When to use `common/`

- Cross-cutting concerns: validation pipes, auth guards, exception filters
- Shared utilities or helpers
- Base classes or interfaces used by multiple features

### Entity placement

Entities live inside their feature folder (`activities/entities/`). Related entities (e.g. `TrackPoint`, `Lap` tied to `Activity`) stay in the same feature.

### Parser module structure

Each file format has its own subdirectory under `modules/parser/`:

```
modules/parser/
├── dto/                    # Shared output DTOs (ParsedActivity, ParsedTrackPoint)
├── helpers/                # Global helpers for all parsers (e.g. toDate)
├── interfaces/             # Shared interfaces only
│   └── activity-parser.interface.ts
├── fit/                    # FIT format
│   ├── fit-parser.service.ts
│   ├── fit-record.interface.ts     # FIT-specific
│   └── fit-record-mapper.helper.ts
├── gpx/                    # GPX format (future)
├── tcx/                    # TCX format (future)
├── parser-registry.service.ts
└── parser.module.ts
```

- **helpers/**: Helpers used by all parsers (date conversion, etc.)
- **fit/**, **gpx/**, **tcx/**: Format-specific parsers and mappers
