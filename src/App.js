import { HashRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Main from "./Components/Main";
import TeamsPage from "./pages/TeamsPage";
import "./Components/style.css";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/"        element={<LandingPage />} />
        <Route path="/pokedex" element={<Main />} />
        <Route path="/teams"   element={<TeamsPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
