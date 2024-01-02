
import React, { useState} from "react";

// import { useHistory } from "react-router-dom";

function LoginPage() {
//   const history = useHistory();
    const [user, setUser] = useState(null);



  const handleUserClick = (username) => {
    //change the color of the button to green
    setUser(username);

    window.location.href = `./${username}`;
  };

  function handleButtonStyle(username){
    if (window.location.href.split("/").pop() === username || username === user) {
        return {backgroundColor: "green"}
    }
}

  return (
    <div className="login-page">
      {/* <h1>Welcome to the Annotation App</h1> */}
      <button
        id="adi"
        className="userButtonStyle"
        onClick={() => handleUserClick("Adi")}
        style={handleButtonStyle("Adi")}
      >
        Adi
      </button>
      <button
        id="arik"
        className="userButtonStyle"
        onClick={() => handleUserClick("Arik")}
        style={handleButtonStyle("Arik")}
      >
        Arik
      </button>
      <button
        id="yoni"
        className="userButtonStyle"
        onClick={() => handleUserClick("Yoni")}
        style={handleButtonStyle("Yoni")}
      >
        Yoni
      </button>
      <button
        id="gezer"
        className="userButtonStyle"
        onClick={() => handleUserClick("Gezer")}
        style={handleButtonStyle("Gezer")}
      >
        Gezer
      </button>
    </div>
  );
}

export default LoginPage;
