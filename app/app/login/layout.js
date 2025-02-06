// app/login/layout.js
import "./Login.css";

export const metadata = {
    title: "Spotify - Login",
  };
  
  export default function LoginLayout({ children }) {
    return (
        <div className="login-body">
            {children}
        </div>
    );
  }
  