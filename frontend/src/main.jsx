import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { AssessmentProvider } from './context/AssessmentContext'
import { PatientProvider } from './context/PatientContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AssessmentProvider>
          <PatientProvider>
            <App />
          </PatientProvider>
        </AssessmentProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
