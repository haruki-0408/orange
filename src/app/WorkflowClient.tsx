"use client";
import { MultiplayerLayer } from "@/features/workflow/components/MultiplayerLayer";
import { Workflow } from "@/features/workflow/components";
import { Room } from "@/features/room/components";
import { Category, WorkflowHistory } from "@/features/workflow/types/types";
import { ThemeProvider } from "@/features/workflow/contexts/ThemeContext";

interface Props {
  initialCategories: Category[];
  initialHistories: WorkflowHistory[];
}

export default function WorkflowClient({ initialCategories, initialHistories }: Props) {
  return (
    // <Room>
      <div className="w-full">
        {/* <MultiplayerLayer> */}
          <ThemeProvider>
            <div className="relative max-w-[1280px] mx-auto">
              <Workflow
                categories={initialCategories}
                initialHistories={initialHistories}
              />
            </div>
          </ThemeProvider>
        {/* </MultiplayerLayer> */}
      </div>
    // </Room>
  );
} 