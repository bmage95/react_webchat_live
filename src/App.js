import React, { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { createBrowserHistory } from 'history';
import { configureStore, createAction, createReducer } from '@reduxjs/toolkit';
import createWebChat from 'botframework-webchat';
import { composeWithDevTools } from 'redux-devtools-extension';
import io from 'socket.io-client';

localStorage.clear();

const history = createBrowserHistory({ basename: '/' });

const initialState = { messages: [], nickname: '' };

const incomingActivity = createAction('DIRECT_LINE/INCOMING_ACTIVITY');
const sendMessage = createAction('DIRECT_LINE/SEND_MESSAGE');
const setNickname = createAction('SET_NICKNAME');

const rootReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(incomingActivity, (state, action) => {
      const activity = action.payload.activity;

      if (activity.type === 'message') {
        state.messages.push(activity);
        localStorage.setItem('messages', JSON.stringify(state.messages));
      }

      if (activity.type === 'typing') {
        console.log('User is typing');
      }

      if (activity.type === 'message' && activity.text) {
        console.log('User sent message', activity.text);
      }
    })
    .addCase(sendMessage, (state, action) => {
      state.messages.push({ text: action.payload.text, from: state.nickname });
      localStorage.setItem('messages', JSON.stringify(state.messages));
    })
    .addCase(setNickname, (state, action) => {
      state.nickname = action.payload;
      localStorage.setItem('nickname', state.nickname);
    });
});

const store = configureStore({
  reducer: rootReducer,
  devTools: composeWithDevTools()
});

function App() {
  const [message, setMessage] = useState('');
  const [nickname, setNicknameState] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const socket = useMemo(() => io('http://localhost:4000'), []);

  useEffect(() => {
    const storedMessages = JSON.parse(localStorage.getItem('messages'));
    const storedNickname = localStorage.getItem('nickname');
    if (storedMessages) setMessages(storedMessages);
    if (storedNickname) setNicknameState(storedNickname);
  }, []);

  useEffect(() => {
    socket.on('initialize', (messages) => {
      setMessages(messages);
    });

    socket.on('receiveMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  const handleLogin = (event) => {
    event.preventDefault();
    store.dispatch(setNickname(nickname));
    setIsLoggedIn(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const newMessage = { text: message, from: nickname };
    setMessages((prevMessages) => [...prevMessages, newMessage]); // Update local state
    socket.emit('sendMessage', newMessage);
    setMessage('');
  };
  

  const handleInputChange = (event) => {
    setMessage(event.target.value);
  };

  useEffect(() => {
    socket.on('initialize', (messages) => {
      setMessages(messages);
    });
  
    socket.on('receiveMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });
  
    return () => {
      socket.off('initialize');
      socket.off('receiveMessage');
      socket.disconnect();
    };
  }, [socket]);
  

  if (!isLoggedIn) {
    return (
      <div className="login">
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Enter your nickname"
            value={nickname}
            onChange={(e) => setNicknameState(e.target.value)}
            required
          />
          <button type="submit">Join Chat</button>
        </form>
      </div>
    );
  }

  return (
    <Provider store={store}>
      <Router history={history}>
        <Routes>
          <Route path="/" element={
            <div className="chatroom">
              <h1>Web Chat with Storage</h1>
              <div id="webchat" role="main" />
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  name="message"
                  placeholder="Type a message..."
                  onChange={handleInputChange}
                  value={message}
                />
                <button type="submit">Send</button>
              </form>
              <ul className="messages">
                {messages.map((msg, index) => (
                  <li key={index}>{msg.from ? `${msg.from}: ` : ''}{msg.text}</li>
                ))}
              </ul>
            </div>
          } />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
