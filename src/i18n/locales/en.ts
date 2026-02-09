import type { Locale } from './ja'

export const en: Locale = {
  // ── Common ──
  common: {
    loading: 'Loading...',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    add: 'Add',
    close: 'Close',
    untitled: 'Untitled',
    yes: 'Yes',
    no: 'No',
    items: '',
    today: 'Today',
    newTask: 'New Task',
    markDone: 'Mark as Done',
    markInProgress: 'Mark as In Progress',
    done: 'Done',
  },

  // ── Field Types ──
  fieldTypes: {
    text: 'Text',
    number: 'Number',
    select: 'Select',
    multi_select: 'Multi Select',
    date: 'Date',
    person: 'Person',
    checkbox: 'Checkbox',
    url: 'URL',
    progress: 'Progress',
  },

  // ── Field Names ──
  fieldNames: {
    title: 'Title',
    status: 'Status',
    assignee: 'Assignee',
    dueDate: 'Due Date',
    priority: 'Priority',
    description: 'Description',
    tags: 'Tags',
    progress: 'Progress',
    startDate: 'Start Date',
    dependencies: 'Dependencies',
    notes: 'Notes',
    category: 'Category',
  },

  // ── Status Options ──
  status: {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    done: 'Done',
    on_hold: 'On Hold',
  },

  // ── Priority Options ──
  priority: {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  },

  // ── Views ──
  views: {
    table: 'Table',
    kanban: 'Kanban',
    gantt: 'Gantt',
    calendar: 'Calendar',
    addView: 'Add View',
    viewLabel: 'Views',
    newViewSuffix: '(New)',
  },

  // ── Header ──
  header: {
    openSidebar: 'Open Sidebar',
    helpGuide: 'Help Guide',
  },

  // ── Sidebar ──
  sidebar: {
    appTitle: 'Task Manager',
    closeSidebar: 'Close Sidebar',
    addViewTitle: 'Add View',
    confirmTitle: 'Confirm',
    cancelTitle: 'Cancel',
    renameTitle: 'Rename',
    deleteViewTitle: 'Delete View',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
  },

  // ── Status Bar ──
  statusBar: {
    autoSaveOn: 'Auto-save ON',
    tasksCount: 'tasks',
    notExported: 'Not exported',
    lastExport: 'Last export:',
    memory: 'Memory',
    local: 'Local',
    memoryDemo: 'Memory (Demo)',
  },

  // ── Filter Bar ──
  filter: {
    filter: 'Filter',
    excludeDone: 'Exclude Done',
    showAll: 'All',
    hideDoneTitle: 'Hide done tasks',
    showAllTitle: 'Show all tasks',
    thisWeek: 'Week',
    thisMonth: 'Month',
    nextTwoMonths: '2 Mon.',
    clearDateFilter: 'Clear date filter',
    selectField: 'Select field...',
    valuePlaceholder: 'Value...',
    operators: {
      equals: 'equals',
      not_equals: 'not equals',
      contains: 'contains',
      not_contains: 'not contains',
      is_empty: 'is empty',
      is_not_empty: 'is not empty',
      greater_than: 'greater than',
      less_than: 'less than',
      before: 'before',
      after: 'after',
      in: 'in',
      not_in: 'not in',
    },
  },

  // ── Field Manager ──
  fieldManager: {
    title: 'Fields',
    addField: 'Add Field',
    hide: 'Hide',
    show: 'Show',
    deleteField: 'Delete Field',
    fieldNamePlaceholder: 'Field name',
  },

  // ── Task Detail Panel ──
  taskDetail: {
    title: 'Task Details',
    deleteTask: 'Delete Task',
    created: 'Created:',
    updated: 'Updated:',
    empty: 'Empty',
    memoLabel: 'Notes',
    memoPlaceholder: 'Enter notes...',
    memoClickToAdd: 'Click to add notes...',
    tagsPlaceholder: 'Enter tag and press Enter...',
  },

  // ── Table View ──
  table: {
    deleteTask: 'Delete task',
    enterToAdd: 'Type and press Enter...',
  },

  // ── Kanban View ──
  kanban: {
    uncategorized: 'Uncategorized',
  },

  // ── Gantt View ──
  gantt: {
    emptyMessage: 'Set a start date or due date on tasks to display the Gantt chart.',
    taskName: 'Task Name',
    monthFormat: 'MMM yyyy',
    scrollToToday: 'Scroll to today',
    selectedCount: ' selected — drag to move together',
    clearSelection: 'Clear',
    taskNamePlaceholder: 'Enter task name…',
  },

  // ── Calendar View ──
  calendar: {
    monthFormat: 'MMMM yyyy',
    weekDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    moreItems: 'more',
  },

  // ── Data Source ──
  data: {
    label: 'Data',
    taskDataFile: 'Task Data File',
    noFileConnected: 'No file connected',
    openFile: 'Open File',
    save: 'Save',
    saveJson: 'Save as JSON',
    saveAsJson: 'Save as JSON (New)',
    saveExcel: 'Save as Excel',
    saveAsExcel: 'Save as Excel (New)',
    demoData: 'Demo Data',
    loadedFile: (name: string) => `Loaded ${name}`,
    loadFailed: 'Failed to load file',
    savedFile: (name: string) => `Saved ${name}`,
    savedJson: 'Saved as JSON',
    saveFailed: 'Failed to save',
    savedExcel: 'Saved as Excel',
    loadedDemo: 'Demo data loaded',
    demoDataTitle: 'Demo Data',
    noFileToSave: 'No file to save',
    importTasks: 'Import Tasks',
    importTemplate: 'Download Template',
    importAppend: 'Append to existing',
    importReplace: 'Replace all',
    importSuccess: (count: number) => `Imported ${count} task(s)`,
    importFailed: 'Import failed',
    importPreview: 'Import Preview',
    importPreviewInfo: (count: number, fieldCount: number) =>
      `Found ${count} task(s) and ${fieldCount} field(s)`,
    importConfirm: 'Import',
    importCancel: 'Cancel',
    supportedFormats: 'Supported: .xlsx, .csv',
  },

  // ── Help Guide ──
  help: {
    title: 'Help Guide',
    reopenHint: (icon: string) => `You can reopen this guide anytime from the ${icon} button in the header`,
    sections: {
      overview: {
        title: 'Getting Started',
        description: 'This app is a tool for managing tasks.',
        viewTypes: 'You can view and edit tasks in 4 views: Table, Kanban, Gantt Chart, and Calendar.',
        hint: '💡 Tip',
        hintText: 'Load demo data from the sidebar at the bottom left to try out the features right away.',
      },
      task: {
        title: 'Creating and Editing Tasks',
        addTask: 'Click the "New Task" button at the top right of the header to add a new task.',
        items: [
          'Click a cell in Table view to edit directly',
          'Click a task name or Gantt bar to open the detail panel',
          'When you enter a start date, the due date is automatically set to the same day if empty',
        ],
        memoTitle: 'Notes Feature',
        memoDesc: 'The notes section at the bottom of the detail panel supports Markdown formatting.',
        memoFeatures: [
          'Use **bold**, _italic_, and `code` formatting',
          'Create bullet lists with "-", "*", or "1." — press Enter to continue automatically',
          'Tab to indent, Shift+Tab to unindent',
          'Press Escape to cancel editing',
        ],
      },
      views: {
        title: '4 Views',
        switchTabs: 'Switch views using the tabs in the header.',
        table: { name: 'Table', desc: 'List tasks like a spreadsheet. Click cells to edit directly, or click a row to open the detail panel.' },
        kanban: { name: 'Kanban', desc: 'Display cards by status. Drag & drop to change status. You can change the grouping field in view settings.' },
        gantt: { name: 'Gantt Chart', desc: 'Display task start-to-due dates as bars. Drag bars to move schedules, drag edges to adjust duration. Click empty areas to create new tasks, or drag-select multiple tasks for batch moving. Use the "Today" button to scroll to the current date.' },
        calendar: { name: 'Calendar', desc: 'Display tasks with due dates on a monthly calendar. Click a task to view details.' },
      },
      filterSort: {
        title: 'Filter and Sort',
        description: 'Filter tasks using the filter bar below the header.',
        quickFilter: 'Quick Filters:',
        quickFilterDesc: 'Toggle completed tasks with "Exclude Done" / "All", and filter by due date with "This Week", "This Month", or "2 Months"',
        addFilter: 'Add Filter:',
        addFilterDesc: 'Click "+ Filter" and select field, condition, and value',
        sort: 'Sort:',
        sortDesc: 'Click column headers in Table view to sort',
      },
      sidebarHelp: {
        title: 'Sidebar Features',
        description: 'The sidebar on the left provides the following operations.',
        viewManagement: 'View Management:',
        viewManagementDesc: 'Add, rename, and delete views, drag & drop to reorder',
        fieldManagement: 'Field Management:',
        fieldManagementDesc: 'Add custom fields, drag to reorder, toggle visibility',
        themeToggle: 'Theme Toggle:',
        themeToggleDesc: 'Switch between light and dark mode',
      },
      dataSection: {
        title: 'Saving and Loading Data',
        intro: 'File operations are available from the "Data" section in the sidebar.',
        storageTitle: 'About Data Storage',
        storageDesc1: 'This tool runs in your browser. Task data is ',
        storageHighlight: 'automatically saved to browser local storage',
        storageDesc2: ', so ',
        storageDesc3: 'your data will be restored when you revisit the page.',
        storageWarning: 'However, clearing browser data will delete it, so please export important data to a file.',
        operationsTitle: 'Operations',
        openFileTitle: 'Open File',
        openFileDesc: 'Select and load a JSON or Excel (.xlsx) file. Reopen previously saved files to resume work.',
        saveJsonTitle: 'Save as JSON',
        saveJsonDesc: 'Download all tasks, field settings, and view settings in JSON format.',
        saveJsonRecommend: 'Recommended format',
        saveJsonNote: '. All information including field configurations and notes is saved.',
        saveExcelTitle: 'Save as Excel',
        saveExcelDesc: 'Download task data as an Excel file (.xlsx). Convenient for viewing and sharing in Excel or Google Sheets.',
        groupExportTitle: 'Group Export',
        groupExportDesc: 'When saving as JSON or Excel, you can specify a group field (select/multi-select type) to export only tasks from a specific group.',
        demoTitle: 'Demo Data',
        demoDesc: 'Load sample task data. If you\'re new, load this first and try out the features.',
        statusHint: '💡 Checking Save Status',
        statusHintDesc: 'Connection status is shown in the status bar at the bottom. If ... appears next to the save button in the sidebar, there are unsaved changes.',
      },
      safety: {
        title: 'About Safety',
        intro: 'This tool is designed with privacy and security in mind.',
        items: [
          { title: 'Fully Local Operation', desc: 'All data is processed only within your browser. No data is ever sent to external servers.' },
          { title: 'No Account Required', desc: 'No user registration or login is required. No personal information input is needed.' },
          { title: 'File Access', desc: 'File reading and writing uses standard browser APIs, accessing only files you explicitly select. It will never read other files or access anything without your permission.' },
          { title: 'No Cookies or Tracking', desc: 'No cookies or tracking is used. Local storage is used only for theme settings and auto-saving task data.' },
        ],
      },
      caution: {
        title: 'Important Notes',
        items: [
          { title: 'Browser Auto-save', desc: 'Task data is automatically saved to browser local storage. Your data will be automatically restored when you revisit the page.' },
          { title: 'File Backup Recommended', desc: 'Auto-save is browser-only. Clearing browser data or cache will delete your data. Please regularly export important data using "Save as JSON" or "Save as Excel".' },
          { title: 'Demo Data Overwrites', desc: 'Clicking "Demo Data" will replace your current data with sample data. Please save your data first if it\'s important.' },
          { title: 'Supported Browsers', desc: 'Latest versions of Chrome, Edge, Safari, and Firefox are recommended. Some features may not work properly on older browsers.' },
        ],
      },
    },
  },
} as const
