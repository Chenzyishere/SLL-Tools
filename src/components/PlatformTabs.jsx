import { PLATFORM_PRESETS } from '../constants/platformPresets';

const EMOJI = {
  pinduoduo: '📦',
  dewu: '👟'
};

export default function PlatformTabs({ platformId, onChange }) {
  return (
    <section className="platform-tabs" aria-label="平台预设">
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
            <span className="platform-tab-content">
              <strong>{preset.name}</strong>
              <span>{preset.description}</span>
            </span>
            {active && <span className="active-dot" />}
          </button>
        );
      })}
    </section>
  );
}

