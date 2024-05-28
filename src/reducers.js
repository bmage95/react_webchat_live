// reducer.js
import { SET_NICKNAME } from './actions';

const initialState = {
  nickname: '',
};

const nicknameReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_NICKNAME:
      return {
        ...state,
        nickname: action.payload,
      };
    default:
      return state;
  }
};

export default nicknameReducer;
