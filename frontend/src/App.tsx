import { useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { WelcomeScreen } from './components/WelcomeScreen';
import { WorkspaceView } from './components/WorkspaceView';
import { createSession } from './services/api';
import { initializePlugins } from './plugins';

function App() {
  const { view, sessionId, setSessionId } = useAppStore();

  useEffect(() => {
    initializePlugins();
    if (!sessionId) {
      createSession().then(setSessionId);
    }
  }, [sessionId, setSessionId]);

  if (view === 'welcome') {
    return <WelcomeScreen />;
  }

  return <WorkspaceView />;
}

export default App;
