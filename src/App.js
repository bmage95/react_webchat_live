import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { setNickname as setNicknameAction } from './actions';
import { createDirectLine } from 'botframework-webchat';
import { components } from 'botframework-webchat';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDC2te2NjXbSysM3Ux4aw_AIuVCX5dGA-E",
  authDomain: "chatroom-f5c58.firebaseapp.com",
  projectId: "chatroom-f5c58",
  storageBucket: "chatroom-f5c58.appspot.com",
  messagingSenderId: "226032790074",
  appId: "1:226032790074:web:06882dfe443d08b8572303",
  measurementId: "G-HY1STG3EEJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const App = () => {
  // State variables
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Whether the user is logged in or not
  const [nickname, setNicknameState] = useState(''); // The user's nickname
  const [message, setMessage] = useState(''); // The message the user is about to send
  const [messages, setMessages] = useState([]); // A list of all the messages in the chat
  const dispatch = useDispatch(); // A function to dispatch actions
  const storeNickname = useSelector(state => state.nickname); // The nickname from the reducer

  // Create a Direct Line instance
  const directLine = createDirectLine({ token: 'YOUR_BOT_DIRECT_LINE_SECRET' });

  // Effect hook that runs once when the component mounts
  useEffect(() => {
    // If the user has a nickname, set isLoggedIn to true and retrieve the messages
    if (storeNickname) {
      setIsLoggedIn(true);
      retrieveMessages();
    }
  }, [storeNickname]);

  // Function to handle the form submit for the nickname input
  const handleNicknameSubmit = async (event) => {
    // Prevent the default form submission
    event.preventDefault();
    // Add the user to the database
    await setDoc(doc(db, "users", nickname), { nickname }, { merge: true });
    // Dispatch the setNickname action to update the reducer
    dispatch(setNicknameAction(nickname));
    // Set isLoggedIn to true
    setIsLoggedIn(true);
  };

  // Function to handle the form submit for the message input
  const handleSubmit = async (event) => {
    // Prevent the default form submission
    event.preventDefault();
    // Create a new message object with the text and from properties
    const newMessage = { text: message, from: storeNickname };
    // Add the message to the messages array and update the state
    setMessages([...messages, newMessage]);
    // Add the message to the database
    await addDoc(collection(db, "messages"), newMessage);
    // Reset the message input
    setMessage('');
  };

  // Function to handle changes to the message input
  const handleInputChange = (event) => {
    // Update the message state with the new value
    setMessage(event.target.value);
  };

  // Function to handle changes to the nickname input
  const handleNicknameChange = (event) => {
    // Update the nickname state with the new value
    setNicknameState(event.target.value);
  };

  // Function to retrieve all the messages from the database and update the state
  const retrieveMessages = async () => {
    // Get all the messages from the database
    const querySnapshot = await getDocs(collection(db, "messages"));
    // Create an empty array to store the messages
    const messages = [];
    // Loop through the querySnapshot and add each message to the array
    querySnapshot.forEach(doc => {
      messages.push(doc.data());
    });
    // Update the messages state with the new array
    setMessages(messages);
  };

  // Function to delete the user's nickname from the database and reset the reducer
  const handleDeleteNickname = async () => {
    // Remove the user from the database
    await deleteDoc(doc(db, "users", storeNickname));
    // Dispatch the setNickname action to reset the reducer
    dispatch(setNicknameAction(''));
    // Set isLoggedIn to false
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    // If the user is not logged in, return the login form
    return (
      <div className="login">
        <form onSubmit={handleNicknameSubmit}>
          <input
            type="text"
            name="nickname"
            placeholder="Enter your nickname"
            value={nickname}
            onChange={handleNicknameChange}
            required
          />
          <button type="submit">Join Chat</button>
        </form>
      </div>
    );
  }

  // If the user is logged in, return the chat page
  return (
    <div className="chat">
      {/* The Web Chat component with the Direct Line instance and the user's ID */}
      <components.WebChat directLine={directLine} userID={storeNickname} />
      {/* The messages component that displays all the messages */}
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.from}:</strong> {msg.text}
          </div>
        ))}
      </div>
      {/* The message input form */}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter your message"
          value={message}
          onChange={handleInputChange}
          required
        />
        <button type="submit">Send</button>
      </form>
      {/* Logout button */}
      <button onClick={handleDeleteNickname}>Logout</button>
    </div>
  );
};

export default App;
