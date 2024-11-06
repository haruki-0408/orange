"use client"
import MultiplayerComponent from "./MultiplayerComponent";
import { Room } from "./Room";


export default function Home() {
  
  return (
    <Room
    /**
     * Initialize the cursor position to null when joining the room
     */
  >
    <MultiplayerComponent />
  </Room>

  );
}
