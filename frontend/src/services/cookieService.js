const setCookie = (name, value, days = 1) => {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);
  
  const cookie = `${name}=${value}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Strict`;
  document.cookie = cookie;
};

const getCookie = (name) => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.split('=').map(c => c.trim());
    if (cookieName === name) {
      return cookieValue;
    }
  }
  return null;
};

const removeCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
};

export { setCookie, getCookie, removeCookie }; 