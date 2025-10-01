import { Routes } from "react-router-dom";
import { Route } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import AuthCallbackPage from "./pages/auth-callback/AuthCallbackPage";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import MainLayout from "./layout/MainLayout";
import Numerical from "./pages/numerical/Numerical";
import Nnumerical from "./pages/nnumerical/Nnumerical";
import Chathistory from "./pages/history/Chathistory";

export default function App() {
  return (
    <>
      <Routes>
        <Route
          path="/sso-callback"
          element={
            <AuthenticateWithRedirectCallback
              signUpForceRedirectUrl={"/auth-callback"}
            />
          }
        />
        <Route path="/auth-callback" element={<AuthCallbackPage />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/history" element={<Chathistory />} />
          <Route path="/num" element={<Numerical />} />
          <Route path="/nnum" element={<Nnumerical />} />
        </Route>
      </Routes>
    </>
  );
}
