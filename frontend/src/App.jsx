import { Routes, Route } from "react-router-dom";
import { Box } from "@chakra-ui/react";
import { Navbar } from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import {Invoices} from "./pages/Invoices";
import InvoiceDetail from "./pages/InvoiceDetail";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import Pricing from "./pages/Pricing";

function App() {
  return (
    <Box minH="100vh">
      <Navbar />
      <Routes>
       
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile/>}/>
        <Route path="/pricing" element={<Pricing/>}/>
        <Route element={<ProtectedRoute/>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/invoices/:invoiceId" element={<InvoiceDetail />} />
        <Route path="/invoices" element={<Invoices />} />
        </Route>
      </Routes>
    </Box>
  );
}

export default App;
