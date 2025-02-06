import "./Register.css";

export const metadata = {
    title: "Spotify - Register",
  };
  
  export default function RegisterLayout({ children }) {
    return (
        <div className="register-body">
            {children}
        </div>
    );
  }
  