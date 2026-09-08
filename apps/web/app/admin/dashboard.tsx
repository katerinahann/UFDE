'use client';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Users,
  Building2,
  Mail,
  Settings,
  Globe,
  Image as ImageIcon,
  LogOut,
  ChevronRight,
  Plus,
  ArrowLeft,
  Upload,
  ShieldCheck,
  Search,
  Menu,
  X,
  Save,
  Trash2,
} from 'lucide-react';

type Field = {
  name: string;
  label: string;
  type: string;
  required?: boolean;
  options?: string[];
  target?: string;
  max?: number;
  accept?: 'image' | 'pdf';
};
type Definition = {
  label: string;
  fields: Field[];
  translations?: Field[];
  readonly?: boolean;
  singleton?: boolean;
  noCreate?: boolean;
  noDelete?: boolean;
  private?: boolean;
};
type Catalog = Record<string, Definition>;
type Row = {
  id: string;
  updatedAt: string;
  createdAt: string;
  translations?: Record<string, unknown>[];
  [key: string]: unknown;
};
type User = { name: string; email: string; permissions: string[] };
type Api = (path: string, init?: RequestInit) => Promise<any>;
const locales = ['EN', 'FR', 'UK'];
const icons: Record<string, typeof FileText> = {
  dashboard: LayoutDashboard,
  activities: FileText,
  projects: FolderOpen,
  publications: FileText,
  team: Users,
  partners: Building2,
  documents: ShieldCheck,
  'strategic-areas': Globe,
  contacts: Mail,
  subscribers: Users,
  settings: Settings,
  seo: Search,
  media: ImageIcon,
};
function nameOf(row: Row) {
  const t =
    row.translations?.find((t) => t.locale === 'EN') || row.translations?.[0];
  return String(
    row.name ||
      row.siteName ||
      row.filename ||
      t?.title ||
      t?.name ||
      row.title ||
      row.subject ||
      row.email ||
      row.slug ||
      row.id,
  );
}
function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'The request could not be completed';
}
function allowed(user: User, key: string, action: string) {
  return (
    user.permissions.includes('*') ||
    user.permissions.includes(key + ':' + action)
  );
}
export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null),
    [checking, setChecking] = useState(true),
    [catalog, setCatalog] = useState<Catalog>({}),
    [counts, setCounts] = useState<Record<string, number>>({}),
    [module, setModule] = useState('dashboard'),
    [rows, setRows] = useState<Row[]>([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState<Row | 'new' | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [navOpen, setNavOpen] = useState(false),
    [filter, setFilter] = useState('');
  const csrf = useRef('');
  const generation = useRef(0);
  const api = useCallback<Api>(async (path, init = {}) => {
    const headers = new Headers(init.headers);
    if (init.body && !(init.body instanceof FormData))
      headers.set('Content-Type', 'application/json');
    if (init.method && init.method !== 'GET')
      headers.set('X-CSRF-Token', csrf.current);
    const response = await fetch('/api/admin/' + path, {
      ...init,
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
    });
    const result = await response.json().catch(() => ({
      message: 'The administration service returned an unexpected response',
    }));
    if (!response.ok) {
      if (response.status === 401) {
        csrf.current = '';
        setUser(null);
        setRows([]);
        setSelected(null);
        setCatalog({});
        setCounts({});
      }
      throw new Error(
        Array.isArray(result.message)
          ? result.message.join('. ')
          : result.message || 'Request failed',
      );
    }
    return result;
  }, []);
  useEffect(() => {
    let active = true;
    api('auth/me')
      .then((result) => {
        if (active) {
          csrf.current = result.csrf;
          setUser(result.user);
        }
      })
      .catch((e) => {
        if (active && !/Unauthorized|expired/i.test(message(e)))
          setError(message(e));
      })
      .finally(() => {
        if (active) setChecking(false);
      });
    return () => {
      active = false;
    };
  }, [api]);
  useEffect(() => {
    if (!user) return;
    let active = true;
    Promise.all([api('cms/catalog'), api('cms/dashboard')])
      .then(([c, d]) => {
        if (active) {
          setCatalog(c);
          setCounts(d.counts);
        }
      })
      .catch((e) => {
        if (active) setError(message(e));
      });
    return () => {
      active = false;
    };
  }, [user, api]);
  const load = useCallback(async () => {
    if (!user || module === 'dashboard') return;
    const ticket = ++generation.current;
    setBusy(true);
    setError('');
    try {
      const result = await api(`cms/${module}?page=${page}`);
      if (ticket === generation.current) {
        setRows(result.items);
        setTotal(result.total);
      }
    } catch (e) {
      if (ticket === generation.current) setError(message(e));
    } finally {
      if (ticket === generation.current) setBusy(false);
    }
  }, [api, user, module, page]);
  useEffect(() => {
    setRows([]);
    void load();
  }, [load]);
  function navigate(key: string) {
    generation.current++;
    setModule(key);
    setPage(1);
    setSelected(null);
    setFilter('');
    setError('');
    setNotice('');
    setNavOpen(false);
  }
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const result = await api('auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: form.get('email'),
          password: form.get('password'),
        }),
      });
      csrf.current = result.csrf;
      setUser(result.user);
      setModule('dashboard');
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    try {
      await api('auth/logout', { method: 'POST', body: '{}' });
      csrf.current = '';
      setUser(null);
      setRows([]);
      setCatalog({});
      setCounts({});
      setSelected(null);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  if (checking)
    return (
      <main className="admin-login">
        <p role="status">Checking your session…</p>
      </main>
    );
  if (!user)
    return (
      <main className="admin-login">
        <section className="admin-login-brand">
          <a href="/" aria-label="UFDE home">
            <img
              src="/brand/ufde-logo-light.svg"
              alt="UFDE"
              width="180"
              height="70"
            />
          </a>
          <div>
            <span className="admin-eyebrow">INSTITUTIONAL WORKSPACE</span>
            <h1>
              Knowledge.
              <br />
              Cooperation.
              <br />
              <em>Impact.</em>
            </h1>
            <p>
              Manage the ideas, people and partnerships that connect Ukraine,
              France and Europe.
            </p>
          </div>
          <small>UFDE · Administration</small>
        </section>
        <section className="admin-login-panel">
          <div className="admin-login-box">
            <ShieldCheck size={30} />
            <span className="admin-eyebrow">AUTHORISED ACCESS</span>
            <h2>Welcome back</h2>
            <p>Sign in to your UFDE administration account.</p>
            {error && (
              <div className="admin-error" role="alert">
                {error}
              </div>
            )}
            <form onSubmit={login}>
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  maxLength={254}
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={256}
                />
              </label>
              <button className="admin-primary" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'} <ChevronRight size={18} />
              </button>
            </form>
            <p className="admin-help">
              Need access or a password reset? Contact your platform
              administrator.
            </p>
            <a href="/">← Back to the UFDE website</a>
          </div>
        </section>
      </main>
    );
  const def = catalog[module];
  const list = rows.filter((r) =>
    nameOf(r).toLowerCase().includes(filter.toLowerCase()),
  );
  return (
    <div className="admin-shell">
      <aside className={'admin-sidebar ' + (navOpen ? 'is-open' : '')}>
        <a className="admin-brand" href="/">
          <img
            src="/brand/ufde-logo-light.svg"
            alt="UFDE"
            width="150"
            height="58"
          />
          <span>ADMINISTRATION</span>
        </a>
        <button
          className="admin-nav-close"
          onClick={() => setNavOpen(false)}
          aria-label="Close navigation"
        >
          <X />
        </button>
        <nav aria-label="Administration modules">
          {[
            ['dashboard', 'Dashboard'],
            ...Object.entries(catalog).map(([key, value]) => [
              key,
              value.label,
            ]),
          ].map(([key, label]) => {
            const Icon = icons[key] || FileText;
            return (
              <button
                key={key}
                className={module === key ? 'active' : ''}
                aria-current={module === key ? 'page' : undefined}
                onClick={() => navigate(key)}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </nav>
        <div className="admin-sidebar-footer">
          <ShieldCheck size={17} />
          <span>Secure editorial workspace</span>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-mobile-menu"
            aria-label="Open navigation"
            onClick={() => setNavOpen(true)}
          >
            <Menu />
          </button>
          <span>
            UFDE <ChevronRight size={14} /> {def?.label || 'Dashboard'}
          </span>
          <div className="admin-account">
            <span>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </span>
            <button
              title="Sign out"
              aria-label="Sign out"
              disabled={busy}
              onClick={logout}
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>
        <main className="admin-content">
          {error && (
            <div className="admin-error" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="admin-notice" role="status">
              {notice}
            </div>
          )}
          {module === 'dashboard' ? (
            <>
              <span className="admin-eyebrow">YOUR WORKSPACE</span>
              <h1>Dashboard</h1>
              <p className="admin-intro">
                Keep UFDE’s content clear, current and ready to share.
              </p>
              <div className="admin-stat-grid">
                {Object.entries(counts)
                  .filter(([key]) =>
                    [
                      'activities',
                      'projects',
                      'publications',
                      'contacts',
                    ].includes(key),
                  )
                  .map(([key, count]) => {
                    const Icon = icons[key] || FileText;
                    return (
                      <button key={key} onClick={() => navigate(key)}>
                        <Icon size={23} />
                        <strong>{count}</strong>
                        <span>
                          {catalog[key]?.label || key}
                          <ChevronRight size={16} />
                        </span>
                      </button>
                    );
                  })}
              </div>
              <section className="admin-welcome">
                <div>
                  <span className="admin-eyebrow">EDITORIAL WORKFLOW</span>
                  <h2>From draft to publication</h2>
                  <p>
                    Create a record, add its translations and upload the
                    supporting media. Review the content before making it
                    public.
                  </p>
                  <ol>
                    <li>Prepare the content</li>
                    <li>Review EN · FR · UK</li>
                    <li>Publish approved records</li>
                  </ol>
                </div>
                <ShieldCheck size={76} />
              </section>
              <div className="admin-module-grid">
                {Object.entries(catalog).map(([key, value]) => {
                  const Icon = icons[key] || FileText;
                  return (
                    <button key={key} onClick={() => navigate(key)}>
                      <Icon size={20} />
                      <span>{value.label}</span>
                      <ChevronRight size={16} />
                    </button>
                  );
                })}
              </div>
            </>
          ) : def && selected ? (
            <LocalizedEditor
              key={module + ':' + (selected === 'new' ? 'new' : selected.id)}
              module={module}
              def={def}
              row={selected === 'new' ? undefined : selected}
              user={user}
              api={api}
              onBack={() => setSelected(null)}
              onSaved={async () => {
                setSelected(null);
                setNotice('Changes saved.');
                await load();
                api('cms/dashboard')
                  .then((d) => setCounts(d.counts))
                  .catch(() => {});
              }}
            />
          ) : def ? (
            <>
              <div className="admin-page-heading">
                <div>
                  <span className="admin-eyebrow">CONTENT MANAGEMENT</span>
                  <h1>{def.label}</h1>
                  <p className="admin-intro">
                    {def.private
                      ? 'Private records visible only to authorised staff.'
                      : `${total} record${total === 1 ? '' : 's'} · Manage content and translations`}
                  </p>
                </div>
                {!def.readonly &&
                  !def.noCreate &&
                  (!def.singleton || total === 0) &&
                  allowed(user, module, 'write') && (
                    <button
                      className="admin-primary"
                      onClick={() => setSelected('new')}
                    >
                      <Plus size={18} />{' '}
                      {def.singleton ? 'Configure settings' : 'Create record'}
                    </button>
                  )}
              </div>
              {module === 'media' && allowed(user, 'media', 'write') && (
                <UploadBox api={api} onUploaded={load} />
              )}
              <div className="admin-table-card">
                <div className="admin-table-tools">
                  <label>
                    <Search size={18} />
                    <input
                      aria-label="Filter current page"
                      placeholder="Filter this page…"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    />
                  </label>
                  <span>{busy ? 'Loading…' : `${total} total`}</span>
                </div>
                <div className="admin-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>{module === 'media' ? 'File' : 'Record'}</th>
                        <th>Status</th>
                        <th>Languages</th>
                        <th>Last updated</th>
                        <th>
                          <span className="admin-sr-only">Open</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((row) => (
                        <tr key={row.id}>
                          <td>
                            <button
                              className="admin-record-link"
                              onClick={() => setSelected(row)}
                            >
                              {nameOf(row)}
                            </button>
                            <small>{String(row.slug || '')}</small>
                          </td>
                          <td>
                            <span
                              className={
                                'admin-badge ' +
                                (row.published ? 'is-live' : '')
                              }
                            >
                              {row.isDemo
                                ? 'DEMO'
                                : row.published
                                  ? 'Published'
                                  : String(
                                      row.status ||
                                        row.visibility ||
                                        (def.readonly ? 'Private' : 'Draft'),
                                    )}
                            </span>
                          </td>
                          <td>
                            <div className="admin-language-chips">
                              {(
                                row.translations?.map((t) =>
                                  String(t.locale),
                                ) || (row.locale ? [String(row.locale)] : [])
                              ).map((locale) => (
                                <span key={locale}>{locale}</span>
                              ))}
                            </div>
                          </td>
                          <td>
                            {new Date(row.updatedAt).toLocaleDateString()}
                          </td>
                          <td>
                            <button
                              aria-label={'Open ' + nameOf(row)}
                              onClick={() => setSelected(row)}
                            >
                              <ChevronRight size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {!busy && !list.length && (
                  <div className="admin-empty">
                    <FolderOpen size={30} />
                    <h2>{filter ? 'No matching records' : 'No records yet'}</h2>
                    <p>
                      {filter
                        ? 'Try another term or change the page.'
                        : 'Records will appear here when they are added.'}
                    </p>
                  </div>
                )}
                <div className="admin-pagination">
                  <button
                    disabled={page === 1 || busy}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ← Previous
                  </button>
                  <span>
                    Page {page} of {Math.max(1, Math.ceil(total / 25))}
                  </span>
                  <button
                    disabled={page * 25 >= total || busy}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p role="status">Loading your workspace…</p>
          )}
        </main>
        <footer className="admin-footer">
          UFDE · Ukrainian–French cooperation <span>Administration</span>
        </footer>
      </div>
    </div>
  );
}
function UploadBox({
  api,
  onUploaded,
}: {
  api: Api;
  onUploaded: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [purpose, setPurpose] = useState('GENERAL'),
    [notice, setNotice] = useState('');
  return (
    <div className="admin-upload">
      <Upload size={24} />
      <div>
        <strong>Upload media</strong>
        <p>
          Photographs, official logos or PDF · Maximum 4 MB · Files start
          private
        </p>
        <label>
          Intended use{' '}
          <select
            value={purpose}
            disabled={busy}
            onChange={(e) => setPurpose(e.target.value)}
          >
            {[
              ['GENERAL', 'General image'],
              ['HERO', 'Hero — 1920 × 800+'],
              ['ACTIVITY_PROJECT', 'Activity / project — 1600 × 1000'],
              ['PORTRAIT', 'Team portrait — 1000 × 1200'],
              ['LOGO', 'Official logo — SVG or transparent PNG'],
              ['DOCUMENT', 'PDF document'],
            ].map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {purpose === 'LOGO' && (
          <p>
            Upload supplied official artwork. Logos retain their proportions and
            transparency.
          </p>
        )}
        {notice && <p role="status">{notice}</p>}
        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
      </div>
      <label className="admin-secondary">
        {busy ? 'Uploading…' : 'Choose file'}
        <input
          aria-label="Upload media file"
          type="file"
          accept={
            purpose === 'LOGO'
              ? 'image/svg+xml,image/png,image/webp,image/jpeg'
              : purpose === 'DOCUMENT'
                ? 'application/pdf'
                : 'image/png,image/jpeg,image/webp,image/avif'
          }
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setError('');
            setNotice('');
            if (file.size > 4 * 1024 * 1024) {
              setError('Choose a file smaller than 4 MB');
              return;
            }
            setBusy(true);
            const data = new FormData();
            data.append('file', file);
            data.append('purpose', purpose);
            try {
              const result = await api('media/upload', {
                method: 'POST',
                body: data,
              });
              setNotice(
                [
                  'Upload complete. Original and optimized sizes are available.',
                  ...(result.warnings || []),
                ].join(' '),
              );
              await onUploaded();
            } catch (error) {
              setError(message(error));
            } finally {
              setBusy(false);
              e.target.value = '';
            }
          }}
        />
      </label>
    </div>
  );
}
function Editor({
  module,
  def,
  row,
  user,
  api,
  onBack,
  onSaved,
  initial,
  onDirty,
}: {
  module: string;
  def: Definition;
  row?: Row;
  user: User;
  api: Api;
  onBack: () => void;
  onSaved: () => Promise<void>;
  initial?: Record<string, unknown>;
  onDirty?: (dirty: boolean) => void;
}) {
  const defaults = (fields: Field[], source: Record<string, unknown> = {}) =>
    Object.fromEntries(
      fields.map((f) => [
        f.name,
        source[f.name] ??
          (f.type === 'boolean'
            ? false
            : f.type === 'list' || f.type === 'relations'
              ? []
              : f.type === 'json'
                ? {}
                : f.type === 'select'
                  ? f.options?.[0] || ''
                  : f.name === 'timezone'
                    ? 'Europe/Paris'
                    : ''),
      ]),
    );
  const [fields, setFields] = useState<Record<string, unknown>>(() =>
      defaults(def.fields, row || initial),
    ),
    [translations, setTranslations] = useState<
      Record<string, Record<string, unknown>>
    >(() =>
      Object.fromEntries(
        locales.map((locale) => [
          locale,
          defaults(
            def.translations || [],
            row?.translations?.find((t) => t.locale === locale),
          ),
        ]),
      ),
    ),
    [enabled, setEnabled] = useState<string[]>(
      () => row?.translations?.map((t) => String(t.locale)) || ['EN'],
    ),
    [locale, setLocale] = useState('EN'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [dirty, setDirty] = useState(false),
    [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    onDirty?.(dirty);
  }, [dirty, onDirty]);
  const readonly = def.readonly || !allowed(user, module, 'write');
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  const change = (key: string, value: unknown) => {
    setDirty(true);
    setFields((old) => ({ ...old, [key]: value }));
  };
  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('cms/' + module + (row ? '/' + row.id : ''), {
        method: row ? 'PUT' : 'POST',
        body: JSON.stringify({
          fields,
          ...(def.translations
            ? {
                translations: enabled.map((locale) => ({
                  locale,
                  ...translations[locale],
                })),
              }
            : {}),
          ...(row ? { version: row.updatedAt } : {}),
        }),
      });
      setDirty(false);
      await onSaved();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button
        className="admin-back"
        onClick={() => {
          if (!dirty || window.confirm('Discard unsaved changes?')) onBack();
        }}
      >
        <ArrowLeft size={17} /> Back to {def.label}
      </button>
      <div className="admin-page-heading">
        <div>
          <span className="admin-eyebrow">
            {row ? 'EDIT RECORD' : 'NEW RECORD'}
          </span>
          <h1>{row ? nameOf(row) : 'Create ' + def.label.toLowerCase()}</h1>
          <p className="admin-intro">
            {readonly
              ? 'Review this record.'
              : 'Shared details apply to every language. Localised text is edited below.'}
          </p>
        </div>
        {row && module === 'media' && (
          <a
            className="admin-secondary"
            href={'/api/admin/media/' + row.id + '/file'}
            target="_blank"
            rel="noreferrer"
          >
            Open file ↗
          </a>
        )}
      </div>
      {error && (
        <div className="admin-error" role="alert">
          {error}
        </div>
      )}
      {row && module === 'media' && (
        <section className="admin-editor-panel">
          <h2>Image files</h2>
          <p>
            {String(row.purpose || 'GENERAL')} ·{' '}
            {row.width ? `${row.width} × ${row.height}` : 'Document'} · Original
            source retained
          </p>
          <div className="admin-media-variants">
            {(
              (row.variants || []) as {
                name: string;
                format: string;
                width?: number;
                height?: number;
                url: string;
              }[]
            ).map((v) => (
              <a
                className="admin-secondary"
                key={v.name + v.format}
                href={`/api/admin/media/${row.id}/file?size=${v.name}&format=${v.format}`}
                target="_blank"
                rel="noreferrer"
              >
                {v.name} · {v.format.toUpperCase()}{' '}
                {v.width ? `${v.width}×${v.height}` : ''} ↗
              </a>
            ))}
          </div>
        </section>
      )}
      <form onSubmit={save}>
        <fieldset disabled={busy}>
          <section className="admin-editor-panel">
            <h2>Shared details</h2>
            <fieldset disabled={readonly}>
              <div className="admin-field-grid">
                {def.fields.map((field) => (
                  <FieldInput
                    key={field.name}
                    field={field}
                    value={fields[field.name]}
                    api={api}
                    onChange={(value) => change(field.name, value)}
                  />
                ))}
              </div>
            </fieldset>
          </section>
          {def.translations && (
            <section className="admin-editor-panel">
              <div className="admin-translation-heading">
                <h2>Translations</h2>
                <div
                  className="admin-tabs"
                  role="tablist"
                  aria-label="Translation language"
                >
                  {locales.map((l) => (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={locale === l}
                      aria-controls={'translation-' + l}
                      id={'tab-' + l}
                      key={l}
                      onClick={() => setLocale(l)}
                    >
                      {l}
                      {enabled.includes(l) && (
                        <span aria-label="Enabled">•</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div
                role="tabpanel"
                id={'translation-' + locale}
                aria-labelledby={'tab-' + locale}
              >
                <label className="admin-checkbox">
                  <input
                    type="checkbox"
                    disabled={readonly}
                    checked={enabled.includes(locale)}
                    onChange={(e) => {
                      setDirty(true);
                      setEnabled((old) =>
                        e.target.checked
                          ? [...old, locale]
                          : old.filter((l) => l !== locale),
                      );
                    }}
                  />{' '}
                  Enable {locale} translation
                </label>
                {enabled.includes(locale) ? (
                  <fieldset disabled={readonly}>
                    <div className="admin-field-grid">
                      {def.translations.map((field) => (
                        <FieldInput
                          key={locale + field.name}
                          field={field}
                          value={translations[locale][field.name]}
                          api={api}
                          onChange={(value) => {
                            setDirty(true);
                            setTranslations((old) => ({
                              ...old,
                              [locale]: { ...old[locale], [field.name]: value },
                            }));
                          }}
                        />
                      ))}
                    </div>
                  </fieldset>
                ) : (
                  <p className="admin-help">
                    Enable this language when its content is ready. Shared
                    images and relationships are preserved.
                  </p>
                )}
              </div>
            </section>
          )}
        </fieldset>
        <div className="admin-editor-actions">
          {!readonly && (
            <button className="admin-primary" disabled={busy}>
              <Save size={17} />
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          )}
          <button
            className="admin-secondary"
            type="button"
            disabled={busy}
            onClick={() => {
              if (!dirty || window.confirm('Discard unsaved changes?'))
                onBack();
            }}
          >
            Close
          </button>
          {row && !def.noDelete && allowed(user, module, 'delete') && (
            <button
              type="button"
              className="admin-delete"
              disabled={busy}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 size={16} /> Delete record
            </button>
          )}
        </div>
      </form>
      {confirmDelete && (
        <div className="admin-modal-backdrop">
          <section
            className="admin-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <h2 id="delete-title">Delete this record?</h2>
            <p>
              “{nameOf(row!)}” will be permanently removed. This cannot be
              undone.
            </p>
            <div>
              <button
                autoFocus
                className="admin-secondary"
                onClick={() => setConfirmDelete(false)}
              >
                Keep record
              </button>
              <button
                className="admin-delete"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError('');
                  try {
                    await api(
                      `cms/${module}/${row!.id}?version=${encodeURIComponent(row!.updatedAt)}`,
                      { method: 'DELETE' },
                    );
                    setConfirmDelete(false);
                    await onSaved();
                  } catch (e) {
                    setError(message(e));
                    setConfirmDelete(false);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Delete permanently
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
function FieldInput({
  field,
  value,
  onChange,
  api,
}: {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
  api: Api;
}) {
  const id = 'field-' + field.name;
  if (field.type === 'relation' || field.type === 'relations')
    return (
      <RelationInput
        field={field}
        value={value}
        onChange={onChange}
        api={api}
      />
    );
  if (field.type === 'boolean')
    return (
      <label className="admin-checkbox">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
        {field.label}
      </label>
    );
  const common = {
    id,
    required: field.required,
    maxLength: field.max || 50000,
  };
  return (
    <label
      className={
        ['textarea', 'json', 'list'].includes(field.type)
          ? 'admin-field-wide'
          : ''
      }
      htmlFor={id}
    >
      {field.label}
      {field.type === 'date' ? ' (UTC)' : ''}
      {field.required && <span className="admin-required"> *</span>}
      {field.type === 'textarea' ? (
        <textarea
          {...common}
          rows={5}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.type === 'list' ? (
        <textarea
          {...common}
          rows={4}
          value={Array.isArray(value) ? value.join('\n') : ''}
          onChange={(e) => onChange(e.target.value.split('\n'))}
        />
      ) : field.type === 'json' ? (
        <SocialInput value={value} onChange={onChange} />
      ) : field.type === 'select' ? (
        <select
          id={id}
          required={field.required}
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select…</option>
          {!!value && !field.options?.includes(String(value)) && (
            <option value={String(value)}>{String(value)}</option>
          )}
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...common}
          type={
            field.type === 'date'
              ? 'datetime-local'
              : field.type === 'number'
                ? 'number'
                : field.type === 'email'
                  ? 'email'
                  : field.type === 'url'
                    ? 'url'
                    : 'text'
          }
          min={field.type === 'number' ? 0 : undefined}
          max={field.type === 'number' ? 9999 : undefined}
          value={
            field.type === 'date' && value
              ? String(value).slice(0, 16)
              : String(value ?? '')
          }
          onChange={(e) =>
            onChange(
              field.type === 'number' && e.target.value !== ''
                ? Number(e.target.value)
                : field.type === 'date' && e.target.value
                  ? new Date(e.target.value + 'Z').toISOString()
                  : e.target.value,
            )
          }
        />
      )}
    </label>
  );
}
function SocialInput({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const current = (value || {}) as Record<string, string>;
  return (
    <span className="admin-social-fields">
      {['linkedin', 'facebook', 'x', 'instagram', 'youtube'].map((network) => (
        <span key={network}>
          <span>{network}</span>
          <input
            aria-label={network + ' URL'}
            type="url"
            placeholder="https://…"
            value={current[network] || ''}
            onChange={(e) => {
              const next = { ...current };
              if (e.target.value) next[network] = e.target.value;
              else delete next[network];
              onChange(next);
            }}
          />
        </span>
      ))}
    </span>
  );
}
function RelationInput({
  field,
  value,
  onChange,
  api,
}: {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
  api: Api;
}) {
  const [search, setSearch] = useState(''),
    [options, setOptions] = useState<
      { id: string; label: string; mimeType?: string }[]
    >([]),
    [error, setError] = useState('');
  const labels = useRef<Record<string, string>>({});
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      api(`cms/${field.target}/choices?search=${encodeURIComponent(search)}`)
        .then((rows) => {
          if (active) {
            setOptions(
              rows.filter(
                (r: { mimeType?: string }) =>
                  !field.accept ||
                  (field.accept === 'pdf'
                    ? r.mimeType === 'application/pdf'
                    : r.mimeType?.startsWith('image/')),
              ),
            );
            for (const row of rows) labels.current[row.id] = row.label;
            setError('');
          }
        })
        .catch((e) => {
          if (active) setError(message(e));
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [api, field.target, field.accept, search]);
  const selected = Array.isArray(value)
    ? value.map(String)
    : value
      ? [String(value)]
      : [];
  return (
    <div className="admin-relation">
      <label>
        {field.label}
        <input
          aria-label={'Search ' + field.label}
          placeholder="Search records…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      {error && <small role="alert">{error}</small>}
      <select
        aria-label={'Choose ' + field.label}
        value=""
        onChange={(e) => {
          if (e.target.value)
            onChange(
              field.type === 'relations'
                ? [
                    ...selected.filter((id) => id !== e.target.value),
                    e.target.value,
                  ]
                : e.target.value,
            );
        }}
      >
        <option value="">Choose from matching records…</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {selected.length > 0 && (
        <ul className="admin-selected-relations">
          {selected.map((id) => (
            <li key={id}>
              <span>{labels.current[id] || id}</span>
              <button
                type="button"
                aria-label={'Remove ' + (labels.current[id] || id)}
                onClick={() =>
                  onChange(
                    field.type === 'relations'
                      ? selected.filter((v) => v !== id)
                      : '',
                  )
                }
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <small>Up to 40 matches. Search to find other records.</small>
    </div>
  );
}

function LocalizedEditor(props: Parameters<typeof Editor>[0]) {
  const [active, setActive] = useState(String(props.row?.locale || 'EN')),
    [localized, setLocalized] = useState<Row[]>([]),
    [failure, setFailure] = useState('');
  const dirty = useRef(false);
  const onDirty = useCallback((value: boolean) => {
    dirty.current = value;
  }, []);
  useEffect(() => {
    if (props.module !== 'seo' || !props.row) return;
    let alive = true;
    props
      .api('cms/seo-locales?slug=' + encodeURIComponent(String(props.row.slug)))
      .then((rows) => {
        if (alive) setLocalized(rows);
      })
      .catch((e) => {
        if (alive) setFailure(message(e));
      });
    return () => {
      alive = false;
    };
  }, [props.module, props.row, props.api]);
  if (props.module !== 'seo' || !props.row) return <Editor {...props} />;
  const row =
    localized.find((r) => r.locale === active) ||
    (props.row.locale === active ? props.row : undefined);
  return (
    <>
      {failure && <p className="admin-error">{failure}</p>}
      <div className="admin-tabs" role="tablist" aria-label="SEO language">
        {locales.map((locale) => (
          <button
            type="button"
            key={locale}
            role="tab"
            aria-selected={locale === active}
            onClick={() => {
              if (
                !dirty.current ||
                window.confirm(
                  'Discard unsaved changes before switching language?',
                )
              ) {
                dirty.current = false;
                setActive(locale);
              }
            }}
          >
            {locale}
          </button>
        ))}
      </div>
      <Editor
        {...props}
        key={active}
        row={row}
        initial={{ slug: props.row.slug, locale: active, noIndex: true }}
        onDirty={onDirty}
      />
    </>
  );
}
