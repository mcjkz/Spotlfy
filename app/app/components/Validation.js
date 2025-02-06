export const validateField = (name, value, checked) => {
    switch (name) {
        case "email":
            if (!/\S+@\S+\.\S+/.test(value)) return "Podany adres jest nieprawidłowy. Sprawdź, czy wpisujesz go zgodnie z formatem przyklad@email.com.";
            break;
        case "name":
            if (!value) return "Wprowadź nazwę użytkownika dla swojego profilu.";
            break;
        case "day":
            if (!value || (value>31 || value<1)) return "Podaj swój dzień urodzenia, wpisując liczbę od 1 do 31.";
            break;
        case "month":
                if (!value) return "Wybierz miesiąc z listy.";
                break;
        case "year":
            if (!value) return "Podaj swój rok urodzenia składający się z czterech cyfr (np. 1990).";
            if (value<1900) return "Podaj swój rok urodzenia (nie wcześniej niż 1900 r.)";
            break;
        case "gender":
            if (!value) 
                return "Wybierz swoją płeć.";
            break;
        case "warunki":
            if (!checked) 
                return "Zaakceptuj Warunki, aby kontynuować.";
            break;
        default:
            return "";
    }
    return "";
  };
  