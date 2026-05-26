type Listener = () => void;

let _onOffline: Listener | null = null;
let _onOnline: Listener | null = null;
let _lastStatus: 'online' | 'offline' | 'unknown' = 'unknown';

export const networkEvents = {
  setOnOffline(cb: Listener) { _onOffline = cb; },
  setOnOnline(cb: Listener)  { _onOnline = cb; },
  clear() { _onOffline = null; _onOnline = null; },

  emitOffline() {
    if (_lastStatus !== 'offline') {
      _lastStatus = 'offline';
      _onOffline?.();
    }
  },
  emitOnline() {
    if (_lastStatus !== 'online') {
      _lastStatus = 'online';
      _onOnline?.();
    }
  },

  get isOnline() { return _lastStatus !== 'offline'; },
};
