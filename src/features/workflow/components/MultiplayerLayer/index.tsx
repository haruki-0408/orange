import React from "react";
import { FCX } from "@/types/types";
import { useOthers, useMyPresence } from "@liveblocks/react";
import { MultiplayerCursor } from "@/features/room/components/MultiplayerCursor";

/**
 * This file shows how to add basic live cursors on your product.
 */

const COLORS = [
  "#E57373",
  "#9575CD",
  "#4FC3F7",
  "#81C784",
  "#FFF176",
  "#FF8A65",
  "#F06292",
  "#7986CB",
];

export const MultiplayerLayer: FCX = ({children}) => {

  /**
   * useMyPresence returns the presence of the current user and a function to update it.
   * updateMyPresence is different than the setState function returned by the useState hook from React.
   * You don't need to pass the full presence object to update it.
   * See https://liveblocks.io/docs/api-reference/liveblocks-react#useMyPresence for more information
   */
  const [, updateMyPresence] = useMyPresence();

  /**
   * Return all the other users in the room and their presence (a cursor position in this case)
   */
  const others = useOthers();

  return (
  
    <div
      // className="w-screen"
      onPointerMove={(event) => {
        // Update the user cursor position on every pointer move
        updateMyPresence({
          cursor: {
            x: Math.round(event.clientX),
            y: Math.round(event.clientY),
          },
        });
      }}
      onPointerLeave={() =>
        // When the pointer goes out, set cursor to null
        updateMyPresence({
          cursor: null,
        })
      }
    >
      <div>
        {/* {cursor
          ? `${cursor.x} × ${cursor.y}`
          : "Move your cursor to broadcast its position to other people in the room."} */}
          {children}
      </div>

      {
        /**
         * Iterate over other users and display a cursor based on their presence
         */
        others.map(({ connectionId, presence }) => {
          if (presence.cursor === null) {
            return null;
          }

          return (
            <MultiplayerCursor
              key={`cursor-${connectionId}`}
              // connectionId is an integer that is incremented at every new connections
              // Assigning a color with a modulo makes sure that a specific user has the same colors on every client
              id={`cursor-${connectionId}`}
              name={`Guest${connectionId}`}
              color={COLORS[connectionId % COLORS.length]}
              x={presence.cursor.x}
              y={presence.cursor.y}
            />
          );
        })
      }
    </div>
  );
}
