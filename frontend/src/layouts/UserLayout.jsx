// User layout — fixed 320×1000 portable frame for end users
// a bit more codes than AdminLayout because we make the user UI more complex
// because it renders inside a portable/mobile-like frame (fixed width+controlled height_inner scrolling)
// while admin layout renders inside a full-viewport shell



export default function UserLayout({ children }) {
  return (
    <div className="user-layout">                                       {/* neutral backdrop on wide screens */}
      <div className="user-layout__frame" aria-label="Mobile support portal">
        <div className="user-layout__content">{children}</div>         {/* scrolls inside the frame, children is the UserDashboardPage component */}
      </div>
    </div>
  );
}


// user-layout: center the app on screen and provide backdrop
// user-layout__frame: create the phone-like frame size/border/shadow
// user-layout__content: inner flex/overflow area so page scroll behavior works correctly