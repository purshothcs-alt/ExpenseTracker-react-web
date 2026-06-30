import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router';
import { SnackbarProvider } from 'notistack';
import { store } from '@app/store';
import { loadSettings } from '@app/settingsSlice';
import { AppThemeProvider } from '@core/theme/ThemeProvider';
import { seedDatabase } from '@core/database/seed/seedDatabase';
import '@localization/i18n';
import { App } from './App';
import './index.css';

async function init() {
  await store.dispatch(loadSettings());
  await seedDatabase();
}

init().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <Provider store={store}>
        <AppThemeProvider>
          <BrowserRouter>
            <SnackbarProvider
              maxSnack={4}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              autoHideDuration={3000}
            >
              <App />
            </SnackbarProvider>
          </BrowserRouter>
        </AppThemeProvider>
      </Provider>
    </React.StrictMode>,
  );
});
