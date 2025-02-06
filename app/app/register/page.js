"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import GoogleLogo from "../icons/GoogleLogo";
import StrzalkaIcon from "../icons/StrzalkaIcon";
import OkoOtwarte from "../icons/OkoOtwarte";
import OkoZamkniete from "../icons/OkoZamkniete";
import Error from "../icons/Error";
import "./Register.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpotify } from '@fortawesome/free-brands-svg-icons';
import { faCheckCircle} from '@fortawesome/free-solid-svg-icons';
import { faCircle } from '@fortawesome/free-regular-svg-icons';
import { validateField } from '../components/Validation';
import { useAuth } from "../contexts/AuthContext";
import Loading from "../components/Loading";

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [szerokoscPaska, setSzerokoscPaska] = useState("0px");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({}); 
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { isAuthLoading, userData } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [passwordValidations, setPasswordValidations] = useState({
    length: false,
    litery: false,
    spec: false,
  });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    day: "",
    month: "",
    year: "",
    gender: "",
    warunki: false,
  });
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setIsEditing(true);
    if (touched[name]) {
      const error = validateField(name, value, checked);
      setErrors((prev) => ({ ...prev, [name]: error }));
    } else {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };
  
  const checkDateOfBirth = async (day, month, year) => {
    try {
      const res = await fetch("/api/check-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day, month, year }),
      });
  
      const data = await res.json();
      if (res.ok) {
        if(data.error){
          setErrors((prev) => ({ ...prev, dateOfBirth: data.error }));
          return false;
        }
        else{
          setErrors((prev) => ({ ...prev, dateOfBirth: "" }));
          return true;
        }
      }
    } catch (error) {
      console.error("Błąd walidacji daty urodzenia:", error);
      setErrors((prev) => ({ ...prev, dateOfBirth: "Błąd sieci podczas walidacji daty." }));
      return false;
    }
  };

  
  const checkEmailExists = async (email) => {
    if (!email) {
      setEmailExists(false);
      return;
    }
  
    setEmailChecking(true);
  
    try {
      const res = await fetch("/api/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
  
      const data = await res.json();
  
      if (res.ok) {
        setEmailExists(data.exists);
        if (data.exists) {
          setErrors((prev) => ({ ...prev, emailCheck: data.message }));
          return true;
        } else {
          setErrors((prev) => ({ ...prev, emailCheck: "" }));
          return false;
        }
      }
    } catch (error) {
      console.error("Błąd sprawdzania e-maila:", error);
      setErrors((prev) => ({ ...prev, email: "Błąd sprawdzania e-maila." }));
      return false;
    } finally {
      setEmailChecking(false);
    }
  };

  useEffect(() => {
    if (!isEditing) return;
    setErrors((prev) => ({ ...prev, dateOfBirth: "" }))
    const handler = setTimeout(() => {
      if(!errors.day && !errors.month && !errors.year){
        checkDateOfBirth(
          formData.day,
          formData.month,
          formData.year
        );
      }
    },500);

    return () => {
      clearTimeout(handler);
    };
  }, [formData.day, formData.month, formData.year]);

  useEffect(() => {
    setErrors((prev) => ({ ...prev, emailCheck: "" }))
    const handler = setTimeout(() => {
      checkEmailExists(formData.email);
    }, 500);
  
    return () => {
      clearTimeout(handler);
    };
  }, [formData.email]);

  useEffect(() => {
    const { password } = formData;
    const length = password.length >= 10;
    const litery = /[A-Za-z]/.test(password);
    const spec = /[0-9#?!&@\$%\^*\(\)\-\_\+=\[\]\{\}\|\\;:'",\.<>\/\?`~]/.test(password);
    
    setPasswordValidations({
      length,
      litery,
      spec,
    });
  }, [formData.password]);

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const akceptWarunki = validateField('warunki', "" ,formData.warunki);
    setErrors((prev) => ({ ...prev, warunki: akceptWarunki }));
    if(akceptWarunki){
      return;
    }
    const dateOfBirth = `${formData.year}-${formData.month}-${formData.day}`;

    const { warunki, day, month, year, ...remainingData } = formData;
    const preparedData = {
    ...remainingData,
    dateOfBirth,
    };
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preparedData),
      });
  
      if (res.ok) {
        router.push("/");
      } else {
        const data = await res.json();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoogleRegister = async () => {
    await signIn("google", { callbackUrl: "/" });
  };

  useEffect(() => {
    const szerokoscPaska = (436 * (step-1)) / 3;
    setSzerokoscPaska(`${szerokoscPaska}px`);
  }, [step]);

  if (isAuthLoading) {
    return <Loading />
  }
  if(userData){
    router.push("/");
  }
  else{
  return (
    <>
    <div className='header'>
            <FontAwesomeIcon className='icon-spotify' icon={faSpotify} style={{ width: '40px', height: '40px'}}/>
          </div>
    <div className="okno-rejestracji">
      {step > 1 && (
        <>
        <div className="pasek">
          <div className="pasek-zielony" style={{ width: szerokoscPaska }}></div>
        </div>
        <div className="kroki-container">
          <button className="strzalka" onClick={prevStep}>
          <StrzalkaIcon />
          </button>
          <div className="kroki">
            <p>Krok {step-1} z 3</p>
            {step === 2 && (<p>Utwórz hasło</p>)}
            {step === 3 && (<p>Opowiedz nam o sobie</p>)}
            {step === 4 && (<p>Warunki</p>)}
          </div>
        </div>
        </>
      )}
      {step === 1 && (
        <>
          <h1>Zarejestruj<br />się, aby zacząć<br />słuchać</h1>
          <form onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
            <div>
              <label>Adres e-mail</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="nazwa@domena.com"
                className={errors.email || errors.emailCheck ? "error" : ""}
              />
            </div>
            {errors.emailCheck && <div className="walidacja-mail">
              <Error />
              <p className="error-message">Istnieje już konto zarejestrowane na ten adres e-mail. <a href='/login'>Zaloguj się</a>, aby kontynuować.</p>
            </div>}
            {errors.email && <div className="walidacja">
              <Error />
              <p className="error-message">{errors.email}</p>
            </div>}
            <button type="button" className='dalej' onClick={async () => {
            const emailError = validateField("email", formData.email);
            const isEmailValid = await checkEmailExists(formData.email);
            setErrors((prev) => ({
              ...prev,
              email: emailError,
            }));
            if (!emailError && !isEmailValid) {
              setStep(2);
            }
          }}>
              Dalej
            </button>
          </form>
          <span className="lub">lub</span>
          <button onClick={handleGoogleRegister} className='google'>
            <div className="logo"><GoogleLogo /></div>
            <p>Zarejestruj się przez Google</p>
          </button>
          <span className="kreska"></span>
          <div className="stopka">
          <p>Masz już konto? <a href='/login'>Zaloguj się tutaj</a>.</p>
          </div>
        </>
      )}

      {step === 2 && (
        <form onSubmit={(e) => { e.preventDefault(); nextStep(); }}>
          <div>
            <label>Hasło</label>
            <div className="input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={errors.password ? "error" : ""}
                    
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
          <div className="password-validations">
            <p>Twoje hasło musi zawierać co najmniej</p>
              <p className={passwordValidations.litery ? "valid" : "invalid"}>
                <FontAwesomeIcon  className={passwordValidations.litery ? 'valid-icon' : 'invalid-icon'} icon={passwordValidations.litery ? faCheckCircle : faCircle} /> <span className={!passwordValidations.litery && errors.password ? 'error' : ''}>1 literę</span>
              </p>
              <p className={passwordValidations.spec ? "valid" : "invalid"}>
                <FontAwesomeIcon className={passwordValidations.spec ? 'valid-icon' : 'invalid-icon'} icon={passwordValidations.spec ? faCheckCircle : faCircle} /> <span className={!passwordValidations.spec && errors.password ? 'error' : ''}>1 cyfrę lub znak specjalny (np. #, ?, !, &)</span>
              </p>
              <p className={passwordValidations.length ? "valid" : "invalid"}>
                <FontAwesomeIcon className={passwordValidations.length ? 'valid-icon' : 'invalid-icon'} icon={passwordValidations.length ? faCheckCircle : faCircle} /> <span className={!passwordValidations.length && errors.password ? 'error' : ''}>10 znaków</span>
              </p>
            </div>
          </div>
          <button
          type="button"
          className="dalej"
          onClick={() => {
            const { length, litery, spec } = passwordValidations;
            if (length && litery && spec) {
              setStep(3);
            } else {
              setErrors((prev) => ({ ...prev, password: true }));
            }
          }}
        >
          Dalej
        </button>
        </form>
      )}

      {step === 3 && (
        <form className='step-3' onSubmit={handleRegister}>
          <div>
            <label>Imię</label>
            <input
              type="text"
              name="name"
              onChange={handleChange}
              onBlur={handleBlur}
              value={formData.name}
              required=''
              className={errors.name ? "error" : ""}
            />
          </div>
          {errors.name && <div className="walidacja">
              <Error />
              <p className="error-message">{errors.name}</p>
            </div>}
          <div className="data-ur">
            <label>Data urodzenia</label>
            <div className="date-container">
              <input
                type="text"
                maxLength="2"
                name="day"
                className={`dd ${(errors.day || errors.dateOfBirth=="2") && "error"}`}
                value={formData.day}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="dd"
                onKeyDown={(e) => {
                  if (
                    !(
                      (e.key >= "0" && e.key <= "9") ||
                      ["Backspace", "Tab", "Delete", "ArrowLeft", "ArrowRight"].includes(e.key)
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
              />
              <select
                name="month"
                className={`mm ${(errors.month || errors.dateOfBirth=="2") && "error"}`}
                defaultValue=""
                onChange={handleChange}
                onBlur={handleBlur}
              >
                <option value="" disabled>Miesiąc</option>
                <option value="01">styczeń</option>
                <option value="02">luty</option>
                <option value="03">marzec</option>
                <option value="04">kwiecień</option>
                <option value="05">maj</option>
                <option value="06">czerwiec</option>
                <option value="07">lipiec</option>
                <option value="08">sierpień</option>
                <option value="09">wrzesień</option>
                <option value="10">październik</option>
                <option value="11">listopad</option>
                <option value="12">grudzień</option>
              </select>
              <input
                type="text"
                maxLength="4"
                name="year"
                className={`rrrr ${(errors.year || errors.dateOfBirth) && "error"}`}
                value={formData.year}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="rrrr"
                onKeyDown={(e) => {
                  if (
                    !(
                      (e.key >= "0" && e.key <= "9") ||
                      ["Backspace", "Tab", "Delete", "ArrowLeft", "ArrowRight"].includes(e.key)
                    )
                  ) {
                    e.preventDefault();
                  }
                }}
              />
              </div>
          </div>

          {(() => {
            const elements = [];

            if (!formData.day && errors.day && errors.month && errors.year) {
              elements.push(
                <div className="walidacja" key="all-errors">
                  <Error />
                  <p className="error-message">Wprowadź swoją datę urodzenia.</p>
                </div>
              );
            }
            else{
              if (errors.day) {
                elements.push(
                  <div className="walidacja" key="day-error">
                    <Error />
                    <p className="error-message">{errors.day}</p>
                  </div>
                );
              }

              if (errors.month) {
                elements.push(
                  <div className="walidacja" key="month-error">
                    <Error />
                    <p className="error-message">{errors.month}</p>
                  </div>
                );
              }

              if (errors.year) {
                elements.push(
                  <div className="walidacja" key="year-error">
                    <Error />
                    <p className="error-message">{errors.year}</p>
                  </div>
                );
              }

              if (errors.dateOfBirth=="1") {
                elements.push(
                  <div className="walidacja" key="age-error">
                    <Error />
                    <p className="error-message">Masz za mało lat, żeby założyć konto w Spotify. <a href="#">Dowiedz się więcej</a>.</p>
                  </div>
                );
              }
              if (errors.dateOfBirth=="2") {
                elements.push(
                  <div className="walidacja" key="date-error">
                    <Error />
                    <p className="error-message">Podana data urodzenia jest nieprawidłowa. Sprawdź, czy dzień, miesiąc i rok są poprawne (np. luty ma maksymalnie 28 lub 29 dni w roku przestępnym).</p>
                  </div>
                );
              }
            }
            return elements.length > 0 ? elements : null;
          })()}

          <div className="plec">
            <label>Płeć</label>
            <div className="gender-container">
              <label className="gender-option">
                <input
                  type="radio"
                  name="gender"
                  value="mezczyzna"
                  onChange={handleChange}
                  checked={formData.gender === "mezczyzna"}
                />
                <span className="custom-radio"></span>
                Mężczyzna
              </label>
              <label className="gender-option">
                <input
                  type="radio"
                  name="gender"
                  value="kobieta"
                  onChange={handleChange}
                  checked={formData.gender === "kobieta"}
                />
                <span className="custom-radio"></span>
                Kobieta
              </label>
              <label className="gender-option">
                <input
                  type="radio"
                  name="gender"
                  value="niebinarna"
                  onChange={handleChange}
                  checked={formData.gender === "niebinarna"}
                />
                <span className="custom-radio"></span>
                Osoba niebinarna
              </label>
              <label className="gender-option">
                <input
                  type="radio"
                  name="gender"
                  value="inna"
                  onChange={handleChange}
                  checked={formData.gender === "inna"}
                />
                <span className="custom-radio"></span>
                Inna
              </label>
              <label className="gender-option">
                <input
                  type="radio"
                  name="gender"
                  value="brak"
                  onChange={handleChange}
                  checked={formData.gender === "brak"}
                />
                <span className="custom-radio"></span>
                Nie chcę podawać
              </label>
              
            </div>
          </div>
          {errors.gender && <div className="walidacja">
              <Error />
              <p className="error-message">{errors.gender}</p>
            </div>}
          <button type="button" className='dalej' onClick={async () => {
            const nameError = validateField("name", formData.name);
            const dayError = validateField("day", formData.day);
            const monthError = validateField("month", formData.month);
            const yearError = validateField("year", formData.year);
            const genderError = validateField("gender", formData.gender);

            setErrors((prev) => ({
              ...prev,
              name: nameError,
              day: dayError,
              month: monthError,
              year: yearError,
              gender: genderError,
            }));

            const isDateValid = (!dayError && !monthError && !yearError)
            ? await checkDateOfBirth(formData.day, formData.month, formData.year)
            : false;

            if (!nameError && !dayError && !monthError && !yearError && !genderError && isDateValid) {
              setStep(4);
            }
          }}>
            Dalej
          </button>
        </form>
      )}
      {step === 4 && (
        <form onSubmit={handleRegister}>
          <div className="warunki">
            <label>
              <input
                type="checkbox"
                name="warunki"
                checked={formData.warunki}
                onChange={handleChange}
              />
              <p>Akceptuję <a href='#'>Warunki korzystania ze Spotify</a>.</p>
            </label>
          </div>
          {errors.warunki && <div className="walidacja">
              <Error />
              <p className="error-message">{errors.warunki}</p>
            </div>}
          <button type="submit" className='dalej'>
            Zarejestruj się
          </button>
        </form>
      )}
    </div>
    </>
  );
  }
}
