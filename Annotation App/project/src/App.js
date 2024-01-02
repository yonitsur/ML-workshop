import React, {useEffect} from "react";
import LoginPage from "./LoginPage";
import AnnotationPage from "./AnnotationPage";



function App() {
  useEffect(() => {
    document.body.style.zoom = "60%"; // Adjust the value as needed

    return () => {
      document.body.style.zoom = ""; // Reset the zoom when the component unmounts
    };
  }, []);
  return (
    <div className="app">
      <LoginPage />
      <AnnotationPage />
    </div>

  );
}

export default App;
