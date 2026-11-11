import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router'
import './index.css'
import { NotificationSocket } from './notifications/NotificationSocket.tsx'
import { NotificationProvider } from './notifications/notifications.tsx'
import { router } from './router.tsx'
import { store } from './store/store.ts'

createRoot(document.getElementById('root')!).render(
    <Provider store={store}>
      <NotificationProvider>
        <NotificationSocket />
        <RouterProvider router={router} />
      </NotificationProvider>
    </Provider>
)
