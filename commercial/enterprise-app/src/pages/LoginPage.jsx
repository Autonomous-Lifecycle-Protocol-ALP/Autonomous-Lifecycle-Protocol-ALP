import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

export default function LoginPage() {
  const [email, setEmail] = useState("demo@alp-enterprise.com");
  const [password, setPassword] = useState("demo123");
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        if (!name.trim() || !orgName.trim()) {
          setError("Name and organization are required");
          return;
        }
        await register(name, email, password, orgName);
      } else {
        await login(email, password);
      }
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || (isRegister ? "Registration failed" : "Login failed"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center glass-dark">
      <div className="max-w-md w-full space-y-8 p-8 bg-gray-900/60 rounded-xl glass-dark">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">ALP</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-sky-300">ALP Enterprise</h1>
          <p className="text-gray-400 mt-2">Autonomous Lifecycle Protocol</p>
        </div>
        {error && <div className="bg-red-900/40 text-red-300 p-3 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
                <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-800/40 text-gray-200 focus:border-sky-500 focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Organization Name</label>
                <input type="text" placeholder="Organization Name" value={orgName} onChange={(e) => setOrgName(e.target.value)} className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-800/40 text-gray-200 focus:border-sky-500 focus:outline-none" required />
              </div>
            </>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Email</label>
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-800/40 text-gray-200 focus:border-sky-500 focus:outline-none" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-600 rounded bg-gray-800/40 text-gray-200 focus:border-sky-500 focus:outline-none" required />
          </div>
          <button type="submit" className="w-full bg-sky-600 text-white py-2 rounded hover:bg-sky-700 transition-colors">{isRegister ? "Create Account" : "Sign In"}</button>
        </form>
        <p className="text-center text-sm">
          <button onClick={() => { setIsRegister(!isRegister); setError(""); }} className="text-sky-400 hover:text-sky-300">
            {isRegister ? "Already have an account? Sign in" : "Need an account? Register"}
          </button>
        </p>
      </div>
    </div>
  );
}
