import { useState } from 'react';
import ProfitPlatform from './components/ProfitPlatform';
import ToolNav from './components/ToolNav';
import WatermarkTool from './components/WatermarkTool';

export default function App() {
  const [activeTool, setActiveTool] = useState('profit');

  return (
    <>
      <ToolNav active={activeTool} onChange={setActiveTool} />
      {activeTool === 'profit' ? <ProfitPlatform /> : <WatermarkTool />}
    </>
  );
}
