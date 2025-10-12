// side bar that should be on the right of the page
// this is the root component for the chat side bar UI
"use client"
import ChatInput from "./ChatInput";
import ChatMessages from "./ChatMessages";

export default function ChatSideBar() {
  return (
    <div className="h-screen w-80 border-l flex flex-col relative">
      {/* Chat Messages - takes remaining space */}
      <ChatMessages />

      {/* Chat Input - fixed at bottom */}
      <div className="w-full">
        <ChatInput />
      </div>
    </div>
  )
}
