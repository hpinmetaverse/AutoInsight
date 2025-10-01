import { Routes } from "react-router-dom";
import { Route, Navigate } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import AuthCallbackPage from "./pages/auth-callback/AuthCallbackPage";
import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import MainLayout from "./layout/MainLayout";
import Numerical from "./pages/numerical/Numerical";
import Nnumerical from "./pages/nnumerical/Nnumerical";
import Chathistory from "./pages/history/Chathistory";
import NotFoundPage from "./pages/404/NotFoundPage";
import { useAuth } from "@clerk/clerk-react";

export default function App() {
  const { isSignedIn } = useAuth();
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
        </Route>
        <Route
          path="/history"
          element={isSignedIn ? <Chathistory /> : <Navigate to="/" />}
        />

        <Route path="/num" element={<Numerical />} />
        <Route path="/nnum" element={<Nnumerical />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
