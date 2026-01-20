import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Routes, Route } from 'react-router-dom'
import { CreateRecord } from './assets/Record/CreateRecord.jsx'

function App() {

  return (
    <>
      <Routes>
          {/*Record Routes  */}
          <Route path='/create-record' element={<CreateRecord/>} />
      </Routes>
    </>
  )
}

export default App
