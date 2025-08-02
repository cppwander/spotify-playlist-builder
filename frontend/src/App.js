
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';
import AppPage from './AppPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path = "/" element = {<LoginPage/>} />
          <Route path = "/app" element = {<AppPage/>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
