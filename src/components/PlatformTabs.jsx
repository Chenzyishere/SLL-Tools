import { PLATFORM_PRESETS } from '../constants/platformPresets';
import { IconCheck, IconPackage, IconPen, IconShoe } from './Icons';

const ICONS = {
  pinduoduo: IconPackage,
  dewu: IconShoe,
  manual: IconPen
};

export default function PlatformTabs({ platformId, onChange }) {
  return (
    <section className="platform-list">
      <span className="platform-list-label">平台选择</span>
      {Object.values(PLATFORM_PRESETS).map((preset) => {
        const active = platformId === preset.id;
        const Icon = ICONS[preset.id] || IconPackage;
        return (
          <button
            className={active ? 'active' : ''}
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.id)}
          >
            <span className="platform-emoji"><Icon size={20} /></span>
            <span className="platform-name">{preset.name}</span>
            {active && <span className="platform-check"><IconCheck size={12} /></span>}
          </button>
        );
      })}
    </section>
  );
}
