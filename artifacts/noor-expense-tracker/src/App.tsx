import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  BusFront,
  Check,
  ChevronDown,
  CircleDollarSign,
  GraduationCap,
  MoreHorizontal,
  Plus,
  ReceiptText,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Utensils,
  WalletCards,
  Wifi,
  X,
} from 'lucide-react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import NotFound from '@/pages/not-found';

type Category = 'Food' | 'Transport' | 'Data/Airtime' | 'School' | 'Business' | 'Other';
type Expense = { id: string; name: string; amount: number; category: Category; createdAt: string };

const queryClient = new QueryClient();
const STORAGE_KEY = 'noor-expenses-v1';
const categories: Category[] = ['Food', 'Transport', 'Data/Airtime', 'School', 'Business', 'Other'];

const categoryMeta: Record<Category, { icon: typeof Utensils; tint: string; iconColor: string }> = {
  Food: { icon: Utensils, tint: 'bg-[#fbe3d9]', iconColor: 'text-[#bb5b3f]' },
  Transport: { icon: BusFront, tint: 'bg-[#dbeee9]', iconColor: 'text-[#24726e]' },
  'Data/Airtime': { icon: Wifi, tint: 'bg-[#e8e1f5]', iconColor: 'text-[#7659a6]' },
  School: { icon: GraduationCap, tint: 'bg-[#f9edc7]', iconColor: 'text-[#9a6f18]' },
  Business: { icon: BriefcaseBusiness, tint: 'bg-[#dce8f1]', iconColor: 'text-[#3a6685]' },
  Other: { icon: MoreHorizontal, tint: 'bg-[#e9e6de]', iconColor: 'text-[#6e6d65]' },
};

function formatGhs(amount: number) {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
  }).format(amount).replace('GHS', 'GH₵');
}

