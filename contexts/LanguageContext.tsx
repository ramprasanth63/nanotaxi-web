// File: contexts/LanguageContext.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem("appLanguage");
        if (savedLang) setLang(savedLang);
      } catch (error) {
        console.log("Error loading language:", error);
      }
    };
    loadLanguage();
  }, []);

  const toggleLanguage = async () => {
    const newLang = lang === "en" ? "ta" : "en";
    setLang(newLang);
    try {
      await AsyncStorage.setItem("appLanguage", newLang);
    } catch (error) {
      console.log("Error saving language:", error);
    }
  };

  const setLanguage = async (language) => {
    setLang(language);
    try {
      await AsyncStorage.setItem("appLanguage", language);
    } catch (error) {
      console.log("Error saving language:", error);
    }
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook for easier usage
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};