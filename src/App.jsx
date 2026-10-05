import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Home from "./Pages/Home.jsx";
import EditorPage from "./Pages/EditorPage.jsx";
import { Toaster } from "react-hot-toast";



function App() {
  return (

    <>
     
    <BrowserRouter>
      {/* <Toaster/> */}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/editor/:roomId" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;