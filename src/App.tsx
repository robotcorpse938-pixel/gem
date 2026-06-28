import { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { TitleScreen } from './screens/TitleScreen';
import { HubScreen } from './screens/HubScreen';
import { DungeonScreen } from './screens/DungeonScreen';
import { BossScreen } from './screens/BossScreen';
import { EndingScreen } from './screens/EndingScreen';
import { HUD } from './components/hud/HUD';
import { storeSessionId } from './lib/persistence';

export default function App() {
  const run = useGameStore(s => s.run);

  useEffect(() => {
    if (run.sessionId) storeSessionId(run.sessionId);
  }, [run.sessionId]);

  const showHUD = run.screen === 'dungeon' || run.screen === 'boss';

  return (
    <div style={{ fontFamily: 'Crimson Pro, Georgia, serif' }}>
      {run.screen === 'title' && <TitleScreen />}
      {run.screen === 'hub' && <HubScreen />}
      {run.screen === 'dungeon' && <DungeonScreen />}
      {run.screen === 'boss' && <BossScreen />}
      {run.screen === 'ending' && <EndingScreen />}
      {showHUD && <HUD />}
    </div>
  );
}
