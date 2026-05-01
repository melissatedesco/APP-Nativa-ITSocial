type AuthErrorCallback = () => void;
let _onAuthError: AuthErrorCallback | null = null;

export const authEvents = {
  setOnAuthError(cb: AuthErrorCallback) {
    _onAuthError = cb;
  },
  clearOnAuthError() {
    _onAuthError = null;
  },
  emitAuthError() {
    _onAuthError?.();
  },
};
