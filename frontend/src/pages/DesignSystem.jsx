import { useState } from 'react';
import {
  CalendarCheck, Wallet, Check, Ban,
} from 'lucide-react';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import OtpInput from '../components/OtpInput';
import { BarChart, HBarList } from '../components/Charts';
import { StatCardSkeleton, ListRowsSkeleton } from '../components/Skeleton';
import { useToast } from '../context/ToastContext';

const COLORS = [
  ['--primary', 'Primary'], ['--primary-dark', 'Primary dark'], ['--accent', 'Accent'],
  ['--success', 'Success'], ['--warning', 'Warning'], ['--danger', 'Danger'],
  ['--bg', 'Background'], ['--surface', 'Surface'], ['--border', 'Border'],
  ['--ink', 'Ink'], ['--ink-soft', 'Ink soft'], ['--ink-faint', 'Ink faint'],
];

function Section({ title, description, children }) {
  return (
    <section className="ds-section">
      <h2 className="ds-title">{title}</h2>
      {description && <p className="text-sm mb-md">{description}</p>}
      {children}
    </section>
  );
}

function Swatch({ token, name }) {
  return (
    <div className="ds-swatch">
      <span className="ds-color" style={{ background: `var(${token})` }} />
      <span className="fw-600">{name}</span>
      <code className="mono">{token}</code>
    </div>
  );
}

export default function DesignSystem() {
  const toast = useToast();
  const [otp, setOtp] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="page ds-page">
      <div className="page-head">
        <div>
          <h1>Design System</h1>
          <p className="sub">Living style guide - every primitive, rendered by the real app. Toggle the theme in a dashboard to see both modes.</p>
        </div>
      </div>

      <Section title="Color tokens" description="Semantic tokens - components reference these, never raw hex values.">
        <div className="ds-swatches">
          {COLORS.map(([token, name]) => <Swatch key={token} token={token} name={name} />)}
        </div>
      </Section>

      <Section title="Typography">
        <div className="card stack-form">
          <h1 className="h2-lg">Display / Sora 700</h1>
          <h3 className="h3-md">Heading level 3</h3>
          <p>Body text - Inter 400 at 14.5px with comfortable line height for reading.</p>
          <p className="text-sm">Small text (13px) for secondary descriptions.</p>
          <p className="text-xs">Caption text (12px) in faint ink.</p>
          <span className="mono">Mono - JetBrains Mono for IDs and figures</span>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="card row wrap gap-10">
          <button type="button" className="btn btn-primary">Primary</button>
          <button type="button" className="btn btn-accent">Accent</button>
          <button type="button" className="btn btn-ghost">Ghost</button>
          <button type="button" className="btn btn-danger">Danger</button>
          <button type="button" className="btn btn-primary" disabled>Disabled</button>
          <button type="button" className="btn btn-primary"><Check size={15} /> With icon</button>
          <button type="button" className="btn btn-sm btn-primary">Small</button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="card row wrap gap-10">
          <span className="badge badge-success">Active</span>
          <span className="badge badge-warning">Pending</span>
          <span className="badge badge-danger">Rejected</span>
          <span className="badge badge-neutral">Employee</span>
          <span className="badge badge-accent">HR</span>
        </div>
      </Section>

      <Section title="Form controls" description="Default, focused and error states share one input component.">
        <div className="card grid grid-2">
          <div className="field">
            <label htmlFor="ds-input">Input</label>
            <input id="ds-input" className="input" placeholder="Placeholder text" />
          </div>
          <div className="field">
            <label htmlFor="ds-select">Select</label>
            <select id="ds-select" className="input"><option>Option A</option><option>Option B</option></select>
          </div>
          <div className="field">
            <label htmlFor="ds-error">Error state</label>
            <input id="ds-error" className="input error" defaultValue="not-an-email" />
            <span className="field-error">Enter a valid email address.</span>
          </div>
          <div className="field">
            <label htmlFor="ds-textarea">Textarea</label>
            <textarea id="ds-textarea" className="input" rows={2} placeholder="Multi-line input…" />
          </div>
        </div>
      </Section>

      <Section title="OTP input" description="Auto-advance, paste support, backspace navigation.">
        <div className="card">
          <OtpInput value={otp} onChange={setOtp} />
          <p className="text-xs mt-sm">Current value: {otp || '(empty)'}</p>
        </div>
      </Section>

      <Section title="Stat cards & skeletons">
        <div className="grid grid-4 mb-lg">
          <StatCard icon={CalendarCheck} label="Present days" value={21} />
          <StatCard icon={Wallet} label="Net pay" value="$4,250" accent />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
        <ListRowsSkeleton rows={2} />
      </Section>

      <Section title="Charts" description="Dependency-free SVG/CSS primitives.">
        <div className="grid grid-2">
          <div className="card">
            <div className="card-title mb-md">Bar chart</div>
            <BarChart
              data={[
                { label: 'Mon', value: 8 }, { label: 'Tue', value: 7.5 }, { label: 'Wed', value: 0 },
                { label: 'Thu', value: 8.5 }, { label: 'Fri', value: 6 },
              ]}
              formatValue={(v) => `${v}h`}
            />
          </div>
          <div className="card">
            <div className="card-title mb-md">Ranked bars</div>
            <HBarList data={[
              { label: 'Engineering', value: 12 }, { label: 'Sales', value: 7 },
              { label: 'Finance', value: 4 },
            ]} />
          </div>
        </div>
      </Section>

      <Section title="Feedback" description="Toasts are global; banners live inside forms.">
        <div className="card stack-form">
          <div className="row wrap gap-10">
            <button type="button" className="btn btn-primary" onClick={() => toast.success('Changes saved successfully.')}>Success toast</button>
            <button type="button" className="btn btn-danger" onClick={() => toast.error('Could not connect to the server.')}>Error toast</button>
            <button type="button" className="btn btn-ghost" onClick={() => toast.info('A new version is available.')}>Info toast</button>
            <button type="button" className="btn btn-accent" onClick={() => setModalOpen(true)}>Open modal</button>
          </div>
          <div className="form-success-banner"><Check size={16} /> Inline success banner</div>
          <div className="form-error-banner"><Ban size={16} /> Inline error banner</div>
        </div>
      </Section>

      {modalOpen && (
        <Modal title="Example dialog" onClose={() => setModalOpen(false)}>
          <p className="modal-note">
            This dialog traps focus, closes on Escape or overlay click, locks body scroll,
            and restores focus to the trigger when dismissed.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn btn-primary" onClick={() => setModalOpen(false)}>Got it</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