function formatDate(date: string) {
  const value = new Date(date);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  if (value.toDateString() === now.toDateString()) return `Today · ${value.toLocaleTimeString('en-GH', { hour: 'numeric', minute: '2-digit' })}`;
  if (value.toDateString() === yesterday.toDateString()) return `Yesterday · ${value.toLocaleTimeString('en-GH', { hour: 'numeric', minute: '2-digit' })}`;
  return value.toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' });
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [activeFilter, setActiveFilter] = useState<'All' | Category>('All');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Expense[];
          if (Array.isArray(parsed)) setExpenses(parsed);
        }
      } catch {
        setFeedback('Your saved expenses could not be read. You can still add new ones.');
      } finally {
        setIsLoading(false);
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses, isLoading]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(''), 3500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const total = useMemo(() => expenses.reduce((sum, expense) => sum + expense.amount, 0), [expenses]);
  const todayTotal = useMemo(() => expenses
    .filter((expense) => new Date(expense.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, expense) => sum + expense.amount, 0), [expenses]);
  const visibleExpenses = useMemo(() => expenses
    .filter((expense) => activeFilter === 'All' || expense.category === activeFilter)
    .filter((expense) => expense.name.toLowerCase().includes(search.toLowerCase().trim()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [activeFilter, expenses, search]);

  function addExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    const parsedAmount = Number(amount);
    if (!cleanName || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFeedback('Add a name and an amount greater than zero.');
      return;
    }
    const expense: Expense = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: cleanName,
      amount: Math.round(parsedAmount * 100) / 100,
      category,
      createdAt: new Date().toISOString(),
    };
    setExpenses((current) => [expense, ...current]);
    setName('');
    setAmount('');
    setCategory('Food');
    setFeedback(`${cleanName} added to your day.`);
  }

  function clearExpenses() {
    if (!expenses.length) return;
    if (window.confirm('Clear every saved expense? This cannot be undone.')) {
      setExpenses([]);
      setFeedback('Your expense list is clear.');
    }
  }

  function removeExpense(id: string) {
    setExpenses((current) => current.filter((expense) => expense.id !== id));
    setFeedback('Expense removed.');
  }

  return (
    <main className="app-shell grain min-h-[100dvh]">
      <div className="mx-auto max-w-[1240px] px-4 pb-12 pt-5 sm:px-7 sm:pt-8 lg:px-10">
        <header className="animate-rise flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-lift)]">
              <WalletCards size={20} strokeWidth={2.2} />
            </div>
            <div>
              <p className="display-font text-[19px] font-bold leading-none tracking-[-.02em]">noor</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[.22em] text-[hsl(var(--muted-foreground))]">expense companion</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#e4a83a]" />
            saved on this device
          </div>
        </header>

        <section className="mt-9 grid gap-5 lg:grid-cols-[1fr_390px] lg:items-stretch">
          <div className="relative overflow-hidden rounded-[28px] bg-[hsl(var(--primary))] px-6 py-7 text-[hsl(var(--primary-foreground))] shadow-[var(--shadow-lift)] sm:px-9 sm:py-9">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[22px] border-[hsl(var(--secondary)/.23)]" />
            <div className="absolute -bottom-28 right-16 h-56 w-56 rounded-full border-[16px] border-[hsl(var(--accent)/.19)]" />
            <div className="relative">
              <div className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--primary-foreground)/.72)]">
                <Sparkles size={16} className="text-[hsl(var(--secondary))]" />
                {new Date().toLocaleDateString('en-GH', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              <h1 className="display-font mt-7 max-w-[570px] text-[clamp(2.2rem,6vw,4.65rem)] font-bold leading-[.94] tracking-[-.055em]">
                Give every cedi<br /><span className="text-[hsl(var(--secondary))]">a little direction.</span>
              </h1>
              <p className="mt-5 max-w-[440px] text-sm leading-6 text-[hsl(var(--primary-foreground)/.72)] sm:text-[15px]">
                A quick, calm place to notice the small things you spend on — from waakye to your evening tro-tro.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <div className="rounded-2xl bg-[hsl(var(--primary-foreground)/.1)] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--primary-foreground)/.6)]">all time</p>
                  <p data-testid="text-total-expenses" className="mono-font mt-1 text-xl font-bold">{formatGhs(total)}</p>
                </div>
                <div className="rounded-2xl bg-[hsl(var(--primary-foreground)/.1)] px-4 py-3">
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[hsl(var(--primary-foreground)/.6)]">today</p>
                  <p data-testid="text-today-total" className="mono-font mt-1 text-xl font-bold">{formatGhs(todayTotal)}</p>
                </div>
                <div className="rounded-2xl bg-[hsl(var(--secondary))] px-4 py-3 text-[hsl(var(--secondary-foreground))]">
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] opacity-65">logged</p>
                  <p data-testid="text-expense-count" className="mono-font mt-1 text-xl font-bold">{expenses.length}</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={addExpense} className="animate-rise delay-1 rounded-[28px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card)/.8)] p-5 shadow-[var(--shadow-soft)] backdrop-blur-sm sm:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">new note</p>
                <h2 className="display-font mt-1 text-2xl font-bold tracking-[-.035em]">What did you spend on?</h2>
              </div>
              <div className="rounded-xl bg-[hsl(var(--secondary)/.3)] p-2 text-[hsl(var(--primary))]"><Plus size={19} /></div>
            </div>
            <div className="mt-6 space-y-3.5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]">Description</span>
                <input data-testid="input-expense-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. kelewele after work" className="h-12 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background)/.58)] px-4 text-sm outline-none transition placeholder:text-[hsl(var(--muted-foreground)/.7)] focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary)/.1)]" />
              </label>
              <div className="grid grid-cols-[1fr_1.2fr] gap-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]">Amount</span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 mono-font text-sm font-bold text-[hsl(var(--muted-foreground))]">GH₵</span>
                    <input data-testid="input-expense-amount" type="number" min="0" step="0.01" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className="mono-font h-12 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background)/.58)] pl-12 pr-3 text-sm outline-none transition placeholder:text-[hsl(var(--muted-foreground)/.7)] focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary)/.1)]" />
                  </div>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-[hsl(var(--muted-foreground))]">Category</span>
                  <div className="relative">
                    <select data-testid="select-expense-category" value={category} onChange={(event) => setCategory(event.target.value as Category)} className="h-12 w-full appearance-none rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background)/.58)] px-3 pr-9 text-sm outline-none transition focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary)/.1)]">
                      {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                    <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                  </div>
                </label>
              </div>
              <button data-testid="button-add-expense" type="submit" className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[hsl(var(--secondary))] text-sm font-bold text-[hsl(var(--secondary-foreground))] shadow-[0_8px_18px_hsl(var(--secondary)/.22)] transition hover:-translate-y-0.5 hover:shadow-[0_11px_22px_hsl(var(--secondary)/.3)] active:translate-y-0">
                Add expense <ArrowUpRight size={17} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </form>
        </section>

        <section className="animate-rise delay-2 mt-9">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">your ledger</p>
              <h2 className="display-font mt-1 text-3xl font-bold tracking-[-.04em]">Recent expenses</h2>
            </div>
            <div className="flex items-center gap-2">
              <label className="relative block">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <input data-testid="input-search-expenses" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find an expense" className="h-10 w-[180px] rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--card)/.55)] pl-9 pr-3 text-xs outline-none transition focus:border-[hsl(var(--primary))] sm:w-[210px]" />
              </label>
              <button data-testid="button-clear-expenses" type="button" onClick={clearExpenses} disabled={!expenses.length} className="flex h-10 items-center gap-2 rounded-xl border border-[hsl(var(--border))] px-3 text-xs font-bold text-[hsl(var(--muted-foreground))] transition hover:border-[hsl(var(--destructive)/.4)] hover:text-[hsl(var(--destructive))] disabled:cursor-not-allowed disabled:opacity-40">
                <Trash2 size={15} /> <span className="hidden sm:inline">Clear all</span>
              </button>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
            <SlidersHorizontal size={16} className="mr-1 shrink-0 text-[hsl(var(--muted-foreground))]" />
            {(['All', ...categories] as const).map((item) => (
              <button data-testid={`button-filter-${item.toLowerCase().replace('/', '-')}`} key={item} type="button" onClick={() => setActiveFilter(item)} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition ${activeFilter === item ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-[0_5px_12px_hsl(var(--primary)/.18)]' : 'bg-[hsl(var(--muted)/.7)] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'}`}>
                {item}
              </button>
            ))}
          </div>

          {feedback && (
            <div data-testid="status-feedback" role="status" className="animate-pop mt-4 flex items-center justify-between gap-3 rounded-xl border border-[hsl(var(--secondary)/.4)] bg-[hsl(var(--secondary)/.18)] px-4 py-3 text-sm font-semibold text-[hsl(var(--foreground))]">
              <span className="flex items-center gap-2"><Check size={16} className="text-[hsl(var(--primary))]" /> {feedback}</span>
              <button data-testid="button-dismiss-feedback" type="button" onClick={() => setFeedback('')} aria-label="Dismiss message"><X size={15} /></button>
            </div>
          )}

          <div className="mt-4 overflow-hidden rounded-[22px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card)/.58)] shadow-[var(--shadow-soft)]">
            {isLoading ? <LoadingState /> : visibleExpenses.length ? (
              <div className="divide-y divide-[hsl(var(--border)/.7)]">
                {visibleExpenses.map((expense, index) => <ExpenseRow key={expense.id} expense={expense} index={index} onRemove={removeExpense} />)}
              </div>
            ) : <EmptyState hasExpenses={expenses.length > 0} clearSearch={() => { setSearch(''); setActiveFilter('All'); }} />}
          </div>
          <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-[hsl(var(--muted-foreground))]"><CircleDollarSign size={14} /> Your notes stay on this device.</p>
        </section>
      </div>
    </main>
  );
}

