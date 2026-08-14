import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// O servidor cria o nonce, grava o cookie __Host- e monta o redirect OAuth
// com o domínio público atual. Isso evita que um deploy Docker sem VITE_* de
// build falhe silenciosamente ao clicar em Sign in.
export const startLogin = () => {
  window.location.assign("/api/oauth/start");
};
