"use client"
import { User, LogIn, Moon, Sun } from "lucide-react"

const Header = ({ user, onSignIn, theme, onThemeToggle }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <div className="user-info">
            <User className="user-icon" />
            <span>{user ? user.displayName || user.email : "Anonymous"}</span>
          </div>
        </div>

        <div className="header-right">
          <button className="theme-toggle" onClick={onThemeToggle}>
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {!user && (
            <button className="sign-in-btn" onClick={onSignIn}>
              <LogIn size={16} />
              SIGN IN
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
