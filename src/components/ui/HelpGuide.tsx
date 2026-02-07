import { useState } from 'react'
import {
  X,
  HelpCircle,
  Table2,
  LayoutGrid,
  GanttChart,
  CalendarDays,
  Plus,
  FileDown,
  FileUp,
  Filter,
  GripVertical,
  MousePointerClick,
  ChevronRight,
  StickyNote,
  ShieldCheck,
  AlertTriangle,
  FileJson,
  FileSpreadsheet,
  Database,
  HardDrive,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n'
import type { Locale } from '@/i18n/locales/ja'

interface Section {
  id: string
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

function buildSections(t: Locale): Section[] {
  const h = t.help.sections
  return [
    {
      id: 'overview',
      title: h.overview.title,
      icon: <HelpCircle size={16} />,
      content: (
        <div className="space-y-3 text-sm text-foreground/80">
          <p>
            {h.overview.description}
            {h.overview.viewTypes}
          </p>
          <div className="rounded-lg bg-primary/5 p-3 text-xs">
            <p className="font-medium text-primary mb-1">{h.overview.hint}</p>
            <p>{h.overview.hintText}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'task',
      title: h.task.title,
      icon: <Plus size={16} />,
      content: (
        <div className="space-y-3 text-sm text-foreground/80">
          <p>{h.task.addTask}</p>
          <ul className="space-y-2 pl-1">
            {h.task.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                {i < 2 ? (
                  <MousePointerClick size={14} className="mt-0.5 flex-shrink-0 text-primary" />
                ) : (
                  <StickyNote size={14} className="mt-0.5 flex-shrink-0 text-primary" />
                )}
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      id: 'views',
      title: h.views.title,
      icon: <Table2 size={16} />,
      content: (
        <div className="space-y-3 text-sm text-foreground/80">
          <p>{h.views.switchTabs}</p>
          <div className="space-y-2">
            {([
              { icon: <Table2 size={16} className="mt-0.5 flex-shrink-0 text-blue-500" />, ...h.views.table },
              { icon: <LayoutGrid size={16} className="mt-0.5 flex-shrink-0 text-green-500" />, ...h.views.kanban },
              { icon: <GanttChart size={16} className="mt-0.5 flex-shrink-0 text-orange-500" />, ...h.views.gantt },
              { icon: <CalendarDays size={16} className="mt-0.5 flex-shrink-0 text-purple-500" />, ...h.views.calendar },
            ]).map((v) => (
              <div key={v.name} className="flex items-start gap-2.5 rounded-md bg-accent/30 p-2">
                {v.icon}
                <div>
                  <div className="font-medium text-foreground">{v.name}</div>
                  <div className="text-xs text-muted-foreground">{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'filter',
      title: h.filterSort.title,
      icon: <Filter size={16} />,
      content: (
        <div className="space-y-3 text-sm text-foreground/80">
          <p>{h.filterSort.description}</p>
          <ul className="space-y-2 pl-1">
            <li className="flex items-start gap-2">
              <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-primary" />
              <span><span className="font-medium">{h.filterSort.addFilter}</span>{h.filterSort.addFilterDesc}</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-primary" />
              <span><span className="font-medium">{h.filterSort.sort}</span>{h.filterSort.sortDesc}</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'sidebar',
      title: h.sidebarHelp.title,
      icon: <GripVertical size={16} />,
      content: (
        <div className="space-y-3 text-sm text-foreground/80">
          <p>{h.sidebarHelp.description}</p>
          <ul className="space-y-2 pl-1">
            <li className="flex items-start gap-2">
              <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-primary" />
              <span><span className="font-medium">{h.sidebarHelp.viewManagement}</span>{h.sidebarHelp.viewManagementDesc}</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-primary" />
              <span><span className="font-medium">{h.sidebarHelp.fieldManagement}</span>{h.sidebarHelp.fieldManagementDesc}</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-primary" />
              <span><span className="font-medium">{h.sidebarHelp.themeToggle}</span>{h.sidebarHelp.themeToggleDesc}</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 'data',
      title: h.dataSection.title,
      icon: <FileDown size={16} />,
      content: (
        <div className="space-y-4 text-sm text-foreground/80">
          <p>{h.dataSection.intro}</p>

          <div className="rounded-lg border border-border p-3 space-y-2">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <HardDrive size={14} className="text-primary" />
              <span>{h.dataSection.storageTitle}</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {h.dataSection.storageDesc1}
              <span className="font-medium text-green-600 dark:text-green-400">{h.dataSection.storageHighlight}</span>
              {h.dataSection.storageDesc2}
              {h.dataSection.storageDesc3}
              {h.dataSection.storageWarning}
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="font-medium text-foreground text-xs">{h.dataSection.operationsTitle}</div>

            <div className="flex items-start gap-2.5 rounded-md bg-accent/30 p-2.5">
              <FileUp size={15} className="mt-0.5 flex-shrink-0 text-blue-500" />
              <div>
                <div className="font-medium text-foreground text-xs">{h.dataSection.openFileTitle}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{h.dataSection.openFileDesc}</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-md bg-accent/30 p-2.5">
              <FileJson size={15} className="mt-0.5 flex-shrink-0 text-green-500" />
              <div>
                <div className="font-medium text-foreground text-xs">{h.dataSection.saveJsonTitle}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {h.dataSection.saveJsonDesc}
                  <span className="font-medium text-foreground">{h.dataSection.saveJsonRecommend}</span>
                  {h.dataSection.saveJsonNote}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-md bg-accent/30 p-2.5">
              <FileSpreadsheet size={15} className="mt-0.5 flex-shrink-0 text-emerald-500" />
              <div>
                <div className="font-medium text-foreground text-xs">{h.dataSection.saveExcelTitle}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{h.dataSection.saveExcelDesc}</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-md bg-accent/30 p-2.5">
              <Database size={15} className="mt-0.5 flex-shrink-0 text-violet-500" />
              <div>
                <div className="font-medium text-foreground text-xs">{h.dataSection.demoTitle}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{h.dataSection.demoDesc}</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-primary/5 p-3 text-xs space-y-1">
            <p className="font-medium text-primary">{h.dataSection.statusHint}</p>
            <p>{h.dataSection.statusHintDesc}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'safety',
      title: h.safety.title,
      icon: <ShieldCheck size={16} />,
      content: (
        <div className="space-y-4 text-sm text-foreground/80">
          <p>{h.safety.intro}</p>
          <div className="space-y-2.5">
            {h.safety.items.map((item) => (
              <div key={item.title} className="flex items-start gap-2.5 rounded-md bg-green-500/10 p-2.5">
                <ShieldCheck size={15} className="mt-0.5 flex-shrink-0 text-green-600" />
                <div>
                  <div className="font-medium text-foreground text-xs">{item.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'caution',
      title: h.caution.title,
      icon: <AlertTriangle size={16} />,
      content: (
        <div className="space-y-4 text-sm text-foreground/80">
          <div className="space-y-2.5">
            {h.caution.items.map((item, i) => {
              const isFirst = i === 0
              const isWarning = i === 1 || i === 2
              const isInfo = i === 3
              return (
                <div
                  key={item.title}
                  className={cn(
                    'flex items-start gap-2.5 rounded-md p-2.5',
                    isFirst && 'bg-green-500/10',
                    isWarning && 'bg-amber-500/10',
                    isInfo && 'bg-accent/30'
                  )}
                >
                  {isFirst && <ShieldCheck size={15} className="mt-0.5 flex-shrink-0 text-green-600" />}
                  {isWarning && <AlertTriangle size={15} className="mt-0.5 flex-shrink-0 text-amber-600" />}
                  {isInfo && <Info size={15} className="mt-0.5 flex-shrink-0 text-blue-500" />}
                  <div>
                    <div className="font-medium text-foreground text-xs">{item.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ),
    },
  ]
}

export function HelpGuide({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [activeSection, setActiveSection] = useState('overview')
  const { t } = useI18n()

  if (!open) return null

  const sections = buildSections(t)
  const current = sections.find((s) => s.id === activeSection) ?? sections[0]

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/30" onClick={onClose} />
      <div className="fixed inset-4 z-[61] flex items-center justify-center sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-2xl">
        <div className="flex h-[560px] w-full flex-col overflow-hidden rounded-xl border border-border bg-background shadow-2xl sm:flex-row">
          <div className="flex flex-shrink-0 flex-col border-b border-border bg-muted/30 sm:w-52 sm:border-b-0 sm:border-r">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <HelpCircle size={18} className="text-primary" />
              <h2 className="text-sm font-semibold">{t.help.title}</h2>
            </div>
            <nav className="flex flex-row overflow-x-auto p-1 sm:flex-col sm:overflow-x-visible sm:p-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'flex items-start gap-2 rounded-md px-3 py-2 text-xs text-left transition-colors sm:text-sm',
                    activeSection === section.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {section.icon}
                  <span>{section.title}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                {current.icon}
                {current.title}
              </h3>
              <button
                onClick={onClose}
                className="rounded p-1 text-muted-foreground hover:bg-accent"
                title={t.common.close}
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {current.content}
            </div>
            <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground text-center">
              {t.help.reopenHint('❓')}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
