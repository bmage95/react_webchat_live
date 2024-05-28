// store.js
import { createStore, combineReducers } from 'redux';
import nicknameReducer from './reducers';

// Combine reducers if you have more than one reducer
const rootReducer = combineReducers({
  nickname: nicknameReducer,
  // Add other reducers here
});

const store = createStore(rootReducer);

export default store;
