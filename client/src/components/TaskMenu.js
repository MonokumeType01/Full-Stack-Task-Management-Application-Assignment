import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";

export default function TaskMenu({ task, onViewTask, onEditTask, onDeleteTask }) {
  const [showMenu, setShowMenu] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);

  const toggleMenu = () => {
    const rect = buttonRef.current.getBoundingClientRect();
    setPosition({ x: rect.right, y: rect.bottom });
    setShowMenu(!showMenu);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!buttonRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          toggleMenu();
        }}
        className="text-xl text-gray-600 cursor-pointer"
      >
        ⋮
      </button>

      {showMenu &&
        ReactDOM.createPortal(
          <div
            className="absolute w-40 bg-white border border-gray-300 rounded-lg shadow-lg p-2 space-y-2 z-50"
            style={{
              position: "fixed",
              top: position.y,
              left: position.x,
            }}
          >
            <button
              onClick={() => {
                onEditTask(task);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              Edit
            </button>
            <button
              onClick={() => {
                onDeleteTask(task);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded"
            >
              Delete
            </button>
            <button
              onClick={() => {
                onViewTask(task);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              View
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
