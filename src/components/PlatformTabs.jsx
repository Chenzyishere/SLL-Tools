import { PLATFORM_PRESETS } from '../constants/platformPresets';

const EMOJI = {
  pinduoduo: '📦',
  dewu: '👟',
  manual: '📝'
};

export default function PlatformTabs({ platformId, onChange }) {
  return (
    <section className="platform-list">
      <span className="platform-list-label">平台选择</span>
      {Object.values(PLATFORM_PRESETS).map((preset) => {
        const active = platformId === preset.id;
        return (
          <button
            className={active ? 'active' : ''}
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.id)}
          >
            <span className="platform-emoji">{EMOJI[preset.id] || '📊'}</span>
            <span className="platform-name">{preset.name}</span>
            {active && <span className="platform-check">✓</span>}
          </button>
        );
      })}
    </section>
  );
}
