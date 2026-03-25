const SESSION_KEY = "app_password";

export const setPassword = (p) => sessionStorage.setItem(SESSION_KEY, p);
export const getPassword = () => sessionStorage.getItem(SESSION_KEY) || "";
export const clearPassword = () => sessionStorage.removeItem(SESSION_KEY);

/** Returns headers object with the app password — merge into every fetch call. */
export const getAuthHeaders = () => ({ "X-App-Password": getPassword() });
