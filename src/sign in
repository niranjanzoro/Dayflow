import { useState } from "react";
import "./SignIn.css";

export default function SignIn() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!loginId || !password) {
      alert("Please enter Login ID/Email and Password");
      return;
    }

    console.log("Login ID / Email:", loginId);
    console.log("Password:", password);

    // Add your login API call here
  };

  return (
    <div className="signin-page">
      <div className="signin-card">
        <h1>Welcome Back</h1>
        <p className="subtitle">Sign in to continue</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Login ID / Email</label>
            <input
              type="text"
              placeholder="Enter your Login ID or Email"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