function ExpenseRow({ expense, index, onRemove }: { expense: Expense; index: number; onRemove: (id: string) => void }) {
  const meta = categoryMeta[expense.category];
  const Icon = meta.icon;
  return (
    <div data-testid={`row-expense-${expense.id}`} className="expense-row animate-rise flex items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6" style={{ animationDelay: `${Math.min(index * 45, 260)}ms` }}>
      <div className={`category-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${meta.tint} ${meta.iconColor}`}><Icon size={19} strokeWidth={2} /></div>
      <div className="min-w-0 flex-1">
        <p data-testid={`text-expense-name-${expense.id}`} className="truncate text-sm font-bold text-[hsl(var(--foreground))]">{expense.name}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))]"><span>{expense.category}</span><span className="h-1 w-1 rounded-full bg-[hsl(var(--border))]" /><span>{formatDate(expense.createdAt)}</span></p>
      </div>
      <p data-testid={`text-expense-amount-${expense.id}`} className="mono-font shrink-0 text-sm font-bold">{formatGhs(expense.amount)}</p>
      <button data-testid={`button-remove-expense-${expense.id}`} type="button" onClick={() => onRemove(expense.id)} aria-label={`Remove ${expense.name}`} className="ml-1 rounded-lg p-2 text-[hsl(var(--muted-foreground)/.65)] transition hover:bg-[hsl(var(--destructive)/.1)] hover:text-[hsl(var(--destructive))]"><X size={16} /></button>
    </div>
  );
}

function EmptyState({ hasExpenses, clearSearch }: { hasExpenses: boolean; clearSearch: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--secondary)/.28)] text-[hsl(var(--primary))]"><ReceiptText size={25} /></div>
      <h3 className="display-font mt-5 text-xl font-bold">{hasExpenses ? 'Nothing here yet' : 'Your first note is waiting'}</h3>
      <p className="mt-2 max-w-[290px] text-sm leading-6 text-[hsl(var(--muted-foreground))]">{hasExpenses ? 'Try another category or search term.' : 'Add a small purchase above and start seeing your spending story take shape.'}</p>
      {hasExpenses && <button data-testid="button-reset-filters" type="button" onClick={clearSearch} className="mt-5 flex items-center gap-2 text-xs font-bold text-[hsl(var(--primary))] hover:underline"><RotateCcw size={14} /> Reset filters</button>}
    </div>
  );
}

function LoadingState() {
  return (
    <div data-testid="status-loading" className="space-y-1 p-4 sm:p-6">
      {[1, 2, 3].map((item) => <div key={item} className="flex items-center gap-4 py-3"><div className="skeleton h-11 w-11 rounded-[14px]" /><div className="flex-1 space-y-2"><div className="skeleton h-3 w-2/5 rounded" /><div className="skeleton h-2.5 w-1/3 rounded" /></div><div className="skeleton h-3 w-20 rounded" /></div>)}
    </div>
  );
}

export default App;