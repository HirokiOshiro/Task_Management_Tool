# Task Management Tool Architecture

## Overview
This tool is a fully client-side SPA built with Vite + React. All data stays in the browser (Zustand + localStorage) or in user-selected local files (JSON/XLSX). There is no server-side API or external data transmission.

Key entry points and modules:
- Entry and initialization: src/main.tsx, src/App.tsx
- Main layout: src/components/layout/AppShell.tsx
- View switcher: src/components/views/ViewContainer.tsx
- State stores: src/stores/*
- Data adapters: src/adapters/*
- Data import/export UI: src/components/data-source/DataSourceSelector.tsx
- Validation/sanitization: src/lib/sanitize.ts

## Diagram 1: Component/State/Data Overview
```mermaid
flowchart TB
  subgraph UI["UI Layer"]
    App["App.tsx"]
    Shell["AppShell"]
    Views["ViewContainer"]
    Table["TableView"]
    Kanban["KanbanView"]
    Gantt["GanttView"]
    Calendar["CalendarView"]
    DataSource["DataSourceSelector"]
    StatusBar["StatusBar"]
  end

  subgraph State["Client State (Zustand)"]
    TaskStore["Task Store<br/>(tasks/fields/viewConfigs/isDirty)"]
    ViewStore["View Store<br/>(active view/sort/filter/group)"]
    UIStore["UI Store<br/>(theme/sidebar/selection)"]
    ConnStore["Connection Store<br/>(adapter/status/lastSaved)"]
    I18n["I18n Store<br/>(lang/translations)"]
  end

  subgraph Adapters["Data Adapters"]
    Memory["MemoryAdapter<br/>(demo dataset)"]
    Local["LocalFileAdapter<br/>(JSON/XLSX via File System Access)"]
  end

  subgraph Files["User Files"]
    JSON["JSON file"]
    XLSX["Excel file"]
  end

  %% Relationships
  App --> Shell --> Views
  Views --> Table
  Views --> Kanban
  Views --> Gantt
  Views --> Calendar
  Shell --> DataSource
  Shell --> StatusBar

  App --> TaskStore
  App --> UIStore
  DataSource --> TaskStore
  DataSource --> ConnStore
  StatusBar --> ConnStore
  StatusBar --> TaskStore
  Views --> ViewStore
  Table --> TaskStore
  Kanban --> TaskStore
  Gantt --> TaskStore
  Calendar --> TaskStore
  App --> I18n

  DataSource --> Memory
  DataSource --> Local
  Memory --> TaskStore
  Local --> TaskStore
  Local <--> Files
```

## Diagram 2: App Initialization (Persisted Data vs Demo)
```mermaid
sequenceDiagram
  participant U as User
  participant App as App.tsx
  participant Task as "Task Store"
  participant Persist as "localStorage(task-storage)"
  participant Mem as MemoryAdapter

  U->>App: Open page
  App->>Persist: hasPersistedData?
  alt persisted data exists
    Persist-->>Task: "rehydrate state (zustand persist)"
    Task-->>App: isLoaded=true
  else no persisted data
    App->>Mem: load()
    Mem-->>Task: "demo TaskDataSet"
    Task-->>App: isLoaded=true
  end
```

## Diagram 3: File Load/Save Flow
```mermaid
sequenceDiagram
  participant U as User
  participant UI as DataSourceSelector
  participant Local as LocalFileAdapter
  participant Task as Task Store
  participant Conn as Connection Store
  participant FS as File System Access

  U->>UI: Open file (JSON/XLSX)
  UI->>Local: connect()
  Local->>FS: file picker
  FS-->>Local: file handle + buffer
  Local-->>UI: connection
  UI->>Local: load()
  Local-->>Task: TaskDataSet
  UI->>Conn: setConnection/setAdapter

  U->>UI: Save / Export
  UI->>Task: getDataSet()
  UI->>Local: save(data)
  Local->>FS: fileSave
  Local-->>UI: ok
  UI->>Task: markClean()
  UI->>Conn: setLastSaved()
```

## GitHub Pages: Multi-user Access Considerations
- No shared data: Each user works in their own browser and local files. Data does not mix between users.
- No real-time collaboration: There is no server, so collaborative editing is not supported.
- Shared device risk: On shared PCs, data can remain in localStorage. Users should export files and clear browser data after use.
- Data loss risk: Clearing browser data or using private mode can erase local data. Recommend regular JSON/XLSX exports.
- Import size limit: Imports are capped at 50MB to prevent oversized file loads.

## Security/Privacy Notes
- No network communication APIs (fetch/axios/WebSocket) are used.
- No account login is required; no personal data is collected.
- File access is only via explicit user selection (File System Access API).
- Basic sanitization is implemented for URLs and color values.
