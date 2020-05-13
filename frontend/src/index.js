import React from 'react';
import ReactDOM from 'react-dom';
import jwtDecode from 'jwt-decode';
import Root from './components/root';
import { setAuthToken } from './util/session_api_util';
import configureStore from './store/store';
import { login, logout, signup } from './actions/session_action';

document.addEventListener('DOMContentLoaded', () => {
  let store;

  if (localStorage.jwtToken) {
    setAuthToken(localStorage.jwtToken);
    const decodedUser = jwtDecode(localStorage.jwtToken);
    const preloadedState = {
      session: {
        isAuthenticated: true,
        user: decodedUser,
      }
    };

    store = configureStore(preloadedState);
    const currentTime = Date.now() / 1000;
    if (decodedUser.exp < currentTime) {
      store.dispatch(logout());
      window.location.href = '/login';
    }
  } else {
    store = configureStore();
  }

  // window.dispatch = store.dispatch;
  // window.getState = store.getState;
  // window.login = login;
  // window.logout = logout;
  // window.signup = signup;

  const root = document.getElementById('root');
  ReactDOM.render(<Root store={store} />, root)
});