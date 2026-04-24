import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const GoogleCallbackPage = () => {
  const { loginWithToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const next = params.get("next") || "/";

    if (!token) {
      navigate("/auth", { replace: true });
      return;
    }

    (async () => {
      try {
        await loginWithToken(token);
        navigate(next, { replace: true });
      } catch (err) {
        console.error("Google callback error:", err);
        navigate("/auth", { replace: true });
      }
    })();
  }, [location.search, loginWithToken, navigate]);

  return <p>Signing you in with Google...</p>;
};

export default GoogleCallbackPage;
