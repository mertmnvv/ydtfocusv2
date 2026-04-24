"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("ydt-theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("ydt-theme", newTheme);
  };

  return (
    <button 
      onClick={toggleTheme}
      className="theme-toggle-btn"
      title={theme === "dark" ? "Aydınlık Mod" : "Karanlık Mod"}
    >
      <i className={`fa-solid ${theme === "dark" ? "fa-sun" : "fa-moon"}`}></i>
    </button>
  );
}
