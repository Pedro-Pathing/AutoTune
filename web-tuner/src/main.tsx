import { createRoot } from "react-dom/client";

import "./index.css";
import { BrowserRouter, Route, Routes } from "react-router";

import Home from "./pages/home";
import Layout from "./pages/layout";
import Tuner from "./pages/tuner";

createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
        <Routes>
            <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="tuner/:id" element={<Tuner />} />
            </Route>
        </Routes>
    </BrowserRouter>
);
