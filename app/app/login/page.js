"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import srp from "secure-remote-password/client";
import { useRouter } from "next/navigation";
import GoogleLogo from "../icons/GoogleLogo";
import OkoOtwarte from "../icons/OkoOtwarte";
import OkoZamkniete from "../icons/OkoZamkniete";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpotify } from '@fortawesome/free-brands-svg-icons';
import Error from "../icons/Error";
import "./Login.css";
import { useAuth } from "../contexts/AuthContext";
import Loading from "../components/Loading";


export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState("");
  const [apply, setApply] = useState(false);
  const { isAuthLoading, userData , fetchSessionAndUser } = useAuth();

  const handleLoginLocal = async (e) => {
    e.preventDefault();
    setErrors("");
    setApply(true)
    try {
      const clientEphemeral = srp.generateEphemeral();

      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, clientPublicKey: clientEphemeral.public }),
      });
  
      if (!response.ok) {
        const data = await response.json();
        setErrors(data.error || "Błąd logowania.");
        setLoading(false);
        return;
      }
  
      const { salt, serverEphemeral } = await response.json();

      const privateKey = srp.derivePrivateKey(salt, email, password);
      const clientSession = srp.deriveSession(
        clientEphemeral.secret,
        serverEphemeral,
        salt,
        email,
        privateKey
      );

      const proofResponse = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          clientPublicKey: clientEphemeral.public,
          clientProof: clientSession.proof,
        }),
        credentials: "include",
      });

      const proofData = await proofResponse.json();

      if (!proofResponse.ok || !proofData.serverProof) {
        setErrors(proofData.error || "Błąd logowania.");
        setLoading(false);
        return;
      }

      srp.verifySession(clientEphemeral.public, clientSession, proofData.serverProof);

      await fetchSessionAndUser();
      router.push("/");
      
      } catch (error) {
        console.error("Błąd w handleLoginLocal:", error);
        setErrors("tak")
        setApply(false)
      } finally {
        setApply(false);
      }
  };

  const handleGoogleLogin = async () => {
    await signIn("google", { callbackUrl: "/" });
  };

  useEffect(() => {
    if (userData) {
      router.push("/");
    }
  }, [userData]);

  if (isAuthLoading) {
    return <Loading />
  }

  if(!userData){
  return (
    <div className="login-background">
      <div className="okno-logowania">
        <div className="pole-logowania">
          <div className='header'>
            <FontAwesomeIcon className='icon-spotify' onClick={() => router.push('/')} icon={faSpotify} style={{ width: '36px', height: '36px'}}/>
            <h1>Zaloguj się w Spotify</h1>
          </div>
          {errors && <div className="walidacja">
            <Error />
            <p className="error-message">{errors}</p>
          </div>}
          <button onClick={handleGoogleLogin} className='google'>
            <div className="logo"><GoogleLogo /></div>
            <p>Kontynuuj z Google</p>
          </button>
          <hr />
          <form onSubmit={handleLoginLocal}>
            <div>
              <label>Adres e-mail lub nazwa użytkownika</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Adres e-mail lub nazwa użytkownika"
                required=""
              />
            </div>
            <div>
              <label className="password">Hasło</label>
              <div className="input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Hasło"
                  required=""
                />
                <button
                  type="button"
                  className="widocznosc-hasla"
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? (
                    <OkoOtwarte />
                  ) : (
                    <OkoZamkniete />
                  )}
                </button>
              </div>
            </div>
            <button type="submit" className={apply ? 'dalej apply' : 'dalej' } disabled={apply} >Zaloguj się</button>
          </form>
          <div className="stopka">
            <p>Nie masz jeszcze konta? <a href='/register'>Zarejestruj się w Spotify</a></p>
            </div>   
        </div>
      </div>
    </div>
  );
  }
}
